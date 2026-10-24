import { Server, Socket } from 'socket.io';
import { RoomManager } from '../services/RoomManager.js';
import { Player } from '../models/Player.js';
import { Room } from '../models/Room.js';
import { StrokeData, ChatMessage, RoomSettings } from '../types.js';

export class SocketHandler {
  private io: Server;
  private roomManager: RoomManager;

  constructor(io: Server) {
    this.io = io;
    this.roomManager = RoomManager.getInstance();
    this.init();
  }

  private init(): void {
    this.io.on('connection', (socket: Socket) => {
      // 1. Room & Lobby Handlers
      socket.on('play_public', (data: { playerName: string; avatar?: any }) => {
        try {
          this.roomManager.unregisterPlayer(socket.id);

          const player = new Player(socket.id, data.playerName || 'Player', data.avatar, false);
          const { room, isNew } = this.roomManager.findOrCreatePublicRoom(player, 6);

          if (isNew) {
            player.isHost = true;
            socket.join(room.id);
            this.attachGameEventListeners(room);

            socket.emit('room_created', {
              roomId: room.id,
              player: player.toJSON(),
              players: room.getPlayers().map(p => p.toJSON()),
              settings: room.game.settings,
            });
          } else {
            room.addPlayer(player);
            this.roomManager.registerPlayerToRoom(socket.id, room.id);
            socket.join(room.id);

            // If game is in progress, append to turn order so player participates in rotation
            if (room.game.phase !== 'LOBBY') {
              if (!room.game.turnOrder.includes(player.id)) {
                room.game.turnOrder.push(player.id);
              }
            }

            // Broadcast to existing room players
            socket.to(room.id).emit('player_joined', {
              player: player.toJSON(),
              players: room.getPlayers().map(p => p.toJSON()),
            });

            // Send full game state to joining player
            const isDrawer = room.game.currentDrawerId === player.id;
            socket.emit('joined_successfully', {
              roomId: room.id,
              player: player.toJSON(),
              players: room.getPlayers().map(p => p.toJSON()),
              settings: room.game.settings,
              phase: room.game.phase,
              round: room.game.currentRound,
              totalRounds: room.game.totalRounds,
              drawerId: room.game.currentDrawerId,
              word: isDrawer ? room.game.currentWord : undefined,
              hint: room.game.currentHintMask,
              timeLeft: room.game.timeLeft,
              strokes: room.game.strokes,
              chatHistory: room.chatHistory,
            });

            // System message in chat
            const joinMsg: ChatMessage = {
              id: `sys_${Date.now()}_${Math.random()}`,
              text: `${player.name} joined the room!`,
              type: 'join',
              timestamp: Date.now(),
            };
            room.addChatMessage(joinMsg);
            this.io.to(room.id).emit('chat_message', joinMsg);

            // In public rooms, auto-start if in LOBBY and >= 2 players
            if (room.game.phase === 'LOBBY' && room.getPlayers().length >= 2) {
              this.checkAndStartPublicLobby(room);
            }
          }

          this.broadcastPublicRooms();
        } catch (err: any) {
          socket.emit('error_message', { message: err.message || 'Failed to match public room' });
        }
      });

      socket.on('create_room', (data: { hostName: string; settings?: Partial<RoomSettings>; avatar?: any }) => {
        try {
          const hostPlayer = new Player(socket.id, data.hostName || 'Host', data.avatar, true);
          const room = this.roomManager.createRoom(hostPlayer, data.settings);

          socket.join(room.id);
          this.attachGameEventListeners(room);

          socket.emit('room_created', {
            roomId: room.id,
            player: hostPlayer.toJSON(),
            players: room.getPlayers().map(p => p.toJSON()),
            settings: room.game.settings,
          });

          this.broadcastPublicRooms();
        } catch (err: any) {
          socket.emit('error_message', { message: err.message || 'Failed to create room' });
        }
      });

      socket.on('join_room', (data: { roomId: string; playerName: string; avatar?: any }) => {
        try {
          const roomId = data.roomId ? data.roomId.toUpperCase().trim() : '';
          const room = this.roomManager.getRoom(roomId);

          if (!room) {
            return socket.emit('error_message', { message: 'Room not found. Check the code and try again.' });
          }

          if (room.isFull()) {
            return socket.emit('error_message', { message: 'Room is full! Cannot join.' });
          }

          if (room.players.has(socket.id)) {
            return;
          }

          const player = new Player(socket.id, data.playerName || 'Player', data.avatar, false);
          room.addPlayer(player);
          this.roomManager.registerPlayerToRoom(socket.id, room.id);

          socket.join(room.id);

          // If game is in progress, append to turn order
          if (room.game.phase !== 'LOBBY') {
            if (!room.game.turnOrder.includes(player.id)) {
              room.game.turnOrder.push(player.id);
            }
          }

          // Broadcast to existing room players
          socket.to(room.id).emit('player_joined', {
            player: player.toJSON(),
            players: room.getPlayers().map(p => p.toJSON()),
          });

          // Send current state to newly joined player
          const isDrawer = room.game.currentDrawerId === player.id;
          socket.emit('joined_successfully', {
            roomId: room.id,
            player: player.toJSON(),
            players: room.getPlayers().map(p => p.toJSON()),
            settings: room.game.settings,
            phase: room.game.phase,
            round: room.game.currentRound,
            totalRounds: room.game.totalRounds,
            drawerId: room.game.currentDrawerId,
            word: isDrawer ? room.game.currentWord : undefined,
            hint: room.game.currentHintMask,
            timeLeft: room.game.timeLeft,
            strokes: room.game.strokes,
            chatHistory: room.chatHistory,
          });

          // System message in chat
          const joinMsg: ChatMessage = {
            id: `sys_${Date.now()}_${Math.random()}`,
            text: `${player.name} joined the room!`,
            type: 'join',
            timestamp: Date.now(),
          };
          room.addChatMessage(joinMsg);
          this.io.to(room.id).emit('chat_message', joinMsg);

          // If in public room and in LOBBY with >= 2 players, auto-start
          if (!room.game.settings.isPrivate && room.game.phase === 'LOBBY' && room.getPlayers().length >= 2) {
            this.checkAndStartPublicLobby(room);
          }

          this.broadcastPublicRooms();
        } catch (err: any) {
          socket.emit('error_message', { message: err.message || 'Failed to join room' });
        }
      });

      // 2. Settings Update (Host only)
      socket.on('update_settings', (settings: Partial<RoomSettings>) => {
        const room = this.roomManager.getRoomBySocketId(socket.id);
        if (!room || room.hostId !== socket.id) return;

        room.game.updateSettings(settings);
        this.io.to(room.id).emit('settings_updated', room.game.settings);
        this.broadcastPublicRooms();
      });

      // 3. Start Game (Host only)
      socket.on('start_game', () => {
        const room = this.roomManager.getRoomBySocketId(socket.id);
        if (!room) return;

        if (room.hostId !== socket.id) {
          return socket.emit('error_message', { message: 'Only the host can start the game!' });
        }

        const players = room.getPlayers();
        if (players.length < 2) {
          return socket.emit('error_message', { message: 'At least 2 players are needed to start!' });
        }

        const started = room.game.startGame(players);
        if (started) {
          this.startNextTurn(room);
        }
      });

      // 4. Word Chosen (Drawer picks word)
      socket.on('word_chosen', (data: { word: string }) => {
        const room = this.roomManager.getRoomBySocketId(socket.id);
        if (!room || room.game.currentDrawerId !== socket.id || room.game.phase !== 'CHOOSING_WORD') return;

        room.game.selectWord(data.word);

        // Notify drawer with the chosen word
        socket.emit('game_state', {
          phase: 'DRAWING',
          round: room.game.currentRound,
          drawerId: room.game.currentDrawerId,
          word: room.game.currentWord,
          hints: room.game.currentHintMask,
        });

        // Notify other players with blank hints
        socket.to(room.id).emit('game_state', {
          phase: 'DRAWING',
          round: room.game.currentRound,
          drawerId: room.game.currentDrawerId,
          word: undefined,
          hints: room.game.currentHintMask,
        });

        const drawer = room.getPlayer(socket.id);
        const startMsg: ChatMessage = {
          id: `sys_${Date.now()}`,
          text: `${drawer ? drawer.name : 'The drawer'} is now drawing!`,
          type: 'system',
          timestamp: Date.now(),
        };
        room.addChatMessage(startMsg);
        this.io.to(room.id).emit('chat_message', startMsg);
      });

      // 5. Drawing Events
      socket.on('draw_start', (data: { x: number; y: number; color: string; size: number; tool?: 'pen' | 'eraser' | 'fill' }) => {
        const room = this.roomManager.getRoomBySocketId(socket.id);
        if (!room || room.game.currentDrawerId !== socket.id || room.game.phase !== 'DRAWING') return;

        const newStroke: StrokeData = {
          id: `st_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          tool: data.tool || 'pen',
          color: data.color || '#000000',
          size: data.size || 5,
          points: [{ x: data.x, y: data.y }],
        };
        room.game.currentStroke = newStroke;
        room.game.addStroke(newStroke);

        socket.to(room.id).emit('draw_start', {
          id: newStroke.id,
          x: data.x,
          y: data.y,
          color: newStroke.color,
          size: newStroke.size,
          tool: newStroke.tool,
        });
      });

      socket.on('draw_move', (data: { x: number; y: number }) => {
        const room = this.roomManager.getRoomBySocketId(socket.id);
        if (!room || room.game.currentDrawerId !== socket.id || room.game.phase !== 'DRAWING') return;

        if (room.game.currentStroke) {
          room.game.currentStroke.points.push({ x: data.x, y: data.y });
        }

        socket.to(room.id).emit('draw_move', { x: data.x, y: data.y });
      });

      socket.on('draw_end', () => {
        const room = this.roomManager.getRoomBySocketId(socket.id);
        if (!room || room.game.currentDrawerId !== socket.id || room.game.phase !== 'DRAWING') return;

        room.game.currentStroke = null;
        socket.to(room.id).emit('draw_end', {});
      });

      socket.on('canvas_clear', () => {
        const room = this.roomManager.getRoomBySocketId(socket.id);
        if (!room || room.game.currentDrawerId !== socket.id || room.game.phase !== 'DRAWING') return;

        room.game.clearStrokes();
        this.io.to(room.id).emit('canvas_clear', {});
      });

      socket.on('draw_undo', () => {
        const room = this.roomManager.getRoomBySocketId(socket.id);
        if (!room || room.game.currentDrawerId !== socket.id || room.game.phase !== 'DRAWING') return;

        room.game.undoStroke();
        this.io.to(room.id).emit('draw_undo', {
          strokes: room.game.strokes,
        });
      });

      socket.on('draw_fill', (data: { x: number; y: number; color: string }) => {
        const room = this.roomManager.getRoomBySocketId(socket.id);
        if (!room || room.game.currentDrawerId !== socket.id || room.game.phase !== 'DRAWING') return;

        const fillStroke: StrokeData = {
          id: `fill_${Date.now()}`,
          tool: 'fill',
          color: data.color,
          size: 0,
          points: [{ x: data.x, y: data.y }],
        };
        room.game.addStroke(fillStroke);
        socket.to(room.id).emit('draw_fill', data);
      });

      // 6. Chat & Guessing
      socket.on('guess', (data: { text: string }) => {
        const room = this.roomManager.getRoomBySocketId(socket.id);
        if (!room || !data.text || !data.text.trim()) return;

        const player = room.getPlayer(socket.id);
        if (!player) return;

        // If in drawing phase and player hasn't guessed and isn't drawer
        if (room.game.phase === 'DRAWING' && socket.id !== room.game.currentDrawerId && !player.hasGuessed) {
          const result = room.game.processGuess(player, data.text, room.getPlayers());

          if (result.isCorrect) {
            // Correct guess!
            socket.emit('guess_result', {
              correct: true,
              playerId: player.id,
              playerName: player.name,
              points: result.points,
            });

            // Announce to everyone without exposing the word
            this.io.to(room.id).emit('chat_message', {
              id: `correct_${Date.now()}`,
              playerId: player.id,
              playerName: player.name,
              text: `${player.name} guessed the word! (+${result.points} pts)`,
              type: 'correct',
              timestamp: Date.now(),
            });

            // Update player scores to everyone
            this.io.to(room.id).emit('players_updated', {
              players: room.getPlayers().map(p => p.toJSON()),
            });

            return;
          } else if (result.isClose) {
            // Notify player privately that they are close
            socket.emit('guess_result', {
              correct: false,
              isClose: true,
              playerId: player.id,
              playerName: player.name,
              points: 0,
            });
            socket.emit('chat_message', {
              id: `close_${Date.now()}`,
              text: `"${data.text}" is very close!`,
              type: 'close',
              timestamp: Date.now(),
            });
            return;
          }
        }

        // Regular chat message
        const chatMsg: ChatMessage = {
          id: `chat_${Date.now()}_${Math.random()}`,
          playerId: player.id,
          playerName: player.name,
          text: data.text.trim().slice(0, 150),
          type: player.hasGuessed ? 'guess' : 'chat',
          timestamp: Date.now(),
        };

        // If player already guessed, only show their chat to other players who have guessed or drawer to prevent spoiler hints
        if (player.hasGuessed && room.game.phase === 'DRAWING') {
          room.getPlayers().forEach(p => {
            if (p.hasGuessed || p.isDrawer) {
              this.io.to(p.id).emit('chat_message', chatMsg);
            }
          });
        } else {
          room.addChatMessage(chatMsg);
          this.io.to(room.id).emit('chat_message', chatMsg);
        }
      });

      socket.on('chat', (data: { text: string }) => {
        // Forward to guess handler
        socket.emit('guess', data);
      });

      // 7. Public Rooms List
      socket.on('get_public_rooms', () => {
        socket.emit('public_rooms_list', this.roomManager.getPublicRooms());
      });

      // 8. Host Moderation (Kick)
      socket.on('kick_player', (data: { playerId: string }) => {
        const room = this.roomManager.getRoomBySocketId(socket.id);
        if (!room || room.hostId !== socket.id || data.playerId === socket.id) return;

        const kickedSocket = this.io.sockets.sockets.get(data.playerId);
        if (kickedSocket) {
          kickedSocket.emit('kicked', { message: 'You were kicked by the room host.' });
          kickedSocket.leave(room.id);
        }

        const { newHostId } = room.removePlayer(data.playerId);
        this.roomManager.unregisterPlayer(data.playerId);

        this.io.to(room.id).emit('player_left', {
          playerId: data.playerId,
          players: room.getPlayers().map(p => p.toJSON()),
          newHostId,
        });
      });

      // 9. Disconnect
      socket.on('disconnect', () => {
        const { room, wasHost, newHostId } = this.roomManager.unregisterPlayer(socket.id);
        if (!room) {
          this.broadcastPublicRooms();
          return;
        }

        this.io.to(room.id).emit('player_left', {
          playerId: socket.id,
          players: room.getPlayers().map(p => p.toJSON()),
          newHostId,
        });

        // If the drawer left during an active drawing round, end round immediately
        if (room.game.currentDrawerId === socket.id && (room.game.phase === 'DRAWING' || room.game.phase === 'CHOOSING_WORD')) {
          this.handleRoundEnd(room, 'drawer_left');
        } else if (room.getPlayers().length < 2 && room.game.phase !== 'LOBBY') {
          // Reset to lobby if not enough players left
          room.game.resetGame();
          this.io.to(room.id).emit('game_reset_lobby', {
            message: 'Game paused: not enough players to continue.',
            players: room.getPlayers().map(p => p.toJSON()),
          });
        }

        this.broadcastPublicRooms();
      });
    });
  }

  private attachGameEventListeners(room: Room): void {
    room.game.onTick = (timeLeft: number) => {
      this.io.to(room.id).emit('time_tick', { timeLeft });
    };

    room.game.onHintUpdate = (hint: string) => {
      // Send hints to non-drawers
      room.getPlayers().forEach(p => {
        if (p.id !== room.game.currentDrawerId) {
          this.io.to(p.id).emit('hint_update', { hint });
        }
      });
    };

    room.game.onRoundTimeout = () => {
      this.handleRoundEnd(room, 'timeout');
    };

    room.game.onAllGuessed = () => {
      this.handleRoundEnd(room, 'guessed');
    };

    room.game.onWordSelectionTimeout = () => {
      // Drawer didn't pick in time, auto pick 1st word
      const autoWord = room.game.currentWordOptions[0] || 'apple';
      room.game.selectWord(autoWord);

      const drawerSocket = this.io.sockets.sockets.get(room.game.currentDrawerId || '');
      if (drawerSocket) {
        drawerSocket.emit('game_state', {
          phase: 'DRAWING',
          round: room.game.currentRound,
          drawerId: room.game.currentDrawerId,
          word: autoWord,
          hints: room.game.currentHintMask,
        });
      }

      this.io.to(room.id).emit('game_state', {
        phase: 'DRAWING',
        round: room.game.currentRound,
        drawerId: room.game.currentDrawerId,
        word: undefined,
        hints: room.game.currentHintMask,
      });
    };
  }

  private startNextTurn(room: Room): void {
    const roundData = room.game.prepareRound(room.getPlayers());

    if (!roundData) {
      // Game is over!
      this.handleGameOver(room);
      return;
    }

    const { drawer, wordOptions } = roundData;

    // Notify drawer with secret word options
    const drawerSocket = this.io.sockets.sockets.get(drawer.id);
    if (drawerSocket) {
      drawerSocket.emit('round_start', {
        drawerId: drawer.id,
        drawerName: drawer.name,
        wordOptions,
        drawTime: room.game.settings.drawTime,
        round: room.game.currentRound,
        totalRounds: room.game.totalRounds,
      });
    }

    // Notify all other players (without word options)
    drawerSocket?.to(room.id).emit('round_start', {
      drawerId: drawer.id,
      drawerName: drawer.name,
      wordOptions: [],
      drawTime: room.game.settings.drawTime,
      round: room.game.currentRound,
      totalRounds: room.game.totalRounds,
    });

    this.io.to(room.id).emit('players_updated', {
      players: room.getPlayers().map(p => p.toJSON()),
    });
  }

  private handleRoundEnd(room: Room, reason: 'guessed' | 'timeout' | 'drawer_left'): void {
    const roundResult = room.game.endRound(reason, room.getPlayers());

    this.io.to(room.id).emit('round_end', roundResult);
    this.io.to(room.id).emit('players_updated', {
      players: room.getPlayers().map(p => p.toJSON()),
    });

    // Pause 5 seconds to show results, then advance
    setTimeout(() => {
      if (room.isEmpty()) return;

      if (room.game.turnIndex >= room.game.turnOrder.length && room.game.currentRound >= room.game.totalRounds) {
        this.handleGameOver(room);
      } else {
        this.startNextTurn(room);
      }
    }, 5000);
  }

  private checkAndStartPublicLobby(room: Room): void {
    if (room.game.phase !== 'LOBBY' || room.game.settings.isPrivate) return;
    const players = room.getPlayers();
    if (players.length < 2) return;

    this.io.to(room.id).emit('chat_message', {
      id: `sys_start_${Date.now()}`,
      text: 'Enough players joined! Match starting in 3 seconds...',
      type: 'system',
      timestamp: Date.now(),
    });

    setTimeout(() => {
      if (room.isEmpty() || room.game.phase !== 'LOBBY') return;
      const currentPlayers = room.getPlayers();
      if (currentPlayers.length >= 2) {
        const started = room.game.startGame(currentPlayers);
        if (started) {
          this.startNextTurn(room);
        }
      }
    }, 3000);
  }

  private handleGameOver(room: Room): void {
    room.game.phase = 'GAME_OVER';
    const leaderboard = room.game.getLeaderboard(room.getPlayers()).map(p => p.toJSON());
    const winner = leaderboard[0] || null;

    this.io.to(room.id).emit('game_over', {
      winner,
      leaderboard,
    });

    // For public matchmaking rooms, auto-restart next match after podium celebration
    if (!room.game.settings.isPrivate) {
      setTimeout(() => {
        if (room.isEmpty()) return;
        const players = room.getPlayers();
        if (players.length >= 2) {
          const started = room.game.startGame(players);
          if (started) {
            this.startNextTurn(room);
            this.io.to(room.id).emit('chat_message', {
              id: `sys_${Date.now()}`,
              text: '🎮 A new match has started! Good luck!',
              type: 'system',
              timestamp: Date.now(),
            });
          }
        } else {
          room.game.resetGame();
          this.io.to(room.id).emit('game_reset_lobby', {
            message: 'Waiting for players to begin next match...',
            players: room.getPlayers().map(p => p.toJSON()),
          });
        }
        this.broadcastPublicRooms();
      }, 8000);
    }
  }

  private broadcastPublicRooms(): void {
    this.io.emit('public_rooms_list', this.roomManager.getPublicRooms());
  }
}
