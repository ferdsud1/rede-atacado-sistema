// src/utils/imageProcessor.ts
import sharp from 'sharp';

// Configurações
const ALLOWED_FORMATS = ['jpeg', 'png', 'webp'] as const;
const MAX_DIMENSION = 1920;
const WEBP_QUALITY = 85;

export type ProcessedImage = {
    buffer: Buffer;
    format: typeof ALLOWED_FORMATS[number];
    ext: `.${typeof ALLOWED_FORMATS[number]}`;
    metadata: {
        width?: number;
        height?: number;
        size: number;
    };
};

export class ImageProcessingError extends Error {
    constructor(message: string, public readonly code: string) {
        super(message);
        this.name = 'ImageProcessingError';
    }
}

/**
 * Valida se o buffer contém uma imagem válida e retorna seu formato
 */
async function detectFormat(buffer: Buffer): Promise<typeof ALLOWED_FORMATS[number]> {
    try {
        const metadata = await sharp(buffer).metadata();
        
        if (!metadata.format || !ALLOWED_FORMATS.includes(metadata.format as any)) {
            throw new ImageProcessingError(
                `Formato não suportado: ${metadata.format || 'desconhecido'}. Use JPEG, PNG ou WebP.`,
                'UNSUPPORTED_FORMAT'
            );
        }
        
        return metadata.format as typeof ALLOWED_FORMATS[number];
    } catch (error) {
        if (error instanceof ImageProcessingError) throw error;
        
        if (error instanceof Error && error.message.includes('Input buffer contains')) {
            throw new ImageProcessingError(
                'Arquivo corrompido ou não é uma imagem válida.',
                'INVALID_IMAGE'
            );
        }
        
        throw new ImageProcessingError(
            'Erro ao analisar imagem: ' + (error instanceof Error ? error.message : 'unknown'),
            'ANALYSIS_FAILED'
        );
    }
}

/**
 * Processa imagem: redimensiona, otimiza e converte para WebP
 */
export async function processImage(buffer: Buffer): Promise<ProcessedImage> {
    // 1. Detecta formato original
    const originalFormat = await detectFormat(buffer);
    
    // 2. Processa com Sharp
    const pipeline = sharp(buffer)
        // Corrige orientação automática (EXIF de celulares)
        .rotate()
        // Redimensiona mantendo proporção, sem aumentar imagens pequenas
        .resize({
            width: MAX_DIMENSION,
            height: MAX_DIMENSION,
            fit: 'inside',
            withoutEnlargement: true
        });
    
    // 3. Converte para WebP para melhor compressão
    const processedBuffer = await pipeline
        .webp({ 
            quality: WEBP_QUALITY,
            effort: 6 // Balance entre velocidade e compressão
        })
        .toBuffer();
    
    // 4. Obtém metadados da imagem processada
    const finalMetadata = await sharp(processedBuffer).metadata();
    
    return {
        buffer: processedBuffer,
        format: 'webp',
        ext: '.webp',
        metadata: {
            width: finalMetadata.width,
            height: finalMetadata.height,
            size: processedBuffer.length
        }
    };
}

/**
 * Versão alternativa que mantém o formato original (sem converter para WebP)
 */
export async function processImageKeepFormat(buffer: Buffer): Promise<ProcessedImage> {
    const originalFormat = await detectFormat(buffer);
    
    const pipeline = sharp(buffer)
        .rotate()
        .resize({
            width: MAX_DIMENSION,
            height: MAX_DIMENSION,
            fit: 'inside',
            withoutEnlargement: true
        });
    
    // Mantém formato original com otimização específica
    let processedBuffer: Buffer;
    
    switch (originalFormat) {
        case 'jpeg':
            processedBuffer = await pipeline.jpeg({ 
                quality: 85, 
                progressive: true 
            }).toBuffer();
            break;
        case 'png':
            processedBuffer = await pipeline.png({ 
                quality: 80, 
                compressionLevel: 8 
            }).toBuffer();
            break;
        case 'webp':
            processedBuffer = await pipeline.webp({ 
                quality: WEBP_QUALITY 
            }).toBuffer();
            break;
    }
    
    const finalMetadata = await sharp(processedBuffer).metadata();
    
    return {
        buffer: processedBuffer,
        format: originalFormat,
        ext: `.${originalFormat}`,
        metadata: {
            width: finalMetadata.width,
            height: finalMetadata.height,
            size: processedBuffer.length
        }
    };
}
