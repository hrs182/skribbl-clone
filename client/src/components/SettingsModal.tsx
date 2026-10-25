import React, { useState, useEffect, useRef } from 'react';
import { Volume2, X } from 'lucide-react';
import { soundManager } from '../services/sound';
import { HotkeyConfig, DEFAULT_HOTKEYS, getHotkeys, saveHotkeys } from '../services/hotkeys';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [volume, setVolume] = useState<number>(() => soundManager.getVolume());
  const [hotkeys, setHotkeys] = useState<HotkeyConfig>(getHotkeys);

  // Miscellaneous settings
  const [mobileKeyboard, setMobileKeyboard] = useState<string>(() => {
    return localStorage.getItem('skribbl_mobile_keyboard') || 'Disabled';
  });
  const [mobileChatInput, setMobileChatInput] = useState<string>(() => {
    return localStorage.getItem('skribbl_mobile_chat_input') || 'Bottom';
  });
  const [mobileChatBubbles, setMobileChatBubbles] = useState<string>(() => {
    return localStorage.getItem('skribbl_mobile_chat_bubbles') || 'Enabled';
  });

  const previewTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      setVolume(soundManager.getVolume());
      setHotkeys(getHotkeys());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleVolumeChange = (newVal: number) => {
    setVolume(newVal);
    soundManager.setVolume(newVal);

    // Play a preview sound throttled so user hears the loudness
    if (previewTimerRef.current) {
      window.clearTimeout(previewTimerRef.current);
    }
    previewTimerRef.current = window.setTimeout(() => {
      soundManager.playPop();
    }, 80);
  };

  const handleHotkeyKeyDown = (action: keyof HotkeyConfig) => (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Tab') return;
    e.preventDefault();
    if (e.key === 'Escape') {
      (e.target as HTMLInputElement).blur();
      return;
    }
    let keyName = e.key.toUpperCase();
    if (keyName === ' ') keyName = 'SPACE';
    if (keyName.length > 5) keyName = keyName.slice(0, 5);

    const updated = { ...hotkeys, [action]: keyName };
    setHotkeys(updated);
    saveHotkeys(updated);
    soundManager.playPop();
    (e.target as HTMLInputElement).blur();
  };

  const handleResetHotkeys = () => {
    soundManager.playPop();
    setHotkeys(DEFAULT_HOTKEYS);
    saveHotkeys(DEFAULT_HOTKEYS);
  };

  const handleMobileKeyboardChange = (val: string) => {
    setMobileKeyboard(val);
    localStorage.setItem('skribbl_mobile_keyboard', val);
  };

  const handleMobileChatInputChange = (val: string) => {
    setMobileChatInput(val);
    localStorage.setItem('skribbl_mobile_chat_input', val);
  };

  const handleMobileChatBubblesChange = (val: string) => {
    setMobileChatBubbles(val);
    localStorage.setItem('skribbl_mobile_chat_bubbles', val);
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

        {/* Hotkeys Section matching Screenshot */}
        <div className="settings-hotkeys-section">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 font-bold text-white text-sm">
              <span>⌨️ Hotkeys</span>
            </div>
            <button
              type="button"
              onClick={handleResetHotkeys}
              className="hotkeys-reset-btn"
              title="Reset to default hotkeys (B, F, U, C, S)"
            >
              Reset
            </button>
          </div>

          <div className="hotkeys-grid">
            <div className="hotkey-item">
              <span className="hotkey-label">Brush</span>
              <input
                type="text"
                value={hotkeys.brush}
                readOnly
                onKeyDown={handleHotkeyKeyDown('brush')}
                onClick={e => (e.target as HTMLInputElement).select()}
                className="hotkey-input cursor-pointer focus:ring-2 focus:ring-yellow-300"
                title="Click and press a key to rebind"
              />
            </div>

            <div className="hotkey-item">
              <span className="hotkey-label">Fill</span>
              <input
                type="text"
                value={hotkeys.fill}
                readOnly
                onKeyDown={handleHotkeyKeyDown('fill')}
                onClick={e => (e.target as HTMLInputElement).select()}
                className="hotkey-input cursor-pointer focus:ring-2 focus:ring-yellow-300"
                title="Click and press a key to rebind"
              />
            </div>

            <div className="hotkey-item">
              <span className="hotkey-label">Undo</span>
              <input
                type="text"
                value={hotkeys.undo}
                readOnly
                onKeyDown={handleHotkeyKeyDown('undo')}
                onClick={e => (e.target as HTMLInputElement).select()}
                className="hotkey-input cursor-pointer focus:ring-2 focus:ring-yellow-300"
                title="Click and press a key to rebind"
              />
            </div>

            <div className="hotkey-item">
              <span className="hotkey-label">Clear</span>
              <input
                type="text"
                value={hotkeys.clear}
                readOnly
                onKeyDown={handleHotkeyKeyDown('clear')}
                onClick={e => (e.target as HTMLInputElement).select()}
                className="hotkey-input cursor-pointer focus:ring-2 focus:ring-yellow-300"
                title="Click and press a key to rebind"
              />
            </div>

            <div className="hotkey-item">
              <span className="hotkey-label">Swap</span>
              <input
                type="text"
                value={hotkeys.swap}
                readOnly
                onKeyDown={handleHotkeyKeyDown('swap')}
                onClick={e => (e.target as HTMLInputElement).select()}
                className="hotkey-input cursor-pointer focus:ring-2 focus:ring-yellow-300"
                title="Click and press a key to rebind"
              />
            </div>
          </div>
        </div>

        {/* Miscellaneous Section */}
        <div className="settings-misc-section">
          <div className="font-bold text-white text-sm mb-2">
            <span>❓ Miscellaneous</span>
          </div>

          <div className="misc-item">
            <span className="misc-label">Mobile Keyboard (Experimental)</span>
            <select
              value={mobileKeyboard}
              onChange={e => handleMobileKeyboardChange(e.target.value)}
              className="skribbl-select-white"
            >
              <option value="Disabled">Disabled</option>
              <option value="Enabled">Enabled</option>
            </select>
          </div>

          <div className="misc-item">
            <span className="misc-label">Mobile Chat Input Layout</span>
            <select
              value={mobileChatInput}
              onChange={e => handleMobileChatInputChange(e.target.value)}
              className="skribbl-select-white"
            >
              <option value="Bottom">Bottom</option>
              <option value="Top">Top</option>
            </select>
          </div>

          <div className="misc-item">
            <span className="misc-label">Mobile Chat Bubbles</span>
            <select
              value={mobileChatBubbles}
              onChange={e => handleMobileChatBubblesChange(e.target.value)}
              className="skribbl-select-white"
            >
              <option value="Enabled">Enabled</option>
              <option value="Disabled">Disabled</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

