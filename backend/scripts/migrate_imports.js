
const fs = require('fs');
const path = require('path');

const walk = (dir, callback) => {
    fs.readdir(dir, (err, files) => {
        if (err) throw err;
        files.forEach(file => {
            const filepath = path.join(dir, file);
            fs.stat(filepath, (err, stats) => {
                if (stats.isDirectory()) {
                    walk(filepath, callback);
                } else if (stats.isFile() && file.endsWith('.ts')) {
                    callback(filepath);
                }
            });
        });
    });
};

const srcDir = path.join(__dirname, '../src');

walk(srcDir, (filepath) => {
    fs.readFile(filepath, 'utf8', (err, data) => {
        if (err) throw err;
        if (data.includes('@whiskeysockets/baileys')) {
            const newData = data.replace(/@whiskeysockets\/baileys/g, 'baileys');
            fs.writeFile(filepath, newData, 'utf8', (err) => {
                if (err) throw err;
                console.log(`Updated: ${filepath}`);
            });
        }
    });
});
