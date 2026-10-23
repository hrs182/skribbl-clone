import React from 'react';
import { RoundResult, PlayerData } from '../types';
import { Avatar } from './Avatar';
import { Award, ArrowRight, CheckCircle2 } from 'lucide-react';

interface RoundEndOverlayProps {
  roundResult: RoundResult;
  players: PlayerData[];
}

export const RoundEndOverlay: React.FC<RoundEndOverlayProps> = ({
  roundResult,
  players,
}) => {
  const { word, reason, scores, nextDrawer } = roundResult;

  const getReasonLabel = () => {
    switch (reason) {
      case 'guessed':
        return 'Everyone guessed the word!';
      case 'drawer_left':
        return 'The drawer disconnected!';
      case 'timeout':
      default:
        return 'Time is up!';
    }
  };

  return (
    <div className="modal-backdrop animate-fade-in">
      <div className="round-end-card animate-scale-in">
        <div className="round-end-header">
          <div className="text-xs uppercase tracking-widest font-bold text-indigo-400 mb-1">
            {getReasonLabel()}
          </div>
          <div className="text-slate-400 text-sm">The secret word was:</div>
          <h2 className="revealed-word-title animate-bounce-short">
            {word}
          </h2>
        </div>

        {/* Round Score Breakdown */}
        <div className="round-scoreboard">
          <div className="flex items-center gap-1.5 mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <Award size={14} className="text-amber-400" />
            <span>Round Score Gain</span>
          </div>

          <div className="round-players-list">
            {players.map(p => {
              const scoreData = scores[p.id];
              const roundGain = scoreData ? scoreData.roundScore : 0;

              return (
                <div key={p.id} className="round-player-row">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <Avatar config={p.avatar} size={32} />
                    <span className="font-semibold text-sm truncate">{p.name}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {roundGain > 0 ? (
                      <span className="round-score-plus flex items-center gap-1">
                        <CheckCircle2 size={13} />
                        +{roundGain} pts
                      </span>
                    ) : (
                      <span className="round-score-zero">0 pts</span>
                    )}
                    <span className="total-score-badge font-mono text-xs">
                      {p.score} total
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Next Drawer notice */}
        {nextDrawer && (
          <div className="next-drawer-notice">
            <ArrowRight size={16} className="text-indigo-400" />
            <span>Next drawer will be <strong>{nextDrawer.name}</strong></span>
          </div>
        )}
      </div>
    </div>
  );
};
