'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Target,
  Sparkles,
  Copy,
  Check,
  Loader2,
  Key,
  AlertCircle,
  Zap,
  Flame,
  BookOpen,
  Briefcase,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { CarouselSlide } from '@/lib/types';

interface HookVariant {
  id: string;
  tag: string;
  hook: string;
  formattedHook: string;
  whyItWorks: string;
}

interface HookLabModalProps {
  isOpen: boolean;
  onClose: () => void;
  slides: CarouselSlide[];
  onSelectHookForCaption?: (hookText: string, angleId: string) => void;
}

export function HookLabModal({
  isOpen,
  onClose,
  slides,
  onSelectHookForCaption,
}: HookLabModalProps) {
  const [topic, setTopic] = useState('FAANG SQL & System Design Patterns');
  const [authorName, setAuthorName] = useState('Kamal Sharma');
  const [customContext, setCustomContext] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);

  const [hooks, setHooks] = useState<HookVariant[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

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

  const handleGenerateHooks = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/generate-hooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          slides,
          authorName,
          customContext,
          clientApiKey: apiKey,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate hook variants.');
      }

      setHooks(data.hooks || []);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to generate hooks. Please check your API key.');
      setShowApiKeyInput(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async (hookText: string, id: string) => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(hookText);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = hookText;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (e) {
      console.warn('Copy failed:', e);
    }
  };

  const getIconForTag = (id: string) => {
    switch (id) {
      case 'contrarian':
        return <Flame className="w-4 h-4 text-[#F43F5E]" />;
      case 'story':
        return <BookOpen className="w-4 h-4 text-[#3B82F6]" />;
      case 'framework':
        return <Layers className="w-4 h-4 text-[#EAB308]" />;
      case 'career':
        return <Briefcase className="w-4 h-4 text-[#8B5CF6]" />;
      case 'actionable':
        return <Zap className="w-4 h-4 text-[#10B981]" />;
      default:
        return <Sparkles className="w-4 h-4 text-[#FDE047]" />;
    }
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
            <div className="w-10 h-10 rounded-xl bg-[#F5A3B3] border-2 border-[#1D1815] shadow-[2px_2px_0px_#1D1815] flex items-center justify-center text-[#1D1815]">
              <Target className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-black text-lg text-[var(--text-main)]">
                  Viral Hook A/B Lab
                </h3>
                <span className="font-marker text-xs px-2.5 py-0.5 rounded-full bg-[#FDE047] text-[#1D1815] border border-[#1D1815]">
                  5 High-Converting Angles ✨
                </span>
              </div>
              <p className="font-hand text-base text-[var(--text-muted)] font-bold -mt-1">
                Generate scroll-stopping hooks with Unicode bolding for maximum LinkedIn CTR
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
          {/* Settings Column */}
          <div className="lg:col-span-4 p-5 sm:p-6 overflow-y-auto custom-scrollbar space-y-4 border-b lg:border-b-0 lg:border-r-2 border-[var(--border-ink)]/20">
            <div>
              <label className="block font-display text-xs font-black uppercase text-[var(--text-muted)] mb-1.5">
                Topic / Carousel Title
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. 25 SQL Patterns Asked in FAANG Interviews"
                className="w-full px-3.5 py-2.5 rounded-xl border-2 border-[var(--border-ink)] bg-[var(--input-bg)] font-display font-bold text-sm text-[var(--text-main)] focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-display text-xs font-black uppercase text-[var(--text-muted)] mb-1.5">
                Target Angle Focus (Optional)
              </label>
              <textarea
                rows={2}
                value={customContext}
                onChange={(e) => setCustomContext(e.target.value)}
                placeholder="e.g. Focus on avoiding brute-force memorization..."
                className="w-full px-3.5 py-2 rounded-xl border-2 border-[var(--border-ink)] bg-[var(--input-bg)] font-display text-xs text-[var(--text-main)] focus:outline-none resize-none"
              />
            </div>

            <button
              type="button"
              disabled={isLoading || !topic.trim()}
              onClick={handleGenerateHooks}
              className="w-full py-3.5 rounded-2xl bg-[#F5A3B3] hover:bg-[#FB7185] sketch-btn text-[#1D1815] font-display font-black text-sm flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin stroke-[3]" />
                  <span>Generating 5 Hook Angles...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 stroke-[2.5]" />
                  <span>⚡ Generate 5 Viral Hooks</span>
                </>
              )}
            </button>

            <div className="p-3.5 rounded-2xl bg-[var(--bg-page)] border-2 border-[var(--border-ink)] space-y-1.5 text-xs font-display">
              <span className="font-black text-[var(--text-main)] block">
                💡 5 Winning Hook Strategies:
              </span>
              <ul className="space-y-1 text-[var(--text-muted)] font-medium">
                <li>• <b>Contrarian:</b> Calls out industry mistakes</li>
                <li>• <b>Story:</b> Early failure to breakthrough</li>
                <li>• <b>Framework:</b> High-save pattern cheat sheet</li>
                <li>• <b>Career:</b> Senior vs. Junior engineering judgment</li>
                <li>• <b>Actionable:</b> Direct 2-minute actionable breakdown</li>
              </ul>
            </div>
          </div>

          {/* Hook Angles Grid */}
          <div className="lg:col-span-8 p-5 sm:p-6 bg-[var(--bg-page)] overflow-y-auto custom-scrollbar space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-display font-black text-xs uppercase tracking-wider text-[var(--text-muted)]">
                A/B Tested Hook Variants ({hooks.length})
              </span>
              {hooks.length > 0 && (
                <span className="text-xs font-mono text-[var(--text-muted)] font-bold">
                  Formatted in Mathematical Unicode Bold
                </span>
              )}
            </div>

            {hooks.length === 0 ? (
              <div className="h-[380px] rounded-3xl border-2 border-dashed border-[var(--border-ink)]/30 flex flex-col items-center justify-center text-center p-6 text-[var(--text-muted)] space-y-2">
                <Target className="w-10 h-10 opacity-30 text-[#F5A3B3]" />
                <p className="font-display font-bold text-sm">
                  Click &ldquo;Generate 5 Viral Hooks&rdquo; to begin
                </p>
                <p className="font-hand text-base font-bold opacity-80">
                  AI will analyze your carousel topic and craft 5 high-converting opening hooks
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {hooks.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 sm:p-5 rounded-2xl border-2 border-[var(--border-ink)] bg-[var(--bg-card)] shadow-[3px_3px_0px_var(--shadow-ink)] flex flex-col justify-between gap-3 hover:-translate-y-0.5 transition-all"
                  >
                    <div className="flex items-center justify-between gap-2 border-b border-[var(--border-ink)]/20 pb-2">
                      <div className="flex items-center gap-2 font-display font-black text-xs text-[var(--text-main)]">
                        {getIconForTag(item.id)}
                        <span>{item.tag}</span>
                      </div>
                      <span className="font-hand text-xs font-bold text-[var(--text-muted)]">
                        {item.whyItWorks}
                      </span>
                    </div>

                    <div className="font-sans text-sm sm:text-base leading-relaxed text-[var(--text-main)] whitespace-pre-wrap selection:bg-[#FDE047]">
                      {item.formattedHook}
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border-ink)]/15">
                      <button
                        type="button"
                        onClick={() => handleCopy(item.formattedHook, item.id)}
                        className="px-3.5 py-1.5 rounded-xl bg-[var(--bg-page)] hover:bg-[#FDE047] dark:hover:text-[#1D1815] border border-[var(--border-ink)] font-display font-black text-xs text-[var(--text-main)] flex items-center gap-1.5 cursor-pointer transition-all"
                      >
                        {copiedId === item.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-[#10B981] stroke-[3]" />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 stroke-[2.5]" />
                            <span>Copy Hook</span>
                          </>
                        )}
                      </button>

                      {onSelectHookForCaption && (
                        <button
                          type="button"
                          onClick={() => {
                            onSelectHookForCaption(item.formattedHook, item.id);
                            onClose();
                          }}
                          className="px-4 py-1.5 rounded-xl bg-[#A7F3D0] hover:bg-[#6EE7B7] border-2 border-[#1D1815] shadow-[2px_2px_0px_#1D1815] font-display font-black text-xs text-[#1D1815] flex items-center gap-1.5 cursor-pointer transition-all"
                        >
                          <Sparkles className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>Generate Post with this Hook</span>
                          <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
