import { startGatewayServer } from 'openclaw';

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
   * Safe helper to import openclaw internal modules
   */
  private async safeImport(path: string): Promise<any> {
    try {
      return await import(path);
    } catch (error: any) {
      console.error(`Failed to import OpenClaw module [${path}]:`, error.message);
      return null;
    }
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
      const workspace = await this.safeImport('../../../openclaw/src/agents/skills/workspace.js');
      if (!workspace || typeof workspace.loadWorkspaceSkillEntries !== 'function') {
        throw new Error('OpenClaw loadWorkspaceSkillEntries is not available');
      }
      
      const skills = await workspace.loadWorkspaceSkillEntries();
      return {
        workspaceDir: '',
        managedSkillsDir: '',
        skills: skills || []
      };
    } catch (error: any) {
      console.error('Failed to load OpenClaw skills:', error);
      return { skills: [], error: error.message };
    }
  }

  /**
   * Proxy to list agents from OpenClaw
   */
  public async getAgents(): Promise<any> {
    try {
      console.log('OpenClawGateway: Loading config and session utils...');
      
      const configMod = await this.safeImport('../../../openclaw/src/config/config.js');
      const sessionUtils = await this.safeImport('../../../openclaw/src/gateway/session-utils.js');

      if (!configMod || typeof configMod.loadConfig !== 'function') {
        throw new Error('OpenClaw loadConfig is not available');
      }

      if (!sessionUtils || typeof sessionUtils.listAgentsForGateway !== 'function') {
        throw new Error('OpenClaw listAgentsForGateway is not available');
      }

      const cfg = await configMod.loadConfig();
      console.log('OpenClawGateway: Config loaded. Listing agents...');

      const result = await sessionUtils.listAgentsForGateway(cfg);
      console.log(`OpenClawGateway: Found ${result?.agents?.length || 0} agents.`);
      
      return {
        defaultId: result?.defaultId,
        agents: result?.agents || []
      };
    } catch (error: any) {
      console.error('Failed to load OpenClaw agents:', error);
      return { agents: [], error: error.message };
    }
  }

  /**
   * Proxy to get health snapshot from OpenClaw
   */
  public async getHealth(): Promise<any> {
    try {
      const healthState = await this.safeImport('../../../openclaw/src/gateway/server/health-state.js');
      if (!healthState || typeof healthState.getHealthCache !== 'function') {
        throw new Error('OpenClaw getHealthCache is not available');
      }

      const health = await healthState.getHealthCache();
      return {
        ...health,
        uptimeMs: Date.now() - this.startTime
      };
    } catch (error: any) {
      return { status: 'error', uptimeMs: 0, error: error.message };
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
