jest.mock('../../../src/services/parkingService.js', () => ({
  getDashboardData: jest.fn(),
}));

import { initSocketHandlers, emitSlotUpdate, emitSessionClosed } from '../../../src/infrastructure/socket/socketHandler.js';
import * as parkingService from '../../../src/services/parkingService.js';

const mockParkingService = parkingService as jest.Mocked<typeof parkingService>;

describe('socketHandler', () => {
  let mockIo: any;
  let mockSocket: any;
  let connectionCallback: (socket: any) => void;

  beforeEach(() => {
    jest.clearAllMocks();

    mockSocket = {
      id: 'test-socket-id',
      emit: jest.fn(),
      on: jest.fn(),
    };

    mockIo = {
      on: jest.fn((event: string, cb: any) => {
        if (event === 'connection') connectionCallback = cb;
      }),
      emit: jest.fn(),
    };
  });

  describe('initSocketHandlers', () => {
    it('should register a connection handler', () => {
      initSocketHandlers(mockIo);

      expect(mockIo.on).toHaveBeenCalledWith('connection', expect.any(Function));
    });

    it('should send dashboard data to the client on connect', async () => {
      const mockSlots = [
        { slot_id: 'VIP-A1', status: 'OCCUPIED', slot_type: 'VIP' },
        { slot_id: 'GEN-A1', status: 'FREE', slot_type: 'GENERAL' },
      ];
      mockParkingService.getDashboardData.mockResolvedValue(mockSlots as any);

      initSocketHandlers(mockIo);
      await connectionCallback(mockSocket);

      expect(mockParkingService.getDashboardData).toHaveBeenCalled();
      expect(mockSocket.emit).toHaveBeenCalledWith('dashboard:init', mockSlots);
    });

    it('should register a disconnect handler', async () => {
      mockParkingService.getDashboardData.mockResolvedValue([]);

      initSocketHandlers(mockIo);
      await connectionCallback(mockSocket);

      expect(mockSocket.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
    });

    it('should not crash if getDashboardData fails', async () => {
      mockParkingService.getDashboardData.mockRejectedValue(new Error('DB down'));

      initSocketHandlers(mockIo);

      await expect(connectionCallback(mockSocket)).resolves.not.toThrow();
      expect(mockSocket.emit).not.toHaveBeenCalledWith('dashboard:init', expect.anything());
    });
  });

  describe('emitSlotUpdate', () => {
    it('should emit slot:update to all clients', () => {
      initSocketHandlers(mockIo);

      emitSlotUpdate({ slot_id: 'VIP-A1', status: 'OCCUPIED' });

      expect(mockIo.emit).toHaveBeenCalledWith('slot:update', {
        slot_id: 'VIP-A1',
        status: 'OCCUPIED',
      });
    });

    it('should include optional fields when provided', () => {
      initSocketHandlers(mockIo);

      emitSlotUpdate({
        slot_id: 'GEN-B1',
        status: 'ASSIGNED',
        slot_type: 'GENERAL',
        session: { session_id: 'sess-1', registration: '1กข 1234', province: 'กรุงเทพมหานคร' },
      });

      expect(mockIo.emit).toHaveBeenCalledWith('slot:update', {
        slot_id: 'GEN-B1',
        status: 'ASSIGNED',
        slot_type: 'GENERAL',
        session: { session_id: 'sess-1', registration: '1กข 1234', province: 'กรุงเทพมหานคร' },
      });
    });
  });

  describe('emitSessionClosed', () => {
    it('should emit session:closed to all clients', () => {
      initSocketHandlers(mockIo);

      emitSessionClosed({
        session_id: 'sess-1',
        slot_id: 'VIP-A1',
        total_fee: 40,
        duration_minutes: 120,
      });

      expect(mockIo.emit).toHaveBeenCalledWith('session:closed', {
        session_id: 'sess-1',
        slot_id: 'VIP-A1',
        total_fee: 40,
        duration_minutes: 120,
      });
    });
  });
});
