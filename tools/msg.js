    const units = ["yBytes", "zBytes", "aBytes", "fBytes", "pBytes", "nBytes", "µBytes", "mBytes", "Bytes", "KiB", "MiB", "GiB", "TiB", "PiB", "EiB", "ZiB", "YiB"];

    function convertMsToDuration(ms, units = []) {
        const time = {
            tahun: Math.floor(ms / 31557600000),
            bulan: Math.floor(ms / 2629800000) % 12,
            minggu: Math.floor(ms / 604800000) % 4,
            hari: Math.floor(ms / 86400000) % 7,
            jam: Math.floor(ms / 3600000) % 24,
            menit: Math.floor(ms / 60000) % 60,
            detik: Math.floor(ms / 1000) % 60,
            milidetik: Math.floor(ms % 1000)
        };

        if (units.length) return units.map(unit => `${time[unit]} ${unit}`).join(" ");

        const result = [];
        for (const [unit, value] of Object.entries(time)) {
            if (value > 0) {
                if (unit === "milidetik") {
                    if (ms < 1000) result.push(`${value} ${unit}`);
                } else {
                    result.push(`${value} ${unit}`);
                }
            }
        }

        return result.length ? result.join(" ") : ms < 1000 ? `${ms} milidetik` : "0 detik";
    }

    function convertSecondToTimecode(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        const milliseconds = Math.round((seconds - Math.floor(seconds)) * 1000);

        return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}.${milliseconds.toString().padStart(3, "0")}`;
    }

    function formatSize(byteCount) {
        if (!byteCount) return "0 yBytes";

        let index = 8;
        let size = byteCount;

        while (size < 1 && index > 0) {
            size *= 1024;
            index--;
        }

        while (size >= 1024 && index < units.length - 1) {
            size /= 1024;
            index++;
        }

        return `${size.toFixed(2)} ${units[index]}`;
    }

    function formatSizePerSecond(byteCount) {
        if (!byteCount) return "0 yBytes/s";

        let index = 8;
        let size = byteCount;

        while (size < 1 && index > 0) {
            size *= 1024;
            index--;
        }

        while (size >= 1024 && index < units.length - 1) {
            size /= 1024;
            index++;
        }

        return `${size.toFixed(2)} ${units[index]}/s`;
    }

    function generateCmdExample(used, args) {
        if (!used) return `${formatter.inlineCode("used")} harus diberikan!`;
        if (!args) return `${formatter.inlineCode("args")} harus diberikan!`;

        const cmdMsg = `Contoh: ${formatter.inlineCode(`${used.prefix + used.command} ${args}`)}`;
        return cmdMsg;
    }

    function generateInstruction(actions, mediaTypes) {
        if (!actions || !actions.length) return `${formatter.inlineCode("actions")} yang diperlukan harus ditentukan!`;

        let translatedMediaTypes;
        if (typeof mediaTypes === "string") {
            translatedMediaTypes = [mediaTypes];
        } else if (Array.isArray(mediaTypes)) {
            translatedMediaTypes = mediaTypes;
        } else {
            return `${formatter.inlineCode("mediaTypes")} harus berupa string atau array string!`;
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

    function generatesFlagInfo(flags) {
        if (typeof flags !== "object" || !flags) return `${formatter.inlineCode("flags")} harus berupa objek!`;

        const flagInfo = "Flag:\n" +
            Object.entries(flags).map(([flag, description]) => formatter.quote(`• ${formatter.inlineCode(flag)}: ${description}`)).join("\n");
        return flagInfo;
    }

    function generateNotes(notes) {
        if (!Array.isArray(notes)) return `${formatter.inlineCode("notes")} harus berupa string!`;

        const notesMsg = "Catatan:\n" +
            notes.map(note => formatter.quote(`• ${note}`)).join("\n");
        return notesMsg;
    }

    function ucwords(text) {
        if (!text) return null;

        return text.toLowerCase().replace(/\b\w/g, (t) => t.toUpperCase());
    }

    module.exports = {
        convertMsToDuration,
        convertSecondToTimecode,
        formatSize,
        formatSizePerSecond,
        generateCmdExample,
        generateInstruction,
        generatesFlagInfo,
        generateNotes,
        ucwords
    };