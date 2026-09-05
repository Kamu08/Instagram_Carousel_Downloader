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
  onOpenWatermarkModal: () => void;
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
  onOpenWatermarkModal,
}: CarouselGridProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

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
      {/* Clean Grid Toolbar */}
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
          {/* Watermark Button */}
          <button
            type="button"
            onClick={onOpenWatermarkModal}
            className="px-3.5 py-2.5 rounded-xl bg-[#FAF8F3] dark:bg-[#1C1916] hover:bg-[#FDE047] dark:hover:text-[#1D1815] border-2 border-[var(--border-ink)] shadow-[2px_2px_0px_var(--shadow-ink)] hover:translate-x-[1px] hover:translate-y-[1px] font-display font-black text-xs text-[var(--text-main)] flex items-center gap-1.5 cursor-pointer transition-all active:translate-x-[2px] active:translate-y-[2px]"
          >
            <Stamp className="w-4 h-4 stroke-[2.5]" />
            <span>Watermark</span>
          </button>

          {/* Generate Custom Cover Slide */}
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

      {/* Sortable Grid: 4 Cards Per Row on Desktop */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <SortableContext items={slides.map((s) => s.id)} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 sm:gap-6">
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
