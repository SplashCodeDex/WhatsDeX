import { jest, describe, it, expect, beforeEach } from '@jest/globals';

const mockApps: any[] = [];
const mockCredential = {
  cert: jest.fn(),
  applicationDefault: jest.fn(),
};
const mockAdmin = {
  credential: mockCredential,
  initializeApp: jest.fn(() => {
    mockApps.push({});
    return {};
  }),
  firestore: jest.fn(() => ({
    settings: jest.fn(),
  })),
  apps: mockApps,
};

const mockConfig = {
  get: jest.fn(),
};

const mockReadFileSync = jest.fn();

// Mock dependencies BEFORE imports
jest.unstable_mockModule('firebase-admin', () => ({
  default: mockAdmin,
}));

jest.unstable_mockModule('fs', () => ({
  readFileSync: mockReadFileSync,
}));

// Mock RELATIVE imports using the exact path that will be requested
jest.unstable_mockModule('../../services/ConfigService.js', () => ({
  ConfigService: {
    getInstance: jest.fn(() => mockConfig),
  },
}));

jest.unstable_mockModule('../../utils/logger.js', () => ({
  default: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

describe('Firebase Initialization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockApps.length = 0;
  });

  it('should initialize with application default credentials', async () => {
    mockConfig.get.mockReturnValue(undefined);
    
    // Dynamic import to trigger side-effects
    await import(`../firebase.js?t=${Date.now()}`);

    expect(mockCredential.applicationDefault).toHaveBeenCalled();
    expect(mockAdmin.initializeApp).toHaveBeenCalled();
  });

  it('should initialize with service account if path provided', async () => {
    const mockServiceAccount = { project_id: 'test-project' };
    mockConfig.get.mockReturnValue('./service-account.json');
    mockReadFileSync.mockReturnValue(JSON.stringify(mockServiceAccount));

    await import(`../firebase.js?t=${Date.now()}`);

    expect(mockCredential.cert).toHaveBeenCalledWith(mockServiceAccount);
    expect(mockAdmin.initializeApp).toHaveBeenCalled();
  });

  it('should throw error if service account file is missing', async () => {
    mockConfig.get.mockReturnValue('./missing.json');
    mockReadFileSync.mockImplementation(() => {
      throw new Error('File not found');
    });

    await expect(import(`../firebase.js?t=${Date.now()}`)).rejects.toThrow('File not found');
  });
});
