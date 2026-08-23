import { jsPDF } from 'jspdf';
import { CarouselSlide } from './types';

export async function generateLinkedInPdf(slides: CarouselSlide[]): Promise<Blob> {
  if (!slides || slides.length === 0) {
    throw new Error('No slides available to generate PDF.');
  }

  // First slide configuration
  const firstSlide = slides[0];
  const firstOrientation = firstSlide.width > firstSlide.height ? 'landscape' : 'portrait';

  // Use pt or px dimensions corresponding to slide aspect ratio
  const doc = new jsPDF({
    orientation: firstOrientation,
    unit: 'px',
    format: [firstSlide.width, firstSlide.height],
    hotfixes: ['px_scaling'],
  });

  // Add first slide image
  doc.addImage(
    firstSlide.dataUrl,
    'PNG',
    0,
    0,
    firstSlide.width,
    firstSlide.height,
    `slide-1`,
    'FAST'
  );

  // Add subsequent slides
  for (let i = 1; i < slides.length; i++) {
    const slide = slides[i];
    const orientation = slide.width > slide.height ? 'landscape' : 'portrait';

    doc.addPage([slide.width, slide.height], orientation);
    doc.addImage(
      slide.dataUrl,
      'PNG',
      0,
      0,
      slide.width,
      slide.height,
      `slide-${i + 1}`,
      'FAST'
    );
  }

  return doc.output('blob');
}
