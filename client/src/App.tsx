import React, { useState, useEffect } from 'react';
import {
  PlayerData,
  RoomSettings,
  GamePhase,
  AvatarConfig,
  StrokeData,
  ChatMessage,
  RoundResult,
} from './types';
import { socket } from './services/socket';
import { soundManager } from './services/sound';

import { HeaderBar } from './components/HeaderBar';
import { CanvasBoard } from './components/CanvasBoard';
import { PlayerList } from './components/PlayerList';
import { ChatBox } from './components/ChatBox';
import { HomeView } from './components/HomeView';
import { LobbyView } from './components/LobbyView';
import { WordPickerModal } from './components/WordPickerModal';
import { RoundEndOverlay } from './components/RoundEndOverlay';
import { GameOverModal } from './components/GameOverModal';
import { SettingsModal } from './components/SettingsModal';
import { AlertCircle, X } from 'lucide-react';

export const App: React.FC = () => {
  // Player state
  const [playerName, setPlayerName] = useState<string>(() => {
    return localStorage.getItem('skribbl_player_name') || 'Harsh';
  });

  const [avatarConfig, setAvatarConfig] = useState<AvatarConfig>(() => {
    const saved = localStorage.getItem('skribbl_avatar');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {
      color: '#ef4444',
      eyes: 0,
      mouth: 0,
      hat: 0,
    };
  });

  // Game & Room state
  const [roomId, setRoomId] = useState<string | null>(null);
  const [players, setPlayers] = useState<PlayerData[]>([]);
  const [phase, setPhase] = useState<GamePhase>('LOBBY');
  const [round, setRound] = useState<number>(1);
  const [totalRounds, setTotalRounds] = useState<number>(3);
  const [drawerId, setDrawerId] = useState<string | null>(null);
  const [word, setWord] = useState<string | null>(null);
  const [hintMask, setHintMask] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [wordOptions, setWordOptions] = useState<string[]>([]);
  const [strokes, setStrokes] = useState<StrokeData[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [roundResult, setRoundResult] = useState<RoundResult | null>(null);
  const [gameOverData, setGameOverData] = useState<{
    winner: PlayerData | null;
    leaderboard: PlayerData[];
  } | null>(null);

  const [settings, setSettings] = useState<RoomSettings>({
    maxPlayers: 8,
    rounds: 3,
    drawTime: 80,
    wordCount: 3,
    hintsCount: 2,
    wordMode: 'normal',
    customWords: [],
    isPrivate: false,
  });

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [mobileTab, setMobileTab] = useState<'chat' | 'players'>('chat');

  // Save profile
  useEffect(() => {
    localStorage.setItem('skribbl_player_name', playerName);
  }, [playerName]);

  useEffect(() => {
    localStorage.setItem('skribbl_avatar', JSON.stringify(avatarConfig));
  }, [avatarConfig]);

  // Read URL query params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam && !roomId) {
      socket.emit('join_room', {
        roomId: roomParam.toUpperCase(),
        playerName,
        avatar: avatarConfig,
      });
    }
  }, []);

  // Main Socket listeners
  useEffect(() => {
    const handleRoomCreated = (data: {
      roomId: string;
      player: PlayerData;
      players: PlayerData[];
      settings: RoomSettings;
    }) => {
      setRoomId(data.roomId);
      setPlayers(data.players);
      setSettings(data.settings);
      setPhase('LOBBY');
      setChatMessages([
        {
          id: 'owner_1',
          text: `${data.player.name} is now the room owner!`,
          type: 'system',
          timestamp: Date.now(),
        },
      ]);
      setStrokes([]);
      soundManager.playPop();

      const newUrl = `${window.location.pathname}?room=${data.roomId}`;
      window.history.pushState({ path: newUrl }, '', newUrl);
    };

    const handleJoinedSuccessfully = (data: any) => {
      setRoomId(data.roomId);
      setPlayers(data.players);
      setSettings(data.settings);
      setPhase(data.phase);
      setRound(data.round || 1);
      setTotalRounds(data.totalRounds || data.settings.rounds);
      setDrawerId(data.drawerId || null);
      setWord(data.word || null);
      setHintMask(data.hint || '');
      setTimeLeft(data.timeLeft || 0);
      setStrokes(data.strokes || []);
      setChatMessages(data.chatHistory || []);
      soundManager.playPop();

      const newUrl = `${window.location.pathname}?room=${data.roomId}`;
      window.history.pushState({ path: newUrl }, '', newUrl);
    };

    const handlePlayerJoined = (data: { player: PlayerData; players: PlayerData[] }) => {
      setPlayers(data.players);
    };

    const handlePlayerLeft = (data: { playerId: string; players: PlayerData[]; newHostId?: string }) => {
      setPlayers(data.players);
    };

    const handlePlayersUpdated = (data: { players: PlayerData[] }) => {
      setPlayers(data.players);
    };

    const handleSettingsUpdated = (newSettings: RoomSettings) => {
      setSettings(newSettings);
      setTotalRounds(newSettings.rounds);
    };

    const handleRoundStart = (data: {
      drawerId: string;
      drawerName: string;
      wordOptions: string[];
      drawTime: number;
      round: number;
      totalRounds: number;
    }) => {
      setPhase('CHOOSING_WORD');
      setDrawerId(data.drawerId);
      setWordOptions(data.wordOptions || []);
      setRound(data.round);
      setTotalRounds(data.totalRounds);
      setRoundResult(null);
      setGameOverData(null);
      setStrokes([]);
      setWord(null);
      setHintMask('');
      soundManager.playRoundStart();
    };

    const handleGameState = (data: {
      phase: GamePhase;
      round: number;
      drawerId: string;
      word?: string;
      hints?: string;
    }) => {
      setPhase(data.phase);
      setRound(data.round);
      setDrawerId(data.drawerId);
      if (data.word) setWord(data.word);
      if (data.hints) setHintMask(data.hints);
    };

    const handleTimeTick = (data: { timeLeft: number }) => {
      setTimeLeft(data.timeLeft);
    };

    const handleHintUpdate = (data: { hint: string }) => {
      setHintMask(data.hint);
    };

    const handleChatMessage = (msg: ChatMessage) => {
      setChatMessages(prev => [...prev, msg]);
      if (msg.type === 'correct') {
        soundManager.playCorrect();
      } else if (msg.type === 'close') {
        soundManager.playClose();
      }
    };

    const handleRoundEnd = (result: RoundResult) => {
      setPhase('ROUND_END');
      setRoundResult(result);
      setWord(result.word);
      soundManager.playRoundStart();
    };

    const handleGameOver = (data: { winner: PlayerData | null; leaderboard: PlayerData[] }) => {
      setPhase('GAME_OVER');
      setGameOverData(data);
      setRoundResult(null);
    };

    const handleGameResetLobby = (data: { message: string; players: PlayerData[] }) => {
      setPhase('LOBBY');
      setPlayers(data.players);
      setStrokes([]);
      setRoundResult(null);
      setGameOverData(null);
      setWord(null);
      setHintMask('');
      setErrorMessage(data.message);
    };

    const handleKicked = (data: { message: string }) => {
      alert(data.message);
      handleLeaveRoom();
    };

    const handleErrorMessage = (data: { message: string }) => {
      setErrorMessage(data.message);
      setTimeout(() => setErrorMessage(null), 4000);
    };

    socket.on('room_created', handleRoomCreated);
    socket.on('joined_successfully', handleJoinedSuccessfully);
    socket.on('player_joined', handlePlayerJoined);
    socket.on('player_left', handlePlayerLeft);
    socket.on('players_updated', handlePlayersUpdated);
    socket.on('settings_updated', handleSettingsUpdated);
    socket.on('round_start', handleRoundStart);
    socket.on('game_state', handleGameState);
    socket.on('time_tick', handleTimeTick);
    socket.on('hint_update', handleHintUpdate);
    socket.on('chat_message', handleChatMessage);
    socket.on('round_end', handleRoundEnd);
    socket.on('game_over', handleGameOver);
    socket.on('game_reset_lobby', handleGameResetLobby);
    socket.on('kicked', handleKicked);
    socket.on('error_message', handleErrorMessage);

    return () => {
      socket.off('room_created', handleRoomCreated);
      socket.off('joined_successfully', handleJoinedSuccessfully);
      socket.off('player_joined', handlePlayerJoined);
      socket.off('player_left', handlePlayerLeft);
      socket.off('players_updated', handlePlayersUpdated);
      socket.off('settings_updated', handleSettingsUpdated);
      socket.off('round_start', handleRoundStart);
      socket.off('game_state', handleGameState);
      socket.off('time_tick', handleTimeTick);
      socket.off('hint_update', handleHintUpdate);
      socket.off('chat_message', handleChatMessage);
      socket.off('round_end', handleRoundEnd);
      socket.off('game_over', handleGameOver);
      socket.off('game_reset_lobby', handleGameResetLobby);
      socket.off('kicked', handleKicked);
      socket.off('error_message', handleErrorMessage);
    };
  }, []);

  const handlePlayPublic = () => {
    soundManager.playPop();
    socket.emit('play_public', {
      playerName,
      avatar: avatarConfig,
    });
  };

  const handleCreatePrivateRoom = () => {
    soundManager.playPop();
    socket.emit('create_room', {
      hostName: playerName,
      avatar: avatarConfig,
      settings: { ...settings, isPrivate: true },
    });
  };

  const handleJoinRoom = (code: string) => {
    socket.emit('join_room', {
      roomId: code,
      playerName,
      avatar: avatarConfig,
    });
  };

  const handleUpdateSettings = (newSettings: Partial<RoomSettings>) => {
    socket.emit('update_settings', newSettings);
  };

  const handleStartGame = () => {
    soundManager.playPop();
    socket.emit('start_game');
  };

  const handleLeaveRoom = () => {
    soundManager.playPop();
    setRoomId(null);
    setPhase('LOBBY');
    setPlayers([]);
    setStrokes([]);
    setChatMessages([]);
    setRoundResult(null);
    setGameOverData(null);
    window.history.pushState({}, '', window.location.pathname);
    window.location.reload();
  };

  const currentUserId = socket.id || '';
  const currentPlayer = players.find(p => p.id === currentUserId);
  const isHost = currentPlayer?.isHost ?? false;
  const isDrawer = currentUserId === drawerId && phase === 'DRAWING';
  const hasGuessed = currentPlayer?.hasGuessed ?? false;
  const currentDrawer = players.find(p => p.id === drawerId);

  return (
    <div className="skribbl-app-container">
      {/* Toast Error Alert */}
      {errorMessage && (
        <div className="error-toast-banner animate-bounce-short">
          <AlertCircle size={18} className="text-rose-400" />
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-slate-400 hover:text-white ml-2"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Main Screen: Home or In-Room */}
      {!roomId ? (
        <HomeView
          playerName={playerName}
          avatarConfig={avatarConfig}
          onPlayerNameChange={setPlayerName}
          onAvatarConfigChange={setAvatarConfig}
          onPlayPublic={handlePlayPublic}
          onCreatePrivateRoom={handleCreatePrivateRoom}
          onJoinRoom={handleJoinRoom}
        />
      ) : (
        <div className="skribbl-ingame-wrapper">
          {/* Authentic White Header Bar (Screenshot 2 & 3) */}
          <HeaderBar
            roomId={roomId}
            phase={phase}
            round={round}
            totalRounds={totalRounds}
            timeLeft={timeLeft}
            isDrawer={isDrawer}
            word={word}
            hintMask={hintMask}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onLeaveRoom={handleLeaveRoom}
          />

          {/* Mobile Switcher Bar (Visible only on screens <= 850px) */}
          <div className="skribbl-mobile-nav-tabs">
            <button
              type="button"
              className={`mobile-tab-btn ${mobileTab === 'chat' ? 'active' : ''}`}
              onClick={() => setMobileTab('chat')}
            >
              💬 Chat & Guesses
            </button>
            <button
              type="button"
              className={`mobile-tab-btn ${mobileTab === 'players' ? 'active' : ''}`}
              onClick={() => setMobileTab('players')}
            >
              👥 Players ({players.length})
            </button>
          </div>

          {/* 3-Column Layout matching Screenshots 2 & 3, adapts on mobile */}
          <div className="skribbl-unified-layout-grid">
            {/* Left Column: Player Cards */}
            <div className={`skribbl-col-left ${mobileTab === 'players' ? 'mobile-visible' : 'mobile-hidden'}`}>
              <PlayerList
                players={players}
                currentUserId={currentUserId}
                isHost={isHost}
                drawerId={drawerId}
                phase={phase}
              />
            </div>

            {/* Center Column: Either Lobby Settings Form or Active Canvas Board */}
            <div className="skribbl-col-center">
              {phase === 'LOBBY' ? (
                <LobbyView
                  roomId={roomId}
                  players={players}
                  currentUserId={currentUserId}
                  isHost={isHost}
                  settings={settings}
                  onUpdateSettings={handleUpdateSettings}
                  onStartGame={handleStartGame}
                />
              ) : (
                <CanvasBoard
                  isDrawer={isDrawer}
                  drawerName={currentDrawer?.name}
                  strokes={strokes}
                  onStrokesChange={setStrokes}
                />
              )}
            </div>

            {/* Right Column: Chat Box */}
            <div className={`skribbl-col-right ${mobileTab === 'chat' ? 'mobile-visible' : 'mobile-hidden'}`}>
              <ChatBox
                messages={chatMessages}
                isDrawer={isDrawer}
                hasGuessed={hasGuessed}
                phase={phase}
              />
            </div>
          </div>

          {/* Word Picker Modal (Drawer only during CHOOSING_WORD) */}
          {phase === 'CHOOSING_WORD' && currentUserId === drawerId && wordOptions.length > 0 && (
            <WordPickerModal
              words={wordOptions}
              timeLeft={timeLeft}
            />
          )}

          {/* Round End Overlay */}
          {phase === 'ROUND_END' && roundResult && (
            <RoundEndOverlay
              roundResult={roundResult}
              players={players}
            />
          )}

          {/* Game Over Modal */}
          {phase === 'GAME_OVER' && gameOverData && (
            <GameOverModal
              winner={gameOverData.winner}
              leaderboard={gameOverData.leaderboard}
              isHost={isHost}
              onRestart={handleStartGame}
              onLeave={handleLeaveRoom}
            />
          )}

          {/* Settings Modal (Screenshot 4) */}
          <SettingsModal
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
          />
        </div>
      )}
    </div>
  );
};
