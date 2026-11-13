'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  Volume2,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Trophy,
  Timer,
} from 'lucide-react';
import { GROUP_WORDS, getPhonicsGroup } from '@/lib/phonics';
import { SyllableWord, speakTurkish } from './SyllableWord';

interface WordHuntModuleProps {
  groupId: 1 | 2 | 3 | 4 | 5;
}

interface HuntTile {
  id: string;
  word: string;
  isTarget: boolean;
  status: 'idle' | 'found' | 'wrong';
}

const TARGET_COUNT_PER_ROUND = 3;
const GRID_SIZE = 12;

function buildRound(
  groupId: 1 | 2 | 3 | 4 | 5,
  roundSeed: number
): { targetWord: string; tiles: HuntTile[] } {
  const pool = GROUP_WORDS[groupId];
  const targetWord = pool[roundSeed % pool.length];
  const distractors = pool.filter((w) => w !== targetWord);

  const rawWords: Array<{ word: string; isTarget: boolean }> = [];
  for (let i = 0; i < TARGET_COUNT_PER_ROUND; i++) {
    rawWords.push({ word: targetWord, isTarget: true });
  }
  for (let i = 0; i < GRID_SIZE - TARGET_COUNT_PER_ROUND; i++) {
    const distractor = distractors[(roundSeed * 3 + i) % distractors.length] ?? targetWord;
    rawWords.push({ word: distractor, isTarget: false });
  }

  // Deterministic seeded shuffle
  let s = roundSeed * 1013 + groupId * 37 + 17;
  for (let i = rawWords.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = s % (i + 1);
    [rawWords[i], rawWords[j]] = [rawWords[j], rawWords[i]];
  }

  return {
    targetWord,
    tiles: rawWords.map((item, idx) => ({
      id: `${roundSeed}-${idx}-${item.word}`,
      word: item.word,
      isTarget: item.isTarget,
      status: 'idle',
    })),
  };
}

/**
 * Rapid Visual Scanning & Word Recognition Game ("Kelime Avı").
 */
