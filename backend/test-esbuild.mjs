import esbuild from 'esbuild';
import fs from 'fs/promises';

async function run() {
  const file = '../openclaw/src/gateway/server/health-state.ts';
  const code = await fs.readFile(file, 'utf8');
  const result = await esbuild.transform(code, {
    loader: 'ts',
    format: 'esm',
    target: 'esnext',
    keepNames: true
  });
  console.log(result.code);
}
run();
