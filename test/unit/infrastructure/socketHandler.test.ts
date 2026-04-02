jest.mock('../../../src/services/parkingService.js', () => ({
  getDashboardByLot: jest.fn(),
}));

import { initSocketHandlers, emitSlotUpdate, emitSessionClosed } from '../../../src/infrastructure/socket/socketHandler.js';
import * as parkingService from '../../../src/services/parkingService.js';

const mockParkingService = parkingService as jest.Mocked<typeof parkingService>;

describe('socketHandler', () => {
  let mockIo: any;
  let mockSocket: any;
  let mockRoomEmit: any;
  let connectionCallback: (socket: any) => void;
  let socketEventHandlers: Record<string, Function | undefined>;

  beforeEach(() => {
    jest.clearAllMocks();

    socketEventHandlers = {};

    mockSocket = {
      id: 'test-socket-id',
      emit: jest.fn(),
      on: jest.fn((event: string, cb: any) => {
        socketEventHandlers[event] = cb;
      }),
      join: jest.fn(),
      leave: jest.fn(),
      rooms: new Set(['test-socket-id']),
    };

    mockRoomEmit = jest.fn();

    mockIo = {
      on: jest.fn((event: string, cb: any) => {
        if (event === 'connection') connectionCallback = cb;
      }),
      to: jest.fn().mockReturnValue({ emit: mockRoomEmit }),
    };
  });

  describe('initSocketHandlers', () => {
    it('should register a connection handler', () => {
      initSocketHandlers(mockIo);

      expect(mockIo.on).toHaveBeenCalledWith('connection', expect.any(Function));
    });

    it('should register join:lot, leave:lot, and disconnect handlers on connect', async () => {
      initSocketHandlers(mockIo);
      await connectionCallback(mockSocket);

      expect(mockSocket.on).toHaveBeenCalledWith('join:lot', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('leave:lot', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
    });

    it('should join lot room and send dashboard data on join:lot', async () => {
      const mockSlots = [
        { slot_id: 'A1', status: 'OCCUPIED', lot_id: 'lot-1' },
        { slot_id: 'B1', status: 'FREE', lot_id: 'lot-1' },
      ];
      mockParkingService.getDashboardByLot.mockResolvedValue(mockSlots as any);

      initSocketHandlers(mockIo);
      await connectionCallback(mockSocket);
      await socketEventHandlers['join:lot']!('lot-1');

      expect(mockSocket.join).toHaveBeenCalledWith('lot:lot-1');
      expect(mockParkingService.getDashboardByLot).toHaveBeenCalledWith('lot-1');
      expect(mockSocket.emit).toHaveBeenCalledWith('dashboard:init', mockSlots);
    });

    it('should leave previous lot room when joining a new one', async () => {
      mockSocket.rooms = new Set(['test-socket-id', 'lot:lot-old']);
      mockParkingService.getDashboardByLot.mockResolvedValue([]);

      initSocketHandlers(mockIo);
      await connectionCallback(mockSocket);
      await socketEventHandlers['join:lot']!('lot-new');

      expect(mockSocket.leave).toHaveBeenCalledWith('lot:lot-old');
      expect(mockSocket.join).toHaveBeenCalledWith('lot:lot-new');
    });

    it('should leave lot room on leave:lot', async () => {
      initSocketHandlers(mockIo);
      await connectionCallback(mockSocket);
      socketEventHandlers['leave:lot']!('lot-1');

      expect(mockSocket.leave).toHaveBeenCalledWith('lot:lot-1');
    });

    it('should not crash if getDashboardByLot fails', async () => {
      mockParkingService.getDashboardByLot.mockRejectedValue(new Error('DB down'));

      initSocketHandlers(mockIo);
      await connectionCallback(mockSocket);

      await expect(socketEventHandlers['join:lot']!('lot-1')).resolves.not.toThrow();
    });
  });

  describe('emitSlotUpdate', () => {
    it('should emit slot:update to the lot room', () => {
      initSocketHandlers(mockIo);

      emitSlotUpdate('lot-1', { slot_id: 'A1', status: 'OCCUPIED' });

      expect(mockIo.to).toHaveBeenCalledWith('lot:lot-1');
      expect(mockRoomEmit).toHaveBeenCalledWith('slot:update', {
        slot_id: 'A1',
        status: 'OCCUPIED',
      });
    });

    it('should include optional session fields when provided', () => {
      initSocketHandlers(mockIo);

      emitSlotUpdate('lot-1', {
        slot_id: 'B1',
        status: 'ASSIGNED',
        session: { session_id: 'sess-1', registration: '1กข 1234', province: 'กรุงเทพมหานคร' },
      });

      expect(mockIo.to).toHaveBeenCalledWith('lot:lot-1');
      expect(mockRoomEmit).toHaveBeenCalledWith('slot:update', {
        slot_id: 'B1',
        status: 'ASSIGNED',
        session: { session_id: 'sess-1', registration: '1กข 1234', province: 'กรุงเทพมหานคร' },
      });
    });
  });

  describe('emitSessionClosed', () => {
    it('should emit session:closed to the lot room', () => {
      initSocketHandlers(mockIo);

      emitSessionClosed('lot-1', {
        session_id: 'sess-1',
        slot_id: 'A1',
        total_fee: 40,
        duration_minutes: 120,
      });

      expect(mockIo.to).toHaveBeenCalledWith('lot:lot-1');
      expect(mockRoomEmit).toHaveBeenCalledWith('session:closed', {
        session_id: 'sess-1',
        slot_id: 'A1',
        total_fee: 40,
        duration_minutes: 120,
      });
    });
  });
});
