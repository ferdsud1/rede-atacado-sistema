import multer from 'multer';
import { randomUUID } from 'crypto';
import path from 'path';

const uploadsDir = path.resolve(__dirname, '../../uploads');

const storage = multer.memoryStorage();

export const upload = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB
    },
    fileFilter: (req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/webp'];
        if (allowed.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Formato não permitido. Use JPEG, PNG ou WebP.'), false);
        }
    }
});

export { uploadsDir };
