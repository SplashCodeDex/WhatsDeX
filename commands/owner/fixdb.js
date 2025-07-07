module.exports = {
    name: "fixdb",
    aliases: ["fixdatabase"],
    category: "owner",
    permissions: {
        owner: true
    },
    code: async (ctx) => {
        const input = ctx.args[0] || null;

        if (!input) return await ctx.reply(
            `${formatter.quote(tools.msg.generateInstruction(["send"], ["text"]))}\n` +
            formatter.quote(tools.msg.generateCmdExample(ctx.used, "user"))
        );

        if (input.toLowerCase() === "list") {
            const listText = await tools.list.get("fixdb");
            return await ctx.reply({
                text: listText,
                footer: config.msg.footer,
                interactiveButtons: []
            });
        }

        try {
            const waitMsg = await ctx.reply(config.msg.wait);
            const data = {
                user: await db.get("user") || {},
                group: await db.get("group") || {},
                menfess: await db.get("menfess") || {}
            };

            const mappings = {
                user: {
                    afk: {
                        reason: "string",
                        timestamp: "number"
                    },
                    banned: "boolean",
                    coin: "number",
                    lastClaim: {
                        daily: "number",
                        weekly: "number",
                        monthly: "number",
                        yearly: "number"
                    },
                    lastSentMsg: {
                        banned: "number",
                        cooldown: "number",
                        admin: "number",
                        botAdmin: "number",
                        coin: "number",
                        group: "number",
                        owner: "number",
                        premium: "number",
                        private: "number",
                        restrict: "number"
                    },
                    level: "number",
                    premium: "boolean",
                    premiumExpiration: "number",
                    uid: "string",
                    username: "string",
                    winGame: "number",
                    xp: "number"
                },
                group: {
                    maxwarnings: "number",
                    mute: "array",
                    mutebot: "boolean",
                    text: {
                        goodbye: "string",
                        intro: "string",
                        welcome: "string"
                    },
                    option: {
                        antiaudio: "boolean",
                        antidocument: "boolean",
                        antigif: "boolean",
                        antiimage: "boolean",
                        antilink: "boolean",
                        antinfsw: "boolean",
                        antisticker: "boolean",
                        antitagsw: "boolean",
                        antitoxic: "boolean",
                        antivideo: "boolean",
                        autokick: "boolean",
                        gamerestrict: "boolean",
                        welcome: "boolean"
                    },
                    sewa: "boolean",
                    sewaExpiration: "number",
                    spam: "array",
                    warnings: "array"
                },
                menfess: {
                    from: "string",
                    to: "string"
                }
            };

            const validateData = (value, expectedType) => {
                if (value === null || value === undefined) return false;

                if (expectedType === "array") return Array.isArray(value);

                if (typeof expectedType === "object" && expectedType !== null) {
                    if (typeof value !== "object" || value === null || Array.isArray(value)) return false;

                    const result = {};
                    let isValid = true;

                    for (const key in expectedType) {
                        if (value.hasOwnProperty(key)) {
                            const valid = validateData(value[key], expectedType[key]);
                            if (valid) {
                                result[key] = value[key];
                            } else {
                                isValid = false;
                            }
                        } else {
                            isValid = false;
                        }
                    }

                    return isValid ? result : false;
                }

                return typeof value === expectedType;
            };

            const processData = async (category, data) => {
                await ctx.editMessage(waitMsg.key, formatter.quote(`🔄 Memproses data ${category}...`));
                const schema = mappings[category];

                for (const id of Object.keys(data)) {
                    const item = data[id] || {};

                    if (!/^\d+$/.test(id)) {
                        await db.delete(`${category}.${id}`);
                        continue;
                    }

                    const isValid = validateData(item, schema);
                    if (!isValid) {
                        await db.delete(`${category}.${id}`);
                    } else {
                        const filteredItem = {};
                        for (const key in schema) {
                            if (item.hasOwnProperty(key)) {
                                filteredItem[key] = item[key];
                            }
                        }
                        await db.set(`${category}.${id}`, filteredItem);
                    }
                }
            };

            switch (input) {
                case "user":
                case "group":
                case "menfess":
                    await processData(input, data[input]);
                    break;
                default:
                    return await ctx.reply(formatter.quote(`❎ Data "${input}" tidak valid!`));
            }

            return await ctx.editMessage(waitMsg.key, formatter.quote(`✅ Database berhasil dibersihkan untuk ${input}!`));
        } catch (error) {
            return await tools.cmd.handleError(ctx, error);
        }
    }
};