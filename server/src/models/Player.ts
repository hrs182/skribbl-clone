import { AvatarConfig, PlayerData } from '../types.js';

export class Player {
  public id: string;
  public name: string;
  public avatar: AvatarConfig;
  public score: number = 0;
  public roundScore: number = 0;
  public isHost: boolean = false;
  public isReady: boolean = false;
  public hasGuessed: boolean = false;
  public guessTime: number | null = null;
  public isDrawer: boolean = false;

  constructor(id: string, name: string, avatar?: Partial<AvatarConfig>, isHost: boolean = false) {
    this.id = id;
    this.name = name.trim().slice(0, 16) || `Artist_${id.slice(0, 4)}`;
    this.isHost = isHost;
    this.avatar = {
      color: avatar?.color || '#3b82f6',
      eyes: avatar?.eyes ?? 1,
      mouth: avatar?.mouth ?? 1,
      hat: avatar?.hat ?? 0,
    };
  }

  public resetForNewRound(): void {
    this.roundScore = 0;
    this.hasGuessed = false;
    this.guessTime = null;
    this.isDrawer = false;
  }

  public addScore(points: number): void {
    this.roundScore += points;
    this.score += points;
  }

  public toJSON(): PlayerData {
    return {
      id: this.id,
      name: this.name,
      avatar: this.avatar,
      score: this.score,
      roundScore: this.roundScore,
      isHost: this.isHost,
      isReady: this.isReady,
      hasGuessed: this.hasGuessed,
      isDrawer: this.isDrawer,
    };
  }
}
