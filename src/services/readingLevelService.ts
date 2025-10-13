/**
 * Reading Level Adaptation Service
 * Adjusts AI responses based on user's age/grade level
 */

export type ReadingLevel = 'elementary' | 'middle' | 'high' | 'college' | 'adult';
export type GradeLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 'college' | 'adult';

interface ReadingLevelConfig {
  level: ReadingLevel;
  minGrade: number;
  maxGrade: number;
  vocabularyComplexity: 'simple' | 'moderate' | 'advanced' | 'expert';
  sentenceLength: 'short' | 'medium' | 'long' | 'varied';
  examples: 'concrete' | 'mixed' | 'abstract';
  promptModifier: string;
}

const readingLevelConfigs: ReadingLevelConfig[] = [
  {
    level: 'elementary',
    minGrade: 1,
    maxGrade: 5,
    vocabularyComplexity: 'simple',
    sentenceLength: 'short',
    examples: 'concrete',
    promptModifier:
      'Explain in very simple terms suitable for elementary school children (grades 1-5). Use short sentences, simple words, and concrete examples they can relate to.',
  },
  {
    level: 'middle',
    minGrade: 6,
    maxGrade: 8,
    vocabularyComplexity: 'moderate',
    sentenceLength: 'medium',
    examples: 'mixed',
    promptModifier:
      'Explain clearly for middle school students (grades 6-8). Use moderate vocabulary, medium-length sentences, and relatable examples.',
  },
  {
    level: 'high',
    minGrade: 9,
    maxGrade: 12,
    vocabularyComplexity: 'advanced',
    sentenceLength: 'varied',
    examples: 'mixed',
    promptModifier:
      'Explain for high school students (grades 9-12). Use advanced vocabulary, varied sentence structure, and both concrete and abstract examples.',
  },
  {
    level: 'college',
    minGrade: 13,
    maxGrade: 16,
    vocabularyComplexity: 'expert',
    sentenceLength: 'varied',
    examples: 'abstract',
    promptModifier:
      'Explain at a college level with academic vocabulary, complex sentence structures, and scholarly examples.',
  },
  {
    level: 'adult',
    minGrade: 17,
    maxGrade: 99,
    vocabularyComplexity: 'expert',
    sentenceLength: 'varied',
    examples: 'abstract',
    promptModifier:
      'Provide a comprehensive, professional explanation with expert-level vocabulary and nuanced analysis.',
  },
];

class ReadingLevelService {
  private currentLevel: ReadingLevel = 'middle';
  private userGrade: number = 7;

  constructor() {
    // Load saved preference
    const savedLevel = localStorage.getItem('readingLevel') as ReadingLevel;
    const savedGrade = localStorage.getItem('gradeLevel');

    if (savedLevel) {
      this.currentLevel = savedLevel;
    }

    if (savedGrade) {
      this.userGrade = parseInt(savedGrade);
      this.currentLevel = this.getReadingLevelFromGrade(this.userGrade);
    }
  }

  setGradeLevel(grade: GradeLevel) {
    if (grade === 'college') {
      this.userGrade = 13;
    } else if (grade === 'adult') {
      this.userGrade = 18;
    } else {
      this.userGrade = grade as number;
    }

    this.currentLevel = this.getReadingLevelFromGrade(this.userGrade);
    localStorage.setItem('gradeLevel', this.userGrade.toString());
    localStorage.setItem('readingLevel', this.currentLevel);
  }

  setReadingLevel(level: ReadingLevel) {
    this.currentLevel = level;
    const config = this.getConfig(level);
    this.userGrade = config.minGrade;
    localStorage.setItem('readingLevel', level);
    localStorage.setItem('gradeLevel', this.userGrade.toString());
  }

  getReadingLevel(): ReadingLevel {
    return this.currentLevel;
  }

  getGradeLevel(): number {
    return this.userGrade;
  }

  private getReadingLevelFromGrade(grade: number): ReadingLevel {
    if (grade <= 5) return 'elementary';
    if (grade <= 8) return 'middle';
    if (grade <= 12) return 'high';
    if (grade <= 16) return 'college';
    return 'adult';
  }

  private getConfig(level: ReadingLevel): ReadingLevelConfig {
    return (
      readingLevelConfigs.find((config) => config.level === level) || readingLevelConfigs[1]
    );
  }

  getPromptModifier(): string {
    const config = this.getConfig(this.currentLevel);
    return config.promptModifier;
  }

  adjustPromptForLevel(basePrompt: string): string {
    const modifier = this.getPromptModifier();
    return `${basePrompt}\n\n${modifier}`;
  }

