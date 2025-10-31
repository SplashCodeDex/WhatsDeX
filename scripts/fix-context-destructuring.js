import path from 'path';

const fs = require('fs');

// Find all command files
function getAllCommandFiles(dir, files = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      getAllCommandFiles(fullPath, files);
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      files.push(fullPath);
    }
  }

  return files;
}

// Check if file needs fixing
function needsFixing(content) {
  // Check if it already has the destructuring
  if (content.includes('const { formatter') || content.includes('const {formatter')) {
    return false;
  }

  // Check if it uses any of these variables
  const usesVariables = /\b(formatter|tools|config|db)\./g.test(content);

  // Check if it's inside a code function
  const hasCodeFunction = /code:\s*async\s*\(ctx\)\s*=>\s*\{/g.test(content);

  return usesVariables && hasCodeFunction;
}

// Fix the file by adding destructuring
function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  if (!needsFixing(content)) {
    return false;
  }

  // Determine which variables are used
  const usedVars = new Set();
  if (/\bformatter\./g.test(content)) usedVars.add('formatter');
  if (/\btools\./g.test(content)) usedVars.add('tools');
  if (/\bconfig\./g.test(content)) usedVars.add('config');
  if (/\bdb\./g.test(content)) usedVars.add('database');

  const destructuring = `const { ${[...usedVars].join(', ')} } = ctx.bot.context;`;

  // Find the code function and add destructuring right after it
  const codeRegex = /(code:\s*async\s*\(ctx\)\s*=>\s*\{)/;
  const match = content.match(codeRegex);

  if (!match) {
    return false;
  }

  // Insert the destructuring line after the opening brace
  const insertIndex = match.index + match[0].length;
  content = `${content.slice(0, insertIndex)}\n        ${destructuring}${content.slice(insertIndex)}`;

  // If db is used, also need to rename to database in destructuring but keep db references
  if (usedVars.has('database')) {
    content = content.replace(destructuring, destructuring.replace('database', 'database: db'));
  }

  fs.writeFileSync(filePath, content, 'utf8');
  return true;
}

// Main execution
const commandsDir = path.join(__dirname, '..', 'commands');
const commandFiles = getAllCommandFiles(commandsDir);

let fixedCount = 0;
let skippedCount = 0;

console.log(`Found ${commandFiles.length} command files\n`);

for (const file of commandFiles) {
  const fixed = fixFile(file);
  if (fixed) {
    fixedCount++;
    console.log(`✅ Fixed: ${path.relative(commandsDir, file)}`);
  } else {
    skippedCount++;
  }
}

console.log(`\n✅ Fixed ${fixedCount} files`);
console.log(`⏭️  Skipped ${skippedCount} files (already correct or no changes needed)`);
