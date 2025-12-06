// Jest global setup for WhatsDeX
process.env.NODE_ENV = process.env.NODE_ENV || 'test';
process.env.LOG_LEVEL = process.env.LOG_LEVEL || 'silent';

// Reduce noisy logs during tests
const noop = () => {};
if (process.env.CI || process.env.JEST_WORKER_ID !== undefined) {
  console.log = noop;
  console.warn = noop;
}
