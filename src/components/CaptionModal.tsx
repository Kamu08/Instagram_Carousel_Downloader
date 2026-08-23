'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Copy,
  Check,
  Loader2,
  Key,
  AlertCircle,
  Scan,
  Edit3,
} from 'lucide-react';
import { CarouselSlide } from '@/lib/types';

interface CaptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  slides: CarouselSlide[];
}

export function CaptionModal({
  isOpen,
  onClose,
  slides,
}: CaptionModalProps) {
  const [topic, setTopic] = useState('FAANG SQL & System Design Patterns');
  const [authorName, setAuthorName] = useState('Kamal Sharma');
  const [whatsappLink, setWhatsappLink] = useState('https://tinyurl.com/mwmbwytv');
  const [telegramLink, setTelegramLink] = useState('https://tinyurl.com/6p9un6b5');
  const [customContext, setCustomContext] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);

  const [generatedCaption, setGeneratedCaption] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Load custom API key from localStorage if saved
  useEffect(() => {
    try {
      const savedKey = localStorage.getItem('gemini_custom_api_key');
      if (savedKey) setApiKey(savedKey);
    } catch {
      // ignore
    }
  }, []);

  const handleApiKeyChange = (val: string) => {
    setApiKey(val);
    try {
      localStorage.setItem('gemini_custom_api_key', val);
    } catch {
      // ignore
    }
  };

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      // Send slide images for vision scan
      const res = await fetch('/api/generate-caption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          slides,
          authorName,
          whatsappLink,
          telegramLink,
          customContext,
          clientApiKey: apiKey,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate caption.');
      }

      setGeneratedCaption(data.caption);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to generate AI caption. Please check your API key.');
      setShowApiKeyInput(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!generatedCaption) return;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(generatedCaption);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = generatedCaption;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.warn('Clipboard write failed:', e);
    }
  };

  const wordCount = generatedCaption ? generatedCaption.trim().split(/\s+/).length : 0;
  const charCount = generatedCaption.length;

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
              <Sparkles className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-black text-lg text-[var(--text-main)]">
                  Kamal Sharma AI Caption Studio
                </h3>
                <span className="font-marker text-xs px-2.5 py-0.5 rounded-full bg-[#A7F3D0] text-[#1D1815] border border-[#1D1815]">
                  Vision Scanned ✨
                </span>
                <span className="font-marker text-xs px-2 py-0.5 rounded-full bg-[#FDE047] text-[#1D1815] border border-[#1D1815]">
                  Live Editable Text ✍️
                </span>
              </div>
              <p className="font-hand text-base text-[var(--text-muted)] font-bold -mt-1">
                Full-length post with WhatsApp/Telegram footer &amp; 5 hashtags • Click to edit directly
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowApiKeyInput(!showApiKeyInput)}
              className="p-1.5 rounded-xl border border-[var(--border-ink)] text-[var(--text-main)] hover:bg-[#FDE047] hover:text-[#1D1815] transition-colors cursor-pointer"
              title="Configure API Key"
            >
              <Key className="w-4 h-4 stroke-[2.5]" />
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl border border-[var(--border-ink)] text-[var(--text-main)] hover:bg-[#F5A3B3] hover:text-[#1D1815] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* Optional Custom API Key Bar */}
        {showApiKeyInput && (
          <div className="px-6 py-3 bg-[#FDE047]/30 border-b-2 border-[var(--border-ink)] flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-display">
            <div className="flex items-center gap-2 text-[#1D1815] font-bold">
              <Key className="w-4 h-4" />
              <span>Gemini API Key:</span>
            </div>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => handleApiKeyChange(e.target.value)}
              placeholder="Paste custom Gemini API key (optional)"
              className="flex-1 w-full sm:w-auto px-3 py-1.5 rounded-xl border border-[#1D1815] bg-white font-mono text-xs text-[#1D1815] focus:outline-none"
            />
          </div>
        )}

        {/* Error Alert Bar */}
        {errorMessage && (
          <div className="px-6 py-3 bg-[#F43F5E]/15 border-b-2 border-[#F43F5E] flex items-center justify-between gap-2 text-xs font-display text-[#F43F5E]">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="font-bold">{errorMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="hover:underline font-black cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          {/* Form Settings */}
          <div className="lg:col-span-5 p-5 sm:p-6 overflow-y-auto custom-scrollbar space-y-4 border-b lg:border-b-0 lg:border-r-2 border-[var(--border-ink)]/20">
            {/* Visual Scan Badge */}
            <div className="p-3.5 rounded-2xl bg-[#A7F3D0]/35 border-2 border-[#1D1815] text-xs font-display">
              <div className="flex items-center gap-2 font-black text-[#1D1815]">
                <Scan className="w-4 h-4 text-[#059669]" />
                <span>Multimodal Vision Active</span>
              </div>
              <p className="font-hand text-sm font-bold text-[#1D1815]/80 mt-1">
                Scans all {slides.length} slides to extract key concepts, tools &amp; architectures.
              </p>
            </div>

            <div>
              <label className="block font-display text-xs font-black uppercase text-[var(--text-muted)] mb-1.5">
                Topic / Carousel Title (Optional Context)
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. 25 System Design Patterns"
                className="w-full px-3.5 py-2.5 rounded-xl border-2 border-[var(--border-ink)] bg-[var(--input-bg)] font-display font-bold text-sm text-[var(--text-main)] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-display text-xs font-black uppercase text-[var(--text-muted)] mb-1.5">
                  Author Name
                </label>
                <input
                  type="text"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border-2 border-[var(--border-ink)] bg-[var(--input-bg)] font-display font-bold text-xs text-[var(--text-main)] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-display text-xs font-black uppercase text-[var(--text-muted)] mb-1.5">
                  Slides Scanned
                </label>
                <input
                  type="text"
                  value={`${slides.length} Slides`}
                  readOnly
                  className="w-full px-3.5 py-2 rounded-xl border-2 border-[var(--border-ink)] bg-[var(--bg-page)] font-mono font-bold text-xs text-[var(--text-main)] focus:outline-none opacity-80"
                />
              </div>
            </div>

            <div>
              <label className="block font-display text-xs font-black uppercase text-[var(--text-muted)] mb-1.5">
                Extra Custom Notes (Optional)
              </label>
              <textarea
                rows={2}
                value={customContext}
                onChange={(e) => setCustomContext(e.target.value)}
                placeholder="e.g. Highlight Sliding Window & Two Pointers..."
                className="w-full px-3.5 py-2 rounded-xl border-2 border-[var(--border-ink)] bg-[var(--input-bg)] font-display text-xs text-[var(--text-main)] focus:outline-none resize-none"
              />
            </div>

            <button
              type="button"
              disabled={isLoading || slides.length === 0}
              onClick={handleGenerate}
              className="w-full py-3.5 rounded-2xl bg-[#A7F3D0] hover:bg-[#6EE7B7] sketch-btn text-[#1D1815] font-display font-black text-sm flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin stroke-[3]" />
                  <span>Scanning Slides &amp; Writing Post...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 stroke-[2.5]" />
                  <span>⚡ Generate Complete Post</span>
                </>
              )}
            </button>
          </div>

          {/* Generated Preview Column with LIVE EDITABLE TEXTAREA */}
          <div className="lg:col-span-7 p-5 sm:p-6 bg-[var(--bg-page)] flex flex-col justify-between overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="font-display font-black text-xs uppercase tracking-wider text-[var(--text-muted)]">
                  Ready-to-Post LinkedIn Output
                </span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-[#FAF8F3] dark:bg-[#1C1916] border border-[var(--border-ink)]/30 text-[var(--text-muted)] flex items-center gap-1">
                  <Edit3 className="w-3 h-3" />
                  <span>Editable</span>
                </span>
              </div>

              {generatedCaption && (
                <div className="flex items-center gap-2 text-xs font-mono">
                  <span className="px-2.5 py-0.5 rounded-full border border-[#1D1815] bg-[#FDE047] text-[#1D1815] font-black">
                    {wordCount} Words
                  </span>
                  <span className="text-[var(--text-muted)]">•</span>
                  <span className="text-[var(--text-muted)]">{charCount} chars</span>
                </div>
              )}
            </div>

            {/* Live Editable Textarea with Sleek Custom Scrollbar */}
            <div className="relative flex-1 min-h-[350px] max-h-[55vh]">
              {generatedCaption ? (
                <textarea
                  value={generatedCaption}
                  onChange={(e) => setGeneratedCaption(e.target.value)}
                  className="w-full h-full p-5 rounded-2xl border-2 border-[var(--border-ink)] bg-[var(--bg-card)] shadow-[3px_3px_0px_var(--shadow-ink)] overflow-y-auto custom-scrollbar font-sans text-sm leading-relaxed text-[var(--text-main)] whitespace-pre-wrap selection:bg-[#FDE047] focus:outline-none focus:ring-2 focus:ring-[#FDE047] resize-none"
                  placeholder="Your generated LinkedIn post will appear here. You can edit line spacing, text, or emojis directly."
                />
              ) : (
                <div className="h-full rounded-2xl border-2 border-[var(--border-ink)] bg-[var(--bg-card)] shadow-[3px_3px_0px_var(--shadow-ink)] flex flex-col items-center justify-center text-center p-6 text-[var(--text-muted)] space-y-2">
                  <Sparkles className="w-10 h-10 opacity-40 animate-pulse text-[#FDE047]" />
                  <p className="font-display font-bold text-sm">
                    Click &ldquo;Generate Complete Post&rdquo;
                  </p>
                  <p className="font-hand text-base font-bold opacity-80">
                    Generates a complete post with full bullet points, community footer &amp; 5 hashtags
                  </p>
                </div>
              )}
            </div>

            {generatedCaption && (
              <div className="mt-4 flex items-center justify-between gap-3">
                <span className="font-hand text-sm font-bold text-[var(--text-muted)]">
                  💡 Tip: You can edit or add extra line breaks directly in the box above!
                </span>

                <button
                  type="button"
                  onClick={handleCopy}
                  className="px-6 py-3 rounded-2xl bg-[#FDE047] hover:bg-[#FACC15] sketch-btn text-[#1D1815] font-display font-black text-xs sm:text-sm flex items-center gap-2 cursor-pointer uppercase tracking-wider shrink-0"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>Copied to Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 stroke-[2.5]" />
                      <span>Copy LinkedIn Post</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
