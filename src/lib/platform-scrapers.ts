import { CarouselSlide, MultiPlatformFetchResult, PlatformType } from './types';
import { fetchInstagramCarousel } from './instagram';
import { processImageToPng } from './image-processor';
import { detectPlatform } from './platform-detector';

export { detectPlatform };

const CRAWLER_USER_AGENTS = [
  'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
  'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
  'Twitterbot/1.0',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
];

/**
 * Fast fetch with timeout and realistic headers
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
        'User-Agent': CRAWLER_USER_AGENTS[3],
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
 * Download an image and process it into a CarouselSlide
 */
async function downloadAndProcessSlide(
  imageUrl: string,
  index: number
): Promise<CarouselSlide> {
  const response = await fetchWithTimeout(imageUrl);
  if (!response.ok) {
    throw new Error(`Failed to download slide ${index + 1}: HTTP ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const slideNumber = String(index + 1).padStart(2, '0');
  const filename = `carousel-${slideNumber}.png`;

  const processed = await processImageToPng(buffer, { preset: 'original' });

  const slide: CarouselSlide = {
    id: `slide-${index + 1}-${Date.now()}`,
    originalIndex: index,
    currentIndex: index,
    filename,
    originalUrl: imageUrl,
    originalFormat: processed.originalFormat,
    dataUrl: processed.dataUrl,
    width: processed.width,
    height: processed.height,
    aspectRatio: processed.aspectRatio,
    sizeBytes: processed.sizeBytes,
  };

  return slide;
}

/**
 * -------------------------------------------------------------
 * 1. TWITTER / X POST & CAROUSEL SCRAPER
 * -------------------------------------------------------------
 */
export async function fetchTwitterPost(inputUrl: string): Promise<MultiPlatformFetchResult> {
  const cleanUrl = inputUrl.trim();
  const tweetIdMatch = cleanUrl.match(/(?:twitter\.com|x\.com)\/(?:#!\/)?[\w.-]+\/status(?:es)?\/(\d+)/i);

  if (!tweetIdMatch || !tweetIdMatch[1]) {
    return {
      success: false,
      shortcode: '',
      platform: 'twitter',
      slideCount: 0,
      slides: [],
      error: 'Please enter a valid Twitter / X post URL with a status ID (e.g. https://x.com/username/status/1234567890).',
      errorType: 'INVALID_URL',
    };
  }

  const tweetId = tweetIdMatch[1];
  let photoUrls: string[] = [];
  let author = 'Twitter User';
  let caption = '';

  // Method 1: Official Twitter Syndication API (No Auth / Free Public Endpoint)
  try {
    const syndicationUrl = `https://cdn.syndication.twimg.com/tweet-result?id=${tweetId}&lang=en`;
    const res = await fetchWithTimeout(syndicationUrl, {
      'User-Agent': CRAWLER_USER_AGENTS[3],
      Referer: 'https://platform.twitter.com/',
    });

    if (res.ok) {
      const data = await res.json();
      author = data.user?.name ? `${data.user.name} (@${data.user.screen_name})` : `@${data.user?.screen_name || 'user'}`;
      caption = data.text || '';

      if (Array.isArray(data.photos) && data.photos.length > 0) {
        photoUrls = data.photos.map((p: any) => p.url);
      } else if (Array.isArray(data.mediaDetails) && data.mediaDetails.length > 0) {
        photoUrls = data.mediaDetails
          .filter((m: any) => m.type === 'photo' || m.media_url_https)
          .map((m: any) => m.media_url_https || m.url);
      }
    }
  } catch (err) {
    console.warn('Twitter syndication API failed, attempting FXTwitter fallback:', err);
  }

  // Method 2: FXTwitter / VxTwitter Public Mirror API Fallback
  if (photoUrls.length === 0) {
    try {
      const fxUrl = `https://api.fxtwitter.com/status/${tweetId}`;
      const res = await fetchWithTimeout(fxUrl);
      if (res.ok) {
        const data = await res.json();
        const tweet = data.tweet;
        if (tweet) {
          author = tweet.author?.name ? `${tweet.author.name} (@${tweet.author.screen_name})` : `@${tweet.author?.screen_name || 'user'}`;
          caption = tweet.text || '';

          if (Array.isArray(tweet.media?.photos)) {
            photoUrls = tweet.media.photos.map((p: any) => p.url);
          } else if (Array.isArray(tweet.media?.all)) {
            photoUrls = tweet.media.all
              .filter((m: any) => m.type === 'photo' || m.url)
              .map((m: any) => m.url);
          }
        }
      }
    } catch (err) {
      console.warn('FXTwitter fallback failed:', err);
    }
  }

  if (photoUrls.length === 0) {
    return {
      success: false,
      shortcode: tweetId,
      platform: 'twitter',
      slideCount: 0,
      slides: [],
      error: 'No photos or carousel images found in this Tweet. Please verify that this post contains images.',
      errorType: 'NO_MEDIA',
    };
  }

  // Process all images concurrently
  try {
    const slides = await Promise.all(
      photoUrls.map((url, idx) => downloadAndProcessSlide(url, idx))
    );

    return {
      success: true,
      shortcode: tweetId,
      platform: 'twitter',
      title: `Twitter Post by ${author}`,
      author,
      caption,
      slideCount: slides.length,
      slides,
    };
  } catch (err: any) {
    return {
      success: false,
      shortcode: tweetId,
      platform: 'twitter',
      slideCount: 0,
      slides: [],
      error: err.message || 'Failed to download and process tweet images.',
      errorType: 'UNKNOWN',
    };
  }
}

/**
 * Unescape LinkedIn raw string / CDN links
 */
function unescapeLinkedInString(str: string): string {
  return str
    .replace(/\\\/|\\\//g, '/')
    .replace(/\\u0026/g, '&')
    .replace(/&amp;/g, '&')
    .replace(/\\u00253A/g, ':')
    .replace(/\\u00252F/g, '/')
    .replace(/\\"/g, '"');
}

/**
 * Extract activity / ugcPost / share ID from any LinkedIn URL
 */
export function extractLinkedInId(inputUrl: string): { id: string | null; type: 'activity' | 'ugcPost' | 'share' } {
  if (!inputUrl) return { id: null, type: 'activity' };
  const clean = inputUrl.trim();

  const ugcMatch = clean.match(/(?:ugcPost|urn:li:ugcPost)[-:]?(\d{15,22})/i);
  if (ugcMatch && ugcMatch[1]) return { id: ugcMatch[1], type: 'ugcPost' };

  const actMatch = clean.match(/(?:activity|urn:li:activity)[-:]?(\d{15,22})/i);
  if (actMatch && actMatch[1]) return { id: actMatch[1], type: 'activity' };

  const shareMatch = clean.match(/(?:share|urn:li:share)[-:]?(\d{15,22})/i);
  if (shareMatch && shareMatch[1]) return { id: shareMatch[1], type: 'share' };

  const anyDigits = clean.match(/(\d{16,22})/);
  if (anyDigits && anyDigits[1]) return { id: anyDigits[1], type: 'activity' };

  return { id: null, type: 'activity' };
}

/**
 * Extract all media slide URLs from LinkedIn HTML (PDF Documents, Multi-Images, Single Image)
 */
function extractLinkedInMediaUrls(html: string): string[] {
  if (!html) return [];
  const unescaped = unescapeLinkedInString(html);
  const rawUrls: string[] = [];

  // 1. Direct Regex match for all media.licdn.com / dms image URLs
  const mediaRegex = /https:\/\/(?:media(?:-exp\d+)?\.licdn\.com|dms\.licdn\.com)\/dms\/image\/[^\s"'<>\\]+/gi;
  const matches = unescaped.match(mediaRegex) || [];

  for (let u of matches) {
    u = u.replace(/[",;()]+$/, '').trim();
    
    const isExcluded =
      u.includes('profile-displayphoto') ||
      u.includes('ghost-avatar') ||
      u.includes('company-logo') ||
      u.includes('mini-profile') ||
      u.includes('shrink_100_100') ||
      u.includes('shrink_50_50') ||
      u.includes('pixel') ||
      u.includes('tracking');

    if (!isExcluded && !rawUrls.includes(u)) {
      rawUrls.push(u);
    }
  }

  // 2. Parse JSON-LD blocks
  try {
    const jsonLdMatches = html.matchAll(/<script\s+type=["']application\/ld\+json["']>([\s\S]*?)<\/script>/gi);
    for (const match of jsonLdMatches) {
      if (match[1]) {
        try {
          const parsed = JSON.parse(match[1]);
          if (parsed.image) {
            const imgList = Array.isArray(parsed.image) ? parsed.image : [parsed.image];
            for (const img of imgList) {
              const imgUrl = typeof img === 'string' ? img : img.url || img.contentUrl;
              if (imgUrl && typeof imgUrl === 'string') {
                const cleanImg = unescapeLinkedInString(imgUrl);
                if (!cleanImg.includes('profile-displayphoto') && !cleanImg.includes('company-logo') && !rawUrls.includes(cleanImg)) {
                  rawUrls.push(cleanImg);
                }
              }
            }
          }
        } catch {}
      }
    }
  } catch {}

  // 3. Parse embedded <code> blocks (where LinkedIn stores document carousel manifests & slide streams)
  try {
    const codeBlocks = html.matchAll(/<code[^>]*>([\s\S]*?)<\/code>/gi);
    for (const block of codeBlocks) {
      if (block[1] && block[1].includes('media.licdn.com')) {
        const codeUrls = unescapeLinkedInString(block[1]).match(/https:\/\/media\.licdn\.com\/dms\/image\/[^\s"',\\]+/gi) || [];
        for (const cu of codeUrls) {
          if (!cu.includes('profile-displayphoto') && !cu.includes('company-logo') && !rawUrls.includes(cu)) {
            rawUrls.push(cu);
          }
        }
      }
    }
  } catch {}

  // 4. OpenGraph fallback
  if (rawUrls.length === 0) {
    const ogMatch = unescaped.match(/<meta\s+property=["']og:image["']\s+content=["'](https?:\/\/[^"'\s]+)["']/i);
    if (ogMatch && ogMatch[1]) {
      const cleanOg = ogMatch[1].replace(/&amp;/g, '&');
      if (!cleanOg.includes('profile-displayphoto') && !cleanOg.includes('company-logo')) {
        rawUrls.push(cleanOg);
      }
    }
  }

  // Check if we have PDF / Document Carousel slides
  const documentSlides = rawUrls.filter((u) => u.includes('feedshare-document-images') || u.includes('document-images') || u.includes('document-pdf-images'));

  if (documentSlides.length > 0) {
    // Group and sort PDF document slides by page index number
    const pageMap = new Map<number, string>();

    for (const docUrl of documentSlides) {
      // LinkedIn document pages typically have /<pageNumber>/ in their path, e.g. /feedshare-document-images_800/0/1723456789
      const pageIndexMatch = docUrl.match(/feedshare-document-(?:pdf-)?images_\d+\/(?:feedshare-document-(?:pdf-)?images_\d+\/)?(\d+)\//i) ||
                             docUrl.match(/\/(\d+)\/\d+\?/) ||
                             docUrl.match(/page[_-]?(\d+)/i);

      const pageNum = pageIndexMatch ? parseInt(pageIndexMatch[1], 10) : pageMap.size;
      
      // If we already have this page, pick higher resolution (e.g. 1080/2048 over 800)
      if (!pageMap.has(pageNum)) {
        pageMap.set(pageNum, docUrl);
      } else {
        const existing = pageMap.get(pageNum)!;
        if ((docUrl.includes('2048') || docUrl.includes('1080') || docUrl.includes('1280')) && !existing.includes('2048')) {
          pageMap.set(pageNum, docUrl);
        }
      }
    }

    // Sort in ascending page order: Page 0 (Slide 1), Page 1 (Slide 2), Page 2 (Slide 3)...
    const sortedPages = Array.from(pageMap.keys()).sort((a, b) => a - b).map((k) => pageMap.get(k)!);
    if (sortedPages.length > 0) {
      return sortedPages;
    }
  }

  // 5. Multi-Image / Single-Image: Group and pick highest resolution for each distinct image
  const grouped: { [key: string]: string[] } = {};
  for (const u of rawUrls) {
    const keyMatch = u.match(/\/dms\/image\/([A-Za-z0-9_-]+)/i);
    const key = keyMatch ? keyMatch[1] : u.split('?')[0];
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(u);
  }

  return Object.values(grouped).map((urls) => {
    return (
      urls.find((u) => u.includes('shrink_1280') || u.includes('shrink_2048') || u.includes('shrink_800')) ||
      urls.find((u) => !u.includes('shrink_100') && !u.includes('shrink_200')) ||
      urls[0]
    );
  });
}

/**
 * -------------------------------------------------------------
 * 2. LINKEDIN POST & DOCUMENT CAROUSEL SCRAPER
 * -------------------------------------------------------------
 */
export async function fetchLinkedInPost(inputUrl: string): Promise<MultiPlatformFetchResult> {
  const cleanUrl = inputUrl.trim();

  // Validate LinkedIn URL (including lnkd.in short URLs)
  if (!cleanUrl.includes('linkedin.com') && !cleanUrl.includes('lnkd.in')) {
    return {
      success: false,
      shortcode: '',
      platform: 'linkedin',
      slideCount: 0,
      slides: [],
      error: 'Please enter a valid LinkedIn post or document URL (e.g. https://www.linkedin.com/posts/... or https://lnkd.in/...).',
      errorType: 'INVALID_URL',
    };
  }

  // Resolve short links (such as lnkd.in/p/... or lnkd.in/...)
  let targetUrl = cleanUrl;
  if (cleanUrl.includes('lnkd.in')) {
    try {
      const redirectRes = await fetch(cleanUrl, {
        method: 'GET',
        redirect: 'follow',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      });
      if (redirectRes.url && (redirectRes.url.includes('linkedin.com') || redirectRes.url.includes('lnkd.in'))) {
        targetUrl = redirectRes.url;
      }
    } catch (err) {
      console.warn('Failed to resolve lnkd.in redirect:', err);
    }
  }

  const { id: extractedId, type: idType } = extractLinkedInId(targetUrl);
  const postId = extractedId || `li_${Date.now()}`;

  let imageUrls: string[] = [];
  let author = 'LinkedIn Author';
  let caption = '';

  const headers = {
    'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
  };

  // Tier 1: Fetch Direct URL with Crawler Headers
  try {
    const res = await fetchWithTimeout(targetUrl, headers);
    if (res.ok) {
      const html = await res.text();

      // Extract Author & Caption
      const authorMatch = html.match(/<meta\s+property=["']og:title["']\s+content=["'](.*?)["']/i) ||
                          html.match(/<title>(.*?)<\/title>/i);
      if (authorMatch && authorMatch[1]) {
        author = authorMatch[1].replace(/ \| LinkedIn$/i, '').trim();
      }

      const descMatch = html.match(/<meta\s+property=["']og:description["']\s+content=["'](.*?)["']/i);
      if (descMatch && descMatch[1]) {
        caption = descMatch[1].trim();
      }

      imageUrls = extractLinkedInMediaUrls(html);
    }
  } catch (err) {
    console.warn('LinkedIn Tier 1 fetch error:', err);
  }

  // Tier 2: Fetch Public Embed Endpoint (Essential for Multi-page PDF Document Carousels)
  if ((imageUrls.length <= 1 || imageUrls.some((u) => u.includes('document-images'))) && extractedId) {
    const embedCandidates = [
      `https://www.linkedin.com/embed/feed/update/urn:li:${idType}:${extractedId}`,
      `https://www.linkedin.com/embed/feed/update/urn:li:activity:${extractedId}`,
      `https://www.linkedin.com/embed/feed/update/urn:li:ugcPost:${extractedId}`,
    ];

    for (const embedUrl of embedCandidates) {
      try {
        const embedRes = await fetchWithTimeout(embedUrl, {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        });
        if (embedRes.ok) {
          const embedHtml = await embedRes.text();
          const embedUrls = extractLinkedInMediaUrls(embedHtml);
          if (embedUrls.length > imageUrls.length) {
            imageUrls = embedUrls;
            if (author === 'LinkedIn Author') {
              const authorMatch = embedHtml.match(/<title>(.*?)<\/title>/i);
              if (authorMatch && authorMatch[1]) {
                author = authorMatch[1].replace(/ \| LinkedIn$/i, '').trim();
              }
            }
          }
        }
      } catch (err) {
        console.warn('LinkedIn Tier 2 embed fetch error:', err);
      }
    }
  }

  // Tier 3: LinkedIn oEmbed Fallback
  if (imageUrls.length === 0) {
    try {
      const oembedUrl = `https://www.linkedin.com/oembed?url=${encodeURIComponent(targetUrl)}&format=json`;
      const oembedRes = await fetchWithTimeout(oembedUrl);
      if (oembedRes.ok) {
        const oembedData = await oembedRes.json();
        if (oembedData.author_name) author = oembedData.author_name;
        if (oembedData.thumbnail_url && !imageUrls.includes(oembedData.thumbnail_url)) {
          imageUrls.push(oembedData.thumbnail_url);
        }
      }
    } catch (err) {
      console.warn('LinkedIn Tier 3 oEmbed error:', err);
    }
  }

  if (imageUrls.length === 0) {
    return {
      success: false,
      shortcode: postId,
      platform: 'linkedin',
      slideCount: 0,
      slides: [],
      error: 'Could not extract images from this LinkedIn post. The post might be private, restricted to logged-in members, or contain no images. You can also upload slide images directly using the upload button below.',
      errorType: 'NO_MEDIA',
    };
  }

  // Process all extracted slides
  try {
    const slides = await Promise.all(
      imageUrls.map((url, idx) => downloadAndProcessSlide(url, idx))
    );

    return {
      success: true,
      shortcode: postId,
      platform: 'linkedin',
      title: `LinkedIn Post by ${author}`,
      author,
      caption,
      slideCount: slides.length,
      slides,
    };
  } catch (err: any) {
    return {
      success: false,
      shortcode: postId,
      platform: 'linkedin',
      slideCount: 0,
      slides: [],
      error: err.message || 'Failed to download and process LinkedIn slide images.',
      errorType: 'UNKNOWN',
    };
  }
}

/**
 * -------------------------------------------------------------
 * 3. THREADS (threads.net) CAROUSEL & POST SCRAPER
 * -------------------------------------------------------------
 */
export async function fetchThreadsPost(inputUrl: string): Promise<MultiPlatformFetchResult> {
  const cleanUrl = inputUrl.trim();
  const shortcodeMatch = cleanUrl.match(/threads\.(?:net|com)\/(?:@[\w.-]+\/post|t)\/([A-Za-z0-9_-]+)/i);

  if (!shortcodeMatch || !shortcodeMatch[1]) {
    return {
      success: false,
      shortcode: '',
      platform: 'threads',
      slideCount: 0,
      slides: [],
      error: 'Please enter a valid Threads post URL (e.g. https://www.threads.net/@username/post/C6abcd...).',
      errorType: 'INVALID_URL',
    };
  }

  const shortcode = shortcodeMatch[1];
  let photoUrls: string[] = [];
  let author = 'Threads User';
  let caption = '';

  // Method 1: Public Page HTML Scraping with Social Media User-Agent
  try {
    const res = await fetchWithTimeout(cleanUrl, {
      'User-Agent': CRAWLER_USER_AGENTS[1], // facebookexternalhit retrieves full meta
      Accept: 'text/html,application/xhtml+xml',
    });

    if (res.ok) {
      const html = await res.text();

      // Title & Author
      const titleMatch = html.match(/<meta\s+property=["']og:title["']\s+content=["'](.*?)["']/i);
      if (titleMatch && titleMatch[1]) {
        author = titleMatch[1];
      }

      const descMatch = html.match(/<meta\s+property=["']og:description["']\s+content=["'](.*?)["']/i);
      if (descMatch && descMatch[1]) {
        caption = descMatch[1];
      }

      // Extract all CDN image links
      const cdnMatches = html.match(/https:\/\/[^"'\s<>]+\.cdninstagram\.com\/[^"'\s<>]+/g) || [];
      for (const imgUrl of cdnMatches) {
        const cleanImg = imgUrl.replace(/&amp;/g, '&');
        if (
          !cleanImg.includes('s150x150') &&
          !cleanImg.includes('profile_pic') &&
          !photoUrls.includes(cleanImg)
        ) {
          photoUrls.push(cleanImg);
        }
      }

      // Fallback to og:image
      if (photoUrls.length === 0) {
        const ogImage = html.match(/<meta\s+property=["']og:image["']\s+content=["'](https?:\/\/[^"']+)["']/i);
        if (ogImage && ogImage[1]) {
          photoUrls.push(ogImage[1].replace(/&amp;/g, '&'));
        }
      }
    }
  } catch (err) {
    console.warn('Threads HTML scrape failed:', err);
  }

  // Method 2: Threads oEmbed Fallback
  if (photoUrls.length === 0) {
    try {
      const oembedUrl = `https://www.threads.net/oembed?url=${encodeURIComponent(cleanUrl)}`;
      const res = await fetchWithTimeout(oembedUrl);
      if (res.ok) {
        const data = await res.json();
        if (data.author_name) author = data.author_name;
        if (data.thumbnail_url && !photoUrls.includes(data.thumbnail_url)) {
          photoUrls.push(data.thumbnail_url);
        }
      }
    } catch (err) {
      console.warn('Threads oEmbed failed:', err);
    }
  }

  if (photoUrls.length === 0) {
    return {
      success: false,
      shortcode,
      platform: 'threads',
      slideCount: 0,
      slides: [],
      error: 'No images or carousel slides found in this Threads post. Please ensure the post contains public images.',
      errorType: 'NO_MEDIA',
    };
  }

  // Process all images
  try {
    const slides = await Promise.all(
      photoUrls.map((url, idx) => downloadAndProcessSlide(url, idx))
    );

    return {
      success: true,
      shortcode,
      platform: 'threads',
      title: `Threads Post by ${author}`,
      author,
      caption,
      slideCount: slides.length,
      slides,
    };
  } catch (err: any) {
    return {
      success: false,
      shortcode,
      platform: 'threads',
      slideCount: 0,
      slides: [],
      error: err.message || 'Failed to download and process Threads slide images.',
      errorType: 'UNKNOWN',
    };
  }
}

/**
 * -------------------------------------------------------------
 * 4. YOUTUBE VIDEO & SHORTS SCRAPER
 * -------------------------------------------------------------
 */
export function extractYouTubeVideoId(inputUrl: string): string | null {
  if (!inputUrl || typeof inputUrl !== 'string') return null;
  const clean = inputUrl.trim();

  // Handle standard watch URLs, shorts, embed, youtu.be
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([A-Za-z0-9_-]{11})/i,
    /youtube\.com\/v\/([A-Za-z0-9_-]{11})/i,
    /youtube\.com\/e\/([A-Za-z0-9_-]{11})/i,
    /youtu\.be\/([A-Za-z0-9_-]{11})/i,
  ];

  for (const pattern of patterns) {
    const match = clean.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  // Direct 11-char ID
  if (/^[A-Za-z0-9_-]{11}$/.test(clean)) {
    return clean;
  }

  return null;
}

export async function fetchYouTubePost(inputUrl: string): Promise<MultiPlatformFetchResult> {
  const videoId = extractYouTubeVideoId(inputUrl);

  if (!videoId) {
    return {
      success: false,
      shortcode: '',
      platform: 'youtube',
      slideCount: 0,
      slides: [],
      error: 'Please enter a valid YouTube video or Shorts URL (e.g. https://www.youtube.com/watch?v=... or https://youtube.com/shorts/...).',
      errorType: 'INVALID_URL',
    };
  }

  let title = `YouTube Video (${videoId})`;
  let author = 'YouTube Creator';
  let caption = '';

  // 1. Fetch metadata via YouTube oEmbed
  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    const res = await fetchWithTimeout(oembedUrl);
    if (res.ok) {
      const data = await res.json();
      if (data.title) title = data.title;
      if (data.author_name) author = data.author_name;
    }
  } catch (err) {
    console.warn('YouTube oEmbed fetch error:', err);
  }

  // 2. Discover available high-res thumbnail and storyboard frame URLs
  const candidateUrls = [
    `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
    `https://i.ytimg.com/vi/${videoId}/sddefault.jpg`,
    `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    `https://i.ytimg.com/vi/${videoId}/1.jpg`,
    `https://i.ytimg.com/vi/${videoId}/2.jpg`,
    `https://i.ytimg.com/vi/${videoId}/3.jpg`,
  ];

  const validImageUrls: string[] = [];

  // Check and collect valid images
  for (const imgUrl of candidateUrls) {
    try {
      const checkRes = await fetch(imgUrl, { method: 'HEAD', cache: 'no-store' });
      if (checkRes.ok && checkRes.headers.get('content-type')?.includes('image')) {
        // Exclude default placeholder 120x90 404 images from YouTube
        const contentLength = Number(checkRes.headers.get('content-length') || 0);
        if (contentLength > 1500 || contentLength === 0) {
          if (!validImageUrls.includes(imgUrl)) {
            validImageUrls.push(imgUrl);
          }
        }
      }
    } catch {
      // ignore
    }
  }

  // Ensure we at least have hqdefault if maxres was unavailable
  if (validImageUrls.length === 0) {
    validImageUrls.push(`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`);
  }

  // 3. Process slides
  try {
    const slides = await Promise.all(
      validImageUrls.map((url, idx) => downloadAndProcessSlide(url, idx))
    );

    return {
      success: true,
      shortcode: videoId,
      platform: 'youtube',
      title,
      author,
      caption: `YouTube Video: ${title} by ${author}`,
      slideCount: slides.length,
      slides,
    };
  } catch (err: any) {
    return {
      success: false,
      shortcode: videoId,
      platform: 'youtube',
      slideCount: 0,
      slides: [],
      error: err.message || 'Failed to download and process YouTube video frames.',
      errorType: 'UNKNOWN',
    };
  }
}

/**
 * -------------------------------------------------------------
 * 5. UNIFIED MULTI-PLATFORM CAROUSEL DISPATCHER
 * -------------------------------------------------------------
 */
export async function fetchMultiPlatformCarousel(inputUrl: string): Promise<MultiPlatformFetchResult> {
  const platform = detectPlatform(inputUrl);

  switch (platform) {
    case 'twitter':
      return fetchTwitterPost(inputUrl);
    case 'linkedin':
      return fetchLinkedInPost(inputUrl);
    case 'threads':
      return fetchThreadsPost(inputUrl);
    case 'youtube':
      return fetchYouTubePost(inputUrl);
    case 'instagram':
    default:
      return fetchInstagramCarousel(inputUrl);
  }
}
