// src/utils/imageProcessor.ts
import sharp from 'sharp';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_WIDTH = 1920;

export async function processImage(buffer: Buffer): Promise<{ buffer: Buffer; ext: string }> {
    try {
        // 1. Tenta obter metadados da imagem (já valida se é imagem válida)
        const metadata = await sharp(buffer).metadata();
        
        if (!metadata.format || !ALLOWED_MIME_TYPES.includes(`image/${metadata.format}`)) {
            throw new Error('Formato de imagem não permitido. Use JPEG, PNG ou WebP.');
        }

        // 2. Processa: redimensiona + converte para WebP
        const processedBuffer = await sharp(buffer)
            .rotate() // Corrige orientação automática (fotos de celular)
            .resize({
                width: MAX_WIDTH,
                height: MAX_WIDTH,
                fit: 'inside',
                withoutEnlargement: true
            })
            .webp({ quality: 85 })
            .toBuffer();

        return {
            buffer: processedBuffer,
            ext: '.webp'
        };
    } catch (error) {
        if (error instanceof Error && error.message.includes('Input buffer contains')) {
            throw new Error('Arquivo não é uma imagem válida ou está corrompido.');
        }
        throw error;
    }
}