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
const files = walkSync(srcDir);

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    const newContent = content.replace(/catch\s*\(error:\s*any\)/g, 'catch (error: unknown)');
    if (content !== newContent) {
        fs.writeFileSync(file, newContent, 'utf8');
        console.log(`Fixed any in catch: ${path.relative(srcDir, file)}`);
    }
});
