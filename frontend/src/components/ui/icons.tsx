/**
 * WhatsDeX - Custom SVG Icon Components
 * Brand-aligned programmatic icons
 */

import React from 'react';

interface IconProps {
    size?: number;
    className?: string;
    color?: string;
}

/**
 * 1. Bot Icon - Represents automation and AI
 */
export function BotIcon({ size = 24, className = '', color = 'currentColor' }: IconProps) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <path
                d="M12 2C11.4477 2 11 2.44772 11 3V4H8C6.89543 4 6 4.89543 6 6V18C6 19.1046 6.89543 20 8 20H16C17.1046 20 18 19.1046 18 18V6C18 4.89543 17.1046 4 16 4H13V3C13 2.44772 12.5523 2 12 2Z"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
            />
            <circle cx="9" cy="10" r="1.5" fill={color} />
            <circle cx="15" cy="10" r="1.5" fill={color} />
            <path
                d="M9 14H15"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
            />
            <circle cx="12" cy="6" r="1" fill={color} />
        </svg>
    );
}

/**
 * 2. Message Automation Icon - Chat + Gear
 */
export function MessageAutomationIcon({ size = 24, className = '', color = 'currentColor' }: IconProps) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            {/* Chat bubble */}
            <path
                d="M3 6C3 4.89543 3.89543 4 5 4H15C16.1046 4 17 4.89543 17 6V12C17 13.1046 16.1046 14 15 14H8L3 18V6Z"
                stroke={color}
                strokeWidth="2"
                strokeLinejoin="round"
            />
            {/* Gear */}
            <circle cx="17" cy="17" r="4" stroke={color} strokeWidth="1.5" />
            <circle cx="17" cy="17" r="1.5" fill={color} />
            <path
                d="M17 13V14M17 20V21M13 17H14M20 17H21M14.5 14.5L15.2 15.2M18.8 18.8L19.5 19.5M19.5 14.5L18.8 15.2M15.2 18.8L14.5 19.5"
                stroke={color}
                strokeWidth="1.5"
                strokeLinecap="round"
            />
        </svg>
    );
}

/**
 * 3. Analytics Dashboard Icon
 */
export function AnalyticsIcon({ size = 24, className = '', color = 'currentColor' }: IconProps) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <rect x="3" y="3" width="18" height="18" rx="2" stroke={color} strokeWidth="2" />
            <path d="M7 15L10 12L13 14L17 10" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="17" cy="10" r="1.5" fill={color} />
            <line x1="7" y1="7" x2="11" y2="7" stroke={color} strokeWidth="2" strokeLinecap="round" />
        </svg>
    );
}

/**
 * 4. Contacts Import Icon
 */
export function ContactsIcon({ size = 24, className = '', color = 'currentColor' }: IconProps) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <rect x="3" y="4" width="18" height="16" rx="2" stroke={color} strokeWidth="2" />
            <circle cx="9" cy="10" r="2" stroke={color} strokeWidth="1.5" />
            <path
                d="M6 16C6 14.5 7 13.5 9 13.5C11 13.5 12 14.5 12 16"
                stroke={color}
                strokeWidth="1.5"
                strokeLinecap="round"
            />
            <line x1="14" y1="9" x2="18" y2="9" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
            <line x1="14" y1="12" x2="18" y2="12" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
            <line x1="14" y1="15" x2="16" y2="15" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    );
}

/**
 * 5. Campaign Icon - Megaphone
 */
export function CampaignIcon({ size = 24, className = '', color = 'currentColor' }: IconProps) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <path
                d="M18 8L21 6V18L18 16M18 8L6 4V20L18 16M18 8V16"
                stroke={color}
                strokeWidth="2"
                strokeLinejoin="round"
            />
            <path
                d="M6 15L4 16V18L6 17"
                stroke={color}
                strokeWidth="2"
                strokeLinejoin="round"
            />
        </svg>
    );
}

/**
 * 6. QR Code Icon
 */
export function QRCodeIcon({ size = 24, className = '', color = 'currentColor' }: IconProps) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <rect x="3" y="3" width="7" height="7" rx="1" stroke={color} strokeWidth="2" />
            <rect x="14" y="3" width="7" height="7" rx="1" stroke={color} strokeWidth="2" />
            <rect x="3" y="14" width="7" height="7" rx="1" stroke={color} strokeWidth="2" />
            <rect x="5" y="5" width="3" height="3" fill={color} />
            <rect x="16" y="5" width="3" height="3" fill={color} />
            <rect x="5" y="16" width="3" height="3" fill={color} />
            <rect x="14" y="14" width="3" height="3" fill={color} />
            <rect x="18" y="14" width="3" height="3" fill={color} />
            <rect x="14" y="18" width="3" height="3" fill={color} />
        </svg>
    );
}

// Export all icons as a collection
export const WhatsDeXIcons = {
    Bot: BotIcon,
    MessageAutomation: MessageAutomationIcon,
    Analytics: AnalyticsIcon,
    Contacts: ContactsIcon,
    Campaign: CampaignIcon,
    QRCode: QRCodeIcon,
};
