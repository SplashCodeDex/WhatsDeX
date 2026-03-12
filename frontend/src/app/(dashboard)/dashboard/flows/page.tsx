'use client';

import { ReactFlowProvider } from '@xyflow/react';
import React from 'react';

import { FlowsDashboard } from '@/features/flows/components/FlowsDashboard';

/**
 * Flows Page (Thin Page)
 * Adheres to Rule 8.1: Pages should ONLY render one feature component.
 */
export default function FlowsPage() {
  return (
    <ReactFlowProvider>
      <FlowsDashboard />
    </ReactFlowProvider>
  );
}
