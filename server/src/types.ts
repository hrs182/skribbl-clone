export interface AvatarConfig {
  color: string;
  eyes: number;
  mouth: number;
  hat?: number;
}

export interface PlayerData {
  id: string;
  name: string;
  avatar: AvatarConfig;
  score: number;
  roundScore: number;
  isHost: boolean;
  isReady: boolean;
  hasGuessed: boolean;
  isDrawer: boolean;
  rank?: number;
}

export interface RoomSettings {
  maxPlayers: number;
  rounds: number;
  drawTime: number;
  wordCount: number;
  hintsCount: number;
  wordMode: 'normal' | 'hidden';
  customWords: string[];
  isPrivate: boolean;
}

export type GamePhase = 'LOBBY' | 'CHOOSING_WORD' | 'DRAWING' | 'ROUND_END' | 'GAME_OVER';

export interface DrawPoint {
  x: number;
  y: number;
}

export interface StrokeData {
  id: string;
  tool: 'pen' | 'eraser' | 'fill';
  color: string;
  size: number;
  points: DrawPoint[];
}

export interface ChatMessage {
  id: string;
  playerId?: string;
  playerName?: string;
  text: string;
  type: 'chat' | 'guess' | 'correct' | 'close' | 'system' | 'join' | 'leave';
  timestamp: number;
}

export interface RoundResult {
  word: string;
  reason: 'guessed' | 'timeout' | 'drawer_left';
  scores: { [playerId: string]: { roundScore: number; totalScore: number } };
  nextDrawer?: { id: string; name: string };
}

export interface PublicRoomInfo {
  roomId: string;
  hostName: string;
  playerCount: number;
  maxPlayers: number;
  phase: GamePhase;
  round: number;
  totalRounds: number;
}
