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

    // Client joins a parking lot room to receive updates for that lot only
    socket.on('join:lot', async (lotId: string) => {
      // Leave all previous lot rooms
      for (const room of socket.rooms) {
        if (room.startsWith('lot:')) {
          socket.leave(room);
        }
      }
      socket.join(`lot:${lotId}`);
      console.log(`[Socket.io] ${socket.id} joined room lot:${lotId}`);

      // Send the lot's slot data so the 3D model can render
      try {
        const slots = await parkingService.getDashboardByLot(lotId);
        socket.emit('dashboard:init', slots);
      } catch (error) {
        console.error('[Socket.io] Failed to send lot dashboard data:', error);
      }
    });

    socket.on('leave:lot', (lotId: string) => {
      socket.leave(`lot:${lotId}`);
      console.log(`[Socket.io] ${socket.id} left room lot:${lotId}`);
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.io] Client disconnected: ${socket.id}`);
    });
  });
};

/**
 * Emit a slot status change to clients watching the specific lot.
 */
export const emitSlotUpdate = (lotId: string, data: {
  slot_id: string;
  status: string;
  session?: {
    session_id: string;
    registration?: string | null;
    province?: string | null;
  } | null;
}) => {
  ioInstance?.to(`lot:${lotId}`).emit('slot:update', data);
};

/**
 * Emit when a session is closed (car exits) to clients watching the specific lot.
 */
export const emitSessionClosed = (lotId: string, data: {
  session_id: string;
  slot_id: string;
  total_fee: number;
  duration_minutes: number;
}) => {
  ioInstance?.to(`lot:${lotId}`).emit('session:closed', data);
};
