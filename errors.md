npm run dev:frontend

> whatsdex@1.4.13-alpha.1 dev:frontend
> cd web && npm run dev

> whatsdex-dashboard@1.0.0 dev
> next dev

▲ Next.js 14.2.33

- Local: http://localhost:3000
- Experiments (use with caution):
  · optimizeCss
  · scrollRestoration

✓ Starting...
✓ Ready in 2.7s
⚠ Your project has `@next/font` installed as a dependency, please use the built-in `next/font` instead. The `@next/font` package will be removed in Next.js 14. You can migrate by running `npx @next/codemod@latest built-in-next-font .`. Read more: https://nextjs.org/docs/messages/built-in-next-font
○ Compiling / ...
⨯ ../shared/components/ui/GlassButton.tsx
Module parse failed: The keyword 'interface' is reserved (5:0)
You may need an appropriate loader to handle this file type, currently no loaders are configured to process this file. See https://webpack.js.org/concepts#loaders
| import \* as React from 'react';
|

> interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
> | children: React.ReactNode;
> | variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'ghost';

Import trace for requested module:
../shared/components/ui/GlassButton.tsx
⨯ ../shared/components/ui/GlassButton.tsx
Module parse failed: The keyword 'interface' is reserved (5:0)
You may need an appropriate loader to handle this file type, currently no loaders are configured to process this file. See https://webpack.js.org/concepts#loaders
| import \* as React from 'react';
|

> interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
> | children: React.ReactNode;
> | variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'ghost';

Import trace for requested module:
../shared/components/ui/GlassButton.tsx
⨯ Error: Cannot find module 'critters'
Require stack:

- W:\CodeDeX\WhatsDeX\web\node_modules\next\dist\server\post-process.js
- W:\CodeDeX\WhatsDeX\web\node_modules\next\dist\server\render.js
- W:\CodeDeX\WhatsDeX\web\node_modules\next\dist\server\future\route-modules\pages\module.js
- W:\CodeDeX\WhatsDeX\web\node_modules\next\dist\server\future\route-modules\pages\builtin_error.js
- W:\CodeDeX\WhatsDeX\web\node_modules\next\dist\server\load-default-error-components.js
- W:\CodeDeX\WhatsDeX\web\node_modules\next\dist\server\dev\next-dev-server.js
- W:\CodeDeX\WhatsDeX\web\node_modules\next\dist\server\next.js
- W:\CodeDeX\WhatsDeX\web\node_modules\next\dist\server\lib\start-server.js
  at Function.<anonymous> (node:internal/modules/cjs/loader:1409:15)
  at W:\CodeDeX\WhatsDeX\web\node_modules\next\dist\server\require-hook.js:55:36
  at defaultResolveImpl (node:internal/modules/cjs/loader:1060:19)
  at resolveForCJSWithHooks (node:internal/modules/cjs/loader:1065:22)
  at Function.\_load (node:internal/modules/cjs/loader:1214:37)
  at TracingChannel.traceSync (node:diagnostics_channel:322:14)
  at wrapModuleLoad (node:internal/modules/cjs/loader:234:24)
  at Module.<anonymous> (node:internal/modules/cjs/loader:1495:12)
  at mod.require (W:\CodeDeX\WhatsDeX\web\node_modules\next\dist\server\require-hook.js:65:28)
  at require (node:internal/modules/helpers:135:16)
  at W:\CodeDeX\WhatsDeX\web\node_modules\next\dist\server\post-process.js:147:30
  at postProcessHTML (W:\CodeDeX\WhatsDeX\web\node_modules\next\dist\server\post-process.js:165:29)
  at async renderToHTMLImpl (W:\CodeDeX\WhatsDeX\web\node_modules\next\dist\server\render.js:1016:27)
  at async doRender (W:\CodeDeX\WhatsDeX\web\node_modules\next\dist\server\base-server.js:1414:30)
  at async cacheEntry.responseCache.get.routeKind (W:\CodeDeX\WhatsDeX\web\node_modules\next\dist\server\base-server.js:1588:28) {
  code: 'MODULE_NOT_FOUND',
  requireStack: [
  'W:\\CodeDeX\\WhatsDeX\\web\\node_modules\\next\\dist\\server\\post-process.js',
  'W:\\CodeDeX\\WhatsDeX\\web\\node_modules\\next\\dist\\server\\render.js',
  'W:\\CodeDeX\\WhatsDeX\\web\\node_modules\\next\\dist\\server\\future\\route-modules\\pages\\module.js',
  'W:\\CodeDeX\\WhatsDeX\\web\\node_modules\\next\\dist\\server\\future\\route-modules\\pages\\builtin\\_error.js',
  'W:\\CodeDeX\\WhatsDeX\\web\\node_modules\\next\\dist\\server\\load-default-error-components.js',
  'W:\\CodeDeX\\WhatsDeX\\web\\node_modules\\next\\dist\\server\\dev\\next-dev-server.js',
  'W:\\CodeDeX\\WhatsDeX\\web\\node_modules\\next\\dist\\server\\next.js',
  'W:\\CodeDeX\\WhatsDeX\\web\\node_modules\\next\\dist\\server\\lib\\start-server.js'
  ]
  }
  Error: Cannot find module 'critters'
  Require stack:
