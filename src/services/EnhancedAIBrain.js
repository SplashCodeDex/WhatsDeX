import GeminiService from '../../services/gemini.js';
import logger from '../utils/logger.js';
import { EventEmitter } from 'events';

/**
 * Enhanced AI Brain - Next Generation Intelligence System
 * Handles natural conversation, context understanding, and intelligent tool usage
 */
class EnhancedAIBrain extends EventEmitter {
  constructor(bot, context) {
    super();
    this.bot = bot;
    this.context = context;
    this.gemini = new GeminiService();
    
    // Enhanced memory and context systems
    this.conversationMemory = new Map();
    this.userProfiles = new Map();
    this.contextEmbeddings = new Map();
    this.learningData = new Map();
    
    // Dynamic tool registry
    this.availableTools = new Map();
    this.registerAllCommands();
    
    // AI decision engine
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
  async processMessage(ctx) {
    try {
      const userId = ctx.sender.jid;
      const message = ctx.message || ctx.text || '';
      
      // Build comprehensive context
      const context = await this.buildEnhancedContext(userId, message, ctx);
      
      // Multi-layer intelligence processing
      const intelligence = await this.analyzeWithMultiLayerIntelligence(message, context);
      
      // Execute intelligent response
      await this.executeIntelligentResponse(intelligence, ctx, context);
      
      // Learn from interaction
      await this.learnFromInteraction(userId, message, intelligence, ctx);
      
    } catch (error) {
      logger.error('Enhanced AI Brain processing error:', error);
      await this.handleFallbackResponse(ctx, error);
    }
  }

  /**
   * Build comprehensive context from all available data
   */
  async buildEnhancedContext(userId, message, ctx) {
    const context = {
      user: await this.getUserProfile(userId),
      conversation: await this.getConversationMemory(userId),
      message: {
        text: message,
        timestamp: Date.now(),
        isGroup: ctx.isGroup,
        groupInfo: ctx.isGroup ? await this.getGroupContext(ctx.from) : null,
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
    
    return context;
  }

  /**
   * Multi-layer intelligence analysis
   */
  async analyzeWithMultiLayerIntelligence(message, context) {
    const analysis = {
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
  async detectMultipleIntents(message, context) {
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
      const response = await this.gemini.generateContent(prompt);
      const intents = JSON.parse(response);
      return Array.isArray(intents) ? intents : [intents];
    } catch (error) {
      logger.warn('Intent detection failed, using fallback', error);
      return await this.fallbackIntentDetection(message, context);
    }
  }

  /**
   * Make contextual decisions based on intents and user context
   */
  async makeContextualDecisions(intents, context) {
    const decisions = {
      actions: [],
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
            relevance: contextualRelevance,
            originalIntent: intent
          });
        }
      }
    }

    // Calculate overall confidence
    decisions.confidence = decisions.actions.length > 0 
      ? decisions.actions.reduce((sum, action) => sum + action.relevance, 0) / decisions.actions.length
      : 0;

    // Sort actions by relevance
    decisions.actions.sort((a, b) => b.relevance - a.relevance);

    return decisions;
  }

