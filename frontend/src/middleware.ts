import { proxy, config } from './proxy';

// Re-export the proxy as the Next.js middleware entry point
export { config };
export const middleware = proxy;
