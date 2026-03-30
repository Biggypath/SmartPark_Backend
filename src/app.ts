import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

// Import RabbitMQ
import { connectRabbitMQ } from './infrastructure/rabbitmq/connection.js';
import { startAllConsumers } from './infrastructure/rabbitmq/consumer.js';

const app = express();
const server = http.createServer(app);

export const io = new Server(server, {
  cors: { origin: "*" }
});

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 3000;

// Initialize Server
const startServer = async () => {
  // 1. Connect to RabbitMQ
  await connectRabbitMQ();

  // 2. Start all event consumers (LPR entry, sensor, LPR exit)
  await startAllConsumers();

  // 3. Start HTTP Server
  server.listen(PORT, () => {
    console.log(`SmartPark Backend running on port ${PORT}`);
  });
};

startServer();