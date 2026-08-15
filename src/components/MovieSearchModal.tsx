import React, { useState, useEffect } from 'react';
import { Search, X, Star, Plus, Film, Loader2 } from 'lucide-react';
import { SearchMovieResult } from '../types/game.js';
import { soundFx } from '../services/soundEffects.js';

interface MovieSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMovie: (movie: SearchMovieResult) => void;
  alreadyAddedIds: string[];
}

export const MovieSearchModal: React.FC<MovieSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectMovie,
  alreadyAddedIds
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchMovieResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const fetchMovies = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        if (data.results) {
          setResults(data.results);
        }
      } catch (err) {
        setError('Konnte Filme nicht laden');
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(() => {
      fetchMovies();
    }, query ? 300 : 0);

    return () => clearTimeout(timer);
  }, [query, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-2xl max-h-[85vh] glass-panel rounded-2xl flex flex-col border border-white/10 shadow-2xl overflow-hidden">
        {/* Header with Search Input */}
        <div className="p-4 sm:p-5 border-b border-white/10 relative">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Film className="w-5 h-5 text-cinema-red" />
              <h3 className="font-display font-bold text-lg text-white">Film suchen & vorschlagen</h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg bg-theater-900/60 hover:bg-theater-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="relative">
            <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              autoFocus
              placeholder="Film-Titel suchen (z. B. Inception, Dune, Barbie, Batman)..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-theater-900 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cinema-red transition-all"
            />
            {loading && (
              <Loader2 className="w-4 h-4 text-cinema-red animate-spin absolute right-3.5 top-1/2 -translate-y-1/2" />
            )}
          </div>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs text-center">
              {error}
            </div>
          )}

          {!loading && results.length === 0 && (
            <div className="py-12 text-center text-slate-400">
              <Film className="w-10 h-10 mx-auto text-slate-600 mb-2" />
              <p className="text-sm font-medium">Keine passenden Filme gefunden</p>
              <p className="text-xs text-slate-500 mt-1">Versuche einen anderen Suchbegriff</p>
            </div>
          )}

          {results.map((movie) => {
            const isAdded = alreadyAddedIds.includes(movie.id);
            return (
              <div
                key={movie.id}
                className={`flex gap-3.5 p-3 rounded-xl border transition-all ${
                  isAdded
                    ? 'bg-theater-900/40 border-white/5 opacity-60'
                    : 'bg-theater-900/70 border-white/10 hover:border-cinema-red/40 hover:bg-theater-850/80'
                }`}
              >
                <img
                  src={movie.poster}
                  alt={movie.title}
                  className="w-16 h-24 object-cover rounded-lg shrink-0 shadow-md bg-theater-950"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />

                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-display font-bold text-sm sm:text-base text-white truncate">
                        {movie.title}
                      </h4>
                      <span className="text-xs font-semibold text-slate-400 bg-theater-950 px-2 py-0.5 rounded shrink-0">
                        {movie.year}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center gap-1 text-cinema-gold text-xs font-bold">
                        <Star className="w-3.5 h-3.5 fill-cinema-gold" />
                        <span>{movie.rating}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {movie.genre.slice(0, 2).map((g) => (
                          <span
                            key={g}
                            className="text-[10px] bg-theater-800 text-slate-300 px-1.5 py-0.5 rounded"
                          >
                            {g}
                          </span>
                        ))}
                      </div>
                    </div>

                    <p className="text-xs text-slate-400 line-clamp-2 mt-1.5 leading-relaxed">
                      {movie.plot}
                    </p>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      disabled={isAdded}
                      onClick={() => {
                        soundFx.playPop();
                        onSelectMovie(movie);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                        isAdded
                          ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          : 'bg-cinema-red hover:bg-red-700 text-white shadow-md shadow-cinema-red/20 active:scale-95'
                      }`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{isAdded ? 'Bereits im Pool' : 'Vorschlagen'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
