import { CarouselSlide, InstagramFetchResult } from './types';
import { processImageToPng } from './image-processor';

const CRAWLER_USER_AGENTS = [
  'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
  'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
];

/**
 * Extract Instagram shortcode from various URL formats
 */
export function extractShortcode(inputUrl: string): string | null {
  if (!inputUrl || typeof inputUrl !== 'string') return null;

  const cleanUrl = inputUrl.trim();
  const pattern = /(?:instagram\.com\/(?:p|reel|tv|share\/p)\/|instagr\.am\/p\/)([A-Za-z0-9_-]+)/i;
  const match = cleanUrl.match(pattern);

  if (match && match[1]) {
    return match[1];
  }

  if (/^[A-Za-z0-9_-]{9,15}$/.test(cleanUrl)) {
    return cleanUrl;
  }

  return null;
}

/**
 * Fast fetch with timeout
 */
async function fetchWithTimeout(
  url: string,
  headers?: Record<string, string>,
  timeoutMs = 12000
): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': CRAWLER_USER_AGENTS[0],
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        ...headers,
      },
      signal: controller.signal,
      cache: 'no-store',
    });
    clearTimeout(id);
    return res;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

/**
 * Unescape raw JSON/HTML containing CDN links
 */
function unescapeInstagramString(str: string): string {
  return str
    .replace(/\\\/|\\\//g, '/')
    .replace(/\\u0026/g, '&')
    .replace(/&amp;/g, '&')
    .replace(/\\u00253A/g, ':')
    .replace(/\\u00252F/g, '/');
}

/**
 * Extract original uncropped image URLs from HTML
 */
function extractCarouselUrlsFromHtml(html: string): string[] {
  // Strategy A: Parse carousel_media JSON array directly
  const carouselIdx = html.indexOf('"carousel_media":[');
  if (carouselIdx !== -1) {
    let depth = 0;
    const start = carouselIdx + '"carousel_media":'.length;
    let end = start;
    for (let i = start; i < html.length; i++) {
      if (html[i] === '[') depth++;
      else if (html[i] === ']') {
        depth--;
        if (depth === 0) {
          end = i + 1;
          break;
        }
      }
    }

    try {
      const jsonSlice = html.substring(start, end);
      const items = JSON.parse(jsonSlice);
      if (Array.isArray(items) && items.length > 0) {
        const urls: string[] = [];

        for (const item of items) {
          const candidates = item.image_versions2?.candidates || [];
          // Filter out square crops (e.g. c0.240..., stp=c)
          const uncropped = candidates.filter(
            (c: any) =>
              c.url &&
              !/c\d+\./i.test(c.url) &&
              !/stp=c/i.test(c.url) &&
              !c.url.includes('s150x150') &&
              !c.url.includes('s100x100')
          );

          // Sort by width descending
          uncropped.sort((a: any, b: any) => (b.width || 0) - (a.width || 0));

          const bestUrl = uncropped[0]?.url || item.display_uri || candidates[0]?.url;
          if (bestUrl) {
            urls.push(unescapeInstagramString(bestUrl));
          }
        }

        if (urls.length > 0) {
          return urls;
        }
      }
    } catch (e) {
      console.warn('Failed to parse carousel_media slice:', e);
    }
  }

  // Strategy B: General uncropped candidate scan
  const allImageUrls = [
    ...new Set(
      [...html.matchAll(/https:\/\/[^"'<>\s]+?\.(?:jpg|jpeg|png|webp|heic)[^"'<>\s]*/gi)].map((m) =>
        unescapeInstagramString(m[0])
      )
    ),
  ].filter(
    (u) =>
      !u.includes('rsrc.php') &&
      !u.includes('profile_pic') &&
      !u.includes('s150x150') &&
      !u.includes('s100x100') &&
      !/c\d+\./i.test(u) &&
      !/stp=c/i.test(u)
  );

  const grouped: { [key: string]: string[] } = {};
  for (const u of allImageUrls) {
    const idMatch = u.match(/\/(\d+_\d+_\d+_n\.)/i) || u.match(/\/([^\/?]+_n\.)/i);
    const key = idMatch ? idMatch[1] : u.split('?')[0];
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(u);
  }

  return Object.values(grouped).map((urls) => {
    return (
      urls.find((u) => u.includes('1440') || u.includes('xpid.1440') || u.includes('1440.')) ||
      urls.find((u) => u.includes('1080') || u.includes('xpid.1080')) ||
      urls[0]
    );
  });
}

/**
 * Main Fetch & Process pipeline
 */
export async function fetchInstagramCarousel(url: string): Promise<InstagramFetchResult> {
  const shortcode = extractShortcode(url);

  if (!shortcode) {
    return {
      success: false,
      shortcode: '',
      slideCount: 0,
      slides: [],
      error: 'Please enter a valid Instagram post or carousel URL (e.g. https://www.instagram.com/p/XXXXXXXXXXX/).',
      errorType: 'INVALID_URL',
    };
  }

  try {
    const postUrl = `https://www.instagram.com/p/${shortcode}/`;

    // 1. Fetch with Googlebot crawler headers (delivers full uncropped original master carousel)
    let res = await fetchWithTimeout(postUrl, {
      'User-Agent': CRAWLER_USER_AGENTS[0],
    });

    let html = '';
    if (res.ok) {
      html = await res.text();
    }

    // Fallback to Facebook External Hit if needed
    if (!html || !html.includes('"carousel_media":[')) {
      const fbRes = await fetchWithTimeout(postUrl, {
        'User-Agent': CRAWLER_USER_AGENTS[1],
      });
      if (fbRes.ok) {
        const fbHtml = await fbRes.text();
        if (fbHtml.length > html.length) html = fbHtml;
      }
    }

    let imageUrls = extractCarouselUrlsFromHtml(html);

    // Fallback to embed endpoint if no carousel was found
    if (imageUrls.length === 0) {
      const embedRes = await fetchWithTimeout(`https://www.instagram.com/p/${shortcode}/embed/`);
      if (embedRes.ok) {
        const embedHtml = await embedRes.text();
        imageUrls = extractCarouselUrlsFromHtml(embedHtml);
      }
    }

    if (imageUrls.length === 0) {
      return {
        success: false,
        shortcode,
        slideCount: 0,
        slides: [],
        error: "We couldn't process this Instagram post. Please make sure the post is publicly accessible.",
        errorType: 'NO_MEDIA',
      };
    }

    // Extract Title if available
    const captionMatch = html.match(/<meta property="og:title" content="([^"]+)"/i);
    const title = captionMatch ? captionMatch[1] : undefined;

    return processImagesInParallel(imageUrls, shortcode, title);
  } catch (err: any) {
    console.error('Fatal fetch error:', err);
    return {
      success: false,
      shortcode,
      slideCount: 0,
      slides: [],
      error: "We couldn't process this Instagram post. Please check your network connection and try again.",
      errorType: 'NETWORK_ERROR',
    };
  }
}

/**
 * Download and process all images simultaneously with Promise.all
 */
async function processImagesInParallel(
  imageUrls: string[],
  shortcode: string,
  title?: string
): Promise<InstagramFetchResult> {
  const slidePromises = imageUrls.map(async (imgUrl, index) => {
    const slideNumber = String(index + 1).padStart(2, '0');
    const filename = `carousel-${slideNumber}.png`;

    try {
      const imgRes = await fetchWithTimeout(
        imgUrl,
        { Referer: 'https://www.instagram.com/' },
        10000
      );

      if (!imgRes.ok) return null;

      const arrayBuffer = await imgRes.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Convert to Master PNG preserving exact original dimensions
      const processed = await processImageToPng(buffer, { preset: 'original' });

      const slide: CarouselSlide = {
        id: `slide-${index + 1}-${Date.now()}`,
        originalIndex: index,
        currentIndex: index,
        filename,
        originalUrl: imgUrl,
        originalFormat: processed.originalFormat,
        dataUrl: processed.dataUrl,
        width: processed.width,
        height: processed.height,
        aspectRatio: processed.aspectRatio,
        sizeBytes: processed.sizeBytes,
      };

      return slide;
    } catch (slideErr) {
      console.error(`Error downloading slide ${index + 1}:`, slideErr);
      return null;
    }
  });

  const results = await Promise.all(slidePromises);
  const slides = results.filter((s): s is CarouselSlide => s !== null);

  if (slides.length === 0) {
    return {
      success: false,
      shortcode,
      slideCount: 0,
      slides: [],
      error: 'Failed to download image media from this post.',
      errorType: 'NO_MEDIA',
    };
  }

  // Ensure sequence order is 0, 1, 2...
  slides.forEach((s, idx) => {
    s.currentIndex = idx;
    s.filename = `carousel-${String(idx + 1).padStart(2, '0')}.png`;
  });

  return {
    success: true,
    shortcode,
    title,
    slideCount: slides.length,
    slides,
  };
}
