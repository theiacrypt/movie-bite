import React, { useState, useEffect } from 'react';
import { Film, Share2, Users, User, ShieldCheck } from 'lucide-react';
import { suppenstudiosAuth, User as AuthUser } from '../services/suppenstudiosAuth.js';

interface HeaderProps {
  roomCode?: string;
  phase?: string;
  playerCount?: number;
  onOpenShare?: () => void;
  onOpenAuth?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  roomCode,
  phase,
  playerCount,
  onOpenShare,
  onOpenAuth
}) => {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(suppenstudiosAuth.getUser());

  useEffect(() => {
    const unsub = suppenstudiosAuth.subscribe(setCurrentUser);
    return unsub;
  }, []);

  const getPhaseBadge = () => {
    switch (phase) {
      case 'LOBBY':
        return <span className="bg-theater-800 text-slate-300 px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider border border-white/10">Lobby</span>;
      case 'ROUND_1_SUGGEST':
        return <span className="bg-cinema-purple/20 text-purple-300 px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider border border-cinema-purple/30 animate-pulse">Runde 1: Vorschläge</span>;
      case 'ROUND_2_VOTE':
        return <span className="bg-cinema-red/20 text-red-300 px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider border border-cinema-red/30 animate-pulse">Runde 2: Voting</span>;
      case 'WINNER_SHOWDOWN':
        return <span className="bg-cinema-gold/20 text-yellow-300 px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider border border-cinema-gold/30">🏆 Gewinner</span>;
      default:
        return null;
    }
  };

  return (
    <header className="w-full border-b border-white/10 bg-theater-950/90 sticky top-0 z-40 px-4 py-3 sm:px-6">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cinema-red to-orange-500 flex items-center justify-center shadow-lg shadow-cinema-red/20">
            <Film className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display font-black text-xl tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                Movie<span className="text-cinema-red">Bite</span>
              </h1>
              {getPhaseBadge()}
            </div>
            <p className="text-[10px] text-slate-400 font-medium tracking-wide uppercase">movie-bite.suppenstudios.work</p>
          </div>
        </div>

        {/* Actions & Room Code */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Suppenstudios Account Button */}
          <button
            onClick={onOpenAuth}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-theater-900 hover:bg-theater-850 border border-white/10 text-xs font-semibold text-slate-200 transition-all active:scale-95 shadow-sm"
          >
            {currentUser ? (
              <>
                <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-cinema-red to-orange-500 flex items-center justify-center text-[10px] text-white font-bold">
                  {currentUser.username.substring(0, 1).toUpperCase()}
                </div>
                <span className="max-w-[100px] truncate">{currentUser.username}</span>
                {currentUser.totp_enabled && (
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" title="2FA aktiv" />
                )}
              </>
            ) : (
              <>
                <User className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden xs:inline">Suppenstudios Account</span>
                <span className="xs:hidden">Login</span>
              </>
            )}
          </button>

          {roomCode && (
            <>
              {playerCount !== undefined && (
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-theater-900 border border-white/5 text-xs text-slate-300">
                  <Users className="w-3.5 h-3.5 text-cinema-neon" />
                  <span>{playerCount} {playerCount === 1 ? 'Spieler' : 'Spieler'}</span>
                </div>
              )}

              <button
                onClick={onOpenShare}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-theater-850 hover:bg-theater-800 border border-cinema-red/30 hover:border-cinema-red/60 text-xs font-semibold text-cinema-red transition-all shadow-sm active:scale-95"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span className="font-mono tracking-wider">{roomCode}</span>
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
