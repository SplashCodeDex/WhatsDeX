const {
    AlbumBuilder
} = require("@itsreimau/gktw");
const axios = require("axios");

module.exports = {
    name: "pinterestdl",
    aliases: ["pindl", "pintdl"],
    category: "downloader",
    permissions: {
        coin: 10
    },
    code: async (ctx) => {
        const url = ctx.args[0] || null;

        if (!url) return await ctx.reply(
            `${formatter.quote(tools.msg.generateInstruction(["send"], ["text"]))}\n` +
            formatter.quote(tools.msg.generateCmdExample(ctx.used, "https://id.pinterest.com/pin/313422455339425808"))
        );

        const isUrl = await tools.cmd.isUrl(url);
        if (!isUrl) return await ctx.reply(config.msg.urlInvalid);

        try {
            const apiUrl = tools.api.createUrl("archive", "/api/download/pinterest", {
                url
            });
            const result = (await axios.get(apiUrl)).data.result;

            const album = new AlbumBuilder();
            for (const media of result) {
                if (media.format === "MP4") {
                    album.addVideoUrl(media.url);
                } else {
                    album.addImageUrl(media.url);
                }
            }

            return await ctx.reply({
                album: album.build(),
                caption: formatter.quote(`URL: ${url}`),
                footer: config.msg.footer
            });
        } catch (error) {
            return await tools.cmd.handleError(ctx, error, true);
        }
    }
};