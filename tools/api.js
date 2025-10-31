// Impor modul dan dependensi yang diperlukan
const util = require('node:util');
const axios = require('axios');
const FormData = require('form-data');

// Daftar API gratis
const APIs = {
  davidcyril: {
    baseURL: 'https://apis.davidcyriltech.my.id',
  },
  diibot: {
    baseURL: 'https://api.diioffc.web.id',
  },
  hang: {
    baseURL: 'https://api.hanggts.xyz',
  },
  izumi: {
    baseURL: 'https://izumiiiiiiii.dpdns.org',
  },
  neko: {
    baseURL: 'https://api.nekoo.qzz.io',
  },
  siputzx: {
    baseURL: 'https://api.siputzx.my.id',
  },
  yp: {
    baseURL: 'https://api.ypnk.dpdns.org',
  },
  zell: {
    baseURL: 'https://zellapi.autos',
  },
  zenzxz: {
    baseURL: 'https://api.zenzxz.my.id',
  },
};

function createUrl(apiNameOrURL, endpoint, params = {}, apiKeyParamName) {
  try {
    const api = APIs[apiNameOrURL];
    if (!api) {
      const url = new URL(apiNameOrURL);
      apiNameOrURL = url;
    }

    const queryParams = new URLSearchParams(params);
    if (apiKeyParamName && api && 'APIKey' in api) queryParams.set(apiKeyParamName, api.APIKey);

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

async function uploadImage(buffer) {
  const form = new FormData();
  form.append('source', buffer, 'image.jpg');

  const { data } = await axios.post('https://freeimage.host/api/1/upload', form, {
    headers: {
      'Content-Type': `multipart/form-data; boundary=${form._boundary}`,
      'X-API-Key': '6d207e02198a847aa98d0a2a901485a5',
    },
  });

  return data.image.url;
}

async function uploadFile(buffer, filename) {
  const form = new FormData();
  form.append('file', buffer, filename);

  const { data } = await axios.post('https://file.io', form, {
    headers: {
      ...form.getHeaders(),
    },
  });

  return data.link;
}

module.exports = {
  createUrl,
  listUrl,
  uploadImage,
  uploadFile,
};