- W:\CodeDeX\WhatsDeX\web\node_modules\next\dist\server\post-process.js
- W:\CodeDeX\WhatsDeX\web\node_modules\next\dist\server\render.js
- W:\CodeDeX\WhatsDeX\web\node_modules\next\dist\server\future\route-modules\pages\module.js
- W:\CodeDeX\WhatsDeX\web\node_modules\next\dist\server\future\route-modules\pages\builtin_error.js
- W:\CodeDeX\WhatsDeX\web\node_modules\next\dist\server\load-default-error-components.js
- W:\CodeDeX\WhatsDeX\web\node_modules\next\dist\server\dev\next-dev-server.js
- W:\CodeDeX\WhatsDeX\web\node_modules\next\dist\server\next.js
- W:\CodeDeX\WhatsDeX\web\node_modules\next\dist\server\lib\start-server.js
  at Function.<anonymous> (node:internal/modules/cjs/loader:1409:15)
  at W:\CodeDeX\WhatsDeX\web\node_modules\next\dist\server\require-hook.js:55:36
  at defaultResolveImpl (node:internal/modules/cjs/loader:1060:19)
  at resolveForCJSWithHooks (node:internal/modules/cjs/loader:1065:22)
  at Function.\_load (node:internal/modules/cjs/loader:1214:37)
  at TracingChannel.traceSync (node:diagnostics_channel:322:14)
  at wrapModuleLoad (node:internal/modules/cjs/loader:234:24)
  at Module.<anonymous> (node:internal/modules/cjs/loader:1495:12)
  at mod.require (W:\CodeDeX\WhatsDeX\web\node_modules\next\dist\server\require-hook.js:65:28)
  at require (node:internal/modules/helpers:135:16)
  at W:\CodeDeX\WhatsDeX\web\node_modules\next\dist\server\post-process.js:147:30
  at postProcessHTML (W:\CodeDeX\WhatsDeX\web\node_modules\next\dist\server\post-process.js:165:29)
  at async renderToHTMLImpl (W:\CodeDeX\WhatsDeX\web\node_modules\next\dist\server\render.js:1016:27)
  at async doRender (W:\CodeDeX\WhatsDeX\web\node_modules\next\dist\server\base-server.js:1414:30)
  at async cacheEntry.responseCache.get.routeKind (W:\CodeDeX\WhatsDeX\web\node_modules\next\dist\server\base-server.js:1588:28) {
  code: 'MODULE_NOT_FOUND',
  requireStack: [
  'W:\\CodeDeX\\WhatsDeX\\web\\node_modules\\next\\dist\\server\\post-process.js',
  'W:\\CodeDeX\\WhatsDeX\\web\\node_modules\\next\\dist\\server\\render.js',
  'W:\\CodeDeX\\WhatsDeX\\web\\node_modules\\next\\dist\\server\\future\\route-modules\\pages\\module.js',
  'W:\\CodeDeX\\WhatsDeX\\web\\node_modules\\next\\dist\\server\\future\\route-modules\\pages\\builtin\\_error.js',
  'W:\\CodeDeX\\WhatsDeX\\web\\node_modules\\next\\dist\\server\\load-default-error-components.js',
  'W:\\CodeDeX\\WhatsDeX\\web\\node_modules\\next\\dist\\server\\dev\\next-dev-server.js',
  'W:\\CodeDeX\\WhatsDeX\\web\\node_modules\\next\\dist\\server\\next.js',
  'W:\\CodeDeX\\WhatsDeX\\web\\node_modules\\next\\dist\\server\\lib\\start-server.js'
  ]
  }
  Error: Cannot find module 'critters'
  Require stack:
