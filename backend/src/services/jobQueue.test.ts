import { describe, it, expect, vi, beforeEach } from 'vitest';
import { JobQueueService } from './jobQueue.js';
import Queue from 'bull';

// Define the mock queue instance
const mockQueue = {
  process: vi.fn(),
  on: vi.fn(),
  close: vi.fn(),
};

// Mock bull
vi.mock('bull', () => {
  return {
    default: vi.fn().mockImplementation(function() {
      return mockQueue;
    })
  };
});

vi.mock('../utils/logger.js', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('JobQueueService', () => {
  let jobQueueService: JobQueueService;

  beforeEach(() => {
    vi.clearAllMocks();
    jobQueueService = new JobQueueService();
  });

  it('should register a processor for a queue', async () => {
    await jobQueueService.initialize();
    
    const mockHandler = vi.fn();
    jobQueueService.process('ai-processing', mockHandler);

    expect(mockQueue.process).toHaveBeenCalledWith(expect.any(Function));
  });

  it('should throw error if queue not found during process registration', async () => {
    await jobQueueService.initialize();
    
    expect(() => {
      jobQueueService.process('non-existent-queue', async () => {});
    }).toThrow(/Queue 'non-existent-queue' not found/);
  });
});
