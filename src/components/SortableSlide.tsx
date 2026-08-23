'use client';

import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  GripVertical,
  Download,
  Trash2,
  Maximize2,
  CheckCircle2,
  RotateCw,
  FlipHorizontal,
  Loader2,
} from 'lucide-react';
import { CarouselSlide } from '@/lib/types';
import { rotateImage, flipImageHorizontal } from '@/lib/slide-tools';

interface SortableSlideProps {
  slide: CarouselSlide;
  index: number;
  onRemove: (id: string) => void;
  onPreview: (slide: CarouselSlide) => void;
  onDownloadSingle: (slide: CarouselSlide, index: number) => void;
  onUpdateSlide: (updated: CarouselSlide) => void;
}

export function SortableSlide({
  slide,
  index,
  onRemove,
  onPreview,
  onDownloadSingle,
  onUpdateSlide,
}: SortableSlideProps) {
  const [isTransforming, setIsTransforming] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: slide.id,
    transition: {
      duration: 250,
      easing: 'cubic-bezier(0.2, 0, 0, 1)',
    },
  });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
    zIndex: isDragging ? 0 : 1,
  };

  const pageNumber = index + 1;
  const slideFilename = `carousel-${String(pageNumber).padStart(2, '0')}.png`;
  const sizeKb = Math.round(slide.sizeBytes / 1024);

  const handleRotate = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isTransforming) return;
    setIsTransforming(true);
    try {
      const res = await rotateImage(slide.dataUrl, 90);
      onUpdateSlide({
        ...slide,
        dataUrl: res.dataUrl,
        width: res.width,
        height: res.height,
        sizeBytes: res.sizeBytes,
        aspectRatio: `${res.width}:${res.height}`,
      });
    } catch (err) {
      console.error('Rotate error:', err);
    } finally {
      setIsTransforming(false);
    }
  };

  const handleFlip = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isTransforming) return;
    setIsTransforming(true);
    try {
      const res = await flipImageHorizontal(slide.dataUrl);
      onUpdateSlide({
        ...slide,
        dataUrl: res.dataUrl,
        sizeBytes: res.sizeBytes,
      });
    } catch (err) {
      console.error('Flip error:', err);
    } finally {
      setIsTransforming(false);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative bg-[var(--bg-card)] border-2 border-[var(--border-ink)] rounded-3xl overflow-hidden shadow-[4px_4px_0px_var(--shadow-ink)] flex flex-col will-change-transform ${
        isDragging
          ? 'border-dashed opacity-30 shadow-none'
          : 'hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_var(--shadow-ink)]'
      }`}
    >
      {/* Header Bar */}
      <div className="px-4 py-3 bg-[var(--bg-page)] border-b-2 border-[var(--border-ink)] flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {/* Drag Handle */}
          <button
            {...attributes}
            {...listeners}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[#FDE047] dark:hover:text-[#1D1815] transition-colors cursor-grab active:cursor-grabbing shrink-0 touch-none select-none"
            title="Drag to reorder"
            aria-label="Drag to reorder slide"
          >
            <GripVertical className="w-4 h-4 stroke-[2.5]" />
          </button>

          {/* Page Badge */}
          <span className="font-display font-black text-xs px-2.5 py-0.5 rounded-lg bg-[#F5A3B3] text-[#1D1815] border border-[#1D1815] shadow-[1px_1px_0px_#1D1815] shrink-0">
            P{String(pageNumber).padStart(2, '0')}
          </span>

          {/* Sequential Filename */}
          <span className="font-mono text-xs font-bold text-[var(--text-main)] truncate">
            {slideFilename}
          </span>
        </div>

        {/* Quick Tools: Rotate, Flip, Delete */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={handleRotate}
            disabled={isTransforming}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[#1D1815] hover:bg-[#FDE047] border border-transparent hover:border-[#1D1815] transition-all cursor-pointer"
            title="Rotate 90° clockwise"
          >
            {isTransforming ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCw className="w-3.5 h-3.5 stroke-[2.5]" />}
          </button>

          <button
            type="button"
            onClick={handleFlip}
            disabled={isTransforming}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[#1D1815] hover:bg-[#93C5FD] border border-transparent hover:border-[#1D1815] transition-all cursor-pointer"
            title="Flip horizontally"
          >
            <FlipHorizontal className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemove(slide.id);
            }}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[#F43F5E] hover:bg-[#F5A3B3]/50 transition-colors cursor-pointer"
            title="Remove slide"
            aria-label="Remove slide"
          >
            <Trash2 className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>
        </div>
      </div>

      {/* Image Preview Area with Checkerboard canvas (Zero Blur, Crisp Text & Graphics) */}
      <div
        onClick={() => onPreview(slide)}
        className="relative aspect-[4/5] canvas-checkerboard flex items-center justify-center overflow-hidden cursor-pointer group/img"
      >
        <img
          src={slide.dataUrl}
          alt={`Slide ${pageNumber}`}
          className="w-full h-full object-contain p-2 pointer-events-none"
          loading="lazy"
          draggable={false}
        />

        {/* Crisp Clean Hover Overlay without Blur Filter */}
        <div className="absolute inset-0 bg-[#1D1815]/30 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-3">
          <span className="px-4 py-2.5 rounded-2xl bg-[var(--bg-card)] border-2 border-[var(--border-ink)] shadow-[3px_3px_0px_var(--shadow-ink)] font-display font-black text-xs text-[var(--text-main)] flex items-center gap-2">
            <Maximize2 className="w-4 h-4 text-[#F43F5E] stroke-[2.5]" />
            <span>Inspect Slide (Full Size)</span>
          </span>
        </div>

        {/* Converted Format Pill */}
        <div className="absolute bottom-3 left-3 px-3 py-1 rounded-xl bg-[var(--bg-card)] border-2 border-[var(--border-ink)] shadow-[2px_2px_0px_var(--shadow-ink)] text-xs font-black text-[var(--text-main)] tracking-wide flex items-center gap-1.5 pointer-events-none">
          <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981] stroke-[3]" />
          <span>{slide.originalFormat} → Master PNG</span>
        </div>
      </div>

      {/* Footer Info & Single Download Action */}
      <div className="p-4 bg-[var(--bg-card)] flex items-center justify-between gap-2 text-xs border-t-2 border-[var(--border-ink)]">
        <div className="flex flex-col text-[var(--text-main)]">
          <span className="font-display font-black text-xs sm:text-sm text-[var(--text-main)]">
            {slide.width} × {slide.height}
          </span>
          <span className="font-mono text-[11px] text-[var(--text-muted)] font-bold mt-0.5">
            {slide.aspectRatio} • {sizeKb} KB
          </span>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onDownloadSingle(slide, index);
          }}
          className="px-4 py-2.5 rounded-xl bg-[#FDE047] hover:bg-[#FACC15] border-2 border-[#1D1815] shadow-[2px_2px_0px_#1D1815] hover:shadow-[1px_1px_0px_#1D1815] hover:translate-x-[1px] hover:translate-y-[1px] font-display font-black text-xs text-[#1D1815] transition-all flex items-center gap-1.5 cursor-pointer active:translate-x-[2px] active:translate-y-[2px]"
          title={`Download ${slideFilename}`}
        >
          <Download className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Save PNG</span>
        </button>
      </div>
    </div>
  );
}

// Static Overlay Card for DragOverlay
export function DragOverlaySlideCard({
  slide,
  index,
}: {
  slide: CarouselSlide;
  index: number;
}) {
  const pageNumber = index + 1;
  const slideFilename = `carousel-${String(pageNumber).padStart(2, '0')}.png`;
  const sizeKb = Math.round(slide.sizeBytes / 1024);

  return (
    <div className="w-72 sm:w-80 bg-[var(--bg-card)] border-2 border-[var(--border-ink)] rounded-3xl overflow-hidden shadow-[10px_10px_0px_var(--shadow-ink)] flex flex-col rotate-2 scale-105 cursor-grabbing pointer-events-none select-none">
      <div className="px-4 py-3 bg-[var(--bg-page)] border-b-2 border-[var(--border-ink)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-[#FDE047] text-[#1D1815]">
            <GripVertical className="w-4 h-4 stroke-[2.5]" />
          </div>
          <span className="font-display font-black text-xs px-2.5 py-0.5 rounded-lg bg-[#F5A3B3] text-[#1D1815] border border-[#1D1815]">
            P{String(pageNumber).padStart(2, '0')}
          </span>
          <span className="font-mono text-xs font-bold text-[var(--text-main)]">
            {slideFilename}
          </span>
        </div>
      </div>

      <div className="relative aspect-[4/5] canvas-checkerboard flex items-center justify-center overflow-hidden">
        <img
          src={slide.dataUrl}
          alt={`Slide ${pageNumber}`}
          className="w-full h-full object-contain p-2"
        />
      </div>

      <div className="p-4 bg-[var(--bg-card)] flex items-center justify-between text-xs border-t-2 border-[var(--border-ink)]">
        <span className="font-display font-black text-sm text-[var(--text-main)]">
          {slide.width} × {slide.height}
        </span>
        <span className="font-mono text-xs text-[var(--text-muted)] font-bold">
          {slide.aspectRatio} • {sizeKb} KB
        </span>
      </div>
    </div>
  );
}
