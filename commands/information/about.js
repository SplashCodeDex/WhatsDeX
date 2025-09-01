module.exports = {
    name: "about",
    aliases: ["bot", "infobot"],
    category: "information",
    code: async (ctx) => {
        const { config, tools } = ctx.bot.context;
        const { db, formatter } = ctx.bot.context;
        try {
            const botDb = await db.get("bot") || {};

            await ctx.reply({
                text: `${formatter.quote(`👋 Hello! I am a WhatsApp bot named ${config.bot.name}, owned by ${config.owner.name}. I can perform many commands, such as creating stickers, using AI for certain tasks, and several other useful commands. I am here to entertain and please you!`)}
` + // Can be changed as desired
                    `${formatter.quote("· · ─ ·✶· ─ · ·")}\n` +
                    `${formatter.quote(`Nama Bot: ${config.bot.name}`)}\n` +
                    `${formatter.quote(`Versi: ${require("../../package.json").version}`)}\n` +
                    `${formatter.quote(`Owner: ${config.owner.name}`)}\n` +
                    `${formatter.quote(`Mode: ${tools.msg.ucwords(botDb?.mode || "public")}`)}\n` +
                    `${formatter.quote(`Bot Uptime: ${config.bot.uptime}`)}\n` +
                    `${formatter.quote(`Database: ${config.bot.dbSize} (Simpl.DB - JSON)`)}\n` +
                    formatter.quote("Library: @SplashCodeDex/gktw (Fork of @mengkodingan/ckptw)"),
                footer: config.msg.footer
            });
        } catch (error) {
            await tools.cmd.handleError(ctx.bot.context, ctx, error);
        }
    }
};
