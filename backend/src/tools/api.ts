export interface APIConfig {
    baseURL: string;
    apikey?: string;
}

export const APIs: Record<string, APIConfig> = {
    izumi: {
        baseURL: 'https://izumi-api.herokuapp.com', // Placeholder URL - Update with actual API URL
        apikey: 'free'
    }
};

/**
 * Creates a URL for an API call with optional parameters and apikey.
 * @param name API name from APIs list
 * @param path Endpoint path
 * @param params Query parameters
 * @returns Fully qualified URL string
 */
export const createUrl = (name: string, path: string, params: Record<string, string | number | boolean | undefined | null> = {}): string => {
    const api = APIs[name];
    if (!api) {
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

export default {
    createUrl,
    listUrl,
    APIs
};
