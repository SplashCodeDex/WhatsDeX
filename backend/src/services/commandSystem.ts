/**
 * UNIFIED COMMAND SYSTEM - Consolidates all command loading approaches
 * 2026 Mastermind Edition - Stateless & Multi-Tenant Optimized & Strictly Typed
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

import performanceMonitor from '../utils/performanceMonitor.js';
import { proto } from '@whiskeysockets/baileys';
import { type Bot, type Command, type MessageContext, type GlobalContext, type GroupFunctions } from '../types/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class CommandSystem {
  private context: GlobalContext;
  private commands: Map<string, Command>;
  private aliases: Map<string, string>;
  private categories: Map<string, string[]>;
  private prefixes: string[];
  public loadedCount: number = 0;
  public failedCount: number = 0;

  constructor(context: GlobalContext) {
    this.context = context;
    this.commands = new Map();
    this.aliases = new Map();
    this.categories = new Map();

    // Command prefixes
    this.prefixes = ['.', '!', '/', '#'];

    this.context.logger.info('🔧 Unified Command System initialized');
  }

  /**
   * LOAD ALL COMMANDS
   */
  async loadCommands() {
    const startTime = Date.now();
    this.loadedCount = 0;
    this.failedCount = 0;

    this.commands.clear();
    this.aliases.clear();
    this.categories.clear();

    const commandsDir = path.join(__dirname, '..', '..', 'commands');

    this.context.logger.info('🔄 Loading commands...');

    try {
      const categories = await fs.readdir(commandsDir, { withFileTypes: true });

      for (const category of categories) {
        if (!category.isDirectory()) continue;

        const categoryPath = path.join(commandsDir, category.name);
        const commandFiles = await fs.readdir(categoryPath);

        this.categories.set(category.name, []);

        for (const file of commandFiles) {
          if (file.endsWith('.js')) {
            try {
              const commandPath = path.join(categoryPath, file);
              const command = await this.loadSingleCommand(commandPath, category.name);

              if (command) {
                this.registerCommand(command, category.name);
              }
            } catch (error: unknown) {
              const err = error instanceof Error ? error.message : String(error);
              this.context.logger.error(`  ❌ Error loading ${file}:`, { error: err });
            }
          }
        }
      }

      const duration = Date.now() - startTime;
      this.context.logger.info(`🎉 Loaded ${this.loadedCount} commands in ${duration}ms`);

    } catch (error: unknown) {
      const err = error instanceof Error ? error.message : String(error);
      this.context.logger.error('❌ Command loading failed:', { error: err });
    }
  }

  /**
   * LOAD SINGLE COMMAND
   */
  async loadSingleCommand(commandPath: string, categoryName: string): Promise<Command | null> {
    try {
      const absolutePath = path.resolve(commandPath);
      const commandUrl = pathToFileURL(absolutePath).href;

      const commandModule = await import(commandUrl + `?v=${Date.now()}`);
      const command = commandModule.default || commandModule;

      if (command) {
        if (command.execute && !command.code) command.code = command.execute;
        else if (command.run && !command.code) command.code = command.run;
      }

      if (!this.validateCommand(command)) return null;

      const enhancedCommand: Command = {
        ...command,
        category: categoryName,
        aliases: command.aliases || [],
        permissions: command.permissions || {},
        filePath: commandPath,
        loadedAt: Date.now(),
        // Default values for robustness
        description: command.description || 'No description',
        usage: command.usage || command.name
      };

      this.loadedCount += 1;
      return enhancedCommand;

    } catch (error: unknown) {
      const err = error instanceof Error ? error.message : String(error);
      this.failedCount += 1;
      this.context.logger.error(`Failed to load command: ${commandPath}`, { error: err });
      return null;
    }
  }

  registerCommand(command: Command, categoryName: string) {
    this.commands.set(command.name, command);
    if (command.aliases) {
      command.aliases.forEach((alias: string) => {
        this.aliases.set(alias, command.name);
      });
    }
    if (!this.categories.has(categoryName)) this.categories.set(categoryName, []);
    this.categories.get(categoryName)?.push(command.name);
  }

  validateCommand(command: unknown): command is Command {
    return !!(command && typeof command === 'object' && 'name' in command && typeof (command as Command).code === 'function');
  }

  async processMessage(bot: Bot, messageData: proto.IWebMessageInfo) {
    const text = this.extractText(messageData);
    if (!text) return false;

    const commandInfo = this.parseCommand(text);
    if (!commandInfo) return false;

    const commandName = this.aliases.get(commandInfo.name) || commandInfo.name;
    const command = this.commands.get(commandName);

    if (!command) return false;

    return await this.executeCommand(bot, command, messageData, commandInfo);
  }

  parseCommand(text: string) {
    const trimmed = text.trim();
    const prefix = this.prefixes.find(p => trimmed.startsWith(p));
    if (!prefix) return null;

    const withoutPrefix = trimmed.substring(prefix.length);
    const parts = withoutPrefix.split(/\s+/);
    const name = parts[0].toLowerCase();
    const args = parts.slice(1);

    return { name, args, fullText: text, prefix };
  }

  async executeCommand(bot: Bot, command: Command, messageData: proto.IWebMessageInfo, commandInfo: { name: string; args: string[]; prefix: string }) {
    const timer = performanceMonitor.startTimer('command_execution', {
      command: command.name,
      userId: messageData.key.remoteJid,
      tenantId: bot.tenantId
    });

    try {
      const ctx = await this.createContext(bot, messageData, commandInfo, command);

      // Execute command through middleware pipeline
      await bot.executeMiddleware(ctx, async () => {
        if (command.code) {
          await command.code(ctx);
        }
      });

      const duration = timer.end();
      this.context.logger.command(command.name, messageData.key.remoteJid || 'unknown', true, duration);
      return true;

    } catch (error: unknown) {
      timer.end();
      const err = error instanceof Error ? error.message : String(error);
      this.context.logger.command(command.name, messageData.key.remoteJid || 'unknown', false, null, err);

      if (messageData.key.remoteJid) {
        await bot.sendMessage(messageData.key.remoteJid, { text: `❌ Error: ${err}` }, { quoted: messageData });
      }
      return true;
    }
  }

  async createContext(bot: Bot, messageData: proto.IWebMessageInfo, commandInfo: { args: string[]; prefix: string }, command: Command): Promise<MessageContext> {
    const text = this.extractText(messageData);
    const jid = messageData.key.remoteJid || '';

    // Delegate to GroupService
    const getGroupFunctions = (targetJid?: string): GroupFunctions => {
      // If targetJid is provided, use it, otherwise use current jid (if group)
      const effectiveJid = targetJid || (jid.endsWith('@g.us') ? jid : '');

      if (!effectiveJid) {
        // Return default/empty functions if not a group
        // Or better: Create a "NoOp" or "Null" group function set in GroupService
        // For now, we reuse the pattern but scoped to 'null' or erroring out
        // But strict typing requires returning GroupFunctions.
        // Let's rely on createFunctions handling it or return a safe default here.
        return this.context.groupService.createFunctions(bot, bot.tenantId, 'invalid@g.us', messageData.key.participant || jid);
      }
      return this.context.groupService.createFunctions(bot, bot.tenantId, effectiveJid, messageData.key.participant || jid);
    };

    // Extract quoted message if available
    const quotedMsg = messageData.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const quotedContext = quotedMsg ? {
      content: quotedMsg.conversation || quotedMsg.extendedTextMessage?.text || quotedMsg.imageMessage?.caption || '',
      contentType: Object.keys(quotedMsg)[0],
      senderJid: messageData.message?.extendedTextMessage?.contextInfo?.participant || '',
      media: quotedMsg.imageMessage || quotedMsg.videoMessage || quotedMsg.audioMessage || quotedMsg.stickerMessage || quotedMsg.documentMessage,
      key: {
        id: messageData.message?.extendedTextMessage?.contextInfo?.stanzaId,
        remoteJid: jid,
        participant: messageData.message?.extendedTextMessage?.contextInfo?.participant
      }
    } : undefined;

    const msgContext: MessageContext = {
      ...messageData,
      id: jid,
      body: text,
      args: commandInfo.args,
      command: command.name,
      prefix: commandInfo.prefix,
      commandDef: command,
      sender: {
        jid,
        name: messageData.pushName || 'Unknown',
        pushName: messageData.pushName ?? undefined,
        isOwner: (this.context.config.get('bot.owners' as any) as any)?.includes(jid) || false,
        isAdmin: false,
      },
      author: {
        id: jid // Legacy alias for sender.jid
      },
      quoted: quotedContext,
      msg: {
        key: messageData.key,
        ...messageData.message
      },
      bot: bot,
      reply: async (msg: string | { text?: string;[key: string]: unknown }) => {
        const content = typeof msg === 'string' ? { text: msg } : msg;
        return await bot.sendMessage(jid, content, { quoted: messageData });
      },
      sendMessage: async (targetJid: string, content: any, options?: any) => {
        return await bot.sendMessage(targetJid, content, options);
      },
      replyReact: async (emoji: string) => {
        return await bot.sendMessage(jid, { react: { text: emoji, key: messageData.key } });
      },
      isGroup: () => jid.endsWith('@g.us'),
      usage: {},
      getId: (target: string) => target.split('@')[0],
      simulateTyping: () => {
        // Fire and forget typing simulation
        if (bot.sendPresenceUpdate) {
          // Cast to any for now as sendPresenceUpdate signature might vary or be optional
          (bot.sendPresenceUpdate as unknown as (status: string, jid: string) => Promise<void>)('composing', jid).catch(() => { });
        }
      },
      used: {
        command: command.name,
        prefix: commandInfo.prefix,
        args: commandInfo.args,
        text: commandInfo.args.join(' ')
      },
      cooldown: null,

      // Group Functions
      group: getGroupFunctions,

      download: async () => {
        // Placeholder for download logic
        return Buffer.alloc(0);
      }
    };

    return msgContext;
  }

  extractText(messageData: proto.IWebMessageInfo) {
    return messageData.message?.conversation ||
      messageData.message?.extendedTextMessage?.text ||
      messageData.message?.imageMessage?.caption ||
      messageData.message?.videoMessage?.caption || '';
  }
}

export default CommandSystem;
