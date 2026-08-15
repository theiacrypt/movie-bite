import React from 'react';

interface AvatarPickerProps {
  selectedAvatar: string;
  onSelect: (avatar: string) => void;
}

const CINEMA_AVATARS = ['🍿', '🎬', '🥤', '🍕', '🍫', '👑', '🎭', '🕶️', '🎥', '🎟️', '🦖', '🚀'];

export const AvatarPicker: React.FC<AvatarPickerProps> = ({ selectedAvatar, onSelect }) => {
  return (
    <div className="flex flex-wrap gap-2 justify-center py-2">
      {CINEMA_AVATARS.map((emoji) => (
        <button
          key={emoji}
          type="button"
          onClick={() => onSelect(emoji)}
          className={`w-11 h-11 text-2xl flex items-center justify-center rounded-xl transition-all duration-200 ${
            selectedAvatar === emoji
              ? 'bg-cinema-red/30 border-2 border-cinema-red scale-110 shadow-lg shadow-cinema-red/30'
              : 'bg-theater-800/60 border border-white/5 hover:bg-theater-700/60 hover:scale-105'
          }`}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
};
