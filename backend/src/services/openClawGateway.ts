import { startGatewayServer } from 'openclaw';
import { loadWorkspaceSkillEntries } from '../../openclaw/src/agents/skills/workspace.js';
import { resolveDefaultAgentId } from '../../openclaw/src/agents/agent-scope.js';
import { listGatewayAgents } from '../../openclaw/src/gateway/server-methods/agents.js';
import { getHealthCache } from '../../openclaw/src/gateway/server/health-state.js';

/**
 * OpenClawGateway is a singleton service that manages the lifecycle
 * of the OpenClaw engine within the WhatsDeX backend.
 */
export class OpenClawGateway {
  private static instance: OpenClawGateway;
  private server: any | null = null;
  private initialized = false;
  private startTime = Date.now();

  private constructor() { }

  /**
   * Gets the singleton instance of OpenClawGateway.
   */
  public static getInstance(): OpenClawGateway {
    if (!OpenClawGateway.instance) {
      OpenClawGateway.instance = new OpenClawGateway();
    }
    return OpenClawGateway.instance;
  }

  /**
   * Initializes the OpenClaw gateway server.
   */
  public async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Default port for OpenClaw Gateway is 18789
      this.server = await (startGatewayServer as any)(18789);
      this.initialized = true;
      this.startTime = Date.now();
      console.log('OpenClaw Gateway initialized successfully.');
    } catch (error) {
      console.error('Failed to initialize OpenClaw Gateway:', error);
      throw error;
    }
  }

  /**
   * Checks if the gateway is initialized.
   */
  public isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Gets the underlying GatewayServer instance.
   */
  public getEngine(): any | null {
    return this.server;
  }

  /**
   * Proxy to load skills from OpenClaw
   */
  public async getSkillReport(): Promise<any> {
    try {
      const skills = await (loadWorkspaceSkillEntries as any)();
      return {
        workspaceDir: '',
        managedSkillsDir: '',
        skills: skills || []
      };
    } catch (error) {
      console.error('Failed to load OpenClaw skills:', error);
      return { skills: [] };
    }
  }

  /**
   * Proxy to list agents from OpenClaw
   */
  public async getAgents(): Promise<any> {
    try {
      const defaultId = await (resolveDefaultAgentId as any)();
      const agents = await (listGatewayAgents as any)();
      return {
        defaultId,
        agents: agents || []
      };
    } catch (error) {
      console.error('Failed to load OpenClaw agents:', error);
      return { agents: [] };
    }
  }

  /**
   * Proxy to get health snapshot from OpenClaw
   */
  public async getHealth(): Promise<any> {
    try {
      const health = await (getHealthCache as any)();
      return {
        ...health,
        uptimeMs: Date.now() - this.startTime
      };
    } catch (error) {
      return { status: 'error', uptimeMs: 0 };
    }
  }

  /**
   * Shuts down the gateway server.
   */
  public async shutdown(): Promise<void> {
    if (this.server) {
      this.initialized = false;
      this.server = null;
    }
  }
}
