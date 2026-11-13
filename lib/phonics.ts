/**
 * Turkish 1st Grade Cumulative Phonics Curriculum & Decodability Engine
 * Based on the 5-group Turkish phonics progression:
 *   Group 1: ANETİL
 *   Group 2: OKURIM
 *   Group 3: ÜSÖYDZ
 *   Group 4: ÇBGCŞ
 *   Group 5: PHVĞFJ
 */

export interface PhonicsGroup {
  id: 1 | 2 | 3 | 4 | 5;
  code: string;
  titleTr: string;
  subtitleTr: string;
  newLetters: string[];
  cumulativeLetters: string[];
  forbiddenLetters: string[];
}

export interface DecodableStory {
  id: string;
  groupId: 1 | 2 | 3 | 4 | 5;
  title: string;
  sentences: string[];
  focusWords: string[];
  comprehension: {
    question: string;
    options: string[];
    correctIndex: number;
  };
  isAiGenerated?: boolean;
}

export interface DecodabilityReport {
  totalWords: number;
  decodableWords: number;
  accuracyPercent: number;
  invalidWords: Array<{ word: string; invalidChars: string[] }>;
}

/** Complete 29-letter Turkish alphabet in lowercase */
export const TURKISH_ALPHABET_LOWER = [
  'a', 'b', 'c', 'ç', 'd', 'e', 'f', 'g', 'ğ', 'h',
  'ı', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'ö', 'p',
  'r', 's', 'ş', 't', 'u', 'ü', 'v', 'y', 'z',
] as const;

const TURKISH_VOWELS = new Set(['a', 'e', 'ı', 'i', 'o', 'ö', 'u', 'ü']);

/**
 * Converts a Turkish string to lowercase accurately using tr-TR rules
 * (ensuring 'İ' -> 'i' and 'I' -> 'ı').
 */
export function toTurkishLower(input: string): string {
  return input.toLocaleLowerCase('tr-TR');
}

/**
 * Converts a Turkish string to uppercase accurately using tr-TR rules
 * (ensuring 'i' -> 'İ' and 'ı' -> 'I').
 */
export function toTurkishUpper(input: string): string {
  return input.toLocaleUpperCase('tr-TR');
}

const RAW_GROUPS: Array<{
  id: 1 | 2 | 3 | 4 | 5;
  code: string;
  titleTr: string;
  subtitleTr: string;
  newLetters: string[];
}> = [
  {
    id: 1,
    code: 'ANETİL',
    titleTr: '1. Grup',
    subtitleTr: 'İlk Sesler (ANETİL)',
    newLetters: ['a', 'n', 'e', 't', 'i', 'l'],
  },
  {
    id: 2,
    code: 'OKURIM',
    titleTr: '2. Grup',
    subtitleTr: 'Akıcı Sesler (OKURIM)',
    newLetters: ['o', 'k', 'u', 'r', 'ı', 'm'],
  },
  {
    id: 3,
    code: 'ÜSÖYDZ',
    titleTr: '3. Grup',
    subtitleTr: 'Yeni Sesler (ÜSÖYDZ)',
    newLetters: ['ü', 's', 'ö', 'y', 'd', 'z'],
  },
  {
    id: 4,
    code: 'ÇBGCŞ',
    titleTr: '4. Grup',
    subtitleTr: 'Zengin Sesler (ÇBGCŞ)',
    newLetters: ['ç', 'b', 'g', 'c', 'ş'],
  },
  {
    id: 5,
    code: 'PHVĞFJ',
    titleTr: '5. Grup',
    subtitleTr: 'Tam Alfabe (PHVĞFJ)',
    newLetters: ['p', 'h', 'v', 'ğ', 'f', 'j'],
  },
];

export const PHONICS_GROUPS: PhonicsGroup[] = RAW_GROUPS.map((group, idx) => {
  const cumulative = RAW_GROUPS.slice(0, idx + 1).flatMap((g) => g.newLetters);
  const cumulativeSet = new Set(cumulative);
  const forbidden = TURKISH_ALPHABET_LOWER.filter((l) => !cumulativeSet.has(l));
  return {
    ...group,
    cumulativeLetters: cumulative,
    forbiddenLetters: forbidden,
  };
});

