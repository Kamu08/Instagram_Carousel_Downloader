import { extractShortcode } from '../src/lib/instagram';
import { processImageToPng } from '../src/lib/image-processor';
import { generateSampleCarousel } from '../src/lib/sample-data';
import sharp from 'sharp';
import JSZip from 'jszip';

async function runVerification() {
  console.log('--- 1. Testing Instagram URL Parsing ---');
  const validUrls = [
    'https://www.instagram.com/p/C4XYZ123abc/',
    'https://instagram.com/p/DB123456789/?img_index=1',
    'https://www.instagram.com/reel/C3testReel1/',
    'https://www.instagram.com/share/p/C4ShareCode9/',
    'C4XYZ123abc'
  ];

  for (const url of validUrls) {
    const code = extractShortcode(url);
    if (!code) {
      throw new Error(`Failed to extract shortcode from: ${url}`);
    }
    console.log(`✓ Parsed "${url}" -> Shortcode: ${code}`);
  }

  console.log('\n--- 2. Testing Sample Carousel Generation ---');
  const sampleSlides = await generateSampleCarousel();
  console.log(`✓ Generated ${sampleSlides.length} sample slides`);
  if (sampleSlides.length !== 7) throw new Error('Expected 7 slides');
  if (sampleSlides[0].filename !== 'carousel-01.png') throw new Error('Expected carousel-01.png');
  if (sampleSlides[6].filename !== 'carousel-07.png') throw new Error('Expected carousel-07.png');
  console.log(`✓ Filenames verified (carousel-01.png to carousel-07.png)`);

  console.log('\n--- 3. Testing Image Processing (JPEG/WEBP -> PNG & LinkedIn Preset 1080x1350) ---');
  const jpegBuffer = await sharp({
    create: {
      width: 800,
      height: 600,
      channels: 3,
      background: { r: 255, g: 100, b: 50 },
    },
  })
    .jpeg()
    .toBuffer();

  const pngResult = await processImageToPng(jpegBuffer, { preset: 'original' });
  console.log(`✓ Converted JPEG -> PNG (${pngResult.width}x${pngResult.height}, ${pngResult.sizeBytes} bytes, Format: ${pngResult.originalFormat})`);
  if (pngResult.width !== 800 || pngResult.height !== 600) throw new Error('Original resolution not preserved');

  const linkedInResult = await processImageToPng(jpegBuffer, {
    preset: 'portrait-1080-1350',
    fitMode: 'contain',
    backgroundMode: 'white',
  });
  console.log(`✓ Applied LinkedIn Portrait Preset -> (${linkedInResult.width}x${linkedInResult.height}, Ratio: ${linkedInResult.aspectRatio})`);
  if (linkedInResult.width !== 1080 || linkedInResult.height !== 1350) throw new Error('LinkedIn preset dimensions incorrect');

  console.log('\n--- 4. Testing ZIP Packaging ---');
  const zip = new JSZip();
  sampleSlides.forEach((s, idx) => {
    const fn = `carousel-${String(idx + 1).padStart(2, '0')}.png`;
    const b64 = s.dataUrl.replace(/^data:image\/\w+;base64,/, '');
    zip.file(fn, b64, { base64: true });
  });
  const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
  console.log(`✓ Created ZIP package: ${zipBuffer.length} bytes containing ${sampleSlides.length} PNGs`);
}

runVerification().catch((err) => {
  console.error('Test verification failed:', err);
  process.exit(1);
});
