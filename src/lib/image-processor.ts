import sharp, { Color, Sharp } from 'sharp';
import heicDecode from 'heic-decode';
import { LinkedInOptions } from './types';

export interface ProcessedImageResult {
  pngBuffer: Buffer;
  dataUrl: string;
  width: number;
  height: number;
  originalFormat: string;
  sizeBytes: number;
  aspectRatio: string;
}

/**
 * Detect image format from magic bytes in buffer
 */
export function detectImageFormat(buffer: Buffer): string {
  if (buffer.length < 12) return 'unknown';

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return 'png';
  }

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'jpeg';
  }

  // WEBP: RIFF....WEBP
  const riff = buffer.toString('ascii', 0, 4);
  const webp = buffer.toString('ascii', 8, 12);
  if (riff === 'RIFF' && webp === 'WEBP') {
    return 'webp';
  }

  // HEIC / HEIF / AVIF: check ftyp box at offset 4..8
  const ftyp = buffer.toString('ascii', 4, 8);
  if (ftyp === 'ftyp') {
    const brand = buffer.toString('ascii', 8, 12).toLowerCase();
    if (['heic', 'heix', 'hevc', 'mif1', 'msf1'].includes(brand)) {
      return 'heic';
    }
    if (['avif', 'avis'].includes(brand)) {
      return 'avif';
    }
  }

  // GIF: GIF87a or GIF89a
  const gif = buffer.toString('ascii', 0, 3);
  if (gif === 'GIF') {
    return 'gif';
  }

  return 'unknown';
}

/**
 * Convert any image buffer (HEIC, JPEG, WEBP, PNG, AVIF) into a sharp instance
 */
async function bufferToSharp(buffer: Buffer, format: string): Promise<Sharp> {
  if (format === 'heic') {
    try {
      // Try sharp native first if libheif is compiled in sharp
      const meta = await sharp(buffer).metadata();
      if (meta.format === 'heif' || (meta.format as string) === 'heic') {
        return sharp(buffer);
      }
    } catch {
      // Fallback to heic-decode
      try {
        const decoded = await heicDecode({ buffer });
        const rawData =
          decoded.data instanceof Uint8Array
            ? decoded.data
            : new Uint8Array(decoded.data);
        return sharp(Buffer.from(rawData.buffer, rawData.byteOffset, rawData.byteLength), {
          raw: {
            width: decoded.width,
            height: decoded.height,
            channels: 4,
          },
        });
      } catch (err) {
        console.error('Failed to decode HEIC with fallback:', err);
        throw new Error('Failed to decode HEIC image.');
      }
    }
  }

  return sharp(buffer, { failOn: 'none' });
}

/**
 * Calculate standard aspect ratio label e.g., "4:5", "1:1", "16:9"
 */
function getAspectRatioLabel(width: number, height: number): string {
  if (!width || !height) return '1:1';
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const divisor = gcd(Math.round(width), Math.round(height));
  const w = Math.round(width / divisor);
  const h = Math.round(height / divisor);

  // Match common standard ratios with slight tolerance
  const ratio = width / height;
  if (Math.abs(ratio - 1) < 0.03) return '1:1 (Square)';
  if (Math.abs(ratio - 4 / 5) < 0.03) return '4:5 (Portrait)';
  if (Math.abs(ratio - 16 / 9) < 0.03) return '16:9 (Landscape)';
  if (Math.abs(ratio - 9 / 16) < 0.03) return '9:16 (Story)';

  return `${w}:${h}`;
}

/**
 * Process an image buffer into high-quality PNG with optional LinkedIn Ready transformations
 */
