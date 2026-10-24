import { Room } from '../models/Room.js';
import { Player } from '../models/Player.js';
import { RoomSettings, PublicRoomInfo } from '../types.js';

export class RoomManager {
  private static instance: RoomManager;
  private rooms: Map<string, Room> = new Map();
  private socketRoomMap: Map<string, string> = new Map(); // socketId -> roomId

  private constructor() {}

  public static getInstance(): RoomManager {
    if (!RoomManager.instance) {
      RoomManager.instance = new RoomManager();
    }
    return RoomManager.instance;
  }

  public generateRoomId(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    do {
      code = '';
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    } while (this.rooms.has(code));
    return code;
  }

  public createRoom(hostPlayer: Player, settings?: Partial<RoomSettings>): Room {
    const roomId = this.generateRoomId();
    const room = new Room(roomId, hostPlayer, settings);
    this.rooms.set(roomId, room);
    this.socketRoomMap.set(hostPlayer.id, roomId);
    return room;
  }

  public getRoom(roomId: string): Room | undefined {
    return this.rooms.get(roomId.toUpperCase().trim());
  }

  public getRoomBySocketId(socketId: string): Room | undefined {
    const roomId = this.socketRoomMap.get(socketId);
    if (!roomId) return undefined;
    return this.rooms.get(roomId);
  }

  public registerPlayerToRoom(socketId: string, roomId: string): void {
    this.socketRoomMap.set(socketId, roomId);
  }

  public unregisterPlayer(socketId: string): { room?: Room; wasHost: boolean; newHostId?: string } {
    const roomId = this.socketRoomMap.get(socketId);
    if (!roomId) return { wasHost: false };

    this.socketRoomMap.delete(socketId);
    const room = this.rooms.get(roomId);
    if (!room) return { wasHost: false };

    const wasHost = room.hostId === socketId;
    const { removed, newHostId } = room.removePlayer(socketId);

    if (room.isEmpty()) {
      room.game.stopTimer();
      this.rooms.delete(roomId);
      return { room: undefined, wasHost };
    }

    return { room, wasHost, newHostId };
  }

  public findOrCreatePublicRoom(hostPlayer: Player, maxPlayers: number = 6): { room: Room; isNew: boolean } {
    // Search for an existing public room that has space and is not GAME_OVER
    for (const room of this.rooms.values()) {
      if (!room.game.settings.isPrivate && room.players.size < room.game.settings.maxPlayers && room.game.phase !== 'GAME_OVER') {
        return { room, isNew: false };
      }
    }

    // No available room found, create a new public room
    const roomId = this.generateRoomId();
    const room = new Room(roomId, hostPlayer, {
      maxPlayers,
      rounds: 3,
      drawTime: 80,
      wordCount: 3,
      hintsCount: 2,
      wordMode: 'normal',
      isPrivate: false,
    });
    this.rooms.set(roomId, room);
    this.socketRoomMap.set(hostPlayer.id, roomId);
    return { room, isNew: true };
  }

  public getPublicRooms(): PublicRoomInfo[] {
    const list: PublicRoomInfo[] = [];
    for (const room of this.rooms.values()) {
      if (!room.game.settings.isPrivate && !room.isFull()) {
        list.push(room.toPublicInfo());
      }
    }
    return list;
  }

  public deleteRoom(roomId: string): void {
    const room = this.rooms.get(roomId);
    if (room) {
      room.game.stopTimer();
      this.rooms.delete(roomId);
    }
  }
}
