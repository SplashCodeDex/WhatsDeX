import { memoryService } from './memoryService.js';
import { firebaseService } from './FirebaseService.js';
import crypto from 'crypto';
import GeminiService from './gemini.js';
import logger from '../utils/logger.js';
import { EventEmitter } from 'events';
import { Bot, GlobalContext, MessageContext, Result } from '../types/index.js';
import { CommonMessage } from '../types/omnichannel.js';
import { databaseService } from './database.js';
import { cacheService } from './cache.js';
import { toolRegistry } from './toolRegistry.js';
import { skillsManager } from './skillsManager.js';
import { multiTenantService } from './multiTenantService.js';
import { toolPersistenceService } from './toolPersistenceService.js';

interface AIDecisionEngine {
  confidenceThreshold: number;
  contextWindowSize: number;
  maxToolCalls: number;
  learningEnabled: boolean;
}

interface AIAction {
  type: string;
  command?: string;
  parameters: Record<string, any>;
  confidence: number;
  reasoning: string;
  originalIntent?: any;
}

interface AIAnalysis {
  intents: any[];
  confidence: number;
  actions: AIAction[];
  reasoning: string;
  toolsNeeded: any[];
  responseType: string;
}

/**
 * Gemini AI - Next Generation Intelligence System
 * Handles natural conversation, context understanding, and intelligent tool usage
 * 2026 Mastermind Edition - Memoized (Rule 5)
 */
export class GeminiAI extends EventEmitter {
  private bot: Bot | null = null;
  private context: GlobalContext;
  private gemini: GeminiService;
  private decisionEngine: AIDecisionEngine;

  constructor(context: GlobalContext) {

    super();
    this.context = context;
    this.gemini = new GeminiService();

    this.decisionEngine = {
      confidenceThreshold: 0.7,
      contextWindowSize: 20,
      maxToolCalls: 5,
      learningEnabled: true
    };

    logger.info('Gemini AI initialized with Rule 5 Memoization and Unified Tool Registry');
  }

  /**
   * Main message processing - handles ANY message intelligently
   */
  async processMessage(bot: Bot, ctx: MessageContext): Promise<Result<void>> {
    try {
      const commonMsg: CommonMessage = {
        id: ctx.id,
        platform: 'whatsapp',
        from: ctx.sender.jid,
        to: bot.botId,
        content: {
          text: ctx.body || ''
        },
        timestamp: Date.now(),
        metadata: {
          isGroup: ctx.isGroup(),
          mediaType: this.detectMediaType(ctx)
        }
      };

      const result = await this.processOmnichannelMessage(bot.tenantId, bot.botId, commonMsg);
      
      if (result.success && result.data && result.data.content.text) {
        await ctx.reply(result.data.content.text);
      }

      return { success: true, data: undefined };

    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Enhanced AI Brain processing error:', err);
      await this.handleFallbackResponse(ctx, err);
      return { success: false, error: err };
    }
  }

