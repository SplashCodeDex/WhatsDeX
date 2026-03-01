import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { StatsAggregatorJob } from './statsAggregatorJob.js';
import { db } from '../lib/firebase.js';
import { firebaseService } from '../services/FirebaseService.js';
import { Timestamp } from 'firebase-admin/firestore';

// Mock Firebase
vi.mock('../lib/firebase.js', () => ({
  db: {
    collection: vi.fn(),
  }
}));

vi.mock('../services/FirebaseService.js', () => ({
  firebaseService: {
    setDoc: vi.fn().mockResolvedValue(undefined),
  }
}));

describe('StatsAggregatorJob', () => {
  let job: StatsAggregatorJob;

  beforeEach(() => {
    vi.clearAllMocks();
    job = new StatsAggregatorJob();
  });

  it('should aggregate stats for all tenants', async () => {
    const mockTenants = [
      { id: 'tenant1' },
      { id: 'tenant2' }
    ];

    (db.collection as any).mockImplementation((path: string) => {
      if (path === 'tenants') {
        return {
          get: vi.fn().mockResolvedValue({
            size: mockTenants.length,
            docs: mockTenants.map(t => ({ id: t.id }))
          })
        };
      }
      if (path.includes('command_usage')) {
        return {
          where: vi.fn().mockReturnThis(),
          count: vi.fn().mockReturnThis(),
          get: vi.fn().mockResolvedValue({
            data: () => ({ count: 5 })
          })
        };
      }
    });

    const mockJob = {
      data: { date: '2026-01-22' },
      progress: vi.fn().mockResolvedValue(undefined)
    };

    const result = await job.process(mockJob as any);

    expect(result.success).toBe(true);
    expect(result.processedTenants).toBe(2);
    expect(firebaseService.setDoc).toHaveBeenCalledTimes(2);
    expect(firebaseService.setDoc).toHaveBeenCalledWith(
      'analytics',
      '2026-01-22',
      expect.objectContaining({
        date: '2026-01-22',
        totalCommands: 5,
        aiRequests: 5
      }),
      expect.any(String),
      true
    );
  });

  it('should default to yesterday if no date provided', async () => {
    (db.collection as any).mockImplementation(() => ({
      get: vi.fn().mockResolvedValue({ size: 0, docs: [] })
    }));

    const mockJob = {
      data: {},
      progress: vi.fn().mockResolvedValue(undefined)
    };

    const result = await job.process(mockJob as any);

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const expectedDate = yesterday.toISOString().split('T')[0];

    expect(result.date).toBe(expectedDate);
  });
});
