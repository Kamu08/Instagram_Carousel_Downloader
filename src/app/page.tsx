'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { UrlInputForm } from '@/components/UrlInputForm';
import { StudioCommandDeck } from '@/components/StudioCommandDeck';
import { CarouselGrid } from '@/components/CarouselGrid';
import { DownloadSection } from '@/components/DownloadSection';
import { PreviewModal } from '@/components/PreviewModal';
import { CtaSlideModal } from '@/components/CtaSlideModal';
import { CoverSlideModal } from '@/components/CoverSlideModal';
import { CaptionModal } from '@/components/CaptionModal';
import { WatermarkModal } from '@/components/WatermarkModal';
import { HistoryDrawer } from '@/components/HistoryDrawer';
import { Footer } from '@/components/Footer';
import {
  CarouselSlide,
  LinkedInOptions,
  ProcessingProgressStep,
} from '@/lib/types';
import {
  saveCarouselToHistory,
  getSavedTheme,
  saveTheme,
} from '@/lib/storage';
import { removeWatermarkFromAllSlides } from '@/lib/watermark';
import { saveAs } from 'file-saver';

const DEFAULT_LINKEDIN_OPTIONS: LinkedInOptions = {
  preset: 'original',
  fitMode: 'contain',
  backgroundMode: 'white',
};

const INITIAL_PROGRESS_STEPS: ProcessingProgressStep[] = [
  { id: '1', label: 'Fetching Instagram post & discovering slides...', status: 'pending' },
  { id: '2', label: 'Downloading all carousel images...', status: 'pending' },
  { id: '3', label: 'Converting images to PNG (HEIC / WebP / JPEG)...', status: 'pending' },
  { id: '4', label: 'Preparing master files & studio preview...', status: 'pending' },
];

