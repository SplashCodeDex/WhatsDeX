'use client';

import React from 'react';

import { AgentsDashboard } from '@/features/agents/components/AgentsDashboard';

/**
 * AgentsPage (Thin Page)
 * Adheres to DeXMart 2026 Rule 169:
 * Pages should ONLY fetch initial data and render a Feature Component.
 */
export default function AgentsPage(): React.JSX.Element {
    return <AgentsDashboard />;
}