  simplifyText(text: string, targetLevel?: ReadingLevel): string {
    const level = targetLevel || this.currentLevel;
    const config = this.getConfig(level);

    // This is a simplified version - in production, you might use NLP libraries
    // or an API to properly simplify text

    let simplified = text;

    if (config.vocabularyComplexity === 'simple') {
      // Replace complex words with simpler alternatives
      const replacements: { [key: string]: string } = {
        utilize: 'use',
        commence: 'start',
        terminate: 'end',
        acquire: 'get',
        demonstrate: 'show',
        facilitate: 'help',
        implement: 'do',
        substantial: 'large',
        numerous: 'many',
        accomplish: 'do',
        investigate: 'look at',
        construct: 'build',
        subsequent: 'next',
        prior: 'before',
        approximately: 'about',
      };

      Object.entries(replacements).forEach(([complex, simple]) => {
        const regex = new RegExp(`\\b${complex}\\b`, 'gi');
        simplified = simplified.replace(regex, simple);
      });
    }

    if (config.sentenceLength === 'short') {
      // Split long sentences (basic implementation)
      simplified = simplified.replace(/([.!?])\s+/g, '$1\n');
    }

    return simplified;
  }

  getMaxTokensForLevel(): number {
    const tokenLimits: { [key in ReadingLevel]: number } = {
      elementary: 150,
      middle: 200,
      high: 300,
      college: 400,
      adult: 500,
    };

    return tokenLimits[this.currentLevel];
  }

  getSentenceComplexityScore(text: string): number {
    // Calculate average sentence length
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
    const words = text.split(/\s+/).filter((w) => w.length > 0);
    const avgWordsPerSentence = words.length / Math.max(sentences.length, 1);

    // Calculate syllable complexity (simplified)
    const complexWords = words.filter((word) => this.countSyllables(word) > 3).length;
    const complexWordRatio = complexWords / Math.max(words.length, 1);

    // Flesch Reading Ease approximation (0-100, higher is easier)
    const score = 206.835 - 1.015 * avgWordsPerSentence - 84.6 * complexWordRatio;

    return Math.max(0, Math.min(100, score));
  }

  private countSyllables(word: string): number {
    // Simplified syllable counter
    word = word.toLowerCase();
    if (word.length <= 3) return 1;

    const vowels = 'aeiouy';
    let syllableCount = 0;
    let prevWasVowel = false;

    for (let i = 0; i < word.length; i++) {
      const isVowel = vowels.includes(word[i]);

      if (isVowel && !prevWasVowel) {
        syllableCount++;
      }

      prevWasVowel = isVowel;
    }

    // Adjust for silent 'e'
    if (word.endsWith('e')) {
      syllableCount--;
    }

    return Math.max(1, syllableCount);
  }

  getReadingLevelRecommendation(text: string): ReadingLevel {
    const score = this.getSentenceComplexityScore(text);

    if (score >= 80) return 'elementary';
    if (score >= 60) return 'middle';
    if (score >= 40) return 'high';
    if (score >= 20) return 'college';
    return 'adult';
  }

  formatForLevel(text: string, targetLevel?: ReadingLevel): string {
    const level = targetLevel || this.currentLevel;
    const config = this.getConfig(level);

    // Add formatting based on level
    const paragraphs = text.split('\n\n');

    if (config.sentenceLength === 'short') {
      // Shorter paragraphs for younger readers
      return paragraphs
        .map((p) => {
          const sentences = p.split(/([.!?])\s+/);
          const chunks = [];

          for (let i = 0; i < sentences.length; i += 4) {
            chunks.push(sentences.slice(i, i + 4).join(' '));
          }

          return chunks.join('\n\n');
        })
        .join('\n\n');
    }

    return text;
  }

  getAllLevels(): Array<{ level: ReadingLevel; label: string; description: string }> {
    return [
      {
        level: 'elementary',
        label: 'Elementary (K-5)',
        description: 'Simple words and short sentences',
      },
      {
        level: 'middle',
        label: 'Middle School (6-8)',
        description: 'Clear explanations with moderate vocabulary',
      },
      {
        level: 'high',
        label: 'High School (9-12)',
        description: 'Advanced concepts and varied language',
      },
      {
        level: 'college',
        label: 'College',
        description: 'Academic language and complex ideas',
      },
      {
        level: 'adult',
        label: 'Professional',
        description: 'Expert-level analysis and vocabulary',
      },
    ];
  }
}

export const readingLevelService = new ReadingLevelService();
export default readingLevelService;
