'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Stamp,
  CheckCircle2,
  Loader2,
  Trash2,
  RotateCcw,
} from 'lucide-react';
import { CarouselSlide } from '@/lib/types';
import {
  WatermarkOptions,
  WatermarkPosition,
  WatermarkStyle,
  DEFAULT_WATERMARK_OPTIONS,
  stampWatermarkOnCanvas,
  applyWatermarkToAllSlides,
  removeWatermarkFromAllSlides,
} from '@/lib/watermark';

interface WatermarkModalProps {
  isOpen: boolean;
  onClose: () => void;
  slides: CarouselSlide[];
  onApplyWatermark: (updatedSlides: CarouselSlide[]) => void;
  onRemoveWatermark: () => void;
}

const STYLE_PRESETS: {
  id: WatermarkStyle;
  label: string;
  badgeClass: string;
  desc: string;
  defaultBg: string;
  defaultColor: string;
}[] = [
  {
    id: 'pill',
    label: 'Doodle Yellow Pill',
    badgeClass: 'bg-[#FDE047] text-[#1D1815]',
    desc: 'Paper sketch 3D shadow',
    defaultBg: '#FDE047',
    defaultColor: '#1D1815',
  },
  {
    id: 'bold-badge',
    label: 'Midnight Dark Pill',
    badgeClass: 'bg-[#1D1815] text-white',
    desc: 'Dark high-contrast',
    defaultBg: '#1D1815',
    defaultColor: '#FFFFFF',
  },
  {
    id: 'pastel-pink',
    label: 'Pastel Pink Tag',
    badgeClass: 'bg-[#F5A3B3] text-[#1D1815]',
    desc: 'Soft highlighter tag',
    defaultBg: '#F5A3B3',
    defaultColor: '#1D1815',
  },
  {
    id: 'tech-blue',
    label: 'Tech Blue Badge',
    badgeClass: 'bg-[#93C5FD] text-[#1D1815]',
    desc: 'Clean modern blue',
    defaultBg: '#93C5FD',
    defaultColor: '#1D1815',
  },
  {
    id: 'mint-stamp',
    label: 'Mint Green Stamp',
    badgeClass: 'bg-[#A7F3D0] text-[#1D1815]',
    desc: 'Fresh pastel green',
    defaultBg: '#A7F3D0',
    defaultColor: '#1D1815',
  },
  {
    id: 'frosted-glass',
    label: 'Frosted Glass Pill',
    badgeClass: 'bg-white/80 text-[#1D1815]',
    desc: 'Translucent frosted',
    defaultBg: '#FFFFFF',
    defaultColor: '#1D1815',
  },
  {
    id: 'tape-sticker',
    label: 'Washi Tape Sticker',
    badgeClass: 'bg-[#FDE047]/90 border-dashed text-[#1D1815]',
    desc: 'Dashed stitch tape',
    defaultBg: '#FDE047',
    defaultColor: '#1D1815',
  },
  {
    id: 'minimal',
    label: 'Minimal Clean Text',
    badgeClass: 'bg-[var(--bg-page)] text-[var(--text-main)]',
    desc: 'Text with outline',
    defaultBg: 'transparent',
    defaultColor: '#FFFFFF',
  },
];

const POSITION_OPTIONS: { id: WatermarkPosition; label: string }[] = [
  { id: 'top-left', label: 'Top Left' },
  { id: 'top-center', label: 'Top Center ⭐' },
  { id: 'top-right', label: 'Top Right' },
  { id: 'bottom-left', label: 'Bottom Left' },
  { id: 'bottom-center', label: 'Bottom Center ⭐' },
  { id: 'bottom-right', label: 'Bottom Right' },
];

