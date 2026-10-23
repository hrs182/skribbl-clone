import { GamePhase, RoomSettings, StrokeData, RoundResult, DrawPoint } from '../types.js';
import { Player } from './Player.js';
import { WordManager } from './WordManager.js';

export class Game {
  public phase: GamePhase = 'LOBBY';
  public settings: RoomSettings;
  public wordManager: WordManager;

  public currentRound: number = 0;
  public totalRounds: number = 3;
  public turnIndex: number = -1;
  public turnOrder: string[] = []; // player IDs in rotation

  public currentDrawerId: string | null = null;
  public currentWord: string | null = null;
  public currentWordOptions: string[] = [];
  public currentHintMask: string = '';
  public revealedHintIndices: number[] = [];

  public timeLeft: number = 0;
  public timerInterval: NodeJS.Timeout | null = null;

  public strokes: StrokeData[] = [];
  public currentStroke: StrokeData | null = null;

  // Callbacks hooked by Room / SocketHandler
  public onTick?: (timeLeft: number) => void;
  public onHintUpdate?: (hint: string) => void;
  public onRoundTimeout?: () => void;
  public onAllGuessed?: () => void;
  public onWordSelectionTimeout?: () => void;

  constructor(settings?: Partial<RoomSettings>) {
    this.settings = {
      maxPlayers: settings?.maxPlayers ?? 8,
      rounds: settings?.rounds ?? 3,
      drawTime: settings?.drawTime ?? 80,
      wordCount: settings?.wordCount ?? 3,
      hintsCount: settings?.hintsCount ?? 2,
      wordMode: settings?.wordMode ?? 'normal',
      customWords: settings?.customWords ?? [],
      isPrivate: settings?.isPrivate ?? false,
    };
    this.totalRounds = this.settings.rounds;
    this.wordManager = new WordManager(this.settings.customWords);
  }

  public updateSettings(newSettings: Partial<RoomSettings>): void {
    if (this.phase !== 'LOBBY') return;
    this.settings = { ...this.settings, ...newSettings };
    this.totalRounds = this.settings.rounds;
    if (newSettings.customWords) {
      this.wordManager.setCustomWords(newSettings.customWords);
    }
  }

  public startGame(players: Player[]): boolean {
    if (players.length < 2) return false;
    this.phase = 'CHOOSING_WORD';
    this.currentRound = 1;
    this.totalRounds = this.settings.rounds;
    this.turnOrder = [...players].map(p => p.id).sort(() => 0.5 - Math.random());
    this.turnIndex = 0;
    this.strokes = [];

    // Reset all scores
    players.forEach(p => {
      p.score = 0;
      p.roundScore = 0;
      p.hasGuessed = false;
      p.isDrawer = false;
    });

    return true;
  }

  public prepareRound(players: Player[]): { drawer: Player; wordOptions: string[] } | null {
    if (this.turnIndex >= this.turnOrder.length) {
      this.currentRound++;
      this.turnIndex = 0;
    }

    if (this.currentRound > this.totalRounds) {
      this.phase = 'GAME_OVER';
      return null;
    }

    this.stopTimer();
    this.strokes = [];
    this.currentStroke = null;

    // Reset players for new round
    players.forEach(p => p.resetForNewRound());

    // Find next valid drawer in turn order
    const drawerId = this.turnOrder[this.turnIndex];
    const drawer = players.find(p => p.id === drawerId);

    if (!drawer) {
      // Advance if player disconnected
      this.turnIndex++;
      return this.prepareRound(players);
    }

    this.currentDrawerId = drawer.id;
    drawer.isDrawer = true;
    this.phase = 'CHOOSING_WORD';

    // Word options
    this.currentWordOptions = this.wordManager.getRandomWords(this.settings.wordCount);
    this.currentWord = null;
    this.currentHintMask = '';
    this.revealedHintIndices = [];

    // Start 15s timer for choosing word
    this.startCountdown(15, () => {
      if (this.onWordSelectionTimeout) {
        this.onWordSelectionTimeout();
      }
    });

    return { drawer, wordOptions: this.currentWordOptions };
  }

  public selectWord(word: string): void {
    this.stopTimer();
    this.currentWord = word;
    this.currentHintMask = WordManager.getInitialHint(word);
    this.revealedHintIndices = [];
    this.phase = 'DRAWING';
    this.strokes = [];

    // Start drawing round countdown
    const drawDuration = this.settings.drawTime;
    let nextHintThreshold = 0.5; // at 50% time elapsed
    const hintThresholdStep = 0.25;

    this.startCountdown(drawDuration, () => {
      if (this.onRoundTimeout) {
        this.onRoundTimeout();
      }
    }, (timeLeft) => {
      // Check if hint should be revealed
      const elapsedRatio = (drawDuration - timeLeft) / drawDuration;
      if (
        this.settings.hintsCount > 0 &&
        this.settings.wordMode === 'normal' &&
        this.currentWord &&
        elapsedRatio >= nextHintThreshold &&
        this.revealedHintIndices.length < this.settings.hintsCount
      ) {
        this.revealedHintIndices = WordManager.getNextHintIndices(
          this.currentWord,
          this.revealedHintIndices,
          this.settings.hintsCount
        );
        this.currentHintMask = WordManager.getProgressiveHint(this.currentWord, this.revealedHintIndices);
        nextHintThreshold += hintThresholdStep;
        if (this.onHintUpdate) {
          this.onHintUpdate(this.currentHintMask);
        }
      }
    });
  }

