import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import parkingRoutes from './routes/parkingRoutes.js';

// Import RabbitMQ
import { connectRabbitMQ } from './infrastructure/rabbitmq/connection.js';
import { startSensorConsumer } from './infrastructure/rabbitmq/consumer.js';

const app = express();
const server = http.createServer(app);

export const io = new Server(server, {
  cors: { origin: "*" } // Allow React Frontend
});

app.use(cors());
app.use(express.json());
app.use('/api', parkingRoutes);

const PORT = process.env.PORT || 3000;

// Initialize Server
const startServer = async () => {
  // 1. Connect to Database (Prisma connects automatically on first query)
  
  // 2. Connect to RabbitMQ
  // await connectRabbitMQ();
  
  // // 3. Start Listening for IoT Data
  // startSensorConsumer();

  // 4. Start HTTP Server
  server.listen(PORT, () => {
    console.log(`🚀 Main Backend running on port ${PORT}`);
  });
};

startServer();