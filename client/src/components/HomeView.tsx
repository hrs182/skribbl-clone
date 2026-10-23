import React, { useState, useEffect } from 'react';
import { AvatarConfig, PublicRoomInfo } from '../types';
import { SkribblLogo } from './SkribblLogo';
import { SkribblHomeBox } from './SkribblHomeBox';
import { socket } from '../services/socket';

interface HomeViewProps {
  playerName: string;
  avatarConfig: AvatarConfig;
  onPlayerNameChange: (name: string) => void;
  onAvatarConfigChange: (config: AvatarConfig) => void;
  onCreateRoom: (isPrivate: boolean) => void;
  onJoinRoom: (roomId: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  playerName,
  avatarConfig,
  onPlayerNameChange,
  onAvatarConfigChange,
  onCreateRoom,
  onJoinRoom,
}) => {
  const [publicRooms, setPublicRooms] = useState<PublicRoomInfo[]>([]);

  useEffect(() => {
    socket.emit('get_public_rooms');
    const handleRooms = (rooms: PublicRoomInfo[]) => setPublicRooms(rooms);
    socket.on('public_rooms_list', handleRooms);
    return () => {
      socket.off('public_rooms_list', handleRooms);
    };
  }, []);

  return (
    <div className="skribbl-home-page-wrapper">
      {/* Centered Content matching Screenshot 1 */}
      <div className="skribbl-home-center-stage">
        {/* Authentic Bubble Skribbl Logo with cartoon avatar row */}
        <SkribblLogo size="large" />

        {/* Authentic Center Box */}
        <SkribblHomeBox
          playerName={playerName}
          avatarConfig={avatarConfig}
          onPlayerNameChange={onPlayerNameChange}
          onAvatarConfigChange={onAvatarConfigChange}
          onPlayPublic={() => onCreateRoom(false)}
          onCreatePrivateRoom={() => onCreateRoom(true)}
          onJoinRoom={onJoinRoom}
          publicRooms={publicRooms}
        />
      </div>
    </div>
  );
};
