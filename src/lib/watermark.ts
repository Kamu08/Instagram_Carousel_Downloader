import { CarouselSlide } from './types';

export type WatermarkPosition =
  | 'top-right'
  | 'top-center'
  | 'top-left'
  | 'bottom-right'
  | 'bottom-center'
  | 'bottom-left';

export type WatermarkStyle =
  | 'pill'
  | 'bold-badge'
  | 'pastel-pink'
  | 'tech-blue'
  | 'mint-stamp'
  | 'frosted-glass'
  | 'tape-sticker'
  | 'minimal';

export interface WatermarkOptions {
  enabled: boolean;
  text: string;
  position: WatermarkPosition;
  applyToFirstSlide: boolean;
  applyToLastSlide: boolean;
  applyToBodySlides: boolean;
  style: WatermarkStyle;
  color: string;
  backgroundColor: string;
  opacity: number;
  fontSize: number; // Base font size on a 1080px canvas (scaled proportionally)
  showIcon?: 'none' | 'linkedin' | 'at' | 'star';
}

export const DEFAULT_WATERMARK_OPTIONS: WatermarkOptions = {
  enabled: false,
  text: 'Kamal Sharma',
  position: 'top-right',
  applyToFirstSlide: true,
  applyToLastSlide: true,
  applyToBodySlides: true,
  style: 'pill',
  color: '#1D1815',
  backgroundColor: '#FDE047',
  opacity: 0.95,
  fontSize: 26,
  showIcon: 'none',
};

/**
 * Apply watermark to a single image dataUrl using HTML5 Canvas
 */
