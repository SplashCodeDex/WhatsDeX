const {
    AlbumBuilder
} = require("@itsreimau/gktw");
const axios = require("axios");

module.exports = {
    name: "ppcouple",
    aliases: ["ppcp"],
    category: "entertainment",
    permissions: {
        coin: 10
    },
    code: async (ctx) => {
        try {
            const apiUrl = tools.api.createUrl("https://sandipbaruwal.onrender.com", "/dp");
            const result = (await axios.get(apiUrl)).data;
            const album = new AlbumBuilder()
                .addImageUrl(result.male)
                .addImageUrl(result.female)
                .build();

            return await ctx.reply({
                album: album,
                caption: formatter.quote("Untukmu, tuan!"),
                footer: config.msg.footer
            });
        } catch (error) {
            return await tools.cmd.handleError(ctx, error, true);
        }
    }
};