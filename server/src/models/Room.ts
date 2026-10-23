import { Player } from './Player.js';
import { Game } from './Game.js';
import { RoomSettings, ChatMessage, PublicRoomInfo } from '../types.js';

export class Room {
  public id: string;
  public hostId: string;
  public players: Map<string, Player> = new Map();
  public game: Game;
  public chatHistory: ChatMessage[] = [];
  public createdAt: number = Date.now();

  constructor(id: string, hostPlayer: Player, settings?: Partial<RoomSettings>) {
    this.id = id;
    this.hostId = hostPlayer.id;
    this.players.set(hostPlayer.id, hostPlayer);
    this.game = new Game(settings);
  }

  public addPlayer(player: Player): boolean {
    if (this.players.size >= this.game.settings.maxPlayers) {
      return false;
    }
    // If room has no host, make this player host
    if (this.players.size === 0) {
      this.hostId = player.id;
      player.isHost = true;
    }
    this.players.set(player.id, player);
    return true;
  }

  public removePlayer(playerId: string): { removed: boolean; newHostId?: string } {
    const player = this.players.get(playerId);
    if (!player) return { removed: false };

    this.players.delete(playerId);

    let newHostId: string | undefined;
    // If host left, elect new host
    if (this.hostId === playerId && this.players.size > 0) {
      const nextHost = this.players.values().next().value;
      if (nextHost) {
        nextHost.isHost = true;
        this.hostId = nextHost.id;
        newHostId = nextHost.id;
      }
    }

    return { removed: true, newHostId };
  }

  public getPlayer(playerId: string): Player | undefined {
    return this.players.get(playerId);
  }

  public getPlayers(): Player[] {
    return Array.from(this.players.values());
  }

  public isFull(): boolean {
    return this.players.size >= this.game.settings.maxPlayers;
  }

  public isEmpty(): boolean {
    return this.players.size === 0;
  }

  public addChatMessage(msg: ChatMessage): void {
    this.chatHistory.push(msg);
    if (this.chatHistory.length > 100) {
      this.chatHistory.shift();
    }
  }

  public toPublicInfo(): PublicRoomInfo {
    const host = this.players.get(this.hostId);
    return {
      roomId: this.id,
      hostName: host ? host.name : 'Unknown',
      playerCount: this.players.size,
      maxPlayers: this.game.settings.maxPlayers,
      phase: this.game.phase,
      round: this.game.currentRound,
      totalRounds: this.game.totalRounds,
    };
  }
}
