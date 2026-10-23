import React from 'react';

export const SkribblLogo: React.FC<{ size?: 'normal' | 'large' }> = ({ size = 'large' }) => {
  return (
    <div className={`skribbl-logo-wrapper ${size === 'normal' ? 'logo-compact' : ''}`}>
      <img
        src="https://skribbl.io/img/logo.gif"
        onError={(e) => {
          // Local fallback in case of network restriction or offline mode
          (e.currentTarget as HTMLImageElement).src = '/img/logo.gif';
        }}
        alt="skribbl.io"
        className={size === 'normal' ? 'skribbl-logo-compact-img' : 'skribbl-official-logo-img'}
        draggable={false}
      />
    </div>
  );
};
