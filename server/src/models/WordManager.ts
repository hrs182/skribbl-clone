export class WordManager {
  private static readonly DEFAULT_WORDS: string[] = [
    // Animals
    'cat', 'dog', 'elephant', 'giraffe', 'kangaroo', 'penguin', 'dolphin', 'lion',
    'tiger', 'monkey', 'panda', 'octopus', 'rabbit', 'hamster', 'zebra', 'snake',
    'whale', 'eagle', 'butterfly', 'frog', 'chameleon', 'owl', 'shark', 'koala',
    // Everyday Objects
    'umbrella', 'chair', 'laptop', 'guitar', 'clock', 'camera', 'backpack',
    'bicycle', 'telephone', 'glasses', 'flashlight', 'keys', 'scissors', 'candle',
    'mirror', 'toothbrush', 'headphones', 'pillow', 'television', 'wallet',
    // Food & Drink
    'pizza', 'burger', 'ice cream', 'banana', 'sushi', 'pancake', 'cookie',
    'apple', 'sandwich', 'hotdog', 'cupcake', 'taco', 'strawberry', 'watermelon',
    'doughnut', 'coffee', 'chocolate', 'popcorn', 'cheese', 'pineapple',
    // Places & Nature
    'mountain', 'volcano', 'beach', 'forest', 'island', 'desert', 'waterfall',
    'rainbow', 'castle', 'lighthouse', 'pyramid', 'bridge', 'tent', 'windmill',
    // Actions & Verbs
    'swimming', 'dancing', 'sleeping', 'singing', 'flying', 'cooking', 'painting',
    'reading', 'fishing', 'climbing', 'crying', 'laughing', 'jogging',
    // Pop Culture & Fun
    'superman', 'batman', 'pikachu', 'spiderman', 'robot', 'alien', 'wizard',
    'dragon', 'ninja', 'pirate', 'ghost', 'zombie', 'astronaut', 'dinosaur'
  ];

  private wordsPool: string[] = [];
  private customWords: string[] = [];

  constructor(customWords: string[] = []) {
    this.setCustomWords(customWords);
  }

  public setCustomWords(customWords: string[]): void {
    this.customWords = customWords
      .map(w => w.trim().toLowerCase())
      .filter(w => w.length >= 2 && w.length <= 25);
    this.refreshPool();
  }

  public refreshPool(): void {
    if (this.customWords.length > 0) {
      this.wordsPool = [...this.customWords, ...WordManager.DEFAULT_WORDS];
    } else {
      this.wordsPool = [...WordManager.DEFAULT_WORDS];
    }
  }

  public getRandomWords(count: number = 3): string[] {
    if (this.wordsPool.length < count) {
      this.refreshPool();
    }
    const shuffled = [...this.wordsPool].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, count);
    
    // Remove selected to avoid immediate repeats
    this.wordsPool = this.wordsPool.filter(w => !selected.includes(w));
    if (this.wordsPool.length < 5) {
      this.refreshPool();
    }
    return selected;
  }

  public static getInitialHint(word: string): string {
    // Return blanks preserving spaces and dashes
    return word
      .split('')
      .map(char => {
        if (char === ' ') return ' ';
        if (char === '-') return '-';
        return '_';
      })
      .join(' ');
  }

  public static getProgressiveHint(word: string, revealedIndices: number[]): string {
    const chars = word.split('');
    return chars
      .map((char, index) => {
        if (char === ' ') return ' ';
        if (char === '-') return '-';
        if (revealedIndices.includes(index)) return char.toUpperCase();
        return '_';
      })
      .join(' ');
  }

  public static getNextHintIndices(word: string, currentRevealed: number[], maxHints: number): number[] {
    const validIndices: number[] = [];
    for (let i = 0; i < word.length; i++) {
      if (word[i] !== ' ' && word[i] !== '-' && !currentRevealed.includes(i)) {
        validIndices.push(i);
      }
    }
    
    // Max letters to reveal shouldn't exceed word length - 2 (keep mystery)
    const allowedToReveal = Math.min(maxHints, Math.max(1, Math.floor(word.length * 0.4)));
    if (currentRevealed.length >= allowedToReveal || validIndices.length === 0) {
      return currentRevealed;
    }

    const randomIndex = validIndices[Math.floor(Math.random() * validIndices.length)];
    return [...currentRevealed, randomIndex];
  }

  public static isCloseGuess(guess: string, target: string): boolean {
    const g = guess.trim().toLowerCase();
    const t = target.trim().toLowerCase();
    if (g === t) return false; // exact match, not close
    const dist = this.levenshtein(g, t);
    return dist === 1 || (dist === 2 && t.length > 5);
  }

  public static levenshtein(a: string, b: string): number {
    const matrix: number[][] = [];
    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }
    return matrix[b.length][a.length];
  }
}
