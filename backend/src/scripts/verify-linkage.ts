import * as openclaw from 'openclaw';

async function verify() {
  console.log('Verifying OpenClaw internal linkage...');
  try {
    console.log('OpenClaw module loaded. Exports:', Object.keys(openclaw));
    if (typeof (openclaw as any).startGatewayServer === 'function') {
      console.log('SUCCESS: startGatewayServer is available.');
    } else {
      console.log('FAILURE: startGatewayServer is NOT available.');
    }
    process.exit(0);
  } catch (error) {
    console.error('Failed during verification:', error);
    process.exit(1);
  }
}

verify();
