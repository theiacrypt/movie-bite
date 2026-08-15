import React, { useState, useEffect } from 'react';
import { Film, Sparkles, ArrowRight, PlusCircle, Users, CheckCircle2 } from 'lucide-react';
import { AvatarPicker } from './AvatarPicker.js';
import { soundFx } from '../services/soundEffects.js';

interface WelcomeScreenProps {
  onCreateRoom: (name: string, avatar: string) => void;
  onJoinRoom: (code: string, name: string, avatar: string) => void;
  initialRoomCode?: string;
  error?: string | null;
  loading?: boolean;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onCreateRoom,
  onJoinRoom,
  initialRoomCode = '',
  error,
  loading = false
}) => {
  const [tab, setTab] = useState<'create' | 'join'>(initialRoomCode ? 'join' : 'create');
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('🍿');
  const [roomCode, setRoomCode] = useState(initialRoomCode);

  useEffect(() => {
    if (initialRoomCode) {
      setRoomCode(initialRoomCode);
      setTab('join');
    }
  }, [initialRoomCode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    soundFx.playPop();
    if (tab === 'create') {
      onCreateRoom(name || 'Kino-Fan', avatar);
    } else {
      if (!roomCode.trim()) return;
      onJoinRoom(roomCode.trim().toUpperCase(), name || 'Gast', avatar);
    }
  };

  return (
    <div className="min-h-[calc(100vh-65px)] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decorative Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cinema-red/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cinema-purple/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md glass-panel rounded-3xl p-6 sm:p-8 relative z-10 border border-white/10 shadow-2xl">
        {/* Cinema Popcorn Icon & Tagline */}
        <div className="text-center mb-6">
          <div className="inline-flex p-3.5 rounded-2xl bg-gradient-to-br from-cinema-red to-orange-600 text-white shadow-xl shadow-cinema-red/25 mb-3 animate-float">
            <Film className="w-8 h-8" />
          </div>
          <h2 className="font-display font-black text-2xl sm:text-3xl tracking-tight text-white">
            Gemeinsam Filme <span className="bg-gradient-to-r from-cinema-red to-orange-400 bg-clip-text text-transparent">entscheiden</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-2">
            2 Runden: Erst Vorschläge sammeln, dann mit Likes & Dislikes den Sieger küren!
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 p-1 bg-theater-900/90 rounded-2xl mb-6 border border-white/5">
          <button
            type="button"
            onClick={() => {
              setTab('create');
              soundFx.playPop();
            }}
            className={`py-2.5 rounded-xl font-semibold text-xs transition-all duration-200 flex items-center justify-center gap-1.5 ${
              tab === 'create'
                ? 'bg-gradient-to-r from-cinema-red to-red-600 text-white shadow-lg shadow-cinema-red/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Raum erstellen</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('join');
              soundFx.playPop();
            }}
            className={`py-2.5 rounded-xl font-semibold text-xs transition-all duration-200 flex items-center justify-center gap-1.5 ${
              tab === 'join'
                ? 'bg-gradient-to-r from-cinema-red to-red-600 text-white shadow-lg shadow-cinema-red/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Raum beitreten</span>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Avatar Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Wähle deinen Avatar
            </label>
            <AvatarPicker selectedAvatar={avatar} onSelect={(a) => setAvatar(a)} />
          </div>

          {/* Nickname */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Dein Name / Spitzname
            </label>
            <input
              type="text"
              required
              maxLength={20}
              placeholder="z. B. Alex, Cineast99..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-theater-900 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cinema-red transition-all"
            />
          </div>

          {/* Room Code if Join */}
          {tab === 'join' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                6-stelliger Raumcode
              </label>
              <input
                type="text"
                required
                maxLength={6}
                placeholder="z. B. ABC123"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                className="w-full bg-theater-900 border border-white/10 rounded-xl px-4 py-3 text-sm text-center font-mono font-bold tracking-widest text-cinema-gold placeholder-slate-600 focus:outline-none focus:border-cinema-gold transition-all uppercase"
              />
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-cinema-red via-red-600 to-orange-600 hover:from-red-600 hover:to-orange-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-xl shadow-cinema-red/30 active:scale-98 transition-all disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>{tab === 'create' ? 'Raum wird erstellt...' : 'Raum wird betreten...'}</span>
              </>
            ) : (
              <>
                <span>{tab === 'create' ? 'Raum öffnen & Freunde einladen' : 'Raum beitreten'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Feature Highlights */}
        <div className="mt-6 pt-5 border-t border-white/5 grid grid-cols-3 gap-2 text-center text-[11px] text-slate-400">
          <div className="flex flex-col items-center gap-1">
            <span className="text-base">🎬</span>
            <span>Live Movie API</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-base">⚡</span>
            <span>Echtzeit-Sync</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-base">🏆</span>
            <span>Fairer Sieger</span>
          </div>
        </div>
      </div>
    </div>
  );
};
