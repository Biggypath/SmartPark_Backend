import { getChannel, QUEUES } from './connection.js';
import type { OcrEntryAck, OcrExitAck } from '../../types/index.js';

/**
 * Send entry ACK back to ThaiLicensePlateOCR server.
 */
export const sendEntryAck = async (ack: OcrEntryAck) => {
  const channel = getChannel();
  const message = JSON.stringify({ ...ack, timestamp: new Date().toISOString() });
  channel.sendToQueue(QUEUES.OCR_ENTRY_ACK, Buffer.from(message), { persistent: true });
  console.log(`[Entry ACK] ${ack.status} for ${ack.registration} at lot ${ack.lotId}`);
};

/**
 * Send exit ACK back to ThaiLicensePlateOCR server.
 */
export const sendExitAck = async (ack: OcrExitAck) => {
  const channel = getChannel();
  const message = JSON.stringify({ ...ack, timestamp: new Date().toISOString() });
  channel.sendToQueue(QUEUES.OCR_EXIT_ACK, Buffer.from(message), { persistent: true });
  console.log(`[Exit ACK] ${ack.status} for ${ack.registration} at lot ${ack.lotId}`);
};