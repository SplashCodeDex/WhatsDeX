import type { WASocket, proto } from 'baileys';
import type { ConfigService } from '../services/ConfigService.js';
import type { BotConfig } from './tenantConfig.js';

export interface Config {
    bot: {
        name: string;
        prefix: string;
        phoneNumber?: string;
        sessionId: string;
        tenantId: string;
        owners: string[];
        id?: string;
        groupLink?: string;
        readyAt?: Date;
        uptime?: string;
        dbSize?: string;
    };
    system: {
        port: number;
        env: string;
        debug: boolean;
    };
    msg: Record<string, string>;
}

export interface Bot extends Partial<WASocket> {
    user: {
        id: string;
        name?: string;
    };
    phoneNumber?: string;
    tenantId: string;
    botId: string;
    config: BotConfig;
    context: GlobalContext;
    ev: NonNullable<WASocket['ev']>;

    sendMessage: (jid: string, content: any, options?: any) => Promise<any>;
    decodeJid: (jid: string) => string;
    cmd: Map<string, Command>;

    // onWhatsApp inherited from Partial<WASocket>
    groupFetchAllParticipating?: () => Promise<{ [id: string]: any }>;

    // Middleware
    use: (middleware: Middleware) => void;
    executeMiddleware: (ctx: MessageContext, next: () => Promise<void>) => Promise<void>;
}

export type Middleware = (ctx: MessageContext, next: () => Promise<void>) => Promise<void> | void;

declare module 'baileys' {
    export interface proto {
        IWebMessageInfo: proto.IWebMessageInfo & {
            contentType?: string;
            media?: any;
            body?: string;
            content?: string;
            pushName?: string;
        }
    }
}

export interface GroupFunctions {
    isAdmin: (jid?: string) => Promise<boolean>;
    matchAdmin: (id: string) => Promise<boolean>;
    members: () => Promise<string[]>;
    isBotAdmin: () => Promise<boolean>;
    metadata: () => Promise<any>;
    owner: () => Promise<string | null>;
    name: () => Promise<string>;
    open: () => Promise<any>;
    close: () => Promise<any>;
    lock: () => Promise<any>;
    unlock: () => Promise<any>;
    add: (jids: string[]) => Promise<unknown>;
    kick: (jids: string[]) => Promise<any>;
    promote: (jids: string[]) => Promise<any>;
    demote: (jids: string[]) => Promise<any>;
    inviteCode: () => Promise<string>;
    pendingMembers: () => Promise<any[]>;
    approvePendingMembers: (jids: string[]) => Promise<any>;
    rejectPendingMembers: (jids: string[]) => Promise<any>;
    updateDescription: (desc: string) => Promise<any>;
    updateSubject: (subject: string) => Promise<any>;
    joinApproval: (mode: 'on' | 'off') => Promise<any>;
    membersCanAddMemberMode: (mode: 'on' | 'off' | boolean) => Promise<any>;
    isOwner: (jid?: string) => Promise<boolean>;
}

export interface MessageContext {
    reply: (text: string | { [key: string]: any; text?: string }, options?: any) => Promise<any>;
    replyReact: (emoji: string) => Promise<any>;
    editMessage?: (key: any, text: string) => Promise<any>;

    isGroup: () => boolean;
    sender: {
        jid: string;
        name: string;
        pushName?: string | null;
        isOwner: boolean;
        isAdmin: boolean;
    };
    author?: {
        id: string;
    };
    pushName?: string | null;
    id: string; // Group ID or Chat ID
    chat?: {
        id: string;
    };
    msg: proto.IWebMessageInfo & {
        contentType?: string;
        media?: any;
        body?: string;
        content?: string;
    };
    quoted?: {
        content: string;
        contentType: string;
        senderJid: string;
        media: any;
        key: any;
    };
    message?: any;
    body: string;
    args: string[];
    command: string;
    prefix: string;
    commandDef?: Command;
    bot: Bot;
    getId: (jid: string) => string;
    getMentioned?: () => Promise<string[]>;
    simulateTyping: () => void;
    used: {
        command: string;
        prefix: string;
        args: string[];
        text: string;
    };
    cooldown: any;
    core?: any;

    // Group Functions
    group: (jid?: string) => GroupFunctions;

    // Misc
    download: () => Promise<Buffer>;
    replied?: boolean;
    responseSent?: boolean;
    aiContext?: any;
    intelligentMode?: boolean;
    processingTimestamp?: number;
    workerVersion?: string;
    usage?: any;
    sendMessage: (jid: string, content: any, options?: any) => Promise<any>;
}

export interface CommandPermissions {
    admin?: boolean;
    botAdmin?: boolean;
    owner?: boolean;
    group?: boolean;
    private?: boolean;
    premium?: boolean;
    coin?: number;
}

export interface Command {
    name: string;
    aliases?: string[];
    category: string;
    description?: string;
    usage?: string;
    cooldown?: number;
    permissions?: CommandPermissions;
    code?: (ctx: MessageContext) => Promise<void> | void;
    execute?: (ctx: MessageContext) => Promise<void> | void;
    run?: (ctx: MessageContext) => Promise<void> | void;
    // System props
    filePath?: string;
    loadedAt?: number;
    isEnabled?: boolean;
}


export interface Logger {
    error: (message: any, meta?: any) => void;
    warn: (message: any, meta?: any) => void;
    info: (message: any, meta?: any) => void;
    debug: (message: any, meta?: any) => void;
    trace: (message: any, meta?: any) => void;
    http: (message: any, meta?: any) => void;
    security: (message: any, userId?: string | null, details?: any) => void;
    performance: (operation: string, duration: number, metadata?: any) => void;
    command: (command: string, userId: string, success?: boolean, executionTime?: number | null, error?: any) => void;
    userActivity: (userId: string, action: string, details?: any) => void;
    groupActivity: (groupId: string, action: string, userId: string, details?: any) => void;
    apiRequest: (method: string, url: string, statusCode: number, responseTime: number, userId?: string | null) => void;
    withContext: (context: any) => Logger;
    child: (meta?: any) => Logger;
    [key: string]: any;
}

export interface GlobalContext {
    database: import('../services/database.js').DatabaseService;
    databaseService: import('../services/database.js').DatabaseService;
    config: ConfigService;
    tools: typeof import('../tools/exports.js').default;
    formatter: typeof import('../utils/formatters.js');
    logger: Logger;
    commandSystem: import('../services/commandSystem.js').CommandSystem;
    unifiedAI: import('../services/geminiAI.js').GeminiAI;
    groupService: import('../services/groupService.js').GroupService;
    multiTenantBotService: import('../services/multiTenantBotService.js').MultiTenantBotService;
    userService: import('../services/userService.js').UserService;
    tenantConfigService: import('../services/tenantConfigService.js').TenantConfigService;
    state?: any;
    [key: string]: any;
}


export * from './firestore.js';
export * from './contracts.js';
export type { Result } from './contracts.js';
