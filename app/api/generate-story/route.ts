import { NextRequest, NextResponse } from 'next/server';
import { Type, ThinkingLevel } from '@google/genai';
import { getGeminiClient } from '@/lib/gemini';
import {
  DecodableStory,
  evaluateDecodability,
  getPhonicsGroup,
} from '@/lib/phonics';
import {
  buildEnglishSystemInstruction,
  buildEnglishUserPrompt,
} from '@/lib/prompts';

interface GeneratedStoryPayload {
  title: string;
  sentences: string[];
  focusWords: string[];
  comprehension: {
    question: string;
    options: string[];
    correctIndex: number;
  };
}

const STORY_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    title: {
      type: Type.STRING,
      description: 'Short decodable Turkish story title (2-4 words).',
    },
    sentences: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Exactly 5 short decodable Turkish sentences.',
    },
    focusWords: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: '5 key decodable Turkish words from the story.',
    },
    comprehension: {
      type: Type.OBJECT,
      properties: {
        question: {
          type: Type.STRING,
          description: 'Simple decodable Turkish comprehension question.',
        },
        options: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: '3 short decodable Turkish answer options.',
        },
        correctIndex: {
          type: Type.INTEGER,
          description: 'Zero-based index (0, 1, or 2) of the correct option.',
        },
      },
      required: ['question', 'options', 'correctIndex'],
    },
  },
  required: ['title', 'sentences', 'focusWords', 'comprehension'],
};

function collectAllStoryText(payload: GeneratedStoryPayload): string {
  return [
    payload.title,
    ...payload.sentences,
    ...payload.focusWords,
    payload.comprehension.question,
    ...payload.comprehension.options,
  ].join(' ');
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawGroupId = Number(body?.groupId ?? 1);
    const groupId = ([1, 2, 3, 4, 5].includes(rawGroupId) ? rawGroupId : 1) as
      | 1
      | 2
      | 3
      | 4
      | 5;
    const themeId = typeof body?.themeId === 'string' ? body.themeId : undefined;
    const customTopic =
      typeof body?.customTopic === 'string' ? body.customTopic : undefined;

    const ai = getGeminiClient();
    const group = getPhonicsGroup(groupId);
    const systemInstruction = buildEnglishSystemInstruction(groupId);
    const userPrompt = buildEnglishUserPrompt(groupId, themeId, customTopic);

    const modelName = 'gemini-4-hydrogen';

    // Initial generation attempt
    let response = await ai.models.generateContent({
      model: modelName,
      contents: userPrompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: STORY_RESPONSE_SCHEMA,
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.MEDIUM,
        },
      },
    });

    let parsed: GeneratedStoryPayload = JSON.parse((response.text ?? '{}').trim());
    let report = evaluateDecodability(collectAllStoryText(parsed), groupId);

    // Up to 2 automatic English repair passes if any forbidden letters slipped through
    let attempts = 0;
    while (report.invalidWords.length > 0 && attempts < 2) {
      attempts += 1;
      const violationList = report.invalidWords
        .slice(0, 12)
        .map((v) => `"${v.word}" (forbidden: ${v.invalidChars.join(', ')})`)
        .join('; ');

      const repairPrompt = [
        `The previous draft violated the Group ${group.id} (${group.code}) letter whitelist.`,
        `Offending words: ${violationList}.`,
        `Rewrite the story JSON so that 100% of every word in title, sentences, focusWords, and comprehension ONLY uses: [${group.cumulativeLetters.join(', ')}].`,
        `Replace or rephrase every offending word completely while keeping natural Turkish.`,
        `Previous JSON to fix:`,
        JSON.stringify(parsed),
      ].join('\n');

      response = await ai.models.generateContent({
        model: modelName,
        contents: repairPrompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: STORY_RESPONSE_SCHEMA,
          thinkingConfig: {
            thinkingLevel: ThinkingLevel.MEDIUM,
          },
        },
      });

      parsed = JSON.parse((response.text ?? '{}').trim());
      report = evaluateDecodability(collectAllStoryText(parsed), groupId);
    }

    const safeCorrectIndex =
      typeof parsed.comprehension?.correctIndex === 'number' &&
      parsed.comprehension.correctIndex >= 0 &&
      parsed.comprehension.correctIndex < (parsed.comprehension?.options?.length ?? 3)
        ? parsed.comprehension.correctIndex
        : 0;

    const story: DecodableStory = {
      id: `ai-${groupId}-${Date.now()}`,
      groupId,
      title: parsed.title || `${group.code} Hikayesi`,
      sentences: Array.isArray(parsed.sentences) ? parsed.sentences.slice(0, 6) : [],
      focusWords: Array.isArray(parsed.focusWords) ? parsed.focusWords.slice(0, 6) : [],
      comprehension: {
        question: parsed.comprehension?.question || '',
        options: Array.isArray(parsed.comprehension?.options)
          ? parsed.comprehension.options.slice(0, 3)
          : [],
        correctIndex: safeCorrectIndex,
      },
      isAiGenerated: true,
    };

    return NextResponse.json({
      story,
      decodabilityReport: report,
      model: modelName,
    });
  } catch (error) {
    console.error('Error generating decodable story:', error);
    const message =
      error instanceof Error ? error.message : 'Story generation failed.';
    return NextResponse.json(
      {
        error: message,
      },
      { status: 500 }
    );
  }
}
