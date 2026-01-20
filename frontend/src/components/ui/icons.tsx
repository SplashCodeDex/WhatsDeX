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

/**
 * 7. Google Brand Icon (Official Colors)
 */
export function GoogleIcon({ size = 24, className = '' }: Omit<IconProps, 'color'>) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
            />
            <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
            />
            <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
            />
            <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
            />
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
    Google: GoogleIcon,
};
