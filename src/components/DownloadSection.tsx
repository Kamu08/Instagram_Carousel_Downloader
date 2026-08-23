'use client';

import React, { useState } from 'react';
import {
  Download,
  RotateCcw,
  FileArchive,
  CheckCircle2,
  Loader2,
  Layers,
  FileText,
  Sparkles,
  Stamp,
  SlidersHorizontal,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { CarouselSlide } from '@/lib/types';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { generateLinkedInPdf } from '@/lib/pdf-generator';

interface DownloadSectionProps {
  slides: CarouselSlide[];
  onReset: () => void;
  onOpenCaptionModal: () => void;
  onOpenWatermarkModal: () => void;
}

export function DownloadSection({
  slides,
  onReset,
  onOpenCaptionModal,
  onOpenWatermarkModal,
}: DownloadSectionProps) {
  const [isZipping, setIsZipping] = useState(false);
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);
  const [downloadSuccessType, setDownloadSuccessType] = useState<'pdf' | 'zip' | null>(null);

  // Skip First / Last Slide Export Options
  const [skipFirstSlide, setSkipFirstSlide] = useState(false);
  const [skipLastSlide, setSkipLastSlide] = useState(false);

  // Filter slides for export
  const exportSlides = slides.filter((_, idx) => {
    if (idx === 0 && skipFirstSlide) return false;
    if (idx === slides.length - 1 && skipLastSlide) return false;
    return true;
  });

  const totalBytes = exportSlides.reduce((acc, s) => acc + s.sizeBytes, 0);
  const totalMb = (totalBytes / (1024 * 1024)).toFixed(1);

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.7 },
        colors: ['#FDE047', '#F5A3B3', '#93C5FD', '#A7F3D0', '#1D1815'],
      });
    } catch {
      // ignore
    }
  };

  const handleDownloadPdf = async () => {
    if (exportSlides.length === 0 || isPdfGenerating) {
      alert('Please select at least 1 slide to export.');
      return;
    }

    setIsPdfGenerating(true);
    setDownloadSuccessType(null);

    try {
      const pdfBlob = await generateLinkedInPdf(exportSlides);
      saveAs(pdfBlob, 'linkedin-carousel.pdf');
      setDownloadSuccessType('pdf');
      triggerConfetti();
    } catch (err: any) {
      console.error('PDF generation error:', err);
      alert('Failed to generate LinkedIn PDF document.');
    } finally {
      setIsPdfGenerating(false);
    }
  };

  const handleDownloadZip = async () => {
    if (exportSlides.length === 0 || isZipping) {
      alert('Please select at least 1 slide to export.');
      return;
    }

    setIsZipping(true);
    setDownloadSuccessType(null);

    try {
      const zip = new JSZip();

      // Ensure proper 01, 02, ... sequential numbering
      exportSlides.forEach((slide, idx) => {
        const slideNumber = String(idx + 1).padStart(2, '0');
        const filename = `carousel-${slideNumber}.png`;
        const base64Data = slide.dataUrl.replace(/^data:image\/\w+;base64,/, '');
        zip.file(filename, base64Data, { base64: true });
      });

      const content = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 },
      });

      saveAs(content, 'linkedin-carousel.zip');
      setDownloadSuccessType('zip');
      triggerConfetti();
    } catch (err) {
      console.error('Client zip generation failed, falling back to server route:', err);
      try {
        const res = await fetch('/api/download-zip', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slides: exportSlides }),
        });

        if (!res.ok) throw new Error('Server ZIP download failed');
        const blob = await res.blob();
        saveAs(blob, 'linkedin-carousel.zip');
        setDownloadSuccessType('zip');
        triggerConfetti();
      } catch (fallbackErr) {
        console.error('Fallback ZIP failed:', fallbackErr);
        alert('Failed to create ZIP download. Please download images individually.');
      }
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="w-full sketch-card p-6 sm:p-8 relative space-y-6">
      <div className="tape-top tape-pink" />

      {/* 1. Skip First / Last Slide Export Options Bar */}
      {slides.length > 1 && (
        <div className="p-3.5 rounded-2xl bg-[var(--bg-page)] border-2 border-[var(--border-ink)] flex flex-wrap items-center justify-between gap-3 text-xs font-display">
          <div className="flex items-center gap-2 text-[var(--text-main)] font-black">
            <SlidersHorizontal className="w-4 h-4 stroke-[2.5]" />
            <span>Export Filter Options:</span>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {/* Skip First Slide Toggle */}
            <label className="flex items-center gap-2 cursor-pointer select-none font-bold text-[var(--text-main)] hover:text-[#F43F5E] transition-colors">
              <input
                type="checkbox"
                checked={skipFirstSlide}
                onChange={(e) => setSkipFirstSlide(e.target.checked)}
                className="w-4 h-4 accent-[#1D1815] cursor-pointer rounded"
              />
              <span>Skip First Slide (Cover)</span>
            </label>

            {/* Skip Last Slide Toggle */}
            <label className="flex items-center gap-2 cursor-pointer select-none font-bold text-[var(--text-main)] hover:text-[#F43F5E] transition-colors">
              <input
                type="checkbox"
                checked={skipLastSlide}
                onChange={(e) => setSkipLastSlide(e.target.checked)}
                className="w-4 h-4 accent-[#1D1815] cursor-pointer rounded"
              />
              <span>Skip Last Slide (Outro)</span>
            </label>

            {(skipFirstSlide || skipLastSlide) && (
              <span className="font-marker text-xs px-2 py-0.5 rounded-full bg-[#FDE047] text-[#1D1815] border border-[#1D1815]">
                Exporting {exportSlides.length} of {slides.length} slides
              </span>
            )}
          </div>
        </div>
      )}

      {/* 2. Main Summary & Action Deck */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
        {/* Left: Summary Info */}
        <div className="flex items-center gap-4 sm:gap-5 text-center lg:text-left">
          <div className="w-16 h-16 rounded-2xl bg-[#FDE047] border-2 border-[#1D1815] shadow-[3px_3px_0px_#1D1815] flex items-center justify-center text-[#1D1815] shrink-0">
            <FileArchive className="w-8 h-8 stroke-[2.5]" />
          </div>

          <div>
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2.5">
              <h3 className="font-display font-black text-[var(--text-main)] text-xl sm:text-2xl tracking-tight">
                Your Carousel is Ready! ✨
              </h3>
              <span className="font-marker text-xs px-2.5 py-0.5 rounded-full bg-[#A7F3D0] text-[#1D1815] border border-[#1D1815]">
                ✓ LinkedIn Document Ready
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 mt-2 text-xs font-bold text-[var(--text-muted)] font-mono">
              <span className="flex items-center gap-1.5 text-[var(--text-main)]">
                <Layers className="w-3.5 h-3.5 stroke-[2.5]" />
                {exportSlides.length} Sequenced Slides
              </span>
              <span>•</span>
              <span>~{totalMb} MB Total Master PNGs</span>
              <span>•</span>
              <span className="text-[#F43F5E] font-extrabold font-hand text-base">Interactive LinkedIn PDF available</span>
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex flex-wrap items-center justify-center lg:justify-end gap-3 w-full lg:w-auto">
          {/* Watermark Button */}
          <button
            type="button"
            onClick={onOpenWatermarkModal}
            className="px-4 py-3.5 rounded-2xl bg-[#FAF8F3] dark:bg-[#1C1916] hover:bg-[#FDE047] dark:hover:text-[#1D1815] border-2 border-[var(--border-ink)] shadow-[2px_2px_0px_var(--shadow-ink)] hover:translate-x-[1px] hover:translate-y-[1px] text-[var(--text-main)] font-display font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Stamp className="w-4 h-4 stroke-[2.5]" />
            <span>Watermark</span>
          </button>

          {/* AI Caption Button */}
          <button
            type="button"
            onClick={onOpenCaptionModal}
            className="px-4 py-3.5 rounded-2xl bg-[#A7F3D0] hover:bg-[#6EE7B7] border-2 border-[#1D1815] shadow-[2px_2px_0px_#1D1815] hover:shadow-[1px_1px_0px_#1D1815] hover:translate-x-[1px] hover:translate-y-[1px] text-[#1D1815] font-display font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 stroke-[2.5]" />
            <span>AI Caption</span>
          </button>

          {/* Download ZIP */}
          <button
            type="button"
            disabled={isZipping}
            onClick={handleDownloadZip}
            className="px-5 py-3.5 rounded-2xl bg-[#93C5FD] hover:bg-[#60A5FA] border-2 border-[#1D1815] shadow-[3px_3px_0px_#1D1815] hover:shadow-[1px_1px_0px_#1D1815] hover:translate-x-[1px] hover:translate-y-[1px] text-[#1D1815] font-display font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 uppercase tracking-wider"
          >
            {isZipping ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin stroke-[3]" />
                <span>Zipping...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4 stroke-[2.5]" />
                <span>Download ZIP</span>
              </>
            )}
          </button>

          {/* Primary Action: Download LinkedIn Carousel PDF */}
          <button
            type="button"
            disabled={isPdfGenerating}
            onClick={handleDownloadPdf}
            className="px-7 py-3.5 rounded-2xl bg-[#FDE047] hover:bg-[#FACC15] sketch-btn text-[#1D1815] font-display font-black text-sm sm:text-base transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-60 uppercase tracking-wider"
          >
            {isPdfGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin stroke-[3]" />
                <span>Building PDF...</span>
              </>
            ) : downloadSuccessType === 'pdf' ? (
              <>
                <CheckCircle2 className="w-5 h-5 stroke-[3] text-[#10B981]" />
                <span>PDF Ready!</span>
              </>
            ) : (
              <>
                <FileText className="w-5 h-5 stroke-[2.5]" />
                <span>Download LinkedIn PDF</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
