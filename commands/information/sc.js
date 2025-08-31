module.exports = {
    name: "sc",
    aliases: ["script", "source", "sourcecode"],
    category: "information",
    code: async (ctx) => {
        await ctx.reply({
            text: formatter.quote("https://github.com/itsreimau/whatsdex"),
            footer: config.msg.footer
        }); // If you don't delete this, thank you!
    }
};