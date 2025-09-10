const os = require('os');

console.log('--- Node.js Diagnostics ---');

// System Information
console.log('\nSystem Information:');
console.log(`  OS Platform: ${os.platform()}`);
console.log(`  OS Type: ${os.type()}`);
console.log(`  OS Release: ${os.release()}`);
console.log(`  OS Architecture: ${os.arch()}`);
console.log(`  CPU Cores: ${os.cpus().length}`);
console.log(`  Total Memory: ${(os.totalmem() / (1024 ** 3)).toFixed(2)} GB`);
console.log(`  Free Memory: ${(os.freemem() / (1024 ** 3)).toFixed(2)} GB`);
console.log(`  System Uptime: ${os.uptime()} seconds`);

// Node.js and V8 Information
console.log('\nNode.js Information:');
console.log(`  Node.js Version: ${process.version}`);
console.log(`  V8 Version: ${process.versions.v8}`);
console.log(`  Process ID: ${process.pid}`);
console.log(`  Process Uptime: ${process.uptime()} seconds`);

// Process Memory Usage
console.log('\nProcess Memory Usage (bytes):');
const memoryUsage = process.memoryUsage();
for (const key in memoryUsage) {
  console.log(`  ${key}: ${memoryUsage[key]}`);
}

// Environment Variables (common ones)
console.log('\nEnvironment Variables (selected):');
const envVars = [
  'NODE_ENV',
  'PORT',
  'HOME',
  'PATH',
  'TEMP',
  'TMP',
  'USERPROFILE' // For Windows
];
envVars.forEach(key => {
  if (process.env[key]) {
    console.log(`  ${key}: ${process.env[key]}`);
  }
});

// Event Loop Lag (simple approximation)
console.log('\nEvent Loop Lag (approximation):');
const start = process.hrtime.bigint();
setTimeout(() => {
  const end = process.hrtime.bigint();
  const lag = Number(end - start) / 1_000_000; // Convert nanoseconds to milliseconds
  console.log(`  Lag: ${lag.toFixed(2)} ms`);
}, 0);

console.log('\n--- End of Diagnostics ---');
