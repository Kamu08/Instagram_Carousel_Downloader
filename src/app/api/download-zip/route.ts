import { NextRequest, NextResponse } from 'next/server';
import JSZip from 'jszip';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { slides } = body as {
      slides: { filename: string; dataUrl: string; currentIndex: number }[];
    };

    if (!slides || !Array.isArray(slides) || slides.length === 0) {
      return NextResponse.json({ success: false, error: 'No slides to package.' }, { status: 400 });
    }

    const zip = new JSZip();

    // Sort slides by currentIndex to ensure proper file sequence
    const sortedSlides = [...slides].sort((a, b) => a.currentIndex - b.currentIndex);

    for (let i = 0; i < sortedSlides.length; i++) {
      const slide = sortedSlides[i];
      const slideNumber = String(i + 1).padStart(2, '0');
      const filename = `carousel-${slideNumber}.png`;

      const base64Data = slide.dataUrl.replace(/^data:image\/\w+;base64,/, '');
      zip.file(filename, base64Data, { base64: true });
    }

    const zipBuffer = await zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    });

    return new NextResponse(new Uint8Array(zipBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': 'attachment; filename="linkedin-carousel.zip"',
        'Content-Length': zipBuffer.length.toString(),
      },
    });
  } catch (err: any) {
    console.error('Error generating zip:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to generate ZIP archive.' },
      { status: 500 }
    );
  }
}
