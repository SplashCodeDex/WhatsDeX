// Impor modul dan dependensi yang diperlukan
const context = require("./context.js");
const CFonts = require("cfonts");
const http = require("node:http");
const main = require("./main.js");

const { config, pkg } = {
    config: context.config,
    pkg: require("./package.json")
};

console.log("🚀 Starting WhatsDeX..."); // Logging initial process

// Tampilkan nama proyek serta deskripsi lain
CFonts.say(pkg.name, {
    colors: ["#00A1E0", "#00FFFF"],
    align: "center"
});

CFonts.say(`${pkg.description} - By ${pkg.author}`, {
    font: "console",
    colors: ["#E0F7FF"],
    align: "center"
});

// Jalankan server jika diaktifkan dalam konfigurasi
if (config.system.useServer) {
    const { port } = config.system;
    http.createServer((_, res) => res.end(`${pkg.name} is running on port ${port}`)).listen(port, () => console.log(`✅ ${pkg.name} runs on port ${port}`));
}

(async () => {
    try {
        await main(context); // Jalankan modul utama dengan async/await
    } catch (error) {
        console.error(`❌ Fatal Error: ${error.message}`);
        process.exit(1);
    }
})();