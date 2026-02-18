import logger from '../utils/logger.js';
import { Result } from '../types/index.js';

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, any>;
    required: string[];
  };
  execute: (args: any, context: any) => Promise<any>;
  source: 'whatsdex' | 'openclaw';
  category?: string;
}

/**
 * Unified Tool Registry (2026 Edition)
 * Merges legacy WhatsDeX commands with OpenClaw skills.
 */
export class ToolRegistry {
  private static instance: ToolRegistry;
  private tools: Map<string, ToolDefinition> = new Map();

  private constructor() {}

  public static getInstance(): ToolRegistry {
    if (!ToolRegistry.instance) {
      ToolRegistry.instance = new ToolRegistry();
    }
    return ToolRegistry.instance;
  }

  /**
   * Registers a new tool in the unified registry.
   */
  public registerTool(tool: ToolDefinition): void {
    if (this.tools.has(tool.name)) {
      logger.warn(`Overwriting tool: ${tool.name}`);
    }
    this.tools.set(tool.name, tool);
    logger.info(`Registered tool: [${tool.source}] ${tool.name}`);
  }

  /**
   * Gets all tool definitions for Gemini function calling.
   */
  public getGeminiTools(): any[] {
    return Array.from(this.tools.values()).map(tool => ({
      functionDeclarations: [{
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters
      }]
    }));
  }

  /**
   * Executes a tool by name.
   */
  public async executeTool(name: string, args: any, context: any): Promise<any> {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(`Tool not found: ${name}`);
    }

    try {
      logger.info(`Executing tool: ${name} with args:`, args);
      const result = await tool.execute(args, context);
      return result;
    } catch (error) {
      logger.error(`Error executing tool ${name}:`, error);
      throw error;
    }
  }

  public getAllTools(): ToolDefinition[] {
    return Array.from(this.tools.values());
  }
}

export const toolRegistry = ToolRegistry.getInstance();
