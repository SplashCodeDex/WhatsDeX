const {
    ButtonBuilder
} = require("@itsreimau/gktw");
const axios = require("axios");

module.exports = {
    name: "meme",
    aliases: ["memes"],
    category: "entertainment",
    permissions: {
        coin: 10
    },
    code: async (ctx) => {
        try {
            const apiUrl = tools.api.createUrl("https://candaan-api.vercel.app", "/api/image/random");
            const result = (await axios.get(apiUrl)).data.data;

            return await ctx.reply({
                image: {
                    url: result.url
                },
                mimetype: tools.mime.lookup("jpeg"),
                caption: formatter.quote(`Sumber: ${result.source}`),
                footer: config.msg.footer,
                buttons: new ButtonBuilder()
                    .regulerButton("Ambil Lagi", ctx.used.prefix + ctx.used.command)
                    .build()
            });
        } catch (error) {
            return await tools.cmd.handleError(ctx, error, true);
        }
    }
};