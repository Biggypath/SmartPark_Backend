import { getChannel, QUEUES } from './connection.js';
import * as parkingService from '../../services/parkingService.js';
import { sendEntryAck, sendExitAck, sendBarrierCommand } from './producer.js';
import { emitSlotUpdate, emitSessionClosed } from '../socket/socketHandler.js';
import type { ConsumeMessage } from 'amqplib';
import type { OcrEntryEvent, OcrExitEvent } from '../../types/index.js';

/**
 * Consumer: OCR Entry Events
 * Triggered when the ThaiLicensePlateOCR server reads a plate at the entrance.
 */
export const startOcrEntryConsumer = async () => {
  const channel = getChannel();
  const queue = QUEUES.OCR_ENTRY;

  console.log(`Listening on queue: ${queue}`);

  channel.consume(queue, async (msg: ConsumeMessage | null) => {
    if (!msg) return;
    try {
      const event: OcrEntryEvent = JSON.parse(msg.content.toString());
      console.log(`[OCR Entry] ${event.registration} (${event.province}) at lot ${event.lotId}`);

      const result = await parkingService.handleOcrEntry(event.registration, event.province, event.lotId);

      if (result.slot) {
        // Notify frontend via Socket.io — slot is now OCCUPIED
        emitSlotUpdate(event.lotId, {
          slot_id: result.slot.slot_id,
          status: 'OCCUPIED',
          session: {
            session_id: result.session.session_id,
            registration: event.registration,
            province: event.province,
          },
        });
      }

      // Send ACK back to ThaiLicensePlateOCR
      await sendEntryAck({
        camId: event.camId,
        lotId: event.lotId,
        registration: event.registration,
        province: event.province,
        status: 'ALLOWED',
        slotId: result.slot?.slot_id,
      });

      // Send barrier command to ESP32 via MQTT
      if (event.camId) {
        await sendBarrierCommand({
          camId: event.camId,
          lotId: event.lotId,
          command: 'OPEN',
        });
      }

      channel.ack(msg);
    } catch (error) {
      console.error('[OCR Entry] Error:', error);

      // Try to parse event for rejection ACK
      try {
        const event: OcrEntryEvent = JSON.parse(msg.content.toString());
        await sendEntryAck({
          camId: event.camId,
          lotId: event.lotId,
          registration: event.registration,
          province: event.province,
          status: 'REJECTED',
          reason: error instanceof Error ? error.message : 'Unknown error',
        });
      } catch { /* ignore parse errors */ }

      channel.ack(msg);
    }
  });
};

/**
 * Consumer: OCR Exit Events
 * Triggered when the ThaiLicensePlateOCR server reads a plate at the exit.
 */
export const startOcrExitConsumer = async () => {
  const channel = getChannel();
  const queue = QUEUES.OCR_EXIT;

  console.log(`Listening on queue: ${queue}`);

  channel.consume(queue, async (msg: ConsumeMessage | null) => {
    if (!msg) return;
    try {
      const event: OcrExitEvent = JSON.parse(msg.content.toString());
      console.log(`[OCR Exit] ${event.registration} (${event.province}) at lot ${event.lotId}`);

      const result = await parkingService.handleOcrExit(event.registration, event.province, event.lotId);

      if (result.slotId) {
        emitSlotUpdate(result.lotId, {
          slot_id: result.slotId,
          status: 'FREE',
        });
      }

      emitSessionClosed(result.lotId, {
        session_id: result.sessionId,
        slot_id: result.slotId ?? '',
        total_fee: result.totalFee,
        duration_minutes: result.durationMinutes,
      });

      // Send ACK back to ThaiLicensePlateOCR
      await sendExitAck({
        camId: event.camId,
        lotId: event.lotId,
        registration: event.registration,
        province: event.province,
        status: 'OK',
        totalFee: result.totalFee,
        durationMinutes: result.durationMinutes,
      });

      // Send barrier command to ESP32 via MQTT
      if (event.camId) {
        await sendBarrierCommand({
          camId: event.camId,
          lotId: event.lotId,
          command: 'OPEN',
        });
      }

      channel.ack(msg);
    } catch (error) {
      console.error('[OCR Exit] Error:', error);

      // Try to parse event for error ACK
      try {
        const event: OcrExitEvent = JSON.parse(msg.content.toString());
        await sendExitAck({
          camId: event.camId,
          lotId: event.lotId,
          registration: event.registration,
          province: event.province,
          status: 'ERROR',
          reason: error instanceof Error ? error.message : 'Unknown error',
        });
      } catch { /* ignore parse errors */ }

      channel.ack(msg);
    }
  });
};

/**
 * Start all consumers.
 */
export const startAllConsumers = async () => {
  await startOcrEntryConsumer();
  await startOcrExitConsumer();
  console.log('All RabbitMQ consumers started.');
};