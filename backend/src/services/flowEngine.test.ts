import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FlowEngine } from './flowEngine.js';
import { FlowData } from './flowService.js';

describe('FlowEngine', () => {
  let engine: FlowEngine;

  beforeEach(() => {
    vi.clearAllMocks();
    engine = FlowEngine.getInstance();
  });

  it('should execute a simple Trigger -> Action flow', async () => {
    const mockReply = vi.fn().mockResolvedValue({ success: true });
    const context: any = {
      body: 'hello',
      reply: mockReply,
      sender: { jid: 'user1' },
      tenantId: 'tenant1'
    };

    const flow: FlowData = {
      id: 'flow1',
      name: 'Welcome Flow',
      isActive: true,
      tenantId: 'tenant1',
      nodes: [
        { id: 'n1', type: 'trigger', data: { keyword: 'hello' } },
        { id: 'n2', type: 'action', data: { message: 'Hi there!' } }
      ],
      edges: [
        { id: 'e1', source: 'n1', target: 'n2' }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await engine.executeFlow(flow, context);

    expect(result).toBe(true);
    expect(mockReply).toHaveBeenCalledWith('Hi there!');
  });

  it('should not execute if trigger keyword does not match', async () => {
    const mockReply = vi.fn();
    const context: any = {
      body: 'bye',
      reply: mockReply,
      sender: { jid: 'user1' }
    };

    const flow: FlowData = {
      id: 'flow1',
      name: 'Welcome Flow',
      isActive: true,
      tenantId: 'tenant1',
      nodes: [
        { id: 'n1', type: 'trigger', data: { keyword: 'hello' } },
        { id: 'n2', type: 'action', data: { message: 'Hi there!' } }
      ],
      edges: [
        { id: 'e1', source: 'n1', target: 'n2' }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await engine.executeFlow(flow, context);

    expect(result).toBe(false);
    expect(mockReply).not.toHaveBeenCalled();
  });
});
