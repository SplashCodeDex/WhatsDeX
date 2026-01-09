import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const walkSync = (dir, filelist = []) => {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const filepath = path.join(dir, file);
        if (fs.statSync(filepath).isDirectory()) {
            filelist = walkSync(filepath, filelist);
        } else {
            if (file.endsWith('.ts')) {
                filelist.push(filepath);
            }
        }
    });
    return filelist;
};

const srcDir = path.join(__dirname, '../src');
if (!fs.existsSync(srcDir)) {
    console.error(`Source directory not found: ${srcDir}`);
    process.exit(1);
}

const files = walkSync(srcDir);
console.log(`Scanning ${files.length} files for import fixes...`);

let fixedCount = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let modified = false;

    // Pattern to match relative imports that don't have an extension
    // Matches import ... from './...' or '../...' or export ... from ...
    const importRegex = /(from\s+['"])((\.|\.\.)\/[^'"]+?)(?<!\.js)(['"])/g;
    const importRegex2 = /(import\s+['"])((\.|\.\.)\/[^'"]+?)(?<!\.js)(['"])/g; // for side-effect imports import './foo'

    // Replacer function
    const replacer = (match, p1, p2, p3, p4) => {
        // p2 is the path
        if (p2.endsWith('/') || p2.endsWith('.js') || p2.endsWith('.json') || p2.endsWith('.css')) return match;
        modified = true;
        return `${p1}${p2}.js${p4}`;
    };

    let newContent = content.replace(importRegex, replacer);
    newContent = newContent.replace(importRegex2, replacer);

    if (modified) {
        fs.writeFileSync(file, newContent, 'utf8');
        fixedCount++;
        console.log(`Fixed: ${path.relative(srcDir, file)}`);
    }
});

console.log(`Finished. Fixed ${fixedCount} files.`);