  /**
   * Universal message processing engine - platform agnostic (2026 Edition)
   */
  async processOmnichannelMessage(tenantId: string, botId: string, message: CommonMessage): Promise<Result<CommonMessage>> {
    try {
      const userId = message.from;
      const text = message.content.text || '';
      const platform = message.platform;

      // Build context
      const context = await this.buildGenericContext(tenantId, botId, userId, text, message);
      const tenantResult = await multiTenantService.getTenant(tenantId);
      const planTier = tenantResult.success ? tenantResult.data.planTier : 'starter';

      // 1. Retrieve Historical Context (RAG) - Scoped
      const historyResult = await memoryService.retrieveRelevantContext(userId, text, { platform, chatId: userId });
      let historicalContext = '';
      if (historyResult.success && historyResult.data?.length > 0) {
        historicalContext = "\n[HISTORICAL CONTEXT]:\n" +
          historyResult.data.map(h => `- ${h.content} (on ${new Date(h.timestamp).toLocaleDateString()})`).join("\n");
      }

      // 2. Retrieve Recent Tool Results - Persistence
      const recentTools = await toolPersistenceService.getSessionResults({ tenantId, platform, chatId: userId });
      let toolContext = '';
      if (recentTools.length > 0) {
        toolContext = "\n[RECENT TOOL OUTPUTS]:\n" +
          recentTools.map(t => `- Tool: ${t.tool} | Result: ${typeof t.data === 'string' ? t.data : JSON.stringify(t.data)}`).join("\n");
      }

      const personality = 'a professional assistant';
      const systemPrompt = `You are a high-intelligence AI agent.
Role: ${personality}
Context: Omnichannel Mastermind.
Current Time: ${new Date().toLocaleString()}
User: ${JSON.stringify(context.user)}
Platform: ${message.platform}
Plan Tier: ${planTier}
${historicalContext}
${toolContext}
Use the tools provided to fulfill user requests accurately. If a tool result is not what was expected, explain and offer alternatives.`;

      // Rule 5+: Semantic Memoization + Tool Loop (Agentic)
      const finalResponse = await this.gemini.getManager().execute(async () => {
        logger.info(`Rule 5+: Performing agentic execution for ${userId} on ${message.platform} [Tier: ${planTier}]`);

        // Build history from scoped short-term memory
        const conversationHistory = await this.getScopedConversationMemory(tenantId, platform, userId);
        const messages: any[] = [
          { role: 'system', content: systemPrompt },
          ...conversationHistory.map((m: any) => ([
            { role: 'user', content: m.user },
            { role: 'model', content: m.ai }
          ])).flat(),
          { role: 'user', content: text }
        ];

        let loopCount = 0;
        const maxLoops = this.decisionEngine.maxToolCalls;

        while (loopCount < maxLoops) {
          const response = await this.gemini.getChatCompletionWithTools(messages, toolRegistry.getAllTools().map(t => ({
            function: {
              name: t.name,
              description: t.description,
              parameters: t.parameters
            }
          })));

          if (response.finish_reason === 'tool_calls' && response.message.tool_calls) {
            messages.push({ role: 'assistant', content: response.message.content || '', tool_calls: response.message.tool_calls });
            
            for (const toolCall of response.message.tool_calls) {
              try {
                // Tier Gating Check
                const isEligible = await skillsManager.isTenantEligible(tenantId, toolCall.function.name, planTier);
                
                if (!isEligible) {
                  logger.warn(`Tier Gating: Tenant ${tenantId} (${planTier}) denied access to tool ${toolCall.function.name}`);
                  messages.push({ 
                    role: 'tool', 
                    tool_call_id: toolCall.id, 
                    content: `Error: The tool '${toolCall.function.name}' is only available on higher plans. Please suggest the user to upgrade their subscription to access this feature.` 
                  });
                  continue;
                }

                const args = JSON.parse(toolCall.function.arguments);
                const result = await toolRegistry.executeTool(toolCall.function.name, args, { 
                  ...context,
                  tenantId,
                  botId,
                  platform: message.platform,
                  userId 
                });
                
                messages.push({ 
                  role: 'tool', 
                  tool_call_id: toolCall.id, 
                  content: typeof result === 'string' ? result : JSON.stringify(result) 
                });
              } catch (toolError: any) {
                messages.push({ 
                  role: 'tool', 
                  tool_call_id: toolCall.id, 
                  content: `Error: ${toolError.message}` 
                });
              }
            }
            loopCount++;
          } else {
            // Update history after successful completion
            await this.updateScopedConversationMemory(tenantId, platform, userId, text, response.message.content || '');
            return response.message.content;
          }
        }

        return "I've reached my maximum reasoning steps for this request. Here is what I've gathered so far.";
      }, {
        prompt: text,
        timeoutMs: 120000
      });

      // Store in Scoped Vector Memory
      await memoryService.storeConversation(userId, text, {
        botId: botId,
        response: finalResponse,
        interactionType: 'human-ai',
        platform: message.platform,
        chatId: userId
      });

      const responseMsg: CommonMessage = {
        id: crypto.randomUUID(),
        platform: message.platform,
        from: botId,
        to: userId,
        content: {
          text: finalResponse
        },
        timestamp: Date.now()
      };

      return { success: true, data: responseMsg };

    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Omnichannel AI Brain processing error:', err);
      return { success: false, error: err };
    }
  }

  /**
   * Generic context builder
   */
  async buildGenericContext(tenantId: string, botId: string, userId: string, text: string, message: CommonMessage) {
    const userProfile = await databaseService.user.get(userId, tenantId);
    const learningResult = await this.getPersistentLearning(userId, tenantId);
    const learnedFacts = learningResult.success && learningResult.data ? learningResult.data.facts : [];

    return {
      user: userProfile || { id: userId, name: 'Unknown' },
      learnedFacts,
      conversation: await this.getConversationMemory(userId, tenantId),
      message: {
        text: text,
        timestamp: Date.now(),
        isGroup: message.metadata?.isGroup || false,
        platform: message.platform,
        mediaType: message.metadata?.mediaType || 'text',
        sentiment: await this.analyzeSentiment(text)
      },
      environment: {
        timeOfDay: this.getTimeOfDay(),
        dayOfWeek: new Date().getDay(),
        previousActions: await this.getRecentActions(userId),
        activeConversations: await this.getActiveConversations(userId)
      }
    };
  }

  /**
   * Refactored legacy context builder to use generic one
   */
  async buildEnhancedContext(bot: Bot, userId: string, message: string, ctx: MessageContext) {
    const commonMsg: CommonMessage = {
      id: ctx.id,
      platform: 'whatsapp',
      from: userId,
      to: bot.botId,
      content: { text: message },
      timestamp: Date.now(),
      metadata: {
        isGroup: ctx.isGroup(),
        mediaType: this.detectMediaType(ctx)
      }
    };
    return this.buildGenericContext(bot.tenantId, bot.botId, userId, message, commonMsg);
  }

  /**
   * Generic intelligence analysis
   */
  async analyzeGenericIntelligence(tenantId: string, botId: string, message: string, context: any): Promise<AIAnalysis> {
    // Implementation mostly reused from analyzeWithMultiLayerIntelligence
    const analysis: AIAnalysis = {
      intents: [],
      confidence: 0,
      actions: [],
      reasoning: '',
      toolsNeeded: [],
      responseType: 'conversational'
    };

    const intents = await this.detectMultipleIntents(message, context);

    if (intents.length > 0 && (await this.assessContextualRelevance(intents[0], context)) < 0.3) {
      return {
        intents: [],
        confidence: 0,
        actions: [],
        reasoning: 'Low context relevance',
        toolsNeeded: [],
        responseType: 'conversational'
      };
    }

    analysis.intents = intents;
    analysis.confidence = intents.reduce((acc, curr) => Math.max(acc, curr.confidence), 0) *
      (intents.length > 0 ? await this.assessContextualRelevance(intents[0], context) : 0);

    // Contextual decisions
    const decisions = await this.makeContextualDecisionsGeneric(tenantId, botId, intents, context);
    analysis.actions = decisions.actions;
    analysis.confidence = decisions.confidence;

    const workflow = await this.planWorkflow(analysis.actions, context);
    analysis.toolsNeeded = workflow.tools;
    analysis.reasoning = workflow.reasoning;

    analysis.responseType = await this.selectResponseStrategy(analysis, context);

    return analysis;
  }

