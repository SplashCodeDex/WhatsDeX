const {
    monospace,
    quote
} = require("@mengkodingan/ckptw");
const mime = require("mime-types");
const axios = require("axios");

module.exports = {
    name: "igdl",
    aliases: ["ig", "instagram", "instagramdl"],
    category: "downloader",
    code: async (ctx) => {
        const {
            status,
            message
        } = await global.handler(ctx, {
            banned: true,
            coin: 3
        });
        if (status) return ctx.reply(message);

        const url = ctx._args[0] || null;

        if (!url) return ctx.reply(
            `${quote(global.msg.argument)}\n` +
            quote(`Contoh: ${monospace(`${ctx._used.prefix + ctx._used.command} https://example.com/`)}`)
        );

        const urlRegex = /[(http(s)?):\/\/(www\.)?a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/i;
        if (!urlRegex.test(url)) return ctx.reply(global.msg.urlInvalid);

        try {
            const apiUrl = createAPIUrl("agatz", "/api/instagram", {
                url
            });
            const response = await axios.get(apiUrl);
            const {
                data
            } = response.data;

            for (const item of data) {
                const mediaResponse = await axios.get(item.link, {
                    responseType: "arraybuffer"
                });
                const contentType = mediaResponse?.headers?.["content-type"];

                if (/image/.test(contentType)) {
                    await ctx.reply({
                        image: mediaResponse.data,
                        mimetype: mime.contentType(contentType)
                    });
                } else if (/video/.test(contentType)) {
                    await ctx.reply({
                        video: mediaResponse.data,
                        mimetype: mime.contentType(contentType)
                    });
                }
            }
        } catch (error) {
            console.error("Error:", error);
            if (error.status !== 200) return ctx.reply(global.msg.notFound);
            return ctx.reply(quote(`⚠ Terjadi kesalahan: ${error.message}`));
        }
    }
};