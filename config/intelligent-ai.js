/**
 * Enhanced AI Configuration for Intelligent WhatsDeX Bot
 * Configures the next-generation AI capabilities
 */

module.exports = {
  // Enhanced AI Brain Configuration
  aiBrain: {
    // Primary AI provider settings
    primaryProvider: 'gemini',
    fallbackProviders: ['metaai', 'deepseek'],
    
    // Intelligence thresholds
    confidenceThreshold: 0.7,
    conversationalThreshold: 0.8,
    toolCallThreshold: 0.75,
    
    // Context and memory settings
    contextWindow: {
      maxMessages: 50,
      maxTokens: 8000,
      summarizationThreshold: 20,
      retentionDays: 30
    },
    
    // Learning and adaptation
    learning: {
      enabled: true,
      adaptToUser: true,
      rememberPreferences: true,
      learnFromFeedback: true,
      maxLearningData: 1000
    },
    
    // Response generation
    responses: {
      maxLength: 2000,
      includeEmojis: true,
      adaptToLanguage: true,
      personalizeResponses: true,
      proactiveMode: true
    }
  },

  // Natural Language Processing
  nlp: {
    // Multi-language support
    languages: ['en', 'id', 'es', 'fr', 'pt', 'ar', 'zh', 'ja', 'ko', 'hi'],
    autoDetectLanguage: true,
    translateOnDemand: true,
    
    // Intent classification
    intentClassification: {
      multiIntentSupport: true,
      contextAwareClassification: true,
      confidenceWeighting: true,
      customIntents: []
    },
    
    // Entity extraction
    entityExtraction: {
      extractLocations: true,
      extractDates: true,
      extractUrls: true,
      extractMentions: true,
      customEntities: []
    },
    
    // Sentiment analysis
    sentimentAnalysis: {
      enabled: true,
      trackMoodChanges: true,
      respondToSentiment: true
    }
  },

  // Dynamic Tool System
  tools: {
    // Tool registration
    registration: {
      autoRegisterCommands: true,
      enableAllByDefault: true,
      categoryFiltering: true,
      permissionChecking: true
    },
    
    // Tool execution
    execution: {
      maxConcurrentTools: 3,
      timeoutMs: 30000,
      retryAttempts: 2,
      safetyChecks: true
    },
    
    // Tool categories and priorities
    categories: {
      'ai-chat': { priority: 1, enabled: true },
      'ai-image': { priority: 2, enabled: true },
      'downloader': { priority: 3, enabled: true },
      'search': { priority: 2, enabled: true },
      'converter': { priority: 4, enabled: true },
      'entertainment': { priority: 5, enabled: true },
      'tool': { priority: 3, enabled: true },
      'information': { priority: 2, enabled: true }
    },
    
    // Disabled tools (can be re-enabled)
    disabled: [],
    
    // Custom tool configurations
    customConfigs: {
      'youtubevideo': {
        maxDuration: 3600, // 1 hour
        qualityPreference: 'highest'
      },
      'dalle': {
        defaultStyle: 'realistic',
        safetyFilter: true
      },
      'weather': {
        units: 'metric',
        includeForecast: true
      }
    }
  },

  // Intelligent Conversation Management
  conversation: {
    // Memory management
    memory: {
      persistentMemory: true,
      contextualMemory: true,
      emotionalMemory: true,
      factualMemory: true
    },
    
    // Conversation flow
    flow: {
      maintainContext: true,
      handleInterruptions: true,
      supportMultiTurn: true,
      enableClarifyingQuestions: true
    },
    
    // Proactive features
    proactive: {
      suggestActions: true,
      anticipateNeeds: true,
      followUpQuestions: true,
      contextualHelp: true
    }
  },

  // User Intelligence and Personalization
  userIntelligence: {
    // Profile building
    profiling: {
      trackPreferences: true,
      learnHabits: true,
      rememberContext: true,
      adaptToStyle: true
    },
    
    // Behavior analysis
    behaviorAnalysis: {
      usagePatterns: true,
      commandFrequency: true,
      timeBasedAnalysis: true,
      preferenceInference: true
    },
    
    // Personalization
    personalization: {
      customGreetings: true,
      adaptiveResponses: true,
      preferredLanguage: true,
      culturalAdaptation: true
    }
  },

  // Advanced Features
  advanced: {
    // Multi-modal processing
    multimodal: {
      imageUnderstanding: true,
      videoAnalysis: true,
      audioTranscription: true,
      documentProcessing: true
    },
    
    // Workflow automation
    workflows: {
      enableWorkflows: true,
      maxStepsPerWorkflow: 10,
      allowChaining: true,
      saveWorkflows: true
    },
    
    // Smart suggestions
    suggestions: {
      commandSuggestions: true,
      contextualSuggestions: true,
      completionSuggestions: true,
      improvementSuggestions: true
    },
    
    // Performance optimization
    performance: {
      cachingEnabled: true,
      batchProcessing: true,
      lazyLoading: true,
      optimizedResponses: true
    }
  },

  // Security and Safety
  security: {
    // Content moderation
    moderation: {
      toxicityDetection: true,
      spamDetection: true,
      inappropriateContentFilter: true,
      automatedModeration: true
    },
    
    // Privacy protection
    privacy: {
      anonymizeData: true,
      encryptMemory: true,
      respectPrivacy: true,
      dataRetentionLimits: true
    },
    
    // Safety measures
    safety: {
      rateLimiting: true,
      abuseDetection: true,
      emergencyStops: true,
      humanOversight: false
    }
  },

  // Monitoring and Analytics
  monitoring: {
    // Performance tracking
    performance: {
      responseTime: true,
      accuracyTracking: true,
      userSatisfaction: true,
      errorRates: true
    },
    
    // Usage analytics
    analytics: {
      commandUsage: true,
      userEngagement: true,
      conversationMetrics: true,
      featureAdoption: true
    },
    
    // Health monitoring
    health: {
      aiModelHealth: true,
      toolAvailability: true,
      memoryUsage: true,
      systemLoad: true
    }
  },

  // Experimental Features (Beta)
  experimental: {
    // Advanced AI features
    advancedAI: {
      chainOfThought: false,
      selfReflection: false,
      metacognition: false,
      creativeProblemSolving: false
    },
    
    // Emerging capabilities
    emerging: {
      codeGeneration: false,
      autonomousPlanning: false,
      crossPlatformIntegration: false,
      advancedReasoning: false
    }
  }
};