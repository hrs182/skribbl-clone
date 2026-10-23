import React from 'react';
import { AvatarConfig } from '../types';

interface AvatarProps {
  config: AvatarConfig;
  size?: number;
  className?: string;
  showHat?: boolean;
}

export const AVATAR_COLORS = [
  '#ef4444', // Red (Classic #1)
  '#f97316', // Orange
  '#f59e0b', // Amber/Yellow
  '#22c55e', // Green
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#ffffff', // White
  '#64748b', // Gray
];

export const TOTAL_EYES = 8;
export const TOTAL_MOUTHS = 8;
export const TOTAL_HATS = 2;
export const TOTAL_COLORS = AVATAR_COLORS.length;

export const Avatar: React.FC<AvatarProps> = ({
  config,
  size = 64,
  className = '',
  showHat = true,
}) => {
  const { color = '#ef4444', eyes = 0, mouth = 0, hat = 0 } = config;

  // Eyes in authentic skribbl style (thick black strokes)
  const renderEyes = () => {
    switch (eyes % TOTAL_EYES) {
      case 0: // Classic two dots
        return (
          <>
            <circle cx="36" cy="42" r="5" fill="#000000" />
            <circle cx="64" cy="42" r="5" fill="#000000" />
          </>
        );
      case 1: // Happy arch eyes ^^
        return (
          <>
            <path d="M28 44 Q36 34 44 44" stroke="#000000" strokeWidth="5.5" strokeLinecap="round" fill="none" />
            <path d="M56 44 Q64 34 72 44" stroke="#000000" strokeWidth="5.5" strokeLinecap="round" fill="none" />
          </>
        );
      case 2: // Angry brows / intense
        return (
          <>
            <line x1="28" y1="36" x2="44" y2="42" stroke="#000000" strokeWidth="5" strokeLinecap="round" />
            <line x1="72" y1="36" x2="56" y2="42" stroke="#000000" strokeWidth="5" strokeLinecap="round" />
            <circle cx="36" cy="44" r="4.5" fill="#000000" />
            <circle cx="64" cy="44" r="4.5" fill="#000000" />
          </>
        );
      case 3: // Cool sunglasses
        return (
          <g>
            <rect x="22" y="36" width="24" height="15" rx="3" fill="#000000" />
            <rect x="54" y="36" width="24" height="15" rx="3" fill="#000000" />
            <line x1="46" y1="41" x2="54" y2="41" stroke="#000000" strokeWidth="4" />
            <line x1="26" y1="39" x2="34" y2="48" stroke="#ffffff" strokeWidth="2.5" />
            <line x1="58" y1="39" x2="66" y2="48" stroke="#ffffff" strokeWidth="2.5" />
          </g>
        );
      case 4: // Winking eye ;_
        return (
          <>
            <circle cx="36" cy="42" r="5" fill="#000000" />
            <path d="M56 42 Q64 36 72 42" stroke="#000000" strokeWidth="5" strokeLinecap="round" fill="none" />
          </>
        );
      case 5: // Big open cartoon eyes
        return (
          <>
            <circle cx="36" cy="41" r="9" fill="#ffffff" stroke="#000000" strokeWidth="4" />
            <circle cx="38" cy="41" r="4.5" fill="#000000" />
            <circle cx="64" cy="41" r="9" fill="#ffffff" stroke="#000000" strokeWidth="4" />
            <circle cx="66" cy="41" r="4.5" fill="#000000" />
          </>
        );
      case 6: // Dizzy swirls or ninja squint
        return (
          <>
            <line x1="28" y1="43" x2="44" y2="43" stroke="#000000" strokeWidth="5" strokeLinecap="round" />
            <line x1="56" y1="43" x2="72" y2="43" stroke="#000000" strokeWidth="5" strokeLinecap="round" />
          </>
        );
      case 7: // Sleepy / bored eyes
      default:
        return (
          <>
            <path d="M28 41 Q36 46 44 41" stroke="#000000" strokeWidth="5" strokeLinecap="round" fill="none" />
            <path d="M56 41 Q64 46 72 41" stroke="#000000" strokeWidth="5" strokeLinecap="round" fill="none" />
            <circle cx="36" cy="44" r="3" fill="#000000" />
            <circle cx="64" cy="44" r="3" fill="#000000" />
          </>
        );
    }
  };

  // Mouths in authentic skribbl style
  const renderMouth = () => {
    switch (mouth % TOTAL_MOUTHS) {
      case 0: // Classic two buck teeth smile (as seen in screenshot 1!)
        return (
          <g>
            <path d="M36 57 Q50 71 64 57 Z" fill="#000000" />
            <rect x="42" y="57" width="6" height="6" fill="#ffffff" />
            <rect x="52" y="57" width="6" height="6" fill="#ffffff" />
          </g>
        );
      case 1: // Open happy mouth with red tongue
        return (
          <g>
            <path d="M35 56 Q50 74 65 56 Z" fill="#000000" />
            <path d="M42 64 Q50 70 58 64 Z" fill="#f43f5e" />
          </g>
        );
      case 2: // Big wide grin
        return (
          <path d="M34 57 Q50 72 66 57" stroke="#000000" strokeWidth="5" strokeLinecap="round" fill="#ffffff" />
        );
      case 3: // Surprised O
        return (
          <ellipse cx="50" cy="62" rx="7" ry="9" fill="#000000" />
        );
      case 4: // Tongue sticking out :P
        return (
          <g>
            <path d="M36 58 Q50 62 64 58" stroke="#000000" strokeWidth="5" strokeLinecap="round" fill="none" />
            <path d="M46 59 C46 69, 54 69, 54 59 Z" fill="#f43f5e" stroke="#000000" strokeWidth="3" />
          </g>
        );
      case 5: // Smirk / sarcastic
        return (
          <path d="M38 61 Q55 67 64 55" stroke="#000000" strokeWidth="5" strokeLinecap="round" fill="none" />
        );
      case 6: // Vampire fangs
        return (
          <g>
            <path d="M36 58 Q50 68 64 58" stroke="#000000" strokeWidth="4" fill="#000000" />
            <polygon points="40,58 43,64 45,58" fill="#ffffff" />
            <polygon points="55,58 57,64 60,58" fill="#ffffff" />
          </g>
        );
      case 7: // Simple gentle curve
      default:
        return (
          <path d="M38 58 Q50 68 62 58" stroke="#000000" strokeWidth="5.5" strokeLinecap="round" fill="none" />
        );
    }
  };

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 100 100"
        width={size}
        height={size}
        className="w-full h-full overflow-visible"
      >
        {/* Torso / Body (authentic Skribbl shape) */}
        <path
          d="M 12 100 C 12 70, 88 70, 88 100 Z"
          fill={color}
          stroke="#000000"
          strokeWidth="6"
          strokeLinejoin="round"
        />

        {/* Head */}
        <ellipse
          cx="50"
          cy="48"
          rx="33"
          ry="31"
          fill={color}
          stroke="#000000"
          strokeWidth="6"
        />

        {/* Crown (for Host) */}
        {showHat && hat === 1 && (
          <g>
            <polygon
              points="30,24 33,6 43,17 50,4 57,17 67,6 70,24"
              fill="#fbbf24"
              stroke="#000000"
              strokeWidth="4"
              strokeLinejoin="round"
            />
            <circle cx="33" cy="6" r="2.5" fill="#ef4444" />
            <circle cx="50" cy="4" r="2.5" fill="#3b82f6" />
            <circle cx="67" cy="6" r="2.5" fill="#22c55e" />
          </g>
        )}

        {/* Eyes & Mouth */}
        {renderEyes()}
        {renderMouth()}
      </svg>
    </div>
  );
};