export function WatermarkModal({
  isOpen,
  onClose,
  slides,
  onApplyWatermark,
  onRemoveWatermark,
}: WatermarkModalProps) {
  const [options, setOptions] = useState<WatermarkOptions>(DEFAULT_WATERMARK_OPTIONS);
  const [previewDataUrl, setPreviewDataUrl] = useState<string>('');
  const [isApplying, setIsApplying] = useState(false);
  const [previewSlideIndex, setPreviewSlideIndex] = useState<number>(0);

  const isAnyWatermarked = slides.some((s) => s.isWatermarked);

  // Live preview update
  useEffect(() => {
    if (!isOpen || slides.length === 0) return;

    const targetSlide = slides[previewSlideIndex] || slides[0];
    if (!targetSlide) return;

    const cleanBase = targetSlide.cleanDataUrl || targetSlide.dataUrl;

    stampWatermarkOnCanvas(
      cleanBase,
      previewSlideIndex,
      slides.length,
      { ...options, enabled: true }
    )
      .then((url) => setPreviewDataUrl(url))
      .catch((err) => console.error('Preview watermark error:', err));
  }, [isOpen, options, previewSlideIndex, slides]);

  if (!isOpen) return null;

  const handleApply = async () => {
    if (slides.length === 0 || isApplying) return;

    setIsApplying(true);
    try {
      const updated = await applyWatermarkToAllSlides(slides, {
        ...options,
        enabled: true,
      });
      onApplyWatermark(updated);
      onClose();
    } catch (err: any) {
      alert(err.message || 'Failed to apply watermark.');
    } finally {
      setIsApplying(false);
    }
  };

  const handleRemove = () => {
    onRemoveWatermark();
    onClose();
  };

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
            <div className="w-10 h-10 rounded-xl bg-[#FDE047] border-2 border-[#1D1815] shadow-[2px_2px_0px_#1D1815] flex items-center justify-center text-[#1D1815]">
              <Stamp className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-black text-lg text-[var(--text-main)]">
                  Slide Watermark &amp; Branding Studio
                </h3>
                <span className="font-marker text-xs px-2.5 py-0.5 rounded-full bg-[#A7F3D0] text-[#1D1815] border border-[#1D1815]">
                  6 Positions &amp; 8 Styles ✨
                </span>
              </div>
              <p className="font-hand text-base text-[var(--text-muted)] font-bold -mt-1">
                Customize watermark placement, styles &amp; easily remove anytime
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

        {/* Content Body: Left Controls & Right Live Preview */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          {/* Controls Column */}
          <div className="lg:col-span-7 p-5 sm:p-6 overflow-y-auto space-y-5 border-b lg:border-b-0 lg:border-r-2 border-[var(--border-ink)]/20">
            {/* 1. Watermark Text & Prefix Icon */}
            <div className="space-y-2">
              <label className="block font-display text-xs font-black uppercase text-[var(--text-muted)]">
                Watermark Text &amp; Branding
              </label>
              <div className="flex items-center gap-2">
                {/* Prefix Icon Selector */}
                <select
                  value={options.showIcon || 'none'}
                  onChange={(e) => setOptions({ ...options, showIcon: e.target.value as any })}
                  className="px-3 py-2.5 rounded-xl border-2 border-[var(--border-ink)] bg-[var(--input-bg)] font-display font-bold text-xs text-[var(--text-main)] focus:outline-none cursor-pointer"
                >
                  <option value="none">No Icon</option>
                  <option value="linkedin">LinkedIn (in | )</option>
                  <option value="at">Handle (@)</option>
                  <option value="star">Star (★)</option>
                </select>

                <input
                  type="text"
                  value={options.text}
                  onChange={(e) => setOptions({ ...options, text: e.target.value })}
                  placeholder="e.g. Kamal Sharma"
                  className="flex-1 px-3.5 py-2.5 rounded-xl border-2 border-[var(--border-ink)] bg-[var(--input-bg)] font-display font-bold text-sm text-[var(--text-main)] focus:outline-none"
                />
              </div>
            </div>

            {/* 2. Position Selection (6 Positions including Top-Center and Bottom-Center) */}
            <div className="space-y-2">
              <label className="block font-display text-xs font-black uppercase text-[var(--text-muted)]">
                Placement Position on Slide (6 Options)
              </label>

              <div className="grid grid-cols-3 gap-2">
                {POSITION_OPTIONS.map((pos) => (
                  <button
                    key={pos.id}
                    type="button"
                    onClick={() => setOptions({ ...options, position: pos.id })}
                    className={`py-2.5 px-2 rounded-2xl border-2 border-[var(--border-ink)] text-xs font-display font-extrabold text-center transition-all cursor-pointer ${
                      options.position === pos.id
                        ? 'bg-[#FDE047] text-[#1D1815] shadow-[3px_3px_0px_var(--shadow-ink)] -translate-x-0.5 -translate-y-0.5'
                        : 'bg-[var(--bg-page)] text-[var(--text-main)] hover:bg-[var(--bg-card)]'
                    }`}
                  >
                    {pos.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Style Presets (8 Styles) */}
            <div className="space-y-2">
              <label className="block font-display text-xs font-black uppercase text-[var(--text-muted)]">
                Watermark Badge Style
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {STYLE_PRESETS.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() =>
                      setOptions({
                        ...options,
                        style: s.id,
                        backgroundColor: s.defaultBg,
                        color: s.defaultColor,
                      })
                    }
                    className={`p-2.5 rounded-2xl border-2 border-[var(--border-ink)] text-left transition-all cursor-pointer flex flex-col justify-between ${
                      options.style === s.id
                        ? `${s.badgeClass} shadow-[3px_3px_0px_var(--shadow-ink)] -translate-x-0.5 -translate-y-0.5`
                        : 'bg-[var(--bg-page)] text-[var(--text-main)] hover:bg-[var(--bg-card)]'
                    }`}
                  >
                    <span className="font-display font-black text-xs">{s.label}</span>
                    <span className="font-hand text-[11px] opacity-80 mt-1 font-bold">
                      {s.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Slide Inclusions (First, Last, Body) */}
            <div className="space-y-2">
              <label className="block font-display text-xs font-black uppercase text-[var(--text-muted)]">
                Slide Inclusions
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {/* First Slide */}
                <label
                  className={`p-3 rounded-2xl border-2 border-[var(--border-ink)] flex items-center justify-between cursor-pointer transition-all ${
                    options.applyToFirstSlide
                      ? 'bg-[#FDE047] text-[#1D1815] shadow-[2px_2px_0px_var(--shadow-ink)]'
                      : 'bg-[var(--bg-page)] text-[var(--text-muted)]'
                  }`}
                >
                  <span className="font-display font-bold text-xs">First Slide (Cover)</span>
                  <input
                    type="checkbox"
                    checked={options.applyToFirstSlide}
                    onChange={(e) =>
                      setOptions({ ...options, applyToFirstSlide: e.target.checked })
                    }
                    className="w-4 h-4 accent-[#1D1815] cursor-pointer"
                  />
                </label>

                {/* Middle / Body Slides */}
                <label
                  className={`p-3 rounded-2xl border-2 border-[var(--border-ink)] flex items-center justify-between cursor-pointer transition-all ${
                    options.applyToBodySlides
                      ? 'bg-[#93C5FD] text-[#1D1815] shadow-[2px_2px_0px_var(--shadow-ink)]'
                      : 'bg-[var(--bg-page)] text-[var(--text-muted)]'
                  }`}
                >
                  <span className="font-display font-bold text-xs">Body Slides</span>
                  <input
                    type="checkbox"
                    checked={options.applyToBodySlides}
                    onChange={(e) =>
                      setOptions({ ...options, applyToBodySlides: e.target.checked })
                    }
                    className="w-4 h-4 accent-[#1D1815] cursor-pointer"
                  />
                </label>

                {/* Last Slide */}
                <label
                  className={`p-3 rounded-2xl border-2 border-[var(--border-ink)] flex items-center justify-between cursor-pointer transition-all ${
                    options.applyToLastSlide
                      ? 'bg-[#F5A3B3] text-[#1D1815] shadow-[2px_2px_0px_var(--shadow-ink)]'
                      : 'bg-[var(--bg-page)] text-[var(--text-muted)]'
                  }`}
                >
                  <span className="font-display font-bold text-xs">Last Slide (Outro)</span>
                  <input
                    type="checkbox"
                    checked={options.applyToLastSlide}
                    onChange={(e) =>
                      setOptions({ ...options, applyToLastSlide: e.target.checked })
                    }
                    className="w-4 h-4 accent-[#1D1815] cursor-pointer"
                  />
                </label>
              </div>
            </div>

            {/* 5. Scale & Opacity Sliders */}
            <div className="grid grid-cols-2 gap-4 pt-1">
              <div>
                <div className="flex justify-between text-xs font-bold text-[var(--text-main)] mb-1">
                  <span>Badge Scale</span>
                  <span className="font-mono">{options.fontSize}px</span>
                </div>
                <input
                  type="range"
                  min={18}
                  max={46}
                  value={options.fontSize}
                  onChange={(e) =>
                    setOptions({ ...options, fontSize: Number(e.target.value) })
                  }
                  className="w-full accent-[#1D1815] cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold text-[var(--text-main)] mb-1">
                  <span>Opacity</span>
                  <span className="font-mono">{Math.round(options.opacity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min={0.4}
                  max={1.0}
                  step={0.05}
                  value={options.opacity}
                  onChange={(e) =>
                    setOptions({ ...options, opacity: Number(e.target.value) })
                  }
                  className="w-full accent-[#1D1815] cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Right Live Preview Column */}
          <div className="lg:col-span-5 p-5 sm:p-6 bg-[var(--bg-page)] flex flex-col items-center justify-between">
            <div className="w-full flex items-center justify-between mb-3">
              <span className="font-display font-black text-xs uppercase tracking-wider text-[var(--text-muted)]">
                Live Slide Preview
              </span>

              {/* Preview slide switcher */}
              {slides.length > 1 && (
                <div className="flex items-center gap-1.5 text-xs font-display font-bold text-[var(--text-main)]">
                  <span>Previewing:</span>
                  <select
                    value={previewSlideIndex}
                    onChange={(e) => setPreviewSlideIndex(Number(e.target.value))}
                    className="px-2 py-0.5 rounded-lg border border-[var(--border-ink)] bg-[var(--bg-card)] font-mono text-xs cursor-pointer"
                  >
                    {slides.map((_, i) => (
                      <option key={i} value={i}>
                        Slide {i + 1} {i === 0 ? '(Cover)' : i === slides.length - 1 ? '(Outro)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="relative aspect-[4/5] max-h-[52vh] rounded-2xl border-2 border-[var(--border-ink)] shadow-[4px_4px_0px_var(--shadow-ink)] overflow-hidden bg-white flex items-center justify-center">
              {previewDataUrl ? (
                <img
                  src={previewDataUrl}
                  alt="Watermark Preview"
                  className="w-full h-full object-contain"
                />
              ) : (
                <Loader2 className="w-6 h-6 animate-spin text-[var(--text-muted)]" />
              )}
            </div>

            <p className="font-hand text-sm text-[var(--text-muted)] font-bold mt-3 text-center">
              Watermarks are rendered at master resolution directly into your PNGs &amp; PDF
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-[var(--bg-page)] border-t-2 border-[var(--border-ink)] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {isAnyWatermarked && (
              <button
                type="button"
                onClick={handleRemove}
                className="px-4 py-3 rounded-2xl border-2 border-[#F43F5E] bg-[#F5A3B3]/40 hover:bg-[#F5A3B3] text-[#F43F5E] hover:text-[#1D1815] font-display font-black text-xs flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <Trash2 className="w-4 h-4 stroke-[2.5]" />
                <span>Remove Watermark</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-3 rounded-2xl border-2 border-[var(--border-ink)] bg-[var(--bg-card)] font-display font-black text-xs text-[var(--text-main)] cursor-pointer"
            >
              Cancel
            </button>
          </div>

          <button
            type="button"
            disabled={isApplying}
            onClick={handleApply}
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-[#FDE047] hover:bg-[#FACC15] sketch-btn text-[#1D1815] font-display font-black text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider disabled:opacity-60"
          >
            {isApplying ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin stroke-[3]" />
                <span>Stamping Watermarks...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 stroke-[3]" />
                <span>⚡ Apply Watermark to Slides</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
