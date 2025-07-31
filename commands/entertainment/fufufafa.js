const {
    ButtonBuilder
} = require("@itsreimau/gktw");
const axios = require("axios");

module.exports = {
    name: "fufufafa",
    category: "entertainment",
    permissions: {
        coin: 10
    },
    code: async (ctx) => {
        try {
            const apiUrl = tools.api.createUrl("https://fufufafapi.vanirvan.my.id", "/api");
            const result = tools.cmd.getRandomElement((await axios.get(apiUrl)).data);

            return await ctx.reply({
                image: {
                    url: result.image_url
                },
                mimetype: tools.mime.lookup("jpg"),
                caption: formatter.quote(`Doksli: ${result.doksli}`),
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