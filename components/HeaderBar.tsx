'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';

export type ModuleId = 'cards' | 'scrolling' | 'eye' | 'hunt';

interface HeaderBarProps {
  activeModule: ModuleId;
  onSelectModule: (id: ModuleId) => void;
  onOpenAiStudio: () => void;
}

const NAV_ITEMS: Array<{ id: ModuleId; labelTr: string }> = [
  { id: 'cards', labelTr: 'Hece Kartları' },
  { id: 'scrolling', labelTr: 'Kayan Metin' },
  { id: 'eye', labelTr: 'Göz Egzersizi' },
  { id: 'hunt', labelTr: 'Kelime Avı' },
];

/**
 * Single-row 3-zone top navigation bar:
 * Zone 1: Brand wordmark
 * Zone 2: 4 single-line module navigation buttons
 * Zone 3: Teacher AI Studio button
 */
export function HeaderBar({
  activeModule,
  onSelectModule,
  onOpenAiStudio,
}: HeaderBarProps) {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4 sm:gap-8">
        {/* Zone 1: Single-line Brand Wordmark */}
        <button
          type="button"
          onClick={() => onSelectModule('cards')}
          className="font-display text-lg sm:text-xl font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded-md"
        >
          1. Sınıf Hızlı Okuma Atölyesi
        </button>

        {/* Zone 2: Concise single-line navigation links */}
        <nav
          aria-label="Okuma Modülleri"
          className="hidden md:flex items-center gap-6"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = activeModule === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectModule(item.id)}
                className={`relative py-2 text-sm font-semibold transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded-sm ${
                  isActive
                    ? 'text-blue-700'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {item.labelTr}
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 -bottom-[1px] h-0.5 bg-blue-600 rounded-full"
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Single Primary Action for Teachers */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onOpenAiStudio}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 active:scale-[0.98] rounded-lg transition-all whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
          >
            <Sparkles className="w-4 h-4 text-amber-300" aria-hidden="true" />
            <span>AI Studio</span>
          </button>
        </div>
      </div>

      {/* Mobile Module Strip (compact, single-line scrolling, keeps total sticky height well under 15%) */}
      <nav
        aria-label="Mobil Modül Seçimi"
        className="flex md:hidden items-center gap-2 px-4 py-2 border-t border-slate-100 overflow-x-auto bg-slate-50/80"
      >
        {NAV_ITEMS.map((item) => {
          const isActive = activeModule === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectModule(item.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
              }`}
            >
              {item.labelTr}
            </button>
          );
        })}
      </nav>
    </header>
  );
}
