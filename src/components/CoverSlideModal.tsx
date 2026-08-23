'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Sparkles,
  Plus,
  Trash2,
  Download,
  CheckCircle2,
  Layers,
  Palette,
  Type,
  Maximize2,
  RefreshCw,
} from 'lucide-react';
import { CarouselSlide } from '@/lib/types';
import { saveAs } from 'file-saver';

export interface CoverSlideLine {
  id: string;
  text: string;
  color: string;
  fontSize: number;
  isBubbleSticker: boolean;
  hasSeparatorBefore?: boolean;
  separatorType?: 'none' | 'curved-line' | 'horizontal-rules';
}

interface CoverSlideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyCoverSlide: (slide: CarouselSlide, mode: 'replace-first' | 'prepend') => void;
}

const DEFAULT_LINES: CoverSlideLine[] = [
  { id: '1', text: '25', color: '#E50914', fontSize: 220, isBubbleSticker: true, separatorType: 'none' },
  { id: '2', text: 'Patterns.', color: '#FFFFFF', fontSize: 130, isBubbleSticker: true, separatorType: 'none' },
  { id: '3', text: 'Hundreds', color: '#E50914', fontSize: 130, isBubbleSticker: true, separatorType: 'curved-line' },
  { id: '4', text: 'of', color: '#1D1815', fontSize: 44, isBubbleSticker: false, separatorType: 'horizontal-rules' },
  { id: '5', text: 'Interview', color: '#FFFFFF', fontSize: 130, isBubbleSticker: true, separatorType: 'none' },
  { id: '6', text: 'Questions.', color: '#E50914', fontSize: 130, isBubbleSticker: true, separatorType: 'none' },
];

const PRESET_COLORS = [
  { label: 'Red', hex: '#E50914' },
  { label: 'White', hex: '#FFFFFF' },
  { label: 'Yellow', hex: '#FACC15' },
  { label: 'Green', hex: '#65A30D' },
  { label: 'Blue', hex: '#0284C7' },
  { label: 'Purple', hex: '#9333EA' },
  { label: 'Orange', hex: '#EA580C' },
  { label: 'Black', hex: '#1D1815' },
];