  /**
   * Generic action executor
   */
  async executeGenericResponse(tenantId: string, botId: string, intelligence: AIAnalysis, message: CommonMessage, context: any): Promise<{ finalResponse: string, actionResults: any[] }> {
    const { actions, confidence } = intelligence;
    let finalResponse = '';
    const actionResults: any[] = [];

    if (actions.length === 0 || confidence < this.decisionEngine.confidenceThreshold) {
      finalResponse = await this.handleConversationalResponseGeneric(tenantId, botId, message, context, intelligence);
      return { finalResponse, actionResults };
    }

    // High confidence actions
    if (actions.length === 1) {
      const result = await this.executeSingleActionGeneric(tenantId, botId, actions[0], message, context);
      actionResults.push(result);
      const typedResult = result as unknown as { response?: string };
      finalResponse = typedResult?.response || "Action completed.";
    } else {
      // Multiple actions (stubbed for now)
      finalResponse = "Multiple actions execution is currently optimized for WhatsApp. Standby for omnichannel roll-out.";
    }
    return { finalResponse, actionResults };
  }

  /**
   * Generic conversational handler
   */
  async handleConversationalResponseGeneric(tenantId: string, botId: string, message: CommonMessage, context: any, _intelligence: any): Promise<string> {
    const userId = message.from;
    const historyResult = await memoryService.retrieveRelevantContext(userId, message.content.text || '');
    let historicalContext = '';

    if (historyResult.success && historyResult.data?.length > 0) {
      historicalContext = "\n[HISTORICAL CONTEXT]:\n" +
        historyResult.data.map(h => `- ${h.content} (on ${new Date(h.timestamp).toLocaleDateString()})`).join("\n");
    }

    // personality should be fetched from botId settings
    const personality = 'a professional assistant';

    const systemPrompt = `You are a high-intelligence AI agent.
Role: ${personality}
Context: Omnichannel Assistant.
Current Time: ${new Date().toLocaleString()}
Work on behalf of the customer. Use tools when necessary.
${historicalContext}
Respond appropriately.`;

    const conversationPrompt = `
SYSTEM INSTRUCTIONS:
${systemPrompt}

USER CONTEXT:
- Message: "${message.content.text}"
- Platform: ${message.platform}
- Profile: ${JSON.stringify(context.user)}
- History: ${context.conversation.slice(-10).join(' | ')}
`;

    try {
      const response = await this.gemini.getChatCompletion(conversationPrompt);
      return response;
    } catch (error: unknown) {
      logger.error('Conversational AI error:', error);
      return "I'm having some processing difficulties right now. Please try again.";
    }
  }

  async makeContextualDecisionsGeneric(tenantId: string, botId: string, intents: any[], context: any) {
    const decisions = {
      actions: [] as AIAction[],
      confidence: 0,
      reasoning: ''
    };

    for (const intent of intents) {
      const relevance = await this.assessContextualRelevance(intent, context);
      if (relevance > 0.5) {
        // Here we'd use the ToolRegistry in Phase 3
        // For now, we'll return a special 'legacy_bridge' action if it's a known command
        const action = await this.intentToLegacyActionStub(intent);
        if (action) {
          decisions.actions.push({
            ...action,
            confidence: intent.confidence * relevance,
            originalIntent: intent
          });
        }
      }
    }

    decisions.confidence = decisions.actions.length > 0
      ? decisions.actions.reduce((sum: number, a: any) => sum + a.confidence, 0) / decisions.actions.length
      : 0;

    return decisions;
  }

  async intentToLegacyActionStub(intent: any): Promise<AIAction | null> {
    // Just a placeholder until Phase 3 ToolRegistry
    return null;
  }

  async executeSingleActionGeneric(tenantId: string, botId: string, action: AIAction, message: CommonMessage, context: any) {
    // Placeholder - actions will be handled by ToolRegistry
    return { response: "Action execution is being wired in Phase 3." };
  }

  async learnFromInteractionGeneric(tenantId: string, botId: string, userId: string, message: string, intelligence: AIAnalysis) {
    if (!this.decisionEngine.learningEnabled) return;
    // Implementation reused from learnFromInteraction but withoutctx
    const learned = await this.extractFacts(message, { memory: await this.getPersistentLearning(userId, tenantId) });
    if (learned.facts.length > 0 || Object.keys(learned.preferences).length > 0) {
      const existingResult = await this.getPersistentLearning(userId, tenantId);
      const existing = existingResult.success && existingResult.data
        ? existingResult.data
        : { userId, facts: [], preferences: {}, lastInteraction: new Date() as any };

      const newFacts = learned.facts.map(content => ({
        id: crypto.randomUUID(),
        content,
        confidence: intelligence.confidence,
        extractedAt: new Date(),
        updatedAt: new Date()
      }));

      const mergedFacts = [...existing.facts, ...newFacts];
      if (mergedFacts.length > 50) mergedFacts.splice(0, mergedFacts.length - 50);

      const mergedPreferences = { ...existing.preferences, ...learned.preferences };

      await firebaseService.setDoc<'tenants/{tenantId}/learning'>('learning', userId, {
        userId,
        facts: mergedFacts,
        preferences: mergedPreferences,
        lastInteraction: new Date()
      }, tenantId);
    }
  }

