import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OpenClawGateway } from './openClawGateway.js';

vi.mock('openclaw', () => ({
  startGatewayServer: vi.fn(async () => ({
    close: vi.fn(),
  })),
}));

describe('OpenClawGateway', () => {
  let gateway: OpenClawGateway;

  beforeEach(() => {
    // Reset singleton instance manually for testing if needed
    // @ts-ignore
    OpenClawGateway.instance = undefined;
    gateway = OpenClawGateway.getInstance();
  });

  it('should be a singleton', () => {
    const instance2 = OpenClawGateway.getInstance();
    expect(gateway).toBe(instance2);
  });

  it('should initialize the OpenClaw engine', async () => {
    await gateway.initialize();
    expect(gateway.isInitialized()).toBe(true);
  });

  it('should hold a reference to the OpenClaw instance', async () => {
    await gateway.initialize();
    expect(gateway.getEngine()).toBeDefined();
  });
});
