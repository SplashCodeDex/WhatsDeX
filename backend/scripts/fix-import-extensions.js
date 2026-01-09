import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const targetDir = path.resolve(__dirname, '../src');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else if (file.endsWith('.ts')) {
            results.push(file);
        }
    });
    return results;
}

const files = walk(targetDir);
console.log(`Found ${files.length} files in ${targetDir}`);

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;

    // Regex for relative imports without extensions
    // Matches: import { something } from './path' or import something from '../path'
    // but not from 'some-package' or from './path.js'
    const importRegex = /(from\s+['"])(\.\.?\/[^'"]+)(?<!\.js)(['"])/g;

    const newContent = content.replace(importRegex, (match, p1, p2, p3) => {
        // If it already ends with .css, .json, .png, etc., don't add .js
        if (p2.match(/\.(js|json|css|png|jpg|jpeg|svg|webp)$/)) {
            return match;
        }
        changed = true;
        return `${p1}${p2}.js${p3}`;
    });

    if (changed) {
        fs.writeFileSync(file, newContent, 'utf8');
        console.log(`Fixed: ${path.relative(targetDir, file)}`);
    }
});

console.log('Finished fixing imports.');