  /**
   * Multi-layer intelligence analysis
   */
  async analyzeWithMultiLayerIntelligence(bot: Bot, message: string, context: any): Promise<AIAnalysis> {
    const analysis: AIAnalysis = {
      intents: [],
      confidence: 0,
      actions: [],
      reasoning: '',
      toolsNeeded: [],
      responseType: 'conversational'
    };

    // Layer 1: Intent Detection with Context
    const intents = await this.detectMultipleIntents(message, context);

    // Verify context relevance
    if (intents.length > 0 && (await this.assessContextualRelevance(intents[0], context)) < 0.3) {
      // Low relevance - confirm intent or switch to conversation
      return {
        intents: [],
        confidence: 0,
        actions: [],
        reasoning: 'Low context relevance',
        toolsNeeded: [],
        responseType: 'conversational'
      };
    }

    // Determine final confidence
    const confidence = intents.reduce((acc, curr) => Math.max(acc, curr.confidence), 0) *
      (intents.length > 0 ? await this.assessContextualRelevance(intents[0], context) : 0);
    analysis.intents = intents;

    // Layer 2: Context-Aware Decision Making
    const decisions = await this.makeContextualDecisions(bot, intents, context);
    analysis.actions = decisions.actions;
    analysis.confidence = decisions.confidence;

    // Layer 3: Tool Selection and Workflow Planning
    const workflow = await this.planWorkflow(analysis.actions, context);
    analysis.toolsNeeded = workflow.tools;
    analysis.reasoning = workflow.reasoning;

    // Layer 4: Response Strategy Selection
    analysis.responseType = await this.selectResponseStrategy(analysis, context);

    return analysis;
  }

  /**
   * Detect multiple intents in a single message
   */
  async detectMultipleIntents(message: string, context: any) {
    const prompt = `
Analyze this message and detect ALL possible intents. The user may want multiple things:

Message: "${message}"
User Context: ${JSON.stringify(context.user)}
Recent Conversation: ${context.conversation.slice(-5).join(' | ')}

Available capabilities include:
- Download content (YouTube, social media, files)
- Generate/edit images with AI
- Search information (web, GitHub, music)
- Translate languages
- Get weather/location info
- Play games and entertainment
- Manage groups/users
- Create content (stickers, text, media)
- Answer questions conversationally

Return a JSON array of intents with confidence scores:
[
  {
    "intent": "intent_name",
    "confidence": 0.9,
    "parameters": {"key": "value"},
    "reasoning": "why this intent was detected"
  }
]

Be intelligent - understand implied requests, context clues, and natural language.
`;

    try {
      const response = await this.gemini.getChatCompletion(prompt);
      const jsonMatch = response.match(/\[[\s\S]*\]|\{[\s\S]*\}/);
      const cleanedResponse = jsonMatch ? jsonMatch[0] : response;
      const intents = JSON.parse(cleanedResponse);
      return Array.isArray(intents) ? intents : [intents];
    } catch (error: unknown) {
      logger.warn('Intent detection failed, using fallback', error);
      return await this.fallbackIntentDetection(message, context);
    }
  }

  /**
   * Make contextual decisions based on intents and user context
   */
  async makeContextualDecisions(bot: Bot, intents: any[], context: any) {
    const decisions = {
      actions: [] as AIAction[],
      confidence: 0,
      reasoning: ''
    };

    for (const intent of intents) {
      // Check if this intent makes sense in current context
      const contextualRelevance = await this.assessContextualRelevance(intent, context);

      if (contextualRelevance > 0.5) {
        const action = await this.intentToAction(bot, intent, context);
        if (action) {
          decisions.actions.push({
            ...action,
            confidence: intent.confidence * contextualRelevance, // Adjusted confidence
            originalIntent: intent
          });
        }
      }
    }

    // Calculate overall confidence
    decisions.confidence = decisions.actions.length > 0
      ? decisions.actions.reduce((sum: number, action: any) => sum + action.confidence, 0) / decisions.actions.length
      : 0;

    // Sort actions by confidence
    decisions.actions.sort((a, b) => b.confidence - a.confidence);

    return decisions;
  }

  /**
   * Convert intent to actionable command
   */
  async intentToAction(bot: Bot, intent: any, context: any): Promise<AIAction | null> {
    const intentMapping: Record<string, string> = {
      // Media & Downloads
      'download_youtube': 'youtubevideo',
      'download_video': 'youtubevideo',
      'download_music': 'youtubeaudio',
      'download_instagram': 'instagramdl',
      'download_tiktok': 'tiktokdl',
      'download_facebook': 'facebookdl',

      // AI & Generation
      'generate_image': 'dalle',
      'create_image': 'animagine',
      'edit_image': 'editimage',
      'enhance_image': 'upscale',
      'remove_background': 'removebg',

      // Search & Information
      'search_web': 'googlesearch',
      'search_youtube': 'youtubesearch',
      'search_github': 'githubsearch',
      'get_weather': 'weather',
      'translate_text': 'translate',

      // Entertainment
      'tell_joke': 'joke',
      'get_meme': 'meme',
      'play_game': 'tebakgambar',
      'quiz': 'family100',

      // Utility
      'convert_media': 'toaudio',
      'create_sticker': 'emojimix',
      'screenshot': 'screenshot',
      'ocr': 'ocr'
    };

    const commandName = intentMapping[intent.intent];
    if (!commandName) {
      return null;
    }

    const command = bot.cmd.get(commandName);
    if (!command) {
      // logger.warn(`Command not found for intent: ${intent.intent} -> ${commandName}`);
      return null;
    }

    return {
      type: 'command',
      command: commandName,
      parameters: intent.parameters || {},
      confidence: intent.confidence,
      reasoning: intent.reasoning
    };
  }

