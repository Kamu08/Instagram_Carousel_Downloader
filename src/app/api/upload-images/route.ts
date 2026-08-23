import { NextRequest, NextResponse } from 'next/server';
import { processImageToPng } from '@/lib/image-processor';
import { CarouselSlide } from '@/lib/types';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No files uploaded. Please choose one or more images.' },
        { status: 400 }
      );
    }

    const slides: CarouselSlide[] = [];

    for (let index = 0; index < files.length; index++) {
      const file = files[index];
      const slideNumber = String(index + 1).padStart(2, '0');
      const filename = `carousel-${slideNumber}.png`;

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      try {
        const processed = await processImageToPng(buffer, { preset: 'original' });

        slides.push({
          id: `uploaded-${index + 1}-${Date.now()}`,
          originalIndex: index,
          currentIndex: index,
          filename,
          originalFormat: processed.originalFormat,
          dataUrl: processed.dataUrl,
          width: processed.width,
          height: processed.height,
          aspectRatio: processed.aspectRatio,
          sizeBytes: processed.sizeBytes,
        });
      } catch (err: any) {
        console.error(`Failed processing uploaded file ${file.name}:`, err);
        return NextResponse.json(
          {
            success: false,
            error: `Failed to process image "${file.name}". Please ensure it is a valid HEIC, JPEG, WEBP, or PNG file.`,
          },
          { status: 422 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      slideCount: slides.length,
      slides,
    });
  } catch (err: any) {
    console.error('Error in /api/upload-images:', err);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred while processing uploaded images.' },
      { status: 500 }
    );
  }
}
