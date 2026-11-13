'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Shuffle,
  Volume2,
  Eye,
  RotateCcw,
} from 'lucide-react';
import {
  GROUP_SYLLABLES,
  GROUP_WORDS,
  getPhonicsGroup,
} from '@/lib/phonics';
import { SyllableWord, speakTurkish } from './SyllableWord';

interface SyllableFlashcardsModuleProps {
  groupId: 1 | 2 | 3 | 4 | 5;
}

type DeckMode = 'syllables' | 'words';

/**
 * Interactive Tachistoscope / Flashcard Speed-Reading Trainer.
 * Displays decodable syllables or words strictly filtered to the active phonics group.
 */
export function SyllableFlashcardsModule({
  groupId,
}: SyllableFlashcardsModuleProps) {
  const [deckMode, setDeckMode] = useState<DeckMode>('words');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [intervalMs, setIntervalMs] = useState(1200);
  const [highlightSyllables, setHighlightSyllables] = useState(true);
  const [cardsRead, setCardsRead] = useState(0);
  const [shuffleSeed, setShuffleSeed] = useState(0);

  const group = getPhonicsGroup(groupId);

  const items = useMemo(() => {
    const base =
      deckMode === 'syllables'
        ? GROUP_SYLLABLES[groupId]
        : GROUP_WORDS[groupId];
    if (shuffleSeed === 0) return base;
    const copy = [...base];
    // Deterministic Fisher-Yates shuffle seeded by shuffleSeed
    let s = shuffleSeed;
    for (let i = copy.length - 1; i > 0; i--) {
      s = (s * 9301 + 49297) % 233280;
      const j = s % (i + 1);
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }, [deckMode, groupId, shuffleSeed]);

  const handleDeckModeChange = (mode: DeckMode) => {
    setDeckMode(mode);
    setCurrentIndex(0);
    setIsPlaying(false);
  };

  useEffect(() => {
    if (!isPlaying) return;
    const timer = window.setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
      setCardsRead((c) => c + 1);
    }, intervalMs);

    return () => window.clearInterval(timer);
  }, [isPlaying, intervalMs, items.length]);

  const currentItem = items[currentIndex] ?? items[0];

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % items.length);
    setCardsRead((c) => c + 1);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
  };

  const handleShuffle = () => {
    setShuffleSeed((prev) => prev + 1);
    setCurrentIndex(0);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentIndex(0);
    setCardsRead(0);
  };

  const speedLabel =
    intervalMs <= 700
      ? 'Çok Hızlı'
      : intervalMs <= 1200
      ? 'Hızlı'
      : intervalMs <= 1800
      ? 'Orta'
      : 'Yavaş';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
      {/* Left/Top Interactive Flashcard Stage (8 cols) */}
      <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-6 sm:p-8 flex flex-col justify-between min-h-[420px]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-600">
            <span className="font-semibold text-slate-900">
              {group.titleTr} ({group.code})
            </span>
            <span aria-hidden="true">·</span>
            <span>
              Kart{' '}
              <span className="font-mono tabular-nums font-semibold text-slate-900">
                {currentIndex + 1}/{items.length}
              </span>
            </span>
            <span aria-hidden="true">·</span>
            <span>
              Okunan:{' '}
              <span className="font-mono tabular-nums font-semibold text-blue-700">
                {cardsRead}
              </span>
            </span>
          </div>

          <button
            type="button"
            onClick={() => speakTurkish(currentItem, 0.85)}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
          >
            <Volume2 className="w-4 h-4 text-blue-600" aria-hidden="true" />
            <span>Sesli Dinle</span>
          </button>
        </div>

        {/* Focal Card Display */}
        <div className="my-8 flex-1 flex items-center justify-center bg-slate-50 border border-slate-200/80 rounded-xl px-6 py-12 relative overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${currentItem}-${currentIndex}`}
              initial={{ opacity: 0, scale: 0.94, y: 6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 1.03, y: -6 }}
              transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
              className="text-center select-none"
            >
              <div className="font-display text-5xl sm:text-7xl font-extrabold tracking-tight">
                <SyllableWord
                  word={currentItem}
                  highlightSyllables={highlightSyllables}
                />
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Stage Transport Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Önceki kart"
              className="inline-flex items-center justify-center w-11 h-11 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            >
              <SkipBack className="w-5 h-5" aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={() => setIsPlaying((p) => !p)}
              className="inline-flex items-center gap-2 px-6 h-11 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
            >
              {isPlaying ? (
                <>
                  <Pause className="w-4 h-4" aria-hidden="true" />
                  <span>Duraklat</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" aria-hidden="true" />
                  <span>Otomatik Başlat</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleNext}
              aria-label="Sonraki kart"
              className="inline-flex items-center justify-center w-11 h-11 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            >
              <SkipForward className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleShuffle}
              className="inline-flex items-center gap-1.5 px-3.5 h-11 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap shrink-0"
            >
              <Shuffle className="w-4 h-4" aria-hidden="true" />
              <span>Karıştır</span>
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 px-3.5 h-11 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap shrink-0"
            >
              <RotateCcw className="w-4 h-4" aria-hidden="true" />
              <span>Sıfırla</span>
            </button>
          </div>
        </div>
      </div>

      {/* Right Control & Deck Panel (4 cols) */}
      <aside className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between gap-6">
        <div className="space-y-6">
          <div>
            <h3 className="font-display text-base font-bold text-slate-900">
              Kart Ayarları
            </h3>
            <p className="text-xs text-slate-600 mt-1">
              Öğrencinin okuma hızına göre kart türünü ve geçiş süresini ayarlayın.
            </p>
          </div>

          {/* Deck Mode Switch */}
          <div className="space-y-2">
            <span className="block text-xs font-semibold text-slate-700">
              Kart Türü
            </span>
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-lg">
              <button
                type="button"
                onClick={() => handleDeckModeChange('syllables')}
                className={`py-2 px-3 text-xs sm:text-sm font-semibold rounded-md transition-colors whitespace-nowrap ${
                  deckMode === 'syllables'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Heceler ({GROUP_SYLLABLES[groupId].length})
              </button>
              <button
                type="button"
                onClick={() => handleDeckModeChange('words')}
                className={`py-2 px-3 text-xs sm:text-sm font-semibold rounded-md transition-colors whitespace-nowrap ${
                  deckMode === 'words'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Kelimeler ({GROUP_WORDS[groupId].length})
              </button>
            </div>
          </div>

          {/* Flash Interval Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <label htmlFor="flash-speed" className="text-slate-700">
                Kart Geçiş Süresi
              </label>
              <span className="font-mono tabular-nums text-blue-700">
                {(intervalMs / 1000).toFixed(1)} sn · {speedLabel}
              </span>
            </div>
            <input
              id="flash-speed"
              type="range"
              min={500}
              max={2500}
              step={100}
              value={intervalMs}
              onChange={(e) => setIntervalMs(Number(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-slate-500 font-mono tabular-nums">
              <span>0.5 sn (Hızlı)</span>
              <span>1.5 sn</span>
              <span>2.5 sn (Yavaş)</span>
            </div>
          </div>

          {/* Syllable Color Highlight Toggle */}
          <div className="pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setHighlightSyllables((v) => !v)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors text-left"
            >
              <div className="flex items-center gap-2.5">
                <Eye className="w-4 h-4 text-blue-600" aria-hidden="true" />
                <div>
                  <div className="text-sm font-semibold text-slate-900">
                    Renkli Hece Gösterimi
                  </div>
                  <div className="text-xs text-slate-500">
                    Heceleri mavi ve kırmızı ayırır
                  </div>
                </div>
              </div>
              <span
                className={`text-xs font-semibold ${
                  highlightSyllables ? 'text-blue-700' : 'text-slate-500'
                }`}
              >
                {highlightSyllables ? 'Açık' : 'Kapalı'}
              </span>
            </button>
          </div>
        </div>

        {/* Quick Jump Word Strip */}
        <div className="pt-4 border-t border-slate-100">
          <div className="text-xs font-semibold text-slate-700 mb-2">
            Hızlı Kart Seçimi
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
            {items.map((item, idx) => (
              <button
                key={`${item}-${idx}`}
                type="button"
                onClick={() => {
                  setIsPlaying(false);
                  setCurrentIndex(idx);
                }}
                className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-colors ${
                  idx === currentIndex
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}