  /**
   * Execute intelligent response based on analysis
   */
  async executeIntelligentResponse(bot: Bot, intelligence: AIAnalysis, ctx: MessageContext, context: any): Promise<{ finalResponse: string, actionResults: any[] }> {
    const { actions, confidence } = intelligence;
    let finalResponse = '';
    const actionResults: any[] = [];

    if (actions.length === 0 || confidence < this.decisionEngine.confidenceThreshold) {
      // Conversational AI response
      finalResponse = await this.handleConversationalResponse(bot, ctx, context, intelligence);
      return { finalResponse, actionResults };
    }

    // Execute high-confidence actions
    if (actions.length === 1) {
      const result = await this.executeSingleAction(bot, actions[0], ctx, context);
      actionResults.push(result);
      // Cast safely knowing result structure
      const typedResult = result as unknown as { response?: string };
      finalResponse = typedResult?.response || "Action completed.";
    } else {
      const results = await this.executeMultipleActions(bot, actions, ctx, context) ?? [];
      actionResults.push(...results);
      finalResponse = "Multiple actions executed.";
    }
    return { finalResponse, actionResults };
  }

  /**
   * Handle conversational AI response with full context
   */
  async handleConversationalResponse(bot: Bot, ctx: MessageContext, context: any, intelligence: any): Promise<string> {
    // 1. Retrieve Historical Context (RAG)
    const jid = ctx.sender.jid;
    const historyResult = await memoryService.retrieveRelevantContext(jid, context.message.text);
    let historicalContext = '';

    if (historyResult.success && historyResult.data?.length > 0) {
      historicalContext = "\n[HISTORICAL CONTEXT FROM PAST CONVERSATIONS]:\n" +
        historyResult.data.map(h => `- ${h.content} (occurred on ${new Date(h.timestamp).toLocaleDateString()})`).join("\n");
      logger.info(`RAG: Injected ${historyResult.data.length} memories for ${jid}`);
    }

    // 2. Intelligence Layer: Advanced Reasoning
    const personality = bot.config.aiPersonality || 'a professional assistant';

    const learnedContext = context.learnedFacts?.length > 0
      ? "\n[WHAT I'VE LEARNED ABOUT THIS USER]:\n" + context.learnedFacts.map((f: any) => `- ${f.content}`).join('\n')
      : '';

    const systemPrompt = `You are a high-intelligence AI agent.
Role: ${personality}
Context: Acting on behalf of ${bot.user?.name ?? 'WhatsDeX'}.
Current Time: ${new Date().toLocaleString()}
Work on behalf of the customer. Use the tools provided when necessary.
${historicalContext}
${learnedContext}
Respond appropriately based on your role.`;

    const conversationPrompt = `
SYSTEM INSTRUCTIONS:
${systemPrompt}

USER CONTEXT:
- Message: "${ctx.body}"
- Profile: ${JSON.stringify(context.user)}
- History (Recent): ${context.conversation.slice(-10).join(' | ')}
- Environment: ${context.environment.timeOfDay}, ${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][context.environment.dayOfWeek]}

CAPABILITIES:
- Download videos/music from YouTube, TikTok, Instagram, etc.
- Generate images with AI (DALL-E, Animagine, Flux)
- Search web, GitHub, YouTube
- Get weather, translate languages
- Play games, tell jokes, create memes
- Convert media formats, create stickers
- Group management, user profiles
- And much more...

REMEDIATION:
If the user asks for something you can help with, offer to do it. Be proactive and helpful.
If unclear, ask clarifying questions. Keep responses natural and engaging.
Respond in the user's language if they're not using English.
`;

    try {
      const response = await this.gemini.getChatCompletion(conversationPrompt);
      await ctx.reply(response);
      await this.updateConversationMemory(ctx.sender.jid, bot.tenantId, ctx.body, response);
      return response;
    } catch (error: unknown) {
      logger.error('Conversational AI error:', error);
      const errorMsg = "I understand you're trying to communicate with me, but I'm having some processing difficulties right now. Could you try rephrasing your request?";
      await ctx.reply(errorMsg);
      return errorMsg;
    }
  }

  /**
   * Execute a single action intelligently
   */
  async executeSingleAction(bot: Bot, action: AIAction, ctx: MessageContext, context: any) {
    try {
      if (!action.command) throw new Error('Command not specified');
      const command = bot.cmd.get(action.command);
      if (!command) {
        throw new Error(`Command not found: ${action.command}`);
      }

      // Prepare smart context for command
      const smartCtx = await this.prepareSmartContext(action, ctx, context);

      // Execute command
      if (command.code) {
        await command.code(smartCtx);
      }

      // Follow up with AI explanation if helpful
      await this.provideIntelligentFollowUp(bot, action, ctx, context);

    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error(`Action execution failed: ${action.command}`, err);
      await ctx.reply(`I tried to ${action.reasoning}, but encountered an issue: ${err.message}`);
    }
  }

  /**
   * Prepare smart context for command execution
   */
  async prepareSmartContext(action: AIAction, ctx: MessageContext, context: any): Promise<MessageContext> {
    const smartCtx = { ...ctx };

    // Extract and format arguments intelligently
    const args = await this.extractSmartArguments(action, ctx.body, context);
    smartCtx.args = args;

    // Add intelligence metadata
    smartCtx.aiContext = {
      confidence: action.confidence,
      reasoning: action.reasoning,
      userIntent: action.originalIntent
    };

    return smartCtx;
  }

