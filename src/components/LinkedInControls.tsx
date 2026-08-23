'use client';

import React, { useState } from 'react';
import {
  SlidersHorizontal,
  Maximize,
  Crop,
  Check,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Smartphone,
  Square,
  Maximize2,
  Loader2,
} from 'lucide-react';
import {
  LinkedInOptions,
  LinkedInPreset,
  ResizeFitMode,
  BackgroundMode,
} from '@/lib/types';

interface LinkedInControlsProps {
  options: LinkedInOptions;
  onOptionsChange: (newOptions: LinkedInOptions) => void;
  onApplyTransformations: () => Promise<void>;
  isApplying: boolean;
}

export function LinkedInControls({
  options,
  onOptionsChange,
  onApplyTransformations,
  isApplying,
}: LinkedInControlsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customW, setCustomW] = useState(options.customWidth || 1080);
  const [customH, setCustomH] = useState(options.customHeight || 1350);

  const handlePresetSelect = (preset: LinkedInPreset) => {
    const next: LinkedInOptions = {
      ...options,
      preset,
      customWidth: preset === 'custom' ? customW : undefined,
      customHeight: preset === 'custom' ? customH : undefined,
    };
    onOptionsChange(next);
  };

  const handleFitModeChange = (fitMode: ResizeFitMode) => {
    onOptionsChange({ ...options, fitMode });
  };

  const handleBackgroundChange = (backgroundMode: BackgroundMode) => {
    onOptionsChange({ ...options, backgroundMode });
  };

  const handleCustomDimensionSubmit = () => {
    onOptionsChange({
      ...options,
      preset: 'custom',
      customWidth: Number(customW) || 1080,
      customHeight: Number(customH) || 1350,
    });
  };

  return (
    <div className="w-full sketch-card p-5 sm:p-6 mb-8 relative">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#A7F3D0] border-2 border-[#1D1815] shadow-[3px_3px_0px_#1D1815] flex items-center justify-center text-[#1D1815] shrink-0">
            <SlidersHorizontal className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h3 className="font-display font-black text-[var(--text-main)] text-lg sm:text-xl">
                LinkedIn Format & Dimension Studio
              </h3>
              <span className="font-marker text-xs px-2.5 py-0.5 rounded-full bg-[#FDE047] text-[#1D1815] border border-[#1D1815] shadow-[1.5px_1.5px_0px_#1D1815] rotate-[-1deg]">
                Optional Presets ✨
              </span>
            </div>
            <p className="font-hand text-base text-[var(--text-muted)] font-bold -mt-0.5">
              Format images to LinkedIn standards (1080×1350 portrait 4:5 / 1080×1080 square 1:1).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-display font-extrabold border-2 border-[var(--border-ink)] bg-[var(--bg-card)] hover:bg-[#FDE047] hover:text-[#1D1815] text-[var(--text-main)] shadow-[2px_2px_0px_var(--shadow-ink)] hover:shadow-[1px_1px_0px_var(--shadow-ink)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all flex items-center gap-2 cursor-pointer"
          >
            <SlidersHorizontal className="w-4 h-4 stroke-[2.5]" />
            <span>{isOpen ? 'Hide Options' : 'Configure Dimensions'}</span>
            {isOpen ? <ChevronUp className="w-4 h-4 stroke-[3]" /> : <ChevronDown className="w-4 h-4 stroke-[3]" />}
          </button>
        </div>
      </div>

      {/* Expandable Controls Drawer */}
      {isOpen && (
        <div className="mt-6 pt-6 border-t-2 border-dashed border-[var(--border-ink)]/20 space-y-6 animate-fadeIn">
          {/* Dimension Presets */}
          <div>
            <label className="block font-display text-xs font-black uppercase tracking-wider text-[var(--text-muted)] mb-3">
              1. Dimensions & Aspect Ratio
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
              {/* Original */}
              <button
                type="button"
                onClick={() => handlePresetSelect('original')}
                className={`p-4 rounded-2xl border-2 border-[var(--border-ink)] text-left transition-all flex flex-col justify-between cursor-pointer ${
                  options.preset === 'original'
                    ? 'bg-[#FDE047] text-[#1D1815] shadow-[4px_4px_0px_var(--shadow-ink)] translate-x-[-1px] translate-y-[-1px]'
                    : 'bg-[var(--bg-card)] hover:bg-[var(--bg-page)] text-[var(--text-main)] shadow-[2px_2px_0px_var(--shadow-ink)]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-display font-extrabold text-sm">Keep Original</span>
                  {options.preset === 'original' ? (
                    <div className="w-5 h-5 rounded-full bg-[#1D1815] text-white flex items-center justify-center font-bold">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  ) : (
                    <Maximize2 className="w-4 h-4 opacity-60" />
                  )}
                </div>
                <span className="font-hand text-sm opacity-80 mt-2 font-bold">
                  Preserve source aspect ratio
                </span>
              </button>

              {/* 1080 x 1350 */}
              <button
                type="button"
                onClick={() => handlePresetSelect('portrait-1080-1350')}
                className={`p-4 rounded-2xl border-2 border-[var(--border-ink)] text-left transition-all flex flex-col justify-between cursor-pointer ${
                  options.preset === 'portrait-1080-1350'
                    ? 'bg-[#F5A3B3] text-[#1D1815] shadow-[4px_4px_0px_var(--shadow-ink)] translate-x-[-1px] translate-y-[-1px]'
                    : 'bg-[var(--bg-card)] hover:bg-[var(--bg-page)] text-[var(--text-main)] shadow-[2px_2px_0px_var(--shadow-ink)]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-display font-extrabold text-sm">1080 × 1350 (4:5)</span>
                  {options.preset === 'portrait-1080-1350' ? (
                    <div className="w-5 h-5 rounded-full bg-[#1D1815] text-white flex items-center justify-center font-bold">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  ) : (
                    <Smartphone className="w-4 h-4 opacity-60" />
                  )}
                </div>
                <span className="font-hand text-sm opacity-90 mt-2 font-bold">
                  Standard LinkedIn Portrait ✨
                </span>
              </button>

              {/* 1080 x 1080 */}
              <button
                type="button"
                onClick={() => handlePresetSelect('square-1080-1080')}
                className={`p-4 rounded-2xl border-2 border-[var(--border-ink)] text-left transition-all flex flex-col justify-between cursor-pointer ${
                  options.preset === 'square-1080-1080'
                    ? 'bg-[#93C5FD] text-[#1D1815] shadow-[4px_4px_0px_var(--shadow-ink)] translate-x-[-1px] translate-y-[-1px]'
                    : 'bg-[var(--bg-card)] hover:bg-[var(--bg-page)] text-[var(--text-main)] shadow-[2px_2px_0px_var(--shadow-ink)]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-display font-extrabold text-sm">1080 × 1080 (1:1)</span>
                  {options.preset === 'square-1080-1080' ? (
                    <div className="w-5 h-5 rounded-full bg-[#1D1815] text-white flex items-center justify-center font-bold">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  ) : (
                    <Square className="w-4 h-4 opacity-60" />
                  )}
                </div>
                <span className="font-hand text-sm opacity-80 mt-2 font-bold">
                  Square Carousel Feed
                </span>
              </button>

              {/* Custom */}
              <button
                type="button"
                onClick={() => handlePresetSelect('custom')}
                className={`p-4 rounded-2xl border-2 border-[var(--border-ink)] text-left transition-all flex flex-col justify-between cursor-pointer ${
                  options.preset === 'custom'
                    ? 'bg-[#A7F3D0] text-[#1D1815] shadow-[4px_4px_0px_var(--shadow-ink)] translate-x-[-1px] translate-y-[-1px]'
                    : 'bg-[var(--bg-card)] hover:bg-[var(--bg-page)] text-[var(--text-main)] shadow-[2px_2px_0px_var(--shadow-ink)]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-display font-extrabold text-sm">Custom Dimensions</span>
                  {options.preset === 'custom' ? (
                    <div className="w-5 h-5 rounded-full bg-[#1D1815] text-white flex items-center justify-center font-bold">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  ) : (
                    <SlidersHorizontal className="w-4 h-4 opacity-60" />
                  )}
                </div>
                <span className="font-hand text-sm opacity-80 mt-2 font-bold">
                  Set Custom Width × Height
                </span>
              </button>
            </div>

            {/* Custom Inputs */}
            {options.preset === 'custom' && (
              <div className="mt-4 p-4 rounded-2xl bg-[var(--bg-card)] border-2 border-[var(--border-ink)] shadow-[3px_3px_0px_var(--shadow-ink)] flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={customW}
                    onChange={(e) => setCustomW(Number(e.target.value))}
                    className="w-28 px-3.5 py-2 rounded-xl border-2 border-[var(--border-ink)] bg-[var(--input-bg)] font-mono text-sm font-bold text-[var(--text-main)] focus:outline-none"
                    placeholder="Width"
                  />
                  <span className="font-bold text-[var(--text-main)]">×</span>
                  <input
                    type="number"
                    value={customH}
                    onChange={(e) => setCustomH(Number(e.target.value))}
                    className="w-28 px-3.5 py-2 rounded-xl border-2 border-[var(--border-ink)] bg-[var(--input-bg)] font-mono text-sm font-bold text-[var(--text-main)] focus:outline-none"
                    placeholder="Height"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleCustomDimensionSubmit}
                  className="px-4 py-2 rounded-xl bg-[#FDE047] border-2 border-[#1D1815] shadow-[2px_2px_0px_#1D1815] font-display font-black text-xs text-[#1D1815] hover:bg-[#FACC15] cursor-pointer"
                >
                  Set Dimensions
                </button>
              </div>
            )}
          </div>

          {/* Fit / Crop Strategy */}
          {options.preset !== 'original' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t-2 border-dashed border-[var(--border-ink)]/20">
              <div>
                <label className="block font-display text-xs font-black uppercase tracking-wider text-[var(--text-muted)] mb-3">
                  2. Resize Strategy (Zero Image Stretching)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleFitModeChange('contain')}
                    className={`p-3.5 rounded-2xl border-2 border-[var(--border-ink)] text-left transition-all cursor-pointer ${
                      options.fitMode === 'contain'
                        ? 'bg-[#FDE047] text-[#1D1815] shadow-[3px_3px_0px_var(--shadow-ink)]'
                        : 'bg-[var(--bg-card)] text-[var(--text-main)] shadow-[1.5px_1.5px_0px_var(--shadow-ink)]'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-display font-extrabold text-xs">
                      <Maximize className="w-4 h-4 stroke-[2.5]" />
                      <span>Fit (Contain)</span>
                    </div>
                    <p className="font-hand text-sm opacity-80 mt-1 font-bold">
                      Pads canvas without cropping content.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleFitModeChange('cover')}
                    className={`p-3.5 rounded-2xl border-2 border-[var(--border-ink)] text-left transition-all cursor-pointer ${
                      options.fitMode === 'cover'
                        ? 'bg-[#FDE047] text-[#1D1815] shadow-[3px_3px_0px_var(--shadow-ink)]'
                        : 'bg-[var(--bg-card)] text-[var(--text-main)] shadow-[1.5px_1.5px_0px_var(--shadow-ink)]'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-display font-extrabold text-xs">
                      <Crop className="w-4 h-4 stroke-[2.5]" />
                      <span>Fill (Cover/Crop)</span>
                    </div>
                    <p className="font-hand text-sm opacity-80 mt-1 font-bold">
                      Fills canvas, center-attention cropped.
                    </p>
                  </button>
                </div>
              </div>

              {/* Canvas Padding Color */}
              {options.fitMode === 'contain' && (
                <div>
                  <label className="block font-display text-xs font-black uppercase tracking-wider text-[var(--text-muted)] mb-3">
                    3. Canvas Padding Color
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { id: 'white', label: 'White', color: '#ffffff' },
                      { id: 'black', label: 'Black', color: '#1D1815' },
                      { id: 'blur', label: 'Blur BG', color: 'bg-[#F5A3B3]' },
                      { id: 'transparent', label: 'Alpha', color: 'transparent' },
                    ].map((bg) => (
                      <button
                        key={bg.id}
                        type="button"
                        onClick={() => handleBackgroundChange(bg.id as BackgroundMode)}
                        className={`py-2.5 px-2 rounded-xl border-2 border-[var(--border-ink)] text-xs font-display font-bold flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          options.backgroundMode === bg.id
                            ? 'bg-[#FDE047] text-[#1D1815] shadow-[2px_2px_0px_var(--shadow-ink)]'
                            : 'bg-[var(--bg-card)] text-[var(--text-main)] hover:bg-[var(--bg-page)]'
                        }`}
                      >
                        <span
                          className={`w-4 h-4 rounded-full border border-[var(--border-ink)] ${
                            bg.id === 'blur' ? 'bg-[#F5A3B3]' : ''
                          }`}
                          style={{ backgroundColor: bg.id !== 'blur' ? bg.color : undefined }}
                        />
                        <span className="text-[11px]">{bg.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Trigger */}
          <div className="pt-4 flex justify-end">
            <button
              type="button"
              disabled={isApplying}
              onClick={onApplyTransformations}
              className="px-7 py-3.5 rounded-2xl bg-[#FDE047] hover:bg-[#FACC15] sketch-btn text-[#1D1815] font-display font-black text-sm flex items-center gap-2.5 cursor-pointer disabled:opacity-50 uppercase tracking-wider"
            >
              {isApplying ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin stroke-[3]" />
                  <span>Applying LinkedIn Dimensions...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 stroke-[2.5]" />
                  <span>Apply Formatting to All Slides</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
