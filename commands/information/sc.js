const {
    quote
} = require("@itsreimau/ckptw-mod");

module.exports = {
    name: "sc",
    aliases: ["script", "source", "sourcecode"],
    category: "information",
    permissions: {},
    code: async (ctx) => {
        return await ctx.reply(
            `${quote("https://github.com/itsreimau/ckptw-wabot")}\n` +
            "\n" +
            config.msg.footer
        ); // Jika kamu tidak menghapus ini, terima kasih!
    }
};