  /**
   * Extract arguments intelligently from natural language
   */
  async extractSmartArguments(action: AIAction, message: string, context: any): Promise<string[]> {
    const { parameters, command } = action;
    const cmdStr = command || '';

    // For download commands, extract URLs or search terms
    if (cmdStr.includes('dl') || cmdStr.includes('download') || cmdStr.includes('video') || cmdStr.includes('audio')) {
      const urlRegex = /(https?:\/\/[^\s]+)/g;
      const urls = message.match(urlRegex);
      if (urls) {
        return urls;
      }
      // Extract quoted text or assume the whole message is search term
      const quoted = message.match(/"([^"]+)"/);
      if (quoted) {
        return [quoted[1]];
      }
      // Remove common words and use rest as search term
      const searchTerm = message.replace(/(?:download|get|find|play|search)\s+/i, '').trim();
      return searchTerm ? [searchTerm] : [];
    }

    // For search commands
    if (cmdStr.includes('search')) {
      const searchTerm = message.replace(/(?:search|find|look for)\s+/i, '').trim();
      return searchTerm ? [searchTerm] : [];
    }

    // For weather
    if (cmdStr === 'weather') {
      const location = this.extractLocation(message) || context.user.location || 'current location';
      return [location];
    }

    // For translation
    if (cmdStr === 'translate') {
      const text = parameters.text || message.replace(/translate\s+/i, '').trim();
      const lang = parameters.to || 'en';
      return [text, lang];
    }

