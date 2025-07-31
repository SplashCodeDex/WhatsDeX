const {
    AlbumBuilder
} = require("@itsreimau/gktw");
const axios = require("axios");

module.exports = {
    name: "douyindl",
    aliases: ["douyin"],
    category: "downloader",
    permissions: {
        premium: true
    },
    code: async (ctx) => {
        const url = ctx.args[0] || null;

        if (!url) return await ctx.reply(
            `${formatter.quote(tools.msg.generateInstruction(["send"], ["text"]))}\n` +
            formatter.quote(tools.msg.generateCmdExample(ctx.used, "https://v.douyin.com/YEdqwg7JeAQ"))
        );

        const isUrl = await tools.cmd.isUrl(url);
        if (!isUrl) return await ctx.reply(config.msg.urlInvalid);

        try {
            const apiUrl = tools.api.createUrl("archive", "/api/download/douyin", {
                url
            });
            const result = (await axios.get(apiUrl)).data.result;

            if (!result.slide && result.media) {
                return await ctx.reply({
                    video: {
                        url: result.media.mp4_hd || result.media.mp4_2 || result.media.mp4_1
                    },
                    mimetype: tools.mime.lookup("mp4"),
                    caption: formatter.quote(`URL: ${url}`),
                    footer: config.msg.footer
                });
            }

            if (result.slide && result.media) {
                const album = new AlbumBuilder();
                for (const imageUrl of result.media) {
                    album.addImageUrl(imageUrl);
                }

                return await ctx.reply({
                    album: album.build(),
                    caption: formatter.quote(`URL: ${url}`),
                    footer: config.msg.footer
                });
            }
        } catch (error) {
            return await tools.cmd.handleError(ctx, error, true);
        }
    }
};