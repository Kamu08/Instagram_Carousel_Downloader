'use client';

import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Copy,
  Check,
  RefreshCw,
  MessageSquareQuote,
  Loader2,
  Sliders,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { CarouselSlide } from '@/lib/types';

interface CaptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  slides: CarouselSlide[];
}

export function CaptionModal({ isOpen, onClose, slides }: CaptionModalProps) {
  const [topic, setTopic] = useState('25 Patterns. Hundreds of Interview Questions.');
  const [authorName, setAuthorName] = useState('Kamal Sharma');
  const [whatsappLink, setWhatsappLink] = useState('https://tinyurl.com/mwmbwytv');
  const [telegramLink, setTelegramLink] = useState('https://tinyurl.com/6p9un6b5');
  const [customContext, setCustomContext] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [generatedCaption, setGeneratedCaption] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/generate-caption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          slideCount: slides.length || 7,
          authorName,
          whatsappLink,
          telegramLink,
          customContext,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate caption.');
      }

      setGeneratedCaption(data.caption);
    } catch (err: any) {
      alert(err.message || 'Failed to generate AI caption.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!generatedCaption) return;
    navigator.clipboard.writeText(generatedCaption);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const wordCount = generatedCaption ? generatedCaption.trim().split(/\s+/).length : 0;
  const charCount = generatedCaption.length;

  return (
    <div
      className="fixed inset-0 z-50 bg-[#1D1815]/80 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative max-w-3xl w-full max-h-[92vh] bg-[var(--bg-card)] border-2 border-[var(--border-ink)] rounded-3xl flex flex-col overflow-hidden shadow-[8px_8px_0px_var(--shadow-ink)]"
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
                  Kamal Sharma AI Caption Blueprint
                </h3>
                <span className="font-marker text-xs px-2 py-0.5 rounded-full bg-[#A7F3D0] text-[#1D1815] border border-[#1D1815]">
                  Unicode Bold ⚡
                </span>
              </div>
              <p className="font-hand text-base text-[var(--text-muted)] font-bold -mt-1">
                Generates your exact LinkedIn post pattern with Unicode Bold headers & community footer
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

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Topic Input */}
          <div>
            <label className="block font-display text-xs font-bold text-[var(--text-main)] mb-1">
              Carousel Subject / Topic
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. 25 Patterns. Hundreds of Interview Questions."
              className="w-full px-3.5 py-2.5 rounded-xl border-2 border-[var(--border-ink)] bg-[var(--input-bg)] font-display font-bold text-sm text-[var(--text-main)] focus:outline-none"
            />
          </div>

          {/* Key Insights / Extra Context */}
          <div>
            <label className="block font-display text-xs font-bold text-[var(--text-main)] mb-1">
              Specific Tools / Takeaways (Optional)
            </label>
            <input
              type="text"
              value={customContext}
              onChange={(e) => setCustomContext(e.target.value)}
              placeholder="e.g. Mention Two Pointers, Sliding Window, Fast & Slow Pointers, Monotonic Stack"
              className="w-full px-3.5 py-2 rounded-xl border-2 border-[var(--border-ink)] bg-[var(--input-bg)] font-display font-semibold text-xs text-[var(--text-main)] focus:outline-none"
            />
          </div>

          {/* Toggle Community / Footer Links */}
          <div>
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-xs font-display font-bold text-[var(--text-muted)] hover:text-[var(--text-main)] flex items-center gap-1.5 cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>{showAdvanced ? 'Hide Footer Branding Settings' : 'Customize Signature & Links (WhatsApp, Telegram)'}</span>
              {showAdvanced ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            {showAdvanced && (
              <div className="mt-3 p-4 rounded-2xl bg-[var(--bg-page)] border-2 border-[var(--border-ink)]/50 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <span className="block text-[11px] font-bold text-[var(--text-muted)] mb-1">Author Name</span>
                    <input
                      type="text"
                      value={authorName}
                      onChange={(e) => setAuthorName(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl border border-[var(--border-ink)] bg-[var(--bg-card)] font-display font-bold text-xs text-[var(--text-main)]"
                    />
                  </div>
                  <div>
                    <span className="block text-[11px] font-bold text-[var(--text-muted)] mb-1">WhatsApp Link</span>
                    <input
                      type="text"
                      value={whatsappLink}
                      onChange={(e) => setWhatsappLink(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl border border-[var(--border-ink)] bg-[var(--bg-card)] font-mono text-[11px] text-[var(--text-main)]"
                    />
                  </div>
                  <div>
                    <span className="block text-[11px] font-bold text-[var(--text-muted)] mb-1">Telegram Link</span>
                    <input
                      type="text"
                      value={telegramLink}
                      onChange={(e) => setTelegramLink(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl border border-[var(--border-ink)] bg-[var(--bg-card)] font-mono text-[11px] text-[var(--text-main)]"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Trigger Button */}
          <button
            type="button"
            disabled={isLoading}
            onClick={handleGenerate}
            className="w-full py-3.5 rounded-2xl bg-[#FDE047] hover:bg-[#FACC15] sketch-btn text-[#1D1815] font-display font-black text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 uppercase tracking-wider"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin stroke-[3]" />
                <span>Gemini 3.6 Flash is Writing Your Post...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 stroke-[2.5]" />
                <span>Generate Post Caption (Kamal's Pattern) ✨</span>
              </>
            )}
          </button>

          {/* Generated Caption Output Box */}
          {generatedCaption && (
            <div className="p-4 rounded-2xl bg-[var(--bg-page)] border-2 border-[var(--border-ink)] shadow-[3px_3px_0px_var(--shadow-ink)] space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquareQuote className="w-4 h-4 text-[#F43F5E]" />
                  <span className="font-display font-black text-xs uppercase text-[var(--text-main)]">
                    Ready-to-Post LinkedIn Caption (Unicode Bold Formatted)
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs font-mono font-bold text-[var(--text-muted)]">
                  <span>{wordCount} words</span>
                  <span>•</span>
                  <span>{charCount} chars</span>
                </div>
              </div>

              <textarea
                value={generatedCaption}
                onChange={(e) => setGeneratedCaption(e.target.value)}
                rows={11}
                className="w-full p-3 rounded-xl border-2 border-[var(--border-ink)] bg-[var(--bg-card)] font-sans text-xs sm:text-sm text-[var(--text-main)] leading-relaxed focus:outline-none resize-y whitespace-pre-wrap"
              />

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={isLoading}
                  className="px-3.5 py-2 rounded-xl border border-[var(--border-ink)] bg-[var(--bg-card)] font-display font-bold text-xs text-[var(--text-main)] hover:bg-[#FAF8F3] flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Regenerate</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopy}
                  className="px-5 py-2.5 rounded-xl bg-[#A7F3D0] hover:bg-[#6EE7B7] border-2 border-[#1D1815] shadow-[2px_2px_0px_#1D1815] font-display font-black text-xs text-[#1D1815] flex items-center gap-2 cursor-pointer transition-all hover:translate-x-[1px] hover:translate-y-[1px]"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 stroke-[3] text-[#065F46]" />
                      <span>Copied to Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 stroke-[2.5]" />
                      <span>Copy Caption</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
