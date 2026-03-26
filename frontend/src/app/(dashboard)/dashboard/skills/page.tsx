'use client';

import React from 'react';

import { SkillsDashboard } from '@/features/agents/components/SkillsDashboard';

/**
 * Skills Store Page (Thin Page)
 * Adheres to Rule 8.1: Pages should ONLY render one feature component.
 */
export default function SkillsStorePage(): React.JSX.Element {
    return <SkillsDashboard />;
}
