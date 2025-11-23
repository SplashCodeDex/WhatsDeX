
export const convertMsToDuration = (ms) => {
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));

    return [
        days > 0 ? `${days}d` : '',
        hours > 0 ? `${hours}h` : '',
        minutes > 0 ? `${minutes}m` : '',
        seconds > 0 ? `${seconds}s` : ''
    ].filter(Boolean).join(' ') || '0s';
};

export const formatSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const generateInstruction = (actions, types) => {
    const actionStr = Array.isArray(actions) ? actions.join('/') : actions;
    const typeStr = Array.isArray(types) ? types.join('/') : types;
    return `Please ${actionStr} a ${typeStr}.`;
};

export const generateCmdExample = (used, example) => {
    return `Example: ${used.prefix}${used.command} ${example}`;
};

export default {
    convertMsToDuration,
    formatSize,
    generateInstruction,
    generateCmdExample
};
