// src/config/upload.ts
import multer, { FileFilterCallback } from 'multer';
import { Request } from 'express';
import { join } from 'path';

const storage = multer.memoryStorage();

const fileFilter = (
    req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null, acceptFile: boolean) => void  // ✅ Tipo correto
) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    
    if (allowed.includes(file.mimetype)) {
        cb(null, true);  // ✅ null primeiro, depois boolean
    } else {
        cb(new Error('Formato não permitido. Use JPEG, PNG ou WebP.'), false);
    }
};

export const upload = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
        files: 1
    },
    fileFilter
});
