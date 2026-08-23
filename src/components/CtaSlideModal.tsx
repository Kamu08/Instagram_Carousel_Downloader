'use client';

import React, { useState } from 'react';
import {
  X,
  Sparkles,
  PlusCircle,
} from 'lucide-react';
import { CarouselSlide } from '@/lib/types';

interface CtaSlideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertSlide: (slide: CarouselSlide, position: 'start' | 'end') => void;
}

export function CtaSlideModal({
  isOpen,
  onClose,
  onInsertSlide,
}: CtaSlideModalProps) {
  const [template, setTemplate] = useState<'follow' | 'save' | 'cover'>('follow');
  const [authorName, setAuthorName] = useState('Kamal Sharma');
  const [authorHandle, setAuthorHandle] = useState('@kamalsharma');
  const [headline, setHeadline] = useState('Found this helpful?');
  const [subtitle, setSubtitle] = useState('Follow for more daily AI, RAG, Python & System Design insights!');
  const [tag, setTag] = useState('TECH & AI TIPS');

  if (!isOpen) return null;

  const generateCanvasImage = async (): Promise<string> => {
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1350;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas not supported');

    // 1. Draw Paper background
    ctx.fillStyle = '#F7F4EB';
    ctx.fillRect(0, 0, 1080, 1350);

    // 2. Draw subtle paper dot grid
    ctx.fillStyle = 'rgba(29, 24, 21, 0.08)';
    for (let x = 20; x < 1080; x += 36) {
      for (let y = 20; y < 1350; y += 36) {
        ctx.beginPath();
        ctx.arc(x, y, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 3. Draw Outer Sketch Card
    ctx.fillStyle = '#FAF8F3';
    ctx.strokeStyle = '#1D1815';
    ctx.lineWidth = 8;
    ctx.shadowColor = '#1D1815';
    ctx.shadowOffsetX = 16;
    ctx.shadowOffsetY = 16;
    ctx.shadowBlur = 0;

    // Draw rounded rect for card
    ctx.beginPath();
    ctx.roundRect(80, 100, 920, 1150, 40);
    ctx.fill();
    ctx.stroke();

    // Reset shadow
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // 4. Draw Top Tape Sticker
    ctx.save();
    ctx.translate(540, 100);
    ctx.rotate(-0.04);
    ctx.fillStyle = template === 'cover' ? 'rgba(253, 224, 71, 0.9)' : 'rgba(245, 163, 179, 0.95)';
    ctx.strokeStyle = 'rgba(29, 24, 21, 0.6)';
    ctx.lineWidth = 4;
    ctx.setLineDash([8, 6]);
    ctx.fillRect(-120, -25, 240, 50);
    ctx.strokeRect(-120, -25, 240, 50);
    ctx.restore();

    // 5. Draw Content based on template
    ctx.fillStyle = '#1D1815';
    ctx.textAlign = 'center';

    if (template === 'follow' || template === 'save') {
      // Badge
      ctx.save();
      ctx.fillStyle = '#FDE047';
      ctx.strokeStyle = '#1D1815';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.roundRect(400, 220, 280, 60, 25);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#1D1815';
      ctx.font = 'bold 28px sans-serif';
      ctx.fillText(tag.toUpperCase(), 540, 260);
      ctx.restore();

      // Main Headline
      ctx.font = 'bold 68px sans-serif';
      ctx.fillText(headline, 540, 390);

      // Yellow Highlighter behind subtitle
      ctx.save();
      ctx.fillStyle = 'rgba(253, 224, 71, 0.85)';
      ctx.fillRect(160, 480, 760, 65);
      ctx.restore();

      ctx.font = '500 42px sans-serif';
      ctx.fillText(subtitle, 540, 528);

      // 3 Action boxes
      const actions = [
        { icon: '📌', title: 'Save for later reference' },
        { icon: '🔁', title: 'Repost to share with friends' },
        { icon: '💬', title: 'Leave your thoughts below' },
      ];

      actions.forEach((act, idx) => {
        const y = 640 + idx * 130;
        ctx.save();
        ctx.fillStyle = '#FAF8F3';
        ctx.strokeStyle = '#1D1815';
        ctx.lineWidth = 5;
        ctx.shadowColor = '#1D1815';
        ctx.shadowOffsetX = 8;
        ctx.shadowOffsetY = 8;
        ctx.beginPath();
        ctx.roundRect(200, y, 680, 95, 24);
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        ctx.font = '40px sans-serif';
        ctx.fillText(act.icon, 260, y + 62);
        ctx.textAlign = 'left';
        ctx.font = 'bold 34px sans-serif';
        ctx.fillText(act.title, 330, y + 60);
        ctx.textAlign = 'center';
      });

      // Author Footer pill
      ctx.save();
      ctx.fillStyle = '#93C5FD';
      ctx.strokeStyle = '#1D1815';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.roundRect(240, 1070, 600, 100, 30);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#1D1815';
      ctx.font = 'bold 44px sans-serif';
      ctx.fillText(`Follow ${authorHandle}`, 540, 1135);
      ctx.restore();
    } else {
      // Cover Slide template
      ctx.save();
      ctx.fillStyle = '#A7F3D0';
      ctx.strokeStyle = '#1D1815';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.roundRect(380, 240, 320, 65, 25);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#1D1815';
      ctx.font = 'bold 30px sans-serif';
      ctx.fillText(tag.toUpperCase(), 540, 284);
      ctx.restore();

      ctx.font = 'bold 80px sans-serif';
      ctx.fillText(headline, 540, 480);

      // Highlighter subtitle
      ctx.save();
      ctx.fillStyle = 'rgba(253, 224, 71, 0.85)';
      ctx.fillRect(180, 590, 720, 80);
      ctx.restore();

      ctx.font = '600 48px sans-serif';
      ctx.fillText(subtitle, 540, 650);

      // Visual Cue box
      ctx.save();
      ctx.fillStyle = '#FAF8F3';
      ctx.strokeStyle = '#1D1815';
      ctx.lineWidth = 6;
      ctx.shadowColor = '#1D1815';
      ctx.shadowOffsetX = 10;
      ctx.shadowOffsetY = 10;
      ctx.beginPath();
      ctx.roundRect(280, 820, 520, 120, 30);
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      ctx.font = 'bold 44px sans-serif';
      ctx.fillText('Swipe to read ➡️', 540, 895);

      // Author Signature
      ctx.font = 'bold 36px sans-serif';
      ctx.fillText(`By ${authorName} (${authorHandle})`, 540, 1130);
    }

    return canvas.toDataURL('image/png');
  };

  const handleCreateAndInsert = async (position: 'start' | 'end') => {
    try {
      const dataUrl = await generateCanvasImage();
      const byteString = atob(dataUrl.split(',')[1]);

      const newSlide: CarouselSlide = {
        id: `cta_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        originalIndex: 0,
        currentIndex: 0,
        filename: 'carousel-cta.png',
        dataUrl,
        width: 1080,
        height: 1350,
        aspectRatio: '4:5 (Portrait)',
        originalFormat: 'PNG',
        sizeBytes: byteString.length,
      };

      onInsertSlide(newSlide, position);
      onClose();
    } catch (err) {
      console.error('Failed to create CTA slide:', err);
      alert('Failed to generate CTA slide.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#1D1815]/80 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative max-w-2xl w-full max-h-[90vh] bg-[var(--bg-card)] border-2 border-[var(--border-ink)] rounded-3xl flex flex-col overflow-hidden shadow-[8px_8px_0px_var(--shadow-ink)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-[var(--bg-page)] border-b-2 border-[var(--border-ink)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FDE047] border-2 border-[#1D1815] shadow-[2px_2px_0px_#1D1815] flex items-center justify-center text-[#1D1815]">
              <Sparkles className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="font-display font-black text-lg text-[var(--text-main)]">
                Add Custom Intro / Outro CTA Slide
              </h3>
              <p className="font-hand text-base text-[var(--text-muted)] font-bold -mt-1">
                Boost engagement with custom branded ending & cover slides
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

        {/* Form Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Template Switcher */}
          <div>
            <label className="block font-display text-xs font-black uppercase text-[var(--text-muted)] mb-2">
              Select Template
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'follow', label: 'Follow & Repost (Outro)', bg: 'bg-[#FDE047]' },
                { id: 'save', label: 'Save & Checklist (Outro)', bg: 'bg-[#F5A3B3]' },
                { id: 'cover', label: 'Custom Cover (Intro)', bg: 'bg-[#93C5FD]' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setTemplate(t.id as any);
                    if (t.id === 'cover') {
                      setHeadline('10 Pro Tips for 2026');
                      setSubtitle('Master modern full-stack development');
                    } else {
                      setHeadline('Found this helpful?');
                      setSubtitle('Follow for more daily tech breakdowns!');
                    }
                  }}
                  className={`p-3 rounded-2xl border-2 border-[var(--border-ink)] text-xs font-display font-bold transition-all cursor-pointer ${
                    template === t.id
                      ? `${t.bg} text-[#1D1815] shadow-[3px_3px_0px_var(--shadow-ink)]`
                      : 'bg-[var(--bg-card)] text-[var(--text-main)] hover:bg-[var(--bg-page)]'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-display text-xs font-bold text-[var(--text-main)] mb-1">
                Author Name
              </label>
              <input
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border-2 border-[var(--border-ink)] bg-[var(--input-bg)] font-display font-bold text-sm text-[var(--text-main)] focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-display text-xs font-bold text-[var(--text-main)] mb-1">
                LinkedIn Handle
              </label>
              <input
                type="text"
                value={authorHandle}
                onChange={(e) => setAuthorHandle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border-2 border-[var(--border-ink)] bg-[var(--input-bg)] font-mono font-bold text-sm text-[var(--text-main)] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-display text-xs font-bold text-[var(--text-main)] mb-1">
              Main Headline
            </label>
            <input
              type="text"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border-2 border-[var(--border-ink)] bg-[var(--input-bg)] font-display font-black text-sm text-[var(--text-main)] focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-display text-xs font-bold text-[var(--text-main)] mb-1">
              Subtitle / Callout Text
            </label>
            <input
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border-2 border-[var(--border-ink)] bg-[var(--input-bg)] font-display font-bold text-sm text-[var(--text-main)] focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-display text-xs font-bold text-[var(--text-main)] mb-1">
              Top Badge / Category Tag
            </label>
            <input
              type="text"
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border-2 border-[var(--border-ink)] bg-[var(--input-bg)] font-mono font-bold text-sm text-[var(--text-main)] focus:outline-none"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-[var(--bg-page)] border-t-2 border-[var(--border-ink)] flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => handleCreateAndInsert('start')}
            className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-[#93C5FD] hover:bg-[#60A5FA] border-2 border-[#1D1815] shadow-[2px_2px_0px_#1D1815] font-display font-black text-xs text-[#1D1815] flex items-center justify-center gap-2 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 stroke-[2.5]" />
            <span>Insert as Cover (Slide 1)</span>
          </button>

          <button
            type="button"
            onClick={() => handleCreateAndInsert('end')}
            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-[#FDE047] hover:bg-[#FACC15] sketch-btn text-[#1D1815] font-display font-black text-xs flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
          >
            <Sparkles className="w-4 h-4 stroke-[2.5]" />
            <span>Insert as Outro (Last Slide)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
