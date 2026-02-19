import express from 'express';
import cors from 'cors';
import parkingRoutes from './routes/parkingRoutes.js';
import { initMQTT } from './infrastructure/mqttListener.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', parkingRoutes);

// Start IoT Listener
initMQTT();

// Start Server
app.listen(PORT, () => {
  console.log(`running on port ${PORT}`);
});