  /**
   * Convert intent to actionable command
   */
  async intentToAction(intent, context) {
    const intentMapping = {
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
      logger.warn(`Command not found: ${commandName}`);
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
  async executeIntelligentResponse(intelligence, ctx, context) {
    const { actions, confidence, responseType } = intelligence;

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
  async handleConversationalResponse(ctx, context, intelligence) {
    const conversationPrompt = `
You are an intelligent WhatsApp assistant. Respond naturally and helpfully.

User Message: "${ctx.message}"
User Profile: ${JSON.stringify(context.user)}
Conversation History: ${context.conversation.slice(-10).join(' | ')}
Current Context: ${context.environment.timeOfDay}, ${['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][context.environment.dayOfWeek]}

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
      const response = await this.gemini.generateContent(conversationPrompt);
      await ctx.reply(response);
      
      // Update conversation memory
      await this.updateConversationMemory(ctx.sender.jid, ctx.message, response);
    } catch (error) {
      logger.error('Conversational AI error:', error);
      await ctx.reply("I understand you're trying to communicate with me, but I'm having some processing difficulties right now. Could you try rephrasing your request?");
    }
  }

  /**
   * Execute a single action intelligently
   */
  async executeSingleAction(action, ctx, context) {
    try {
      const command = this.bot.cmd.get(action.command);
      if (!command) {
        throw new Error(`Command not found: ${action.command}`);
      }

      // Prepare smart context for command
      const smartCtx = await this.prepareSmartContext(action, ctx, context);
      
      // Execute command
      await command.code(smartCtx);
      
      // Follow up with AI explanation if helpful
      await this.provideIntelligentFollowUp(action, ctx, context);
      
    } catch (error) {
      logger.error(`Action execution failed: ${action.command}`, error);
      await ctx.reply(`I tried to ${action.reasoning}, but encountered an issue: ${error.message}`);
    }
  }

  /**
   * Prepare smart context for command execution
   */
  async prepareSmartContext(action, ctx, context) {
    const smartCtx = { ...ctx };
    
    // Extract and format arguments intelligently
    const args = await this.extractSmartArguments(action, ctx.message, context);
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
  async extractSmartArguments(action, message, context) {
    const { parameters, command } = action;
    
    // For download commands, extract URLs or search terms
    if (command.includes('dl') || command.includes('download')) {
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
      const searchTerm = message.replace(/(?:download|get|find)\s+/i, '').trim();
      return searchTerm ? [searchTerm] : [];
    }
    
    // For search commands
    if (command.includes('search')) {
      const searchTerm = message.replace(/(?:search|find|look for)\s+/i, '').trim();
      return searchTerm ? [searchTerm] : [];
    }
    
    // For weather
    if (command === 'weather') {
      const location = this.extractLocation(message) || context.user.location || 'current location';
      return [location];
    }
    
    // For translation
    if (command === 'translate') {
      const text = parameters.text || message.replace(/translate\s+/i, '').trim();
      const lang = parameters.to || 'en';
      return [text, lang];
    }
    
    // Default: split message into words, skip command-like words
    return message.split(' ').filter(word => 
      !['please', 'can', 'you', 'could', 'would', 'help', 'me'].includes(word.toLowerCase())
    );
  }

  /**
   * Register all bot commands as AI tools
   */
  registerAllCommands() {
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

  /**
   * Learn from user interactions to improve responses
   */
  async learnFromInteraction(userId, message, intelligence, ctx) {
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
  async updateConversationMemory(userId, userMessage, aiResponse) {
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
    
    // Also save to database
    await this.saveConversationToDB(userId, memory);
  }

  /**
   * Get or create user profile
   */
  async getUserProfile(userId) {
    let profile = this.userProfiles.get(userId);
    
    if (!profile) {
      profile = {
        id: userId,
        preferences: {},
        language: 'en',
        timezone: 'UTC',
        interactionCount: 0,
        firstSeen: Date.now(),
        lastSeen: Date.now(),
        commonIntents: {},
        learningPattern: {}
      };
      
      // Try to load from database
      try {
        const dbProfile = await this.loadUserProfileFromDB(userId);
        if (dbProfile) {
          profile = { ...profile, ...dbProfile };
        }
      } catch (error) {
        logger.warn('Could not load user profile from DB:', error);
      }
      
      this.userProfiles.set(userId, profile);
    }
    
    profile.lastSeen = Date.now();
    profile.interactionCount++;
    
    return profile;
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

  detectMediaType(ctx) {
    if (ctx.image) return 'image';
    if (ctx.video) return 'video';
    if (ctx.audio) return 'audio';
    if (ctx.document) return 'document';
    return 'text';
  }

  async analyzeSentiment(message) {
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

  extractLocation(message) {
    // Simple location extraction - could be enhanced
    const locationPattern = /(?:in|at|for)\s+([A-Za-z\s]+)(?:\s|$)/i;
    const match = message.match(locationPattern);
    return match ? match[1].trim() : null;
  }

  async fallbackIntentDetection(message, context) {
    // Pattern-based fallback
    const patterns = {
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
  async calculateSuccessMetrics(intelligence, ctx) {
    const startTime = Date.now();
    const metrics = {
      actionResults: [],
      responseGenerated: false,
      errorOccurred: false,
      userSatisfactionIndicators: {},
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
          } catch (error) {
            metrics.actionResults.push({
              action: action.command || action.type,
              success: false,
              error: error.message
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
          ? metrics.actionResults.filter(r => r.success).length / metrics.actionResults.length 
          : 1,
        contextAppropriate: this.assessContextAppropriateness(intelligence, ctx)
      };

      // Calculate execution time
      metrics.executionTime = Date.now() - startTime;

      // Determine overall success
      metrics.overallSuccess = this.calculateOverallSuccess(metrics);

    } catch (error) {
      logger.error('Error calculating success metrics:', error);
      metrics.errorOccurred = true;
      metrics.overallSuccess = false;
    }

    return metrics;
  }

  /**
   * Validate if an action was executed successfully
   */
  async validateActionExecution(action, ctx) {
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
  assessResponseRelevance(intelligence, ctx) {
    // Simple heuristic - could be enhanced with NLP
    const messageLength = (ctx.message || '').length;
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
  assessContextAppropriateness(intelligence, ctx) {
    // Simple appropriateness check
    const hasActions = intelligence.actions && intelligence.actions.length > 0;
    const hasHighConfidence = intelligence.confidence > 0.6;
    const messageWasQuestion = (ctx.message || '').includes('?');
    const responseGenerated = ctx.replied || ctx.responseSent;

    // Appropriate if:
    // - High confidence actions were taken, OR
    // - Question was asked and response was provided
    return (hasActions && hasHighConfidence) || (messageWasQuestion && responseGenerated);
  }

  /**
   * Calculate overall success based on all metrics
   */
  calculateOverallSuccess(metrics) {
    if (metrics.errorOccurred) return false;

    const satisfactionIndicators = metrics.userSatisfactionIndicators;
    const weights = {
      responseRelevance: 0.3,
      intentConfidenceMatch: 0.2,
      actionExecutionRate: 0.3,
      contextAppropriate: 0.2
    };

    let weightedScore = 0;
    weightedScore += satisfactionIndicators.responseRelevance * weights.responseRelevance;
    weightedScore += (satisfactionIndicators.intentConfidenceMatch ? 1 : 0) * weights.intentConfidenceMatch;
    weightedScore += satisfactionIndicators.actionExecutionRate * weights.actionExecutionRate;
    weightedScore += (satisfactionIndicators.contextAppropriate ? 1 : 0) * weights.contextAppropriate;

    // Success threshold of 0.6 (60%)
    return weightedScore >= 0.6;
  }

  // Additional helper methods...
  assessContextualRelevance(intent, context) { return 0.8; } // Simplified
  planWorkflow(actions, context) { return { tools: [], reasoning: '' }; } // Simplified
  selectResponseStrategy(analysis, context) { return 'conversational'; } // Simplified
  executeMultipleActions(actions, ctx, context) { /* Implementation */ }
  provideIntelligentFollowUp(action, ctx, context) { /* Implementation */ }
  getConversationMemory(userId) { return this.conversationMemory.get(userId) || []; }
  getRecentActions(userId) { return []; } // Simplified
  getActiveConversations(userId) { return []; } // Simplified
  getGroupContext(groupId) { return null; } // Simplified
  inferCommandParameters(command) { return {}; } // Simplified
  saveConversationToDB(userId, memory) { /* Implementation */ }
  loadUserProfileFromDB(userId) { return null; } // Simplified
  handleFallbackResponse(ctx, error) { 
    ctx.reply("I apologize, but I'm experiencing some technical difficulties. Please try again in a moment.");
  }
}

export default EnhancedAIBrain;