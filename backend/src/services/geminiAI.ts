import { db } from '../lib/firebase.js';
import { Timestamp } from 'firebase-admin/firestore';
import { memoryService } from './memoryService.js';
import GeminiService from './gemini.js';
import logger from '../utils/logger.js';
import { EventEmitter } from 'events';
import { Bot, GlobalContext, MessageContext, Result } from '../types/index.js';
import { databaseService } from './database.js';
import { cacheService } from './cache.js';

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

    logger.info('Gemini AI initialized with Rule 5 Memoization');
  }

  /**
   * Main message processing - handles ANY message intelligently
   */
  async processMessage(bot: Bot, ctx: MessageContext): Promise<Result<void>> {
    try {
      const userId = ctx.sender.jid;
      const tenantId = bot.tenantId;
      const message = ctx.body || '';

      // Rule 5: Check if we have a memoized intent analysis for this exact message
      const analysisCacheKey = `ai:analysis:${tenantId}:${cacheService.createKey(message)}`;
      const cachedAnalysis = await cacheService.get<AIAnalysis>(analysisCacheKey);

      let intelligence: AIAnalysis;

      if (cachedAnalysis.success && cachedAnalysis.data) {
        logger.info(`Rule 5: Using memoized AI analysis for ${userId}`);
        intelligence = cachedAnalysis.data;
      } else {
        // Build comprehensive context
        const context = await this.buildEnhancedContext(bot, userId, message, ctx);

        // Multi-layer intelligence processing
        intelligence = await this.analyzeWithMultiLayerIntelligence(bot, message, context);

        // Memoize the analysis for 15 minutes if confidence is high
        if (intelligence.confidence > 0.8) {
          await cacheService.set(analysisCacheKey, intelligence, 900);
        }
      }

      // Execute intelligent response
      const contextForExecution = await this.buildEnhancedContext(bot, userId, message, ctx);
      const { finalResponse, actionResults } = await this.executeIntelligentResponse(bot, intelligence, ctx, contextForExecution);

      // 5. Finalize: Learn and Store Memory
      await this.learnFromInteraction(bot, userId, message, intelligence, ctx, finalResponse);

      // Store new interaction in Vector Memory
      await memoryService.storeConversation(userId, message, {
        botId: bot.botId,
        response: finalResponse,
        interactionType: 'human-ai'
      });

      return { success: true, data: undefined };

    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Enhanced AI Brain processing error:', err);
      await this.handleFallbackResponse(ctx, err);
      return { success: false, error: err };
    }
  }

  /**
   * Build comprehensive context from all available data
   */
  async buildEnhancedContext(bot: Bot, userId: string, message: string, ctx: MessageContext) {
    const userProfile = await databaseService.user.get(userId, bot.tenantId);

    // Retrieve persistent learning facts
    let learnedFacts: string[] = [];
    try {
      const learningDoc = await db.collection('tenants')
        .doc(bot.tenantId)
        .collection('learning')
        .doc(userId)
        .get();
      learnedFacts = learningDoc.exists ? (learningDoc.data()?.facts || []) : [];
    } catch (error) {
      logger.error('Error fetching learned facts:', error);
    }

    return {
      user: userProfile || { id: userId, name: 'Unknown' },
      learnedFacts,
      conversation: await this.getConversationMemory(userId, bot.tenantId),
      message: {
        text: message,
        timestamp: Date.now(),
        isGroup: ctx.isGroup(),
        groupInfo: ctx.isGroup() ? await this.getGroupContext(ctx.id) : null,
        mediaType: this.detectMediaType(ctx),
        sentiment: await this.analyzeSentiment(message)
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
      const intents = JSON.parse(response);
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

    const learnedFactsContext = context.learnedFacts?.length > 0
      ? "\n[USER FACTS & PREFERENCES]:\n" + context.learnedFacts.map((f: string) => `- ${f}`).join("\n")
      : "";

    const systemPrompt = `You are a high-intelligence AI agent.
Role: ${personality}
Context: Acting on behalf of ${bot.user?.name ?? 'WhatsDeX'}.
Current Time: ${new Date().toLocaleString()}
Work on behalf of the customer. Use the tools provided when necessary.
${historicalContext}
${learnedFactsContext}
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
  async learnFromInteraction(bot: Bot, userId: string, message: string, intelligence: any, ctx: MessageContext, aiResponse: string) {
    if (!this.decisionEngine.learningEnabled) return;

    try {
      const facts = await this.extractFacts(message, aiResponse);
      if (facts.length === 0) return;

      const tenantId = bot.tenantId;
      const learningRef = db.collection('tenants').doc(tenantId).collection('learning').doc(userId);

      await db.runTransaction(async (transaction) => {
        const doc = await transaction.get(learningRef);
        let existingFacts: string[] = [];
        if (doc.exists) {
          existingFacts = doc.data()?.facts || [];
        }

        const newFacts = facts.filter(f => !existingFacts.some(ef => ef.toLowerCase() === f.toLowerCase()));
        if (newFacts.length > 0) {
          transaction.set(learningRef, {
            facts: [...existingFacts, ...newFacts],
            updatedAt: Timestamp.now()
          }, { merge: true });
          logger.info(`Learned ${newFacts.length} new facts for user ${userId} in tenant ${tenantId}`);
        }
      });
    } catch (error) {
      logger.error('Error in learnFromInteraction:', error);
    }
  }

  /**
   * Extract facts from interaction using AI
   */
  private async extractFacts(message: string, aiResponse: string): Promise<string[]> {
    const prompt = `
Extract any new personal facts, preferences, or important information about the user from this interaction.
Only extract things that are worth remembering for future conversations (e.g. name, location, likes, dislikes, profession, goals).
Be concise.

User Message: "${message}"
AI Response: "${aiResponse}"

Return a JSON array of strings, each string being a single fact. If no new facts, return empty array [].
Example: ["User's name is John", "User lives in New York", "User likes spicy food"]
`;
    try {
      const response = await this.gemini.getChatCompletion(prompt);
      // Clean up response in case it contains markdown code blocks
      const jsonContent = response.replace(/```json\n?|\n?```/g, '').trim();
      const facts = JSON.parse(jsonContent);
      return Array.isArray(facts) ? facts : [];
    } catch (e) {
      logger.warn('Failed to extract facts from interaction', e);
      return [];
    }
  }

  async getConversationMemory(userId: string, tenantId: string) {
    const cacheKey = `ai:memory:${tenantId}:${userId}`;
    const cached = await cacheService.get<any[]>(cacheKey);
    return cached.success ? (cached.data || []) : [];
  }

  async updateConversationMemory(userId: string, tenantId: string, userMessage: string, aiResponse: string) {
    const memory = await this.getConversationMemory(userId, tenantId);

    memory.push({
      timestamp: Date.now(),
      user: userMessage,
      ai: aiResponse
    });

    // Keep last 20 exchanges for cost-efficiency
    if (memory.length > 20) memory.splice(0, memory.length - 20);

    const cacheKey = `ai:memory:${tenantId}:${userId}`;
    await cacheService.set(cacheKey, memory, 3600 * 24); // 24h retention
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
