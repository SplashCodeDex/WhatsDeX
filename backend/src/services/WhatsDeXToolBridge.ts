import { toolRegistry, ToolDefinition } from './toolRegistry.js';
import { Bot, Command } from '../types/index.js';
import logger from '../utils/logger.js';

/**
 * Bridge between WhatsDeX legacy commands and the Unified Tool Registry.
 */
export class WhatsDeXToolBridge {
  
  /**
   * Registers a subset of high-value WhatsDeX commands as AI tools.
   */
  public static registerCommands(bot: Bot): void {
    const highValueCommands = [
      'youtubevideo', 'youtubeaudio', 'instagramdl', 'tiktokdl', 'facebookdl',
      'dalle', 'animagine', 'editimage', 'upscale', 'removebg',
      'weather', 'translate', 'joke', 'meme', 'screenshot', 'ocr'
    ];

    for (const name of highValueCommands) {
      const command = bot.cmd.get(name);
      if (command) {
        this.bridgeCommand(name, command);
      }
    }
  }

  private static bridgeCommand(name: string, command: Command): void {
    const tool: ToolDefinition = {
      name,
      description: command.description || `Execute ${name} command`,
      parameters: this.inferParameters(name, command.category),
      source: 'whatsdex',
      category: command.category,
      execute: async (args, context) => {
        // Prepare a mock context for the legacy command
        const mockCtx = {
          ...context,
          args: Object.values(args).map(v => String(v)),
          body: Object.values(args).join(' ')
        };

        if (command.code) {
          await command.code(mockCtx);
          return { success: true, message: `Command ${name} executed.` };
        }
        
        return { success: false, error: 'Command has no executable code.' };
      }
    };

    toolRegistry.registerTool(tool);
  }

  private static inferParameters(name: string, category: string): any {
    const properties: Record<string, any> = {};
    const required: string[] = [];

    if (category === 'downloader' || name.includes('dl')) {
      properties.url = { type: 'string', description: 'URL of the content to download' };
      required.push('url');
    } else if (name === 'translate') {
      properties.text = { type: 'string', description: 'Text to translate' };
      properties.to = { type: 'string', description: 'Target language code' };
      required.push('text', 'to');
    } else {
      properties.input = { type: 'string', description: 'Input for the command' };
    }

    return {
      type: 'object',
      properties,
      required
    };
  }
}