export async function stampWatermarkOnCanvas(
  dataUrl: string,
  slideIndex: number,
  totalSlides: number,
  options: WatermarkOptions
): Promise<string> {
  if (!options.enabled || !options.text.trim()) {
    return dataUrl;
  }

  // Check slide selection rules
  const isFirst = slideIndex === 0;
  const isLast = slideIndex === totalSlides - 1;
  const isBody = !isFirst && !isLast;

  if (isFirst && !options.applyToFirstSlide) return dataUrl;
  if (isLast && !options.applyToLastSlide) return dataUrl;
  if (isBody && !options.applyToBodySlides) return dataUrl;

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas 2D context not available.'));
        return;
      }

      // 1. Draw clean base image
      ctx.drawImage(img, 0, 0);

      // 2. Proportional scaling calculation based on canvas width (normalized to 1080px)
      const scaleFactor = canvas.width / 1080;
      const fontSize = Math.round(options.fontSize * scaleFactor);
      const paddingX = Math.round(18 * scaleFactor);
      const paddingY = Math.round(9 * scaleFactor);
      const borderRadius = Math.round(14 * scaleFactor);
      const margin = Math.round(38 * scaleFactor);

      ctx.save();
      ctx.globalAlpha = options.opacity;
      ctx.font = `800 ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;

      let iconPrefix = '';
      if (options.showIcon === 'linkedin') iconPrefix = 'in | ';
      else if (options.showIcon === 'at') iconPrefix = '@';
      else if (options.showIcon === 'star') iconPrefix = '★ ';

      const displayText = `${iconPrefix}${options.text}`;
      const textMetrics = ctx.measureText(displayText);
      const textWidth = textMetrics.width;
      const badgeWidth = textWidth + paddingX * 2;
      const badgeHeight = fontSize + paddingY * 2;

      let x = margin;
      let y = margin;

      // 3. Position Calculation (6 Positions)
      switch (options.position) {
        case 'top-right':
          x = canvas.width - margin - badgeWidth;
          y = margin;
          break;
        case 'top-center':
          x = (canvas.width - badgeWidth) / 2;
          y = margin;
          break;
        case 'top-left':
          x = margin;
          y = margin;
          break;
        case 'bottom-right':
          x = canvas.width - margin - badgeWidth;
          y = canvas.height - margin - badgeHeight;
          break;
        case 'bottom-center':
          x = (canvas.width - badgeWidth) / 2;
          y = canvas.height - margin - badgeHeight;
          break;
        case 'bottom-left':
          x = margin;
          y = canvas.height - margin - badgeHeight;
          break;
        default:
          x = canvas.width - margin - badgeWidth;
          y = margin;
      }

      // 4. Style Renderers
      if (options.style === 'pill') {
        // Doodle Yellow / Custom Pill with 3D offset shadow
        ctx.fillStyle = options.backgroundColor || '#FDE047';
        ctx.strokeStyle = '#1D1815';
        ctx.lineWidth = Math.max(3, Math.round(3.5 * scaleFactor));
        ctx.shadowColor = '#1D1815';
        ctx.shadowOffsetX = Math.round(3 * scaleFactor);
        ctx.shadowOffsetY = Math.round(3 * scaleFactor);
        ctx.shadowBlur = 0;

        ctx.beginPath();
        ctx.roundRect(x, y, badgeWidth, badgeHeight, borderRadius);
        ctx.fill();
        ctx.stroke();

        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        ctx.fillStyle = options.color || '#1D1815';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(displayText, x + paddingX, y + badgeHeight / 2 + 1);
      } else if (options.style === 'bold-badge') {
        // Midnight Dark Contrast Badge
        ctx.fillStyle = 'rgba(29, 24, 21, 0.92)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = Math.max(2, Math.round(2 * scaleFactor));
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 8;

        ctx.beginPath();
        ctx.roundRect(x, y, badgeWidth, badgeHeight, borderRadius);
        ctx.fill();
        ctx.stroke();

        ctx.shadowBlur = 0;
        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(displayText, x + paddingX, y + badgeHeight / 2);
      } else if (options.style === 'pastel-pink') {
        // Pastel Pink Highlighter Badge
        ctx.fillStyle = '#F5A3B3';
        ctx.strokeStyle = '#1D1815';
        ctx.lineWidth = Math.max(3, Math.round(3.5 * scaleFactor));
        ctx.shadowColor = '#1D1815';
        ctx.shadowOffsetX = Math.round(2.5 * scaleFactor);
        ctx.shadowOffsetY = Math.round(2.5 * scaleFactor);

        ctx.beginPath();
        ctx.roundRect(x, y, badgeWidth, badgeHeight, borderRadius);
        ctx.fill();
        ctx.stroke();

        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        ctx.fillStyle = '#1D1815';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(displayText, x + paddingX, y + badgeHeight / 2 + 1);
      } else if (options.style === 'tech-blue') {
        // Tech Blue Badge
        ctx.fillStyle = '#93C5FD';
        ctx.strokeStyle = '#1D1815';
        ctx.lineWidth = Math.max(3, Math.round(3.5 * scaleFactor));
        ctx.shadowColor = '#1D1815';
        ctx.shadowOffsetX = Math.round(2.5 * scaleFactor);
        ctx.shadowOffsetY = Math.round(2.5 * scaleFactor);

        ctx.beginPath();
        ctx.roundRect(x, y, badgeWidth, badgeHeight, borderRadius);
        ctx.fill();
        ctx.stroke();

        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        ctx.fillStyle = '#1D1815';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(displayText, x + paddingX, y + badgeHeight / 2 + 1);
      } else if (options.style === 'mint-stamp') {
        // Mint Green Badge
        ctx.fillStyle = '#A7F3D0';
        ctx.strokeStyle = '#1D1815';
        ctx.lineWidth = Math.max(3, Math.round(3.5 * scaleFactor));
        ctx.shadowColor = '#1D1815';
        ctx.shadowOffsetX = Math.round(2.5 * scaleFactor);
        ctx.shadowOffsetY = Math.round(2.5 * scaleFactor);

        ctx.beginPath();
        ctx.roundRect(x, y, badgeWidth, badgeHeight, borderRadius);
        ctx.fill();
        ctx.stroke();

        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        ctx.fillStyle = '#1D1815';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(displayText, x + paddingX, y + badgeHeight / 2 + 1);
      } else if (options.style === 'frosted-glass') {
        // Modern Frosted Glass Pill
        ctx.fillStyle = 'rgba(255, 255, 255, 0.88)';
        ctx.strokeStyle = 'rgba(29, 24, 21, 0.25)';
        ctx.lineWidth = Math.max(2, Math.round(2 * scaleFactor));
        ctx.shadowColor = 'rgba(0,0,0,0.15)';
        ctx.shadowBlur = 12;

        ctx.beginPath();
        ctx.roundRect(x, y, badgeWidth, badgeHeight, borderRadius);
        ctx.fill();
        ctx.stroke();

        ctx.shadowBlur = 0;
        ctx.fillStyle = '#1D1815';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(displayText, x + paddingX, y + badgeHeight / 2);
      } else if (options.style === 'tape-sticker') {
        // Washi Tape Sticker Style with Dashed Stitching
        ctx.fillStyle = 'rgba(253, 224, 71, 0.95)';
        ctx.strokeStyle = 'rgba(29, 24, 21, 0.7)';
        ctx.lineWidth = Math.max(2, Math.round(2.5 * scaleFactor));
        ctx.setLineDash([Math.round(6 * scaleFactor), Math.round(4 * scaleFactor)]);

        ctx.beginPath();
        ctx.roundRect(x, y, badgeWidth, badgeHeight, 6 * scaleFactor);
        ctx.fill();
        ctx.stroke();

        ctx.setLineDash([]);
        ctx.fillStyle = '#1D1815';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(displayText, x + paddingX, y + badgeHeight / 2);
      } else {
        // Minimal Outline Clean Text
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';

        // Outer dark stroke
        ctx.strokeStyle = '#1D1815';
        ctx.lineWidth = Math.max(4, Math.round(5 * scaleFactor));
        ctx.lineJoin = 'round';
        ctx.strokeText(displayText, x, y);

        ctx.fillStyle = options.color || '#FFFFFF';
        ctx.fillText(displayText, x, y);
      }

      ctx.restore();

      resolve(canvas.toDataURL('image/png'));
    };

    img.onerror = () => reject(new Error('Failed to load image for watermarking.'));
    img.src = dataUrl;
  });
}

/**
 * Apply watermark to all slides concurrently while preserving clean image backups
 */
export async function applyWatermarkToAllSlides(
  slides: CarouselSlide[],
  options: WatermarkOptions
): Promise<CarouselSlide[]> {
  const promises = slides.map(async (slide, idx) => {
    try {
      // Use clean unwatermarked base image
      const baseCleanUrl = slide.cleanDataUrl || slide.dataUrl;

      const stampedDataUrl = await stampWatermarkOnCanvas(
        baseCleanUrl,
        idx,
        slides.length,
        options
      );

      const byteString = atob(stampedDataUrl.split(',')[1]);

      return {
        ...slide,
        cleanDataUrl: baseCleanUrl,
        dataUrl: stampedDataUrl,
        isWatermarked: true,
        sizeBytes: byteString.length,
      };
    } catch (err) {
      console.error(`Failed to watermark slide ${idx + 1}:`, err);
      return slide;
    }
  });

  return Promise.all(promises);
}

/**
 * Revert all slides to clean unwatermarked master images
 */
export function removeWatermarkFromAllSlides(slides: CarouselSlide[]): CarouselSlide[] {
  return slides.map((slide) => {
    const cleanUrl = slide.cleanDataUrl || slide.dataUrl;
    const byteString = atob(cleanUrl.split(',')[1]);

    return {
      ...slide,
      dataUrl: cleanUrl,
      isWatermarked: false,
      sizeBytes: byteString.length,
    };
  });
}
