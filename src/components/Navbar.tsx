'use client';

import React from 'react';
import { Layers, Moon, Sun, History } from 'lucide-react';

interface NavbarProps {
  onReset?: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onOpenHistory: () => void;
}

export function Navbar({
  onReset,
  theme,
  onToggleTheme,
  onOpenHistory,
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b-2 border-[var(--border-ink)] bg-[var(--bg-header)] backdrop-blur-md transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
        {/* Brand Logo */}
        <button
          onClick={onReset}
          className="flex items-center gap-3.5 group text-left focus:outline-none cursor-pointer"
        >
          <div className="w-12 h-12 rounded-2xl bg-[#FDE047] border-2 border-[#1D1815] shadow-[3px_3px_0px_#1D1815] flex items-center justify-center text-[#1D1815] group-hover:rotate-6 transition-transform">
            <Layers className="w-6 h-6 stroke-[2.5]" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-extrabold text-[var(--text-main)] tracking-tight text-xl">
                LinkedIn<span className="text-[#F43F5E]">Carousel</span>
              </span>
              <span className="font-marker text-xs sm:text-sm px-2.5 py-0.5 rounded-full bg-[#F5A3B3] text-[#1D1815] border border-[#1D1815] shadow-[1.5px_1.5px_0px_#1D1815] rotate-[-2deg]">
                Studio ✨
              </span>
            </div>
            <p className="font-hand text-base text-[var(--text-muted)] hidden sm:block -mt-1">
              turn instagram carousels into linkedin master PNGs & PDFs
            </p>
          </div>
        </button>

        {/* Controls: History Drawer, Theme Toggle, Badges */}
        <div className="flex items-center gap-2.5">
          {/* History Button */}
          <button
            type="button"
            onClick={onOpenHistory}
            className="p-2.5 rounded-2xl bg-[var(--bg-card)] border-2 border-[var(--border-ink)] shadow-[2px_2px_0px_var(--shadow-ink)] text-[var(--text-main)] hover:bg-[#FDE047] dark:hover:text-[#1D1815] transition-all cursor-pointer flex items-center gap-2"
            title="Saved Carousel History"
          >
            <History className="w-4 h-4 stroke-[2.5]" />
            <span className="hidden sm:inline-block font-display font-bold text-xs">
              History
            </span>
          </button>

          {/* Light / Dark Mode Switcher */}
          <button
            type="button"
            onClick={onToggleTheme}
            className="p-2.5 rounded-2xl bg-[var(--bg-card)] border-2 border-[var(--border-ink)] shadow-[2px_2px_0px_var(--shadow-ink)] text-[var(--text-main)] hover:bg-[#93C5FD] dark:hover:text-[#1D1815] transition-all cursor-pointer"
            title={theme === 'light' ? 'Switch to Midnight Dark Sketch' : 'Switch to Paper Light'}
          >
            {theme === 'light' ? (
              <Moon className="w-4 h-4 stroke-[2.5]" />
            ) : (
              <Sun className="w-4 h-4 stroke-[2.5] text-[#FDE047]" />
            )}
          </button>

          {/* Status Badge */}
          <div className="hidden lg:flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-[#A7F3D0] border-2 border-[#1D1815] shadow-[2px_2px_0px_#1D1815] text-xs font-black text-[#1D1815]">
            <span className="w-2 h-2 rounded-full bg-[#10B981] border border-[#1D1815] animate-ping" />
            <span>PDF Engine Active</span>
          </div>
        </div>
      </div>
    </header>
  );
}
