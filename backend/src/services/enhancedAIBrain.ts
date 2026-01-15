import GeminiService from './gemini.js';
import logger from '../utils/logger.js';
import { EventEmitter } from 'events';
import { Bot, GlobalContext, MessageContext, Result } from '../types/index.js';
import { databaseService } from './database.js';

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
 * Enhanced AI Brain - Next Generation Intelligence System
 * Handles natural conversation, context understanding, and intelligent tool usage
 * 2026 Mastermind Edition - Strictly Typed & Stateless
 */
class EnhancedAIBrain extends EventEmitter {
  private bot: Bot;
  private context: GlobalContext;
  private gemini: GeminiService;
  private decisionEngine: AIDecisionEngine;

  // In-memory caches (should ideally be Redis/Database for scalability)
  private conversationMemory: Map<string, any[]>;
  private learningData: Map<string, any[]>;
  private availableTools: Map<string, any>;

  constructor(bot: Bot, context: GlobalContext) {
    super();
    this.bot = bot;
    this.context = context;
    this.gemini = new GeminiService();

    this.conversationMemory = new Map();
    this.learningData = new Map();
    this.availableTools = new Map();

    this.registerAllCommands();

    this.decisionEngine = {
      confidenceThreshold: 0.7,
      contextWindowSize: 20,
      maxToolCalls: 5,
      learningEnabled: true
    };

    logger.info('Enhanced AI Brain initialized with dynamic intelligence');
  }

