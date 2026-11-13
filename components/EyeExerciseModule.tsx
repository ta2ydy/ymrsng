'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Play, Pause, RotateCcw, Eye, Target } from 'lucide-react';
import {
  GROUP_WORDS,
  getPhonicsGroup,
  getWordPyramid,
} from '@/lib/phonics';
import { SyllableWord } from './SyllableWord';

interface EyeExerciseModuleProps {
  groupId: 1 | 2 | 3 | 4 | 5;
}

type EyeMode = 'saccade' | 'pyramid';
type TrackPattern = 'horizontal' | 'corners';

/**
 * Eye-Tracking & Visual Span Expansion Module ("Göz Egzersizi").
 * Uses words strictly decodable within the selected cumulative phonics group.
 */
export function EyeExerciseModule({ groupId }: EyeExerciseModuleProps) {
  const [eyeMode, setEyeMode] = useState<EyeMode>('saccade');
  const [pattern, setPattern] = useState<TrackPattern>('horizontal');
  const [isPlaying, setIsPlaying] = useState(false);
  const [tempo, setTempo] = useState(70); // steps per minute
  const [stepIndex, setStepIndex] = useState(0);
  const [highlightSyllables, setHighlightSyllables] = useState(true);

  const group = getPhonicsGroup(groupId);
  const words = GROUP_WORDS[groupId];
  const pyramidRows = useMemo(() => getWordPyramid(groupId), [groupId]);

  const handleEyeModeChange = (mode: EyeMode) => {
    setEyeMode(mode);
    setIsPlaying(false);
    setStepIndex(0);
  };

  useEffect(() => {
    if (!isPlaying) return;
    const msPerStep = Math.max(350, Math.round(60000 / tempo));
    const timer = window.setInterval(() => {
      setStepIndex((prev) => prev + 1);
    }, msPerStep);

    return () => window.clearInterval(timer);
  }, [isPlaying, tempo]);

  const activeWord = words[stepIndex % words.length];
  const activePyramidRow = stepIndex % pyramidRows.length;

  // Position calculation for Saccade Track
  const horizontalSlots = 2; // Left -> Right
  const cornerSlots = 4; // Top-Left -> Top-Right -> Bottom-Left -> Bottom-Right
  const activeSlot =
    pattern === 'horizontal'
      ? stepIndex % horizontalSlots
      : stepIndex % cornerSlots;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
      {/* Left Interactive Eye Stage (8 cols) */}
      <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-6 sm:p-8 flex flex-col justify-between min-h-[430px]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-600">
            <span className="font-semibold text-slate-900">
              {group.titleTr} ({group.code})
            </span>
            <span aria-hidden="true">·</span>
            <span>
              {eyeMode === 'saccade'
                ? 'Başını sabit tut, yalnızca gözlerinle takip et'
                : 'Ortadaki noktaya bakarak tüm satırı tek seferde oku'}
            </span>
          </div>

          <div className="text-xs font-mono tabular-nums text-slate-600">
            Adım:{' '}
            <span className="font-semibold text-slate-900">{stepIndex}</span>
          </div>
        </div>

        {/* Stage Canvas */}
        <div className="my-6 flex-1 bg-slate-50 border border-slate-200/80 rounded-xl p-6 flex items-center justify-center relative overflow-hidden">
          {eyeMode === 'saccade' ? (
            <div className="w-full h-64 relative flex items-center justify-center">
              {/* Subtle focal anchor in center */}
              <div
                aria-hidden="true"
                className="w-2.5 h-2.5 rounded-full bg-slate-300"
              />

              {pattern === 'horizontal' ? (
                <div className="absolute inset-0 flex items-center justify-between px-4 sm:px-14">
                  {[0, 1].map((slot) => {
                    const isHere = activeSlot === slot;
                    return (
                      <div
                        key={slot}
                        className="w-40 sm:w-52 h-24 flex items-center justify-center"
                      >
                        {isHere && (
                          <motion.div
                            key={`h-${stepIndex}`}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.14 }}
                            className="px-5 py-3 bg-white border-2 border-blue-500 rounded-xl shadow-sm font-display text-2xl sm:text-3xl font-bold"
                          >
                            <SyllableWord
                              word={activeWord}
                              highlightSyllables={highlightSyllables}
                            />
                          </motion.div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 p-4 sm:p-8 gap-4">
                  {[0, 1, 2, 3].map((slot) => {
                    const isHere = activeSlot === slot;
                    return (
                      <div
                        key={slot}
                        className="flex items-center justify-center"
                      >
                        {isHere && (
                          <motion.div
                            key={`c-${stepIndex}`}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.14 }}
                            className="px-5 py-3 bg-white border-2 border-blue-500 rounded-xl shadow-sm font-display text-2xl sm:text-3xl font-bold"
                          >
                            <SyllableWord
                              word={activeWord}
                              highlightSyllables={highlightSyllables}
                            />
                          </motion.div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="w-full py-4 relative flex flex-col items-center justify-center gap-3.5">
              {/* Vertical center eye-fixation line */}
              <div
                aria-hidden="true"
                className="absolute inset-y-2 left-1/2 -translate-x-1/2 w-px bg-rose-300/80 pointer-events-none"
              />

              {pyramidRows.map((rowText, idx) => {
                const isActiveRow = idx === activePyramidRow;
                return (
                  <div
                    key={idx}
                    onClick={() => setStepIndex(idx)}
                    className={`relative z-10 px-6 py-2 rounded-lg transition-all cursor-pointer font-display text-xl sm:text-2xl font-bold text-center ${
                      isActiveRow
                        ? 'bg-white border-2 border-blue-600 shadow-sm scale-105'
                        : 'text-slate-400 hover:text-slate-700'
                    }`}
                  >
                    {rowText.split(' ').map((w, wIdx) => (
                      <span key={wIdx} className="mx-2 inline-block">
                        <SyllableWord
                          word={w}
                          highlightSyllables={
                            isActiveRow ? highlightSyllables : false
                          }
                        />
                      </span>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Transport Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsPlaying((p) => !p)}
              className="inline-flex items-center gap-2 px-5 h-11 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0"
            >
              {isPlaying ? (
                <>
                  <Pause className="w-4 h-4" aria-hidden="true" />
                  <span>Duraklat</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" aria-hidden="true" />
                  <span>Egzersizi Başlat</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setIsPlaying(false);
                setStepIndex(0);
              }}
              className="inline-flex items-center gap-1.5 px-4 h-11 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold transition-colors whitespace-nowrap shrink-0"
            >
              <RotateCcw className="w-4 h-4" aria-hidden="true" />
              <span>Sıfırla</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setStepIndex((s) => s + 1)}
            className="px-4 h-11 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap shrink-0"
          >
            Tek Adım İlerle
          </button>
        </div>
      </div>

      {/* Right Control Panel (4 cols) */}
      <aside className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-6 space-y-6">
        <div>
          <h3 className="font-display text-base font-bold text-slate-900">
            Göz Egzersizi Ayarları
          </h3>
          <p className="text-xs text-slate-600 mt-1">
            Göz kaslarını hızlandırmak ve görme alanını genişletmek için çalışma
            modunu seçin.
          </p>
        </div>

        {/* Exercise Mode */}
        <div className="space-y-2">
          <span className="block text-xs font-semibold text-slate-700">
            Çalışma Türü
          </span>
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-lg">
            <button
              type="button"
              onClick={() => handleEyeModeChange('saccade')}
              className={`py-2 px-2.5 text-xs font-semibold rounded-md transition-colors inline-flex items-center justify-center gap-1.5 whitespace-nowrap ${
                eyeMode === 'saccade'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Target className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Zıplayan Hedef</span>
            </button>
            <button
              type="button"
              onClick={() => handleEyeModeChange('pyramid')}
              className={`py-2 px-2.5 text-xs font-semibold rounded-md transition-colors inline-flex items-center justify-center gap-1.5 whitespace-nowrap ${
                eyeMode === 'pyramid'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Eye className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Kelime Piramidi</span>
            </button>
          </div>
        </div>

        {/* Saccade Track Pattern */}
        {eyeMode === 'saccade' && (
          <div className="space-y-2">
            <span className="block text-xs font-semibold text-slate-700">
              Hareket Yönü
            </span>
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-lg">
              <button
                type="button"
                onClick={() => setPattern('horizontal')}
                className={`py-2 px-2.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                  pattern === 'horizontal'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Sağ – Sol
              </button>
              <button
                type="button"
                onClick={() => setPattern('corners')}
                className={`py-2 px-2.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                  pattern === 'corners'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                4 Köşe Parkuru
              </button>
            </div>
          </div>
        )}

        {/* Tempo Slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold">
            <label htmlFor="eye-tempo" className="text-slate-700">
              Göz Hareket Hızı
            </label>
            <span className="font-mono tabular-nums text-blue-700">
              {tempo} Adım / Dk
            </span>
          </div>
          <input
            id="eye-tempo"
            type="range"
            min={40}
            max={140}
            step={10}
            value={tempo}
            onChange={(e) => setTempo(Number(e.target.value))}
            className="w-full accent-blue-600 cursor-pointer"
          />
          <div className="flex justify-between text-[11px] text-slate-500 font-mono tabular-nums">
            <span>40 / Dk</span>
            <span>90 / Dk</span>
            <span>140 / Dk</span>
          </div>
        </div>

        {/* Syllable Coloring Toggle */}
        <div className="pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setHighlightSyllables((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors text-left"
          >
            <div>
              <div className="text-sm font-semibold text-slate-900">
                Renkli Hece
              </div>
              <div className="text-xs text-slate-500">
                Hece sınırlarını vurgular
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
      </aside>
    </div>
  );
}
