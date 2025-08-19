/**
 * Multi-language word counting utility
 * Supports English, Japanese, Chinese, Korean, and other languages
 */

export interface WordCountOptions {
  /**
   * Include Markdown formatting in the count
   * @default false
   */
  includeMarkdown?: boolean;

  /**
   * Custom word separators (defaults to standard separators)
   */
  customSeparators?: string[];
}

export interface WordCountResult {
  words: number;
  characters: number;
  charactersNoSpaces: number;
  sentences: number;
  paragraphs: number;
  estimatedReadingTimeMinutes: number;
}

/**
 * Count words in text supporting multiple languages
 *
 * @param text - The text to count words in
 * @param options - Counting options
 * @returns Word count results
 */
export function countWords(text: string, options: WordCountOptions = {}): WordCountResult {
  const { includeMarkdown = false, customSeparators = [] } = options;

  if (!text || text.trim().length === 0) {
    return {
      words: 0,
      characters: 0,
      charactersNoSpaces: 0,
      sentences: 0,
      paragraphs: 0,
      estimatedReadingTimeMinutes: 0,
    };
  }

  let processedText = text;

  // Remove Markdown formatting if requested
  if (!includeMarkdown) {
    processedText = removeMarkdownFormatting(processedText);
  }

  const words = countWordsMultiLanguage(processedText, customSeparators);
  const characters = processedText.length;
  const charactersNoSpaces = processedText.replace(/\s/g, '').length;
  const sentences = countSentences(processedText);
  const paragraphs = countParagraphs(processedText);

  // Estimate reading time (average 200-250 words per minute for English)
  // Adjust for languages with different reading speeds
  const avgWordsPerMinute = getAverageReadingSpeed(processedText);
  const estimatedReadingTimeMinutes = Math.ceil(words / avgWordsPerMinute);

  return {
    words,
    characters,
    charactersNoSpaces,
    sentences,
    paragraphs,
    estimatedReadingTimeMinutes,
  };
}

/**
 * Count words supporting multiple languages including CJK (Chinese, Japanese, Korean)
 */
function countWordsMultiLanguage(text: string, customSeparators: string[] = []): number {
  // Default word separators
  const defaultSeparators = [
    ' ',
    '\t',
    '\n',
    '\r',
    '.',
    ',',
    ';',
    ':',
    '!',
    '?',
    '(',
    ')',
    '[',
    ']',
    '{',
    '}',
    '"',
    "'",
    '`',
    '/',
    '\\',
    '|',
    '-',
    '_',
    '+',
    '=',
    '<',
    '>',
    '~',
    '@',
    '#',
    '$',
    '%',
    '^',
    '&',
    '*',
  ];

  const allSeparators = [...defaultSeparators, ...customSeparators];

  // Split text into potential words
  let words = 0;
  let i = 0;

  while (i < text.length) {
    const char = text[i];
    const charCode = char.charCodeAt(0);

    // Skip separators and whitespace
    if (allSeparators.includes(char) || /\s/.test(char)) {
      i++;
      continue;
    }

    // Handle CJK characters (each character is typically a word)
    if (isCJKCharacter(charCode)) {
      words++;
      i++;
      continue;
    }

    // Handle regular words (sequences of non-separator characters)
    if (isWordCharacter(char)) {
      words++;
      // Skip to the end of the word
      while (i < text.length && isWordCharacter(text[i]) && !allSeparators.includes(text[i])) {
        i++;
      }
      continue;
    }

    i++;
  }

  return words;
}

/**
 * Check if a character code represents a CJK character
 */
