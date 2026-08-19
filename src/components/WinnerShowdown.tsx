import React, { useEffect, useState } from 'react';
import { Trophy, Star, Heart, ThumbsDown, Sparkles, RotateCcw, ExternalLink, Play, Film, MessageSquare, Medal, MinusCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { MovieScore, Movie } from '../types/game.js';
import { soundFx } from '../services/soundEffects.js';
import { suppenstudiosAuth } from '../services/suppenstudiosAuth.js';
import { MovieDetailModal } from './MovieDetailModal.js';

interface WinnerShowdownProps {
  results: MovieScore[];
  isHost: boolean;
  onRestartGame: () => void;
  onOpenReview?: (movie: Movie) => void;
}

export const WinnerShowdown: React.FC<WinnerShowdownProps> = ({
  results,
  isHost,
  onRestartGame,
  onOpenReview
}) => {
  const winner = results[0];
  const [winnerFaved, setWinnerFaved] = useState(false);
  const [selectedDetailMovie, setSelectedDetailMovie] = useState<any>(null);

  useEffect(() => {
    soundFx.playWinner();
    // Burst confetti celebration
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0 }
        });
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 1 }
        });
      }, 350);
    } catch {
      // Ignore if canvas-confetti is not loaded
    }
  }, []);

  if (!winner) {
    return (
      <div className="max-w-md mx-auto p-8 text-center text-slate-400">
        Keine Ergebnisse verfügbar.
      </div>
    );
  }

  const trailerSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(`${winner.movie.title} ${winner.movie.year} trailer deutsch`)}`;
  const justWatchUrl = `https://www.justwatch.com/de/Suche?q=${encodeURIComponent(winner.movie.title)}`;

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-8 animate-in fade-in zoom-in-95 duration-500">
      {/* ─── Winner Showcase Card ─────────────────── */}
      <div className="glass-panel glass-winner rounded-3xl p-6 sm:p-8 border border-cinema-gold/30 shadow-2xl relative overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-cinema-gold/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6 sm:gap-8">
          {/* Winner Poster */}
          <div className="relative shrink-0 w-48 sm:w-56 rounded-2xl overflow-hidden shadow-2xl border-2 border-cinema-gold/40">
            <img
              src={winner.movie.poster}
              alt={winner.movie.title}
              className="w-full h-72 sm:h-80 object-cover"
            />
            <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-cinema-gold text-theater-950 px-3 py-1 rounded-xl text-xs font-black shadow-lg">
              <Trophy className="w-3.5 h-3.5 fill-theater-950" />
              <span>GEWINNER</span>
            </div>
          </div>

          {/* Winner Details */}
          <div className="flex-1 text-center md:text-left space-y-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cinema-gold/15 border border-cinema-gold/30 text-yellow-300 text-xs font-bold uppercase tracking-wider mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Filmabend-Wahl entschieden</span>
              </div>
              <h2 className="font-display font-black text-3xl sm:text-4xl text-white tracking-tight">
                {winner.movie.title}
              </h2>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-2">
                <span className="text-xs font-semibold text-slate-400 bg-theater-900 px-2.5 py-1 rounded-lg">
                  {winner.movie.year}
                </span>
                <span className="flex items-center gap-1 text-xs font-bold text-cinema-gold bg-theater-900 px-2.5 py-1 rounded-lg">
                  <Star className="w-3.5 h-3.5 fill-cinema-gold" />
                  <span>{winner.movie.rating}</span>
                </span>
                {winner.movie.runtime && (
                  <span className="text-xs text-slate-400 bg-theater-900 px-2.5 py-1 rounded-lg">
                    {winner.movie.runtime}
                  </span>
                )}
                {winner.movie.genre.map((g) => (
                  <span key={g} className="text-xs bg-theater-900 text-slate-300 px-2.5 py-1 rounded-lg">
                    {g}
                  </span>
                ))}
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed line-clamp-3 bg-theater-900/40 p-4 rounded-2xl border border-white/5">
              {winner.movie.plot}
            </p>

            {/* Score Breakdown Pills */}
            <div className="p-4 rounded-2xl bg-theater-950/60 border border-white/5 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
                <span>Ergebnis-Punkte</span>
                <span className="text-base font-black font-mono text-cinema-gold">
                  {winner.netScore > 0 ? `+${winner.netScore}` : winner.netScore} Punkte
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <div className="flex items-center justify-center gap-1 text-emerald-400 text-xs font-bold">
                    <Heart className="w-3.5 h-3.5 fill-emerald-400" />
                    <span>{winner.likes}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">Likes (+1)</span>
                </div>

                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <div className="flex items-center justify-center gap-1 text-yellow-400 text-xs font-bold">
                    <Star className="w-3.5 h-3.5 fill-yellow-400" />
                    <span>{winner.superlikes}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">Super (+2)</span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-500/10 border border-slate-500/20">
                  <div className="flex items-center justify-center gap-1 text-slate-300 text-xs font-bold">
                    <MinusCircle className="w-3.5 h-3.5" />
                    <span>{winner.neutrals || 0}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">Neutral (0)</span>
                </div>

                <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20">
                  <div className="flex items-center justify-center gap-1 text-red-400 text-xs font-bold">
                    <ThumbsDown className="w-3.5 h-3.5" />
                    <span>{winner.dislikes}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">Dislikes (-1)</span>
                </div>
              </div>
            </div>

            {/* Actions: Review / Favorite / YouTube / JustWatch */}
            <div className="space-y-2 pt-2">
              {/* Primary actions */}
              <div className="flex flex-col sm:flex-row gap-2">
                {onOpenReview && (
                  <button
                    onClick={() => onOpenReview(winner.movie as unknown as Movie)}
                    className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-cinema-purple to-violet-600 hover:from-purple-600 hover:to-violet-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cinema-purple/25 transition-all active:scale-95"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Rezension schreiben</span>
                  </button>
                )}
                <button
                  onClick={() => {
                    const m = winner.movie as any;
                    if (suppenstudiosAuth.isFavorite(m.id)) {
                      suppenstudiosAuth.removeFavorite(m.id);
                      setWinnerFaved(false);
                    } else {
                      suppenstudiosAuth.addFavorite({ id: m.id, title: m.title, year: m.year, poster: m.poster, plot: m.plot, genre: m.genre, rating: m.rating });
                      setWinnerFaved(true);
                    }
                    soundFx.playPop();
                  }}
                  className={`py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border transition-all active:scale-95 ${
                    winnerFaved || suppenstudiosAuth.isFavorite((winner.movie as any).id)
                      ? 'bg-cinema-red/20 border-cinema-red/40 text-cinema-red'
                      : 'bg-theater-850 border-white/15 text-slate-300 hover:border-cinema-red/30 hover:text-cinema-red'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${(winnerFaved || suppenstudiosAuth.isFavorite((winner.movie as any).id)) ? 'fill-cinema-red' : ''}`} />
                  <span>{(winnerFaved || suppenstudiosAuth.isFavorite((winner.movie as any).id)) ? 'In Favoriten' : 'Zu Favoriten'}</span>
                </button>
              </div>

              {/* Secondary actions */}
              <div className="flex flex-col sm:flex-row gap-2">
                <a
                  href={trailerSearchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2.5 px-4 rounded-xl bg-cinema-red hover:bg-red-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cinema-red/20 transition-all"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>Trailer</span>
                  <ExternalLink className="w-3 h-3 ml-auto" />
                </a>
                <a
                  href={justWatchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2.5 px-4 rounded-xl bg-cinema-gold/15 hover:bg-cinema-gold/25 text-cinema-gold font-bold text-xs flex items-center justify-center gap-2 border border-cinema-gold/30 transition-all"
                >
                  <Film className="w-4 h-4" />
                  <span>Wo streamen?</span>
                  <ExternalLink className="w-3 h-3 ml-auto" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Complete Leaderboard (Platz 2, 3, etc.) */}
      {results.length > 1 && (
        <div className="glass-panel rounded-3xl p-6 border border-white/10 space-y-4">
          <h3 className="font-display font-bold text-lg text-white flex items-center gap-2">
            <Medal className="w-5 h-5 text-slate-400" />
            <span>Rangliste aller Vorschläge</span>
          </h3>

          <div className="space-y-3">
            {results.slice(1).map((item, idx) => (
              <div
                key={item.movie.id}
                className="p-4 rounded-2xl bg-theater-900/60 border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-white/10 transition-all"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <span className="w-8 h-8 rounded-xl bg-theater-800 text-slate-300 font-black text-sm flex items-center justify-center shrink-0 border border-white/10">
                    #{idx + 2}
                  </span>
                  <img
                    src={item.movie.poster}
                    alt={item.movie.title}
                    className="w-12 h-16 object-cover rounded-lg shrink-0 shadow-md bg-theater-950 cursor-pointer"
                    onClick={() => setSelectedDetailMovie(item.movie)}
                  />
                  <div className="min-w-0">
                    <h4
                      onClick={() => setSelectedDetailMovie(item.movie)}
                      className="font-display font-bold text-sm sm:text-base text-white hover:text-cinema-red cursor-pointer truncate transition-colors"
                    >
                      {item.movie.title}
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                      <span>{item.movie.year}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-cinema-gold">
                        <Star className="w-3 h-3 fill-cinema-gold" />
                        <span>{item.movie.rating}</span>
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0 sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-white/5">
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-emerald-400 font-semibold flex items-center gap-1" title="Likes">
                      <Heart className="w-3.5 h-3.5 fill-emerald-400" /> {item.likes}
                    </span>
                    <span className="text-yellow-400 font-semibold flex items-center gap-1" title="Super-Votes">
                      <Star className="w-3.5 h-3.5 fill-yellow-400" /> {item.superlikes}
                    </span>
                    <span className="text-slate-300 font-semibold flex items-center gap-1" title="Neutrale Stimmen">
                      <MinusCircle className="w-3.5 h-3.5" /> {item.neutrals || 0}
                    </span>
                    <span className="text-red-400 font-semibold flex items-center gap-1" title="Dislikes">
                      <ThumbsDown className="w-3.5 h-3.5" /> {item.dislikes}
                    </span>
                  </div>

                  <span className="font-mono font-black text-sm text-slate-200 bg-theater-800 px-3 py-1 rounded-xl border border-white/5">
                    {item.netScore > 0 ? `+${item.netScore}` : item.netScore} Pkt
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Restart / Play Again Button */}
      {isHost && (
        <div className="text-center pt-4">
          <button
            onClick={() => {
              soundFx.playPop();
              onRestartGame();
            }}
            className="px-8 py-4 rounded-2xl bg-theater-850 hover:bg-theater-800 text-white font-bold text-sm inline-flex items-center gap-2.5 border border-white/15 shadow-xl transition-all active:scale-95"
          >
            <RotateCcw className="w-4 h-4 text-cinema-red" />
            <span>Neuen Durchgang im gleichen Raum starten</span>
          </button>
        </div>
      )}

      <MovieDetailModal
        movie={selectedDetailMovie}
        onClose={() => setSelectedDetailMovie(null)}
      />
    </div>
  );
};
