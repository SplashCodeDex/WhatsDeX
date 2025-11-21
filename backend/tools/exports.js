import api from './api.js';
import mime from 'mime-types';

// Mock cmd helpers based on usage in geminicanvas.js
const cmd = {
    checkMedia: (contentType, type) => {
        if (!contentType) return false;
        return contentType.includes(type);
    },
    checkQuotedMedia: (contentType, type) => {
        if (!contentType) return false;
        return contentType.includes(type);
    },
    handleError: (ctx, error, isCritical) => {
        console.error('Command Error:', error);
        ctx.reply(`An error occurred: ${error.message}`);
    }
};

// Mock msg helpers based on usage
const msg = {
    generateInstruction: (actions, types) => {
        const actionStr = Array.isArray(actions) ? actions.join('/') : actions;
        const typeStr = Array.isArray(types) ? types.join('/') : types;
        return `Please ${actionStr} a ${typeStr}.`;
    },
    generateCmdExample: (used, example) => {
        return `Example: ${used.prefix}${used.command} ${example}`;
    }
};

export default {
    api,
    cmd,
    msg,
    mime
};
