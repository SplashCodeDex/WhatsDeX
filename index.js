// Impor modul dan dependensi yang diperlukan
const context = require("./context.js");
const CFonts = require("cfonts");
const http = require("node:http");
const main = require("./main.js");

const { config, consolefy, pkg } = {
    config: context.config,
    consolefy: context.consolefy,
    pkg: require("./package.json")
};

consolefy.log("Starting..."); // Logging initial process

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
    http.createServer((_, res) => res.end(`${pkg.name} is running on port ${port}`)).listen(port, () => consolefy.success(`${pkg.name} runs on port ${port}`));
}

main(context); // Jalankan modul utama