  public startCountdown(
    seconds: number,
    onComplete: () => void,
    onTickProgress?: (timeLeft: number) => void
  ): void {
    this.stopTimer();
    this.timeLeft = seconds;
    if (this.onTick) this.onTick(this.timeLeft);

    this.timerInterval = setInterval(() => {
      this.timeLeft--;
      if (this.onTick) this.onTick(this.timeLeft);
      if (onTickProgress) onTickProgress(this.timeLeft);

      if (this.timeLeft <= 0) {
        this.stopTimer();
        onComplete();
      }
    }, 1000);
  }

  public stopTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  public processGuess(
    player: Player,
    text: string,
    allPlayers: Player[]
  ): {
    isCorrect: boolean;
    isClose: boolean;
    points: number;
  } {
    if (this.phase !== 'DRAWING' || !this.currentWord || player.id === this.currentDrawerId || player.hasGuessed) {
      return { isCorrect: false, isClose: false, points: 0 };
    }

    const cleanGuess = text.trim().toLowerCase();
    const cleanTarget = this.currentWord.trim().toLowerCase();

    if (cleanGuess === cleanTarget) {
      // Correct guess!
      player.hasGuessed = true;
      player.guessTime = this.timeLeft;

      // Scoring formula:
      // Base: 200, Time bonus up to 300. Order bonus for 1st guesser.
      const alreadyGuessedCount = allPlayers.filter(p => p.hasGuessed && p.id !== player.id).length;
      const timeBonus = Math.round(300 * (Math.max(1, this.timeLeft) / this.settings.drawTime));
      const orderBonus = Math.max(0, 100 - alreadyGuessedCount * 25);
      const points = 200 + timeBonus + orderBonus;

      player.addScore(points);

      // Reward drawer: +60 points per correct guess
      const drawer = allPlayers.find(p => p.id === this.currentDrawerId);
      if (drawer) {
        drawer.addScore(75);
      }

      // Check if all non-drawers have guessed
      const activeNonDrawers = allPlayers.filter(p => p.id !== this.currentDrawerId);
      const allGuessed = activeNonDrawers.length > 0 && activeNonDrawers.every(p => p.hasGuessed);

      if (allGuessed && this.onAllGuessed) {
        this.onAllGuessed();
      }

      return { isCorrect: true, isClose: false, points };
    }

    // Check if close
    const isClose = WordManager.isCloseGuess(cleanGuess, cleanTarget);
    return { isCorrect: false, isClose, points: 0 };
  }

  // Drawing stroke tracking
  public addStroke(stroke: StrokeData): void {
    this.strokes.push(stroke);
  }

  public undoStroke(): StrokeData | null {
    if (this.strokes.length > 0) {
      return this.strokes.pop() || null;
    }
    return null;
  }

  public clearStrokes(): void {
    this.strokes = [];
  }

  public endRound(reason: 'guessed' | 'timeout' | 'drawer_left', players: Player[]): RoundResult {
    this.stopTimer();
    this.phase = 'ROUND_END';

    const scores: { [id: string]: { roundScore: number; totalScore: number } } = {};
    players.forEach(p => {
      scores[p.id] = {
        roundScore: p.roundScore,
        totalScore: p.score,
      };
    });

    const revealedWord = this.currentWord || 'Unknown';

    // Prepare next turn pointer
    this.turnIndex++;
    let nextDrawer: { id: string; name: string } | undefined;

    let peekIndex = this.turnIndex;
    let peekRound = this.currentRound;
    if (peekIndex >= this.turnOrder.length) {
      peekRound++;
      peekIndex = 0;
    }

    if (peekRound <= this.totalRounds && this.turnOrder[peekIndex]) {
      const nextPlayer = players.find(p => p.id === this.turnOrder[peekIndex]);
      if (nextPlayer) {
        nextDrawer = { id: nextPlayer.id, name: nextPlayer.name };
      }
    }

    return {
      word: revealedWord,
      reason,
      scores,
      nextDrawer,
    };
  }

  public getLeaderboard(players: Player[]): Player[] {
    return [...players].sort((a, b) => b.score - a.score);
  }

  public resetGame(): void {
    this.stopTimer();
    this.phase = 'LOBBY';
    this.currentRound = 0;
    this.turnIndex = -1;
    this.turnOrder = [];
    this.currentDrawerId = null;
    this.currentWord = null;
    this.currentWordOptions = [];
    this.currentHintMask = '';
    this.revealedHintIndices = [];
    this.strokes = [];
  }
}