export default function Home() {
  const [slides, setSlides] = useState<CarouselSlide[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [progressSteps, setProgressSteps] = useState<ProcessingProgressStep[]>(INITIAL_PROGRESS_STEPS);
  const [selectedSlide, setSelectedSlide] = useState<CarouselSlide | null>(null);
  const [linkedinOptions, setLinkedinOptions] = useState<LinkedInOptions>(DEFAULT_LINKEDIN_OPTIONS);
  const [isApplyingTransformations, setIsApplyingTransformations] = useState(false);

  // Skip First / Last Slide Export State
  const [skipFirstSlide, setSkipFirstSlide] = useState(false);
  const [skipLastSlide, setSkipLastSlide] = useState(false);

  // Studio Features State
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isCtaModalOpen, setIsCtaModalOpen] = useState(false);
  const [isCoverModalOpen, setIsCoverModalOpen] = useState(false);
  const [isCaptionModalOpen, setIsCaptionModalOpen] = useState(false);
  const [isWatermarkModalOpen, setIsWatermarkModalOpen] = useState(false);
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);

  // Initialize theme from storage
  useEffect(() => {
    const saved = getSavedTheme();
    setTheme(saved);
    if (saved === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const handleToggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    saveTheme(next);
    if (next === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const resetState = () => {
    setSlides([]);
    setIsLoading(false);
    setErrorMessage(null);
    setProgressSteps(INITIAL_PROGRESS_STEPS);
    setSelectedSlide(null);
    setLinkedinOptions(DEFAULT_LINKEDIN_OPTIONS);
    setSkipFirstSlide(false);
    setSkipLastSlide(false);
  };

  const updateProgress = (stepId: string, status: ProcessingProgressStep['status'], detail?: string) => {
    setProgressSteps((prev) =>
      prev.map((s) => (s.id === stepId ? { ...s, status, detail } : s))
    );
  };

  const handleFetchUrl = async (url: string) => {
    setIsLoading(true);
    setErrorMessage(null);
    setProgressSteps(INITIAL_PROGRESS_STEPS);

    updateProgress('1', 'in-progress');

    try {
      setTimeout(() => updateProgress('1', 'completed', '✓ Carousel post found with full media tree'), 400);
      setTimeout(() => updateProgress('2', 'in-progress'), 500);

      const res = await fetch('/api/fetch-carousel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(
          data.error ||
            "We couldn't process this Instagram post. Please make sure the post is publicly accessible and try again."
        );
      }

      updateProgress('2', 'completed', `✓ ${data.slideCount} carousel images downloaded`);
      updateProgress('3', 'completed', `✓ ${data.slideCount}/${data.slideCount} images converted to lossless PNG`);
      updateProgress('4', 'completed', '✓ Complete');

      setSlides(data.slides);
      saveCarouselToHistory(data.slides, url);
    } catch (err: any) {
      console.error('Fetch error:', err);
      setErrorMessage(
        err.message ||
          "We couldn't process this Instagram post. Please make sure the post is publicly accessible and try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadSample = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setProgressSteps(INITIAL_PROGRESS_STEPS);

    updateProgress('1', 'completed', '✓ Sample post loaded');
    updateProgress('2', 'in-progress');

    try {
      const res = await fetch('/api/fetch-carousel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isSample: true }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate sample carousel.');
      }

      updateProgress('2', 'completed', `✓ ${data.slideCount} images downloaded`);
      updateProgress('3', 'completed', `✓ ${data.slideCount}/${data.slideCount} images converted to PNG`);
      updateProgress('4', 'completed', '✓ Complete');

      setSlides(data.slides);
      saveCarouselToHistory(data.slides, undefined, '5 AI Tools for Product Designers (Sample)');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load sample.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadFiles = async (fileList: FileList) => {
    setIsLoading(true);
    setErrorMessage(null);
    setProgressSteps(INITIAL_PROGRESS_STEPS);

    updateProgress('1', 'completed', `✓ ${fileList.length} files selected`);
    updateProgress('2', 'in-progress');

    try {
      const formData = new FormData();
      for (let i = 0; i < fileList.length; i++) {
        formData.append('files', fileList[i]);
      }

      const res = await fetch('/api/upload-images', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to process uploaded files.');
      }

      updateProgress('2', 'completed', `✓ ${data.slideCount} images downloaded`);
      updateProgress('3', 'completed', `✓ ${data.slideCount}/${data.slideCount} converted to PNG`);
      updateProgress('4', 'completed', '✓ Complete');

      setSlides(data.slides);
      saveCarouselToHistory(data.slides, undefined, `Uploaded Carousel (${data.slideCount} Files)`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to upload and process files.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyTransformations = async () => {
    if (slides.length === 0 || isApplyingTransformations) return;

    setIsApplyingTransformations(true);
    try {
      const res = await fetch('/api/process-slide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slides,
          options: linkedinOptions,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to apply LinkedIn formatting.');
      }

      setSlides(data.slides);
    } catch (err: any) {
      alert(err.message || 'Failed to apply LinkedIn transformations.');
    } finally {
      setIsApplyingTransformations(false);
    }
  };

  const handleDownloadSingle = (slide: CarouselSlide, index: number) => {
    const pageNumber = index + 1;
    const filename = `carousel-${String(pageNumber).padStart(2, '0')}.png`;

    const byteString = atob(slide.dataUrl.split(',')[1]);
    const mimeString = slide.dataUrl.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    const blob = new Blob([ab], { type: mimeString });
    saveAs(blob, filename);
  };

  const handleRemoveSlide = (id: string) => {
    const updated = slides
      .filter((s) => s.id !== id)
      .map((s, idx) => ({
        ...s,
        currentIndex: idx,
        filename: `carousel-${String(idx + 1).padStart(2, '0')}.png`,
      }));
    setSlides(updated);
  };

  const handleUpdateSlide = (updatedSlide: CarouselSlide) => {
    setSlides((prev) =>
      prev.map((s) => (s.id === updatedSlide.id ? updatedSlide : s))
    );
  };

  const handleInsertCtaSlide = (newSlide: CarouselSlide, position: 'start' | 'end') => {
    const nextSlides = position === 'start' ? [newSlide, ...slides] : [...slides, newSlide];
    const reIndexed = nextSlides.map((s, idx) => ({
      ...s,
      currentIndex: idx,
      filename: `carousel-${String(idx + 1).padStart(2, '0')}.png`,
    }));
    setSlides(reIndexed);
  };

  const handleApplyCoverSlide = (coverSlide: CarouselSlide, mode: 'replace-first' | 'prepend') => {
    let nextSlides: CarouselSlide[];
    if (mode === 'replace-first' && slides.length > 0) {
      nextSlides = [coverSlide, ...slides.slice(1)];
    } else {
      nextSlides = [coverSlide, ...slides];
    }
    const reIndexed = nextSlides.map((s, idx) => ({
      ...s,
      currentIndex: idx,
      filename: `carousel-${String(idx + 1).padStart(2, '0')}.png`,
    }));
    setSlides(reIndexed);
  };

  const handleApplyWatermark = (watermarkedSlides: CarouselSlide[]) => {
    setSlides(watermarkedSlides);
  };

  const handleRemoveWatermark = () => {
    const reverted = removeWatermarkFromAllSlides(slides);
    setSlides(reverted);
  };

  const handleRestoreFromHistory = (restoredSlides: CarouselSlide[]) => {
    setSlides(restoredSlides);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-page)] text-[var(--text-main)] selection:bg-[#FDE047] selection:text-[#1D1815] relative overflow-x-hidden transition-colors">
      {/* Top Navbar */}
      <Navbar
        onReset={resetState}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        onOpenHistory={() => setIsHistoryDrawerOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 relative z-10">
        {slides.length === 0 ? (
          /* Step 1: Input URL / Drag Drop */
          <UrlInputForm
            onSubmitUrl={handleFetchUrl}
            onLoadSample={handleLoadSample}
            onUploadFiles={handleUploadFiles}
            isLoading={isLoading}
            progressSteps={progressSteps}
            errorMessage={errorMessage}
            onClearError={() => setErrorMessage(null)}
          />
        ) : (
          /* Step 2: Unified Command Deck, Grid, Tools & Export */
          <div className="space-y-6 animate-fadeIn">
            {/* Unified Pro Command Deck (Idea 1) */}
            <StudioCommandDeck
              slides={slides}
              linkedinOptions={linkedinOptions}
              onLinkedinOptionsChange={setLinkedinOptions}
              onApplyTransformations={handleApplyTransformations}
              isApplyingTransformations={isApplyingTransformations}
              skipFirstSlide={skipFirstSlide}
              setSkipFirstSlide={setSkipFirstSlide}
              skipLastSlide={skipLastSlide}
              setSkipLastSlide={setSkipLastSlide}
              onOpenWatermarkModal={() => setIsWatermarkModalOpen(true)}
              onRemoveWatermark={handleRemoveWatermark}
              onOpenCoverModal={() => setIsCoverModalOpen(true)}
              onOpenCtaModal={() => setIsCtaModalOpen(true)}
              onOpenCaptionModal={() => setIsCaptionModalOpen(true)}
            />

            {/* Reorderable Carousel Preview Grid */}
            <CarouselGrid
              slides={slides}
              onSlidesChange={setSlides}
              onRemoveSlide={handleRemoveSlide}
              onPreviewSlide={(slide) => setSelectedSlide(slide)}
              onDownloadSingle={handleDownloadSingle}
              onUpdateSlide={handleUpdateSlide}
              onOpenCtaModal={() => setIsCtaModalOpen(true)}
              onOpenCoverModal={() => setIsCoverModalOpen(true)}
              onOpenCaptionModal={() => setIsCaptionModalOpen(true)}
              onOpenWatermarkModal={() => setIsWatermarkModalOpen(true)}
            />

            {/* Download Bottom Deck (PDF + ZIP + AI Caption + Watermark + Skip Filters) */}
            <DownloadSection
              slides={slides}
              onReset={resetState}
              onOpenCaptionModal={() => setIsCaptionModalOpen(true)}
              onOpenWatermarkModal={() => setIsWatermarkModalOpen(true)}
              skipFirstSlide={skipFirstSlide}
              setSkipFirstSlide={setSkipFirstSlide}
              skipLastSlide={skipLastSlide}
              setSkipLastSlide={setSkipLastSlide}
            />
          </div>
        )}
      </main>

      {/* Modal for full screen inspection */}
      <PreviewModal
        slides={slides}
        selectedSlide={selectedSlide}
        onClose={() => setSelectedSlide(null)}
        onSelectSlide={setSelectedSlide}
        onDownloadSingle={handleDownloadSingle}
      />

      {/* Modal for Viral Pop Sticker Cover Slide Generator */}
      <CoverSlideModal
        isOpen={isCoverModalOpen}
        onClose={() => setIsCoverModalOpen(false)}
        onApplyCoverSlide={handleApplyCoverSlide}
      />

      {/* Modal for Custom Intro / Outro CTA Slide */}
      <CtaSlideModal
        isOpen={isCtaModalOpen}
        onClose={() => setIsCtaModalOpen(false)}
        onInsertSlide={handleInsertCtaSlide}
      />

      {/* Modal for Gemini AI LinkedIn Caption & Hashtags Generator */}
      <CaptionModal
        isOpen={isCaptionModalOpen}
        onClose={() => setIsCaptionModalOpen(false)}
        slides={slides}
      />

      {/* Modal for Slide Watermarking & Branding Stamp */}
      <WatermarkModal
        isOpen={isWatermarkModalOpen}
        onClose={() => setIsWatermarkModalOpen(false)}
        slides={slides}
        onApplyWatermark={handleApplyWatermark}
        onRemoveWatermark={handleRemoveWatermark}
      />

      {/* Drawer for Saved Carousel History */}
      <HistoryDrawer
        isOpen={isHistoryDrawerOpen}
        onClose={() => setIsHistoryDrawerOpen(false)}
        onRestoreCarousel={handleRestoreFromHistory}
      />

      {/* Footer */}
      <Footer />
    </div>
  );
}
