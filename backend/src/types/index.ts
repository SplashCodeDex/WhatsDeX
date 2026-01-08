export interface Config {
    // Add config properties as needed
    bot: any;
    system: any;
    msg: any;
}

export interface Bot {
    user: {
        id: string;
    };
    sendMessage: (jid: string, content: any, options?: any) => Promise<any>;
    decodeJid: (jid: string) => string;
    // Add other bot methods
    cmd: Map<string, any>;
}

export interface MessageContext {
    reply: (text: string | any, options?: any) => Promise<any>;
    replyReact: (emoji: string) => Promise<any>;
    isGroup: () => boolean;
    sender: {
        jid: string;
        [key: string]: any;
    };
    id: string; // Group ID or Chat ID
    getId: (jid: string | null) => string;
    msg: any;
    used: {
        command: string;
        prefix: string;
        args: string[];
    };
    group: (jid?: string) => {
        isAdmin: (jid: string) => Promise<boolean>;
        matchAdmin: (jid: string) => Promise<boolean>;
        members: () => Promise<any[]>;
        isBotAdmin: () => Promise<boolean>;
    };
    simulateTyping: () => void;
    download: () => Promise<Buffer>;
    // Add other context methods
    [key: string]: any;
}

export interface CommandPermissions {
    admin?: boolean;
    botAdmin?: boolean;
    owner?: boolean;
    group?: boolean;
    private?: boolean;
    premium?: boolean;
    coin?: number | string;
    [key: string]: any;
}

export interface Command {
    name: string;
    aliases?: string[];
    category: string;
    permissions?: CommandPermissions;
    handler: (ctx: MessageContext, context: GlobalContext) => Promise<void> | void;
}

export interface GlobalContext {
    database: any;
    tools: {
        cmd: any;
        [key: string]: any;
    };
    config: Config;
    formatter: any;
    utils: any;
    [key: string]: any;
}
export * from './firestore.js';
