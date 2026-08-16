import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Search, Film, Users, Heart, UserPlus, UserMinus, Star,
  X, Loader2, Clapperboard, Sparkles, Crown, TrendingUp
} from 'lucide-react';
import { suppenstudiosAuth, UserSearchResult, FavoriteMovie, User } from '../services/suppenstudiosAuth.js';
import { searchMoviesUniversal } from '../services/movieSearch.js';
import { soundFx } from '../services/soundEffects.js';

interface MovieResult {
  id: string;
  title: string;
  year: string;
  poster: string;
  rating: number;
  genre: string[];
  plot?: string;
}

interface DiscoverPanelProps {
  onOpenAuth?: () => void;
  onOpenReview?: (movie: MovieResult) => void;
}

type SearchTab = 'movies' | 'users';

const QUICK_SEARCHES = ['Action', 'Horror', 'Romantik', 'Sci-Fi', 'Anime', 'Thriller'];

const CHEF_USERNAME = 'Chef';

export const DiscoverPanel: React.FC<DiscoverPanelProps> = ({ onOpenAuth, onOpenReview }) => {
  const [tab, setTab] = useState<SearchTab>('movies');
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Movie state
  const [movieResults, setMovieResults] = useState<MovieResult[]>([]);
  const [movieLoading, setMovieLoading] = useState(false);
  const [movieError, setMovieError] = useState<string | null>(null);
  const [favChanged, setFavChanged] = useState(0); // force re-render on fav toggle

  // User state
  const [userResults, setUserResults] = useState<UserSearchResult[]>([]);
  const [userLoading, setUserLoading] = useState(false);
  const [followChanged, setFollowChanged] = useState(0);

  const [currentUser, setCurrentUser] = useState<User | null>(suppenstudiosAuth.getUser());
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsub = suppenstudiosAuth.subscribe(setCurrentUser);
    return unsub;
  }, []);

  // Debounce query
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  // Search movies
  useEffect(() => {
    if (tab !== 'movies') return;
    if (!debouncedQuery.trim()) { setMovieResults([]); return; }

    let cancelled = false;
    setMovieLoading(true);
    setMovieError(null);

    searchMoviesUniversal({ query: debouncedQuery.trim() })
      .then(results => {
        if (!cancelled) {
          setMovieResults((results || []).slice(0, 16));
          setMovieLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setMovieError('Suche fehlgeschlagen');
          setMovieLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [debouncedQuery, tab]);

  // Search users
  useEffect(() => {
    if (tab !== 'users') return;
    if (!debouncedQuery.trim()) { setUserResults([]); return; }

    let cancelled = false;
    setUserLoading(true);

    suppenstudiosAuth.searchUsers(debouncedQuery).then(results => {
      if (!cancelled) {
        // If API returns empty, synthesize a "try follow" placeholder
        setUserResults(results);
        setUserLoading(false);
      }
    });

    return () => { cancelled = true; };
  }, [debouncedQuery, tab]);

  const handleToggleFav = useCallback((movie: MovieResult) => {
    if (suppenstudiosAuth.isFavorite(movie.id)) {
      suppenstudiosAuth.removeFavorite(movie.id);
    } else {
      suppenstudiosAuth.addFavorite({
        id: movie.id,
        title: movie.title,
        year: movie.year,
        poster: movie.poster,
        plot: movie.plot ?? '',
        genre: movie.genre,
        rating: movie.rating,
      });
    }
    setFavChanged(n => n + 1);
    soundFx.playPop();
  }, []);

  const handleToggleFollow = useCallback((user: UserSearchResult) => {
    if (!currentUser) { onOpenAuth?.(); return; }
    if (suppenstudiosAuth.isFollowing(user.username)) {
      suppenstudiosAuth.unfollowUser(user.username);
    } else {
      suppenstudiosAuth.followUser(user.username, user.username);
    }
    setFollowChanged(n => n + 1);
    soundFx.playPop();
  }, [currentUser, onOpenAuth]);

  const hasResults = tab === 'movies' ? movieResults.length > 0 : userResults.length > 0;
  const isLoading  = tab === 'movies' ? movieLoading : userLoading;
  const showEmpty  = debouncedQuery.trim() && !isLoading && !hasResults;

  // "Exact follow" shortcut when no user API results
  const canDirectFollow =
    tab === 'users' && debouncedQuery.trim().length >= 2 && !userLoading && userResults.length === 0 && debouncedQuery.trim() !== '';

  return (
    <div className="w-full max-w-4xl mx-auto mt-6 space-y-4">
      {/* ─── Search Bar Capsule ─────────────────────── */}
      <div className="glass-panel p-2 rounded-2xl sm:rounded-3xl border border-white/10 shadow-2xl space-y-2 sm:space-y-0 sm:flex sm:items-center sm:gap-2.5 focus-within:border-cinema-red/50 focus-within:ring-2 focus-within:ring-cinema-red/15 transition-all">
        {/* Tab pills */}
        <div className="flex p-1 bg-theater-950/80 rounded-xl sm:rounded-2xl border border-white/5 shrink-0">
          <button
            type="button"
            onClick={() => { setTab('movies'); soundFx.playPop(); inputRef.current?.focus(); }}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg sm:rounded-xl text-xs font-bold transition-all ${
              tab === 'movies'
                ? 'bg-gradient-to-r from-cinema-red to-cinema-red-deep text-white shadow-md shadow-cinema-red/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            <span>Filme</span>
          </button>
          <button
            type="button"
            onClick={() => { setTab('users'); soundFx.playPop(); inputRef.current?.focus(); }}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg sm:rounded-xl text-xs font-bold transition-all ${
              tab === 'users'
                ? 'bg-cinema-green/20 text-cinema-green border border-cinema-green/30 shadow-md shadow-cinema-green/10'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Nutzer</span>
          </button>
        </div>

        {/* Desktop Divider */}
        <div className="hidden sm:block w-px h-6 bg-white/10 shrink-0" />

        {/* Input Field */}
        <div className="relative flex-1 flex items-center">
          <Search className="w-4 h-4 absolute left-3 text-slate-400 pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={tab === 'movies' ? 'Film suchen — Titel, Genre, Regie...' : 'Nutzer suchen — Username eingeben...'}
            className="w-full bg-theater-950/50 sm:bg-transparent border sm:border-0 border-white/5 rounded-xl sm:rounded-none pl-9 pr-9 py-2.5 sm:py-2 text-sm text-white placeholder-slate-500 focus:outline-none"
          />

          {/* Right Icon / Clear / Spinner */}
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center">
            {isLoading ? (
              <Loader2 className="w-4 h-4 text-cinema-red animate-spin" />
            ) : query ? (
              <button
                type="button"
                onClick={() => { setQuery(''); soundFx.playPop(); inputRef.current?.focus(); }}
                className="p-1 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                title="Löschen"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {/* ─── Quick Searches (movie tab, no query) ───── */}
      {tab === 'movies' && !query && (
        <div className="flex items-center gap-2 flex-wrap px-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Quick:</span>
          {QUICK_SEARCHES.map(term => (
            <button
              key={term}
              onClick={() => { setQuery(term); soundFx.playPop(); }}
              className="text-[11px] font-semibold px-3 py-1 rounded-full bg-theater-900/80 border border-white/10 text-slate-300 hover:border-cinema-red/40 hover:text-white hover:bg-theater-800 transition-all active:scale-95 shadow-sm"
            >
              {term}
            </button>
          ))}
        </div>
      )}

      {/* ─── Results ────────────────────────────────── */}
      {hasResults && (
        <div className="animate-slideUp">

          {/* MOVIE RESULTS */}
          {tab === 'movies' && (
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-3 px-1">
                {movieResults.length} Ergebnisse für „{debouncedQuery}"
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {movieResults.map(movie => {
                  const isFav = suppenstudiosAuth.isFavorite(movie.id);
                  return (
                    <div
                      key={movie.id}
                      className="group relative rounded-2xl overflow-hidden bg-theater-900 border border-white/8 hover:border-cinema-red/40 transition-all cursor-pointer"
                    >
                      {/* Poster */}
                      <div className="relative aspect-[2/3] overflow-hidden poster-scanlines">
                        {movie.poster ? (
                          <img
                            src={movie.poster.startsWith('http') ? movie.poster : `https://image.tmdb.org/t/p/w342${movie.poster}`}
                            alt={movie.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onClick={() => onOpenReview?.(movie)}
                          />
                        ) : (
                          <div className="w-full h-full bg-theater-800 flex items-center justify-center">
                            <Film className="w-8 h-8 text-slate-600" />
                          </div>
                        )}
                        {/* Overlay gradient */}
                        <div className="absolute inset-0 bg-gradient-to-t from-theater-950 via-transparent to-transparent" />

                        {/* Rating badge */}
                        <div className="absolute top-2 left-2 bg-theater-950/85 backdrop-blur-sm px-1.5 py-0.5 rounded-lg text-[10px] font-bold text-cinema-gold flex items-center gap-0.5 border border-cinema-gold/20">
                          <Star className="w-2.5 h-2.5 fill-cinema-gold" />
                          {movie.rating}
                        </div>

                        {/* Favorite button */}
                        <button
                          onClick={(e) => { e.stopPropagation(); handleToggleFav(movie); }}
                          className={`absolute bottom-2 right-2 p-1.5 rounded-full backdrop-blur-sm border transition-all ${
                            isFav
                              ? 'bg-cinema-red text-white border-cinema-red shadow-md shadow-cinema-red/30'
                              : 'bg-theater-950/70 border-white/20 text-slate-400 hover:text-cinema-red hover:border-cinema-red/50 opacity-0 group-hover:opacity-100'
                          }`}
                          title={isFav ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen'}
                        >
                          <Heart className={`w-3 h-3 ${isFav ? 'fill-white' : ''}`} />
                        </button>

                        {/* Chef crown */}
                        {movie.title === 'Chef' && (
                          <div className="absolute top-2 right-2">
                            <Crown className="w-3.5 h-3.5 text-cinema-gold fill-cinema-gold" />
                          </div>
                        )}
                      </div>

                      {/* Card info */}
                      <div className="p-2.5">
                        <p className="text-xs font-bold text-white line-clamp-1 leading-tight">
                          {movie.title}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {movie.year} {movie.genre?.[0] && `· ${movie.genre[0]}`}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* USER RESULTS */}
          {tab === 'users' && (
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-3 px-1">
                {userResults.length} Nutzer gefunden
              </p>
              <div className="space-y-2">
                {userResults.map(user => {
                  const isChef = user.username.toLowerCase() === CHEF_USERNAME.toLowerCase();
                  const following = suppenstudiosAuth.isFollowing(user.username);
                  return (
                    <div
                      key={user.username}
                      className={`flex items-center gap-4 p-3.5 rounded-2xl border transition-all ${
                        isChef
                          ? 'bg-theater-900/80 border-cinema-gold/30 shadow-sm shadow-cinema-gold/10'
                          : 'bg-theater-900/60 border-white/8 hover:border-cinema-green/30'
                      }`}
                    >
                      {/* Avatar */}
                      <div className={`w-11 h-11 rounded-full flex items-center justify-center text-lg font-black shrink-0 shadow-md ${
                        isChef
                          ? 'bg-gradient-to-br from-cinema-gold to-amber-600 text-theater-950'
                          : 'bg-gradient-to-br from-cinema-green/30 to-cinema-green/10 text-cinema-green border border-cinema-green/30'
                      }`}>
                        {isChef ? <Crown className="w-5 h-5" /> : user.username.substring(0, 1).toUpperCase()}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-bold ${isChef ? 'text-cinema-gold neon-text-gold' : 'text-white'}`}>
                            {user.username}
                          </span>
                          {isChef && (
                            <span className="chef-badge">
                              <Crown className="w-2.5 h-2.5" />Chef
                            </span>
                          )}
                        </div>
                        {user.favoriteCount !== undefined && (
                          <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Heart className="w-2.5 h-2.5 text-cinema-red" />
                            {user.favoriteCount} Favoriten
                          </p>
                        )}
                      </div>

                      {/* Follow button */}
                      <button
                        onClick={() => handleToggleFollow(user)}
                        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all active:scale-95 ${
                          following
                            ? 'bg-cinema-green/10 border-cinema-green/30 text-cinema-green hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400'
                            : 'bg-theater-800 border-white/10 text-slate-200 hover:border-cinema-green/40 hover:text-cinema-green'
                        }`}
                      >
                        {following
                          ? <><UserMinus className="w-3.5 h-3.5" />Gefolgt</>
                          : <><UserPlus className="w-3.5 h-3.5" />Folgen</>
                        }
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── Direct follow shortcut (no API results) ── */}
      {canDirectFollow && (
        <div className="animate-slideUp flex items-center gap-4 p-4 rounded-2xl border border-cinema-green/20 bg-cinema-green/5">
          <div className="w-10 h-10 rounded-full bg-cinema-green/15 border border-cinema-green/30 flex items-center justify-center text-cinema-green font-black text-sm shrink-0">
            {debouncedQuery.trim().substring(0, 1).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white">{debouncedQuery.trim()}</p>
            <p className="text-[10px] text-slate-400">Direkt diesem Username folgen</p>
          </div>
          <button
            onClick={() => {
              if (!currentUser) { onOpenAuth?.(); return; }
              suppenstudiosAuth.followUser(debouncedQuery.trim(), debouncedQuery.trim());
              setFollowChanged(n => n + 1);
              soundFx.playPop();
              setQuery('');
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-cinema-green/15 border border-cinema-green/40 text-cinema-green hover:bg-cinema-green/25 transition-all active:scale-95"
          >
            <UserPlus className="w-3.5 h-3.5" />
            Folgen
          </button>
        </div>
      )}

      {/* ─── Empty state ────────────────────────────── */}
      {showEmpty && !canDirectFollow && (
        <div className="text-center py-8 space-y-2 animate-slideUp">
          {tab === 'movies'
            ? <><Clapperboard className="w-10 h-10 mx-auto text-slate-700 mb-2" /><p className="text-sm text-slate-400">Keine Filme für „{debouncedQuery}" gefunden</p></>
            : <><Users className="w-10 h-10 mx-auto text-slate-700 mb-2" /><p className="text-sm text-slate-400">Keine Nutzer für „{debouncedQuery}" gefunden</p></>
          }
        </div>
      )}

      {/* ─── Empty / hero state (no query) ─────────── */}
      {!query && !hasResults && (
        <div className="flex items-center justify-center gap-4 py-2 text-[11px] text-slate-500">
          <span className="flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-cinema-red" />
            Durchsuche Millionen Filme
          </span>
          <span className="text-slate-700">·</span>
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cinema-green" />
            Folge anderen Nutzern
          </span>
        </div>
      )}
    </div>
  );
};
