async function test() {
  try {
    const healthState = await import('../../../openclaw/src/gateway/server/health-state.js');
    console.log('Success:', Object.keys(healthState));
  } catch (err) {
    console.error('Error importing health-state.js:');
    console.error(err);
  }
}
test();
