import React, { useState } from 'react';
import { Users, Crown, CheckCircle, Clock, Play, Share2, Sparkles, Shield, Bell, BellRing, Sliders, LogIn } from 'lucide-react';
import { RoomState, RoomSettings } from '../types/game.js';
import { soundFx } from '../services/soundEffects.js';
import { notificationService } from '../services/notificationService.js';
import { suppenstudiosAuth } from '../services/suppenstudiosAuth.js';

interface LobbyViewProps {
  room: RoomState;
  currentPlayerId: string;
  onToggleReady: () => void;
  onStartRound1: () => void;
  onOpenShare: () => void;
  onUpdateSettings?: (settings: Partial<RoomSettings>) => void;
  onOpenAuth?: () => void;
}

export const LobbyView: React.FC<LobbyViewProps> = ({
  room,
  currentPlayerId,
  onToggleReady,
  onStartRound1,
  onOpenShare,
  onUpdateSettings,
  onOpenAuth
}) => {
  const isHost = room.hostId === currentPlayerId;
  const me = room.players.find(p => p.id === currentPlayerId);
  const readyCount = room.players.filter(p => p.isReady).length;
  const canStart = isHost && room.players.length >= 1;
  const currentUser = suppenstudiosAuth.getUser();

  const [notifGranted, setNotifGranted] = useState(() => notificationService.isGranted());
  const [showSettings, setShowSettings] = useState(false);

  const maxLimit = room.settings?.maxSuggestionsPerPlayer ?? 3;

  const handleEnableNotifications = async () => {
    soundFx.playPop();
    const granted = await notificationService.requestPermission();
    setNotifGranted(granted);
    if (granted) {
      notificationService.send('🍿 Movie-Bite Benachrichtigungen aktiv!', {
        body: 'Du wirst informiert, sobald die nächste Runde startet.'
      });
    }
  };

  const handleSetMaxSuggestions = (limit: number) => {
    soundFx.playPop();
    onUpdateSettings?.({ maxSuggestionsPerPlayer: limit });
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Hero Card */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-white/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Users className="w-48 h-48 text-cinema-red" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cinema-red/10 border border-cinema-red/30 text-cinema-red text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Warteraum</span>
            </div>
            <h2 className="font-display font-black text-2xl sm:text-3xl text-white">
              Bereit für den Filmabend?
            </h2>
            <p className="text-sm text-slate-400 mt-1 max-w-md">
              Lade deine Freunde ein. Sobald alle beigetreten sind, startet Runde 1 (Filme vorschlagen).
            </p>
          </div>

          {/* Quick Share Box & Actions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              onClick={onOpenShare}
              className="px-4 py-3 rounded-2xl bg-theater-900/80 hover:bg-theater-850 border border-white/10 hover:border-cinema-red/40 text-xs font-semibold text-slate-200 flex items-center justify-center gap-2.5 transition-all shadow-md active:scale-95"
            >
              <Share2 className="w-4 h-4 text-cinema-red" />
              <span>Einladungslink & QR</span>
            </button>

            {isHost ? (
              <button
                onClick={() => {
                  soundFx.playPop();
                  onStartRound1();
                }}
                disabled={!canStart}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-cinema-red to-cinema-red-deep hover:from-cinema-red-hover hover:to-cinema-red text-white font-bold text-sm flex items-center justify-center gap-2 shadow-xl shadow-cinema-red/30 active:scale-95 transition-all disabled:opacity-50"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Runde 1 starten</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  soundFx.playPop();
                  onToggleReady();
                }}
                className={`px-6 py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 ${
                  me?.isReady
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                    : 'bg-theater-850 hover:bg-theater-800 text-slate-300 border border-white/10'
                }`}
              >
                <CheckCircle className="w-4 h-4" />
                <span>{me?.isReady ? 'Ich bin bereit!' : 'Bereit machen'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Guest Notification Prompt Banner */}
      {!notifGranted && notificationService.isSupported() && (
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-amber-500/15 via-theater-900 to-theater-950 border border-amber-500/30 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-slideUp">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0 animate-bounce">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-white flex items-center gap-2">
                <span>Runden-Benachrichtigungen aktivieren</span>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-bold uppercase">Empfohlen</span>
              </h4>
              <p className="text-xs text-slate-300 mt-0.5">
                Erhalte direkt eine Info, wenn der Host die nächste Runde oder das Voting startet – auch im Hintergrund!
              </p>
            </div>
          </div>
          <button
            onClick={handleEnableNotifications}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-theater-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all shrink-0 active:scale-95"
          >
            <BellRing className="w-4 h-4" />
            <span>Benachrichtigung erlauben</span>
          </button>
        </div>
      )}

      {/* Host Settings Bar */}
      {isHost && (
        <div className="glass-panel rounded-3xl p-5 border border-cinema-gold/30 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-cinema-gold">
              <Sliders className="w-4 h-4" />
              <h4 className="font-bold text-xs sm:text-sm text-white">Raum-Einstellungen (Host)</h4>
            </div>
            <span className="text-[11px] text-cinema-gold font-bold">
              {maxLimit === 0 ? 'Limit: Keine Grenze (∞)' : `Limit: Max. ${maxLimit} Filme pro Spieler`}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1.5">
                Vorschlagslimit pro Teilnehmer
              </label>
              <div className="grid grid-cols-5 gap-1 p-1 bg-theater-900 rounded-xl border border-white/5">
                {[
                  { val: 1, label: '1 Film' },
                  { val: 2, label: '2' },
                  { val: 3, label: '3 (Std)' },
                  { val: 5, label: '5' },
                  { val: 0, label: '∞ Keine' }
                ].map(opt => (
                  <button
                    key={opt.val}
                    onClick={() => handleSetMaxSuggestions(opt.val)}
                    className={`py-1.5 rounded-lg text-xs font-bold transition-all text-center ${
                      maxLimit === opt.val
                        ? 'bg-gradient-to-r from-cinema-red to-red-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white bg-theater-950/40 hover:bg-theater-850'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Suppenstudios Account Info */}
            {!currentUser && onOpenAuth && (
              <div className="p-2.5 rounded-xl bg-theater-900/60 border border-white/5 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate">Suppenstudios Account</p>
                  <p className="text-[10px] text-slate-400">Favoriten synchronisieren & Rezensionen teilen</p>
                </div>
                <button
                  onClick={onOpenAuth}
                  className="px-3 py-1.5 rounded-lg bg-cinema-red/20 text-red-300 hover:bg-cinema-red hover:text-white border border-cinema-red/30 text-xs font-bold flex items-center gap-1 transition-all shrink-0"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Anmelden</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Players List Grid */}
      <div className="glass-panel rounded-3xl p-6 border border-white/10">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-cinema-neon" />
            <h3 className="font-display font-bold text-lg text-white">
              Teilnehmer ({room.players.length})
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-medium bg-theater-900 px-3 py-1 rounded-full border border-white/5">
            {readyCount} von {room.players.length} bereit
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {room.players.map((player) => {
            const isMe = player.id === currentPlayerId;
            return (
              <div
                key={player.id}
                className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${
                  isMe
                    ? 'bg-theater-850/80 border-cinema-red/40 shadow-md shadow-cinema-red/10'
                    : 'bg-theater-900/60 border-white/5'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-theater-950 border border-white/10 flex items-center justify-center text-2xl shrink-0 shadow-inner">
                    {player.avatar}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="font-display font-bold text-sm text-white truncate">
                        {player.name}
                      </p>
                      {isMe && (
                        <span className="text-[10px] bg-cinema-red/20 text-red-300 font-bold px-1.5 py-0.2 rounded border border-cinema-red/30">
                          Du
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {player.isHost && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-cinema-gold font-semibold">
                          <Crown className="w-3 h-3 fill-cinema-gold" />
                          <span>Host</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="shrink-0">
                  {player.isReady ? (
                    <span className="p-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center gap-1 text-xs font-semibold" title="Bereit">
                      <CheckCircle className="w-4 h-4" />
                    </span>
                  ) : (
                    <span className="p-1.5 rounded-xl bg-slate-800 text-slate-500 flex items-center gap-1 text-xs" title="Wartet">
                      <Clock className="w-4 h-4" />
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Rules / Guide Box */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl bg-theater-900/50 border border-white/5 flex gap-3.5 items-start">
          <div className="p-2.5 rounded-xl bg-cinema-purple/15 text-purple-300 shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-white">Runde 1: Filme vorschlagen</h4>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              {maxLimit === 0
                ? 'Jeder darf beliebig viele Wunschfilme über unsere Film-Suche oder aus den Favoriten vorschlagen.'
                : `Jeder darf bis zu ${maxLimit} Wunschfilme über unsere Film-Suche oder aus den Favoriten vorschlagen.`}
            </p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-theater-900/50 border border-white/5 flex gap-3.5 items-start">
          <div className="p-2.5 rounded-xl bg-cinema-red/15 text-red-300 shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-white">Runde 2: Voting & Auswertung</h4>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Stimme mit Like (+1), Neutral (0), Dislike (-1) oder Super-Vote (+2) ab. Vor dem Absenden überprüfst du alles in der Zusammenfassung!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

