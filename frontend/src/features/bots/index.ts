/**
 * Bots Feature Module
 *
 * Handles all bot management functionality including:
 * - Bot CRUD operations
 * - QR code connection
 * - Connection status monitoring
 * - Bot settings
 */

// Hooks
export {
    useBots,
    useBot,
    useBotQR,
    useCreateBot,
    useUpdateBot,
    useDeleteBot,
    useConnectBot,
    useDisconnectBot,
    botKeys,
} from './hooks';

// Components
export { BotList, CreateBotDialog, BotCard, QRCodeDisplay } from './components';

// Schemas
export { createBotSchema, updateBotSchema, sendMessageSchema } from './schemas';
export type { CreateBotInput, UpdateBotInput, SendMessageInput } from './schemas';

// Types
export type {
    Bot,
    BotListItem,
    BotStatus,
    BotSettings,
    BotStats,
    BusinessHours,
    QRCodeResponse,
    BotConnectionEvent,
} from './types';
