'use client';

import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverlay,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableSlide, DragOverlaySlideCard } from './SortableSlide';
import { CarouselSlide } from '@/lib/types';
import {
  Layers,
  MoveHorizontal,
  PlusCircle,
  Wand2,
  Sparkles,
  Stamp,
  Trash2,
  SlidersHorizontal,
  CheckCircle2,
} from 'lucide-react';

interface CarouselGridProps {
  slides: CarouselSlide[];
  onSlidesChange: (slides: CarouselSlide[]) => void;
  onRemoveSlide: (id: string) => void;
  onPreviewSlide: (slide: CarouselSlide) => void;
  onDownloadSingle: (slide: CarouselSlide, index: number) => void;
  onUpdateSlide: (updated: CarouselSlide) => void;
  onOpenCtaModal: () => void;
  onOpenCoverModal: () => void;
  onOpenCaptionModal: () => void;
  onOpenWatermarkModal: () => void;
  onRemoveWatermark: () => void;
  skipFirstSlide: boolean;
  setSkipFirstSlide: (val: boolean) => void;
  skipLastSlide: boolean;
  setSkipLastSlide: (val: boolean) => void;
}

export function CarouselGrid({
  slides,
  onSlidesChange,
  onRemoveSlide,
  onPreviewSlide,
  onDownloadSingle,
  onUpdateSlide,
  onOpenCtaModal,
  onOpenCoverModal,
  onOpenCaptionModal,
  onOpenWatermarkModal,
  onRemoveWatermark,
  skipFirstSlide,
  setSkipFirstSlide,
  skipLastSlide,
  setSkipLastSlide,
}: CarouselGridProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const isWatermarked = slides.some((s) => s.isWatermarked);

  const exportCount = slides.filter((_, idx) => {
    if (idx === 0 && skipFirstSlide) return false;
    if (idx === slides.length - 1 && skipLastSlide) return false;
    return true;
  }).length;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      const oldIndex = slides.findIndex((s) => s.id === active.id);
      const newIndex = slides.findIndex((s) => s.id === over.id);

      const reordered = arrayMove(slides, oldIndex, newIndex).map((s, idx) => ({
        ...s,
        currentIndex: idx,
      }));

      onSlidesChange(reordered);
    }
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  if (slides.length === 0) {
    return null;
  }

  const activeSlide = activeId ? slides.find((s) => s.id === activeId) : null;
  const activeIndex = activeSlide ? slides.findIndex((s) => s.id === activeId) : 0;

  return (
    <div className="w-full space-y-6">
      {/* 1. Skip First / Last Slide Export Controls Quick-Bar */}
      {slides.length > 1 && (
        <div className="p-4 sm:p-5 rounded-3xl bg-[var(--bg-card)] border-2 border-[var(--border-ink)] shadow-[4px_4px_0px_var(--shadow-ink)] flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-center md:text-left">
            <div className="w-10 h-10 rounded-2xl bg-[#93C5FD] border-2 border-[#1D1815] shadow-[2px_2px_0px_#1D1815] flex items-center justify-center text-[#1D1815] shrink-0">
              <SlidersHorizontal className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                <h3 className="font-display font-black text-sm sm:text-base text-[var(--text-main)]">
                  Export Filters &amp; Slide Selection
                </h3>
                <span className="font-marker text-xs px-2.5 py-0.5 rounded-full bg-[#FDE047] text-[#1D1815] border border-[#1D1815]">
                  Exporting {exportCount} of {slides.length} slides
                </span>
              </div>
              <p className="font-hand text-xs sm:text-sm text-[var(--text-muted)] font-bold">
                Toggle to exclude Cover or Outro slide from your LinkedIn PDF and ZIP downloads
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            {/* Skip Slide 1 Toggle */}
            <label
              className={`px-3.5 py-2 rounded-xl border-2 border-[var(--border-ink)] flex items-center gap-2 cursor-pointer transition-all select-none ${
                skipFirstSlide
                  ? 'bg-[#F43F5E] text-white shadow-[2px_2px_0px_var(--shadow-ink)]'
                  : 'bg-[var(--bg-page)] text-[var(--text-main)] hover:bg-[var(--bg-card)]'
              }`}
            >
              <input
                type="checkbox"
                checked={skipFirstSlide}
                onChange={(e) => setSkipFirstSlide(e.target.checked)}
                className="w-4 h-4 accent-[#1D1815] cursor-pointer"
              />
              <span className="font-display font-black text-xs">
                {skipFirstSlide ? '🚫 Skipping Slide 1 (Cover)' : '✓ Include Slide 1 (Cover)'}
              </span>
            </label>

            {/* Skip Last Slide Toggle */}
            <label
              className={`px-3.5 py-2 rounded-xl border-2 border-[var(--border-ink)] flex items-center gap-2 cursor-pointer transition-all select-none ${
                skipLastSlide
                  ? 'bg-[#F43F5E] text-white shadow-[2px_2px_0px_var(--shadow-ink)]'
                  : 'bg-[var(--bg-page)] text-[var(--text-main)] hover:bg-[var(--bg-card)]'
              }`}
            >
              <input
                type="checkbox"
                checked={skipLastSlide}
                onChange={(e) => setSkipLastSlide(e.target.checked)}
                className="w-4 h-4 accent-[#1D1815] cursor-pointer"
              />
              <span className="font-display font-black text-xs">
                {skipLastSlide ? '🚫 Skipping Last Slide (Outro)' : '✓ Include Last Slide (Outro)'}
              </span>
            </label>
          </div>
        </div>
      )}

      {/* 2. Dedicated Watermark & Branding Quick-Action Banner */}
      <div className="p-4 sm:p-5 rounded-3xl bg-[var(--bg-card)] border-2 border-[var(--border-ink)] shadow-[4px_4px_0px_var(--shadow-ink)] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 text-center sm:text-left">
          <div
            className={`w-12 h-12 rounded-2xl border-2 border-[#1D1815] shadow-[2px_2px_0px_#1D1815] flex items-center justify-center text-[#1D1815] shrink-0 ${
              isWatermarked ? 'bg-[#A7F3D0]' : 'bg-[#FDE047]'
            }`}
          >
            <Stamp className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h3 className="font-display font-black text-base sm:text-lg text-[var(--text-main)]">
                {isWatermarked
                  ? '✓ Watermark Active on Carousel'
                  : 'Watermark: "Kamal Sharma" (6 Positions & 8 Styles)'}
              </h3>
              <span
                className={`font-marker text-xs px-2.5 py-0.5 rounded-full text-[#1D1815] border border-[#1D1815] ${
                  isWatermarked ? 'bg-[#A7F3D0]' : 'bg-[#FDE047]'
                }`}
              >
                {isWatermarked ? 'Stamped ✨' : 'Customizable ✨'}
              </span>
            </div>
            <p className="font-hand text-sm sm:text-base text-[var(--text-muted)] font-bold -mt-0.5">
              {isWatermarked
                ? 'Watermarks are stamped into all slides. You can edit settings or remove them anytime.'
                : 'Apply watermark stamp to all slides with separate toggles for Cover (First) & Outro (Last)'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-center sm:justify-end">
          {isWatermarked ? (
            <>
              <button
                type="button"
                onClick={onRemoveWatermark}
                className="px-4 py-3 rounded-2xl border-2 border-[#F43F5E] bg-[#F5A3B3]/40 hover:bg-[#F5A3B3] text-[#F43F5E] hover:text-[#1D1815] font-display font-black text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer transition-all shadow-[2px_2px_0px_var(--shadow-ink)]"
              >
                <Trash2 className="w-4 h-4 stroke-[2.5]" />
                <span>Remove Watermark</span>
              </button>

              <button
                type="button"
                onClick={onOpenWatermarkModal}
                className="px-5 py-3 rounded-2xl bg-[#FDE047] hover:bg-[#FACC15] sketch-btn text-[#1D1815] font-display font-black text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
              >
                <Stamp className="w-4 h-4 stroke-[2.5]" />
                <span>Edit Watermark</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onOpenWatermarkModal}
              className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-[#FDE047] hover:bg-[#FACC15] sketch-btn text-[#1D1815] font-display font-black text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
            >
              <Stamp className="w-4 h-4 stroke-[2.5]" />
              <span>Add Watermark &amp; Branding</span>
            </button>
          )}
        </div>
      </div>

      {/* 3. Header bar above grid */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b-2 border-dashed border-[var(--border-ink)]/20">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#93C5FD] border-2 border-[#1D1815] shadow-[3px_3px_0px_#1D1815] flex items-center justify-center text-[#1D1815] shrink-0">
            <Layers className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="font-display font-black text-2xl sm:text-3xl text-[var(--text-main)] tracking-tight">
                Your Carousel Slides
              </h2>
              <span className="font-marker text-sm px-3 py-0.5 rounded-full bg-[#F5A3B3] text-[#1D1815] border border-[#1D1815] shadow-[1.5px_1.5px_0px_#1D1815] rotate-1">
                {slides.length} {slides.length === 1 ? 'Slide' : 'Slides'} Ready!
              </span>
            </div>
            <p className="font-hand text-lg text-[var(--text-muted)] font-bold -mt-0.5">
              Drag cards to reorder • Rotate &amp; edit slides
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* AI Caption Generator Button */}
          <button
            type="button"
            onClick={onOpenCaptionModal}
            className="px-3.5 py-2.5 rounded-xl bg-[#A7F3D0] hover:bg-[#6EE7B7] border-2 border-[#1D1815] shadow-[2px_2px_0px_#1D1815] hover:shadow-[1px_1px_0px_#1D1815] hover:translate-x-[1px] hover:translate-y-[1px] font-display font-black text-xs text-[#1D1815] flex items-center gap-1.5 cursor-pointer transition-all active:translate-x-[2px] active:translate-y-[2px]"
          >
            <Sparkles className="w-4 h-4 stroke-[2.5]" />
            <span>AI Caption</span>
          </button>

          {/* Generate Custom Cover Slide (Viral Sticker Style) */}
          <button
            type="button"
            onClick={onOpenCoverModal}
            className="px-3.5 py-2.5 rounded-xl bg-[#FDE047] hover:bg-[#FACC15] border-2 border-[#1D1815] shadow-[2px_2px_0px_#1D1815] hover:shadow-[1px_1px_0px_#1D1815] hover:translate-x-[1px] hover:translate-y-[1px] font-display font-black text-xs text-[#1D1815] flex items-center gap-1.5 cursor-pointer transition-all active:translate-x-[2px] active:translate-y-[2px]"
          >
            <Wand2 className="w-4 h-4 stroke-[2.5]" />
            <span>Cover Slide</span>
          </button>

          {/* Add CTA Outro Slide Button */}
          <button
            type="button"
            onClick={onOpenCtaModal}
            className="px-3.5 py-2.5 rounded-xl bg-[#93C5FD] hover:bg-[#60A5FA] border-2 border-[#1D1815] shadow-[2px_2px_0px_#1D1815] hover:shadow-[1px_1px_0px_#1D1815] hover:translate-x-[1px] hover:translate-y-[1px] font-display font-black text-xs text-[#1D1815] flex items-center gap-1.5 cursor-pointer transition-all active:translate-x-[2px] active:translate-y-[2px]"
          >
            <PlusCircle className="w-4 h-4 stroke-[2.5]" />
            <span>Outro CTA</span>
          </button>

          <div className="hidden xl:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[var(--bg-card)] border-2 border-[var(--border-ink)] shadow-[2px_2px_0px_var(--shadow-ink)] text-xs font-bold text-[var(--text-main)]">
            <MoveHorizontal className="w-4 h-4 stroke-[2.5]" />
            <span>Drag to reorder</span>
          </div>
        </div>
      </div>

      {/* Sortable Grid with DragOverlay */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <SortableContext items={slides.map((s) => s.id)} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-7">
            {slides.map((slide, index) => (
              <SortableSlide
                key={slide.id}
                slide={slide}
                index={index}
                onRemove={onRemoveSlide}
                onPreview={onPreviewSlide}
                onDownloadSingle={onDownloadSingle}
                onUpdateSlide={onUpdateSlide}
              />
            ))}
          </div>
        </SortableContext>

        {/* Silky Smooth Drag Overlay */}
        <DragOverlay
          dropAnimation={{
            sideEffects: defaultDropAnimationSideEffects({
              styles: {
                active: {
                  opacity: '0.4',
                },
              },
            }),
            duration: 220,
            easing: 'cubic-bezier(0.2, 0, 0, 1)',
          }}
        >
          {activeSlide ? (
            <DragOverlaySlideCard slide={activeSlide} index={activeIndex} />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
