import type { Server, Socket } from 'socket.io';
import * as parkingService from '../../services/parkingService.js';

let ioInstance: Server | null = null;

/**
 * Initialize Socket.io event handlers.
 * Called once at server startup with the io instance.
 */
export const initSocketHandlers = (io: Server) => {
  ioInstance = io;

  io.on('connection', async (socket: Socket) => {
    console.log(`[Socket.io] Client connected: ${socket.id}`);

    // Send the full slot list so the 3D model can render initial state
    try {
      const slots = await parkingService.getDashboardData();
      socket.emit('dashboard:init', slots);
    } catch (error) {
      console.error('[Socket.io] Failed to send dashboard data:', error);
    }

    socket.on('disconnect', () => {
      console.log(`[Socket.io] Client disconnected: ${socket.id}`);
    });
  });
};

/**
 * Emit a slot status change to all connected clients.
 * Used by consumers / services after any slot transition.
 */
export const emitSlotUpdate = (data: {
  slot_id: string;
  status: string;
  slot_type?: string;
  session?: {
    session_id: string;
    registration?: string | null;
    province?: string | null;
  } | null;
}) => {
  ioInstance?.emit('slot:update', data);
};

/**
 * Emit when a session is closed (car exits).
 */
export const emitSessionClosed = (data: {
  session_id: string;
  slot_id: string;
  total_fee: number;
  duration_minutes: number;
}) => {
  ioInstance?.emit('session:closed', data);
};
