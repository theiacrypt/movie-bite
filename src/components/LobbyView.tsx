import React from 'react';
import { Users, Crown, CheckCircle, Clock, Play, Share2, Sparkles, Shield } from 'lucide-react';
import { RoomState, Player } from '../types/game.js';
import { soundFx } from '../services/soundEffects.js';

interface LobbyViewProps {
  room: RoomState;
  currentPlayerId: string;
  onToggleReady: () => void;
  onStartRound1: () => void;
  onOpenShare: () => void;
}

export const LobbyView: React.FC<LobbyViewProps> = ({
  room,
  currentPlayerId,
  onToggleReady,
  onStartRound1,
  onOpenShare
}) => {
  const isHost = room.hostId === currentPlayerId;
  const me = room.players.find(p => p.id === currentPlayerId);
  const readyCount = room.players.filter(p => p.isReady).length;
  const canStart = isHost && room.players.length >= 1;

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

          {/* Quick Share Box */}
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
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-cinema-red via-red-600 to-orange-600 hover:from-red-600 hover:to-orange-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-xl shadow-cinema-red/30 active:scale-95 transition-all disabled:opacity-50"
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
                    <span className="p-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center gap-1 text-xs font-semibold">
                      <CheckCircle className="w-4 h-4" />
                    </span>
                  ) : (
                    <span className="p-1.5 rounded-xl bg-slate-800 text-slate-500 flex items-center gap-1 text-xs">
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
              Jeder darf bis zu 3 Wunschfilme über unsere Film-Suche vorschlagen. Poster, Genre und Filminfos werden automatisch geladen.
            </p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-theater-900/50 border border-white/5 flex gap-3.5 items-start">
          <div className="p-2.5 rounded-xl bg-cinema-red/15 text-red-300 shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-white">Runde 2: Voting mit Likes & Dislikes</h4>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Alle stimmen über die Vorschläge ab. Mit Likes, Dislikes und deinem persönlichen Super-Vote (+2) kürt ihr den finalen Sieger!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
