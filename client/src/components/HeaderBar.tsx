import React from 'react';
import { GamePhase } from '../types';
import { Settings, LogOut } from 'lucide-react';
import { soundManager } from '../services/sound';

interface HeaderBarProps {
  roomId: string;
  phase: GamePhase;
  round: number;
  totalRounds: number;
  timeLeft: number;
  isDrawer: boolean;
  word?: string | null;
  hintMask?: string;
  onOpenSettings: () => void;
  onLeaveRoom: () => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  phase,
  round,
  totalRounds,
  timeLeft,
  isDrawer,
  word,
  hintMask,
  onOpenSettings,
  onLeaveRoom,
}) => {
  const getCenterContent = () => {
    if (phase === 'LOBBY') {
      return (
        <div className="skribbl-header-waiting">
          WAITING
        </div>
      );
    }

    if (phase === 'CHOOSING_WORD') {
      return (
        <div className="skribbl-header-choosing">
          {isDrawer ? 'CHOOSE A WORD' : 'DRAWER IS CHOOSING A WORD...'}
        </div>
      );
    }

    if (phase === 'DRAWING') {
      if (isDrawer && word) {
        return (
          <div className="skribbl-header-drawing">
            <span className="skribbl-draw-label">DRAW THIS</span>
            <span className="skribbl-draw-word">{word.toUpperCase()}</span>
          </div>
        );
      }

      // Guesser view matching Screenshot 3: "GUESS THIS \n 4 \n _ _ _ _"
      const cleanHint = hintMask || '_ _ _ _';
      const letterCount = cleanHint.replace(/[\s-]/g, '').length;

      return (
        <div className="skribbl-header-guess">
          <div className="skribbl-guess-top">
            <span className="guess-title">GUESS THIS</span>
            <span className="guess-len">{letterCount}</span>
          </div>
          <div className="skribbl-guess-blanks">
            {cleanHint}
          </div>
        </div>
      );
    }

    if (phase === 'ROUND_END') {
      return <div className="skribbl-header-waiting">ROUND OVER</div>;
    }

    return <div className="skribbl-header-waiting">GAME OVER</div>;
  };

  return (
    <header className="skribbl-navbar-white">
      {/* Left: Alarm Clock & Round Indicator (Screenshot 2 & 3) */}
      <div className="navbar-left-group">
        <div className="skribbl-alarm-clock">
          <svg viewBox="0 0 40 40" width="34" height="34" className="alarm-clock-svg">
            {/* Clock bells */}
            <circle cx="8" cy="8" r="6" fill="#475569" stroke="#000000" strokeWidth="2.5" />
            <circle cx="32" cy="8" r="6" fill="#475569" stroke="#000000" strokeWidth="2.5" />
            {/* Feet */}
            <line x1="12" y1="34" x2="6" y2="39" stroke="#000000" strokeWidth="3" strokeLinecap="round" />
            <line x1="28" y1="34" x2="34" y2="39" stroke="#000000" strokeWidth="3" strokeLinecap="round" />
            {/* Body */}
            <circle cx="20" cy="22" r="16" fill="#f8fafc" stroke="#000000" strokeWidth="3" />
          </svg>
          <span className="clock-time-number">{phase === 'LOBBY' ? 0 : timeLeft}</span>
        </div>

        <div className="skribbl-round-text font-bold">
          Round {round} of {totalRounds}
        </div>
      </div>

      {/* Center: WAITING or GUESS THIS (Screenshot 2 & 3) */}
      <div className="navbar-center-group">
        {getCenterContent()}
      </div>

      {/* Right: Gear Icon (Screenshot 2 & 3) & Exit */}
      <div className="navbar-right-group">
        <button
          type="button"
          onClick={() => {
            soundManager.playPop();
            onOpenSettings();
          }}
          className="skribbl-gear-btn"
          title="Game Settings"
        >
          <Settings size={28} className="text-black" />
        </button>

        <button
          type="button"
          onClick={onLeaveRoom}
          className="skribbl-exit-btn"
          title="Leave Room"
        >
          <LogOut size={20} />
        </button>
      </div>
    </header>
  );
};
