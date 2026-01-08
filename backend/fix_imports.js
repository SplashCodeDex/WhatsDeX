
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const srcDir = path.join(__dirname, 'src');

function walk(dir) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            walk(filePath);
        } else if (file.endsWith('.ts')) {
            let content = fs.readFileSync(filePath, 'utf8');
            let changed = false;
            
            // Replace imports: from './path' -> from './path.js'
            // Regex to match relative imports that don't end in .js
            const importRegex = /(import\s+.*?from\s+['"])(\..*?)(?<!\.js)(['"])/g;
            
            content = content.replace(importRegex, (match, p1, p2, p3) => {
                // If it already has an extension (like .json), skip
                if (path.extname(p2) && path.extname(p2) !== '.') return match;
                changed = true;
                return `${p1}${p2}.js${p3}`;
            });

             // Also handle dynamic imports: import('./path')
            const dynamicImportRegex = /(import\(['"])(\..*?)(?<!\.js)(['"]\))/g;
            content = content.replace(dynamicImportRegex, (match, p1, p2, p3) => {
                 if (path.extname(p2) && path.extname(p2) !== '.') return match;
                 changed = true;
                 return `${p1}${p2}.js${p3}`;
            });

            if (changed) {
                console.log(`Updated ${filePath}`);
                fs.writeFileSync(filePath, content);
            }
        }
    });
}

walk(srcDir);
