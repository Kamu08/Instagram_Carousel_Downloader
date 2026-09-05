export interface CarouselSlide {
  id: string;
  originalIndex: number;
  currentIndex: number;
  filename: string;
  originalUrl?: string;
  originalFormat: string;
  dataUrl: string; // Base64 data URL for preview and download
  cleanDataUrl?: string; // Backup of clean unwatermarked image
  isWatermarked?: boolean;
  width: number;
  height: number;
  aspectRatio: string;
  sizeBytes: number;
  isProcessing?: boolean;
}

export type LinkedInPreset = 'original' | 'portrait-1080-1350' | 'square-1080-1080' | 'custom';
export type ResizeFitMode = 'contain' | 'cover'; // contain = fit with padding, cover = fill/crop
export type BackgroundMode = 'white' | 'black' | 'transparent' | 'blur';

export interface LinkedInOptions {
  preset: LinkedInPreset;
  customWidth?: number;
  customHeight?: number;
  fitMode: ResizeFitMode;
  backgroundMode: BackgroundMode;
  backgroundColorHex?: string;
}

export type PlatformType = 'instagram' | 'linkedin' | 'twitter' | 'threads';

export interface InstagramFetchResult {
  success: boolean;
  shortcode: string;
  platform?: PlatformType;
  title?: string;
  author?: string;
  authorAvatar?: string;
  caption?: string;
  slideCount: number;
  slides: CarouselSlide[];
  error?: string;
  errorType?: 'INVALID_URL' | 'PRIVATE_POST' | 'POST_NOT_FOUND' | 'NO_MEDIA' | 'RATE_LIMITED' | 'NETWORK_ERROR' | 'UNKNOWN';
}

export type MultiPlatformFetchResult = InstagramFetchResult;

export interface ProcessingProgressStep {
  id: string;
  label: string;
  status: 'pending' | 'in-progress' | 'completed' | 'error';
  detail?: string;
}

export * from './collab-types';

