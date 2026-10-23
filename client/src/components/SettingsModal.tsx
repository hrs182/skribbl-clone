import React, { useState } from 'react';
import { Volume2, X, RotateCcw } from 'lucide-react';
import { soundManager } from '../services/sound';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [volume, setVolume] = useState<number>(75);
  const [brushKey, setBrushKey] = useState('B');
  const [fillKey, setFillKey] = useState('F');
  const [undoKey, setUndoKey] = useState('U');
  const [clearKey, setClearKey] = useState('C');
  const [swapKey, setSwapKey] = useState('S');

  if (!isOpen) return null;

  const handleVolumeChange = (newVal: number) => {
    setVolume(newVal);
    soundManager.isMuted = newVal === 0;
  };

  const handleResetHotkeys = () => {
    soundManager.playPop();
    setBrushKey('B');
    setFillKey('F');
    setUndoKey('U');
    setClearKey('C');
    setSwapKey('S');
  };

  return (
    <div className="modal-backdrop animate-fade-in" onClick={onClose}>
      <div className="skribbl-settings-modal animate-scale-in" onClick={e => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="settings-modal-header">
          <h2 className="settings-modal-title">Settings</h2>
          <button type="button" onClick={onClose} className="settings-modal-close">
            <X size={20} />
          </button>
        </div>

        {/* Volume Slider */}
        <div className="settings-volume-section">
          <div className="flex items-center gap-2 mb-2 font-bold text-white text-sm">
            <Volume2 size={18} />
            <span>Volume {volume}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={volume}
            onChange={e => handleVolumeChange(Number(e.target.value))}
            className="skribbl-slider-blue"
          />
        </div>

        {/* Hotkeys Section matching Screenshot 4 */}
        <div className="settings-hotkeys-section">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 font-bold text-white text-sm">
              <span>⌨️ Hotkeys</span>
            </div>
            <button
              type="button"
              onClick={handleResetHotkeys}
              className="hotkeys-reset-btn"
            >
              Reset
            </button>
          </div>

          <div className="hotkeys-grid">
            <div className="hotkey-item">
              <span className="hotkey-label">Brush</span>
              <input
                type="text"
                value={brushKey}
                maxLength={4}
                onChange={e => setBrushKey(e.target.value.toUpperCase())}
                className="hotkey-input"
              />
            </div>

            <div className="hotkey-item">
              <span className="hotkey-label">Fill</span>
              <input
                type="text"
                value={fillKey}
                maxLength={4}
                onChange={e => setFillKey(e.target.value.toUpperCase())}
                className="hotkey-input"
              />
            </div>

            <div className="hotkey-item">
              <span className="hotkey-label">Undo</span>
              <input
                type="text"
                value={undoKey}
                maxLength={4}
                onChange={e => setUndoKey(e.target.value.toUpperCase())}
                className="hotkey-input"
              />
            </div>

            <div className="hotkey-item">
              <span className="hotkey-label">Clear</span>
              <input
                type="text"
                value={clearKey}
                maxLength={4}
                onChange={e => setClearKey(e.target.value.toUpperCase())}
                className="hotkey-input"
              />
            </div>

            <div className="hotkey-item">
              <span className="hotkey-label">Swap</span>
              <input
                type="text"
                value={swapKey}
                maxLength={4}
                onChange={e => setSwapKey(e.target.value.toUpperCase())}
                className="hotkey-input"
              />
            </div>
          </div>
        </div>

        {/* Miscellaneous Section matching Screenshot 4 */}
        <div className="settings-misc-section">
          <div className="font-bold text-white text-sm mb-2">
            <span>❓ Miscellaneous</span>
          </div>

          <div className="misc-item">
            <span className="misc-label">Mobile Keyboard (Experimental)</span>
            <select className="skribbl-select-white">
              <option>Disabled</option>
              <option>Enabled</option>
            </select>
          </div>

          <div className="misc-item">
            <span className="misc-label">Mobile Chat Input Layout</span>
            <select className="skribbl-select-white">
              <option>Bottom</option>
              <option>Top</option>
            </select>
          </div>

          <div className="misc-item">
            <span className="misc-label">Mobile Chat Bubbles</span>
            <select className="skribbl-select-white">
              <option>Enabled</option>
              <option>Disabled</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
