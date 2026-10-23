import React, { useState } from 'react';
import { AvatarConfig, PublicRoomInfo } from '../types';
import { Avatar, AVATAR_COLORS, TOTAL_EYES, TOTAL_MOUTHS, TOTAL_COLORS } from './Avatar';
import { soundManager } from '../services/sound';
import { Dices, Globe, Users, ArrowRight } from 'lucide-react';

interface SkribblHomeBoxProps {
  playerName: string;
  avatarConfig: AvatarConfig;
  onPlayerNameChange: (name: string) => void;
  onAvatarConfigChange: (config: AvatarConfig) => void;
  onPlayPublic: () => void;
  onCreatePrivateRoom: () => void;
  onJoinRoom: (code: string) => void;
  publicRooms: PublicRoomInfo[];
}

export const SkribblHomeBox: React.FC<SkribblHomeBoxProps> = ({
  playerName,
  avatarConfig,
  onPlayerNameChange,
  onAvatarConfigChange,
  onPlayPublic,
  onCreatePrivateRoom,
  onJoinRoom,
  publicRooms,
}) => {
  const [roomCode, setRoomCode] = useState('');
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [language, setLanguage] = useState('English');

  const cycleEyes = (dir: number) => {
    soundManager.playPop();
    const next = (avatarConfig.eyes + dir + TOTAL_EYES) % TOTAL_EYES;
    onAvatarConfigChange({ ...avatarConfig, eyes: next });
  };

  const cycleMouth = (dir: number) => {
    soundManager.playPop();
    const next = (avatarConfig.mouth + dir + TOTAL_MOUTHS) % TOTAL_MOUTHS;
    onAvatarConfigChange({ ...avatarConfig, mouth: next });
  };

  const cycleColor = (dir: number) => {
    soundManager.playPop();
    const currIdx = AVATAR_COLORS.indexOf(avatarConfig.color);
    const nextIdx = (currIdx + dir + TOTAL_COLORS) % TOTAL_COLORS;
    onAvatarConfigChange({ ...avatarConfig, color: AVATAR_COLORS[nextIdx] });
  };

  const handleRandomize = () => {
    soundManager.playPop();
    const randomColor = AVATAR_COLORS[Math.floor(Math.random() * TOTAL_COLORS)];
    const randomEyes = Math.floor(Math.random() * TOTAL_EYES);
    const randomMouth = Math.floor(Math.random() * TOTAL_MOUTHS);
    onAvatarConfigChange({
      ...avatarConfig,
      color: randomColor,
      eyes: randomEyes,
      mouth: randomMouth,
    });
  };

  return (
    <div className="skribbl-authentic-box">
      {/* Top Input Bar: Name + Language */}
      <div className="skribbl-top-inputs">
        <input
          type="text"
          value={playerName}
          maxLength={16}
          onChange={e => onPlayerNameChange(e.target.value)}
          placeholder="Enter your name"
          className="skribbl-name-field"
        />

        <select
          value={language}
          onChange={e => setLanguage(e.target.value)}
          className="skribbl-lang-select"
        >
          <option value="English">English</option>
          <option value="Spanish">Español</option>
          <option value="German">Deutsch</option>
          <option value="French">Français</option>
          <option value="Italian">Italiano</option>
        </select>
      </div>

      {/* Avatar Viewport with 3 Pairs of Arrows and Dice */}
      <div className="skribbl-avatar-stage">
        {/* Dice Randomizer in Top Right */}
        <button
          type="button"
          onClick={handleRandomize}
          className="skribbl-dice-btn"
          title="Randomize Avatar"
        >
          <Dices size={24} className="text-white" />
        </button>

        {/* The 3 Arrow Rows */}
        <div className="skribbl-arrows-column left-arrows">
          <button type="button" onClick={() => cycleEyes(-1)} className="skribbl-arrow-btn">
            &#9664;
          </button>
          <button type="button" onClick={() => cycleMouth(-1)} className="skribbl-arrow-btn">
            &#9664;
          </button>
          <button type="button" onClick={() => cycleColor(-1)} className="skribbl-arrow-btn">
            &#9664;
          </button>
        </div>

        {/* Center Avatar */}
        <div className="skribbl-avatar-display">
          <Avatar config={avatarConfig} size={135} />
        </div>

        <div className="skribbl-arrows-column right-arrows">
          <button type="button" onClick={() => cycleEyes(1)} className="skribbl-arrow-btn">
            &#9654;
          </button>
          <button type="button" onClick={() => cycleMouth(1)} className="skribbl-arrow-btn">
            &#9654;
          </button>
          <button type="button" onClick={() => cycleColor(1)} className="skribbl-arrow-btn">
            &#9654;
          </button>
        </div>
      </div>

      {/* Main Buttons matching Screenshot 1 */}
      <div className="skribbl-main-buttons">
        <button
          type="button"
          onClick={() => {
            soundManager.playPop();
            onPlayPublic();
          }}
          className="skribbl-play-green-btn"
        >
          Play!
        </button>

        <button
          type="button"
          onClick={() => {
            soundManager.playPop();
            onCreatePrivateRoom();
          }}
          className="skribbl-private-blue-btn"
        >
          Create Private Room
        </button>
      </div>

      {/* Join with Code & Active Rooms row */}
      <div className="skribbl-extra-footer">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (roomCode.trim()) {
              soundManager.playPop();
              onJoinRoom(roomCode.trim().toUpperCase());
            }
          }}
          className="skribbl-join-code-form"
        >
          <input
            type="text"
            value={roomCode}
            onChange={e => setRoomCode(e.target.value.toUpperCase())}
            placeholder="Room Code"
            maxLength={10}
            className="skribbl-code-input"
          />
          <button type="submit" disabled={!roomCode.trim()} className="skribbl-code-submit">
            Join
          </button>
        </form>

        {publicRooms.length > 0 && (
          <div className="skribbl-public-count">
            <Globe size={13} />
            <span>{publicRooms.length} active public room{publicRooms.length > 1 ? 's' : ''}</span>
          </div>
        )}
      </div>
    </div>
  );
};
