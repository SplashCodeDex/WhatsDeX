const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.resolve(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else {
            if (file.endsWith('.ts')) {
                results.push(file);
            }
        }
    });
    return results;
}

const targetDirs = [
    path.join(__dirname, '../src/commands'),
    path.join(__dirname, '../src/services'),
    path.join(__dirname, '../src/middleware')
];

let totalFiles = 0;
let totalChanges = 0;

targetDirs.forEach(dir => {
    if (!fs.existsSync(dir)) return;
    
    const files = walk(dir);
    files.forEach(file => {
        let content = fs.readFileSync(file, 'utf8');
        let originalContent = content;

        // 1. Replace ctx.msg.media.toBuffer() pattern
        content = content.replace(/\(await\s+ctx\.msg\.media\.toBuffer\(\)\)/g, '(await ctx.getMedia()?.toBuffer?.())');
        content = content.replace(/ctx\.msg\.media\.toBuffer\(\)/g, 'ctx.getMedia()?.toBuffer?.()');

        // 2. Replace ctx.quoted?.media.toBuffer() pattern
        content = content.replace(/\(await\s+ctx\.quoted\?\.media\.toBuffer\(\)\)/g, '(await ctx.getQuoted()?.media?.toBuffer?.())');
        content = content.replace(/ctx\.quoted\?\.media\.toBuffer\(\)/g, 'ctx.getQuoted()?.media?.toBuffer?.()');

        // 3. Replace ctx.msg.contentType
        content = content.replace(/ctx\.msg\.contentType/g, 'ctx.getContentType()');

        // 4. Replace ctx.msg.media
        content = content.replace(/ctx\.msg\.media/g, 'ctx.getMedia()');

        // 5. Replace ctx.msg.key?.fromMe
        content = content.replace(/ctx\.msg\.key\?\.fromMe/g, 'ctx.isFromMe()');

        // 6. Replace ctx.msg.body
        content = content.replace(/ctx\.msg\.body/g, 'ctx.getBody()');

        if (content !== originalContent) {
            fs.writeFileSync(file, content, 'utf8');
            console.log(`Refactored: ${file}`);
            totalChanges++;
        }
        totalFiles++;
    });
});

console.log(`Done! Refactored ${totalChanges} files out of ${totalFiles} checked.`);
