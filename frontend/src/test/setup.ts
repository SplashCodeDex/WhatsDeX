import '@testing-library/jest-dom/vitest';

// Polyfill ResizeObserver for Radix UI components
class ResizeObserver {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

window.ResizeObserver = ResizeObserver;
