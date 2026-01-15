import { DynamicToolRegistry } from './DynamicToolRegistry.js';

export const cmd = {
    isOwner: (config: any, senderId: string) => {
        const owners = (config.owner?.id || '').split(',').map((n: string) => n.trim());
        return owners.includes(senderId);
    }
};

export default {
    cmd,
    DynamicToolRegistry
};
