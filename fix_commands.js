
const fs = require('fs');
const path = require('path');
const { glob } = require('glob');

const commandsDir = path.resolve(__dirname, 'commands');

glob('**/*.js', { cwd: commandsDir }, (err, files) => {
    if (err) {
        console.error('Error finding files:', err);
        return;
    }

    files.forEach(file => {
        const filePath = path.join(commandsDir, file);
        let content = fs.readFileSync(filePath, 'utf8');

        const originalCodeRegex = /code: async \(ctx\) => {\s*try {/s;
        const originalHandleErrorRegex = /await cmd\.handleError\(ctx, error(?:, (true|false))?\);/g;

        if (originalCodeRegex.test(content) && originalHandleErrorRegex.test(content)) {
            console.log(`Processing: ${file}`);

            // Revert destructuring at the beginning of the code function
            content = content.replace(
                /code: async (ctx) => {\n\s*const { config, tools } = ctx.bot.context;/, 
                `code: async (ctx) => {`
            );

            // Revert handleError calls
            content = content.replace(
                /await cmd\.handleError\(config, ctx, error(?:, (true|false))?\);/g,
                "await cmd.handleError(ctx, error, $1);"
            );

            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`Updated: ${file}`);
        }
    });
});
