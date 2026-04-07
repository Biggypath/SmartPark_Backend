import 'dotenv/config';
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

// Import RabbitMQ
import { connectRabbitMQ } from './infrastructure/rabbitmq/connection.js';
import { startAllConsumers } from './infrastructure/rabbitmq/consumer.js';

// Import routes
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import parkingRoutes from './routes/parkingRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import { initSocketHandlers } from './infrastructure/socket/socketHandler.js';

// CORS: Allow the frontend origin (set CORS_ORIGIN in production)
// Accepts a comma-separated list of origins, or "*" for all.
const rawOrigin = process.env.CORS_ORIGIN || '*';
const corsOrigin = rawOrigin === '*' ? '*' : rawOrigin.split(',').map(o => o.trim());

const app = express();
const server = http.createServer(app);

export const io = new Server(server, {
  cors: { origin: corsOrigin, credentials: corsOrigin !== '*' }
});

// Initialize WebSocket handlers
initSocketHandlers(io);

app.use(cors({ origin: corsOrigin, credentials: corsOrigin !== '*' }));
app.use(express.json());

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/parking', parkingRoutes);
app.use('/api/admin', adminRoutes);

const PORT = process.env.PORT || 3000;

// Initialize Server
const startServer = async () => {
  // // 1. Connect to RabbitMQ
  await connectRabbitMQ();

  // // 2. Start all event consumers (OCR entry, OCR exit)
  await startAllConsumers();

  // 3. Start HTTP Server — bind 0.0.0.0 so Docker can expose the port
  server.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`SmartPark Backend running on port ${PORT}`);
  });
};

startServer();