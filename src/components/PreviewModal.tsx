'use client';

import React, { useEffect } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Download,
  CheckCircle2,
} from 'lucide-react';
import { CarouselSlide } from '@/lib/types';

interface PreviewModalProps {
  slides: CarouselSlide[];
  selectedSlide: CarouselSlide | null;
  onClose: () => void;
  onSelectSlide: (slide: CarouselSlide) => void;
  onDownloadSingle: (slide: CarouselSlide, index: number) => void;
}

export function PreviewModal({
  slides,
  selectedSlide,
  onClose,
  onSelectSlide,
  onDownloadSingle,
}: PreviewModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedSlide) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') {
        const currentIndex = slides.findIndex((s) => s.id === selectedSlide.id);
        if (currentIndex > 0) onSelectSlide(slides[currentIndex - 1]);
      }
      if (e.key === 'ArrowRight') {
        const currentIndex = slides.findIndex((s) => s.id === selectedSlide.id);
        if (currentIndex < slides.length - 1) onSelectSlide(slides[currentIndex + 1]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedSlide, slides, onClose, onSelectSlide]);

  if (!selectedSlide) return null;

  const currentIndex = slides.findIndex((s) => s.id === selectedSlide.id);
  const pageNumber = currentIndex + 1;
  const slideFilename = `carousel-${String(pageNumber).padStart(2, '0')}.png`;

  return (
    <div
      className="fixed inset-0 z-50 bg-[#1D1815]/80 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative max-w-5xl w-full max-h-[94vh] bg-[var(--bg-card)] border-2 border-[var(--border-ink)] rounded-3xl flex flex-col overflow-hidden shadow-[8px_8px_0px_var(--shadow-ink)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-[var(--bg-page)] border-b-2 border-[var(--border-ink)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-xl bg-[#F5A3B3] text-[#1D1815] border border-[#1D1815] shadow-[1.5px_1.5px_0px_#1D1815] font-display font-black text-xs tracking-wide">
              PAGE {String(pageNumber).padStart(2, '0')} OF {String(slides.length).padStart(2, '0')}
            </span>
            <span className="font-mono text-sm font-bold text-[var(--text-main)]">
              {slideFilename}
            </span>
            <span className="hidden sm:inline-flex text-xs px-2.5 py-1 rounded-xl bg-[#A7F3D0] text-[#1D1815] font-black items-center gap-1.5 border border-[#1D1815]">
              <CheckCircle2 className="w-3.5 h-3.5 stroke-[3] text-[#10B981]" />
              Lossless PNG Master
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onDownloadSingle(selectedSlide, currentIndex)}
              className="px-4 py-2 rounded-xl bg-[#FDE047] hover:bg-[#FACC15] border-2 border-[#1D1815] shadow-[2px_2px_0px_#1D1815] text-[#1D1815] text-xs font-display font-black flex items-center gap-2 transition-all cursor-pointer hover:translate-x-[1px] hover:translate-y-[1px]"
            >
              <Download className="w-4 h-4 stroke-[2.5]" />
              <span>Save Slide PNG</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl border border-[var(--border-ink)] text-[var(--text-main)] hover:bg-[#F5A3B3] hover:text-[#1D1815] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* Content Area with Canvas Checkerboard */}
        <div className="relative flex-1 canvas-checkerboard flex items-center justify-center p-4 sm:p-8 min-h-[460px] overflow-hidden">
          <img
            src={selectedSlide.dataUrl}
            alt={`Slide ${pageNumber}`}
            className="max-h-[66vh] max-w-full object-contain rounded-2xl border-2 border-[var(--border-ink)] shadow-[6px_6px_0px_var(--shadow-ink)]"
          />

          {/* Nav Buttons */}
          {currentIndex > 0 && (
            <button
              onClick={() => onSelectSlide(slides[currentIndex - 1])}
              className="absolute left-5 top-1/2 -translate-y-1/2 p-3.5 rounded-2xl bg-[var(--bg-card)] hover:bg-[#FDE047] hover:text-[#1D1815] text-[var(--text-main)] border-2 border-[var(--border-ink)] shadow-[4px_4px_0px_var(--shadow-ink)] transition-all hover:scale-110 cursor-pointer"
              title="Previous slide (Left Arrow)"
            >
              <ChevronLeft className="w-7 h-7 stroke-[3]" />
            </button>
          )}

          {currentIndex < slides.length - 1 && (
            <button
              onClick={() => onSelectSlide(slides[currentIndex + 1])}
              className="absolute right-5 top-1/2 -translate-y-1/2 p-3.5 rounded-2xl bg-[var(--bg-card)] hover:bg-[#FDE047] hover:text-[#1D1815] text-[var(--text-main)] border-2 border-[var(--border-ink)] shadow-[4px_4px_0px_var(--shadow-ink)] transition-all hover:scale-110 cursor-pointer"
              title="Next slide (Right Arrow)"
            >
              <ChevronRight className="w-7 h-7 stroke-[3]" />
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[var(--bg-page)] border-t-2 border-[var(--border-ink)] flex flex-wrap items-center justify-between gap-4 text-xs font-bold text-[var(--text-main)]">
          <div className="flex flex-wrap items-center gap-4 font-mono">
            <span>Dimensions: <strong>{selectedSlide.width} × {selectedSlide.height}</strong></span>
            <span>•</span>
            <span>Aspect Ratio: <strong>{selectedSlide.aspectRatio}</strong></span>
            <span>•</span>
            <span>File Size: <strong>{Math.round(selectedSlide.sizeBytes / 1024)} KB</strong></span>
          </div>

          <div className="font-hand text-base text-[var(--text-muted)] font-bold">
            <span>Navigate with Left ← / Right → keys</span>
          </div>
        </div>
      </div>
    </div>
  );
}
