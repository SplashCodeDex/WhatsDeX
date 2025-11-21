import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, 'ai_chat_history.json');

// Ensure DB file exists
try {
    await fs.access(DB_PATH);
} catch {
    await fs.writeFile(DB_PATH, JSON.stringify({}));
}

const getDb = async () => {
    const data = await fs.readFile(DB_PATH, 'utf-8');
    return JSON.parse(data);
};

const saveDb = async (data) => {
    await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2));
};

export default {
    getChat: async (userId) => {
        const db = await getDb();
        return db[userId] || { history: [], summary: '' };
    },
    updateChat: async (userId, data) => {
        const db = await getDb();
        db[userId] = { ...db[userId], ...data };
        await saveDb(db);
    }
};