export function WordHuntModule({ groupId }: WordHuntModuleProps) {
  const group = getPhonicsGroup(groupId);
  const [roundNumber, setRoundNumber] = useState(1);
  const [initialRound] = useState(() => buildRound(groupId, 1));
  const [targetWord, setTargetWord] = useState(initialRound.targetWord);
  const [tiles, setTiles] = useState<HuntTile[]>(initialRound.tiles);
  const [foundCount, setFoundCount] = useState(0);
  const [score, setScore] = useState(0);
  const [elapsedTenths, setElapsedTenths] = useState(0);
  const [highlightSyllables, setHighlightSyllables] = useState(true);
  const [roundComplete, setRoundComplete] = useState(false);

  const startNewRound = useCallback(
    (seed: number) => {
      const next = buildRound(groupId, seed);
      setTargetWord(next.targetWord);
      setTiles(next.tiles);
      setFoundCount(0);
      setElapsedTenths(0);
      setRoundComplete(false);
    },
    [groupId]
  );

  useEffect(() => {
    if (roundComplete) return;
    const timer = window.setInterval(() => {
      setElapsedTenths((t) => t + 1);
    }, 100);
    return () => window.clearInterval(timer);
  }, [roundComplete]);

  const handleTileClick = (tileId: string) => {
    if (roundComplete) return;

    setTiles((prev) =>
      prev.map((tile) => {
        if (tile.id !== tileId || tile.status === 'found') return tile;

        if (tile.isTarget) {
          const nextFound = foundCount + 1;
          setFoundCount(nextFound);
          setScore((s) => s + 10);
          if (nextFound >= TARGET_COUNT_PER_ROUND) {
            setRoundComplete(true);
          }
          return { ...tile, status: 'found' };
        }

        return { ...tile, status: 'wrong' };
      })
    );
  };

  const handleNextRound = () => {
    const nextRound = roundNumber + 1;
    setRoundNumber(nextRound);
    startNewRound(nextRound);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
      {/* Main Word Hunt Board (8 cols) */}
      <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-6 sm:p-8 flex flex-col justify-between gap-6">
        {/* Target Word Prompt Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xs sm:text-sm font-semibold text-slate-600">
              Aranan Kelime:
            </span>
            <div className="px-4 py-1.5 bg-blue-50 border border-blue-200 rounded-lg font-display text-2xl sm:text-3xl font-extrabold">
              <SyllableWord
                word={targetWord}
                highlightSyllables={highlightSyllables}
              />
            </div>
            <button
              type="button"
              onClick={() => speakTurkish(targetWord, 0.8)}
              aria-label="Hedef kelimeyi sesli dinle"
              className="w-10 h-10 inline-flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 text-blue-700 transition-colors"
            >
              <Volume2 className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>

          <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-600">
            <span>
              Bulunan:{' '}
              <span className="font-mono tabular-nums font-bold text-slate-900">
                {foundCount}/{TARGET_COUNT_PER_ROUND}
              </span>
            </span>
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1 font-mono tabular-nums font-semibold text-slate-800">
              <Timer className="w-4 h-4 text-slate-500" aria-hidden="true" />
              {(elapsedTenths / 10).toFixed(1)} sn
            </span>
          </div>
        </div>

        {/* 4x3 Word Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 my-2">
          {tiles.map((tile) => {
            const isFound = tile.status === 'found';
            const isWrong = tile.status === 'wrong';

            let tileClasses =
              'bg-slate-50 border-slate-200 text-slate-900 hover:bg-blue-50/60 hover:border-blue-300';
            if (isFound) {
              tileClasses =
                'bg-emerald-50 border-emerald-400 text-emerald-900';
            } else if (isWrong) {
              tileClasses = 'bg-rose-50 border-rose-300 text-rose-800';
            }

            return (
              <button
                key={tile.id}
                type="button"
                onClick={() => handleTileClick(tile.id)}
                disabled={isFound}
                className={`h-20 sm:h-24 px-3 rounded-xl border-2 font-display text-xl sm:text-2xl font-bold transition-all flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${tileClasses}`}
              >
                <SyllableWord
                  word={tile.word}
                  highlightSyllables={
                    !isFound && !isWrong && highlightSyllables
                  }
                />
                {isFound && (
                  <CheckCircle2
                    className="w-5 h-5 text-emerald-600 shrink-0"
                    aria-hidden="true"
                  />
                )}
                {isWrong && (
                  <XCircle
                    className="w-5 h-5 text-rose-500 shrink-0"
                    aria-hidden="true"
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Round Completion Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
          {roundComplete ? (
            <div className="flex items-center gap-2 text-sm font-bold text-emerald-700">
              <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
              <span>
                Harika! Tüm &ldquo;{targetWord}&rdquo; kelimelerini{' '}
                {(elapsedTenths / 10).toFixed(1)} saniyede buldun.
              </span>
            </div>
          ) : (
            <p className="text-xs sm:text-sm text-slate-600">
              Tablodaki <span className="font-semibold">{TARGET_COUNT_PER_ROUND}</span> adet{' '}
              <span className="font-semibold text-slate-900">{targetWord}</span>{' '}
              kelimesine hızlıca dokun.
            </p>
          )}

          <button
            type="button"
            onClick={handleNextRound}
            className={`inline-flex items-center gap-2 px-5 h-11 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap shrink-0 ${
              roundComplete
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
            }`}
          >
            <RotateCcw className="w-4 h-4" aria-hidden="true" />
            <span>{roundComplete ? 'Yeni Tur Başlat' : 'Kelimeyi Değiştir'}</span>
          </button>
        </div>
      </div>

      {/* Right Score & Options Panel (4 cols) */}
      <aside className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between gap-6">
        <div className="space-y-5">
          <div>
            <h3 className="font-display text-base font-bold text-slate-900">
              Kelime Avı Durumu
            </h3>
            <p className="text-xs text-slate-600 mt-1">
              {group.titleTr} ({group.code}) kelimeleriyle görsel tarama hızını
              artırın.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="text-xs font-semibold text-slate-500">Tur</div>
              <div className="font-mono tabular-nums text-2xl font-bold text-slate-900 mt-1">
                {roundNumber}
              </div>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                <Trophy className="w-3.5 h-3.5 text-amber-500" aria-hidden="true" />
                <span>Puan</span>
              </div>
              <div className="font-mono tabular-nums text-2xl font-bold text-blue-700 mt-1">
                {score}
              </div>
            </div>
          </div>

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
                Kelime avında hece rengini aç/kapat
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

        <div className="pt-4 border-t border-slate-100 text-xs text-slate-600 space-y-1.5">
          <div className="font-semibold text-slate-800">Öğretmen İpucu</div>
          <p>
            Öğrenciden kelimeyi sesli okumadan, yalnızca göz taramasıyla
            eşleşen kartlara dokunmasını isteyin.
          </p>
        </div>
      </aside>
    </div>
  );
}
