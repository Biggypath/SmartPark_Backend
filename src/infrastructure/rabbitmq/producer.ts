import { getChannel, QUEUES, MQTT_EXCHANGE } from './connection.js';
import type { OcrEntryAck, OcrExitAck, BarrierCommand } from '../../types/index.js';

/**
 * Send entry ACK back to ThaiLicensePlateOCR server (via AMQP queue).
 */
export const sendEntryAck = async (ack: OcrEntryAck) => {
  const channel = getChannel();
  const message = JSON.stringify({ ...ack, timestamp: new Date().toISOString() });
  channel.sendToQueue(QUEUES.OCR_ENTRY_ACK, Buffer.from(message), { persistent: true });
  console.log(`[Entry ACK] ${ack.status} for ${ack.registration} at lot ${ack.lotId}`);
};

/**
 * Send exit ACK back to ThaiLicensePlateOCR server (via AMQP queue).
 */
export const sendExitAck = async (ack: OcrExitAck) => {
  const channel = getChannel();
  const message = JSON.stringify({ ...ack, timestamp: new Date().toISOString() });
  channel.sendToQueue(QUEUES.OCR_EXIT_ACK, Buffer.from(message), { persistent: true });
  console.log(`[Exit ACK] ${ack.status} for ${ack.registration} at lot ${ack.lotId}`);
};

/**
 * Send a barrier command to an ESP32 device via MQTT (through amq.topic exchange).
 *
 * The backend publishes to AMQP routing key:  barrier.commands.<camId>
 * The ESP32 subscribes to MQTT topic:         barrier/commands/<camId>
 *
 * RabbitMQ's MQTT plugin automatically bridges the two.
 */
export const sendBarrierCommand = async (cmd: BarrierCommand) => {
  const channel = getChannel();
  const routingKey = `barrier.commands.${cmd.camId}`;
  const message = JSON.stringify({ ...cmd, timestamp: new Date().toISOString() });
  channel.publish(MQTT_EXCHANGE, routingKey, Buffer.from(message));
  console.log(`[Barrier CMD] ${cmd.command} → ${cmd.camId} (lot: ${cmd.lotId})`);
};