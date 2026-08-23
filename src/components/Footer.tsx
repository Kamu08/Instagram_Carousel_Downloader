import React from 'react';
import { Layers, ShieldCheck, Zap, Sparkles } from 'lucide-react';

export function Footer() {
  return (
    <footer className="mt-auto border-t-2 border-[var(--border-ink)] bg-[var(--bg-card)] py-10 text-xs text-[var(--text-main)] transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#FDE047] border-2 border-[#1D1815] shadow-[2px_2px_0px_#1D1815] flex items-center justify-center text-[#1D1815]">
            <Layers className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div>
            <span className="font-display font-black text-sm text-[var(--text-main)]">
              LinkedIn Carousel Studio
            </span>
            <p className="font-hand text-base text-[var(--text-muted)] font-bold -mt-0.5">
              Turn Instagram Multi-Slide Carousels into High-Res Master PNGs & PDFs
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-bold font-display text-[#1D1815]">
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#FDE047] border border-[#1D1815] shadow-[1.5px_1.5px_0px_#1D1815]">
            <Zap className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Instant Stream Processing</span>
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#A7F3D0] border border-[#1D1815] shadow-[1.5px_1.5px_0px_#1D1815]">
            <ShieldCheck className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Zero Server File Retention</span>
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#F5A3B3] border border-[#1D1815] shadow-[1.5px_1.5px_0px_#1D1815]">
            <Sparkles className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>PNG & PDF Master Quality</span>
          </span>
        </div>
      </div>
    </footer>
  );
}
