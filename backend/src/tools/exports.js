import { DynamicToolRegistry } from './DynamicToolRegistry.js';

export const cmd = {
    isOwner: (config, senderId) => {
        const owners = (config.owner?.id || '').split(',').map(n => n.trim());
        return owners.includes(senderId);
    }
};

export default {
    cmd,
    DynamicToolRegistry
};
