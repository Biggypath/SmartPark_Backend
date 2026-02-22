import { getChannel } from './connection.js';
import { prisma } from '../../config/db.js';
import { io } from '../../app.js';
import * as parkingService from '../../services/parkingService.js';
import type { ConsumeMessage } from 'amqplib';

interface SensorMessage {
  slotId: string;
  status: 'OCCUPIED' | 'FREE';
  timestamp: string;
}

export const startSensorConsumer = async () => {
  const channel = getChannel();
  const queue = 'sensor_data';

  console.log(`👂 Listening for messages on queue: ${queue}`);

  channel.consume(queue, async (msg: ConsumeMessage | null) => {
    if (msg) {
      try {
        // 1. Parse Data
        const content: SensorMessage = JSON.parse(msg.content.toString());
        console.log(`📦 Received: ${content.slotId} is ${content.status}`);

        // 2. Business Logic (Check reservations, etc.)
        // We reuse the service logic we wrote earlier!
        if (content.status === 'OCCUPIED') {
           await parkingService.processEntryEvent(content.slotId);
        } else {
           // Handle exit logic if needed
           await prisma.parkingSlot.update({
             where: { slot_id: content.slotId },
             data: { status: 'FREE' }
           });
        }

        // 3. Real-time Frontend Update (Socket.io)
        io.emit('slot-update', {
          slot_id: content.slotId,
          status: content.status
        });

        // 4. Acknowledge Message (Tell RabbitMQ we finished processing)
        channel.ack(msg);

      } catch (error) {
        console.error('Error processing message:', error);
        // Optional: channel.nack(msg) if you want to retry
        channel.ack(msg); // Ack anyway to prevent queue clogging for bad JSON
      }
    }
  });
};