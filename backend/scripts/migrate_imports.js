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

console.log(`🚀 Starting ESM import migration in: ${srcDir}`);

let totalFixed = 0;

const IGNORE_EXTENSIONS = ['.js', '.json', '.css', '.png', '.jpg', '.jpeg', '.svg', '.webp', '.mp4', '.mp3', '.wav', '.ogg'];

walk(srcDir, (filePath) => {
    // Skip scripts
    if (filePath.includes('refactor.ts') || filePath.includes('migrate_imports.js')) return;

    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    let modified = false;

    const newLines = lines.map(line => {
        // Match: from './something' or from "/something"
        // Also handle export ... from
        if (line.includes('from \'')) {
            const match = line.match(/(from\s+['"])(\.\.?\/[^'"]+)(['"])/);
            if (match) {
                const [fullMatch, prefix, relPath, suffix] = match;
                
                // Check if it already has an extension we want to ignore
                const hasExtension = IGNORE_EXTENSIONS.some(ext => relPath.endsWith(ext));
                
                if (!hasExtension) {
                    modified = true;
                    return line.replace(fullMatch, `${prefix}${relPath}.js${suffix}`);
                }
            }
        } else if (line.includes('from "')) {
             const match = line.match(/(from\s+[""])(\.\.?\/[^'"]+)([""])/);
             if (match) {
                const [fullMatch, prefix, relPath, suffix] = match;
                
                // Check if it already has an extension we want to ignore
                const hasExtension = IGNORE_EXTENSIONS.some(ext => relPath.endsWith(ext));
                
                if (!hasExtension) {
                    modified = true;
                    return line.replace(fullMatch, `${prefix}${relPath}.js${suffix}`);
                }
            }
        }
        return line;
    });

    if (modified) {
        fs.writeFileSync(filePath, newLines.join('\n'));
        totalFixed++;
        console.log(`✅ Fixed imports in: ${path.relative(srcDir, filePath)}`);
    }
});

console.log(`\n🎉 Migration complete! Fixed ${totalFixed} files.`);
