import multer from 'multer';
import path from 'path';
import fs from 'fs';
import fsPromises from 'fs/promises';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { fileTypeFromFile } from 'file-type';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDir = path.join(__dirname, '../../uploads');

// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, uploadDir);
    },
    filename: (_req, file, cb) => {
        const uniqueSuffix = crypto.randomBytes(16).toString('hex');
        cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});

export const upload = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: (_req, file, cb) => {
        // Basic extension check
        const allowedExtensions = ['.csv'];
        const ext = path.extname(file.originalname).toLowerCase();

        if (allowedExtensions.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Only CSV files are allowed'));
        }
    }
});

/**
 * Middleware to perform deep mimetype validation after upload
 */
export const validateCsvMimeType = async (req: any, res: any, next: any) => {
    if (!req.file) return next();

    try {
        const type = await fileTypeFromFile(req.file.path);

        // file-type might return undefined for some CSVs if they are just plain text
        // But it helps catch spoofed binary files
        if (type && type.mime !== 'text/csv' && type.ext !== 'csv') {
             await fsPromises.unlink(req.file.path).catch(() => {});
             return res.status(400).json({ success: false, error: 'Invalid file type detected' });
        }

        next();
    } catch (error) {
        next(error);
    }
};
