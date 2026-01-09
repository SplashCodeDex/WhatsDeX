import type { WASocket, proto } from '@whiskeysockets/baileys';
import type { ConfigService } from '../services/ConfigService.js';
import type { Firestore } from 'firebase-admin/firestore';

export interface Config {
    bot: {
        name: string;
        prefix: string;
        phoneNumber?: string;
        sessionId: string;
        owners: string[];
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
    sendMessage: (jid: string, content: any, options?: any) => Promise<any>;
    decodeJid: (jid: string) => string;
    cmd: Map<string, Command>;
    use: (middleware: (ctx: MessageContext, next: () => Promise<void>) => Promise<void> | void) => void;
}

declare module '@whiskeysockets/baileys' {
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

export interface MessageContext {
    reply: (text: string | any, options?: any) => Promise<any>;
    replyReact: (emoji: string) => Promise<any>;
    isGroup: () => boolean;
    sender: {
        jid: string;
        name: string;
        isOwner: boolean;
        isAdmin: boolean;
    };
    id: string; // Group ID or Chat ID
    msg: proto.IWebMessageInfo & {
        contentType?: string;
        media?: any;
        body?: string;
        content?: string;
    };
    body: string;
    args: string[];
    command: string;
    prefix: string;
    getId: (jid: string) => string;
    simulateTyping: () => void;
    used: {
        command: string;
        prefix: string;
        args: string[];
        text: string;
    };
    cooldown: any;
    sendMessage: (jid: string, content: any, options?: any) => Promise<any>;
    group: (jid?: string) => {
        isAdmin: (jid: string) => Promise<boolean>;
        matchAdmin: (jid: string) => Promise<boolean>;
        members: () => Promise<any[]>;
        isBotAdmin: () => Promise<boolean>;
        metadata: () => Promise<any>;
        owner: () => Promise<string | null>;
        name: () => Promise<string>;
        add: (jids: string[]) => Promise<any>;
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
        membersCanAddMemberMode: (mode: 'on' | 'off') => Promise<any>;
        isOwner: (jid: string) => Promise<boolean>;
    };
    download: () => Promise<Buffer>;
    replied?: boolean;
    responseSent?: boolean;
    aiContext?: any;
    intelligentMode?: boolean;
    processingTimestamp?: number;
    workerVersion?: string;
    [key: string]: any; // Transient data
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
    permissions?: CommandPermissions;
    code?: (ctx: MessageContext) => Promise<void> | void;
    execute?: (ctx: MessageContext) => Promise<void> | void;
}

export interface Logger {
    error: (message: any, meta?: any) => void;
    warn: (message: any, meta?: any) => void;
    info: (message: any, meta?: any) => void;
    debug: (message: any, meta?: any) => void;
    command: (command: string, userId: string, success?: boolean, executionTime?: number | null, error?: any) => void;
    [key: string]: any;
}

export interface GlobalContext {
    database: any; // Using any for now to handle legacy and new firebase logic
    config: ConfigService;
    tools: Record<string, any>;
    formatter: any;
    logger: Logger;
    [key: string]: any;
}

export * from './firestore.js';
