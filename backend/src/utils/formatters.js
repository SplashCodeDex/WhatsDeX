/**
 * WhatsDeX Formatters Utility
 * Consolidated from backend/utils/formatter.js and backend/utils/formatters.js
 *
 * Contains:
 * - WhatsApp text formatting (bold, italic, quote, etc.)
 * - Time/duration formatting utilities
 */

// ============================================
// WhatsApp Text Formatting
// ============================================

export const quote = text => `> ${text}`;

export const bold = text => `*${text}*`;

export const italic = text => `_${text}_`;

export const monospace = text => `\`\`\`
${text}
\`\`\``;

export const inlineCode = text => `\`${text}\``;

// ============================================
// Time/Duration Formatting
// ============================================

/**
 * Convert milliseconds to human-readable duration
 * @param {number} ms - Milliseconds to convert
 * @param {string[]} units - Optional specific units to use
 * @returns {string} Formatted duration string
 */
export function convertMsToDuration(ms, units = []) {
    if (!ms || ms <= 0) return '0 hari';

    const timeUnits = {
        tahun: 31557600000,
        bulan: 2629800000,
        minggu: 604800000,
        hari: 86400000,
        jam: 3600000,
        menit: 60000,
        detik: 1000,
        milidetik: 1,
    };

    if (units.length > 0) {
        const result = [];
        for (const unit of units) {
            if (timeUnits[unit]) {
                const value = Math.floor(ms / timeUnits[unit]);
                if (value > 0) result.push(`${value} ${unit}`);
                ms %= timeUnits[unit];
            }
        }
        return result.join(' ') || `0 ${units[0]}`;
    }

    const result = [];
    for (const [unit, duration] of Object.entries(timeUnits)) {
        const value = Math.floor(ms / duration);
        if (value > 0) {
            result.push(`${value} ${unit}`);
            ms %= duration;
        }
    }
    return result.join(' ') || '0 detik';
}

/**
 * Convert text to title case (capitalize first letter of each word)
 * @param {string} text - Text to convert
 * @returns {string|null} Title-cased text or null if input is falsy
 */
export function ucwords(text) {
    if (!text) return null;
    return text.toLowerCase().replace(/\b\w/g, t => t.toUpperCase());
}

// ============================================
// Default Export (for backward compatibility)
// ============================================

export default {
    // WhatsApp formatting
    quote,
    bold,
    italic,
    monospace,
    inlineCode,
    // Time formatting
    convertMsToDuration,
    ucwords,
};