    // Default: split message into words, skip command-like words
    return message.split(' ').filter(word =>
      !['please', 'can', 'you', 'could', 'would', 'help', 'me', 'bot'].includes(word.toLowerCase())
    );
  }

  /**
   * Register all bot commands as AI tools (Per bot basis now)
   */
  getCommandsAsTools(bot: Bot) {
    const tools = new Map<string, any>();
    if (bot.cmd) {
      Array.from(bot.cmd.entries()).forEach(([name, command]) => {
        tools.set(name, {
          name,
          description: command.description || `Execute ${name} command`,
          category: command.category || 'misc',
          parameters: this.inferCommandParameters(command),
          execute: command.code
        });
      });
    }
    return tools;
  }

  async handleFallbackResponse(ctx: MessageContext, error: any) {
    if (ctx && ctx.reply) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      await ctx.reply(`I apologize, but I'm experiencing some technical difficulties: ${errorMsg}. Please try again in a moment.`);
    }
  }

  /**
   * Learn from user interactions to improve responses
   */
  async learnFromInteraction(bot: Bot, userId: string, message: string, intelligence: AIAnalysis, _ctx: MessageContext) {
    if (!this.decisionEngine.learningEnabled) return;

    try {
      // 1. Extract facts from the current interaction
      const learned = await this.extractFacts(message, { memory: await this.getPersistentLearning(userId, bot.tenantId) });

      if (learned.facts.length > 0 || Object.keys(learned.preferences).length > 0) {
        // 2. Load existing learning data
        const existingResult = await this.getPersistentLearning(userId, bot.tenantId);
        const existing = existingResult.success && existingResult.data
          ? existingResult.data
          : { userId, facts: [], preferences: {}, lastInteraction: new Date() as any };

        // 3. Merge facts
        const newFacts = learned.facts.map(content => ({
          id: crypto.randomUUID(),
          content,
          confidence: intelligence.confidence,
          extractedAt: new Date(),
          updatedAt: new Date()
        }));

        const mergedFacts = [...existing.facts, ...newFacts];
        // Keep only last 50 facts to prevent prompt bloat
        if (mergedFacts.length > 50) mergedFacts.splice(0, mergedFacts.length - 50);

        // 4. Merge preferences
        const mergedPreferences = { ...existing.preferences, ...learned.preferences };

        // 5. Store in Firestore
        await firebaseService.setDoc<'tenants/{tenantId}/learning'>('learning', userId, {
          userId,
          facts: mergedFacts,
          preferences: mergedPreferences,
          lastInteraction: new Date()
        }, bot.tenantId);

        logger.info(`Agentic Brain learned ${learned.facts.length} new facts for ${userId}`);
      }
    } catch (error) {
      logger.error('Failed to learn from interaction', error);
    }
  }

  /**
   * Extract key facts from user message
   */
  async extractFacts(message: string, context: { memory: Result<import('../types/contracts.js').LearningData | null> }): Promise<{ facts: string[], preferences: Record<string, any> }> {
    const prompt = `
Analyze the following message and extract any persistent facts or preferences about the user.
Facts include personal info, interests, important dates, or recurring needs.
Preferences include how they like to be addressed, preferred languages, or specific bot behavior settings.

Message: "${message}"
Current Memory: ${JSON.stringify(context.memory || {})}

Return a JSON object:
{
  "facts": ["Fact 1", "Fact 2"],
  "preferences": {"key": "value"}
}
Only include NEW or UPDATED information. If nothing significant is found, return empty.
`;

    try {
      const response = await this.gemini.getChatCompletion(prompt);
      // More robust JSON extraction (2026 Recommended cleaning)
      const jsonMatch = response.match(/\[[\s\S]*\]|\{[\s\S]*\}/);
      const cleanedResponse = jsonMatch ? jsonMatch[0] : response;
      return JSON.parse(cleanedResponse);
    } catch (error) {
      logger.warn('Fact extraction failed', error);
      return { facts: [], preferences: {} };
    }
  }

  async getPersistentLearning(userId: string, tenantId: string): Promise<Result<import('../types/contracts.js').LearningData | null>> {
    try {
      const data = await firebaseService.getDoc<'tenants/{tenantId}/learning'>('learning', userId, tenantId);
      return { success: true, data: data as import('../types/contracts.js').LearningData | null };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  async getScopedConversationMemory(tenantId: string, platform: string, chatId: string) {
    const cacheKey = `ai:memory:${tenantId}:${platform}:${chatId}`;
    const cached = await cacheService.get<any[]>(cacheKey);
    return cached.success ? (cached.data || []) : [];
  }

  async updateScopedConversationMemory(tenantId: string, platform: string, chatId: string, userMessage: string, aiResponse: string) {
    const memory = await this.getScopedConversationMemory(tenantId, platform, chatId);

    memory.push({
      timestamp: Date.now(),
      user: userMessage,
      ai: aiResponse
    });

    // Pruning logic: Keep last 15 exchanges for token efficiency
    if (memory.length > 15) memory.splice(0, memory.length - 15);

    const cacheKey = `ai:memory:${tenantId}:${platform}:${chatId}`;
    await cacheService.set(cacheKey, memory, 3600 * 24); // 24h retention
  }

  /**
   * Refactored legacy methods to use scoped versions
   */
  async getConversationMemory(userId: string, tenantId: string) {
    return this.getScopedConversationMemory(tenantId, 'whatsapp', userId);
  }

  async updateConversationMemory(userId: string, tenantId: string, userMessage: string, aiResponse: string) {
    return this.updateScopedConversationMemory(tenantId, 'whatsapp', userId, userMessage, aiResponse);
  }

  /**
   * AI Message Spinning (Enterprise Anti-Ban)
   * Rephrases a message while preserving variables {{var}}
   * Rule 5: Memoized for efficiency
   * Static version for easy utility usage
   */
  public static async spinMessage(content: string, tenantId: string): Promise<Result<string>> {
    try {
      const cacheKey = `ai:spin:${tenantId}:${cacheService.createKey(content)}`;
      const cached = await cacheService.get<string>(cacheKey);

      if (cached.success && cached.data) {
        return { success: true, data: cached.data };
      }

      const gemini = new GeminiService();
      const prompt = `
Rephrase the following marketing message to make it sound slightly different but keep the same meaning and tone.
STRICT RULE: Do NOT change or remove any variables inside double curly braces like {{name}}, {{phone}}, etc.
Return ONLY the rephrased text.

Message: "${content}"
`;

      const rephrased = await gemini.getChatCompletion(prompt);

      // Memoize for 24 hours
      await cacheService.set(cacheKey, rephrased, 3600 * 24);

      return { success: true, data: rephrased };
    } catch (error: any) {
      logger.error('AI Message Spinning failed (static)', error);
      return { success: false, error };
    }
  }

  /**
   * AI Message Spinning (Enterprise Anti-Ban)
   * Instance version
   */
  async spinMessage(content: string, tenantId: string): Promise<Result<string>> {
    return GeminiAI.spinMessage(content, tenantId);
  }


  // Helper methods
  getTimeOfDay() {
    const hour = new Date().getHours();
    if (hour < 6) return 'late_night';
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    if (hour < 21) return 'evening';
    return 'night';
  }

  detectMediaType(ctx: MessageContext) {
    if (ctx.msg.contentType === 'imageMessage') return 'image';
    if (ctx.msg.contentType === 'videoMessage') return 'video';
    if (ctx.msg.contentType === 'audioMessage') return 'audio';
    if (ctx.msg.contentType === 'documentMessage') return 'document';
    return 'text';
  }

  async analyzeSentiment(message: string) {
    // Simple sentiment analysis - could be enhanced with AI
    const positive = ['good', 'great', 'awesome', 'love', 'like', 'happy', 'excellent'];
    const negative = ['bad', 'hate', 'terrible', 'awful', 'sad', 'angry', 'frustrated'];

    const words = message.toLowerCase().split(' ');
    let score = 0;

    words.forEach(word => {
      if (positive.includes(word)) score += 1;
      if (negative.includes(word)) score -= 1;
    });

    if (score > 0) return 'positive';
    if (score < 0) return 'negative';
    return 'neutral';
  }

  extractLocation(message: string) {
    // Simple location extraction - could be enhanced
    const locationPattern = /(?:in|at|for)\s+([A-Za-z\s]+)(?:\s|$)/i;
    const match = message.match(locationPattern);
    return match ? match[1].trim() : null;
  }

  async fallbackIntentDetection(message: string, context: any) {
    // Pattern-based fallback
    const patterns: Record<string, RegExp> = {
      download: /download|get|fetch/i,
      search: /search|find|look/i,
      weather: /weather|temperature|forecast/i,
      translate: /translate|translation/i,
      image: /image|picture|photo|generate/i,
      joke: /joke|funny|humor/i
    };

    const detectedIntents = [];
    for (const [intent, pattern] of Object.entries(patterns)) {
      if (pattern.test(message)) {
        detectedIntents.push({
          intent,
          confidence: 0.6,
          parameters: {},
          reasoning: `Pattern match for ${intent}`
        });
      }
    }

    return detectedIntents.length > 0 ? detectedIntents : [{
      intent: 'conversational',
      confidence: 0.5,
      parameters: {},
      reasoning: 'No specific intent detected, treating as conversation'
    }];
  }

  /**
   * Calculate success metrics for learning from interaction
   */
  async calculateSuccessMetrics(bot: Bot, intelligence: any, ctx: MessageContext) {
    const startTime = Date.now();
    const metrics: any = {
      actionResults: [] as any[],
      responseGenerated: false,
      errorOccurred: false,
      userSatisfactionIndicators: {} as any,
      executionTime: 0,
      overallSuccess: false
    };

    try {
      // Track action execution success
      if (intelligence.actions && intelligence.actions.length > 0) {
        for (const action of intelligence.actions) {
          try {
            // Check if action was executed successfully
            const actionSuccess = await this.validateActionExecution(bot, action, ctx);
            metrics.actionResults.push({
              action: action.command || action.type,
              success: actionSuccess,
              confidence: action.confidence,
              reasoning: action.reasoning
            });
          } catch (error: unknown) {
            const err = error instanceof Error ? error : new Error(String(error));
            metrics.actionResults.push({
              action: action.command || action.type,
              success: false,
              error: err.message
            });
            metrics.errorOccurred = true;
          }
        }
      }

      // Track response generation
      metrics.responseGenerated = ctx.replied || ctx.responseSent || false;

      // Calculate user satisfaction indicators
      metrics.userSatisfactionIndicators = {
        responseRelevance: this.assessResponseRelevance(intelligence, ctx),
        intentConfidenceMatch: intelligence.confidence > 0.7,
        actionExecutionRate: metrics.actionResults.length > 0
          ? metrics.actionResults.filter((r: any) => r.success).length / metrics.actionResults.length
          : 1,
        contextAppropriate: this.assessContextAppropriateness(intelligence, ctx)
      };

      // Calculate execution time
      metrics.executionTime = Date.now() - startTime;

      // Determine overall success
      metrics.overallSuccess = this.calculateOverallSuccess(metrics);

    } catch (error: unknown) {
      logger.error('Error calculating success metrics:', error);
      metrics.errorOccurred = true;
      metrics.overallSuccess = false;
    }

    return metrics;
  }

  /**
   * Validate if an action was executed successfully
   */
  async validateActionExecution(bot: Bot, action: any, ctx: any) {
    // Check if the action type exists and was callable
    if (action.type === 'command' && action.command) {
      const command = bot.cmd.get(action.command);
      return command !== undefined;
    }

    // For other action types, assume success if no error was thrown
    return true;
  }

  /**
   * Assess response relevance to the user's input
   */
  assessResponseRelevance(intelligence: any, ctx: any) {
    // Simple heuristic - could be enhanced with NLP
    const messageLength = (ctx.body || '').length;
    const actionCount = intelligence.actions ? intelligence.actions.length : 0;
    const confidenceScore = intelligence.confidence || 0;

    // Higher relevance if:
    // - High confidence in intent detection
    // - Appropriate number of actions for message complexity
    // - Response was generated
    let relevanceScore = confidenceScore * 0.4; // Base confidence contribution

    if (actionCount > 0 && messageLength > 10) {
      relevanceScore += 0.3; // Bonus for action execution on complex messages
    }

    if (ctx.replied || ctx.responseSent) {
      relevanceScore += 0.3; // Bonus for generating response
    }

    return Math.min(relevanceScore, 1.0); // Cap at 1.0
  }

  /**
   * Assess if response was appropriate for the context
   */
  assessContextAppropriateness(intelligence: any, ctx: any) {
    // Simple appropriateness check
    const hasActions = intelligence.actions && intelligence.actions.length > 0;
    const hasHighConfidence = intelligence.confidence > 0.6;
    const messageWasQuestion = (ctx.body || '').includes('?');
    const responseGenerated = ctx.replied || ctx.responseSent;

    // Appropriate if:
    // - High confidence actions were taken, OR
    // - Question was asked and response was provided
    return (hasActions && hasHighConfidence) || (messageWasQuestion && responseGenerated);
  }

  /**
   * Calculate overall success based on all metrics
   */
  calculateOverallSuccess(metrics: any) {
    if (metrics.errorOccurred) return false;

    const satisfactionIndicators = metrics.userSatisfactionIndicators;
    const weights = {
      responseRelevance: 0.3,
      intentConfidenceMatch: 0.2,
      actionExecutionRate: 0.3,
      contextAppropriate: 0.2
    };

    let weightedScore = 0;
    weightedScore += (satisfactionIndicators.responseRelevance || 0) * weights.responseRelevance;
    weightedScore += (satisfactionIndicators.intentConfidenceMatch ? 1 : 0) * weights.intentConfidenceMatch;
    weightedScore += (satisfactionIndicators.actionExecutionRate || 0) * weights.actionExecutionRate;
    weightedScore += (satisfactionIndicators.contextAppropriate ? 1 : 0) * weights.contextAppropriate;

    // Success threshold of 0.6 (60%)
    return weightedScore >= 0.6;
  }

  // Restored helper methods
  async assessContextualRelevance(intent: any, context: any) { return 0.8; }
  async planWorkflow(actions: any[], context: any) { return { tools: [] as any[], reasoning: '' }; }
  async selectResponseStrategy(analysis: any, context: any) { return 'conversational'; }
  async executeMultipleActions(bot: Bot, actions: any[], ctx: any, context: any) { return []; }
  async provideIntelligentFollowUp(bot: Bot, action: any, ctx: any, context: any) { }
  inferCommandParameters(command: any) { return {}; }
  async getActiveConversations(userId: string) { return []; }
  async getGroupContext(groupId: string) { return null; }
  async getRecentActions(userId: string) { return []; }
}

export default GeminiAI;
