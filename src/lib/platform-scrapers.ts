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
 * -------------------------------------------------------------
 * 2. LINKEDIN POST & DOCUMENT CAROUSEL SCRAPER
 * -------------------------------------------------------------
 */
export async function fetchLinkedInPost(inputUrl: string): Promise<MultiPlatformFetchResult> {
  const cleanUrl = inputUrl.trim();

  // Validate LinkedIn URL
  if (!cleanUrl.includes('linkedin.com/')) {
    return {
      success: false,
      shortcode: '',
      platform: 'linkedin',
      slideCount: 0,
      slides: [],
      error: 'Please enter a valid LinkedIn post or document URL (e.g. https://www.linkedin.com/posts/... or https://www.linkedin.com/feed/update/...).',
      errorType: 'INVALID_URL',
    };
  }

  let imageUrls: string[] = [];
  let author = 'LinkedIn Author';
  let caption = '';

  // Extract ID or slug
  const idMatch = cleanUrl.match(/(?:activity|ugcPost|share)[-:]?(\d+)/i) || cleanUrl.match(/posts\/([A-Za-z0-9_-]+)/i);
  const postId = idMatch ? idMatch[1] : `li_${Date.now()}`;

  // Fetch Public LinkedIn Post & Embed HTML
  try {
    const headers = {
      'User-Agent': CRAWLER_USER_AGENTS[1], // Facebook/Googlebot headers unlock public post rendering
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    };

    // Try fetching the original post
    const res = await fetchWithTimeout(cleanUrl, headers);
    if (res.ok) {
      const html = await res.text();

      // 1. Author and Title extraction
      const authorMatch = html.match(/<meta\s+property=["']og:title["']\s+content=["'](.*?)["']/i) ||
                          html.match(/<title>(.*?)<\/title>/i);
      if (authorMatch && authorMatch[1]) {
        author = authorMatch[1].replace(/ \| LinkedIn$/i, '').trim();
      }

      const descMatch = html.match(/<meta\s+property=["']og:description["']\s+content=["'](.*?)["']/i);
      if (descMatch && descMatch[1]) {
        caption = descMatch[1].trim();
      }

      // 2. Extract Document / Multi-image slide URLs (media.licdn.com or dms.licdn.com)
      const dmsMatches = html.match(/https:\/\/media\.licdn\.com\/dms\/image\/[A-Za-z0-9_.-]+(?:\?[^"'\s<>]+)?/g) || [];
      const dataUrls = html.match(/data-delayed-url=["'](https:\/\/media\.licdn\.com\/[^"']+)["']/g) || [];

      for (const raw of [...dmsMatches, ...dataUrls]) {
        const cleanImgUrl = raw.replace(/^data-delayed-url=["']/, '').replace(/["']$/, '');
        // Exclude small profile avatars / icons
        if (
          !cleanImgUrl.includes('profile-displayphoto') &&
          !cleanImgUrl.includes('ghost-avatar') &&
          !cleanImgUrl.includes('company-logo') &&
          !imageUrls.includes(cleanImgUrl)
        ) {
          imageUrls.push(cleanImgUrl);
        }
      }

      // 3. Fallback to OpenGraph primary image if no gallery extracted
      if (imageUrls.length === 0) {
        const ogImage = html.match(/<meta\s+property=["']og:image["']\s+content=["'](https?:\/\/[^"']+)["']/i);
        if (ogImage && ogImage[1]) {
          imageUrls.push(ogImage[1]);
        }
      }
    }
  } catch (err) {
    console.warn('LinkedIn direct fetch error:', err);
  }

  // If still no images found, try fetching the embed route if activity ID exists
  if (imageUrls.length === 0 && idMatch && idMatch[1]) {
    try {
      const embedUrl = `https://www.linkedin.com/embed/feed/update/urn:li:activity:${idMatch[1]}`;
      const embedRes = await fetchWithTimeout(embedUrl, {
        'User-Agent': CRAWLER_USER_AGENTS[0],
      });
      if (embedRes.ok) {
        const embedHtml = await embedRes.text();
        const matches = embedHtml.match(/https:\/\/media\.licdn\.com\/dms\/image\/[A-Za-z0-9_.-]+(?:\?[^"'\s<>]+)?/g) || [];
        for (const img of matches) {
          if (!imageUrls.includes(img) && !img.includes('profile-displayphoto')) {
            imageUrls.push(img);
          }
        }
      }
    } catch (err) {
      console.warn('LinkedIn embed fetch error:', err);
    }
  }

  if (imageUrls.length === 0) {
    return {
      success: false,
      shortcode: postId,
      platform: 'linkedin',
      slideCount: 0,
      slides: [],
      error: 'Could not extract images from this LinkedIn post. The post might be private, restricted to logged-in members, or contain no images. You can also upload slide images directly.',
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
 * 4. UNIFIED MULTI-PLATFORM CAROUSEL DISPATCHER
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
    case 'instagram':
    default:
      return fetchInstagramCarousel(inputUrl);
  }
}