- W:\CodeDeX\WhatsDeX\web\node_modules\next\dist\server\post-process.js
- W:\CodeDeX\WhatsDeX\web\node_modules\next\dist\server\render.js
- W:\CodeDeX\WhatsDeX\web\node_modules\next\dist\server\future\route-modules\pages\module.js
- W:\CodeDeX\WhatsDeX\web\node_modules\next\dist\server\future\route-modules\pages\builtin_error.js
- W:\CodeDeX\WhatsDeX\web\node_modules\next\dist\server\load-default-error-components.js
- W:\CodeDeX\WhatsDeX\web\node_modules\next\dist\server\dev\next-dev-server.js
- W:\CodeDeX\WhatsDeX\web\node_modules\next\dist\server\next.js
- W:\CodeDeX\WhatsDeX\web\node_modules\next\dist\server\lib\start-server.js
  at Function.<anonymous> (node:internal/modules/cjs/loader:1409:15)
  at W:\CodeDeX\WhatsDeX\web\node_modules\next\dist\server\require-hook.js:55:36
  at defaultResolveImpl (node:internal/modules/cjs/loader:1060:19)
  at resolveForCJSWithHooks (node:internal/modules/cjs/loader:1065:22)
  at Function.\_load (node:internal/modules/cjs/loader:1214:37)
  at TracingChannel.traceSync (node:diagnostics_channel:322:14)
  at wrapModuleLoad (node:internal/modules/cjs/loader:234:24)
  at Module.<anonymous> (node:internal/modules/cjs/loader:1495:12)
  at mod.require (W:\CodeDeX\WhatsDeX\web\node_modules\next\dist\server\require-hook.js:65:28)
  at require (node:internal/modules/helpers:135:16)
  at W:\CodeDeX\WhatsDeX\web\node_modules\next\dist\server\post-process.js:147:30
  at postProcessHTML (W:\CodeDeX\WhatsDeX\web\node_modules\next\dist\server\post-process.js:165:29)
  at async renderToHTMLImpl (W:\CodeDeX\WhatsDeX\web\node_modules\next\dist\server\render.js:1016:27)
  at async doRender (W:\CodeDeX\WhatsDeX\web\node_modules\next\dist\server\base-server.js:1414:30)
  at async cacheEntry.responseCache.get.routeKind (W:\CodeDeX\WhatsDeX\web\node_modules\next\dist\server\base-server.js:1588:28) {
  code: 'MODULE_NOT_FOUND',
  requireStack: [
  'W:\\CodeDeX\\WhatsDeX\\web\\node_modules\\next\\dist\\server\\post-process.js',
  'W:\\CodeDeX\\WhatsDeX\\web\\node_modules\\next\\dist\\server\\render.js',
  'W:\\CodeDeX\\WhatsDeX\\web\\node_modules\\next\\dist\\server\\future\\route-modules\\pages\\module.js',
  'W:\\CodeDeX\\WhatsDeX\\web\\node_modules\\next\\dist\\server\\future\\route-modules\\pages\\builtin\\_error.js',
  'W:\\CodeDeX\\WhatsDeX\\web\\node_modules\\next\\dist\\server\\load-default-error-components.js',
  'W:\\CodeDeX\\WhatsDeX\\web\\node_modules\\next\\dist\\server\\dev\\next-dev-server.js',
  'W:\\CodeDeX\\WhatsDeX\\web\\node_modules\\next\\dist\\server\\next.js',
  'W:\\CodeDeX\\WhatsDeX\\web\\node_modules\\next\\dist\\server\\lib\\start-server.js'
  ]
  }
  GET / 500 in 2929ms
  GET / 500 in 15ms npm run dev:frontend

