import React, { useEffect } from 'react';
import { PlayerData } from '../types';
import { Avatar } from './Avatar';
import confetti from 'canvas-confetti';
import { soundManager } from '../services/sound';
import { Trophy, Medal, RotateCcw, Home } from 'lucide-react';

interface GameOverModalProps {
  winner: PlayerData | null;
  leaderboard: PlayerData[];
  isHost: boolean;
  onRestart: () => void;
  onLeave: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  winner,
  leaderboard,
  isHost,
  onRestart,
  onLeave,
}) => {
  useEffect(() => {
    soundManager.playGameOver();

    // Trigger confetti celebration
    const end = Date.now() + 3000;
    const colors = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#3b82f6'];

    (function frame() {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors,
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();
  }, []);

  const firstPlace = leaderboard[0];
  const secondPlace = leaderboard[1];
  const thirdPlace = leaderboard[2];

  return (
    <div className="modal-backdrop animate-fade-in">
      <div className="game-over-card animate-scale-in">
        <div className="game-over-header">
          <Trophy size={48} className="text-amber-400 mx-auto mb-2 animate-bounce-short" />
          <h1 className="text-3xl font-black text-white tracking-tight">Game Finished!</h1>
          <p className="text-sm text-slate-400">
            {winner ? `${winner.name} won the championship!` : 'Great game everyone!'}
          </p>
        </div>

        {/* Podium */}
        <div className="podium-container">
          {/* 2nd Place */}
          {secondPlace && (
            <div className="podium-spot spot-2">
              <Avatar config={secondPlace.avatar} size={50} />
              <div className="podium-name">{secondPlace.name}</div>
              <div className="podium-score">{secondPlace.score} pts</div>
              <div className="podium-step step-2">
                <Medal size={20} className="text-slate-300" />
                <span>2nd</span>
              </div>
            </div>
          )}

          {/* 1st Place */}
          {firstPlace && (
            <div className="podium-spot spot-1">
              <div className="crown-holder">
                <Trophy size={28} className="text-amber-300 animate-pulse" />
              </div>
              <Avatar config={firstPlace.avatar} size={64} />
              <div className="podium-name font-bold text-amber-300">{firstPlace.name}</div>
              <div className="podium-score text-amber-200">{firstPlace.score} pts</div>
              <div className="podium-step step-1">
                <span>1st</span>
              </div>
            </div>
          )}

          {/* 3rd Place */}
          {thirdPlace && (
            <div className="podium-spot spot-3">
              <Avatar config={thirdPlace.avatar} size={46} />
              <div className="podium-name">{thirdPlace.name}</div>
              <div className="podium-score">{thirdPlace.score} pts</div>
              <div className="podium-step step-3">
                <Medal size={18} className="text-amber-700" />
                <span>3rd</span>
              </div>
            </div>
          )}
        </div>

        {/* Full Leaderboard Table */}
        <div className="leaderboard-table">
          <div className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-2">
            Final Standings
          </div>
          <div className="standings-scroll">
            {leaderboard.map((p, idx) => (
              <div key={p.id} className="standing-row">
                <span className="standing-rank">#{idx + 1}</span>
                <Avatar config={p.avatar} size={28} />
                <span className="standing-name truncate">{p.name}</span>
                <span className="standing-score font-mono">{p.score} pts</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="game-over-actions">
          {isHost ? (
            <button
              type="button"
              onClick={onRestart}
              className="btn-primary flex items-center justify-center gap-2 w-full py-3"
            >
              <RotateCcw size={18} />
              <span>Play Again</span>
            </button>
          ) : (
            <div className="text-center text-xs text-slate-400 py-2">
              Waiting for host to start another game...
            </div>
          )}

          <button
            type="button"
            onClick={onLeave}
            className="btn-secondary flex items-center justify-center gap-2 w-full py-2.5"
          >
            <Home size={18} />
            <span>Return to Lobby / Main Menu</span>
          </button>
        </div>
      </div>
    </div>
  );
};
