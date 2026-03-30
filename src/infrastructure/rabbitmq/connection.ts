import client from 'amqplib';
import type { Connection, Channel } from 'amqplib';

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost';

// Queue names
export const QUEUES = {
  LPR_ENTRY: 'lpr.entry.events',
  SENSOR_SLOT: 'sensor.slot.events',
  GATE_COMMANDS: 'gate.commands'
} as const;

let connection: Connection | null = null;
let channel: Channel | null = null;

export const connectRabbitMQ = async (): Promise<Channel> => {
  try {
    connection = (await client.connect(RABBITMQ_URL)) as unknown as Connection;
    channel = (await (connection as any).createChannel()) as Channel;

    console.log('Connected to RabbitMQ');

    // Assert all queues (idempotent)
    await channel.assertQueue(QUEUES.LPR_ENTRY, { durable: true });
    await channel.assertQueue(QUEUES.SENSOR_SLOT, { durable: true });
    await channel.assertQueue(QUEUES.GATE_COMMANDS, { durable: true });

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