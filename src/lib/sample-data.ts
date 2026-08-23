import sharp from 'sharp';
import { CarouselSlide } from './types';

const SAMPLE_SLIDES_CONFIG = [
  {
    page: 1,
    title: '5 AI Tools for Product Designers in 2026',
    subtitle: 'Swipe to discover the future of workflow automation &#8594;',
    bgStart: '#1e3a8a',
    bgEnd: '#3b82f6',
    accent: '#60a5fa',
    tag: 'PRODUCTIVITY &amp; DESIGN',
  },
  {
    page: 2,
    title: '1. NeuralCanvas Pro',
    subtitle: 'Transform raw sketches into fully responsive, production-ready React components.',
    bgStart: '#0f172a',
    bgEnd: '#1e293b',
    accent: '#38bdf8',
    tag: 'UI / UX GENERATION',
  },
  {
    page: 3,
    title: '2. DeepTone Audio Studio',
    subtitle: 'Studio-grade voice cloning and podcast sound remastering in under 3 seconds.',
    bgStart: '#311042',
    bgEnd: '#581c87',
    accent: '#c084fc',
    tag: 'AUDIO ENGINE',
  },
  {
    page: 4,
    title: '3. VectorFlow 3D',
    subtitle: 'Generate textured 3D assets directly inside Figma using natural language prompts.',
    bgStart: '#064e3b',
    bgEnd: '#047857',
    accent: '#34d399',
    tag: '3D MODELLING',
  },
  {
    page: 5,
    title: '4. CopyRefine Intelligence',
    subtitle: 'High-converting LinkedIn hook generator tuned on over 10M viral posts.',
    bgStart: '#7c2d12',
    bgEnd: '#c2410c',
    accent: '#fb923c',
    tag: 'COPYWRITING',
  },
  {
    page: 6,
    title: '5. ClarityAudit',
    subtitle: 'Automated accessibility &amp; contrast tester meeting strict WCAG standards.',
    bgStart: '#14532d',
    bgEnd: '#16a34a',
    accent: '#4ade80',
    tag: 'ACCESSIBILITY',
  },
  {
    page: 7,
    title: 'Found this helpful?',
    subtitle: 'Save this post, repost to your network, and follow for daily tech insights!',
    bgStart: '#0a0a0a',
    bgEnd: '#171717',
    accent: '#0a66c2',
    tag: 'SHARE &amp; ENGAGE',
  },
];

export async function generateSampleCarousel(): Promise<CarouselSlide[]> {
  const slides: CarouselSlide[] = [];
  const width = 1080;
  const height = 1350; // 4:5 Instagram/LinkedIn carousel ratio

  for (let i = 0; i < SAMPLE_SLIDES_CONFIG.length; i++) {
    const config = SAMPLE_SLIDES_CONFIG[i];
    const slideNumber = String(i + 1).padStart(2, '0');
    const filename = `carousel-${slideNumber}.png`;

    const svg = `
      <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bgGrad${i}" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="${config.bgStart}" />
            <stop offset="100%" stop-color="${config.bgEnd}" />
          </linearGradient>
        </defs>

        <!-- Background -->
        <rect width="${width}" height="${height}" fill="url(#bgGrad${i})" />

        <!-- Header Tag -->
        <rect x="80" y="90" width="300" height="46" rx="23" fill="${config.accent}" opacity="0.25" />
        <text x="100" y="120" font-family="Arial, Helvetica, sans-serif" font-size="16" font-weight="bold" fill="${config.accent}" letter-spacing="2">${config.tag}</text>

        <!-- Slide Number Pill -->
        <rect x="${width - 180}" y="90" width="100" height="46" rx="23" fill="#ffffff" opacity="0.15" />
        <text x="${width - 130}" y="120" font-family="Arial, Helvetica, sans-serif" font-size="18" font-weight="bold" fill="#ffffff" text-anchor="middle">${config.page} / 7</text>

        <!-- Main Title -->
        <text x="80" y="440" font-family="Arial, Helvetica, sans-serif" font-size="64" font-weight="bold" fill="#ffffff">
          ${config.title}
        </text>

        <!-- Accent Line -->
        <rect x="80" y="520" width="120" height="8" rx="4" fill="${config.accent}" />

        <!-- Subtitle -->
        <text x="80" y="600" font-family="Arial, Helvetica, sans-serif" font-size="34" fill="#e2e8f0">
          ${config.subtitle}
        </text>

        <!-- Footer -->
        <rect x="80" y="${height - 120}" width="${width - 160}" height="1" fill="#ffffff" opacity="0.2" />
        <text x="80" y="${height - 70}" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="bold" fill="#94a3b8">LinkedIn Carousel Processed</text>
        <text x="${width - 80}" y="${height - 70}" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="bold" fill="${config.accent}" text-anchor="end">Slide ${config.page}</text>
      </svg>
    `;

    const pngBuffer = await sharp(Buffer.from(svg))
      .png({ compressionLevel: 9, quality: 100 })
      .toBuffer();

    slides.push({
      id: `sample-slide-${i + 1}`,
      originalIndex: i,
      currentIndex: i,
      filename,
      originalFormat: 'PNG',
      dataUrl: `data:image/png;base64,${pngBuffer.toString('base64')}`,
      width,
      height,
      aspectRatio: '4:5 (Portrait)',
      sizeBytes: pngBuffer.length,
    });
  }

  return slides;
}
