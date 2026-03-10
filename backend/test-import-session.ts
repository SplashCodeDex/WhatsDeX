async function test() {
  try {
    const sessionUtils = await import('../openclaw/src/gateway/session-utils.js');
    console.log('session-utils Success!', Object.keys(sessionUtils));
  } catch (err: any) {
    const fs = await import('fs');
    fs.writeFileSync('error-output.txt', err.stack || String(err));
    console.log('Wrote error to error-output.txt');
  }
}
test();
