'use client';

import React, { useEffect, useState } from 'react';
import {
  X,
  History,
  Trash2,
  Clock,
  Loader2,
} from 'lucide-react';
import {
  SavedCarouselHistoryItem,
  getSavedCarousels,
  deleteSavedCarousel,
  clearSavedCarousels,
} from '@/lib/storage';
import { CarouselSlide } from '@/lib/types';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onRestoreCarousel: (slides: CarouselSlide[]) => void;
}

export function HistoryDrawer({
  isOpen,
  onClose,
  onRestoreCarousel,
}: HistoryDrawerProps) {
  const [historyItems, setHistoryItems] = useState<SavedCarouselHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      getSavedCarousels()
        .then((items) => setHistoryItems(items))
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const updated = await deleteSavedCarousel(id);
      setHistoryItems(updated);
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearAll = async () => {
    if (confirm('Clear all saved carousel history?')) {
      try {
        await clearSavedCarousels();
        setHistoryItems([]);
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#1D1815]/80 backdrop-blur-xs flex justify-end animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative max-w-md w-full h-full bg-[var(--bg-card)] border-l-2 border-[var(--border-ink)] shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 bg-[var(--bg-page)] border-b-2 border-[var(--border-ink)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FDE047] border-2 border-[#1D1815] shadow-[2px_2px_0px_#1D1815] flex items-center justify-center text-[#1D1815]">
              <History className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="font-display font-black text-lg text-[var(--text-main)]">
                Recent Carousels
              </h3>
              <p className="font-hand text-base text-[var(--text-muted)] font-bold -mt-1">
                Saved in local IndexedDB database
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl border border-[var(--border-ink)] text-[var(--text-main)] hover:bg-[#F5A3B3] hover:text-[#1D1815] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* Content List */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4">
          {isLoading ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6">
              <Loader2 className="w-8 h-8 animate-spin text-[var(--text-muted)] mb-2" />
              <p className="font-display font-bold text-xs text-[var(--text-muted)]">
                Loading saved carousels...
              </p>
            </div>
          ) : historyItems.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-[var(--border-ink)]/30 rounded-3xl">
              <History className="w-10 h-10 text-[var(--text-muted)] mb-2" />
              <p className="font-display font-bold text-sm text-[var(--text-main)]">
                No Saved Carousels Yet
              </p>
              <p className="font-hand text-base text-[var(--text-muted)] font-bold mt-1">
                Carousels you process will appear here for fast re-access!
              </p>
            </div>
          ) : (
            historyItems.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  onRestoreCarousel(item.slides);
                  onClose();
                }}
                className="group p-3.5 bg-[var(--bg-card)] border-2 border-[var(--border-ink)] rounded-2xl shadow-[3px_3px_0px_var(--shadow-ink)] hover:shadow-[1px_1px_0px_var(--shadow-ink)] hover:translate-x-[1px] hover:translate-y-[1px] cursor-pointer transition-all flex items-center gap-3.5"
              >
                {/* Thumbnail */}
                <div className="w-16 h-20 rounded-xl bg-[#E5E0D4] dark:bg-[#1C1916] border border-[var(--border-ink)] overflow-hidden shrink-0 flex items-center justify-center">
                  <img
                    src={item.thumbnailUrl}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="font-display font-extrabold text-sm text-[var(--text-main)] truncate">
                    {item.title}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-marker text-xs px-2 py-0.5 rounded-lg bg-[#A7F3D0] text-[#1D1815] border border-[#1D1815]">
                      {item.slideCount} Slides
                    </span>
                    <span className="text-[11px] font-mono text-[var(--text-muted)] flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(item.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => handleDelete(item.id, e)}
                  className="p-2 rounded-xl text-[var(--text-muted)] hover:text-[#F43F5E] hover:bg-[#F5A3B3]/40 transition-colors"
                  title="Remove from history"
                >
                  <Trash2 className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {!isLoading && historyItems.length > 0 && (
          <div className="p-4 bg-[var(--bg-page)] border-t-2 border-[var(--border-ink)] flex justify-between items-center">
            <span className="font-mono text-xs font-bold text-[var(--text-main)]">
              {historyItems.length} items saved
            </span>
            <button
              type="button"
              onClick={handleClearAll}
              className="text-xs font-display font-bold text-[#F43F5E] hover:underline cursor-pointer"
            >
              Clear All History
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