export async function processImageToPng(
  rawBuffer: Buffer,
  options?: Partial<LinkedInOptions>
): Promise<ProcessedImageResult> {
  const detectedFormat = detectImageFormat(rawBuffer);
  let sharpInstance = await bufferToSharp(rawBuffer, detectedFormat);

  // Auto-rotate according to EXIF orientation
  sharpInstance = sharpInstance.rotate();

  const metadata = await sharpInstance.metadata();
  const origWidth = metadata.width || 1080;
  const origHeight = metadata.height || 1080;

  let targetWidth = origWidth;
  let targetHeight = origHeight;
  let isResizing = false;

  const preset = options?.preset || 'original';
  const fitMode = options?.fitMode || 'contain';
  const backgroundMode = options?.backgroundMode || 'white';
  const customBgHex = options?.backgroundColorHex || '#ffffff';

  if (preset === 'portrait-1080-1350') {
    targetWidth = 1080;
    targetHeight = 1350;
    isResizing = true;
  } else if (preset === 'square-1080-1080') {
    targetWidth = 1080;
    targetHeight = 1080;
    isResizing = true;
  } else if (preset === 'custom' && options?.customWidth && options?.customHeight) {
    targetWidth = options.customWidth;
    targetHeight = options.customHeight;
    isResizing = true;
  }

  let finalBuffer: Buffer;

  if (isResizing && (targetWidth !== origWidth || targetHeight !== origHeight)) {
    if (fitMode === 'cover') {
      // Cover / Crop centered without stretching
      finalBuffer = await sharpInstance
        .resize(targetWidth, targetHeight, {
          fit: sharp.fit.cover,
          position: sharp.strategy.attention,
          withoutEnlargement: false,
        })
        .png({ compressionLevel: 9, adaptiveFiltering: true, quality: 100 })
        .toBuffer();
    } else {
      // Contain / Fit with background padding
      let bgOption: Color = { r: 255, g: 255, b: 255, alpha: 1 };
      if (backgroundMode === 'black') {
        bgOption = { r: 0, g: 0, b: 0, alpha: 1 };
      } else if (backgroundMode === 'transparent') {
        bgOption = { r: 0, g: 0, b: 0, alpha: 0 };
      } else if (backgroundMode === 'white') {
        bgOption = { r: 255, g: 255, b: 255, alpha: 1 };
      } else if (customBgHex) {
        bgOption = customBgHex;
      }

      if (backgroundMode === 'blur') {
        // Create blurred background canvas
        const blurredBg = await sharp(rawBuffer)
          .resize(targetWidth, targetHeight, { fit: 'cover' })
          .blur(30)
          .modulate({ brightness: 0.7 })
          .toBuffer();

        const foreground = await sharpInstance
          .resize(targetWidth, targetHeight, {
            fit: sharp.fit.contain,
            background: { r: 0, g: 0, b: 0, alpha: 0 },
          })
          .png()
          .toBuffer();

        finalBuffer = await sharp(blurredBg)
          .composite([{ input: foreground, gravity: 'center' }])
          .png({ compressionLevel: 9, adaptiveFiltering: true })
          .toBuffer();
      } else {
        finalBuffer = await sharpInstance
          .resize(targetWidth, targetHeight, {
            fit: sharp.fit.contain,
            background: bgOption,
          })
          .png({ compressionLevel: 9, adaptiveFiltering: true, quality: 100 })
          .toBuffer();
      }
    }
  } else {
    // Keep original dimensions, lossless PNG conversion
    finalBuffer = await sharpInstance
      .png({
        compressionLevel: 9,
        adaptiveFiltering: true,
        quality: 100,
        effort: 7,
      })
      .toBuffer();
  }

  const finalMeta = await sharp(finalBuffer).metadata();
  const width = finalMeta.width || targetWidth;
  const height = finalMeta.height || targetHeight;
  const sizeBytes = finalBuffer.length;
  const dataUrl = `data:image/png;base64,${finalBuffer.toString('base64')}`;
  const aspectRatio = getAspectRatioLabel(width, height);

  return {
    pngBuffer: finalBuffer,
    dataUrl,
    width,
    height,
    originalFormat: detectedFormat.toUpperCase(),
    sizeBytes,
    aspectRatio,
  };
}
