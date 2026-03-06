declare module 'openclaw' {
  export function sendMessageWhatsApp(jid: string, text: string, options?: any): Promise<any>;
  export function sendReactionWhatsApp(chatJid: string, messageId: string, emoji: string, options?: any): Promise<any>;
  export function sendPollWhatsApp(jid: string, poll: any, options?: any): Promise<any>;
  export function setActiveWebListener(accountId: string, listener: any): void;
  export function sendMessageTelegram(to: string, text: string, opts: any): Promise<any>;
  export function createOpenClawTools(options?: any): any[];
  export function startGatewayServer(config?: any): Promise<any>;
  export class OpenClawGateway {
    static getInstance(): OpenClawGateway;
    getSkillReport(): Promise<any>;
    getGatewayHealth(): Promise<any>;
  }
  export type ActiveWebListener = {
    sendMessage: (to: string, text: string, mediaBuffer?: Buffer, mediaType?: string, options?: any) => Promise<{ messageId: string }>;
    sendPoll: (to: string, poll: any) => Promise<{ messageId: string }>;
    sendReaction: (chatJid: string, messageId: string, emoji: string, fromMe: boolean, participant?: string) => Promise<void>;
    sendComposingTo: (to: string) => Promise<void>;
  };
  export type ActiveWebSendOptions = {
    gifPlayback?: boolean;
    fileName?: string;
  };
}
