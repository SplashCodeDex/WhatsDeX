const {
    createAPIUrl
} = require("../tools/api.js");
const {
    monospace,
    quote
} = require("@mengkodingan/ckptw");
const axios = require("axios");

module.exports = {
    name: "cekkhodam",
    aliases: ["checkkhodam", "khodam"],
    category: "fun",
    code: async (ctx) => {
        const {
            status,
            message
        } = await global.handler(ctx, {
            banned: true,
            coin: 3
        });
        if (status) return ctx.reply(message);

        const input = ctx._args.join(" ") || null;

        if (!input) return ctx.reply(
            `${quote(global.msg.argument)}\n` +
            quote(`Contoh: ${monospace(`${ctx._used.prefix + ctx._used.command} john doe`)}`)
        );

        try {
            const apiUrl = createAPIUrl("https://raw.githubusercontent.com", `/SazumiVicky/cek-khodam/main/khodam/list.txt`, {});
            const {
                data
            } = await axios.get(apiUrl);
            const list = data.split('\n').filter(l => l.trim().length > 0);
            const khodam = list[Math.floor(Math.random() * list.length)];

            return ctx.reply({
                text: `${quote(`Nama: ${input}`)}\n` +
                    `${quote(`Khodam: ${khodam}`)}\n` +
                    "\n" +
                    global.msg.footer
            }, {
                mentions: ctx.getMentioned()
            });
        } catch (error) {
            console.error("Error:", error);
            if (error.status !== 200) return ctx.reply(global.msg.notFound);
            return message.reply(quote(`⚠ Terjadi kesalahan: ${error.message}`));
        }
    }
};