import { getChannel, QUEUES } from './connection.js';
import * as parkingService from '../../services/parkingService.js';
import { emitSlotUpdate, emitSessionClosed } from '../socket/socketHandler.js';
import type { ConsumeMessage } from 'amqplib';
import type { LprEntryEvent, SensorSlotEvent } from '../../types/index.js';

/**
 * Consumer: LPR Entry Events
 * Triggered when a camera reads a plate at the entrance.
 */
export const startLprEntryConsumer = async () => {
  const channel = getChannel();
  const queue = QUEUES.LPR_ENTRY;

  console.log(`Listening on queue: ${queue}`);

  channel.consume(queue, async (msg: ConsumeMessage | null) => {
    if (!msg) return;
    try {
      const event: LprEntryEvent = JSON.parse(msg.content.toString());
      console.log(`[LPR Entry] ${event.registration} (${event.province})`);

      const result = await parkingService.handleLprEntry(event.registration, event.province);

      // Notify frontend via Socket.io
      emitSlotUpdate({
        slot_id: result.slot.slot_id,
        status: 'ASSIGNED',
        slot_type: result.slot.slot_type,
        session: {
          session_id: result.session.session_id,
          registration: event.registration,
          province: event.province,
        },
      });

      channel.ack(msg);
    } catch (error) {
      console.error('[LPR Entry] Error:', error);
      channel.ack(msg);
    }
  });
};

/**
 * Consumer: Sensor Slot Events (ESP32 IR sensor)
 * Triggered when the physical sensor detects a car has parked.
 */
export const startSensorConsumer = async () => {
  const channel = getChannel();
  const queue = QUEUES.SENSOR_SLOT;

  console.log(`Listening on queue: ${queue}`);

  channel.consume(queue, async (msg: ConsumeMessage | null) => {
    if (!msg) return;
    try {
      const event: SensorSlotEvent = JSON.parse(msg.content.toString());
      console.log(`[Sensor] ${event.slotId} → ${event.status}`);

      if (event.status === 'OCCUPIED') {
        await parkingService.handleSlotOccupation(event.slotId, event.rawData);

        emitSlotUpdate({
          slot_id: event.slotId,
          status: 'OCCUPIED',
        });
      } else if (event.status === 'FREE') {
        const result = await parkingService.handleSlotExit(event.slotId, event.rawData);

        emitSlotUpdate({
          slot_id: result.slotId,
          status: 'FREE',
        });
        emitSessionClosed({
          session_id: result.sessionId,
          slot_id: result.slotId,
          total_fee: result.totalFee,
          duration_minutes: result.durationMinutes,
        });
      }

      channel.ack(msg);
    } catch (error) {
      console.error('[Sensor] Error:', error);
      channel.ack(msg);
    }
  });
};

/**
 * Start all consumers.
 */
export const startAllConsumers = async () => {
  await startLprEntryConsumer();
  await startSensorConsumer();
  console.log('All RabbitMQ consumers started.');
};