> whatsdex@1.4.13-alpha.1 dev:frontend
> cd web && npm run dev

> whatsdex-dashboard@1.0.0 dev
> next dev

▲ Next.js 14.2.33

- Local: http://localhost:3000
- Experiments (use with caution):
  · optimizeCss
  · scrollRestoration

✓ Starting...
✓ Ready in 2.7s
⚠ Your project has `@next/font` installed as a dependency, please use the built-in `next/font` instead. The `@next/font` package will be removed in Next.js 14. You can migrate by running `npx @next/codemod@latest built-in-next-font .`. Read more: https://nextjs.org/docs/messages/built-in-next-font
○ Compiling / ...
⨯ ../shared/components/ui/GlassButton.tsx
Module parse failed: The keyword 'interface' is reserved (5:0)
You may need an appropriate loader to handle this file type, currently no loaders are configured to process this file. See https://webpack.js.org/concepts#loaders
| import \* as React from 'react';
|

> interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
> | children: React.ReactNode;
> | variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'ghost';

Import trace for requested module:
../shared/components/ui/GlassButton.tsx
⨯ ../shared/components/ui/GlassButton.tsx
Module parse failed: The keyword 'interface' is reserved (5:0)
You may need an appropriate loader to handle this file type, currently no loaders are configured to process this file. See https://webpack.js.org/concepts#loaders
| import \* as React from 'react';
|

> interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
> | children: React.ReactNode;
> | variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'ghost';

Import trace for requested module:
../shared/components/ui/GlassButton.tsx
⨯ Error: Cannot find module 'critters'
Require stack:

- W:\CodeDeX\WhatsDeX\web\node_modules\next\dist\server\post-process.js
- W:\CodeDeX\WhatsDeX\web\node_modules\next\dist\server\render.js
- W:\CodeDeX\WhatsDeX\web\node_modules\next\dist\server\future\route-modules\pages\module.js
- W:\CodeDeX\WhatsDeX\web\node_modules\next\dist\server\future\route-modules\pages\builtin_error.js
- W:\CodeDeX\WhatsDeX\web\node_modules\next\dist\server\load-default-error-components.js
- W:\CodeDeX\WhatsDeX\web\node_modules\next\dist\server\dev\next-dev-server.js
- W:\CodeDeX\WhatsDeX\web\node_modules\next\dist\server\next.js
- W:\CodeDeX\WhatsDeX\web\node_modules\next\dist\server\lib\start-server.js
  at Function.<anonymous> (node:internal/modules/cjs/loader:1409:15)
  at W:\CodeDeX\WhatsDeX\web\node_modules\next\dist\server\require-hook.js:55:36
  at defaultResolveImpl (node:internal/modules/cjs/loader:1060:19)
  at resolveForCJSWithHooks (node:internal/modules/cjs/loader:1065:22)
  at Function.\_load (node:internal/modules/cjs/loader:1214:37)
  at TracingChannel.traceSync (node:diagnostics_channel:322:14)
  at wrapModuleLoad (node:internal/modules/cjs/loader:234:24)
  at Module.<anonymous> (node:internal/modules/cjs/loader:1495:12)
  at mod.require (W:\CodeDeX\WhatsDeX\web\node_modules\next\dist\server\require-hook.js:65:28)
  at require (node:internal/modules/helpers:135:16)
  at W:\CodeDeX\WhatsDeX\web\node_modules\next\dist\server\post-process.js:147:30
  at postProcessHTML (W:\CodeDeX\WhatsDeX\web\node_modules\next\dist\server\post-process.js:165:29)
  at async renderToHTMLImpl (W:\CodeDeX\WhatsDeX\web\node_modules\next\dist\server\render.js:1016:27)
  at async doRender (W:\CodeDeX\WhatsDeX\web\node_modules\next\dist\server\base-server.js:1414:30)
  at async cacheEntry.responseCache.get.routeKind (W:\CodeDeX\WhatsDeX\web\node_modules\next\dist\server\base-server.js:1588:28) {
  code: 'MODULE_NOT_FOUND',
  requireStack: [
  'W:\\CodeDeX\\WhatsDeX\\web\\node_modules\\next\\dist\\server\\post-process.js',
  'W:\\CodeDeX\\WhatsDeX\\web\\node_modules\\next\\dist\\server\\render.js',
  'W:\\CodeDeX\\WhatsDeX\\web\\node_modules\\next\\dist\\server\\future\\route-modules\\pages\\module.js',
  'W:\\CodeDeX\\WhatsDeX\\web\\node_modules\\next\\dist\\server\\future\\route-modules\\pages\\builtin\\_error.js',
  'W:\\CodeDeX\\WhatsDeX\\web\\node_modules\\next\\dist\\server\\load-default-error-components.js',
  'W:\\CodeDeX\\WhatsDeX\\web\\node_modules\\next\\dist\\server\\dev\\next-dev-server.js',
  'W:\\CodeDeX\\WhatsDeX\\web\\node_modules\\next\\dist\\server\\next.js',
  'W:\\CodeDeX\\WhatsDeX\\web\\node_modules\\next\\dist\\server\\lib\\start-server.js'
  ]
  }
  Error: Cannot find module 'critters'
  Require stack:
