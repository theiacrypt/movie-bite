import React, { useState, useEffect, useRef } from 'react';
import { Film, Share2, Users, User, ShieldCheck, Heart, Trophy, ChevronDown, ExternalLink, LogOut, Settings } from 'lucide-react';
import { suppenstudiosAuth, User as AuthUser } from '../services/suppenstudiosAuth.js';

interface HeaderProps {
  roomCode?: string;
  phase?: string;
  playerCount?: number;
  onOpenShare?: () => void;
  onOpenAuth?: () => void;
  onOpenFavorites?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  roomCode,
  phase,
  playerCount,
  onOpenShare,
  onOpenAuth,
  onOpenFavorites
}) => {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(suppenstudiosAuth.getUser());
  const [favCount, setFavCount] = useState(suppenstudiosAuth.getFavorites().length);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = suppenstudiosAuth.subscribe(u => {
      setCurrentUser(u);
      setFavCount(suppenstudiosAuth.getFavorites().length);
    });
    return unsub;
  }, []);

  useEffect(() => {
    const unsub = suppenstudiosAuth.subscribeFavorites(() => {
      setFavCount(suppenstudiosAuth.getFavorites().length);
    });
    return unsub;
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    setDropdownOpen(false);
    suppenstudiosAuth.logout();
  };

  const getPhaseBadge = () => {
    switch (phase) {
      case 'LOBBY':
        return <span className="bg-theater-800 text-slate-300 px-3 py-1 rounded-full text-xs font-semibold tracking-wide border border-white/10">Lobby</span>;
      case 'ROUND_1_SUGGEST':
        return <span className="bg-cinema-purple/20 text-purple-300 px-3 py-1 rounded-full text-xs font-semibold tracking-wide border border-cinema-purple/30 animate-pulse">Runde 1: Vorschläge</span>;
      case 'ROUND_2_VOTE':
        return <span className="bg-cinema-red/20 text-red-300 px-3 py-1 rounded-full text-xs font-semibold tracking-wide border border-cinema-red/30 animate-pulse">Runde 2: Voting</span>;
      case 'WINNER_SHOWDOWN':
        return (
          <span className="bg-cinema-gold/20 text-yellow-300 px-3 py-1 rounded-full text-xs font-semibold tracking-wide border border-cinema-gold/30 inline-flex items-center gap-1.5 shadow-sm shadow-cinema-gold/10">
            <Trophy className="w-3.5 h-3.5 text-cinema-gold" />
            <span>Gewinner</span>
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <header className="w-full border-b border-white/10 bg-theater-950/90 backdrop-blur-md sticky top-0 z-40 px-4 py-3 sm:px-6">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cinema-red to-cinema-red-deep flex items-center justify-center shadow-lg shadow-cinema-red/25">
            <Film className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display font-black text-xl tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                Movie<span className="text-cinema-red">Bite</span>
              </h1>
              {getPhaseBadge()}
            </div>
            <p className="text-[10px] text-slate-500 font-medium tracking-wide uppercase">movie-bite.suppenstudios.work</p>
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2 sm:gap-2.5">

          {/* Favorites button */}
          <button
            onClick={onOpenFavorites}
            className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-theater-900 hover:bg-theater-850 border border-white/10 hover:border-cinema-red/30 text-xs font-semibold text-slate-200 transition-all active:scale-95 shadow-sm"
            title="Favoriten"
          >
            <Heart className={`w-3.5 h-3.5 ${favCount > 0 ? 'text-cinema-red fill-cinema-red' : 'text-slate-400'}`} />
            <span className="hidden sm:inline">Favoriten</span>
            {favCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-cinema-red text-white text-[9px] font-black flex items-center justify-center shadow-md">
                {favCount > 9 ? '9+' : favCount}
              </span>
            )}
          </button>

          {/* Auth button & User Dropdown */}
          {currentUser ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-theater-900 hover:bg-theater-850 border border-white/10 text-xs font-semibold text-slate-200 transition-all active:scale-95 shadow-sm"
              >
                <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-cinema-red to-cinema-red-deep flex items-center justify-center text-[10px] text-white font-black">
                  {currentUser.username.substring(0, 1).toUpperCase()}
                </div>
                <span className="max-w-[100px] truncate">{currentUser.username}</span>
                {currentUser.totp_enabled && (
                  <span title="2FA aktiv" className="inline-flex items-center">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  </span>
                )}
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-60 rounded-2xl bg-theater-900 border border-white/10 shadow-2xl p-1.5 z-50 animate-fadeIn">
                  <div className="px-3 py-2 border-b border-white/10 bg-theater-950/60 rounded-t-xl mb-1">
                    <p className="text-[10px] text-slate-400">Angemeldet als</p>
                    <p className="text-xs font-bold text-white truncate">{currentUser.username}</p>
                  </div>

                  <div className="space-y-0.5">
                    <a
                      href="https://account.suppenstudios.work"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-amber-300 hover:bg-amber-500/10 transition-colors border border-amber-500/20 group"
                      title="Zentraler Suppenstudios Account • Passkeys, Avatare & RPG-XP"
                    >
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                        <span>Suppenstudios Account</span>
                      </div>
                      <ExternalLink className="w-3 h-3 text-amber-400/70 group-hover:text-amber-300" />
                    </a>

                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        onOpenAuth?.();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-slate-200 hover:bg-white/5 transition-colors text-left"
                    >
                      <Settings className="w-3.5 h-3.5 text-slate-400" />
                      <span>Sicherheit & Passkeys</span>
                    </button>
                  </div>

                  <div className="pt-1 mt-1 border-t border-white/10">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-red-400 hover:bg-red-500/10 transition-colors text-left"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Abmelden</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-theater-900 hover:bg-theater-850 border border-white/10 text-xs font-semibold text-slate-200 transition-all active:scale-95 shadow-sm"
            >
              <User className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden xs:inline">Suppenstudios</span>
              <span className="xs:hidden">Login</span>
            </button>
          )}

          {/* Share / Room code */}
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
