import client from 'amqplib';
import type { Connection, Channel } from 'amqplib';

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost';

// Queue names
export const QUEUES = {
  OCR_ENTRY: 'ocr.entry.events',
  OCR_EXIT: 'ocr.exit.events',
  OCR_ENTRY_ACK: 'ocr.entry.ack',
  OCR_EXIT_ACK: 'ocr.exit.ack',
} as const;

let connection: Connection | null = null;
let channel: Channel | null = null;

export const connectRabbitMQ = async (): Promise<Channel> => {
  try {
    connection = (await client.connect(RABBITMQ_URL)) as unknown as Connection;
    channel = (await (connection as any).createChannel()) as Channel;

    console.log('Connected to RabbitMQ');

    // Assert all queues (idempotent)
    await channel.assertQueue(QUEUES.OCR_ENTRY, { durable: true });
    await channel.assertQueue(QUEUES.OCR_EXIT, { durable: true });
    await channel.assertQueue(QUEUES.OCR_ENTRY_ACK, { durable: true });
    await channel.assertQueue(QUEUES.OCR_EXIT_ACK, { durable: true });

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