- W:\CodeDeX\WhatsDeX\web\node_modules\next\dist\server\post-process.js
- W:\CodeDeX\WhatsDeX\web\node_modules\next\dist\server\render.js
- W:\CodeDeX\WhatsDeX\web\node_modules\next\dist\server\future\route-modules\pages\module.js
- W:\CodeDeX\WhatsDeX\web\node_modules\next\dist\server\future\route-modules\pages\builtin_error.js
- W:\CodeDeX\WhatsDeX\web\node_modules\next\dist\server\load-default-error-components.js
- W:\CodeDeX\WhatsDeX\web\node_modules\next\dist\server\dev\next-dev-server.js
- W:\CodeDeX\WhatsDeX\web\node_modules\next\dist\server\next.js
- W:\CodeDeX\WhatsDeX\web\node_modules\next\dist\server\lib\start-server.js
  at Function.<anonymous> (node:internal/modules/cjs/loader:1409:15)
  at W:\CodeDeX\WhatsDeX\web\node_modules\next\dist\server\require-hook.js:55:36
  at defaultResolveImpl (node:internal/modules/cjs/loader:1060:19)
  at resolveForCJSWithHooks (node:internal/modules/cjs/loader:1065:22)
  at Function.\_load (node:internal/modules/cjs/loader:1214:37)
  at TracingChannel.traceSync (node:diagnostics_channel:322:14)
  at wrapModuleLoad (node:internal/modules/cjs/loader:234:24)
  at Module.<anonymous> (node:internal/modules/cjs/loader:1495:12)
  at mod.require (W:\CodeDeX\WhatsDeX\web\node_modules\next\dist\server\require-hook.js:65:28)
  at require (node:internal/modules/helpers:135:16)
  at W:\CodeDeX\WhatsDeX\web\node_modules\next\dist\server\post-process.js:147:30
  at postProcessHTML (W:\CodeDeX\WhatsDeX\web\node_modules\next\dist\server\post-process.js:165:29)
  at async renderToHTMLImpl (W:\CodeDeX\WhatsDeX\web\node_modules\next\dist\server\render.js:1016:27)
  at async doRender (W:\CodeDeX\WhatsDeX\web\node_modules\next\dist\server\base-server.js:1414:30)
  at async cacheEntry.responseCache.get.routeKind (W:\CodeDeX\WhatsDeX\web\node_modules\next\dist\server\base-server.js:1588:28) {
  code: 'MODULE_NOT_FOUND',
  requireStack: [
  'W:\\CodeDeX\\WhatsDeX\\web\\node_modules\\next\\dist\\server\\post-process.js',
  'W:\\CodeDeX\\WhatsDeX\\web\\node_modules\\next\\dist\\server\\render.js',
  'W:\\CodeDeX\\WhatsDeX\\web\\node_modules\\next\\dist\\server\\future\\route-modules\\pages\\module.js',
  'W:\\CodeDeX\\WhatsDeX\\web\\node_modules\\next\\dist\\server\\future\\route-modules\\pages\\builtin\\_error.js',
  'W:\\CodeDeX\\WhatsDeX\\web\\node_modules\\next\\dist\\server\\load-default-error-components.js',
  'W:\\CodeDeX\\WhatsDeX\\web\\node_modules\\next\\dist\\server\\dev\\next-dev-server.js',
  'W:\\CodeDeX\\WhatsDeX\\web\\node_modules\\next\\dist\\server\\next.js',
  'W:\\CodeDeX\\WhatsDeX\\web\\node_modules\\next\\dist\\server\\lib\\start-server.js'
  ]
  }
  Error: Cannot find module 'critters'
  Require stack:
