import React, { useState } from 'react';
import { PlayerData, RoomSettings } from '../types';
import { Avatar } from './Avatar';
import { soundManager } from '../services/sound';
import {
  Users,
  Clock,
  RotateCcw,
  Gamepad2,
  FileText,
  HelpCircle,
  Globe,
  Share2,
  Check,
  Play,
  Crown,
} from 'lucide-react';

interface LobbyViewProps {
  roomId: string;
  players: PlayerData[];
  currentUserId: string;
  isHost: boolean;
  settings: RoomSettings;
  onUpdateSettings: (settings: Partial<RoomSettings>) => void;
  onStartGame: () => void;
}

export const LobbyView: React.FC<LobbyViewProps> = ({
  roomId,
  players,
  currentUserId,
  isHost,
  settings,
  onUpdateSettings,
  onStartGame,
}) => {
  const [copied, setCopied] = useState(false);
  const [customWordsInput, setCustomWordsInput] = useState(settings.customWords?.join(', ') || '');
  const [customOnly, setCustomOnly] = useState(false);

  const copyInviteLink = () => {
    soundManager.playPop();
    const url = `${window.location.origin}${window.location.pathname}?room=${roomId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCustomWordsBlur = () => {
    const words = customWordsInput
      .split(',')
      .map(w => w.trim())
      .filter(w => w.length > 0);
    onUpdateSettings({ customWords: words });
  };

  return (
    <div className="skribbl-lobby-layout">
      {/* Center Column: Either Public Matchmaking info or Private Host Settings */}
      <div className="skribbl-settings-column">
          {!settings.isPrivate ? (
            /* Public Matchmaking Room Lobby View */
            <div className="skribbl-public-lobby-card">
              <div className="public-lobby-badge">
                <Globe size={18} />
                <span>Public Matchmaking Room</span>
              </div>

              <div className="public-match-status-box">
                {players.length < 2 ? (
                  <div className="status-waiting-pulse">
                    <div className="status-spinner-dot" />
                    <div>
                      <h3 className="text-lg font-bold text-white">Waiting for players to join...</h3>
                      <p className="text-sm text-slate-300 mt-1">
                        Room capacity: <span className="text-emerald-400 font-bold">{players.length} / {settings.maxPlayers}</span> players.
                      </p>
                      <p className="text-xs text-amber-300 mt-2 bg-amber-950/60 p-2 rounded border border-amber-600/40">
                        💡 Match starts automatically when a 2nd player joins! You can open another tab to test.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="status-ready-box">
                    <Check size={24} className="text-emerald-400" />
                    <div>
                      <h3 className="text-lg font-bold text-emerald-300">Ready to play! ({players.length} players)</h3>
                      <p className="text-xs text-slate-300 mt-1">
                        Game starts automatically in 3 seconds, or the host can click Start now.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="public-rules-summary">
                <div className="rule-chip">
                  <RotateCcw size={14} />
                  <span>{settings.rounds} Rounds</span>
                </div>
                <div className="rule-chip">
                  <Clock size={14} />
                  <span>{settings.drawTime}s Draw Time</span>
                </div>
                <div className="rule-chip">
                  <FileText size={14} />
                  <span>3 Word Choices</span>
                </div>
                <div className="rule-chip">
                  <HelpCircle size={14} />
                  <span>Hints Enabled</span>
                </div>
              </div>

              {/* Lobby Footer Actions for Public Room */}
              <div className="skribbl-lobby-actions mt-4">
                <button
                  type="button"
                  onClick={copyInviteLink}
                  className="skribbl-invite-link-btn"
                >
                  {copied ? <Check size={16} className="text-emerald-300" /> : <Share2 size={16} />}
                  <span>{copied ? 'Room Link Copied!' : `Share Room Link (${roomId})`}</span>
                </button>

                {isHost && (
                  <button
                    type="button"
                    onClick={() => {
                      soundManager.playPop();
                      onStartGame();
                    }}
                    disabled={players.length < 2}
                    className="skribbl-start-green-btn"
                  >
                    <Play size={18} fill="currentColor" />
                    <span>Start Game Now! ({players.length}/2 min)</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Private Room Host Settings Form (Screenshot 2) */
            <>
              <div className="skribbl-settings-table">
                {/* Players count */}
                <div className="settings-row">
                  <div className="settings-label">
                    <Users size={16} />
                    <span>Players</span>
                  </div>
                  <select
                    value={settings.maxPlayers}
                    disabled={!isHost}
                    onChange={e => onUpdateSettings({ maxPlayers: Number(e.target.value) })}
                    className="skribbl-select"
                  >
                    {[2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 16, 20].map(n => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>

                {/* Language */}
                <div className="settings-row">
                  <div className="settings-label">
                    <Globe size={16} />
                    <span>Language</span>
                  </div>
                  <select disabled={!isHost} className="skribbl-select">
                    <option value="English">English</option>
                    <option value="Spanish">Español</option>
                    <option value="German">Deutsch</option>
                    <option value="French">Français</option>
                  </select>
                </div>

                {/* Drawtime */}
                <div className="settings-row">
                  <div className="settings-label">
                    <Clock size={16} />
                    <span>Drawtime</span>
                  </div>
                  <select
                    value={settings.drawTime}
                    disabled={!isHost}
                    onChange={e => onUpdateSettings({ drawTime: Number(e.target.value) })}
                    className="skribbl-select"
                  >
                    {[30, 45, 60, 70, 80, 90, 100, 120, 150, 180].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                {/* Rounds */}
                <div className="settings-row">
                  <div className="settings-label">
                    <RotateCcw size={16} />
                    <span>Rounds</span>
                  </div>
                  <select
                    value={settings.rounds}
                    disabled={!isHost}
                    onChange={e => onUpdateSettings({ rounds: Number(e.target.value) })}
                    className="skribbl-select"
                  >
                    {[2, 3, 4, 5, 6, 7, 8, 9, 10].map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                {/* Game Mode */}
                <div className="settings-row">
                  <div className="settings-label">
                    <Gamepad2 size={16} />
                    <span>Game Mode</span>
                  </div>
                  <select
                    value={settings.wordMode}
                    disabled={!isHost}
                    onChange={e => onUpdateSettings({ wordMode: e.target.value as any })}
                    className="skribbl-select"
                  >
                    <option value="normal">Normal</option>
                    <option value="hidden">Hidden</option>
                  </select>
                </div>

                {/* Word Count */}
                <div className="settings-row">
                  <div className="settings-label">
                    <FileText size={16} />
                    <span>Word Count</span>
                  </div>
                  <select
                    value={settings.wordCount}
                    disabled={!isHost}
                    onChange={e => onUpdateSettings({ wordCount: Number(e.target.value) })}
                    className="skribbl-select"
                  >
                    {[1, 2, 3, 4, 5].map(w => (
                      <option key={w} value={w}>{w}</option>
                    ))}
                  </select>
                </div>

                {/* Hints */}
                <div className="settings-row">
                  <div className="settings-label">
                    <HelpCircle size={16} />
                    <span>Hints</span>
                  </div>
                  <select
                    value={settings.hintsCount}
                    disabled={!isHost}
                    onChange={e => onUpdateSettings({ hintsCount: Number(e.target.value) })}
                    className="skribbl-select"
                  >
                    {[0, 1, 2, 3, 4, 5].map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Custom Words Section (Screenshot 2) */}
              <div className="skribbl-custom-words-box">
                <div className="custom-words-header">
                  <span className="font-bold text-white text-sm">Custom words</span>
                  <label className="custom-words-checkbox-label">
                    <input
                      type="checkbox"
                      checked={customOnly}
                      disabled={!isHost}
                      onChange={e => setCustomOnly(e.target.checked)}
                    />
                    <span>Use custom words only</span>
                  </label>
                </div>

                <textarea
                  value={customWordsInput}
                  disabled={!isHost}
                  onChange={e => setCustomWordsInput(e.target.value)}
                  onBlur={handleCustomWordsBlur}
                  placeholder="Minimum of 10 words. 1-32 characters per word! 20000 characters maximum. Separated by a , (comma)"
                  rows={4}
                  className="skribbl-textarea"
                />
              </div>

              {/* Lobby Footer Actions */}
              <div className="skribbl-lobby-actions">
                <button
                  type="button"
                  onClick={copyInviteLink}
                  className="skribbl-invite-link-btn"
                >
                  {copied ? <Check size={16} className="text-emerald-300" /> : <Share2 size={16} />}
                  <span>{copied ? 'Invite Link Copied!' : `Copy Invite Link (${roomId})`}</span>
                </button>

                {isHost ? (
                  <button
                    type="button"
                    onClick={() => {
                      soundManager.playPop();
                      onStartGame();
                    }}
                    disabled={players.length < 2}
                    className="skribbl-start-green-btn"
                  >
                    <Play size={18} fill="currentColor" />
                    <span>Start Game! ({players.length}/2 min)</span>
                  </button>
                ) : (
                  <div className="skribbl-guest-notice">
                    Waiting for host to start the game...
                  </div>
                )}
              </div>
            </>
          )}
        </div>
    </div>
  );
};
