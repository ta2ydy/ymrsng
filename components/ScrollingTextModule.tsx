'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Volume2,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  Loader2,
} from 'lucide-react';
import {
  CURATED_STORIES,
  DecodableStory,
  evaluateDecodability,
  getPhonicsGroup,
} from '@/lib/phonics';
import { STORY_THEMES, StoryThemeId } from '@/lib/prompts';
import { SyllableWord, speakTurkish } from './SyllableWord';

interface ScrollingTextModuleProps {
  groupId: 1 | 2 | 3 | 4 | 5;
  aiStoriesByGroup: Record<number, DecodableStory[]>;
  onAddAiStory: (story: DecodableStory) => void;
}

type ReadingMode = 'pacer' | 'teleprompter';
type FontScale = 'md' | 'lg' | 'xl';

/**
 * Guided Speed-Reading & Teleprompter Module ("Kayan Metin")
 * Includes the on-demand AI Decodable Story Generator ("Sihirli Yeni Metin Üret").
 */
export function ScrollingTextModule({
  groupId,
  aiStoriesByGroup,
  onAddAiStory,
}: ScrollingTextModuleProps) {
  const group = getPhonicsGroup(groupId);

  const availableStories = useMemo(() => {
    const curated = CURATED_STORIES[groupId] ?? [];
    const generated = aiStoriesByGroup[groupId] ?? [];
    return [...generated, ...curated];
  }, [groupId, aiStoriesByGroup]);

  const [selectedStoryId, setSelectedStoryId] = useState<string>(
    availableStories[0]?.id ?? ''
  );
  const [readingMode, setReadingMode] = useState<ReadingMode>('pacer');
  const [wpm, setWpm] = useState<number>(45);
  const [fontScale, setFontScale] = useState<FontScale>('lg');
  const [highlightSyllables, setHighlightSyllables] = useState<boolean>(true);

  // Pacer playback state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [activeWordIndex, setActiveWordIndex] = useState<number>(-1);
  const [teleprompterOffset, setTeleprompterOffset] = useState<number>(0);

  // Comprehension question state
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  // AI Story Generator state
  const [themeId, setThemeId] = useState<StoryThemeId>('nature');
  const [customTopic, setCustomTopic] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [lastGenNote, setLastGenNote] = useState<string | null>(null);

  const teleprompterRef = useRef<HTMLDivElement | null>(null);

  const activeStory =
    availableStories.find((s) => s.id === selectedStoryId) ?? availableStories[0];

  // Flatten sentences into indexed word tokens for word-by-word pacer mode
  const sentenceWords = useMemo(() => {
    if (!activeStory) return [];
    let runningIndex = 0;
    return activeStory.sentences.map((sentence) => {
      const tokens = sentence.split(/\s+/).filter(Boolean);
      return tokens.map((word) => {
        const entry = { word, index: runningIndex };
        runningIndex += 1;
        return entry;
      });
    });
  }, [activeStory]);

  const totalWords = useMemo(
    () => sentenceWords.reduce((sum, line) => sum + line.length, 0),
    [sentenceWords]
  );

  const decodability = useMemo(() => {
    if (!activeStory) return null;
    const combined = [activeStory.title, ...activeStory.sentences].join(' ');
    return evaluateDecodability(combined, groupId);
  }, [activeStory, groupId]);

  // Pacer word-by-word timer
  useEffect(() => {
    if (!isPlaying || readingMode !== 'pacer' || totalWords === 0) return;

    const msPerWord = Math.max(250, Math.round(60000 / wpm));
    const timer = window.setInterval(() => {
      setActiveWordIndex((prev) => {
        const next = prev + 1;
        if (next >= totalWords) {
          setIsPlaying(false);
          return totalWords - 1;
        }
        return next;
      });
    }, msPerWord);

    return () => window.clearInterval(timer);
  }, [isPlaying, readingMode, wpm, totalWords]);

  // Teleprompter smooth scroll timer
  useEffect(() => {
    if (!isPlaying || readingMode !== 'teleprompter') return;

    const pixelsPerTick = Math.max(0.6, wpm / 38);
    const timer = window.setInterval(() => {
      setTeleprompterOffset((prev) => {
        const maxScroll = 240;
        if (prev >= maxScroll) {
          setIsPlaying(false);
          return maxScroll;
        }
        return prev + pixelsPerTick;
      });
    }, 30);

    return () => window.clearInterval(timer);
  }, [isPlaying, readingMode, wpm]);

  const handleResetPlayback = () => {
    setIsPlaying(false);
    setActiveWordIndex(-1);
    setTeleprompterOffset(0);
  };

  const handleSelectStory = (id: string) => {
    setSelectedStoryId(id);
    setIsPlaying(false);
    setActiveWordIndex(-1);
    setTeleprompterOffset(0);
    setSelectedOption(null);
  };

  const handleGenerateAiStory = async () => {
    setIsGenerating(true);
    setGenerateError(null);
    setLastGenNote(null);

    try {
      const response = await fetch('/api/generate-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId,
          themeId,
          customTopic: customTopic.trim() || undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Metin üretilirken bir hata oluştu.');
      }

      const generatedStory: DecodableStory = data.story;
      onAddAiStory(generatedStory);
      setSelectedStoryId(generatedStory.id);
      setIsPlaying(false);
      setActiveWordIndex(-1);
      setTeleprompterOffset(0);
      setSelectedOption(null);
      setCustomTopic('');

      const accuracy = data?.decodabilityReport?.accuracyPercent ?? 100;
      setLastGenNote(
        `Yeni metin hazır · ${group.code} harf uyumu: %${accuracy}`
      );
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Bağlantı hatası nedeniyle yeni metin üretilemedi.';
      setGenerateError(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  const fontSizeClass =
    fontScale === 'xl'
      ? 'text-2xl sm:text-3xl leading-[1.85]'
      : fontScale === 'lg'
      ? 'text-xl sm:text-2xl leading-[1.8]'
      : 'text-lg sm:text-xl leading-[1.75]';

  if (!activeStory) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
      {/* Left/Main Reading Canvas (8 cols) */}
      <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-6 sm:p-8 flex flex-col justify-between gap-6">
        {/* Story Picker & Metadata Line */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {availableStories.map((story) => {
                const isSelected = story.id === activeStory.id;
                return (
                  <button
                    key={story.id}
                    type="button"
                    onClick={() => handleSelectStory(story.id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {story.isAiGenerated && (
                      <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                    )}
                    <span>{story.title}</span>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() =>
                speakTurkish(
                  `${activeStory.title}. ${activeStory.sentences.join(' ')}`,
                  0.85
                )
              }
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <Volume2 className="w-4 h-4 text-blue-600" aria-hidden="true" />
              <span>Metni Dinle</span>
            </button>
          </div>

          {/* Clean Unboxed Metadata Row (Zero-Pill Rule) */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className="font-semibold text-slate-700">
              {group.titleTr} ({group.code})
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">
              {totalWords} kelime
            </span>
            {decodability && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-emerald-700 font-semibold">
                  %{decodability.accuracyPercent} grup harf uyumu
                </span>
              </>
            )}
            {activeStory.isAiGenerated && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-blue-700 font-semibold">
                  Yapay Zeka Hikayesi
                </span>
              </>
            )}
          </div>
        </div>

        {/* Interactive Story Stage */}
        <div className="flex-1 bg-slate-50 border border-slate-200/80 rounded-xl p-6 sm:p-8 flex flex-col justify-between">
          <div>
            <h3 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 mb-6 text-balance">
              <SyllableWord
                word={activeStory.title}
                highlightSyllables={highlightSyllables}
              />
            </h3>

            {readingMode === 'pacer' ? (
              <div className={`space-y-4 font-medium ${fontSizeClass}`}>
                {sentenceWords.map((line, lineIdx) => (
                  <p key={lineIdx} className="flex flex-wrap gap-x-2.5 gap-y-1">
                    {line.map((token) => {
                      const isCurrent = token.index === activeWordIndex;
                      const isPassed =
                        activeWordIndex >= 0 && token.index < activeWordIndex;

                      return (
                        <span
                          key={token.index}
                          onClick={() => speakTurkish(token.word, 0.8)}
                          title="Kelimeyi dinle"
                          className={`cursor-pointer rounded-md px-1.5 py-0.5 transition-colors duration-150 ${
                            isCurrent
                              ? 'bg-amber-200/90 text-slate-950 ring-2 ring-amber-400'
                              : isPassed
                              ? 'opacity-55'
                              : 'hover:bg-slate-200/70'
                          }`}
                        >
                          <SyllableWord
                            word={token.word}
                            highlightSyllables={highlightSyllables}
                          />
                        </span>
                      );
                    })}
                  </p>
                ))}
              </div>
            ) : (
              <div
                ref={teleprompterRef}
                className="relative h-64 overflow-hidden rounded-lg bg-white border border-slate-200 px-6 py-6"
              >
                <div
                  className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 h-14 bg-blue-50/60 border-y border-blue-200/70"
                  aria-hidden="true"
                />
                <div
                  style={{
                    transform: `translateY(${110 - teleprompterOffset}px)`,
                  }}
                  className={`relative z-10 space-y-5 font-medium transition-transform duration-75 ease-linear ${fontSizeClass}`}
                >
                  {activeStory.sentences.map((sentence, idx) => (
                    <p key={idx} className="flex flex-wrap gap-x-2.5">
                      {sentence.split(/\s+/).map((word, wIdx) => (
                        <SyllableWord
                          key={`${idx}-${wIdx}`}
                          word={word}
                          highlightSyllables={highlightSyllables}
                        />
                      ))}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Pre-reading / Focus Words Strip */}
          {activeStory.focusWords.length > 0 && (
            <div className="mt-8 pt-4 border-t border-slate-200/80 flex flex-wrap items-center gap-2 text-xs">
              <span className="font-semibold text-slate-600 mr-1">
                Odak Kelimeler:
              </span>
              {activeStory.focusWords.map((fw, idx) => (
                <button
                  key={`${fw}-${idx}`}
                  type="button"
                  onClick={() => speakTurkish(fw, 0.8)}
                  className="px-2.5 py-1 bg-white border border-slate-200 hover:border-blue-400 rounded-md font-semibold text-slate-800 transition-colors"
                >
                  {fw}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Playback Transport Bar + Comprehension Mini-Check */}
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (!isPlaying && readingMode === 'pacer' && activeWordIndex >= totalWords - 1) {
                    setActiveWordIndex(-1);
                  }
                  if (!isPlaying && readingMode === 'teleprompter' && teleprompterOffset >= 240) {
                    setTeleprompterOffset(0);
                  }
                  setIsPlaying((p) => !p);
                }}
                className="inline-flex items-center gap-2 px-5 h-11 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-4 h-4" aria-hidden="true" />
                    <span>Duraklat</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" aria-hidden="true" />
                    <span>Okumayı Başlat</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleResetPlayback}
                className="inline-flex items-center gap-1.5 px-4 h-11 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold transition-colors whitespace-nowrap shrink-0"
              >
                <RotateCcw className="w-4 h-4" aria-hidden="true" />
                <span>Başa Sar</span>
              </button>
            </div>

            {readingMode === 'pacer' && (
              <div className="text-xs font-mono tabular-nums text-slate-600">
                İlerleme:{' '}
                <span className="font-semibold text-slate-900">
                  {Math.max(0, activeWordIndex + 1)}/{totalWords}
                </span>{' '}
                kelime
              </div>
            )}
          </div>

          {/* Comprehension Mini Check */}
          {activeStory.comprehension?.question && (
            <div className="pt-4 border-t border-slate-200">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 mb-2">
                <BookOpen className="w-4 h-4 text-blue-600" aria-hidden="true" />
                <span>Okuduğunu Anlama Sorusu</span>
              </div>
              <p className="text-sm sm:text-base font-bold text-slate-900 mb-3">
                {activeStory.comprehension.question}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {activeStory.comprehension.options.map((opt, idx) => {
                  const isPicked = selectedOption === idx;
                  const isCorrect =
                    idx === activeStory.comprehension.correctIndex;
                  const showResult = selectedOption !== null;

                  let btnStyle =
                    'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100';
                  if (showResult && isCorrect) {
                    btnStyle =
                      'bg-emerald-50 border-emerald-400 text-emerald-900';
                  } else if (showResult && isPicked && !isCorrect) {
                    btnStyle = 'bg-rose-50 border-rose-400 text-rose-900';
                  }

                  return (
                    <button
                      key={`${opt}-${idx}`}
                      type="button"
                      onClick={() => setSelectedOption(idx)}
                      className={`px-3.5 py-2.5 text-sm font-semibold rounded-lg border text-left transition-colors flex items-center justify-between gap-2 ${btnStyle}`}
                    >
                      <span>{opt}</span>
                      {showResult && isCorrect && (
                        <CheckCircle2
                          className="w-4 h-4 text-emerald-600 shrink-0"
                          aria-hidden="true"
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Control & AI Story Generator Panel (4 cols) */}
      <aside className="lg:col-span-4 flex flex-col gap-6">
        {/* Speed & Reading Controls */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
          <h3 className="font-display text-base font-bold text-slate-900">
            Okuma Hızı ve Görünüm
          </h3>

          {/* Reading Mode Toggle */}
          <div className="space-y-1.5">
            <span className="block text-xs font-semibold text-slate-700">
              Akış Modu
            </span>
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-lg">
              <button
                type="button"
                onClick={() => {
                  handleResetPlayback();
                  setReadingMode('pacer');
                }}
                className={`py-2 px-2.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                  readingMode === 'pacer'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Kelime Takibi
              </button>
              <button
                type="button"
                onClick={() => {
                  handleResetPlayback();
                  setReadingMode('teleprompter');
                }}
                className={`py-2 px-2.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                  readingMode === 'teleprompter'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Kayan Ekran
              </button>
            </div>
          </div>

          {/* WPM Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <label htmlFor="wpm-slider" className="text-slate-700">
                Okuma Hızı
              </label>
              <span className="font-mono tabular-nums text-blue-700">
                {wpm} Kelime / Dk
              </span>
            </div>
            <input
              id="wpm-slider"
              type="range"
              min={20}
              max={130}
              step={5}
              value={wpm}
              onChange={(e) => setWpm(Number(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-slate-500 font-mono tabular-nums">
              <span>20 K/Dk</span>
              <span>75 K/Dk</span>
              <span>130 K/Dk</span>
            </div>
          </div>

          {/* Font Scale & Syllable Color */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="space-y-1.5">
              <span className="block text-xs font-semibold text-slate-700">
                Yazı Boyutu
              </span>
              <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-lg">
                {(['md', 'lg', 'xl'] as FontScale[]).map((sz, i) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => setFontScale(sz)}
                    className={`py-1.5 text-xs font-semibold rounded-md transition-colors ${
                      fontScale === sz
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {i === 0 ? 'Normal' : i === 1 ? 'Büyük' : 'Dev'}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="block text-xs font-semibold text-slate-700">
                Renkli Hece
              </span>
              <button
                type="button"
                onClick={() => setHighlightSyllables((v) => !v)}
                className={`w-full py-2 px-3 text-xs font-semibold rounded-lg border transition-colors ${
                  highlightSyllables
                    ? 'bg-blue-50 border-blue-300 text-blue-800'
                    : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                {highlightSyllables ? 'Açık (Mavi/Kırmızı)' : 'Kapalı'}
              </button>
            </div>
          </div>
        </div>

        {/* AI Decodable Story Generator Panel */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 flex-1 flex flex-col justify-between">
          <div className="space-y-4">
            <div>
              <h3 className="font-display text-base font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600" aria-hidden="true" />
                <span>Yapay Zeka Hikaye Üreticisi</span>
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                Yalnızca{' '}
                <span className="font-semibold text-slate-900">
                  {group.titleTr} ({group.code})
                </span>{' '}
                harflerini kullanan yepyeni bir okuma metni oluşturur.
              </p>
            </div>

            {/* Theme Selection */}
            <div className="space-y-1.5">
              <span className="block text-xs font-semibold text-slate-700">
                Hikaye Teması
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {STORY_THEMES.map((theme) => (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => setThemeId(theme.id)}
                    className={`px-2.5 py-2 text-xs font-semibold rounded-lg border text-left transition-colors ${
                      themeId === theme.id
                        ? 'bg-blue-50 border-blue-400 text-blue-900'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {theme.labelTr}
                  </button>
                ))}
              </div>
            </div>

            {/* Optional Custom Topic */}
            <div className="space-y-1.5">
              <label
                htmlFor="custom-topic"
                className="block text-xs font-semibold text-slate-700"
              >
                İsteğe Bağlı Konu
              </label>
              <input
                id="custom-topic"
                type="text"
                value={customTopic}
                onChange={(e) => setCustomTopic(e.target.value)}
                placeholder="Örn: Tatilde lale toplama..."
                maxLength={60}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900 placeholder:text-slate-400"
              />
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <button
              type="button"
              onClick={handleGenerateAiStory}
              disabled={isGenerating}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white text-sm font-semibold transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
            >
              {isGenerating ? (
                <>
                  <Loader2
                    className="w-4 h-4 animate-spin"
                    aria-hidden="true"
                  />
                  <span>Yeni Metin Üretiliyor...</span>
                </>
              ) : (
                <>
                  <Sparkles
                    className="w-4 h-4 text-amber-300"
                    aria-hidden="true"
                  />
                  <span>Sihirli Yeni Metin Üret</span>
                </>
              )}
            </button>

            {lastGenNote && (
              <div className="flex items-center gap-2 text-xs font-medium text-emerald-700">
                <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>{lastGenNote}</span>
              </div>
            )}

            {generateError && (
              <div className="flex items-start gap-2 text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-2.5">
                <AlertCircle
                  className="w-4 h-4 shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                <span>{generateError}</span>
              </div>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}
