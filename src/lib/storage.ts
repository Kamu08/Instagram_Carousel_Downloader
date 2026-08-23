import { CarouselSlide } from './types';

export interface SavedCarouselHistoryItem {
  id: string;
  timestamp: number;
  title: string;
  slideCount: number;
  thumbnailUrl: string;
  slides: CarouselSlide[];
  sourceUrl?: string;
}

const DB_NAME = 'linkedin_carousel_studio_db';
const DB_VERSION = 1;
const STORE_NAME = 'carousels';
const THEME_STORAGE_KEY = 'linkedin_carousel_theme_v1';

// Open / Upgrade IndexedDB
function openIndexedDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not available in this environment.'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Retrieve all saved carousels from IndexedDB
export async function getSavedCarousels(): Promise<SavedCarouselHistoryItem[]> {
  if (typeof window === 'undefined') return [];

  try {
    const db = await openIndexedDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const items = (request.result || []) as SavedCarouselHistoryItem[];
        // Sort descending by timestamp
        items.sort((a, b) => b.timestamp - a.timestamp);
        resolve(items);
      };

      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error('Failed to load saved carousels from IndexedDB:', err);
    return [];
  }
}

// Save carousel asynchronously into IndexedDB (supports 100s of MBs of image data)
export async function saveCarouselToHistory(
  slides: CarouselSlide[],
  sourceUrl?: string,
  customTitle?: string
): Promise<void> {
  if (typeof window === 'undefined' || !slides || slides.length === 0) return;

  try {
    const db = await openIndexedDB();
    const firstSlide = slides[0];

    const newItem: SavedCarouselHistoryItem = {
      id: `hist_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      timestamp: Date.now(),
      title:
        customTitle ||
        (sourceUrl
          ? `Post: ${sourceUrl.split('/p/')[1]?.split('/')[0] || 'Instagram'}`
          : `${slides.length} Slides Carousel`),
      slideCount: slides.length,
      thumbnailUrl: firstSlide.dataUrl,
      slides,
      sourceUrl,
    };

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);

      store.put(newItem);

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.error('Failed to save carousel to IndexedDB:', err);
  }
}

// Clear all carousels from IndexedDB
export async function clearSavedCarousels(): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    const db = await openIndexedDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.error('Failed to clear IndexedDB:', err);
  }
}

// Delete single carousel from IndexedDB
export async function deleteSavedCarousel(id: string): Promise<SavedCarouselHistoryItem[]> {
  if (typeof window === 'undefined') return [];

  try {
    const db = await openIndexedDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });

    return await getSavedCarousels();
  } catch (err) {
    console.error('Failed to delete item from IndexedDB:', err);
    return [];
  }
}

// Theme storage (lightweight string in localStorage)
export function getSavedTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  try {
    return (localStorage.getItem(THEME_STORAGE_KEY) as 'light' | 'dark') || 'light';
  } catch {
    return 'light';
  }
}

export function saveTheme(theme: 'light' | 'dark'): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // ignore
  }
}
