import axios from 'axios';
import FormData from 'form-data';

export const createUrl = (provider, path, params = {}) => {
    let baseUrl = '';
    switch (provider) {
        case 'izumi':
            baseUrl = 'https://izumi-api.herokuapp.com'; // Placeholder
            break;
        case 'neko':
            baseUrl = 'https://neko-api.herokuapp.com'; // Placeholder
            break;
        default:
            baseUrl = 'https://api.example.com';
    }
    // Ensure path starts with /
    if (!path.startsWith('/')) path = '/' + path;

    const url = new URL(path, baseUrl);
    Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
    return url.toString();
};

export const uploadImage = async (buffer) => {
    try {
        const form = new FormData();
        form.append('file', buffer, { filename: 'image.jpg' });

        // Using telegra.ph as a fallback/default uploader
        const response = await axios.post('https://telegra.ph/upload', form, {
            headers: { ...form.getHeaders() }
        });

        if (response.data && response.data[0] && response.data[0].src) {
            return 'https://telegra.ph' + response.data[0].src;
        }
        throw new Error('Upload failed: No source returned');
    } catch (error) {
        console.error('Upload error:', error.message);
        throw error;
    }
};

export default { createUrl, uploadImage };
