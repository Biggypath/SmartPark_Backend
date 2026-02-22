import client from 'amqplib';
import type { Connection, Channel } from 'amqplib';

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost';

let connection: Connection | null = null;
let channel: Channel | null = null;

export const connectRabbitMQ = async (): Promise<Channel> => {
  try {
    connection = (await client.connect(RABBITMQ_URL)) as unknown as Connection;
    channel = (await (connection as any).createChannel()) as Channel;
    
    console.log('Connected to RabbitMQ');
    
    // Define Queues (Idempotent: creates them if they don't exist)
    await channel.assertQueue('sensor_data', { durable: true });   // Incoming Data
    await channel.assertQueue('gate_commands', { durable: true }); // Outgoing Commands
    
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