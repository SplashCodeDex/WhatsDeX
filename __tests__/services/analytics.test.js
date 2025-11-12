const WebSocket = require('ws');
import AnalyticsService from '../../src/services/analytics.js';

// Mock the entire logger module
jest.mock('../../src/utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
}));

const logger = require('../../src/utils/logger'); // Import the mocked logger

jest.mock('ws');

describe('AnalyticsService', () => {
  jest.useFakeTimers();
  let mockDatabase;
  let analyticsService;
  let mockWss;

  beforeEach(function() {
    mockDatabase = {
      healthCheck: jest.fn(),
      prisma: {
        user: {
          count: jest.fn(),
          groupBy: jest.fn(),
          findUnique: jest.fn(),
        },
        commandUsage: {
          count: jest.fn(),
          groupBy: jest.fn(),
          aggregate: jest.fn(),
          findMany: jest.fn(),
        },
        analytics: {
          create: jest.fn(),
        },
        subscription: {
          count: jest.fn(),
          aggregate: jest.fn(),
          findMany: jest.fn(),
          findFirst: jest.fn(),
        },
        payment: {
          groupBy: jest.fn(),
          aggregate: jest.fn(),
        },
        userSession: {
          findMany: jest.fn(),
        },
      },
    };

    mockWss = {
      on: jest.fn(),
      close: jest.fn(),
    };

    WebSocket.Server.mockImplementation(() => mockWss);

    analyticsService = new AnalyticsService(mockDatabase);
    analyticsService.wss = mockWss;
    mockDatabase.healthCheck.mockResolvedValue({ status: 'healthy' });
  });

  it('should be defined', () => {
    expect(analyticsService).toBeDefined();
  });
});