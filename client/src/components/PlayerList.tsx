import React from 'react';
import { PlayerData } from '../types';
import { Avatar } from './Avatar';
import { Pencil, UserX } from 'lucide-react';
import { socket } from '../services/socket';
import { soundManager } from '../services/sound';

interface PlayerListProps {
  players: PlayerData[];
  currentUserId: string;
  isHost: boolean;
  drawerId?: string | null;
  phase: string;
}

export const PlayerList: React.FC<PlayerListProps> = ({
  players,
  currentUserId,
  isHost,
  drawerId,
  phase,
}) => {
  // Sort players by total score descending
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  const handleKick = (playerId: string, playerName: string) => {
    if (confirm(`Kick ${playerName}?`)) {
      soundManager.playPop();
      socket.emit('kick_player', { playerId });
    }
  };

  return (
    <div className="skribbl-playerlist-sidebar">
      {sortedPlayers.map((player, index) => {
        const isCurrent = player.id === currentUserId;
        const isDrawingNow = player.id === drawerId && phase === 'DRAWING';
        const hasGuessedWord = player.hasGuessed && phase === 'DRAWING';

        return (
          <div
            key={player.id}
            className={`skribbl-ingame-player-row ${hasGuessedWord ? 'guessed-row' : ''} ${isCurrent ? 'self-row' : ''}`}
          >
            {/* Rank */}
            <div className="ingame-rank-col">
              <span className="ingame-rank-text">#{index + 1}</span>
              {player.isHost && <span className="text-xs">👑</span>}
            </div>

            {/* Middle: Name & Points */}
            <div className="ingame-info-col">
              <div className="ingame-name-text truncate">
                {player.name}
                {isCurrent && ' (You)'}
              </div>
              <div className="ingame-points-text">
                {player.score} points
              </div>
            </div>

            {/* Drawing indicator or avatar */}
            <div className="ingame-avatar-col">
              {isDrawingNow && (
                <span className="ingame-pencil-icon" title="Drawing!">
                  ✏️
                </span>
              )}
              <Avatar
                config={{ ...player.avatar, hat: player.isHost ? 1 : 0 }}
                size={44}
              />
            </div>

            {/* Host Kick Button */}
            {isHost && !isCurrent && (
              <button
                type="button"
                onClick={() => handleKick(player.id, player.name)}
                className="ingame-kick-btn"
                title={`Kick ${player.name}`}
              >
                <UserX size={13} />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};