function isCJKCharacter(charCode: number): boolean {
  return (
    // CJK Unified Ideographs
    (charCode >= 0x4e00 && charCode <= 0x9fff) ||
    // CJK Extension A
    (charCode >= 0x3400 && charCode <= 0x4dbf) ||
    // CJK Extension B
    (charCode >= 0x20000 && charCode <= 0x2a6df) ||
    // CJK Extension C
    (charCode >= 0x2a700 && charCode <= 0x2b73f) ||
    // CJK Extension D
    (charCode >= 0x2b740 && charCode <= 0x2b81f) ||
    // CJK Extension E
    (charCode >= 0x2b820 && charCode <= 0x2ceaf) ||
    // CJK Compatibility Ideographs
    (charCode >= 0xf900 && charCode <= 0xfaff) ||
    // Hiragana
    (charCode >= 0x3040 && charCode <= 0x309f) ||
    // Katakana
    (charCode >= 0x30a0 && charCode <= 0x30ff) ||
    // Hangul Syllables
    (charCode >= 0xac00 && charCode <= 0xd7af) ||
    // Hangul Jamo
    (charCode >= 0x1100 && charCode <= 0x11ff) ||
    // Hangul Jamo Extended-A
    (charCode >= 0xa960 && charCode <= 0xa97f) ||
    // Hangul Jamo Extended-B
    (charCode >= 0xd7b0 && charCode <= 0xd7ff)
  );
}

/**
 * Check if a character is a word character (letters, numbers, some symbols)
 */
function isWordCharacter(char: string): boolean {
  return /[\w\u00C0-\u017F\u0400-\u04FF]/.test(char);
}

/**
 * Count sentences in text
 */
function countSentences(text: string): number {
  // Match sentence endings, but be smart about abbreviations
  const sentences = text.match(/[.!?]+(?=\s|$)/g);
  return sentences ? sentences.length : 0;
}

/**
 * Count paragraphs in text
 */
function countParagraphs(text: string): number {
  // Split by double newlines or more
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  return paragraphs.length;
}

/**
 * Remove Markdown formatting from text
 */
function removeMarkdownFormatting(text: string): string {
  return (
    text
      // Remove headers
      .replace(/^#{1,6}\s+/gm, '')
      // Remove bold and italic
      .replace(/\*{1,3}(.*?)\*{1,3}/g, '$1')
      .replace(/_{1,3}(.*?)_{1,3}/g, '$1')
      // Remove strikethrough
      .replace(/~~(.*?)~~/g, '$1')
      // Remove inline code
      .replace(/`([^`]+)`/g, '$1')
      // Remove code blocks
      .replace(/```[\s\S]*?```/g, '')
      .replace(/~~~[\s\S]*?~~~/g, '')
      // Remove blockquotes
      .replace(/^>\s+/gm, '')
      // Remove links but keep text
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      // Remove images
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
      // Remove horizontal rules
      .replace(/^(-{3,}|\*{3,}|_{3,})$/gm, '')
      // Remove HTML tags
      .replace(/<[^>]*>/g, '')
      // Clean up extra whitespace
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  );
}

/**
 * Get average reading speed based on text content
 */
function getAverageReadingSpeed(text: string): number {
  // Detect if text contains CJK characters
  const hasCJK = /[\u3400-\u4dbf\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af]/.test(text);

  if (hasCJK) {
    // CJK languages typically have slower reading speeds
    return 150; // words per minute
  }

  // Default for Latin-based languages
  return 225; // words per minute
}

/**
 * Format word count results into a readable string
 */
export function formatWordCountResults(results: WordCountResult): string {
  const { words, estimatedReadingTimeMinutes } = results;

  if (words === 0) {
    return 'No content';
  }

  const wordText = words === 1 ? 'word' : 'words';
  const timeText = estimatedReadingTimeMinutes === 1 ? 'minute' : 'minutes';

  return `${words.toLocaleString()} ${wordText} • ${estimatedReadingTimeMinutes} ${timeText} read`;
}

/**
 * Simple word count function for quick use
 */
export function getWordCount(text: string): number {
  return countWords(text).words;
}

/**
 * Get estimated reading time in minutes
 */
export function getReadingTime(text: string): number {
  return countWords(text).estimatedReadingTimeMinutes;
}
