'use client';

import React, { useState } from 'react';
import {
  SlidersHorizontal,
  Stamp,
  Filter,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Smartphone,
  Square,
  Wand2,
  PlusCircle,
  FileText,
  Download,
  Trash2,
  Check,
  Crop,
  Maximize,
  Sliders,
  CheckCircle2,
  Loader2,
  Target,
} from 'lucide-react';
import {
  CarouselSlide,
  LinkedInOptions,
  LinkedInPreset,
} from '@/lib/types';

interface StudioCommandDeckProps {
  slides: CarouselSlide[];
  linkedinOptions: LinkedInOptions;
  onLinkedinOptionsChange: (newOptions: LinkedInOptions) => void;
  onApplyTransformations: () => Promise<void>;
  isApplyingTransformations: boolean;
  skipFirstSlide: boolean;
  setSkipFirstSlide: (val: boolean) => void;
  skipLastSlide: boolean;
  setSkipLastSlide: (val: boolean) => void;
  onOpenWatermarkModal: () => void;
  onRemoveWatermark: () => void;
  onOpenCoverModal: () => void;
  onOpenCtaModal: () => void;
  onOpenCaptionModal: () => void;
  onOpenHookLabModal: () => void;
}

type TabType = 'dimensions' | 'watermark' | 'filters' | 'ai-tools' | null;

