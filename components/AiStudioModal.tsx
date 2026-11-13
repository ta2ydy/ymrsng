'use client';

import React, { useEffect, useState } from 'react';
import { X, Copy, Check, Sparkles } from 'lucide-react';
import { PHONICS_GROUPS, getPhonicsGroup, toTurkishUpper } from '@/lib/phonics';
import {
  buildEnglishSystemInstruction,
  buildEnglishUserPrompt,
} from '@/lib/prompts';

interface AiStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedGroupId: 1 | 2 | 3 | 4 | 5;
  onSelectGroup: (groupId: 1 | 2 | 3 | 4 | 5) => void;
}

/**
 * Teacher AI Studio Prompt Inspector Modal.
 * Allows teachers to inspect and copy the active English System Instruction
 * and English User Prompt tailored to the selected cumulative phonics group.
 */
export function AiStudioModal({
  isOpen,
  onClose,
  selectedGroupId,
  onSelectGroup,
}: AiStudioModalProps) {
  const [copiedType, setCopiedType] = useState<'system' | 'user' | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const activeGroup = getPhonicsGroup(selectedGroupId);
  const systemPrompt = buildEnglishSystemInstruction(selectedGroupId);
  const userPrompt = buildEnglishUserPrompt(selectedGroupId, 'nature');

  const handleCopy = async (text: string, type: 'system' | 'user') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedType(type);
      window.setTimeout(() => setCopiedType(null), 2000);
    } catch {
      // Fallback copy method if clipboard API is restricted
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopiedType(type);
      window.setTimeout(() => setCopiedType(null), 2000);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="ai-studio-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl max-h-[90vh] bg-white border border-slate-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-blue-600" aria-hidden="true" />
            <div>
              <h2
                id="ai-studio-modal-title"
                className="font-display text-lg font-bold text-slate-900"
              >
                Google AI Studio Öğretmen İstemi Paneli
              </h2>
              <p className="text-xs text-slate-600">
                Seçili ses grubu için aktif İngilizce sistem talimatını inceleyin
                ve kopyalayın.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Paneli kapat"
            className="w-9 h-9 inline-flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Group Switcher inside Inspector */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-semibold text-slate-700">
                Aktif Ses Grubu ({activeGroup.titleTr} · {activeGroup.code})
              </span>
              <span className="font-mono text-slate-500">
                Açık Harfler:{' '}
                {activeGroup.cumulativeLetters
                  .map((l) => toTurkishUpper(l))
                  .join(' ')}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 p-1 bg-slate-100 rounded-lg">
              {PHONICS_GROUPS.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => onSelectGroup(g.id)}
                  className={`py-1.5 px-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                    g.id === selectedGroupId
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-700 hover:bg-white'
                  }`}
                >
                  {g.id}. {g.code}
                </button>
              ))}
            </div>
          </div>

          {/* English System Instruction Block */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-bold text-slate-900">
                System Instruction (English · Google AI Studio)
              </span>
              <button
                type="button"
                onClick={() => handleCopy(systemPrompt, 'system')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors whitespace-nowrap"
              >
                {copiedType === 'system' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
                    <span>Kopyalandı!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Sistem İstemini Kopyala</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-4 rounded-xl bg-slate-950 text-slate-100 font-mono text-xs leading-relaxed overflow-x-auto whitespace-pre-wrap border border-slate-800">
              {systemPrompt}
            </pre>
          </div>

          {/* English Sample User Prompt Block */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-bold text-slate-900">
                Sample User Prompt (English)
              </span>
              <button
                type="button"
                onClick={() => handleCopy(userPrompt, 'user')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold transition-colors whitespace-nowrap"
              >
                {copiedType === 'user' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
                    <span>Kopyalandı!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Örnek İstemi Kopyala</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-4 rounded-xl bg-slate-50 text-slate-800 font-mono text-xs leading-relaxed overflow-x-auto whitespace-pre-wrap border border-slate-200">
              {userPrompt}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
