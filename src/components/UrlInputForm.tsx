'use client';

import React, { useState, useRef } from 'react';
import {
  Link2,
  ArrowRight,
  Sparkles,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Clipboard,
  X,
  Flame,
  MousePointerClick,
} from 'lucide-react';
import { ProcessingProgressStep } from '@/lib/types';

interface UrlInputFormProps {
  onSubmitUrl: (url: string) => Promise<void>;
  onLoadSample: () => Promise<void>;
  onUploadFiles: (files: FileList) => Promise<void>;
  isLoading: boolean;
  progressSteps: ProcessingProgressStep[];
  errorMessage: string | null;
  onClearError: () => void;
}

export function UrlInputForm({
  onSubmitUrl,
  onLoadSample,
  onUploadFiles,
  isLoading,
  progressSteps,
  errorMessage,
  onClearError,
}: UrlInputFormProps) {
  const [url, setUrl] = useState('');
  const [inputError, setInputError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateUrl = (value: string): boolean => {
    if (!value.trim()) {
      setInputError('Please paste an Instagram post URL.');
      return false;
    }

    const isValid = /(?:instagram\.com\/(?:p|reel|tv|share\/p)\/|instagr\.am\/p\/)[A-Za-z0-9_-]+/i.test(
      value.trim()
    );

    if (!isValid) {
      setInputError(
        'Please enter a valid Instagram URL (e.g. https://www.instagram.com/p/DanrSJfkggJ/).'
      );
      return false;
    }

    setInputError(null);
    return true;
  };

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrl(text);
        if (inputError) setInputError(null);
        if (errorMessage) onClearError();
      }
    } catch {
      // ignore
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    onClearError();

    if (!validateUrl(url)) return;

    await onSubmitUrl(url.trim());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    onClearError();

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await onUploadFiles(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onClearError();
      await onUploadFiles(e.target.files);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Hero Header */}
      <div className="text-center mb-10 sm:mb-12 relative">
        {/* Floating doodle badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#F5A3B3] border-2 border-[#1D1815] shadow-[2.5px_2.5px_0px_#1D1815] text-[#1D1815] text-xs font-black uppercase tracking-wider mb-5 rotate-[-1deg]">
          <Sparkles className="w-4 h-4 text-[#1D1815]" />
          <span>INSTAGRAM → LINKEDIN CAROUSEL STUDIO</span>
          <span className="font-hand text-base lowercase font-bold text-[#1D1815]">• 100% automated</span>
        </div>

        {/* Dynamic Title with Marker Highlights */}
        <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-black text-[var(--text-main)] tracking-tight leading-[1.15]">
          Turn Instagram Carousels into{' '}
          <span className="marker-yellow">LinkedIn-Ready PNGs</span>
        </h1>

        <p className="mt-4 font-marker text-xl sm:text-2xl text-[var(--text-muted)] max-w-2xl mx-auto leading-relaxed">
          Paste any carousel URL to extract all slides in seconds. Converts HEIC & WebP to master PNGs, ready for LinkedIn carousel document posts! 🚀
        </p>

        {/* Feature Sketch Badges */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-xs font-black">
          {[
            { text: '⚡ All Slides Auto-Extracted', bg: 'bg-[#FDE047]' },
            { text: '🎨 HEIC / JPEG → Master PNG', bg: 'bg-[#93C5FD]' },
            { text: '📐 4:5 Portrait (1080×1350) Ready', bg: 'bg-[#A7F3D0]' },
            { text: '📦 Sequential ZIP Export', bg: 'bg-[#FDBA74]' },
          ].map((item, i) => (
            <span
              key={i}
              className={`px-3.5 py-1.5 rounded-xl ${item.bg} border-2 border-[#1D1815] shadow-[2px_2px_0px_#1D1815] text-[#1D1815] flex items-center gap-1.5`}
            >
              {item.text}
            </span>
          ))}
        </div>
      </div>

      {/* Main Sketch Card */}
      <div className="relative sketch-card p-6 sm:p-10">
        {/* Top Paper Tape */}
        <div className="tape-top tape-pink" />

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <label
                htmlFor="instagram-url"
                className="font-display text-base font-extrabold text-[var(--text-main)] flex items-center gap-2"
              >
                <span>Paste Instagram Carousel URL</span>
                <span className="font-hand text-lg font-bold text-[#F43F5E]">(public post link)</span>
              </label>

              {/* 1-Click Paste Button */}
              <button
                type="button"
                onClick={handlePasteFromClipboard}
                className="font-marker text-sm font-bold text-[#1D1815] bg-[#93C5FD] px-3 py-1 rounded-xl border border-[#1D1815] shadow-[1.5px_1.5px_0px_#1D1815] hover:bg-[#60A5FA] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer flex items-center gap-1.5 transition-all"
              >
                <Clipboard className="w-3.5 h-3.5" />
                <span>Paste Link</span>
              </button>
            </div>

            <div className="relative flex items-center">
              <div className="absolute left-4 sm:left-5 flex items-center pointer-events-none text-[var(--text-main)] z-10">
                <Link2 className="w-6 h-6 stroke-[2.5]" />
              </div>
              <input
                id="instagram-url"
                type="url"
                disabled={isLoading}
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  if (inputError) setInputError(null);
                  if (errorMessage) onClearError();
                }}
                placeholder="https://www.instagram.com/p/DanrSJfkggJ/"
                className={`w-full pl-14 sm:pl-16 pr-12 py-4 sm:py-4.5 bg-[var(--input-bg)] border-2 border-[var(--border-ink)] rounded-2xl text-[var(--text-main)] placeholder-[var(--text-muted)] font-mono text-sm sm:text-base font-bold shadow-[3px_3px_0px_var(--shadow-ink)] focus:outline-none transition-all ${
                  inputError || errorMessage
                    ? 'border-[#F43F5E] bg-red-50 dark:bg-red-950/30'
                    : 'focus:border-[var(--border-ink)]'
                }`}
              />

              {/* Clear button */}
              {url && !isLoading && (
                <button
                  type="button"
                  onClick={() => {
                    setUrl('');
                    if (inputError) setInputError(null);
                  }}
                  className="absolute right-4 flex items-center text-[var(--text-muted)] hover:text-[var(--text-main)] cursor-pointer p-1"
                >
                  <X className="w-5 h-5 stroke-[2.5]" />
                </button>
              )}
            </div>

            {inputError && (
              <p className="mt-3 text-sm font-bold text-[#F43F5E] flex items-center gap-1.5 animate-fadeIn">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {inputError}
              </p>
            )}
          </div>

          {/* Primary Action Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 sm:py-5 px-8 bg-[#FDE047] hover:bg-[#FACC15] sketch-btn text-[#1D1815] font-display font-black text-lg sm:text-xl flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group uppercase tracking-wider"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin text-[#1D1815]" />
                <span>Extracting All Carousel Slides...</span>
              </>
            ) : (
              <>
                <span>Download Carousel</span>
                <ArrowRight className="w-6 h-6 stroke-[3] group-hover:translate-x-2 transition-transform" />
              </>
            )}
          </button>
        </form>

        {/* Interactive Quick Sample Cards */}
        <div className="mt-8 pt-6 border-t-2 border-dashed border-[var(--border-ink)]/20">
          <p className="font-hand text-xl font-bold text-[var(--text-main)] mb-3 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#F43F5E]" />
            <span>Want to test right now? Click to load sample:</span>
          </p>

          <button
            type="button"
            disabled={isLoading}
            onClick={onLoadSample}
            className="w-full p-4 rounded-2xl bg-[#93C5FD]/30 hover:bg-[#93C5FD]/60 border-2 border-[var(--border-ink)] shadow-[3px_3px_0px_var(--shadow-ink)] flex items-center justify-between text-left group cursor-pointer transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_var(--shadow-ink)] disabled:opacity-50"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-[#FDE047] border-2 border-[#1D1815] shadow-[2px_2px_0px_#1D1815] flex items-center justify-center text-[#1D1815] group-hover:rotate-6 transition-transform shrink-0">
                <Flame className="w-6 h-6 text-[#EA580C]" />
              </div>
              <div>
                <h4 className="font-display text-base font-extrabold text-[var(--text-main)]">
                  5 AI Tools for Product Designers in 2026
                </h4>
                <p className="font-marker text-sm text-[var(--text-muted)]">
                  7 high-res slides • 4:5 LinkedIn Portrait format
                </p>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[var(--bg-card)] border border-[var(--border-ink)] shadow-[1.5px_1.5px_0px_var(--shadow-ink)] text-xs font-black text-[var(--text-main)]">
              <MousePointerClick className="w-3.5 h-3.5" />
              <span>Try Demo</span>
            </div>
          </button>
        </div>

        {/* Dropzone Fallback */}
        <div className="mt-6 pt-6 border-t-2 border-dashed border-[var(--border-ink)]/20">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed border-[var(--border-ink)] rounded-2xl p-6 text-center cursor-pointer transition-all ${
              isDragging
                ? 'bg-[#FDE047]/60 scale-[1.01]'
                : 'bg-[var(--input-bg)] hover:shadow-[3px_3px_0px_var(--shadow-ink)]'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.heic,.heif,.webp,.png,.jpg,.jpeg"
              onChange={handleFileInputChange}
              className="hidden"
            />
            <div className="flex flex-col items-center justify-center gap-2">
              <div className="w-12 h-12 rounded-2xl bg-[#A7F3D0] border-2 border-[#1D1815] shadow-[2px_2px_0px_#1D1815] flex items-center justify-center text-[#1D1815]">
                <UploadCloud className="w-6 h-6 stroke-[2.5]" />
              </div>
              <p className="font-display text-sm sm:text-base font-extrabold text-[var(--text-main)]">
                <span className="marker-pink">Click to upload images</span> or drag & drop HEIC / WebP / JPEG files
              </p>
              <p className="font-hand text-lg text-[var(--text-muted)] font-bold">
                offline manual fallback • converts all files into ordered PNG slides!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Live Pipeline Progress Modal / Card */}
      {isLoading && (
        <div className="mt-8 sketch-card p-6 sm:p-8 relative overflow-hidden animate-fadeIn">
          <div className="tape-top tape-blue" />

          <div className="flex items-center gap-3.5 mb-6 pb-4 border-b-2 border-dashed border-[var(--border-ink)]/20">
            <div className="w-11 h-11 rounded-2xl bg-[#FDE047] border-2 border-[#1D1815] shadow-[2px_2px_0px_#1D1815] flex items-center justify-center text-[#1D1815]">
              <Loader2 className="w-6 h-6 animate-spin stroke-[2.5]" />
            </div>
            <div>
              <h3 className="font-display font-extrabold text-[var(--text-main)] text-lg">
                Extracting & Processing Carousel
              </h3>
              <p className="font-hand text-base text-[var(--text-muted)] font-bold">
                Traversing all slides, decoding formats, converting to PNG master files
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {progressSteps.map((step, idx) => (
              <div
                key={step.id}
                className={`flex items-start gap-4 p-3.5 rounded-2xl border-2 border-[var(--border-ink)] transition-all ${
                  step.status === 'in-progress'
                    ? 'bg-[#FDE047]/60 text-[#1D1815] shadow-[3px_3px_0px_var(--shadow-ink)]'
                    : step.status === 'completed'
                    ? 'bg-[#A7F3D0]/60 text-[#1D1815] shadow-[2px_2px_0px_var(--shadow-ink)]'
                    : 'bg-[var(--input-bg)] opacity-60'
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  {step.status === 'completed' ? (
                    <div className="w-6 h-6 rounded-full bg-[#10B981] border-2 border-[#1D1815] text-white flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 stroke-[3]" />
                    </div>
                  ) : step.status === 'in-progress' ? (
                    <div className="w-6 h-6 rounded-full bg-[#F43F5E] border-2 border-[#1D1815] text-white flex items-center justify-center">
                      <Loader2 className="w-4 h-4 animate-spin stroke-[3]" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full border-2 border-[var(--border-ink)] bg-[var(--bg-card)] flex items-center justify-center text-xs font-black text-[var(--text-main)]">
                      {idx + 1}
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <p className="font-display text-sm font-bold text-[var(--text-main)]">
                    {step.label}
                  </p>
                  {step.detail && (
                    <p className="font-hand text-base font-bold text-[var(--text-muted)] mt-0.5">
                      {step.detail}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Global Error Banner */}
      {errorMessage && !isLoading && (
        <div className="mt-8 p-5 rounded-3xl bg-[#F5A3B3] border-2 border-[#1D1815] shadow-[4px_4px_0px_#1D1815] text-[#1D1815] flex items-start gap-4 animate-fadeIn">
          <div className="p-2 rounded-xl bg-white border-2 border-[#1D1815] shadow-[2px_2px_0px_#1D1815] text-[#F43F5E] shrink-0">
            <AlertCircle className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div className="flex-1">
            <p className="font-display font-black text-[#1D1815] text-base">Processing Notice</p>
            <p className="font-marker text-base text-[#1D1815] mt-1 leading-relaxed">
              {errorMessage}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
