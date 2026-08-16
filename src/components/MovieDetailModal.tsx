import React from 'react';
import { X, Star, Calendar, Clock, Film, ExternalLink, Play } from 'lucide-react';
import { Movie } from '../types/game.js';

interface MovieDetailModalProps {
  movie: Movie | null;
  onClose: () => void;
}

export const MovieDetailModal: React.FC<MovieDetailModalProps> = ({ movie, onClose }) => {
  if (!movie) return null;

  const trailerSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(movie.title + ' ' + movie.year + ' trailer deutsch')}`;
  const justWatchUrl = `https://www.justwatch.com/de/suche?q=${encodeURIComponent(movie.title)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in">
      <div 
        className="fixed -inset-10 bg-black/80 backdrop-blur-md cursor-pointer"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-xl glass-panel rounded-2xl overflow-hidden border border-white/10 shadow-2xl relative flex flex-col max-h-[90vh]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 text-slate-300 hover:text-white rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-sm transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="relative h-48 sm:h-64 bg-theater-950 overflow-hidden shrink-0">
          <img
            src={movie.backdrop || movie.poster}
            alt={movie.title}
            className="w-full h-full object-cover opacity-40 blur-sm scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-theater-950 via-theater-950/60 to-transparent" />
          
          <div className="absolute bottom-4 left-4 right-4 flex gap-4 items-end">
            <img
              src={movie.poster}
              alt={movie.title}
              className="w-24 sm:w-28 h-36 sm:h-40 object-cover rounded-xl shadow-2xl border-2 border-white/20 shrink-0 bg-theater-900"
            />
            <div className="min-w-0">
              <h3 className="font-display font-black text-xl sm:text-2xl text-white leading-tight drop-shadow-md">
                {movie.title}
              </h3>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className="flex items-center gap-1 text-cinema-gold text-xs font-bold bg-theater-900/80 px-2 py-0.5 rounded border border-cinema-gold/30">
                  <Star className="w-3.5 h-3.5 fill-cinema-gold" />
                  {movie.rating}
                </span>
                <span className="flex items-center gap-1 text-slate-300 text-xs bg-theater-900/80 px-2 py-0.5 rounded border border-white/10">
                  <Calendar className="w-3.5 h-3.5" />
                  {movie.year}
                </span>
                {movie.runtime && (
                  <span className="flex items-center gap-1 text-slate-300 text-xs bg-theater-900/80 px-2 py-0.5 rounded border border-white/10">
                    <Clock className="w-3.5 h-3.5" />
                    {movie.runtime}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="p-5 overflow-y-auto space-y-4">
          <div className="flex flex-wrap gap-1.5">
            {movie.genre.map((g) => (
              <span
                key={g}
                className="text-xs font-medium px-2.5 py-1 rounded-md bg-theater-800 text-slate-300 border border-white/5"
              >
                {g}
              </span>
            ))}
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Handlung & Synopsis</h4>
            <p className="text-sm text-slate-200 leading-relaxed bg-theater-900/50 p-3 rounded-xl border border-white/5">
              {movie.plot}
            </p>
          </div>

          {movie.suggestedBy && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-theater-900/60 border border-white/5 text-xs text-slate-300">
              <span className="text-lg">{movie.suggestedBy.avatar}</span>
              <span>Vorgeschlagen von <strong className="text-white">{movie.suggestedBy.name}</strong></span>
            </div>
          )}

          <div className="pt-2 flex flex-col sm:flex-row gap-2">
            <a
              href={trailerSearchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-2.5 px-4 rounded-xl bg-theater-800 hover:bg-theater-700 text-white text-xs font-semibold flex items-center justify-center gap-2 border border-white/10 transition-colors"
            >
              <Play className="w-3.5 h-3.5 text-cinema-red" />
              <span>Trailer auf YouTube suchen</span>
              <ExternalLink className="w-3 h-3 text-slate-400 ml-auto" />
            </a>

            <a
              href={justWatchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-2.5 px-4 rounded-xl bg-cinema-gold/15 hover:bg-cinema-gold/25 text-cinema-gold text-xs font-semibold flex items-center justify-center gap-2 border border-cinema-gold/30 transition-colors"
            >
              <Film className="w-3.5 h-3.5" />
              <span>Wo streamen? (JustWatch)</span>
              <ExternalLink className="w-3 h-3 text-cinema-gold/60 ml-auto" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
