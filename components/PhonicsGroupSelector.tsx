'use client';

import React from 'react';
import { PHONICS_GROUPS, getPhonicsGroup, toTurkishUpper } from '@/lib/phonics';
import { speakTurkish } from './SyllableWord';
import { Volume2 } from 'lucide-react';

interface PhonicsGroupSelectorProps {
  selectedGroupId: 1 | 2 | 3 | 4 | 5;
  onSelectGroup: (groupId: 1 | 2 | 3 | 4 | 5) => void;
}

/**
 * Interactive 5-group cumulative Turkish phonics selector and unlocked letter strip.
 */
export function PhonicsGroupSelector({
  selectedGroupId,
  onSelectGroup,
}: PhonicsGroupSelectorProps) {
  const activeGroup = getPhonicsGroup(selectedGroupId);
  const newLetterSet = new Set(activeGroup.newLetters);

  return (
    <section
      aria-label="Ses Grubu Seçimi"
      className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5"
    >
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="font-display text-base sm:text-lg font-bold text-slate-900">
            Ses Grubu Seçimi
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            {activeGroup.titleTr} ({activeGroup.code}) · Toplam{' '}
            <span className="font-mono tabular-nums font-semibold text-slate-900">
              {activeGroup.cumulativeLetters.length}
            </span>{' '}
            harf açık · Tüm modüller seçili harflerle çalışır
          </p>
        </div>

        {/* Interactive 5-group segmented selector */}
        <div
          role="tablist"
          aria-label="Türkçe İlk Okuma Ses Grupları"
          className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 p-1 bg-slate-100 rounded-lg"
        >
          {PHONICS_GROUPS.map((group) => {
            const isSelected = group.id === selectedGroupId;
            return (
              <button
                key={group.id}
                role="tab"
                type="button"
                aria-selected={isSelected}
                onClick={() => onSelectGroup(group.id)}
                className={`px-3 py-2 text-xs sm:text-sm font-semibold rounded-md transition-all whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-white/70'
                }`}
              >
                {group.id}. Grup · {group.code}
              </button>
            );
          })}
        </div>
      </div>

      {/* Unlocked Cumulative Alphabet Display */}
      <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {activeGroup.cumulativeLetters.map((letter) => {
            const isNewInGroup = newLetterSet.has(letter);
            const upper = toTurkishUpper(letter);
            return (
              <button
                key={letter}
                type="button"
                onClick={() => speakTurkish(letter, 0.75)}
                title={`${upper} sesini dinle`}
                className={`w-9 h-9 inline-flex flex-col items-center justify-center rounded-lg border text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                  isNewInGroup
                    ? 'bg-blue-50 border-blue-300 text-blue-800 hover:bg-blue-100'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span className="leading-none">
                  {upper}
                  {letter}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-4 text-xs text-slate-600 shrink-0">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-blue-100 border border-blue-400" aria-hidden="true" />
            <span>Yeni sesler ({activeGroup.code})</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Volume2 className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
            <span>Harfe dokunup dinle</span>
          </span>
        </div>
      </div>
    </section>
  );
}
