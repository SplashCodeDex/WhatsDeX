// Daftar API gratis
const APIs = {
    agatz: {
        baseURL: "https://api.agatz.xyz"
    },
    archive: {
        baseURL: "https://archive-ui.tanakadomp.biz.id"
    },
    agung: {
        baseURL: "https://api.agungny.my.id"
    },
    bk9: {
        baseURL: "https://bk9.fun"
    },
    cloud: {
        baseURL: "https://rest.cloudkuimages.xyz"
    },
    diibot: {
        baseURL: "https://api.diioffc.web.id"
    },
    fast: {
        baseURL: "https://fastrestapis.fasturl.cloud"
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
        consolefy.error(`Error: ${error}`);
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