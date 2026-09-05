import { NextRequest, NextResponse } from 'next/server';
import { fetchMultiPlatformCarousel } from '@/lib/platform-scrapers';
import { generateSampleCarousel } from '@/lib/sample-data';

export const maxDuration = 60; // 60 seconds max runtime

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url, isSample } = body;

    if (isSample) {
      const slides = await generateSampleCarousel();
      return NextResponse.json({
        success: true,
        shortcode: 'SAMPLE_AI_2026',
        platform: 'instagram',
        title: '5 AI Tools for Product Designers in 2026',
        author: 'design.innovations',
        slideCount: slides.length,
        slides,
      });
    }

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'Please paste a valid post URL (Instagram, LinkedIn, Twitter/X, or Threads).',
          errorType: 'INVALID_URL',
        },
        { status: 400 }
      );
    }

    const result = await fetchMultiPlatformCarousel(url);

    if (!result.success) {
      return NextResponse.json(result, { status: 422 });
    }

    return NextResponse.json(result);
  } catch (err: any) {
    console.error('Error in /api/fetch-carousel:', err);
    return NextResponse.json(
      {
        success: false,
        error: "We couldn't process this post. Please verify that the link is publicly accessible and try again.",
        errorType: 'UNKNOWN',
      },
      { status: 500 }
    );
  }
}
