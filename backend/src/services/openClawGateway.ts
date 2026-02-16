import { startGatewayServer } from 'openclaw';

/**
 * OpenClawGateway is a singleton service that manages the lifecycle
 * of the OpenClaw engine within the WhatsDeX backend.
 */
export class OpenClawGateway {
  private static instance: OpenClawGateway;
  private server: any | null = null;
  private initialized = false;

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
   * Shuts down the gateway server.
   */
  public async shutdown(): Promise<void> {
    if (this.server) {
      this.initialized = false;
      this.server = null;
    }
  }
}
