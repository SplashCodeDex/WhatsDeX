'use client';

import React from 'react';

import { AccountSettings } from '@/features/settings';

export default function SettingsPage(): React.JSX.Element {
    return (
        <div className="p-8">
            <AccountSettings />
        </div>
    );
}