export function CoverSlideModal({
  isOpen,
  onClose,
  onApplyCoverSlide,
}: CoverSlideModalProps) {
  const [lines, setLines] = useState<CoverSlideLine[]>(DEFAULT_LINES);
  const [authorName, setAuthorName] = useState('Kamal Sharma');
  const [collaborator, setCollaborator] = useState('× Matiks');
  const [collabColor, setCollabColor] = useState('#65A30D');
  const [bgColor, setBgColor] = useState('#FAF8F5');
  const [previewDataUrl, setPreviewDataUrl] = useState<string>('');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Render canvas function
  const renderCanvas = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1350;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    // 1. Draw Clean Paper Background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, 1080, 1350);

    // Subtle paper grain / vignette
    ctx.fillStyle = 'rgba(29, 24, 21, 0.03)';
    for (let x = 0; x < 1080; x += 32) {
      for (let y = 0; y < 1350; y += 32) {
        ctx.fillRect(x, y, 1.5, 1.5);
      }
    }

    // 2. Draw Top Margin & Content Lines
    const totalLines = lines.length;
    let currentY = 160;

    // Helper for rendering Bubble/Sticker Text with thick black stroke
    const drawStickerText = (
      text: string,
      x: number,
      y: number,
      fontSize: number,
      fillColor: string,
      isBubble: boolean
    ) => {
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      if (isBubble) {
        ctx.font = `900 ${fontSize}px "Titan One", "Paytone One", "Bungee", -apple-system, sans-serif`;
        ctx.lineJoin = 'round';
        ctx.miterLimit = 2;

        // Outer Black Stroke (thick sticker outline)
        ctx.strokeStyle = '#1D1815';
        ctx.lineWidth = Math.max(14, fontSize * 0.17);
        ctx.strokeText(text, x, y);

        // Optional inner drop shadow
        ctx.fillStyle = fillColor;
        ctx.fillText(text, x, y);
      } else {
        ctx.font = `bold ${fontSize}px -apple-system, sans-serif`;
        ctx.fillStyle = fillColor;
        ctx.fillText(text, x, y);
      }
    };

    lines.forEach((line) => {
      // Draw Separator if needed
      if (line.separatorType === 'curved-line') {
        ctx.save();
        ctx.strokeStyle = '#E50914';
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(340, currentY - 20);
        ctx.quadraticCurveTo(540, currentY - 35, 740, currentY - 20);
        ctx.stroke();
        ctx.restore();
        currentY += 15;
      } else if (line.separatorType === 'horizontal-rules') {
        ctx.save();
        ctx.strokeStyle = '#1D1815';
        ctx.lineWidth = 3;
        // left rule
        ctx.beginPath();
        ctx.moveTo(300, currentY);
        ctx.lineTo(470, currentY);
        ctx.stroke();
        // right rule
        ctx.beginPath();
        ctx.moveTo(610, currentY);
        ctx.lineTo(780, currentY);
        ctx.stroke();
        ctx.restore();
      }

      drawStickerText(
        line.text,
        540,
        currentY + line.fontSize / 2,
        line.fontSize,
        line.color,
        line.isBubbleSticker
      );

      currentY += line.fontSize + (line.fontSize > 150 ? 30 : 20);
    });

    // 3. Draw Footer Branding Bar
    const footerY = 1260;

    // LinkedIn Red/Blue Box Icon
    ctx.save();
    ctx.fillStyle = '#E50914';
    ctx.beginPath();
    ctx.roundRect(140, footerY - 35, 60, 60, 14);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 36px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('in', 170, footerY - 5);
    ctx.restore();

    // Divider bar
    ctx.save();
    ctx.strokeStyle = 'rgba(29, 24, 21, 0.4)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(225, footerY - 30);
    ctx.lineTo(225, footerY + 20);
    ctx.stroke();
    ctx.restore();

    // Author Name in bold serif / sans
    ctx.save();
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#1D1815';
    ctx.font = '900 40px "Playfair Display", Georgia, serif, sans-serif';
    ctx.fillText(authorName, 255, footerY - 5);

    const authorWidth = ctx.measureText(authorName).width;

    // Collaborator in accent color
    if (collaborator.trim()) {
      ctx.fillStyle = collabColor;
      ctx.font = '900 40px "Playfair Display", Georgia, serif, sans-serif';
      ctx.fillText(` ${collaborator}`, 265 + authorWidth, footerY - 5);
    }
    ctx.restore();

    return canvas.toDataURL('image/png');
  };

  useEffect(() => {
    if (isOpen) {
      const url = renderCanvas();
      setPreviewDataUrl(url);
    }
  }, [isOpen, lines, authorName, collaborator, collabColor, bgColor]);

  if (!isOpen) return null;

  const handleUpdateLine = (id: string, updates: Partial<CoverSlideLine>) => {
    setLines((prev) =>
      prev.map((l) => (l.id === id ? { ...l, ...updates } : l))
    );
  };

  const handleAddLine = () => {
    const newLine: CoverSlideLine = {
      id: `line_${Date.now()}`,
      text: 'New Line',
      color: '#E50914',
      fontSize: 120,
      isBubbleSticker: true,
      separatorType: 'none',
    };
    setLines([...lines, newLine]);
  };

  const handleRemoveLine = (id: string) => {
    if (lines.length <= 1) return;
    setLines(lines.filter((l) => l.id !== id));
  };

  const handleCreateSlide = (mode: 'replace-first' | 'prepend') => {
    const dataUrl = renderCanvas();
    const byteString = atob(dataUrl.split(',')[1]);

    const newSlide: CarouselSlide = {
      id: `cover_${Date.now()}`,
      originalIndex: 0,
      currentIndex: 0,
      filename: 'carousel-01.png',
      dataUrl,
      width: 1080,
      height: 1350,
      aspectRatio: '4:5 (Portrait)',
      originalFormat: 'PNG',
      sizeBytes: byteString.length,
    };

    onApplyCoverSlide(newSlide, mode);
    onClose();
  };

  const handleDownloadOnly = () => {
    const dataUrl = renderCanvas();
    const byteString = atob(dataUrl.split(',')[1]);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    const blob = new Blob([ab], { type: 'image/png' });
    saveAs(blob, 'carousel-cover.png');
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#1D1815]/80 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative max-w-5xl w-full max-h-[92vh] bg-[var(--bg-card)] border-2 border-[var(--border-ink)] rounded-3xl flex flex-col overflow-hidden shadow-[8px_8px_0px_var(--shadow-ink)]"
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
                Cover Slide Generator Studio
              </h3>
              <p className="font-hand text-base text-[var(--text-muted)] font-bold -mt-1">
                Viral pop sticker typography with live customizer
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

        {/* Content: Left Controls & Right Live Preview */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          {/* Controls Column */}
          <div className="lg:col-span-7 p-5 sm:p-6 overflow-y-auto space-y-6 border-b lg:border-b-0 lg:border-r-2 border-[var(--border-ink)]/20">
            {/* Lines List */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="font-display font-black text-xs uppercase tracking-wider text-[var(--text-muted)]">
                  Typography Lines (Top to Bottom)
                </label>
                <button
                  type="button"
                  onClick={handleAddLine}
                  className="px-3 py-1 rounded-xl bg-[#FAF8F3] dark:bg-[#1C1916] border border-[var(--border-ink)] text-xs font-bold text-[var(--text-main)] hover:bg-[#FDE047] dark:hover:text-[#1D1815] transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Line</span>
                </button>
              </div>

              <div className="space-y-3">
                {lines.map((line, idx) => (
                  <div
                    key={line.id}
                    className="p-3 rounded-2xl bg-[var(--bg-page)] border-2 border-[var(--border-ink)]/60 shadow-[2px_2px_0px_var(--shadow-ink)] flex flex-col gap-2.5"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-[var(--text-muted)] w-5">
                        #{idx + 1}
                      </span>
                      <input
                        type="text"
                        value={line.text}
                        onChange={(e) => handleUpdateLine(line.id, { text: e.target.value })}
                        className="flex-1 px-3 py-1.5 rounded-xl border border-[var(--border-ink)] bg-[var(--bg-card)] font-display font-black text-sm text-[var(--text-main)] focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveLine(line.id)}
                        className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[#F43F5E] transition-colors"
                        title="Remove line"
                      >
                        <Trash2 className="w-4 h-4 stroke-[2]" />
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs">
                      {/* Font Size */}
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-[var(--text-muted)]">Size:</span>
                        <input
                          type="number"
                          value={line.fontSize}
                          onChange={(e) => handleUpdateLine(line.id, { fontSize: Number(e.target.value) || 20 })}
                          className="w-18 px-2 py-1 rounded-lg border border-[var(--border-ink)] bg-[var(--bg-card)] font-mono font-bold text-xs text-[var(--text-main)]"
                        />
                      </div>

                      {/* Color Palette */}
                      <div className="flex items-center gap-1">
                        {PRESET_COLORS.map((c) => (
                          <button
                            key={c.hex}
                            type="button"
                            onClick={() => handleUpdateLine(line.id, { color: c.hex })}
                            className={`w-5 h-5 rounded-full border border-[#1D1815] transition-transform ${
                              line.color === c.hex ? 'scale-125 ring-2 ring-[#1D1815]' : 'hover:scale-110'
                            }`}
                            style={{ backgroundColor: c.hex }}
                            title={c.label}
                          />
                        ))}
                      </div>

                      {/* Separator toggle */}
                      <select
                        value={line.separatorType || 'none'}
                        onChange={(e) => handleUpdateLine(line.id, { separatorType: e.target.value as any })}
                        className="px-2 py-1 rounded-lg border border-[var(--border-ink)] bg-[var(--bg-card)] font-display font-bold text-xs text-[var(--text-main)]"
                      >
                        <option value="none">No Separator</option>
                        <option value="curved-line">Curved Red Line</option>
                        <option value="horizontal-rules">Horizontal Rules</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer Branding Fields */}
            <div className="pt-4 border-t-2 border-dashed border-[var(--border-ink)]/20 space-y-3">
              <label className="block font-display font-black text-xs uppercase tracking-wider text-[var(--text-muted)]">
                Footer Author & Branding Bar
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <span className="block text-[11px] font-bold text-[var(--text-muted)] mb-1">Author Name</span>
                  <input
                    type="text"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[var(--border-ink)] bg-[var(--bg-card)] font-display font-bold text-xs text-[var(--text-main)]"
                  />
                </div>

                <div>
                  <span className="block text-[11px] font-bold text-[var(--text-muted)] mb-1">Collaborator / Brand</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={collaborator}
                      onChange={(e) => setCollaborator(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-xl border border-[var(--border-ink)] bg-[var(--bg-card)] font-display font-bold text-xs text-[var(--text-main)]"
                    />
                    <input
                      type="color"
                      value={collabColor}
                      onChange={(e) => setCollabColor(e.target.value)}
                      className="w-8 h-8 rounded-lg cursor-pointer border border-[var(--border-ink)]"
                      title="Collaborator Color"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Live Preview Column */}
          <div className="lg:col-span-5 p-5 sm:p-6 bg-[var(--bg-page)] flex flex-col items-center justify-center">
            <span className="font-display font-black text-xs uppercase tracking-wider text-[var(--text-muted)] mb-3">
              Live Preview (1080 × 1350)
            </span>

            <div className="relative aspect-[4/5] max-h-[50vh] rounded-2xl border-2 border-[var(--border-ink)] shadow-[4px_4px_0px_var(--shadow-ink)] overflow-hidden bg-white">
              {previewDataUrl ? (
                <img
                  src={previewDataUrl}
                  alt="Cover Preview"
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <RefreshCw className="w-6 h-6 animate-spin text-[var(--text-muted)]" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-[var(--bg-page)] border-t-2 border-[var(--border-ink)] flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleDownloadOnly}
            className="w-full sm:w-auto px-5 py-3 rounded-2xl border-2 border-[var(--border-ink)] bg-[var(--bg-card)] hover:bg-[#FAF8F3] font-display font-black text-xs text-[var(--text-main)] shadow-[2px_2px_0px_var(--shadow-ink)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4 stroke-[2.5]" />
            <span>Save Cover as PNG</span>
          </button>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => handleCreateSlide('prepend')}
              className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-[#93C5FD] hover:bg-[#60A5FA] border-2 border-[#1D1815] shadow-[2px_2px_0px_#1D1815] font-display font-black text-xs text-[#1D1815] flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
            >
              <span>➕ Insert as New Slide 1</span>
            </button>

            <button
              type="button"
              onClick={() => handleCreateSlide('replace-first')}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-[#FDE047] hover:bg-[#FACC15] sketch-btn text-[#1D1815] font-display font-black text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
            >
              <CheckCircle2 className="w-4 h-4 stroke-[3]" />
              <span>⚡ Set as Slide 1 (Cover)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
