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
} from './hooks/index.js';

// Components
export { BotList, CreateBotDialog, BotCard, QRCodeDisplay } from './components/index.js';

// Schemas
export { createBotSchema, updateBotSchema, sendMessageSchema } from './schemas.js';
export type { CreateBotInput, UpdateBotInput, SendMessageInput } from './schemas.js';

// Types
export type {
    Bot,
    BotListItem,
    BotStatus,
    BotConfig,
    BotStats,
    BusinessHours,
    QRCodeResponse,
    BotConnectionEvent,
} from './types.js';
