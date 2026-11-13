'use client';

import React from 'react';
import { splitTurkishSyllables } from '@/lib/phonics';

interface SyllableWordProps {
  word: string;
  highlightSyllables: boolean;
  className?: string;
}

/**
 * Renders a Turkish word with optional alternating blue/crimson syllable coloring,
 * matching standard Turkish 1st-grade phonics pedagogy.
 */
export function SyllableWord({
  word,
  highlightSyllables,
  className = '',
}: SyllableWordProps) {
  if (!highlightSyllables) {
    return <span className={className}>{word}</span>;
  }

  const syllables = splitTurkishSyllables(word);

  return (
    <span className={className}>
      {syllables.map((syllable, idx) => (
        <span
          key={`${syllable}-${idx}`}
          className={idx % 2 === 0 ? 'text-[#1D4ED8]' : 'text-[#DC2626]'}
        >
          {syllable}
        </span>
      ))}
    </span>
  );
}

/**
 * Speaks a Turkish word or sentence aloud using the browser's Web Speech API (tr-TR).
 */
export function speakTurkish(text: string, rate = 0.88): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return;
  }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'tr-TR';
  utterance.rate = rate;
  utterance.pitch = 1.05;
  window.speechSynthesis.speak(utterance);
}
