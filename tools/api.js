const util = require("node:util");

// Daftar API gratis
const APIs = {
    agatz: {
        baseURL: "https://api.agatz.xyz"
    },
    archive: {
        baseURL: "https://archive.lick.eu.org"
    },
    bk9: {
        baseURL: "https://bk9.fun"
    },
    davidcyril: {
        baseURL: "https://apis.davidcyriltech.my.id"
    },
    diibot: {
        baseURL: "https://api.diioffc.web.id"
    },
    falcon: {
        baseURL: "https://flowfalcon.dpdns.org"
    },
    fasturl: {
        baseURL: "https://fastrestapis.fasturl.cloud"
    },
    nekorinn: {
        baseURL: "https://api.nekorinn.my.id"
    },
    nirkyy: {
        baseURL: "http://nirkyy.koyeb.app"
    },
    nyxs: {
        baseURL: "https://api.nyxs.pw"
    },
    shizo: {
        baseURL: "https://api.shizo.top",
        APIKey: "shizo"
    },
    vapis: {
        baseURL: "https://vapis.my.id"
    },
    velyn: {
        baseURL: "https://velyn.biz.id"
    },
    zell: {
        baseURL: "https://apizell.web.id"
    }
};

function createUrl(apiNameOrURL, endpoint, params = {}, apiKeyParamName) {
    try {
        const api = APIs[apiNameOrURL];

        if (!api) {
            const url = new URL(apiNameOrURL);
            apiNameOrURL = url;
        }

        const queryParams = new URLSearchParams(params);

        if (apiKeyParamName && api && "APIKey" in api) queryParams.set(apiKeyParamName, api.APIKey);

        const baseURL = api ? api.baseURL : apiNameOrURL.origin;
        const apiUrl = new URL(endpoint, baseURL);
        apiUrl.search = queryParams.toString();

        return apiUrl.toString();
    } catch (error) {
        consolefy.error(`Error: ${util.format(error)}`);
        return null;
    }
}

function listUrl() {
    return APIs;
}

module.exports = {
    createUrl,
    listUrl
};