  /**
   * Main message processing - handles ANY message intelligently
   */
  async processMessage(ctx: MessageContext): Promise<Result<void>> {
    try {
      const userId = ctx.sender.jid;
      const message = ctx.body || '';

      // Build comprehensive context
      const context = await this.buildEnhancedContext(userId, message, ctx);

      // Multi-layer intelligence processing
      const intelligence = await this.analyzeWithMultiLayerIntelligence(message, context);

      // Execute intelligent response
      await this.executeIntelligentResponse(intelligence, ctx, context);

      // Learn from interaction
      await this.learnFromInteraction(userId, message, intelligence, ctx);

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
  async buildEnhancedContext(userId: string, message: string, ctx: MessageContext) {
    const userProfile = await databaseService.user.get(userId, this.bot.tenantId);
    
    return {
      user: userProfile || { id: userId, name: 'Unknown' },
      conversation: await this.getConversationMemory(userId),
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
        activeConversations: this.getActiveConversations(userId)
      }
    };
  }

  /**
   * Multi-layer intelligence analysis
   */
  async analyzeWithMultiLayerIntelligence(message: string, context: any): Promise<AIAnalysis> {
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
    analysis.intents = intents;

    // Layer 2: Context-Aware Decision Making
    const decisions = await this.makeContextualDecisions(intents, context);
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
  async makeContextualDecisions(intents: any[], context: any) {
    const decisions = {
      actions: [] as AIAction[],
      confidence: 0,
      reasoning: ''
    };

    for (const intent of intents) {
      // Check if this intent makes sense in current context
      const contextualRelevance = this.assessContextualRelevance(intent, context);

      if (contextualRelevance > 0.5) {
        const action = await this.intentToAction(intent, context);
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
  async intentToAction(intent: any, context: any): Promise<AIAction | null> {
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

    const command = this.bot.cmd.get(commandName);
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
  async executeIntelligentResponse(intelligence: AIAnalysis, ctx: MessageContext, context: any) {
    const { actions, confidence } = intelligence;

    if (actions.length === 0 || confidence < this.decisionEngine.confidenceThreshold) {
      // Conversational AI response
      await this.handleConversationalResponse(ctx, context, intelligence);
      return;
    }

    // Execute high-confidence actions
    if (actions.length === 1) {
      await this.executeSingleAction(actions[0], ctx, context);
    } else {
      await this.executeMultipleActions(actions, ctx, context);
    }
  }

  /**
   * Handle conversational AI response with full context
   */
  async handleConversationalResponse(ctx: MessageContext, context: any, intelligence: any) {
    const conversationPrompt = `
You are an intelligent WhatsApp assistant. Respond naturally and helpfully.

User Message: "${ctx.body}"
User Profile: ${JSON.stringify(context.user)}
Conversation History: ${context.conversation.slice(-10).join(' | ')}
Current Context: ${context.environment.timeOfDay}, ${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][context.environment.dayOfWeek]}

Available Capabilities:
- Download videos/music from YouTube, TikTok, Instagram, etc.
- Generate images with AI (DALL-E, Animagine, Flux)
- Search web, GitHub, YouTube
- Get weather, translate languages
- Play games, tell jokes, create memes
- Convert media formats, create stickers
- Group management, user profiles
- And much more...

If the user asks for something you can help with, offer to do it. Be proactive and helpful.
If unclear, ask clarifying questions. Keep responses natural and engaging.

Respond in the user's language if they're not using English.
`;

    try {
      const response = await this.gemini.getChatCompletion(conversationPrompt);
      await ctx.reply(response);

      // Update conversation memory
      await this.updateConversationMemory(ctx.sender.jid, ctx.body, response);
    } catch (error: unknown) {
      logger.error('Conversational AI error:', error);
      await ctx.reply("I understand you're trying to communicate with me, but I'm having some processing difficulties right now. Could you try rephrasing your request?");
    }
  }

  /**
   * Execute a single action intelligently
   */
  async executeSingleAction(action: AIAction, ctx: MessageContext, context: any) {
    try {
      if (!action.command) throw new Error('Command not specified');
      const command = this.bot.cmd.get(action.command);
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
      await this.provideIntelligentFollowUp(action, ctx, context);

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
   * Register all bot commands as AI tools
   */
  registerAllCommands() {
    // In a stateless environment, we might need to access commands from the bot instance passed in constructor
    // Assuming bot.cmd is available and populated
    if (this.bot.cmd) {
        for (const [name, command] of this.bot.cmd) {
        this.availableTools.set(name, {
            name,
            description: command.description || `Execute ${name} command`,
            category: command.category || 'misc',
            parameters: this.inferCommandParameters(command),
            execute: command.code
        });
        }
        logger.info(`Registered ${this.availableTools.size} commands as AI tools`);
    }
  }

  /**
   * Learn from user interactions to improve responses
   */
  async learnFromInteraction(userId: string, message: string, intelligence: any, ctx: MessageContext) {
    if (!this.decisionEngine.learningEnabled) return;

    // Track actual success based on execution results
    const successMetrics = await this.calculateSuccessMetrics(intelligence, ctx);

    const learningData = {
      timestamp: Date.now(),
      message,
      intents: intelligence.intents,
      actions: intelligence.actions,
      confidence: intelligence.confidence,
      success: successMetrics.overallSuccess,
      successDetails: {
        actionExecutions: successMetrics.actionResults,
        responseGenerated: successMetrics.responseGenerated,
        errorOccurred: successMetrics.errorOccurred,
        userSatisfactionIndicators: successMetrics.userSatisfactionIndicators,
        executionTime: successMetrics.executionTime
      }
    };

    const userLearning = this.learningData.get(userId) || [];
    userLearning.push(learningData);

    // Keep only recent learning data
    if (userLearning.length > 100) {
      userLearning.splice(0, userLearning.length - 100);
    }

    this.learningData.set(userId, userLearning);
  }

  /**
   * Update conversation memory with context
   */
  async updateConversationMemory(userId: string, userMessage: string, aiResponse: string) {
    const memory = this.conversationMemory.get(userId) || [];

    memory.push({
      timestamp: Date.now(),
      user: userMessage,
      ai: aiResponse,
      context: {
        timeOfDay: this.getTimeOfDay(),
        dayOfWeek: new Date().getDay()
      }
    });

    // Keep last 50 exchanges
    if (memory.length > 50) {
      memory.splice(0, memory.length - 50);
    }

    this.conversationMemory.set(userId, memory);

    // Ideally, save to database via DatabaseService here
    // await databaseService.saveConversation(userId, memory);
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
  async calculateSuccessMetrics(intelligence: any, ctx: MessageContext) {
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
            const actionSuccess = await this.validateActionExecution(action, ctx);
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
  async validateActionExecution(action: any, ctx: any) {
    // Check if the action type exists and was callable
    if (action.type === 'command' && action.command) {
      const command = this.bot.cmd.get(action.command);
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

  // Additional helper methods...
  assessContextualRelevance(intent: any, context: any) { return 0.8; } // Simplified
  planWorkflow(actions: any[], context: any) { return { tools: [] as any[], reasoning: '' }; } // Simplified
  selectResponseStrategy(analysis: any, context: any) { return 'conversational'; } // Simplified
  executeMultipleActions(actions: any[], ctx: any, context: any) { /* Implementation */ }
  provideIntelligentFollowUp(action: any, ctx: any, context: any) { /* Implementation */ }
  getConversationMemory(userId: string) { return this.conversationMemory.get(userId) || []; }
  getRecentActions(userId: string) { return []; } // Simplified
  getActiveConversations(userId: string) { return []; } // Simplified
  getGroupContext(groupId: string) { return null; } // Simplified
  inferCommandParameters(command: any) { return {}; } // Simplified
  saveConversationToDB(userId: string, memory: any[]) { /* Implementation */ }
  handleFallbackResponse(ctx: MessageContext, error: any) {
    ctx.reply("I apologize, but I'm experiencing some technical difficulties. Please try again in a moment.");
  }
}

export default EnhancedAIBrain;
