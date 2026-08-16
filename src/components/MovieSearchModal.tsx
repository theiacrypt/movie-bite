import React, { useState, useEffect, useMemo } from 'react';
import { Search, X, Star, Plus, Film, Loader2, Music, SlidersHorizontal, Clock, ArrowUpDown, Sparkles, RotateCcw, Check } from 'lucide-react';
import { SearchMovieResult } from '../types/game.js';
import { soundFx } from '../services/soundEffects.js';
import { getBackendBaseUrl } from '../services/socket.js';

interface MovieSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMovie: (movie: SearchMovieResult) => void;
  alreadyAddedIds: string[];
}

const GENRES = [
  'Alle',
  'Action',
  'Sci-Fi',
  'Komödie',
  'Drama',
  'Horror',
  'Animation',
  'Abenteuer',
  'Thriller',
  'Fantasy',
  'Musik',
  'Krimi',
  'Romantik',
  'Dokumentation'
];

type RuntimeFilter = 'all' | 'short' | 'medium' | 'long';
type SortOption = 'popularity' | 'rating' | 'year' | 'runtime';

export const MovieSearchModal: React.FC<MovieSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectMovie,
  alreadyAddedIds
}) => {
  const [query, setQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('Alle');
  const [soundtrackOnly, setSoundtrackOnly] = useState(false);
  const [minRating, setMinRating] = useState<number>(0);
  const [runtimeFilter, setRuntimeFilter] = useState<RuntimeFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('popularity');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const [results, setResults] = useState<SearchMovieResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedGenre !== 'Alle') count++;
    if (soundtrackOnly) count++;
    if (minRating > 0) count++;
    if (runtimeFilter !== 'all') count++;
    if (sortBy !== 'popularity') count++;
    return count;
  }, [selectedGenre, soundtrackOnly, minRating, runtimeFilter, sortBy]);

  const handleResetFilters = () => {
    soundFx.playPop();
    setSelectedGenre('Alle');
    setSoundtrackOnly(false);
    setMinRating(0);
    setRuntimeFilter('all');
    setSortBy('popularity');
  };

  useEffect(() => {
    if (!isOpen) return;

    const fetchMovies = async () => {
      setLoading(true);
      setError(null);
      try {
        const baseUrl = getBackendBaseUrl();
        const params = new URLSearchParams();
        if (query.trim()) params.set('q', query.trim());
        if (selectedGenre !== 'Alle') params.set('genre', selectedGenre);
        if (soundtrackOnly) params.set('soundtrack', 'true');
        if (minRating > 0) params.set('minRating', minRating.toString());
        if (runtimeFilter !== 'all') params.set('runtime', runtimeFilter);
        if (sortBy !== 'popularity') params.set('sortBy', sortBy);

        const res = await fetch(`${baseUrl}/api/search?${params.toString()}`);
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
  }, [query, selectedGenre, soundtrackOnly, minRating, runtimeFilter, sortBy, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 animate-in fade-in">
      {/* Backdrop with negative inset to ensure entire screen including edges is completely blurred */}
      <div 
        className="fixed -inset-10 bg-black/80 backdrop-blur-md cursor-pointer"
        onClick={onClose}
      />

      <div className="relative z-10 w-full max-w-3xl max-h-[90vh] glass-panel rounded-2xl sm:rounded-3xl flex flex-col border border-white/10 shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 relative bg-theater-900/60 shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-cinema-red/20 border border-cinema-red/30 flex items-center justify-center text-cinema-red">
                <Film className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-display font-bold text-base sm:text-lg text-white">Film suchen & vorschlagen</h3>
                <p className="text-[11px] text-slate-400">Entdecke Filme nach Genre, Soundtrack, Bewertung & Länge</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg bg-theater-900/80 hover:bg-theater-800 border border-white/5 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search Input Bar */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              autoFocus
              placeholder="Titel suchen (z. B. Interstellar, Inception, Dune, Barbie)..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-theater-950 border border-white/10 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cinema-red transition-all"
            />
            {query ? (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : loading ? (
              <Loader2 className="w-4 h-4 text-cinema-red animate-spin absolute right-3.5 top-1/2 -translate-y-1/2" />
            ) : null}
          </div>

          {/* Quick Filter Row */}
          <div className="flex items-center gap-2 mt-3 overflow-x-auto no-scrollbar py-1">
            {/* Toggle Advanced Filters Button */}
            <button
              onClick={() => {
                soundFx.playPop();
                setShowAdvancedFilters(prev => !prev);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all border ${
                showAdvancedFilters || activeFiltersCount > 0
                  ? 'bg-theater-800 border-cinema-red/40 text-cinema-red'
                  : 'bg-theater-900 border-white/10 text-slate-300 hover:text-white hover:bg-theater-850'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filter {activeFiltersCount > 0 && `(${activeFiltersCount})`}</span>
            </button>

            {/* Quick Genre Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {GENRES.slice(0, 8).map((genre) => {
                const isSelected = selectedGenre === genre;
                return (
                  <button
                    key={genre}
                    onClick={() => {
                      soundFx.playPop();
                      setSelectedGenre(genre);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all border ${
                      isSelected
                        ? 'bg-cinema-red text-white border-cinema-red shadow-sm shadow-cinema-red/20'
                        : 'bg-theater-900/90 text-slate-400 border-white/5 hover:text-slate-200 hover:bg-theater-850'
                    }`}
                  >
                    {genre}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Collapsible Advanced Filters Drawer */}
          {showAdvancedFilters && (
            <div className="mt-3 p-3.5 rounded-2xl bg-theater-950/80 border border-white/10 space-y-3 animate-in fade-in slide-in-from-top-2">
              {/* All Genres Row */}
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                  Kategorie / Genre
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {GENRES.map((genre) => {
                    const isSelected = selectedGenre === genre;
                    return (
                      <button
                        key={genre}
                        onClick={() => {
                          soundFx.playPop();
                          setSelectedGenre(genre);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all border ${
                          isSelected
                            ? 'bg-cinema-red text-white border-cinema-red shadow-sm'
                            : 'bg-theater-900 text-slate-400 border-white/5 hover:text-slate-200 hover:bg-theater-850'
                        }`}
                      >
                        {genre}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1 border-t border-white/5">
                {/* Soundtrack / Filmmusik */}
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1 mb-1.5">
                    <Music className="w-3 h-3 text-purple-400" /> Filmmusik
                  </span>
                  <div className="grid grid-cols-2 gap-1">
                    <button
                      onClick={() => {
                        soundFx.playPop();
                        setSoundtrackOnly(false);
                      }}
                      className={`py-1 px-1 rounded-lg text-[11px] font-bold border transition-all text-center ${
                        !soundtrackOnly
                          ? 'bg-theater-800 text-white border-white/20'
                          : 'bg-theater-900 text-slate-400 border-white/5 hover:text-white hover:bg-theater-850'
                      }`}
                    >
                      Alle
                    </button>
                    <button
                      onClick={() => {
                        soundFx.playPop();
                        setSoundtrackOnly(true);
                      }}
                      className={`py-1 px-1 rounded-lg text-[11px] font-bold border transition-all text-center ${
                        soundtrackOnly
                          ? 'bg-purple-600 text-white border-purple-400 font-black shadow-sm shadow-purple-500/30'
                          : 'bg-theater-900 text-slate-400 border-white/5 hover:text-white hover:bg-theater-850'
                      }`}
                    >
                      🎵 Highlights
                    </button>
                  </div>
                </div>

                {/* Min Rating */}
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1 mb-1.5">
                    <Star className="w-3 h-3 text-cinema-gold" /> Mindestbewertung
                  </span>
                  <div className="grid grid-cols-4 gap-1">
                    {[
                      { val: 0, label: 'Alle' },
                      { val: 7.0, label: '7.0+' },
                      { val: 8.0, label: '8.0+' },
                      { val: 8.5, label: '8.5+ 🏆' }
                    ].map((item) => (
                      <button
                        key={item.val}
                        onClick={() => {
                          soundFx.playPop();
                          setMinRating(item.val);
                        }}
                        className={`py-1 px-1 rounded-lg text-[11px] font-bold border transition-all text-center ${
                          minRating === item.val
                            ? 'bg-cinema-gold text-theater-950 border-cinema-gold font-black'
                            : 'bg-theater-900 text-slate-400 border-white/5 hover:text-white hover:bg-theater-850'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Runtime / Length */}
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1 mb-1.5">
                    <Clock className="w-3 h-3 text-cinema-neon" /> Spielfilmlänge
                  </span>
                  <div className="grid grid-cols-4 gap-1">
                    {[
                      { val: 'all', label: 'Alle' },
                      { val: 'short', label: '< 100m' },
                      { val: 'medium', label: '100-140' },
                      { val: 'long', label: '> 140m' }
                    ].map((item) => (
                      <button
                        key={item.val}
                        onClick={() => {
                          soundFx.playPop();
                          setRuntimeFilter(item.val as RuntimeFilter);
                        }}
                        className={`py-1 px-1 rounded-lg text-[11px] font-bold border transition-all text-center ${
                          runtimeFilter === item.val
                            ? 'bg-cinema-neon text-theater-950 border-cinema-neon font-black'
                            : 'bg-theater-900 text-slate-400 border-white/5 hover:text-white hover:bg-theater-850'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sort Option */}
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1 mb-1.5">
                    <ArrowUpDown className="w-3 h-3 text-slate-300" /> Sortierung
                  </span>
                  <select
                    value={sortBy}
                    onChange={(e) => {
                      soundFx.playPop();
                      setSortBy(e.target.value as SortOption);
                    }}
                    className="w-full bg-theater-900 text-xs font-semibold text-white border border-white/10 rounded-lg p-1.5 focus:outline-none focus:border-cinema-red"
                  >
                    <option value="popularity">🔥 Beliebteste</option>
                    <option value="rating">⭐ Beste Bewertung</option>
                    <option value="year">📅 Neueste zuerst</option>
                    <option value="runtime">⏱️ Kürzeste zuerst</option>
                  </select>
                </div>
              </div>

              {/* Reset Bar */}
              {activeFiltersCount > 0 && (
                <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs">
                  <span className="text-slate-400 text-[11px]">
                    {activeFiltersCount} {activeFiltersCount === 1 ? 'Filter' : 'Filter'} aktiv
                  </span>
                  <button
                    onClick={handleResetFilters}
                    className="flex items-center gap-1 text-cinema-red hover:text-red-400 font-semibold"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Alle Filter zurücksetzen</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-3">
          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs text-center">
              {error}
            </div>
          )}

          {!loading && results.length === 0 && (
            <div className="py-12 text-center text-slate-400">
              <Film className="w-10 h-10 mx-auto text-slate-600 mb-2" />
              <p className="text-sm font-medium">Keine passenden Filme für diese Kriterien gefunden</p>
              <p className="text-xs text-slate-500 mt-1">Versuche andere Filter oder einen kürzeren Suchbegriff</p>
              {activeFiltersCount > 0 && (
                <button
                  onClick={handleResetFilters}
                  className="mt-3 px-3 py-1.5 bg-theater-800 hover:bg-theater-700 text-xs text-white rounded-lg border border-white/10 inline-flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Filter zurücksetzen</span>
                </button>
              )}
            </div>
          )}

          {results.map((movie) => {
            const isAdded = alreadyAddedIds.includes(movie.id);
            return (
              <div
                key={movie.id}
                className={`flex gap-3.5 p-3 rounded-2xl border transition-all ${
                  isAdded
                    ? 'bg-theater-900/40 border-white/5 opacity-60'
                    : 'bg-theater-900/70 border-white/10 hover:border-cinema-red/40 hover:bg-theater-850/80 shadow-md'
                }`}
              >
                <img
                  src={movie.poster}
                  alt={movie.title}
                  className="w-16 sm:w-20 h-24 sm:h-28 object-cover rounded-xl shrink-0 shadow-md bg-theater-950"
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
                      <span className="text-xs font-semibold text-slate-400 bg-theater-950 px-2 py-0.5 rounded-md shrink-0 border border-white/5">
                        {movie.year}
                      </span>
                    </div>

                    {/* Badges & Meta */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                      <div className="flex items-center gap-1 text-cinema-gold text-xs font-bold bg-theater-950 px-2 py-0.5 rounded border border-cinema-gold/20">
                        <Star className="w-3.5 h-3.5 fill-cinema-gold" />
                        <span>{movie.rating}</span>
                      </div>

                      {movie.runtime && (
                        <div className="flex items-center gap-1 text-slate-300 text-[11px] bg-theater-950 px-2 py-0.5 rounded border border-white/5">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{movie.runtime}</span>
                        </div>
                      )}

                      {movie.genre.slice(0, 2).map((g) => (
                        <span
                          key={g}
                          className="text-[10px] bg-theater-800 text-slate-300 px-1.5 py-0.5 rounded border border-white/5"
                        >
                          {g}
                        </span>
                      ))}

                      {movie.soundtrackHighlight && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-purple-950/80 text-purple-300 px-2 py-0.5 rounded border border-purple-500/30">
                          <Music className="w-2.5 h-2.5 text-purple-400" />
                          <span>{movie.soundtrackHighlight}</span>
                        </span>
                      )}
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
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                        isAdded
                          ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          : 'bg-gradient-to-r from-cinema-red to-cinema-red-deep hover:from-cinema-red-hover hover:to-cinema-red text-white shadow-md shadow-cinema-red/20 active:scale-95'
                      }`}
                    >
                      {isAdded ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Bereits im Pool</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          <span>Vorschlagen</span>
                        </>
                      )}
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

