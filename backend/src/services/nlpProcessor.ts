
import { MessageContext } from '../types/index.js';
import logger from '../utils/logger.js';

export interface NLPResult {
    intent: string;
    confidence: number;
    command: string | null;
    parameters: Record<string, any>;
    explanation: string;
    alternatives?: string[];
}

export interface NLPContext {
    userId: string;
    recentCommands: any[];
    isGroup: boolean;
    isAdmin: boolean;
    isOwner: boolean;
}

export default class NLPProcessorService {
    private intents = [
        {
            name: 'sticker_creation',
            keywords: ['sticker', 'stiker', 'make sticker', 'buat stiker'],
            command: 'sticker',
            explanation: 'User wants to create a sticker from an image or video.'
        },
        {
            name: 'video_download',
            keywords: ['download video', 'unduh video', 'save video', 'ytdl', 'youtube'],
            command: 'play',
            explanation: 'User wants to download a video from a platform like YouTube.'
        },
        {
            name: 'ai_chat',
            keywords: ['ask', 'question', 'tell me', 'tanya', 'gemini', 'gpt'],
            command: 'gemini',
            explanation: 'User is asking a question or wanting to chat with AI.'
        },
        {
            name: 'group_management',
            keywords: ['kick', 'add', 'promote', 'demote', 'open group', 'close group'],
            command: 'help',
            explanation: 'User is trying to manage group settings or members.'
        }
    ];

    async processInput(input: string, context?: NLPContext): Promise<NLPResult> {
        const text = input.toLowerCase().trim();
        logger.debug(`Processing NLP input: "${text}"`);

        // Basic keyword matching for MVP
        for (const intent of this.intents) {
            if (intent.keywords.some(k => text.includes(k))) {
                return {
                    intent: intent.name,
                    confidence: 0.85,
                    command: intent.command,
                    parameters: {}, // Extraction not implemented yet
                    explanation: intent.explanation,
                    alternatives: []
                };
            }
        }

        // Default to unknown
        return {
            intent: 'unknown',
            confidence: 0.2,
            command: null,
            parameters: {},
            explanation: 'I am not quite sure what you want to do. Could you be more specific?',
            alternatives: ['menu', 'gemini']
        };
    }
}