export function StudioCommandDeck({
  slides,
  linkedinOptions,
  onLinkedinOptionsChange,
  onApplyTransformations,
  isApplyingTransformations,
  skipFirstSlide,
  setSkipFirstSlide,
  skipLastSlide,
  setSkipLastSlide,
  onOpenWatermarkModal,
  onRemoveWatermark,
  onOpenCoverModal,
  onOpenCtaModal,
  onOpenCaptionModal,
  onOpenHookLabModal,
}: StudioCommandDeckProps) {
  const [activeTab, setActiveTab] = useState<TabType>(null);
  const [customW, setCustomW] = useState(linkedinOptions.customWidth || 1080);
  const [customH, setCustomH] = useState(linkedinOptions.customHeight || 1350);

  const isWatermarked = slides.some((s) => s.isWatermarked);
  const exportSlidesCount = slides.filter((_, idx) => {
    if (idx === 0 && skipFirstSlide) return false;
    if (idx === slides.length - 1 && skipLastSlide) return false;
    return true;
  }).length;

  const handleTabClick = (tab: TabType) => {
    setActiveTab(activeTab === tab ? null : tab);
  };

  const handlePresetSelect = (preset: LinkedInPreset) => {
    onLinkedinOptionsChange({
      ...linkedinOptions,
      preset,
      customWidth: preset === 'custom' ? customW : undefined,
      customHeight: preset === 'custom' ? customH : undefined,
    });
  };

  const handleCustomDimensionSubmit = () => {
    onLinkedinOptionsChange({
      ...linkedinOptions,
      preset: 'custom',
      customWidth: Number(customW) || 1080,
      customHeight: Number(customH) || 1350,
    });
  };

  return (
    <div className="w-full sketch-card p-4 sm:p-5 mb-8 relative transition-all">
      {/* 1. Main Unified Command Bar */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
        {/* Left Status & Carousel Info */}
        <div className="flex items-center gap-3 w-full lg:w-auto justify-between lg:justify-start">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#FDE047] border-2 border-[#1D1815] shadow-[2px_2px_0px_#1D1815] flex items-center justify-center text-[#1D1815] shrink-0 font-display font-black text-sm">
              {exportSlidesCount}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-black text-sm sm:text-base text-[var(--text-main)]">
                  Carousel Command Deck
                </span>
                <span className="font-marker text-xs px-2 py-0.5 rounded-full bg-[#A7F3D0] text-[#1D1815] border border-[#1D1815]">
                  {slides[0]?.width || 1440}×{slides[0]?.height || 1920}
                </span>
              </div>
              <p className="font-hand text-xs sm:text-sm text-[var(--text-muted)] font-bold -mt-0.5">
                {isWatermarked ? 'Watermark Stamped' : 'No Watermark'} • Exporting {exportSlidesCount} of {slides.length} slides
              </p>
            </div>
          </div>

          {/* Quick AI Caption Action on Mobile */}
          <button
            type="button"
            onClick={onOpenCaptionModal}
            className="lg:hidden p-2 rounded-xl bg-[#A7F3D0] border-2 border-[#1D1815] shadow-[2px_2px_0px_#1D1815] text-[#1D1815] cursor-pointer"
            title="AI Caption Generator"
          >
            <Sparkles className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Center / Right: Segmented Studio Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2 w-full lg:w-auto">
          {/* Tab 1: Dimensions & Format */}
          <button
            type="button"
            onClick={() => handleTabClick('dimensions')}
            className={`px-3.5 py-2 rounded-xl border-2 border-[var(--border-ink)] font-display font-black text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'dimensions'
                ? 'bg-[#FDE047] text-[#1D1815] shadow-[2px_2px_0px_var(--shadow-ink)] -translate-y-0.5'
                : 'bg-[var(--bg-card)] text-[var(--text-main)] hover:bg-[var(--bg-page)] shadow-[1.5px_1.5px_0px_var(--shadow-ink)]'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Format ({linkedinOptions.preset === 'original' ? 'Original' : linkedinOptions.preset === 'portrait-1080-1350' ? '4:5 Portrait' : 'Custom'})</span>
            {activeTab === 'dimensions' ? (
              <ChevronUp className="w-3 h-3 stroke-[3]" />
            ) : (
              <ChevronDown className="w-3 h-3 stroke-[3]" />
            )}
          </button>

          {/* Tab 2: Watermark & Branding */}
          <button
            type="button"
            onClick={() => handleTabClick('watermark')}
            className={`px-3.5 py-2 rounded-xl border-2 border-[var(--border-ink)] font-display font-black text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'watermark'
                ? 'bg-[#A7F3D0] text-[#1D1815] shadow-[2px_2px_0px_var(--shadow-ink)] -translate-y-0.5'
                : isWatermarked
                ? 'bg-[#A7F3D0]/60 text-[#1D1815] shadow-[1.5px_1.5px_0px_var(--shadow-ink)]'
                : 'bg-[var(--bg-card)] text-[var(--text-main)] hover:bg-[var(--bg-page)] shadow-[1.5px_1.5px_0px_var(--shadow-ink)]'
            }`}
          >
            <Stamp className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Watermark {isWatermarked ? '(Active)' : ''}</span>
            {activeTab === 'watermark' ? (
              <ChevronUp className="w-3 h-3 stroke-[3]" />
            ) : (
              <ChevronDown className="w-3 h-3 stroke-[3]" />
            )}
          </button>

          {/* Tab 3: Slide Selection & Filters */}
          <button
            type="button"
            onClick={() => handleTabClick('filters')}
            className={`px-3.5 py-2 rounded-xl border-2 border-[var(--border-ink)] font-display font-black text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'filters'
                ? 'bg-[#93C5FD] text-[#1D1815] shadow-[2px_2px_0px_var(--shadow-ink)] -translate-y-0.5'
                : skipFirstSlide || skipLastSlide
                ? 'bg-[#F5A3B3] text-[#1D1815] shadow-[1.5px_1.5px_0px_var(--shadow-ink)]'
                : 'bg-[var(--bg-card)] text-[var(--text-main)] hover:bg-[var(--bg-page)] shadow-[1.5px_1.5px_0px_var(--shadow-ink)]'
            }`}
          >
            <Filter className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>
              Slide Filter ({exportSlidesCount}/{slides.length})
            </span>
            {activeTab === 'filters' ? (
              <ChevronUp className="w-3 h-3 stroke-[3]" />
            ) : (
              <ChevronDown className="w-3 h-3 stroke-[3]" />
            )}
          </button>

          {/* Tab 4: AI & Creative Tools */}
          <button
            type="button"
            onClick={() => handleTabClick('ai-tools')}
            className={`px-3.5 py-2 rounded-xl border-2 border-[var(--border-ink)] font-display font-black text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'ai-tools'
                ? 'bg-[#F5A3B3] text-[#1D1815] shadow-[2px_2px_0px_var(--shadow-ink)] -translate-y-0.5'
                : 'bg-[var(--bg-card)] text-[var(--text-main)] hover:bg-[var(--bg-page)] shadow-[1.5px_1.5px_0px_var(--shadow-ink)]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>AI Studio</span>
            {activeTab === 'ai-tools' ? (
              <ChevronUp className="w-3 h-3 stroke-[3]" />
            ) : (
              <ChevronDown className="w-3 h-3 stroke-[3]" />
            )}
          </button>

          {/* Direct 1-Click AI Caption Button (Desktop) */}
          <button
            type="button"
            onClick={onOpenCaptionModal}
            className="hidden lg:flex px-4 py-2 rounded-xl bg-[#A7F3D0] hover:bg-[#6EE7B7] border-2 border-[#1D1815] shadow-[2px_2px_0px_#1D1815] font-display font-black text-xs text-[#1D1815] items-center gap-1.5 cursor-pointer hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>✨ AI Caption</span>
          </button>
        </div>
      </div>

      {/* 2. Collapsible Drawer Panel for Active Tab */}
      {activeTab && (
        <div className="mt-5 pt-5 border-t-2 border-dashed border-[var(--border-ink)]/20 animate-fadeIn">
          {/* TAB 1: DIMENSIONS & FORMATTING */}
          {activeTab === 'dimensions' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <span className="font-display font-black text-xs uppercase tracking-wider text-[var(--text-muted)]">
                  Select Dimension Preset:
                </span>
                {linkedinOptions.preset !== 'original' && (
                  <button
                    type="button"
                    disabled={isApplyingTransformations}
                    onClick={onApplyTransformations}
                    className="px-4 py-2 rounded-xl bg-[#FDE047] hover:bg-[#FACC15] sketch-btn text-[#1D1815] font-display font-black text-xs flex items-center gap-1.5 cursor-pointer uppercase tracking-wider disabled:opacity-50"
                  >
                    {isApplyingTransformations ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Applying...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Apply Formatting to All Slides</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  {
                    id: 'original',
                    label: 'Keep Original',
                    sub: 'Preserve source size',
                    icon: Maximize2,
                  },
                  {
                    id: 'portrait-1080-1350',
                    label: '1080 × 1350',
                    sub: '4:5 LinkedIn Portrait',
                    icon: Smartphone,
                  },
                  {
                    id: 'square-1080-1080',
                    label: '1080 × 1080',
                    sub: '1:1 Square Feed',
                    icon: Square,
                  },
                  {
                    id: 'custom',
                    label: 'Custom Size',
                    sub: 'Width × Height',
                    icon: SlidersHorizontal,
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = linkedinOptions.preset === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handlePresetSelect(item.id as LinkedInPreset)}
                      className={`p-3 rounded-2xl border-2 border-[var(--border-ink)] text-left transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'bg-[#FDE047] text-[#1D1815] shadow-[3px_3px_0px_var(--shadow-ink)] -translate-y-0.5'
                          : 'bg-[var(--bg-page)] text-[var(--text-main)] hover:bg-[var(--bg-card)]'
                      }`}
                    >
                      <div className="flex items-center justify-between font-display font-black text-xs">
                        <span>{item.label}</span>
                        <Icon className="w-3.5 h-3.5 opacity-80" />
                      </div>
                      <span className="font-hand text-xs opacity-80 mt-1 font-bold">
                        {item.sub}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Custom Size Input */}
              {linkedinOptions.preset === 'custom' && (
                <div className="p-3 rounded-xl bg-[var(--bg-page)] border-2 border-[var(--border-ink)] flex items-center gap-3">
                  <input
                    type="number"
                    value={customW}
                    onChange={(e) => setCustomW(Number(e.target.value))}
                    className="w-24 px-3 py-1.5 rounded-lg border border-[var(--border-ink)] bg-white font-mono text-xs font-bold text-[#1D1815]"
                    placeholder="Width"
                  />
                  <span className="font-bold">×</span>
                  <input
                    type="number"
                    value={customH}
                    onChange={(e) => setCustomH(Number(e.target.value))}
                    className="w-24 px-3 py-1.5 rounded-lg border border-[var(--border-ink)] bg-white font-mono text-xs font-bold text-[#1D1815]"
                    placeholder="Height"
                  />
                  <button
                    type="button"
                    onClick={handleCustomDimensionSubmit}
                    className="px-3 py-1.5 rounded-lg bg-[#FDE047] border border-[#1D1815] font-display font-black text-xs text-[#1D1815]"
                  >
                    Set
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: WATERMARK & BRANDING */}
          {activeTab === 'watermark' && (
            <div className="p-4 rounded-2xl bg-[var(--bg-page)] border-2 border-[var(--border-ink)] flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#FDE047] border-2 border-[#1D1815] shadow-[2px_2px_0px_#1D1815] flex items-center justify-center text-[#1D1815]">
                  <Stamp className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h4 className="font-display font-black text-sm text-[var(--text-main)]">
                    Watermark &amp; Branding: &ldquo;Kamal Sharma&rdquo;
                  </h4>
                  <p className="font-hand text-xs sm:text-sm text-[var(--text-muted)] font-bold">
                    6 Corner &amp; Center Placements • 8 Badge Styles • Non-destructive
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                {isWatermarked ? (
                  <>
                    <button
                      type="button"
                      onClick={onRemoveWatermark}
                      className="px-3.5 py-2 rounded-xl border-2 border-[#F43F5E] bg-[#F5A3B3]/40 hover:bg-[#F5A3B3] text-[#F43F5E] hover:text-[#1D1815] font-display font-black text-xs flex items-center gap-1.5 cursor-pointer transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Remove Watermark</span>
                    </button>

                    <button
                      type="button"
                      onClick={onOpenWatermarkModal}
                      className="px-4 py-2 rounded-xl bg-[#FDE047] hover:bg-[#FACC15] sketch-btn text-[#1D1815] font-display font-black text-xs flex items-center gap-1.5 cursor-pointer uppercase tracking-wider"
                    >
                      <Stamp className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Edit Watermark</span>
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={onOpenWatermarkModal}
                    className="px-5 py-2.5 rounded-xl bg-[#FDE047] hover:bg-[#FACC15] sketch-btn text-[#1D1815] font-display font-black text-xs flex items-center gap-2 cursor-pointer uppercase tracking-wider"
                  >
                    <Stamp className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>⚡ Stamp Watermark on Slides</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: SLIDE FILTERS & SELECTION */}
          {activeTab === 'filters' && (
            <div className="p-4 rounded-2xl bg-[var(--bg-page)] border-2 border-[var(--border-ink)] flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h4 className="font-display font-black text-sm text-[var(--text-main)]">
                  Export Slide Selection
                </h4>
                <p className="font-hand text-xs sm:text-sm text-[var(--text-muted)] font-bold">
                  Exclude Cover (Slide 1) or Outro (Last Slide) from your PDF and ZIP export
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Skip First Slide */}
                <label
                  className={`px-3.5 py-2 rounded-xl border-2 border-[var(--border-ink)] flex items-center gap-2 cursor-pointer select-none font-display font-black text-xs transition-all ${
                    skipFirstSlide
                      ? 'bg-[#F43F5E] text-white shadow-[2px_2px_0px_var(--shadow-ink)]'
                      : 'bg-[var(--bg-card)] text-[var(--text-main)]'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={skipFirstSlide}
                    onChange={(e) => setSkipFirstSlide(e.target.checked)}
                    className="w-4 h-4 accent-[#1D1815] cursor-pointer"
                  />
                  <span>{skipFirstSlide ? '🚫 Skipping Slide 1 (Cover)' : '✓ Include Slide 1 (Cover)'}</span>
                </label>

                {/* Skip Last Slide */}
                <label
                  className={`px-3.5 py-2 rounded-xl border-2 border-[var(--border-ink)] flex items-center gap-2 cursor-pointer select-none font-display font-black text-xs transition-all ${
                    skipLastSlide
                      ? 'bg-[#F43F5E] text-white shadow-[2px_2px_0px_var(--shadow-ink)]'
                      : 'bg-[var(--bg-card)] text-[var(--text-main)]'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={skipLastSlide}
                    onChange={(e) => setSkipLastSlide(e.target.checked)}
                    className="w-4 h-4 accent-[#1D1815] cursor-pointer"
                  />
                  <span>{skipLastSlide ? '🚫 Skipping Last Slide (Outro)' : '✓ Include Last Slide (Outro)'}</span>
                </label>
              </div>
            </div>
          )}

          {/* TAB 4: AI & CREATIVE TOOLS (With Viral Hook A/B Lab!) */}
          {activeTab === 'ai-tools' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Viral Hook A/B Lab */}
              <button
                type="button"
                onClick={onOpenHookLabModal}
                className="p-4 rounded-2xl bg-[#F5A3B3] hover:bg-[#FB7185] border-2 border-[#1D1815] shadow-[3px_3px_0px_#1D1815] text-[#1D1815] text-left transition-all cursor-pointer flex flex-col justify-between"
              >
                <div className="flex items-center gap-2 font-display font-black text-sm">
                  <Target className="w-4 h-4 stroke-[2.5]" />
                  <span>Viral Hook A/B Lab</span>
                </div>
                <span className="font-hand text-xs font-bold mt-1 opacity-90">
                  5 strategic scroll-stopping hooks
                </span>
              </button>

              {/* Cover Slide Generator */}
              <button
                type="button"
                onClick={onOpenCoverModal}
                className="p-4 rounded-2xl bg-[#FDE047] hover:bg-[#FACC15] border-2 border-[#1D1815] shadow-[3px_3px_0px_#1D1815] text-[#1D1815] text-left transition-all cursor-pointer flex flex-col justify-between"
              >
                <div className="flex items-center gap-2 font-display font-black text-sm">
                  <Wand2 className="w-4 h-4 stroke-[2.5]" />
                  <span>Cover Slide Generator</span>
                </div>
                <span className="font-hand text-xs font-bold mt-1 opacity-90">
                  Bubble typography sticker cover
                </span>
              </button>

              {/* Outro CTA Slide */}
              <button
                type="button"
                onClick={onOpenCtaModal}
                className="p-4 rounded-2xl bg-[#93C5FD] hover:bg-[#60A5FA] border-2 border-[#1D1815] shadow-[3px_3px_0px_#1D1815] text-[#1D1815] text-left transition-all cursor-pointer flex flex-col justify-between"
              >
                <div className="flex items-center gap-2 font-display font-black text-sm">
                  <PlusCircle className="w-4 h-4 stroke-[2.5]" />
                  <span>Outro CTA Slide</span>
                </div>
                <span className="font-hand text-xs font-bold mt-1 opacity-90">
                  Follow, Save &amp; Share ending slide
                </span>
              </button>

              {/* Gemini AI Caption */}
              <button
                type="button"
                onClick={onOpenCaptionModal}
                className="p-4 rounded-2xl bg-[#A7F3D0] hover:bg-[#6EE7B7] border-2 border-[#1D1815] shadow-[3px_3px_0px_#1D1815] text-[#1D1815] text-left transition-all cursor-pointer flex flex-col justify-between"
              >
                <div className="flex items-center gap-2 font-display font-black text-sm">
                  <Sparkles className="w-4 h-4 stroke-[2.5]" />
                  <span>Gemini AI Caption</span>
                </div>
                <span className="font-hand text-xs font-bold mt-1 opacity-90">
                  Vision scanned LinkedIn post
                </span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
