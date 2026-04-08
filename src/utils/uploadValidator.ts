import sharp from "sharp";

export const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const MAX_DIMENSIONS = 4000; // px
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export async function validateAndOptimizeImage(buffer: Buffer): Promise<{
  buffer: Buffer;
  ext: string;
  mime: string;
}> {
  // 1. Validação simplificada por mimetype (sem file-type)
  // Em produção, recomendo implementar validação por magic bytes
  const mime = buffer.toString("hex", 0, 4);
  // Verifica cabeçalhos básicos de JPEG, PNG ou WebP
  if (!mime.startsWith("ffd8") && // JPEG
      !mime.startsWith("89504e47") && // PNG
      !mime.startsWith("52494646")) { // WebP/RIFF
    throw new Error("Formato de imagem inválido. Use JPEG, PNG ou WebP.");
  }

  // 2. Valida dimensões
  const metadata = await sharp(buffer).metadata();
  if ((metadata.width || 0) > MAX_DIMENSIONS || (metadata.height || 0) > MAX_DIMENSIONS) {
    throw new Error("Imagem muito grande. Dimensão máxima: 4000px.");
  }

  // 3. Otimiza e converte para WebP (mais leve, mesma qualidade)
  const optimized = await sharp(buffer)
    .resize({ width: 2400, height: 2400, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 85 })
    .toBuffer();

  return {
    buffer: optimized,
    ext: ".webp",
    mime: "image/webp"
  };
}
