import axios from 'axios';
import FormData from 'form-data';

export interface APIConfig {
    baseURL: string;
    apikey?: string;
}

export const APIs: Record<string, APIConfig> = {
    izumi: {
        baseURL: 'https://izumi-api.herokuapp.com', 
        apikey: 'free'
    },
    // Add other APIs as referenced in the code
    zell: { baseURL: 'https://api.zell.com', apikey: 'free' },
    neko: { baseURL: 'https://api.neko.com', apikey: 'free' },
    diibot: { baseURL: 'https://api.diibot.com', apikey: 'free' },
    davidcyril: { baseURL: 'https://api.davidcyril.com', apikey: 'free' },
    siputzx: { baseURL: 'https://api.siputzx.com', apikey: 'free' },
    hang: { baseURL: 'https://api.hang.com', apikey: 'free' },
    zenzxz: { baseURL: 'https://api.zenzxz.com', apikey: 'free' },
};

/**
 * Creates a URL for an API call with optional parameters and apikey.
 * @param name API name from APIs list
 * @param path Endpoint path
 * @param params Query parameters
 * @returns Fully qualified URL string
 */
export const createUrl = (name: string, path: string, params: Record<string, string | number | boolean | undefined | null> = {}): string => {
    // Handle full URLs passed as name (legacy/direct usage)
    if (name.startsWith('http')) {
        const url = new URL(name + (path.startsWith('/') ? path : '/' + path));
        for (const [key, value] of Object.entries(params)) {
            if (value !== undefined && value !== null) {
                url.searchParams.append(key, String(value));
            }
        }
        return url.toString();
    }

    const api = APIs[name];
    if (!api) {
        // Fallback for unknown APIs, try to construct if it looks like a domain or throw
        throw new Error(`API ${name} not found`);
    }

    // Handle path starting with / or not
    const basePath = path.startsWith('/') ? path : `/${path}`;
    const url = new URL(api.baseURL + basePath);

    if (api.apikey) {
        url.searchParams.append('apikey', api.apikey);
    }

    for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) {
            url.searchParams.append(key, String(value));
        }
    }

    return url.toString();
};

export const listUrl = (): Record<string, APIConfig> => APIs;

export const uploadImage = async (buffer: Buffer): Promise<string> => {
    // Placeholder: Upload to a temporary hosting service (e.g., telegraph, imgur)
    // For now returning a mock URL to satisfy types
    return 'https://example.com/uploaded.jpg';
};

export const uploadFile = async (buffer: Buffer, filename: string): Promise<string> => {
    // Placeholder
    return 'https://example.com/uploaded_file.bin';
};

export default {
    createUrl,
    listUrl,
    uploadImage,
    uploadFile,
    APIs
};