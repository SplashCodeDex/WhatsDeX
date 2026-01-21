import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const srcDir = path.resolve(__dirname, '../src');

function walk(dir, callback) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            walk(filePath, callback);
        } else if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
            callback(filePath);
        }
    }
}

const IGNORE_EXTENSIONS = ['.js', '.json', '.css', '.png', '.jpg', '.jpeg', '.svg', '.webp', '.mp4', '.mp3', '.wav', '.ogg'];

console.log('Searching for missing .js extensions...');

walk(srcDir, (filePath) => {
    if (filePath.includes('refactor.ts') || filePath.includes('migrate_imports.js')) return;

    const content = fs.readFileSync(filePath, 'utf-8');
    const matches = content.matchAll(/from\s+['"](\.\.?\/[^'"]+)['"]/g);
    
    for (const match of matches) {
        const relPath = match[1];
        const hasExtension = IGNORE_EXTENSIONS.some(ext => relPath.endsWith(ext));
        if (!hasExtension) {
            console.log(`${path.relative(srcDir, filePath)}: ${match[0]}`);
        }
    }
});
