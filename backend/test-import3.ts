async function test() {
  try {
    const healthState = await import('../openclaw/src/gateway/server/health-state.js');
    console.log('Success!', Object.keys(healthState));
  } catch (err: any) {
    console.error('Error importing:', err.stack || err);
  }
}
test();
