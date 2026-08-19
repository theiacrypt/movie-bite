import React, { useState, useCallback } from 'react';
import { Plus, Film, Trash2, ArrowRight, Star, Info, Users, Sparkles, Heart, MessageSquare } from 'lucide-react';
import { RoomState, Movie } from '../types/game.js';
import { MovieSearchModal } from './MovieSearchModal.js';
import { MovieDetailModal } from './MovieDetailModal.js';
import { FavoritesModal } from './FavoritesModal.js';
import { soundFx } from '../services/soundEffects.js';
import { suppenstudiosAuth, FavoriteMovie } from '../services/suppenstudiosAuth.js';

interface Round1SuggestionsProps {
  room: RoomState;
  currentPlayerId: string;
  onAddMovie: (movie: any) => void;
  onRemoveMovie: (movieId: string) => void;
  onStartVoting: () => void;
  onOpenReview?: (movie: Movie) => void;
}

export const Round1Suggestions: React.FC<Round1SuggestionsProps> = ({
  room,
  currentPlayerId,
  onAddMovie,
  onRemoveMovie,
  onStartVoting,
  onOpenReview
}) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(false);
  const [selectedDetailMovie, setSelectedDetailMovie] = useState<Movie | null>(null);
  const [justFavorited, setJustFavorited] = useState<Set<string>>(new Set());

  const isHost = room.hostId === currentPlayerId;
  const myMovies = room.movies.filter(m => m.suggestedBy?.id === currentPlayerId);
  const maxLimit = room.settings?.maxSuggestionsPerPlayer ?? 3;
  const isUnlimited = maxLimit === 0;
  const canAddMore = isUnlimited || myMovies.length < maxLimit;
  const canStartVoting = isHost && room.movies.length >= 2;
  const alreadyAddedIds = room.movies.map(m => m.id);

  const handleToggleFavorite = useCallback((movie: Movie) => {
    if (suppenstudiosAuth.isFavorite(movie.id)) {
      suppenstudiosAuth.removeFavorite(movie.id);
    } else {
      suppenstudiosAuth.addFavorite({
        id: movie.id,
        title: movie.title,
        year: movie.year,
        poster: movie.poster,
        plot: movie.plot,
        genre: movie.genre,
        rating: movie.rating,
        runtime: movie.runtime,
        runtimeMinutes: movie.runtimeMinutes,
      });
      // Play heart pop animation
      setJustFavorited(prev => {
        const next = new Set(prev);
        next.add(movie.id);
        return next;
      });
      setTimeout(() => {
        setJustFavorited(prev => {
          const next = new Set(prev);
          next.delete(movie.id);
          return next;
        });
      }, 400);
    }
    soundFx.playPop();
  }, []);

  const handlePickFromFavorites = (favMovie: FavoriteMovie) => {
    if (!canAddMore) return;
    onAddMovie({
      id: favMovie.id,
      title: favMovie.title,
      year: favMovie.year,
      poster: favMovie.poster,
      plot: favMovie.plot,
      genre: favMovie.genre,
      rating: favMovie.rating,
      runtime: favMovie.runtime,
      runtimeMinutes: favMovie.runtimeMinutes,
    });
    setIsFavoritesOpen(false);
    soundFx.playPop();
  };

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
      {/* ─── Header Banner ──────────────────────── */}
      <div className="glass-panel glass-suggest rounded-3xl p-6 sm:p-8 border border-cinema-purple/20 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cinema-purple/15 border border-cinema-purple/30 text-purple-300 text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Runde 1 von 2</span>
          </div>
          <h2 className="font-display font-black text-2xl sm:text-3xl text-white">
            Filme vorschlagen
          </h2>
          <p className="text-sm text-slate-400 mt-1 max-w-lg">
            Suche nach deinen Wunschfilmen — oder wähle direkt aus deinen{' '}
            <span className="text-cinema-red font-semibold">Favoriten</span>!
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search button */}
          <button
            onClick={() => { soundFx.playPop(); setIsSearchOpen(true); }}
            disabled={!canAddMore}
            className={`px-5 py-3.5 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-xl active:scale-95 ${
              canAddMore
                ? 'bg-gradient-to-r from-cinema-red to-cinema-red-deep hover:from-cinema-red-hover hover:to-cinema-red text-white shadow-cinema-red/30'
                : 'bg-theater-800 text-slate-500 border border-white/5 cursor-not-allowed'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>
              {canAddMore
                ? isUnlimited
                  ? `Film suchen (${myMovies.length})`
                  : `Film suchen (${myMovies.length}/${maxLimit})`
                : `Limit (${maxLimit}/${maxLimit})`}
            </span>
          </button>

          {/* Favorites button */}
          <button
            onClick={() => { soundFx.playPop(); setIsFavoritesOpen(true); }}
            disabled={!canAddMore}
            className={`px-5 py-3.5 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-xl active:scale-95 border ${
              canAddMore
                ? 'bg-theater-850 hover:bg-theater-800 text-cinema-red border-cinema-red/30 hover:border-cinema-red/60 shadow-cinema-red/10'
                : 'bg-theater-900 text-slate-600 border-white/5 cursor-not-allowed'
            }`}
          >
            <Heart className={`w-4 h-4 ${canAddMore ? 'fill-cinema-red' : ''}`} />
            <span>Aus Favoriten</span>
          </button>

          {/* Start voting (host only) */}
          {isHost && (
            <button
              onClick={() => { soundFx.playPop(); onStartVoting(); }}
              disabled={!canStartVoting}
              className={`px-6 py-3.5 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-xl active:scale-95 ${
                canStartVoting
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-600/30'
                  : 'bg-theater-900 text-slate-500 border border-white/5 cursor-not-allowed'
              }`}
            >
              <span>Runde 2: Voting starten</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ─── Movie Pool ──────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Film className="w-5 h-5 text-cinema-red" />
            <h3 className="font-display font-bold text-lg text-white">
              Vorschlags-Pool ({room.movies.length})
            </h3>
          </div>
          {room.movies.length < 2 && (
            <span className="text-xs text-amber-400 font-medium bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
              Mindestens 2 Filme für das Voting benötigt
            </span>
          )}
        </div>

        {room.movies.length === 0 ? (
          <div className="glass-panel rounded-3xl p-12 text-center border border-white/5">
            <Film className="w-16 h-16 mx-auto text-slate-700 mb-3 animate-pulse" />
            <h4 className="font-display font-bold text-lg text-slate-300">Noch keine Filme vorgeschlagen</h4>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-sm mx-auto">
              Klicke auf <strong className="text-white">"Film suchen"</strong> oder{' '}
              <strong className="text-cinema-red">"Aus Favoriten"</strong>, um den ersten Film hinzuzufügen!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {room.movies.map(movie => {
              const isMine = movie.suggestedBy?.id === currentPlayerId;
              const canDelete = isMine || isHost;
              const isFav = suppenstudiosAuth.isFavorite(movie.id);
              const popping = justFavorited.has(movie.id);

              return (
                <div
                  key={movie.id}
                  className="glass-card rounded-2xl overflow-hidden border border-white/10 flex flex-col group relative"
                >
                  {/* Poster */}
                  <div
                    className="relative h-48 bg-theater-950 overflow-hidden cursor-pointer poster-scanlines"
                    onClick={() => setSelectedDetailMovie(movie)}
                  >
                    <img
                      src={movie.poster}
                      alt={movie.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-theater-950 via-theater-950/30 to-transparent" />

                    {/* Rating */}
                    <div className="absolute top-3 left-3 flex items-center gap-1 bg-theater-950/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-cinema-gold/30 text-cinema-gold text-xs font-bold shadow-lg">
                      <Star className="w-3.5 h-3.5 fill-cinema-gold" />
                      <span>{movie.rating}</span>
                    </div>

                    {/* Year */}
                    <div className="absolute top-3 right-3 bg-theater-950/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 text-slate-300 text-xs font-semibold">
                      {movie.year}
                    </div>

                    {/* Favorite button on poster */}
                    <button
                      onClick={e => { e.stopPropagation(); handleToggleFavorite(movie); }}
                      className={`absolute bottom-3 right-3 p-1.5 rounded-full backdrop-blur-md border transition-all z-10 ${
                        isFav
                          ? 'bg-cinema-red/90 border-cinema-red text-white'
                          : 'bg-theater-950/70 border-white/20 text-slate-400 hover:text-cinema-red hover:border-cinema-red/50 opacity-0 group-hover:opacity-100'
                      } ${popping ? 'heart-pop' : ''}`}
                      title={isFav ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen'}
                    >
                      <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-white' : ''}`} />
                    </button>

                    {/* Proposer */}
                    {movie.suggestedBy && (
                      <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-theater-950/85 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 text-[11px] text-slate-200">
                        <span>{movie.suggestedBy.avatar}</span>
                        <span className="font-medium truncate max-w-[100px]">{movie.suggestedBy.name}</span>
                      </div>
                    )}
                  </div>

                  {/* Card body */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3 bg-theater-900/60">
                    <div>
                      <h4
                        onClick={() => setSelectedDetailMovie(movie)}
                        className="font-display font-bold text-base text-white hover:text-cinema-red transition-colors cursor-pointer line-clamp-1"
                      >
                        {movie.title}
                      </h4>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {movie.genre.slice(0, 3).map(g => (
                          <span key={g} className="text-[10px] font-medium bg-theater-800 text-slate-300 px-2 py-0.5 rounded">
                            {g}
                          </span>
                        ))}
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-2 mt-2 leading-relaxed">{movie.plot}</p>
                    </div>

                    <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedDetailMovie(movie)}
                          className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
                        >
                          <Info className="w-3.5 h-3.5" />
                          <span>Details</span>
                        </button>
                        {onOpenReview && (
                          <button
                            onClick={() => onOpenReview(movie)}
                            className="text-xs text-slate-400 hover:text-amber-400 flex items-center gap-1 transition-colors"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>Reviews</span>
                          </button>
                        )}
                      </div>

                      {canDelete && (
                        <button
                          onClick={() => { soundFx.playPop(); onRemoveMovie(movie.id); }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          title="Vorschlag entfernen"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── Modals ──────────────────────────────── */}
      <MovieSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectMovie={m => { onAddMovie(m); setIsSearchOpen(false); }}
        alreadyAddedIds={alreadyAddedIds}
      />

      <FavoritesModal
        isOpen={isFavoritesOpen}
        onClose={() => setIsFavoritesOpen(false)}
        onPickMovie={handlePickFromFavorites}
        alreadyAddedIds={alreadyAddedIds}
      />

      <MovieDetailModal
        movie={selectedDetailMovie}
        onClose={() => setSelectedDetailMovie(null)}
      />
    </div>
  );
};
