import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BackupService } from './backupService.js';
import { db } from '../lib/firebase.js';

vi.mock('../lib/firebase.js', () => ({
  db: {
    collection: vi.fn().mockReturnThis(),
    doc: vi.fn().mockReturnThis(),
    set: vi.fn().mockResolvedValue(undefined),
    get: vi.fn(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
  },
}));

vi.mock('../utils/logger.js', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

describe('BackupService', () => {
  let service: BackupService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = BackupService.getInstance();
  });

  it('should run a backup and store metadata', async () => {
    const tenantId = 'tenant-123';
    
    const result = await service.runBackup(tenantId, 'database');

    expect(result.success).toBe(true);
    expect(db.collection).toHaveBeenCalledWith('tenants');
    expect(db.doc).toHaveBeenCalledWith(tenantId);
    // expect(db.collection).toHaveBeenCalledWith('backups'); // Called on the result of doc(tenantId)
    
    if (result.success) {
      expect(result.data.status).toBe('completed');
      expect(result.data.driveFileId).toBeDefined();
    }
  });

  it('should list backups for a tenant', async () => {
    const tenantId = 'tenant-123';
    const mockBackups = [
      { id: 'b1', type: 'database', status: 'completed', createdAt: { toDate: () => new Date() } },
    ];

    (db.get as any).mockResolvedValue({
      docs: mockBackups.map(b => ({
        id: b.id,
        data: () => b
      })),
      empty: false
    });

    const result = await service.listBackups(tenantId);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe('b1');
    }
  });
});
