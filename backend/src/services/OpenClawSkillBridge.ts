import { toolRegistry, ToolDefinition } from './toolRegistry.js';
// @ts-ignore
import { createOpenClawTools } from '../../../openclaw/src/agents/openclaw-tools.js';
import logger from '../utils/logger.js';

/**
 * Bridge between OpenClaw skills and the WhatsDeX Unified Tool Registry.
 */
export class OpenClawSkillBridge {

  /**
   * Registers all available OpenClaw tools in the unified registry.
   */
  public static async registerSkills(): Promise<void> {
    try {
      // Create tools with default options
      // In a real scenario, we might want to pass more context
      logger.info('🔧 Creating OpenClaw tools...');
      const ocTools = createOpenClawTools({
        allowHostBrowserControl: true,
        sandboxed: false,
        config: {
          plugins: {
            enabled: false // Disable heavy plugin discovery to prevent port 3001 hang
          }
        } as any
      });
      logger.info(`🛠️ Created ${ocTools.length} OpenClaw tools. Bridging...`);

      for (const ocTool of ocTools) {
        this.bridgeOpenClawTool(ocTool);
      }

      logger.info(`Successfully bridged ${ocTools.length} OpenClaw tools.`);
    } catch (error) {
      logger.error('Failed to bridge OpenClaw skills:', error);
    }
  }

  private static bridgeOpenClawTool(ocTool: any): void {
    const tool: ToolDefinition = {
      name: ocTool.name,
      description: ocTool.description,
      parameters: this.convertSchema(ocTool.parameters),
      source: 'openclaw',
      execute: async (args, _context) => {
        // OpenClaw tools expect (toolCallId, args)
        // We'll generate a random toolCallId for compatibility
        const toolCallId = `oc_${Math.random().toString(36).substring(7)}`;
        return await ocTool.execute(toolCallId, args);
      }
    };

    toolRegistry.registerTool(tool);
  }

  /**
   * Converts TypeBox/JSON Schema to Gemini-compatible parameter schema.
   */
  private static convertSchema(schema: any): any {
    // Both follow JSON Schema standards, so we just ensure it's an object
    return {
      type: 'object',
      properties: schema.properties || {},
      required: schema.required || []
    };
  }
}