- W:\CodeDeX\WhatsDeX\web\node_modules\next\dist\server\post-process.js
- W:\CodeDeX\WhatsDeX\web\node_modules\next\dist\server\render.js
- W:\CodeDeX\WhatsDeX\web\node_modules\next\dist\server\future\route-modules\pages\module.js
- W:\CodeDeX\WhatsDeX\web\node_modules\next\dist\server\future\route-modules\pages\builtin_error.js
- W:\CodeDeX\WhatsDeX\web\node_modules\next\dist\server\load-default-error-components.js
- W:\CodeDeX\WhatsDeX\web\node_modules\next\dist\server\dev\next-dev-server.js
- W:\CodeDeX\WhatsDeX\web\node_modules\next\dist\server\next.js
- W:\CodeDeX\WhatsDeX\web\node_modules\next\dist\server\lib\start-server.js
  at Function.<anonymous> (node:internal/modules/cjs/loader:1409:15)
  at W:\CodeDeX\WhatsDeX\web\node_modules\next\dist\server\require-hook.js:55:36
  at defaultResolveImpl (node:internal/modules/cjs/loader:1060:19)
  at resolveForCJSWithHooks (node:internal/modules/cjs/loader:1065:22)
  at Function.\_load (node:internal/modules/cjs/loader:1214:37)
  at TracingChannel.traceSync (node:diagnostics_channel:322:14)
  at wrapModuleLoad (node:internal/modules/cjs/loader:234:24)
  at Module.<anonymous> (node:internal/modules/cjs/loader:1495:12)
  at mod.require (W:\CodeDeX\WhatsDeX\web\node_modules\next\dist\server\require-hook.js:65:28)
  at require (node:internal/modules/helpers:135:16)
  at W:\CodeDeX\WhatsDeX\web\node_modules\next\dist\server\post-process.js:147:30
  at postProcessHTML (W:\CodeDeX\WhatsDeX\web\node_modules\next\dist\server\post-process.js:165:29)
  at async renderToHTMLImpl (W:\CodeDeX\WhatsDeX\web\node_modules\next\dist\server\render.js:1016:27)
  at async doRender (W:\CodeDeX\WhatsDeX\web\node_modules\next\dist\server\base-server.js:1414:30)
  at async cacheEntry.responseCache.get.routeKind (W:\CodeDeX\WhatsDeX\web\node_modules\next\dist\server\base-server.js:1588:28) {
  code: 'MODULE_NOT_FOUND',
  requireStack: [
  'W:\\CodeDeX\\WhatsDeX\\web\\node_modules\\next\\dist\\server\\post-process.js',
  'W:\\CodeDeX\\WhatsDeX\\web\\node_modules\\next\\dist\\server\\render.js',
  'W:\\CodeDeX\\WhatsDeX\\web\\node_modules\\next\\dist\\server\\future\\route-modules\\pages\\module.js',
  'W:\\CodeDeX\\WhatsDeX\\web\\node_modules\\next\\dist\\server\\future\\route-modules\\pages\\builtin\\_error.js',
  'W:\\CodeDeX\\WhatsDeX\\web\\node_modules\\next\\dist\\server\\load-default-error-components.js',
  'W:\\CodeDeX\\WhatsDeX\\web\\node_modules\\next\\dist\\server\\dev\\next-dev-server.js',
  'W:\\CodeDeX\\WhatsDeX\\web\\node_modules\\next\\dist\\server\\next.js',
  'W:\\CodeDeX\\WhatsDeX\\web\\node_modules\\next\\dist\\server\\lib\\start-server.js'
  ]
  }
  GET / 500 in 2929ms
  GET / 500 in 15ms
