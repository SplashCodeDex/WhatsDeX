// Impor modul dan dependensi yang diperlukan
import CFonts from 'cfonts';
import http from 'node:http';
import context from './context.js';
import main from './main.js';
import pkg from './package.json' with { type: 'json' };

const { config } = {
  config: context.config,
};

console.log('🚀 Starting WhatsDeX...'); // Logging initial process

// Tampilkan nama proyek serta deskripsi lain
CFonts.say(pkg.name, {
  colors: ['#00A1E0', '#00FFFF'],
  align: 'center',
});

CFonts.say(`${pkg.description} - By ${pkg.author}`, {
  font: 'console',
  colors: ['#E0F7FF'],
  align: 'center',
});

import { initSocket } from './server.js';

// Jalankan server jika diaktifkan dalam konfigurasi
if (config.system.useServer) {
  const { port } = config.system;
  const server = http.createServer((_, res) => res.end(`${pkg.name} is running on port ${port}`));
  initSocket(server);
  server.listen(port, () => console.log(`✅ ${pkg.name} runs on port ${port}`));
}

(async () => {
  try {
    await main(context); // Jalankan modul utama dengan async/await
  } catch (error) {
    console.error(`❌ Fatal Error: ${error.message}`);
    process.exit(1);
  }
})();
