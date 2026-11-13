'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, Sparkles } from 'lucide-react';
import { DecodableStory } from '@/lib/phonics';
import { HeaderBar, ModuleId } from './HeaderBar';
import { PhonicsGroupSelector } from './PhonicsGroupSelector';
import { SyllableFlashcardsModule } from './SyllableFlashcardsModule';
import { ScrollingTextModule } from './ScrollingTextModule';
import { EyeExerciseModule } from './EyeExerciseModule';
import { WordHuntModule } from './WordHuntModule';
import { AiStudioModal } from './AiStudioModal';

/**
 * Root interactive client orchestrator for 1. Sınıf Hızlı Okuma Atölyesi.
 * Coordinates the active reading module, cumulative phonics group (1-5),
 * AI-generated story history, and the teacher AI Studio prompt modal.
 */
export function ReadingWorkshopApp() {
  const [activeModule, setActiveModule] = useState<ModuleId>('cards');
  const [selectedGroupId, setSelectedGroupId] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [isAiStudioOpen, setIsAiStudioOpen] = useState(false);
  const [aiStoriesByGroup, setAiStoriesByGroup] = useState<
    Record<number, DecodableStory[]>
  >({});

  const handleAddAiStory = (story: DecodableStory) => {
    setAiStoriesByGroup((prev) => {
      const existing = prev[story.groupId] ?? [];
      return {
        ...prev,
        [story.groupId]: [story, ...existing],
      };
    });
  };

  const moduleMeta: Record<ModuleId, { title: string; desc: string }> = {
    cards: {
      title: 'Hece ve Kelime Kartları',
      desc: 'Flaş okuma yöntemiyle açık harflerdeki hece ve kelimeleri anında tanıyın.',
    },
    scrolling: {
      title: 'Kayan Metin ve Hikaye Atölyesi',
      desc: 'Ayarlanabilir hızda kelime takibi yapın veya yapay zekaya yeni hikaye yazdırın.',
    },
    eye: {
      title: 'Göz Egzersizi Parkuru',
      desc: 'Zıplayan kelimeler ve genişleyen kelime piramidiyle göz kaslarını hızlandırın.',
    },
    hunt: {
      title: 'Hızlı Kelime Avı',
      desc: 'Hedef kelimeyi benzer kelimeler arasından hızla bularak görsel tarama becerinizi geliştirin.',
    },
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <HeaderBar
        activeModule={activeModule}
        onSelectModule={setActiveModule}
        onOpenAiStudio={() => setIsAiStudioOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Compact Hero Header + Primary Workshop CTA */}
        <section className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 text-balance">
              {moduleMeta[activeModule].title}
            </h1>
            <p className="text-sm sm:text-base text-slate-600">
              {moduleMeta[activeModule].desc}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {activeModule !== 'scrolling' ? (
              <button
                type="button"
                onClick={() => setActiveModule('scrolling')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
              >
                <Sparkles className="w-4 h-4 text-amber-200" aria-hidden="true" />
                <span>Kayan Metin & Hikaye Üret</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setActiveModule('cards')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-sm font-semibold transition-colors whitespace-nowrap shrink-0"
              >
                <BookOpen className="w-4 h-4 text-blue-600" aria-hidden="true" />
                <span>Hece Kartlarına Dön</span>
              </button>
            )}
          </div>
        </section>

        {/* Cumulative 5-Group Phonics Selector */}
        <PhonicsGroupSelector
          selectedGroupId={selectedGroupId}
          onSelectGroup={setSelectedGroupId}
        />

        {/* Active Module Workspace */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeModule}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
          >
            {activeModule === 'cards' && (
              <SyllableFlashcardsModule
                key={`cards-${selectedGroupId}`}
                groupId={selectedGroupId}
              />
            )}
            {activeModule === 'scrolling' && (
              <ScrollingTextModule
                key={`scrolling-${selectedGroupId}`}
                groupId={selectedGroupId}
                aiStoriesByGroup={aiStoriesByGroup}
                onAddAiStory={handleAddAiStory}
              />
            )}
            {activeModule === 'eye' && (
              <EyeExerciseModule
                key={`eye-${selectedGroupId}`}
                groupId={selectedGroupId}
              />
            )}
            {activeModule === 'hunt' && (
              <WordHuntModule
                key={`hunt-${selectedGroupId}`}
                groupId={selectedGroupId}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Quiet Editorial Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <span>1. Sınıf Hızlı Okuma Atölyesi</span>
          <span>
            1. ANETİL · 2. OKURIM · 3. ÜSÖYDZ · 4. ÇBGCŞ · 5. PHVĞFJ
          </span>
        </div>
      </footer>

      {/* Teacher Google AI Studio Prompt Inspector Modal */}
      <AiStudioModal
        isOpen={isAiStudioOpen}
        onClose={() => setIsAiStudioOpen(false)}
        selectedGroupId={selectedGroupId}
        onSelectGroup={setSelectedGroupId}
      />
    </div>
  );
}
