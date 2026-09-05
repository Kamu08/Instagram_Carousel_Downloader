import { PlatformType } from './types';

/**
 * Pure lightweight client-safe platform detection utility
 */
export function detectPlatform(inputUrl: string): PlatformType | null {
  if (!inputUrl || typeof inputUrl !== 'string') return null;
  const clean = inputUrl.trim().toLowerCase();

  if (clean.includes('instagram.com') || clean.includes('instagr.am')) {
    return 'instagram';
  }
  if (clean.includes('linkedin.com')) {
    return 'linkedin';
  }
  if (clean.includes('twitter.com') || clean.includes('x.com')) {
    return 'twitter';
  }
  if (clean.includes('threads.net') || clean.includes('threads.com')) {
    return 'threads';
  }

  return null;
}
