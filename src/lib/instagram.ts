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
  const pattern = /(?:instagram\.com\/(?:p|reel|reels|tv|share\/p|share\/reel)\/|instagr\.am\/(?:p|reel)\/)([A-Za-z0-9_-]+)/i;
  const match = cleanUrl.match(pattern);

  if (match && match[1]) {
    return match[1];
  }

  // Handle nested profile paths e.g. instagram.com/username/p/SHORTCODE
  const profilePostMatch = cleanUrl.match(/instagram\.com\/[^\/]+\/(?:p|reel|reels)\/([A-Za-z0-9_-]+)/i);
  if (profilePostMatch && profilePostMatch[1]) {
    return profilePostMatch[1];
  }

  // Direct shortcode
  if (/^[A-Za-z0-9_-]{9,25}$/.test(cleanUrl)) {
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
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,application/json,*/*;q=0.8',
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
    .replace(/\\u00252F/g, '/')
    .replace(/\\"/g, '"');
}

/**
 * Extract original uncropped image URLs from HTML or JSON
 */
function extractCarouselUrlsFromHtml(html: string): string[] {
  if (!html) return [];
  const unescaped = unescapeInstagramString(html);

  // Strategy A: Parse carousel_media JSON array directly
  const carouselIdx = unescaped.indexOf('"carousel_media":[');
  if (carouselIdx !== -1) {
    let depth = 0;
    const start = carouselIdx + '"carousel_media":'.length;
    let end = start;
    for (let i = start; i < unescaped.length; i++) {
      if (unescaped[i] === '[') depth++;
      else if (unescaped[i] === ']') {
        depth--;
        if (depth === 0) {
          end = i + 1;
          break;
        }
      }
    }

    try {
      const jsonSlice = unescaped.substring(start, end);
      const items = JSON.parse(jsonSlice);
      if (Array.isArray(items) && items.length > 0) {
        const urls: string[] = [];

        for (const item of items) {
          const candidates = item.image_versions2?.candidates || [];
          const uncropped = candidates.filter(
            (c: any) =>
              c.url &&
              !/c\d+\./i.test(c.url) &&
              !/stp=c/i.test(c.url) &&
              !c.url.includes('s150x150') &&
              !c.url.includes('s100x100')
          );

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

  // Strategy B: Parse edge_sidecar_to_children GraphQL structure
  const sidecarIdx = unescaped.indexOf('"edge_sidecar_to_children":');
  if (sidecarIdx !== -1) {
    try {
      const match = unescaped.match(/"edge_sidecar_to_children"\s*:\s*(\{"edges":\[.*?\]\})/s);
      if (match && match[1]) {
        const sidecarObj = JSON.parse(match[1]);
        const edges = sidecarObj.edges || [];
        const urls: string[] = [];
        for (const edge of edges) {
          const node = edge.node;
          if (node?.display_url) {
            urls.push(unescapeInstagramString(node.display_url));
          } else if (node?.display_resources && Array.isArray(node.display_resources) && node.display_resources.length > 0) {
            const sortedRes = [...node.display_resources].sort((a: any, b: any) => (b.config_width || 0) - (a.config_width || 0));
            if (sortedRes[0]?.src) {
              urls.push(unescapeInstagramString(sortedRes[0].src));
            }
          }
        }
        if (urls.length > 0) return urls;
      }
    } catch (e) {
      console.warn('Failed to parse edge_sidecar_to_children:', e);
    }
  }

  // Strategy C: JSON-LD Structured Data
  try {
    const jsonLdMatches = unescaped.matchAll(/<script\s+type=["']application\/ld\+json["']>([\s\S]*?)<\/script>/gi);
    for (const match of jsonLdMatches) {
      if (match[1]) {
        try {
          const parsed = JSON.parse(match[1]);
          if (parsed.image) {
            const imgList = Array.isArray(parsed.image) ? parsed.image : [parsed.image];
            const ldUrls: string[] = [];
            for (const img of imgList) {
              const url = typeof img === 'string' ? img : img.url || img.contentUrl;
              if (url && typeof url === 'string') {
                ldUrls.push(unescapeInstagramString(url));
              }
            }
            if (ldUrls.length > 0) return ldUrls;
          }
        } catch {}
      }
    }
  } catch {}

  // Strategy D: General uncropped candidate scan
  const allImageUrls = [
    ...new Set(
      [...unescaped.matchAll(/https:\/\/[^"'<>\s]+?\.(?:jpg|jpeg|png|webp|heic)[^"'<>\s]*/gi)].map((m) =>
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

  const extractedGrouped = Object.values(grouped).map((urls) => {
    return (
      urls.find((u) => u.includes('1440') || u.includes('xpid.1440') || u.includes('1440.')) ||
      urls.find((u) => u.includes('1080') || u.includes('xpid.1080')) ||
      urls[0]
    );
  });

  if (extractedGrouped.length > 0) {
    return extractedGrouped;
  }

  // Strategy E: OpenGraph og:image fallback for single posts/reels
  const ogMatch = unescaped.match(/<meta\s+property=["']og:image["']\s+content=["'](https?:\/\/[^"'\s]+)["']/i);
  if (ogMatch && ogMatch[1]) {
    return [unescapeInstagramString(ogMatch[1])];
  }

  return [];
}

/**
 * Main Fetch & Process pipeline with multi-tiered fallback
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
    let html = '';
    let title: string | undefined;

    // Tier 1: Googlebot Crawler headers
    try {
      const res = await fetchWithTimeout(postUrl, {
        'User-Agent': CRAWLER_USER_AGENTS[0],
      });
      if (res.ok) {
        html = await res.text();
      }
    } catch (e) {
      console.warn('Tier 1 Googlebot fetch failed:', e);
    }

    // Tier 2: Facebook External Hit Crawler headers
    if (!html || (!html.includes('"carousel_media":') && !html.includes('"edge_sidecar_to_children":'))) {
      try {
        const fbRes = await fetchWithTimeout(postUrl, {
          'User-Agent': CRAWLER_USER_AGENTS[1],
        });
        if (fbRes.ok) {
          const fbHtml = await fbRes.text();
          if (fbHtml.length > html.length) html = fbHtml;
        }
      } catch (e) {
        console.warn('Tier 2 Facebook fetch failed:', e);
      }
    }

    let imageUrls = extractCarouselUrlsFromHtml(html);

    // Tier 3: Instagram Captioned Embed Endpoint (Bypasses Login restrictions)
    if (imageUrls.length === 0) {
      try {
        const embedRes = await fetchWithTimeout(`https://www.instagram.com/p/${shortcode}/embed/captioned/`, {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        });
        if (embedRes.ok) {
          const embedHtml = await embedRes.text();
          const embedUrls = extractCarouselUrlsFromHtml(embedHtml);
          if (embedUrls.length > 0) {
            imageUrls = embedUrls;
            if (!html) html = embedHtml;
          }
        }
      } catch (e) {
        console.warn('Tier 3 Embed captioned fetch failed:', e);
      }
    }

    // Tier 4: Instagram Standard Embed Endpoint
    if (imageUrls.length === 0) {
      try {
        const embedRes = await fetchWithTimeout(`https://www.instagram.com/p/${shortcode}/embed/`, {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        });
        if (embedRes.ok) {
          const embedHtml = await embedRes.text();
          const embedUrls = extractCarouselUrlsFromHtml(embedHtml);
          if (embedUrls.length > 0) {
            imageUrls = embedUrls;
            if (!html) html = embedHtml;
          }
        }
      } catch (e) {
        console.warn('Tier 4 Standard Embed fetch failed:', e);
      }
    }

    // Tier 5: Instagram Official oEmbed fallback
    if (imageUrls.length === 0) {
      try {
        const oembedRes = await fetchWithTimeout(`https://api.instagram.com/oembed/?url=https://www.instagram.com/p/${shortcode}/`);
        if (oembedRes.ok) {
          const oembedData = await oembedRes.json();
          if (oembedData.thumbnail_url) {
            imageUrls = [oembedData.thumbnail_url];
            if (oembedData.title) title = oembedData.title;
          }
        }
      } catch (e) {
        console.warn('Tier 5 oEmbed fetch failed:', e);
      }
    }

    // Extract Title if available
    if (!title && html) {
      const captionMatch = html.match(/<meta property="og:title" content="([^"]+)"/i) ||
                           html.match(/<title>(.*?)<\/title>/i);
      if (captionMatch && captionMatch[1]) {
        title = captionMatch[1].replace(/ • Instagram photos and videos/i, '').trim();
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
      let imgRes = await fetchWithTimeout(
        imgUrl,
        { Referer: 'https://www.instagram.com/' },
        10000
      );

      if (!imgRes.ok) {
        // Retry without referer (some CDNs block referers from third parties)
        imgRes = await fetchWithTimeout(imgUrl, {}, 10000);
      }

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
