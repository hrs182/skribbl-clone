import React from 'react';
import { Sparkles, Clock } from 'lucide-react';
import { socket } from '../services/socket';
import { soundManager } from '../services/sound';

interface WordPickerModalProps {
  words: string[];
  timeLeft: number;
}

export const WordPickerModal: React.FC<WordPickerModalProps> = ({ words, timeLeft }) => {
  const handleSelect = (word: string) => {
    soundManager.playPop();
    socket.emit('word_chosen', { word });
  };

  return (
    <div className="modal-backdrop animate-fade-in">
      <div className="word-picker-card animate-scale-in">
        <div className="word-picker-header">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Sparkles className="text-amber-400" size={24} />
            <h2 className="text-2xl font-black tracking-tight text-white">Choose Your Word</h2>
          </div>
          <p className="text-sm text-slate-400">Pick one word to draw for this round</p>

          <div className="word-timer-badge">
            <Clock size={16} className="text-indigo-400" />
            <span>Auto-picking in {timeLeft}s</span>
          </div>
        </div>

        <div className="word-options-grid">
          {words.map((word) => (
            <button
              key={word}
              type="button"
              onClick={() => handleSelect(word)}
              className="word-choice-btn"
            >
              <span className="word-text">{word}</span>
              <span className="word-meta">{word.length} letters</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
