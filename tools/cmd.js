// Impor modul dan dependensi yang diperlukan
const {
    monospace,
    quote
} = require("@itsreimau/ckptw-mod");
const util = require("node:util");

async function checkMedia(type, required) {
    if (!type || !required) return false;

    const mediaMap = {
        audio: "audioMessage",
        document: ["documentMessage", "documentWithCaptionMessage"],
        gif: "videoMessage",
        groupStatusMention: "groupStatusMentionMessage",
        image: "imageMessage",
        sticker: "stickerMessage",
        video: "videoMessage"
    };

    const mediaList = Array.isArray(required) ? required : [required];

    for (const media of mediaList) {
        const mappedType = mediaMap[media];
        if (!mappedType) continue;

        if (Array.isArray(mappedType)) {
            if (mappedType.includes(type)) return media;
        } else {
            if (type === mappedType) return media;
        }
    }

    return false;
}

async function checkQuotedMedia(type, required) {
    if (!type || !required) return false;

    const typeMediaMap = {
        audio: type.audioMessage,
        document: type.documentMessage || type.documentWithCaptionMessage,
        gif: type.videoMessage,
        image: type.imageMessage,
        sticker: type.stickerMessage,
        text: type.conversation || type.extendedTextMessage?.text,
        video: type.videoMessage
    };

    const mediaList = Array.isArray(required) ? required : [required];

    for (const media of mediaList) {
        if (media === "text") {
            const mediaContent = typeMediaMap.text;
            if (mediaContent && mediaContent.length > 0) return media;
        } else if (media === "viewOnce") {
            const viewOnceMediaKeys = ["audioMessage", "imageMessage", "videoMessage"];
            if (viewOnceMediaKeys.some(key => type[key]?.viewOnce === true)) return media;
        } else {
            if (typeMediaMap[media]) return media;
        }
    }

    return false;
}

function generateInstruction(actions, mediaTypes) {
    if (!actions || !actions.length) return "'actions' yang diperlukan harus ditentukan!";

    let translatedMediaTypes;
    if (typeof mediaTypes === "string") {
        translatedMediaTypes = [mediaTypes];
    } else if (Array.isArray(mediaTypes)) {
        translatedMediaTypes = mediaTypes;
    } else {
        return "'mediaTypes' harus berupa string atau array string!";
    }

    const mediaTypeTranslations = {
        "audio": "audio",
        "document": "dokumen",
        "gif": "GIF",
        "image": "gambar",
        "sticker": "stiker",
        "text": "teks",
        "video": "video",
        "viewOnce": "sekali lihat"
    };

    const translatedMediaTypeList = translatedMediaTypes.map(type => mediaTypeTranslations[type]);

    let mediaTypesList;
    if (translatedMediaTypeList.length > 1) {
        const lastMediaType = translatedMediaTypeList[translatedMediaTypeList.length - 1];
        mediaTypesList = `${translatedMediaTypeList.slice(0, -1).join(", ")}, atau ${lastMediaType}`;
    } else {
        mediaTypesList = translatedMediaTypeList[0];
    }

    const actionTranslations = {
        "send": "Kirim",
        "reply": "Balas"
    };

    const instructions = actions.map(action => `${actionTranslations[action]}`);
    const actionList = instructions.join(actions.length > 1 ? " atau " : "");
    return `📌 ${actionList} ${mediaTypesList}!`;
}

function generateCommandExample(used, args) {
    if (!used) return "'used' harus diberikan!";
    if (!args) return "'args' harus diberikan!";

    const commandMessage = `Contoh: ${monospace(`${used.prefix + used.command} ${args}`)}`;
    return commandMessage;
}

function generatesFlagInformation(flags) {
    if (typeof flags !== "object" || !flags) return "'flags' harus berupa objek!";

    const flagInfo = "Flag:\n" +
        Object.entries(flags).map(([flag, description]) => quote(`• ${monospace(flag)}: ${description}`)).join("\n");
    return flagInfo;
}

function generateNotes(notes) {
    if (!Array.isArray(notes)) return "'notes' harus berupa string!";

    const notesInfo = "Catatan:\n" +
        notes.map(note => quote(`• ${note}`)).join("\n");
    return notesInfo;
}

async function handleError(ctx, error, useAxios) {
    const isGroup = ctx.isGroup();
    const groupJid = isGroup ? ctx.id : null;
    const groupSubject = isGroup ? await ctx.group(groupJid).name() : null;
    const errorText = util.format(error);

    consolefy.error(`Error: ${errorText}`);
    if (config.system.reportErrorToOwner) await ctx.replyWithJid(`${config.owner.id}@s.whatsapp.net`, {
        text: `${quote(isGroup ? `⚠️ Terjadi kesalahan dari grup: @${groupJid}, oleh: @${tools.general.getID(ctx.sender.jid)}` : `⚠️ Terjadi kesalahan dari: @${tools.general.getID(ctx.sender.jid)}`)}\n` +
            `${quote("─────")}\n` +
            monospace(errorText),
        contextInfo: {
            mentionedJid: [ctx.sender.jid],
            groupMentions: isGroup ? [{
                groupJid,
                groupSubject
            }] : []
        }
    });
    if (useAxios && error.status !== 200) return await ctx.reply(config.msg.notFound);
    return await ctx.reply(quote(`⚠️ Terjadi kesalahan: ${error.message}`));
}

function parseFlag(argsString, customRules = {}) {
    if (!argsString) return {
        input: ""
    };

    const options = {};
    const input = [];

    const args = argsString.trim().split(/\s+/);

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];

        if (customRules[arg]) {
            const rule = customRules[arg];

            if (rule.type === "value") {
                const value = args[i + 1];

                if (value && rule.validator(value)) {
                    options[rule.key] = rule.parser(value);
                    i++;
                } else {
                    options[rule.key] = rule.default || null;
                }
            } else if (rule.type === "boolean") {
                options[rule.key] = true;
            }
        } else {
            input.push(arg);
        }
    }

    options.input = input.join(" ");
    return options;
}

module.exports = {
    checkMedia,
    checkQuotedMedia,
    generateInstruction,
    generateCommandExample,
    generatesFlagInformation,
    generateNotes,
    handleError,
    parseFlag
};