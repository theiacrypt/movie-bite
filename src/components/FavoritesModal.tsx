import React, { useState, useEffect, useCallback } from 'react';
import {
  Heart, HeartOff, X, Star, Film, Search, FolderHeart,
  Users, UserPlus, UserMinus, Bookmark, Trash2, ChevronDown, ArrowRight, Sparkles, Check,
  Loader2, AlertCircle, CheckCircle2
} from 'lucide-react';
import { suppenstudiosAuth, FavoriteMovie, FollowedUser } from '../services/suppenstudiosAuth.js';
import { soundFx } from '../services/soundEffects.js';

interface FavoritesModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Wenn gesetzt, ist der Modal im "Pick"-Modus für die Filmauswahl */
  onPickMovie?: (movie: FavoriteMovie) => void;
  alreadyAddedIds?: string[];
  onOpenAuth?: () => void;
}

type Tab = 'favorites' | 'social';
type SortKey = 'date' | 'rating' | 'title';

const LIST_NAMES = ['Alle', 'Horror-Abend', 'Familien-Filme', 'Action', 'Romantik', 'Sci-Fi', 'Sonstiges'];

export const FavoritesModal: React.FC<FavoritesModalProps> = ({
  isOpen,
  onClose,
  onPickMovie,
  alreadyAddedIds = [],
  onOpenAuth
}) => {
  const currentUser = suppenstudiosAuth.getUser();
  const [tab, setTab] = useState<Tab>('favorites');
  const [favorites, setFavorites] = useState<FavoriteMovie[]>([]);
  const [following, setFollowing] = useState<FollowedUser[]>([]);
  const [sortBy, setSortBy] = useState<SortKey>('date');
  const [filterList, setFilterList] = useState('Alle');
  const [search, setSearch] = useState('');

  // Social tab state
  const [followInput, setFollowInput] = useState('');
  const [followLoading, setFollowLoading] = useState(false);
  const [followError, setFollowError] = useState<string | null>(null);
  const [followSuccess, setFollowSuccess] = useState<string | null>(null);
  const [selectedFollowed, setSelectedFollowed] = useState<string | null>(null);
  const [followedFavs, setFollowedFavs] = useState<FavoriteMovie[]>([]);

  const reload = useCallback(() => {
    setFavorites(suppenstudiosAuth.getFavorites());
    setFollowing(suppenstudiosAuth.getFollowing());
  }, []);

  useEffect(() => {
    if (isOpen) {
      reload();
      setSearch('');
      setFilterList('Alle');
      setFollowError(null);
      setFollowSuccess(null);
    }
  }, [isOpen, reload]);

  useEffect(() => {
    const unsub = suppenstudiosAuth.subscribeFavorites(reload);
    return unsub;
  }, [reload]);

  useEffect(() => {
    if (selectedFollowed) {
      setFollowedFavs(suppenstudiosAuth.getFollowedUserFavorites(selectedFollowed));
    }
  }, [selectedFollowed]);

  if (!isOpen) return null;

  const isPick = !!onPickMovie;

  // Sorted & filtered favorites
  const visibleFavs = favorites
    .filter(f => filterList === 'Alle' || f.listName === filterList)
    .filter(f =>
      search ? f.title.toLowerCase().includes(search.toLowerCase()) : true
    )
    .sort((a, b) => {
      if (sortBy === 'date')   return b.addedAt - a.addedAt;
      if (sortBy === 'rating') return b.rating - a.rating;
      return a.title.localeCompare(b.title);
    });

  const handleFollow = async () => {
    const name = followInput.trim();
    if (!name || !currentUser) return;
    setFollowLoading(true);
    setFollowError(null);
    setFollowSuccess(null);

    try {
      const res = await suppenstudiosAuth.followUserVerified(name);
      if (res.success && res.user) {
        soundFx.playPop();
        setFollowSuccess(`Du folgst jetzt „${res.user.username}“`);
        setFollowInput('');
        reload();
        setTimeout(() => setFollowSuccess(null), 3500);
      } else {
        setFollowError(res.error || 'Nutzer nicht gefunden');
        setTimeout(() => setFollowError(null), 4000);
      }
    } catch (err: any) {
      setFollowError(err.message || 'Fehler beim Folgen');
      setTimeout(() => setFollowError(null), 4000);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleUnfollow = (username: string) => {
    suppenstudiosAuth.unfollowUser(username);
    if (selectedFollowed === username) setSelectedFollowed(null);
    reload();
  };

  const handleSetList = (movieId: string, listName: string) => {
    suppenstudiosAuth.updateFavoriteList(movieId, listName);
    reload();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full sm:max-w-2xl bg-theater-900 border border-white/15 sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[85vh] animate-slideUp">

        {/* Header */}
        <div className="px-5 py-4 border-b border-white/10 bg-theater-950/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-cinema-red to-pink-600 shadow-lg shadow-cinema-red/20">
              <Heart className="w-4 h-4 text-white fill-white" />
            </div>
            <div>
              <h2 className="font-display font-black text-base text-white">
                {isPick ? 'Film aus Favoriten wählen' : 'Meine Favoriten'}
              </h2>
              <p className="text-[10px] text-slate-400">
                {isPick ? 'Wähle einen Film für den Vorschlags-Pool' : `${favorites.length} gespeicherte Filme`}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        {!isPick && (
          <div className="flex border-b border-white/8 shrink-0">
            {[
              { id: 'favorites' as Tab, label: 'Meine Filme', icon: Heart },
              { id: 'social' as Tab,    label: 'Gefolgte',    icon: Users },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-semibold transition-all border-b-2 ${
                  tab === id
                    ? 'border-cinema-red text-white'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>
        )}

        {/* ─── FAVORITES TAB ─────────────────────────── */}
        {(tab === 'favorites' || isPick) && (
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Controls */}
            <div className="px-4 py-3 flex flex-wrap items-center gap-2 border-b border-white/5 shrink-0">
              <div className="relative flex-1 min-w-[140px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Suche in Favoriten..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-theater-800 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cinema-red/50 transition-colors"
                />
              </div>

              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as SortKey)}
                className="px-3 py-2 text-xs bg-theater-800 border border-white/10 rounded-xl text-slate-300 focus:outline-none focus:border-cinema-red/50 transition-colors appearance-none cursor-pointer"
              >
                <option value="date">Zuletzt hinzugefügt</option>
                <option value="rating">Beste Bewertung</option>
                <option value="title">A – Z</option>
              </select>

              <select
                value={filterList}
                onChange={e => setFilterList(e.target.value)}
                className="px-3 py-2 text-xs bg-theater-800 border border-white/10 rounded-xl text-slate-300 focus:outline-none focus:border-cinema-red/50 transition-colors appearance-none cursor-pointer"
              >
                {LIST_NAMES.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>

            {/* Film Grid */}
            <div className="flex-1 overflow-y-auto p-4">
              {!currentUser ? (
                <div className="text-center py-12 space-y-3">
                  <Heart className="w-12 h-12 mx-auto text-slate-700" />
                  <p className="text-sm text-slate-400 font-medium">Melde dich an, um Favoriten zu speichern</p>
                  <button
                    onClick={onOpenAuth}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cinema-red/20 hover:bg-cinema-red/30 text-cinema-red font-semibold text-xs border border-cinema-red/30 transition-all"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Anmelden / Registrieren
                  </button>
                  <p className="text-[10px] text-slate-500 mt-2">Gäste: Favoriten werden lokal gespeichert</p>
                  {/* Show guest favorites anyway */}
                </div>
              ) : visibleFavs.length === 0 ? (
                <div className="text-center py-12 space-y-2">
                  <FolderHeart className="w-12 h-12 mx-auto text-slate-700" />
                  <p className="text-sm text-slate-400">
                    {search ? 'Keine Ergebnisse' : 'Noch keine Favoriten'}
                  </p>
                  <p className="text-xs text-slate-500">
                    Füge Filme über das Herz-Icon in der Filmsuche hinzu!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {visibleFavs.map(movie => {
                    const alreadyAdded = alreadyAddedIds.includes(movie.id);
                    return (
                      <div
                        key={movie.id}
                        className={`flex gap-3 p-3 rounded-2xl border transition-all group ${
                          alreadyAdded
                            ? 'bg-theater-850/50 border-white/5 opacity-60'
                            : 'bg-theater-850/80 border-white/8 hover:border-cinema-red/40 cursor-pointer'
                        }`}
                        onClick={() => !alreadyAdded && isPick && onPickMovie?.(movie)}
                      >
                        {/* Poster */}
                        <div className="w-14 h-20 rounded-lg overflow-hidden shrink-0 bg-theater-800 poster-scanlines">
                          {movie.poster ? (
                            <img
                              src={movie.poster.startsWith('http') ? movie.poster : `https://image.tmdb.org/t/p/w92${movie.poster}`}
                              alt={movie.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Film className="w-5 h-5 text-slate-600" />
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                          <div>
                            <h4 className="font-display font-bold text-sm text-white line-clamp-1">
                              {movie.title}
                            </h4>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] text-slate-400">{movie.year}</span>
                              <span className="text-[10px] text-cinema-gold flex items-center gap-0.5">
                                <Star className="w-2.5 h-2.5 fill-cinema-gold" />
                                {movie.rating}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                              {movie.plot}
                            </p>
                          </div>

                          <div className="flex items-center justify-between mt-2">
                            {!isPick ? (
                              <>
                                {/* List selector */}
                                <div className="relative">
                                  <select
                                    value={movie.listName || ''}
                                    onChange={e => {
                                      e.stopPropagation();
                                      handleSetList(movie.id, e.target.value);
                                    }}
                                    onClick={e => e.stopPropagation()}
                                    className="text-[10px] bg-theater-800 border border-white/10 rounded-lg px-2 py-0.5 text-slate-400 focus:outline-none appearance-none pr-4 cursor-pointer"
                                  >
                                    <option value="">Keine Liste</option>
                                    {LIST_NAMES.slice(1).map(n => <option key={n} value={n}>{n}</option>)}
                                  </select>
                                  <ChevronDown className="absolute right-1 top-1/2 -translate-y-1/2 w-2.5 h-2.5 text-slate-500 pointer-events-none" />
                                </div>
                                <button
                                  onClick={e => { e.stopPropagation(); suppenstudiosAuth.removeFavorite(movie.id); }}
                                  className="p-1 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                  title="Aus Favoriten entfernen"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            ) : (
                              <div className="flex items-center justify-between w-full">
                                {alreadyAdded ? (
                                  <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                                    <Check className="w-3 h-3" /> Im Pool
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-cinema-red font-semibold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <ArrowRight className="w-3 h-3" /> Vorschlagen
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── SOCIAL TAB ────────────────────────────── */}
        {tab === 'social' && !isPick && (
          <div className="flex flex-col flex-1 overflow-hidden">
            {!currentUser ? (
              <div className="text-center py-12 space-y-3 p-6">
                <Users className="w-12 h-12 mx-auto text-slate-700" />
                <p className="text-sm text-slate-400">Anmelden erforderlich</p>
                <button onClick={onOpenAuth} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cinema-red/20 text-cinema-red text-xs font-semibold border border-cinema-red/30">
                  <Sparkles className="w-3.5 h-3.5" /> Anmelden
                </button>
              </div>
            ) : (
              <div className="flex flex-1 overflow-hidden">
                {/* Left: Following list */}
                <div className="w-56 sm:w-64 border-r border-white/10 flex flex-col shrink-0 bg-theater-950/40">
                  {/* Follow input */}
                  <div className="p-3 border-b border-white/10 space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Nutzername suchen..."
                        value={followInput}
                        onChange={e => {
                          setFollowInput(e.target.value);
                          if (followError) setFollowError(null);
                        }}
                        onKeyDown={e => e.key === 'Enter' && !followLoading && handleFollow()}
                        disabled={followLoading}
                        className="flex-1 min-w-0 px-3 py-1.5 text-xs bg-theater-800 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cinema-neon/50 transition-colors disabled:opacity-50"
                      />
                      <button
                        onClick={handleFollow}
                        disabled={followLoading || !followInput.trim()}
                        className="shrink-0 p-2 rounded-xl bg-cinema-neon/15 hover:bg-cinema-neon/25 text-cinema-neon border border-cinema-neon/30 transition-all active:scale-95 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
                        title="Nutzer prüfen & folgen"
                      >
                        {followLoading ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-cinema-neon" />
                        ) : (
                          <UserPlus className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    {followError && (
                      <div className="flex items-start gap-1.5 p-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-[11px] leading-tight animate-fadeIn">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <span>{followError}</span>
                      </div>
                    )}

                    {followSuccess && (
                      <div className="flex items-center gap-1.5 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] leading-tight animate-fadeIn">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span>{followSuccess}</span>
                      </div>
                    )}
                  </div>

                  {/* Following list */}
                  <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider px-2 py-1 font-semibold">Gefolgte ({following.length})</p>
                    {following.length === 0 ? (
                      <p className="text-[10px] text-slate-600 text-center py-4">Noch niemandem gefolgt</p>
                    ) : following.map(f => (
                      <div
                        key={f.username}
                        onClick={() => setSelectedFollowed(f.username)}
                        className={`flex items-center gap-2 p-2 rounded-xl cursor-pointer transition-all group ${
                          selectedFollowed === f.username
                            ? 'bg-cinema-neon/10 border border-cinema-neon/30'
                            : 'hover:bg-white/5 border border-transparent'
                        }`}
                      >
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cinema-purple to-cinema-neon flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {f.username.substring(0, 1).toUpperCase()}
                        </div>
                        <span className="text-xs text-white font-medium truncate flex-1">
                          {f.username}
                        </span>
                        <button
                          onClick={e => { e.stopPropagation(); handleUnfollow(f.username); }}
                          className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-600 hover:text-red-400 transition-all"
                        >
                          <UserMinus className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right: Selected user's favorites */}
                <div className="flex-1 overflow-y-auto p-4">
                  {!selectedFollowed ? (
                    <div className="text-center py-10 text-slate-500 text-xs space-y-2">
                      <Bookmark className="w-10 h-10 mx-auto text-slate-700" />
                      <p>Wähle einen Account, um dessen Favoriten zu sehen</p>
                    </div>
                  ) : followedFavs.length === 0 ? (
                    <div className="text-center py-10 text-slate-500 text-xs space-y-2">
                      <HeartOff className="w-8 h-8 mx-auto text-slate-700" />
                      <p><strong className="text-slate-400">{selectedFollowed}</strong> hat noch keine öffentlichen Favoriten</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-xs text-slate-400 font-semibold mb-3 flex items-center gap-1.5">
                        <Heart className="w-3.5 h-3.5 text-cinema-red" />
                        Favoriten von <span className="text-white">{selectedFollowed}</span>
                      </p>
                      {followedFavs.map(movie => (
                        <div key={movie.id} className="flex gap-2 p-2.5 rounded-xl bg-theater-850 border border-white/8 hover:border-cinema-red/30 transition-all cursor-pointer group">
                          <div className="w-10 h-14 rounded-lg overflow-hidden shrink-0 bg-theater-800">
                            {movie.poster && (
                              <img src={movie.poster.startsWith('http') ? movie.poster : `https://image.tmdb.org/t/p/w92${movie.poster}`} alt={movie.title} className="w-full h-full object-cover" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-white line-clamp-1">{movie.title}</p>
                            <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                              <span>{movie.year}</span>
                              <span>·</span>
                              <span className="flex items-center gap-0.5 text-cinema-gold font-medium">
                                <Star className="w-2.5 h-2.5 fill-cinema-gold" />
                                {movie.rating}
                              </span>
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
