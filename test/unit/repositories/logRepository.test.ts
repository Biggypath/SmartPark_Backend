const mockPrisma = {
  sensorLog: {
    create: jest.fn(),
    findMany: jest.fn(),
  },
};

jest.mock('../../../src/config/db', () => ({
  prisma: mockPrisma,
}));

import * as logRepo from '../../../src/repositories/logRepository';

describe('logRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createLog', () => {
    it('should create a sensor log entry', async () => {
      const mockLog = {
        log_id: 'log-1',
        slot_id: 'A1',
        event_type: 'ENTRY',
        raw_data: 'OCCUPIED',
        timestamp: new Date(),
      };
      mockPrisma.sensorLog.create.mockResolvedValue(mockLog);

      const result = await logRepo.createLog('A1', 'ENTRY' as any, 'OCCUPIED');

      expect(result).toEqual(mockLog);
      expect(mockPrisma.sensorLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          slot_id: 'A1',
          event_type: 'ENTRY',
          raw_data: 'OCCUPIED',
        }),
      });
    });

    it('should include a timestamp in the log', async () => {
      mockPrisma.sensorLog.create.mockResolvedValue({});

      await logRepo.createLog('A2', 'EXIT' as any, 'FREE');

      const callData = mockPrisma.sensorLog.create.mock.calls[0]![0].data;
      expect(callData.timestamp).toBeInstanceOf(Date);
    });
  });

  describe('getLogsBySlot', () => {
    it('should return logs for a slot ordered by timestamp desc', async () => {
      const mockLogs = [
        { log_id: 'log-2', slot_id: 'A1', event_type: 'EXIT', timestamp: new Date() },
        { log_id: 'log-1', slot_id: 'A1', event_type: 'ENTRY', timestamp: new Date() },
      ];
      mockPrisma.sensorLog.findMany.mockResolvedValue(mockLogs);

      const result = await logRepo.getLogsBySlot('A1');

      expect(result).toEqual(mockLogs);
      expect(mockPrisma.sensorLog.findMany).toHaveBeenCalledWith({
        where: { slot_id: 'A1' },
        orderBy: { timestamp: 'desc' },
        take: 50,
      });
    });

    it('should return empty array when no logs exist', async () => {
      mockPrisma.sensorLog.findMany.mockResolvedValue([]);

      const result = await logRepo.getLogsBySlot('B5');

      expect(result).toEqual([]);
    });
  });
});
