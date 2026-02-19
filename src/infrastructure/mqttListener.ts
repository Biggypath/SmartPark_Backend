import { mqttClient } from '../config/mqtt.js';
import { prisma } from '../config/db.js';
import * as parkingService from '../services/parkingService.js';

export const initMQTT = () => {
  mqttClient.on('connect', () => {
    console.log('MQTT Connected');
    mqttClient.subscribe('parking/slot/+/status'); 
  });

  mqttClient.on('message', async (topic, message) => {
    try {
      // Topic format: parking/slot/{id}/status
      const parts = topic.split('/');
      const slotId = parts[2];
      const status = message.toString(); // "OCCUPIED" or "FREE"

      console.log(`Sensor Update: ${slotId} -> ${status}`);

      // 1. Log to DB (Requirement: Sensor Logs)
      await prisma.sensorLog.create({
        data: {
          slot_id: slotId,
          event_type: status === 'OCCUPIED' ? 'ENTRY' : 'EXIT',
          raw_data: status
        }
      });

      // 2. Trigger Business Logic
      if (status === 'OCCUPIED') {
          await parkingService.processEntryEvent(slotId!);
      }
      
    } catch (err) {
      console.error('MQTT Error:', err);
    }
  });
};