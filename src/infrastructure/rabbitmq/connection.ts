import client from 'amqplib';
import type { Connection, Channel } from 'amqplib';

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost';

// AMQP queue names (backend ↔ OCR server)
export const QUEUES = {
  OCR_ENTRY: 'ocr.entry.events',
  OCR_EXIT: 'ocr.exit.events',
  OCR_ENTRY_ACK: 'ocr.entry.ack',
  OCR_EXIT_ACK: 'ocr.exit.ack',
  BARRIER_STATUS: 'barrier.status',
} as const;

// Topic exchange used by the MQTT plugin.
// RabbitMQ's MQTT plugin maps MQTT topics to this exchange automatically.
// MQTT topic separators '/' are converted to AMQP routing key separators '.'
//   e.g. MQTT topic  "barrier/commands/cam-01"  ↔  routing key "barrier.commands.cam-01"
export const MQTT_EXCHANGE = 'amq.topic';

let connection: Connection | null = null;
let channel: Channel | null = null;

export const connectRabbitMQ = async (): Promise<Channel> => {
  try {
    connection = (await client.connect(RABBITMQ_URL)) as unknown as Connection;
    channel = (await (connection as any).createChannel()) as Channel;

    console.log('Connected to RabbitMQ');

    // Assert AMQP queues (for backend ↔ OCR server communication)
    await channel.assertQueue(QUEUES.OCR_ENTRY, { durable: true });
    await channel.assertQueue(QUEUES.OCR_EXIT, { durable: true });
    await channel.assertQueue(QUEUES.OCR_ENTRY_ACK, { durable: true });
    await channel.assertQueue(QUEUES.OCR_EXIT_ACK, { durable: true });

    // amq.topic is a built-in exchange — assert it to confirm it exists.
    // ESP32 devices connect via MQTT and subscribe to topics on this exchange.
    await channel.assertExchange(MQTT_EXCHANGE, 'topic', { durable: true });
    console.log('MQTT topic exchange (amq.topic) ready for ESP32 barrier commands');

    // Bind barrier status queue to receive ESP32 status messages via MQTT.
    // ESP32 publishes to MQTT topic: barrier/status/<camId>
    // RabbitMQ converts to routing key: barrier.status.<camId>
    await channel.assertQueue(QUEUES.BARRIER_STATUS, { durable: true });
    await channel.bindQueue(QUEUES.BARRIER_STATUS, MQTT_EXCHANGE, 'barrier.status.*');
    console.log('Barrier status queue bound to amq.topic (barrier.status.*)');

    return channel;
  } catch (error) {
    console.error('RabbitMQ Connection Failed:', error);
    process.exit(1);
  }
};

export const getChannel = (): Channel => {
  if (!channel) throw new Error('RabbitMQ channel not initialized');
  return channel;
};