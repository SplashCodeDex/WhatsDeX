# Investigation Report: Next.js 16 Prerender Fetch Error (`HANGING_PROMISE_REJECTION`)

## The Error Context
During the `pnpm build:frontend` process, building the index route (`/`) failed with:
```
Error: During prerendering, fetch() rejects when the prerender is complete. Typically these errors are handled by React but if you move fetch() to a different context by using `setTimeout`, `after`, or similar functions you may observe this error and you should handle it in that context. This occurred at route "/".
    at new Promise (<anonymous>) {
  route: '/',
  expression: 'fetch()',
  digest: 'HANGING_PROMISE_REJECTION'
}
```

## Root Cause Analysis
This is a known issue specific to Next.js App Router (versions 15 and 16).

1. **How Prerendering Works:** When Next.js builds the static version of the landing page, it evaluates all React components (even those marked `'use client'`) to generate the initial HTML shell.
2. **The Spline Component:** The new Spline component imported via `@splinetool/react-spline/next` executes a network `fetch` under the hood to load the 3D `.splinecode` scene data.
3. **The Conflict:** Because this `fetch` occurs inside a third-party client component but doesn't resolve by the time Next.js finishes generating the static HTML, Next.js aborts the pending promise, resulting in the `HANGING_PROMISE_REJECTION`.

When a `fetch()` inside a `Suspense` boundary hangs or takes too long without resolving during the statically analyzing build step, Next.js forcefully terminates it.

## Verification of the Codebase
Looking at `src/components/landing/SplineRobot.tsx`:
```tsx
'use client';
import React, { Suspense } from 'react';
import Spline from '@splinetool/react-spline/next';
```

Even though it has `'use client'`, Next.js still attempts to SSR (server-side render) it during build time to generate static HTML, which triggers the offending internal `fetch()`.

## Proposed Solution (Ready for Execution)
Since 3D scenes strictly require the browser (WebGL/Canvas API) and cannot be meaningfully server-side rendered into HTML anyway, the standard and safest solution is to completely opt this component out of SSR.

We need to dynamically import the `SplineRobot` component in `page.tsx` with `ssr: false` enabled:

```tsx
import dynamic from 'next/dynamic';

const SplineRobot = dynamic(() => import('@/components/landing/SplineRobot').then(mod => mod.SplineRobot), {
    ssr: false,
    loading: () => (
        <div className="absolute inset-0 flex items-center justify-center bg-transparent">
            <div className="w-12 h-12 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin"></div>
        </div>
    )
});
```

This guarantees the component (and its internal `fetch`) will **never** execute during the build/prerendering phase, fully unblocking the build pipeline while maintaining the exact same user experience on the client.
