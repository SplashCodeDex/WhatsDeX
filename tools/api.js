const util = require("node:util");

// Daftar API gratis
const APIs = {
    agatz: {
        baseURL: "https://api.agatz.xyz"
    },
    archive: {
        baseURL: "https://www.archive-ui.biz.id"
    },
    bk9: {
        baseURL: "https://bk9.fun"
    },
    crafters: {
        baseURL: "https://api.crafters.biz.id"
    },
    davidcyril: {
        baseURL: "https://apis.davidcyriltech.my.id"
    },
    diibot: {
        baseURL: "https://api.diioffc.web.id"
    },
    fast: {
        baseURL: "https://fastrestapis.fasturl.cloud"
    },
    nekorinn: {
        baseURL: "https://api.nekorinn.my.id"
    },
    nyxs: {
        baseURL: "https://api.nyxs.pw"
    },
    otinxsandip: {
        baseURL: "https://sandipbaruwal.onrender.com"
    },
    siputzx: {
        baseURL: "https://api.siputzx.my.id"
    },
    vapis: {
        baseURL: "https://vapis.my.id"
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

        if (apiKeyParamName && api && "APIKey" in api) {
            queryParams.set(apiKeyParamName, api.APIKey);
        }

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