export function getPhonicsGroup(groupId: number): PhonicsGroup {
  return PHONICS_GROUPS.find((g) => g.id === groupId) ?? PHONICS_GROUPS[0];
}

/**
 * Checks whether every alphabetic character in a Turkish word belongs to
 * the cumulative allowed letters for the given phonics group.
 */
export function getInvalidCharsForWord(word: string, groupId: number): string[] {
  const group = getPhonicsGroup(groupId);
  const allowedSet = new Set(group.cumulativeLetters);
  const lower = toTurkishLower(word);
  const invalid: string[] = [];

  for (const ch of lower) {
    // Only validate alphabetic characters (Turkish + basic Latin letters)
    if (/[\p{L}]/u.test(ch) && !allowedSet.has(ch)) {
      if (!invalid.includes(ch)) {
        invalid.push(ch);
      }
    }
  }
  return invalid;
}

/**
 * Evaluates full text decodability against the selected phonics group.
 */
export function evaluateDecodability(text: string, groupId: number): DecodabilityReport {
  const rawTokens = text
    .split(/[\s.,!?;:"'()\-–—]+/)
    .map((t) => t.trim())
    .filter((t) => /[\p{L}]/u.test(t));

  const invalidWords: Array<{ word: string; invalidChars: string[] }> = [];
  let decodableWords = 0;

  for (const token of rawTokens) {
    const invalidChars = getInvalidCharsForWord(token, groupId);
    if (invalidChars.length === 0) {
      decodableWords += 1;
    } else {
      invalidWords.push({ word: token, invalidChars });
    }
  }

  const totalWords = rawTokens.length;
  const accuracyPercent =
    totalWords === 0 ? 100 : Math.round((decodableWords / totalWords) * 100);

  return {
    totalWords,
    decodableWords,
    accuracyPercent,
    invalidWords,
  };
}

/**
 * Splits a Turkish word into phonetic syllables following Turkish syllabification rules.
 * Preserves original casing and trailing punctuation.
 */
export function splitTurkishSyllables(token: string): string[] {
  const match = token.match(/^([^\p{L}]*)([\p{L}]+)([^\p{L}]*)$/u);
  if (!match) return [token];

  const [, leading, word, trailing] = match;
  const chars = Array.from(word);
  const lowerChars = Array.from(toTurkishLower(word));

  const vowelIndices: number[] = [];
  lowerChars.forEach((ch, idx) => {
    if (TURKISH_VOWELS.has(ch)) {
      vowelIndices.push(idx);
    }
  });

  if (vowelIndices.length <= 1) {
    return [token];
  }

  // Determine syllable split positions using Turkish rule:
  // Each syllable contains one vowel; a single consonant between vowels starts the next syllable;
  // for 2+ consonants between vowels, the last consonant before the next vowel starts the next syllable.
  const splitPoints: number[] = [0];
  for (let i = 0; i < vowelIndices.length - 1; i++) {
    const currentVowel = vowelIndices[i];
    const nextVowel = vowelIndices[i + 1];
    const consonantsBetween = nextVowel - currentVowel - 1;

    if (consonantsBetween === 0) {
      splitPoints.push(nextVowel);
    } else {
      splitPoints.push(nextVowel - 1);
    }
  }
  splitPoints.push(chars.length);

  const syllables: string[] = [];
  for (let i = 0; i < splitPoints.length - 1; i++) {
    syllables.push(chars.slice(splitPoints[i], splitPoints[i + 1]).join(''));
  }

  if (syllables.length > 0) {
    syllables[0] = leading + syllables[0];
    syllables[syllables.length - 1] = syllables[syllables.length - 1] + trailing;
  }

  return syllables;
}

/**
 * Curated decodable syllables per phonics group (cumulative).
 */
export const GROUP_SYLLABLES: Record<1 | 2 | 3 | 4 | 5, string[]> = {
  1: [
    'el', 'al', 'at', 'et', 'in', 'il', 'an', 'en',
    'la', 'le', 'na', 'ne', 'ta', 'te', 'ti', 'li',
    'ni', 'tal', 'ten', 'tat', 'nal', 'net', 'lan', 'tan',
  ],
  2: [
    'ok', 'ko', 'ku', 'uk', 'ur', 'ru', 'ma', 'me',
    'ka', 'ke', 'kı', 'ki', 'ra', 're', 'mo', 'mu',
    'kol', 'kul', 'kal', 'kar', 'kor', 'mar', 'mor', 'tar',
  ],
  3: [
    'su', 'sü', 'öz', 'yü', 'de', 'da', 'ze', 'zü',
    'sa', 'se', 'sö', 'süt', 'yüz', 'söz', 'düz', 'yaz',
    'kız', 'yıl', 'dör', 'der', 'mas', 'zey', 'düd', 'öyk',
  ],
  4: [
    'ba', 'be', 'bi', 'bo', 'ça', 'çe', 'çi', 'ço',
    'ga', 'ge', 'gö', 'gü', 'ca', 'ce', 'şa', 'şe',
    'bal', 'göl', 'kuş', 'çil', 'gül', 'baş', 'cam', 'şar',
  ],
  5: [
    'pa', 'pe', 'pi', 'po', 'ha', 'he', 'va', 've',
    'fa', 'fe', 'fi', 'ja', 'je', 'dağ', 'bağ', 'yağ',
    'fil', 'fın', 'hav', 'pap', 'tav', 'viş', 'kar', 'gök',
  ],
};

/**
 * Curated decodable words strictly verified against each group's cumulative letters.
 */
export const GROUP_WORDS: Record<1 | 2 | 3 | 4 | 5, string[]> = {
  1: [
    'Ela', 'Ali', 'Lale', 'Nail', 'Talat', 'Nil',
    'anne', 'nane', 'lale', 'alet', 'atlet', 'anten',
    'tatil', 'tane', 'nine', 'nene', 'lila', 'inat',
    'ilan', 'itina', 'anlat', 'atla', 'anla', 'elini',
  ],
  2: [
    'okul', 'okur', 'kalem', 'elma', 'armut', 'limon',
    'marul', 'orman', 'martı', 'kartal', 'makarna', 'lokum',
    'roket', 'kule', 'kale', 'koltuk', 'motor', 'raket',
    'tarak', 'olta', 'nota', 'karton', 'ekmek', 'keman',
  ],
  3: [
    'masa', 'üzüm', 'yıldız', 'deniz', 'zeytin', 'dokuz',
    'sekiz', 'yirmi', 'otuz', 'yüzük', 'düdük', 'sözlük',
    'masal', 'dondurma', 'salata', 'domates', 'ördek', 'kedi',
    'koyun', 'maymun', 'leylek', 'aslan', 'tilki', 'sandal',
  ],
  4: [
    'balon', 'balık', 'çiçek', 'çilek', 'çocuk', 'çanta',
    'çorba', 'güneş', 'gökyüzü', 'gemi', 'şişe', 'ceylan',
    'şeker', 'şemsiye', 'şarkı', 'kardeş', 'böcek', 'kelebek',
    'araba', 'bisiklet', 'otobüs', 'uçak', 'uçurtma', 'bebek',
  ],
  5: [
    'papatya', 'pencere', 'kitap', 'köpek', 'harika', 'hayal',
    'havuç', 'bahçe', 'yağmur', 'ağaç', 'kurbağa', 'fındık',
    'fener', 'valiz', 'vişne', 'tavşan', 'karpuz', 'gökkuşağı',
    'palyaço', 'garaj', 'pijama', 'fare', 'fil', 'dağ',
  ],
};

/**
 * Curated decodable stories per phonics group (100% letter-constrained).
 */
export const CURATED_STORIES: Record<1 | 2 | 3 | 4 | 5, DecodableStory[]> = {
  1: [
    {
      id: 'g1-s1',
      groupId: 1,
      title: 'Lale ile Ali',
      sentences: [
        'Ali, Lale ile elele.',
        'Anne, lale al.',
        'Lale lila lale.',
        'Ela, nane al.',
        'Ali, tatile atla!',
      ],
      focusWords: ['Lale', 'Ali', 'anne', 'nane', 'tatil'],
      comprehension: {
        question: 'Ela ne al?',
        options: ['Nane', 'Atlet', 'Anten'],
        correctIndex: 0,
      },
    },
    {
      id: 'g1-s2',
      groupId: 1,
      title: 'Nine ile Tatil',
      sentences: [
        'Nine, Ali ile tatil anlat.',
        'Nail, at ile atla.',
        'Talat, tel ile anten et.',
        'Ela, itina ile elini at.',
        'Ne net tatil!',
      ],
      focusWords: ['Nine', 'Nail', 'Talat', 'anten', 'itina'],
      comprehension: {
        question: 'Nail ne ile atla?',
        options: ['At', 'Tel', 'Lale'],
        correctIndex: 0,
      },
    },
  ],
  2: [
    {
      id: 'g2-s1',
      groupId: 2,
      title: 'Orman Okulu',
      sentences: [
        'Kemal ile Emel okula erken kalktı.',
        'Emel mor kalem tuttu.',
        'Kemal iri elma ile armut tarttı.',
        'Orman okulu ne renkli!',
        'Martı ile kartal okur mu?',
      ],
      focusWords: ['okul', 'kalem', 'armut', 'orman', 'kartal'],
      comprehension: {
        question: 'Emel ne tuttu?',
        options: ['Mor kalem', 'Raket', 'Olta'],
        correctIndex: 0,
      },
    },
    {
      id: 'g2-s2',
      groupId: 2,
      title: 'Murat ile Roket',
      sentences: [
        'Murat karton ile roket kurar.',
        'Okan motora tek tek takar.',
        'Roket kuru kumla kalkar.',
        'Metin keman ile nota okur.',
        'Lokum ile limon ikram olur.',
      ],
      focusWords: ['Murat', 'karton', 'roket', 'keman', 'lokum'],
      comprehension: {
        question: 'Murat karton ile ne kurar?',
        options: ['Roket', 'Keman', 'Olta'],
        correctIndex: 0,
      },
    },
  ],
  3: [
    {
      id: 'g3-s1',
      groupId: 3,
      title: 'Yıldızlı Deniz',
      sentences: [
        'Deniz ile Yelda sarı sandal istedi.',
        'Sarı sandal düz denizde süzüldü.',
        'Yelda üzüm ile zeytin yedi.',
        'Ördek suya daldı, ses saldı.',
        'Yıldızlar üstümüzde süzüldü.',
      ],
      focusWords: ['sandal', 'deniz', 'üzüm', 'zeytin', 'yıldızlar'],
      comprehension: {
        question: 'Yelda ne yedi?',
        options: ['Üzüm ile zeytin', 'Domates', 'Dondurma'],
        correctIndex: 0,
      },
    },
    {
      id: 'g3-s2',
      groupId: 3,
      title: 'Kedi ile Ördek',
      sentences: [
        'Minik kedi süt yaladı.',
        'Ördek derede yüzdü.',
        'Aslan ile tilki masal dinledi.',
        'Dokuz yıldız söndü, uyku zamanı.',
        'Sözlük ile ders ne tatlı!',
      ],
      focusWords: ['kedi', 'ördek', 'masal', 'dokuz', 'sözlük'],
      comprehension: {
        question: 'Derede kim yüzdü?',
        options: ['Ördek', 'Tilki', 'Aslan'],
        correctIndex: 0,
      },
    },
  ],
  4: [
    {
      id: 'g4-s1',
      groupId: 4,
      title: 'Güneşli Göl',
      sentences: [
        'Bora ile Başak göle bisiklet sürdü.',
        'Sarı balon gökyüzüne uçtu.',
        'Küçük balık suda neşeli yüzüyor.',
        'Kuşlar çiçekli dalda şarkı söyledi.',
        'Çocuklar çilek ile şeker yedi.',
      ],
      focusWords: ['bisiklet', 'balon', 'balık', 'çiçekli', 'çilek'],
      comprehension: {
        question: 'Gökyüzüne ne uçtu?',
        options: ['Sarı balon', 'Gemi', 'Uçurtma'],
        correctIndex: 0,
      },
    },
    {
      id: 'g4-s2',
      groupId: 4,
      title: 'Uçurtma Şenlik Günü',
      sentences: [
        'Çocuklar güneşli günde bir araya geldi.',
        'Kardeşim Can güzel uçurtma uçurdu.',
        'Şarkılar ile balonlar sallandı.',
        'Kelebekler mor çiçeklere kondu.',
        'Ne güzel bir şenlik oldu!',
      ],
      focusWords: ['uçurtma', 'güneşli', 'kelebekler', 'şarkılar', 'şenlik'],
      comprehension: {
        question: 'Kelebekler nereye kondu?',
        options: ['Mor çiçeklere', 'Gemiye', 'Bisiklete'],
        correctIndex: 0,
      },
    },
  ],
  5: [
    {
      id: 'g5-s1',
      groupId: 5,
      title: 'Bahçedeki Gökkuşağı',
      sentences: [
        'Yağmur sonrası bahçede harika bir gökkuşağı belirdi.',
        'Tavşan havuç yedi, kurbağa yaprağın üstüne zıpladı.',
        'Fil ile fare fındık paylaşarak neşeyle oynadı.',
        'Pencereden bakan Zeynep papatya kokusunu içine çekti.',
        'Kitap okumak her gün yeni bir hayal penceresi açar.',
      ],
      focusWords: ['gökkuşağı', 'tavşan', 'kurbağa', 'papatya', 'kitap'],
      comprehension: {
        question: 'Yağmur sonrası bahçede ne belirdi?',
        options: ['Gökkuşağı', 'Fener', 'Valiz'],
        correctIndex: 0,
      },
    },
    {
      id: 'g5-s2',
      groupId: 5,
      title: 'Orman Feneri',
      sentences: [
        'Hakan akşam bahçeye fener ile çıktı.',
        'Ağaç altında minik kirpi ile karşılaştı.',
        'Sepetteki vişne ve karpuz dilimlerini paylaştılar.',
        'Köpek Pofuduk neşeyle bahçede koştu.',
        'Her harf bir araya gelince harika öyküler doğar.',
      ],
      focusWords: ['fener', 'ağaç', 'vişne', 'karpuz', 'köpek'],
      comprehension: {
        question: 'Hakan bahçeye ne ile çıktı?',
        options: ['Fener ile', 'Valiz ile', 'Bisiklet ile'],
        correctIndex: 0,
      },
    },
  ],
};

/**
 * Builds progressive word pyramids for eye-span widening exercises,
 * strictly using words from the selected phonics group.
 */
export function getWordPyramid(groupId: 1 | 2 | 3 | 4 | 5): string[] {
  const words = GROUP_WORDS[groupId];
  // Sort by character length so the pyramid expands smoothly from short to long words
  const sorted = [...words].sort((a, b) => a.length - b.length);
  const picks = [
    sorted[0] ?? 'el',
    `${sorted[1] ?? 'al'} ${sorted[2] ?? 'at'}`,
    `${sorted[3] ?? 'ela'} ${sorted[4] ?? 'ali'}`,
    `${sorted[5] ?? 'lale'} ${sorted[6] ?? 'nane'} ${sorted[7] ?? 'anne'}`,
    `${sorted[8] ?? 'tatil'} ${sorted[9] ?? 'atlet'} ${sorted[10] ?? 'anten'}`,
  ];
  return picks;
}
