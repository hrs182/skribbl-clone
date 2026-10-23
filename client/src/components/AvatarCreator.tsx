import React from 'react';
import { Avatar, AVATAR_COLORS, TOTAL_EYES, TOTAL_MOUTHS, TOTAL_HATS } from './Avatar';
import { AvatarConfig } from '../types';
import { Shuffle, ChevronLeft, ChevronRight } from 'lucide-react';
import { soundManager } from '../services/sound';

interface AvatarCreatorProps {
  config: AvatarConfig;
  onChange: (config: AvatarConfig) => void;
}

export const AvatarCreator: React.FC<AvatarCreatorProps> = ({ config, onChange }) => {
  const cycleColor = (direction: number) => {
    soundManager.playPop();
    const currIdx = AVATAR_COLORS.indexOf(config.color);
    const nextIdx = (currIdx + direction + AVATAR_COLORS.length) % AVATAR_COLORS.length;
    onChange({ ...config, color: AVATAR_COLORS[nextIdx] });
  };

  const cycleEyes = (direction: number) => {
    soundManager.playPop();
    const next = (config.eyes + direction + TOTAL_EYES) % TOTAL_EYES;
    onChange({ ...config, eyes: next });
  };

  const cycleMouth = (direction: number) => {
    soundManager.playPop();
    const next = (config.mouth + direction + TOTAL_MOUTHS) % TOTAL_MOUTHS;
    onChange({ ...config, mouth: next });
  };

  const cycleHat = (direction: number) => {
    soundManager.playPop();
    const next = ((config.hat ?? 0) + direction + TOTAL_HATS) % TOTAL_HATS;
    onChange({ ...config, hat: next });
  };

  const randomize = () => {
    soundManager.playPop();
    const randomColor = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
    const randomEyes = Math.floor(Math.random() * TOTAL_EYES);
    const randomMouth = Math.floor(Math.random() * TOTAL_MOUTHS);
    const randomHat = Math.floor(Math.random() * TOTAL_HATS);
    onChange({
      color: randomColor,
      eyes: randomEyes,
      mouth: randomMouth,
      hat: randomHat,
    });
  };

  return (
    <div className="avatar-creator-card">
      {/* Avatar Preview */}
      <div className="avatar-preview-box">
        <Avatar config={config} size={110} />
        <button
          type="button"
          onClick={randomize}
          className="randomize-btn"
          title="Randomize avatar"
        >
          <Shuffle size={16} />
          <span>Random</span>
        </button>
      </div>

      {/* Selectors */}
      <div className="avatar-controls-grid">
        {/* Color Palette */}
        <div className="color-palette-row">
          {AVATAR_COLORS.map(c => (
            <button
              key={c}
              type="button"
              className={`color-dot ${config.color === c ? 'active' : ''}`}
              style={{ backgroundColor: c }}
              onClick={() => {
                soundManager.playPop();
                onChange({ ...config, color: c });
              }}
            />
          ))}
        </div>

        {/* Feature Cyclers */}
        <div className="cycler-row">
          <span className="cycler-label">Eyes</span>
          <div className="cycler-btn-group">
            <button type="button" onClick={() => cycleEyes(-1)} className="cycler-arrow">
              <ChevronLeft size={16} />
            </button>
            <span className="cycler-val">{config.eyes + 1}/{TOTAL_EYES}</span>
            <button type="button" onClick={() => cycleEyes(1)} className="cycler-arrow">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        <div className="cycler-row">
          <span className="cycler-label">Mouth</span>
          <div className="cycler-btn-group">
            <button type="button" onClick={() => cycleMouth(-1)} className="cycler-arrow">
              <ChevronLeft size={16} />
            </button>
            <span className="cycler-val">{config.mouth + 1}/{TOTAL_MOUTHS}</span>
            <button type="button" onClick={() => cycleMouth(1)} className="cycler-arrow">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        <div className="cycler-row">
          <span className="cycler-label">Hat</span>
          <div className="cycler-btn-group">
            <button type="button" onClick={() => cycleHat(-1)} className="cycler-arrow">
              <ChevronLeft size={16} />
            </button>
            <span className="cycler-val">{(config.hat ?? 0) === 0 ? 'None' : `${config.hat}/${TOTAL_HATS - 1}`}</span>
            <button type="button" onClick={() => cycleHat(1)} className="cycler-arrow">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
