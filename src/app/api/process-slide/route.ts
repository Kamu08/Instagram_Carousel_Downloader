import { NextRequest, NextResponse } from 'next/server';
import { processImageToPng } from '@/lib/image-processor';
import { LinkedInOptions } from '@/lib/types';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { slides, options } = body as {
      slides: { id: string; dataUrl: string; originalIndex: number; currentIndex: number; filename: string }[];
      options: LinkedInOptions;
    };

    if (!slides || !Array.isArray(slides) || slides.length === 0) {
      return NextResponse.json({ success: false, error: 'No slides provided' }, { status: 400 });
    }

    const updatedSlides = [];

    for (let i = 0; i < slides.length; i++) {
      const slide = slides[i];
      // Extract base64 buffer from dataUrl
      const base64Data = slide.dataUrl.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');

      const processed = await processImageToPng(buffer, options);

      updatedSlides.push({
        ...slide,
        dataUrl: processed.dataUrl,
        width: processed.width,
        height: processed.height,
        aspectRatio: processed.aspectRatio,
        sizeBytes: processed.sizeBytes,
      });
    }

    return NextResponse.json({
      success: true,
      slides: updatedSlides,
    });
  } catch (err: any) {
    console.error('Error in /api/process-slide:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to apply LinkedIn transformations.' },
      { status: 500 }
    );
  }
}
