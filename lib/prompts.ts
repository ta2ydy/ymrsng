import { getPhonicsGroup, toTurkishUpper } from './phonics';

export const STORY_THEMES = [
  { id: 'nature', labelTr: 'Doğa ve Hayvanlar', promptEn: 'nature, animals, and outdoor play' },
  { id: 'school', labelTr: 'Okul ve Arkadaşlar', promptEn: 'school, learning, and friendly classmates' },
  { id: 'home', labelTr: 'Aile ve Ev', promptEn: 'family, home, and warm daily routines' },
  { id: 'adventure', labelTr: 'Oyun ve Macera', promptEn: 'playful adventures, toys, and curiosity' },
] as const;

export type StoryThemeId = (typeof STORY_THEMES)[number]['id'];

/**
 * Builds the strict English System Instruction for Gemini API.
 * Enforces cumulative Turkish phonics constraints so that every single word
 * uses only letters unlocked up to the selected phonics group (1 to 5).
 */
export function buildEnglishSystemInstruction(groupId: number): string {
  const group = getPhonicsGroup(groupId);
  const allowedLower = group.cumulativeLetters.join(', ');
  const allowedUpper = group.cumulativeLetters.map((l) => toTurkishUpper(l)).join(', ');
  const forbiddenLower =
    group.forbiddenLetters.length > 0
      ? group.forbiddenLetters.join(', ')
      : 'None (all 29 Turkish letters are unlocked)';

  return [
    `You are an expert Turkish 1st-grade (1. Sınıf) elementary reading specialist and decodable story author.`,
    `Your task is to write a joyful, rhythmic, age-appropriate Turkish decodable short story for 6-7 year old early readers.`,
    ``,
    `ACTIVE PHONICS LEVEL: Group ${group.id} (${group.code})`,
    `UNLOCKED LOWERCASE LETTERS: [${allowedLower}]`,
    `UNLOCKED UPPERCASE LETTERS: [${allowedUpper}]`,
    `STRICTLY FORBIDDEN LETTERS: [${forbiddenLower}]`,
    ``,
    `CRITICAL DECODABILITY RULES (ZERO EXCEPTIONS):`,
    `1. Every single word in the title, story sentences, focusWords, comprehension question, and answer options MUST be composed EXCLUSIVELY of the unlocked letters listed above.`,
    `2. NEVER use any forbidden letter in ANY word, including character names, suffixes, conjunctions, or punctuation-adjacent words.`,
    `3. Pay extreme attention to Turkish character distinctions: dotted 'İ/i' vs dotless 'I/ı', 'Ö/ö' vs 'O/o', 'Ü/ü' vs 'U/u', 'Ç/ç' vs 'C/c', 'Ş/ş' vs 'S/s', and 'Ğ/ğ' vs 'G/g'. Treat each as a distinct letter.`,
    `4. Before finalizing every word, mentally check each character one by one against the unlocked list. If a word contains even one forbidden letter, replace it immediately with a valid decodable Turkish synonym or rephrase the sentence.`,
    `5. Use natural, grammatically sound, child-friendly Turkish. Write 5 short sentences (4 to 7 words per sentence) that encourage reading fluency and rhythmic phrasing.`,
    `6. Return ONLY valid JSON matching the requested schema.`,
  ].join('\n');
}

/**
 * Builds the English User Prompt sent to Gemini alongside the System Instruction.
 */
export function buildEnglishUserPrompt(
  groupId: number,
  themeId?: string,
  customTopic?: string
): string {
  const group = getPhonicsGroup(groupId);
  const matchedTheme = STORY_THEMES.find((t) => t.id === themeId);
  const topicText = customTopic?.trim()
    ? `requested topic: "${customTopic.trim()}"`
    : matchedTheme
    ? `theme: ${matchedTheme.promptEn}`
    : 'a cheerful everyday childhood theme';

  const allowedUpper = group.cumulativeLetters.map((l) => toTurkishUpper(l)).join('');

  return [
    `Generate a brand-new Turkish 1st-grade decodable reading story for Phonics Group ${group.id} (${group.code}).`,
    `Cumulative allowed alphabet: ${allowedUpper}.`,
    `Story ${topicText} (adapt naturally using ONLY unlocked letters).`,
    `Provide:`,
    `- title: short decodable Turkish title (2-4 words)`,
    `- sentences: array of 5 short decodable Turkish sentences`,
    `- focusWords: array of 5 key decodable words from the story for pre-reading practice`,
    `- comprehension: an object with a simple decodable Turkish question, 3 short decodable options, and correctIndex (0, 1, or 2).`,
  ].join('\n');
}
