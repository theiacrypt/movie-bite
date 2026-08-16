import React, { useState, useEffect } from 'react';
import { Film, Sparkles, ArrowRight, PlusCircle, Users, Heart, Star, Crown, MessageSquare } from 'lucide-react';
import { AvatarPicker } from './AvatarPicker.js';
import { DiscoverPanel } from './DiscoverPanel.js';
import { TrendingReviews } from './TrendingReviews.js';
import { soundFx } from '../services/soundEffects.js';
import { suppenstudiosAuth, Review, User } from '../services/suppenstudiosAuth.js';

interface WelcomeScreenProps {
  onCreateRoom: (name: string, avatar: string) => void;
  onJoinRoom: (code: string, name: string, avatar: string) => void;
  initialRoomCode?: string;
  error?: string | null;
  loading?: boolean;
  onOpenAuth?: () => void;
  onOpenReview?: (movieId: string, movieTitle: string, moviePoster?: string) => void;
}

// Static film poster placeholders for background animation
const FILM_FRAMES = Array.from({ length: 30 });

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onCreateRoom,
  onJoinRoom,
  initialRoomCode = '',
  error,
  loading = false,
  onOpenAuth,
  onOpenReview
}) => {
  const [tab, setTab] = useState<'create' | 'join'>(initialRoomCode ? 'join' : 'create');
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('🍿');
  const [roomCode, setRoomCode] = useState(initialRoomCode);
  const [currentUser, setCurrentUser] = useState<User | null>(suppenstudiosAuth.getUser());
  const [chefReviews, setChefReviews] = useState<Review[]>([]);
  const [myFavCount, setMyFavCount] = useState(0);

  useEffect(() => {
    if (initialRoomCode) { setRoomCode(initialRoomCode); setTab('join'); }
  }, [initialRoomCode]);

  useEffect(() => {
    const unsub = suppenstudiosAuth.subscribe(user => {
      setCurrentUser(user);
      setMyFavCount(suppenstudiosAuth.getFavorites().length);
    });
    return unsub;
  }, []);

  useEffect(() => {
    // Load Chef's reviews (graceful fallback)
    suppenstudiosAuth.getUserReviews('Chef').then(res => {
      setChefReviews((res.reviews || []).slice(0, 3));
    });
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    soundFx.playPop();
    if (tab === 'create') {
      onCreateRoom(name || 'Kino-Fan', avatar);
    } else {
      if (!roomCode.trim()) return;
      onJoinRoom(roomCode.trim().toUpperCase(), name || 'Gast', avatar);
    }
  };

  return (
    <div className="min-h-[calc(100vh-65px)] flex flex-col items-center justify-center p-4 relative overflow-hidden">

      {/* ─── Animated Film Strip Background ───────── */}
      <div className="film-strip-bg" aria-hidden="true">
        {/* Column 1 */}
        <div className="film-strip-column" style={{ left: '5%' }}>
          {FILM_FRAMES.map((_, i) => <div key={i} className="film-strip-frame" />)}
        </div>
        {/* Column 2 (reverse) */}
        <div className="film-strip-column" style={{ left: '25%', animationDuration: '28s', animationDirection: 'reverse' }}>
          {FILM_FRAMES.map((_, i) => <div key={i} className="film-strip-frame" />)}
        </div>
        {/* Column 3 */}
        <div className="film-strip-column" style={{ left: '70%', animationDuration: '24s' }}>
          {FILM_FRAMES.map((_, i) => <div key={i} className="film-strip-frame" />)}
        </div>
        {/* Column 4 (reverse) */}
        <div className="film-strip-column" style={{ left: '88%', animationDuration: '32s', animationDirection: 'reverse' }}>
          {FILM_FRAMES.map((_, i) => <div key={i} className="film-strip-frame" />)}
        </div>
      </div>

      {/* ─── Glow blobs ───────────────────────────── */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cinema-red/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cinema-purple/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-4xl relative z-10 flex flex-col lg:flex-row gap-5 items-start justify-center">

        {/* ─── Main Card ───────────────────────────── */}
        <div className="w-full lg:max-w-md glass-panel rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl">
          {/* Hero */}
          <div className="text-center mb-6">
            <div className="inline-flex p-3.5 rounded-2xl bg-gradient-to-br from-cinema-red to-cinema-red-deep text-white shadow-xl shadow-cinema-red/30 mb-3 animate-float">
              <Film className="w-8 h-8" />
            </div>
            <h2 className="font-display font-black text-2xl sm:text-3xl tracking-tight text-white">
              Gemeinsam Filme{' '}
              <span className="bg-gradient-to-r from-cinema-red to-cinema-green bg-clip-text text-transparent neon-text-red">
                entscheiden
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2">
              2 Runden: Erst Vorschläge sammeln, dann mit Likes & Dislikes den Sieger küren!
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="grid grid-cols-2 p-1 bg-theater-900/90 rounded-2xl mb-6 border border-white/5">
            {[
              { id: 'create' as const, label: 'Raum erstellen', icon: PlusCircle },
              { id: 'join'   as const, label: 'Raum beitreten', icon: Users },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => { setTab(id); soundFx.playPop(); }}
                className={`py-2.5 rounded-xl font-semibold text-xs transition-all duration-200 flex items-center justify-center gap-1.5 ${
                  tab === id
                    ? 'bg-gradient-to-r from-cinema-red to-red-600 text-white shadow-lg shadow-cinema-red/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs text-center font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Avatar */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Wähle deinen Avatar</label>
              <AvatarPicker selectedAvatar={avatar} onSelect={a => setAvatar(a)} />
            </div>

            {/* Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Dein Name / Spitzname</label>
              <input
                type="text"
                required
                maxLength={20}
                placeholder="z. B. Alex, Cineast99..."
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-theater-900 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cinema-red transition-all"
              />
            </div>

            {/* Room Code */}
            {tab === 'join' && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">6-stelliger Raumcode</label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="z. B. ABC123"
                  value={roomCode}
                  onChange={e => setRoomCode(e.target.value.toUpperCase())}
                  className="w-full bg-theater-900 border border-white/10 rounded-xl px-4 py-3 text-sm text-center font-mono font-bold tracking-widest text-cinema-gold placeholder-slate-600 focus:outline-none focus:border-cinema-gold transition-all uppercase"
                />
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-cinema-red to-cinema-red-deep hover:from-cinema-red-hover hover:to-cinema-red text-white font-bold text-sm flex items-center justify-center gap-2 shadow-xl shadow-cinema-red/30 active:scale-98 transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>{tab === 'create' ? 'Raum wird erstellt...' : 'Raum wird betreten...'}</span>
                </>
              ) : (
                <>
                  <span>{tab === 'create' ? 'Raum öffnen & Freunde einladen' : 'Raum beitreten'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Feature row */}
          <div className="mt-6 pt-5 border-t border-white/5 grid grid-cols-3 gap-2 text-center text-[11px] text-slate-400">
            <div className="flex flex-col items-center gap-1 hover:text-slate-300 transition-colors">
              <span className="text-base">🎬</span><span>Live Movie API</span>
            </div>
            <div className="flex flex-col items-center gap-1 hover:text-slate-300 transition-colors">
              <span className="text-base">⭐</span><span>Favoriten-Listen</span>
            </div>
            <div className="flex flex-col items-center gap-1 hover:text-slate-300 transition-colors">
              <span className="text-base">✍️</span><span>Rezensionen</span>
            </div>
          </div>
        </div>

        {/* ─── Side Widgets ─────────────────────────── */}
        <div className="w-full lg:w-72 flex flex-col gap-4">

          {/* Quick Stats (when logged in) */}
          {currentUser && (
            <div className="glass-panel rounded-2xl p-4 border border-white/10 animate-slideUp">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-3 font-semibold">Dein Profil</p>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cinema-red to-cinema-red-deep flex items-center justify-center text-white font-black text-base shadow-md shadow-cinema-red/20">
                  {currentUser.username.substring(0, 1).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-bold text-white">{currentUser.username}</p>
                  <p className="text-[10px] text-slate-400">Suppenstudios Account</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="p-2 rounded-xl bg-theater-800/60 border border-white/5">
                  <div className="flex items-center justify-center gap-1 text-cinema-red font-black text-base">
                    <Heart className="w-3.5 h-3.5 fill-cinema-red" />
                    {myFavCount}
                  </div>
                  <p className="text-[10px] text-slate-500">Favoriten</p>
                </div>
                <div className="p-2 rounded-xl bg-theater-800/60 border border-white/5">
                  <div className="flex items-center justify-center gap-1 text-cinema-purple font-black text-base">
                    <Users className="w-3.5 h-3.5" />
                    {suppenstudiosAuth.getFollowing().length}
                  </div>
                  <p className="text-[10px] text-slate-500">Gefolgt</p>
                </div>
              </div>
            </div>
          )}

          {/* ─── Chef empfiehlt Widget ─────────────── */}
          {chefReviews.length > 0 && (
            <div className="glass-panel rounded-2xl p-4 border border-cinema-gold/25 shadow-lg shadow-cinema-gold/5 animate-slideUp">
              {/* Widget Header */}
              <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 rounded-lg bg-gradient-to-br from-cinema-gold to-amber-500 shadow-md">
                  <Crown className="w-3.5 h-3.5 text-theater-950" />
                </div>
                <div>
                  <p className="text-xs font-black text-cinema-gold uppercase tracking-wider neon-text-gold">
                    Chef empfiehlt
                  </p>
                  <p className="text-[9px] text-slate-500">Die letzten Reviews von Chef</p>
                </div>
              </div>

              <div className="space-y-2.5">
                {chefReviews.map(review => {
                  const text = review.review_text?.replace(/^\[SPOILER\]/, '') || '';
                  return (
                    <div
                      key={review.id}
                      className="p-3 rounded-xl bg-theater-800/60 border border-cinema-gold/15 space-y-1.5 hover:border-cinema-gold/30 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-bold text-white line-clamp-1 leading-tight">
                          {review.movie_title}
                        </p>
                        <span className="text-xs font-black text-cinema-gold shrink-0 flex items-center gap-0.5">
                          <Star className="w-3 h-3 fill-cinema-gold" />
                          {review.rating}
                        </span>
                      </div>
                      {text && (
                        <p className="text-[10px] text-slate-400 leading-relaxed line-clamp-2">
                          „{text}"
                        </p>
                      )}
                      <div className="flex items-center gap-1 text-[9px] text-slate-600">
                        <MessageSquare className="w-2.5 h-2.5" />
                        {new Date(review.created_at).toLocaleDateString('de-DE', { day: '2-digit', month: 'short' })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* How it works */}
          {!currentUser && (
            <div className="glass-panel rounded-2xl p-4 border border-white/8 animate-slideUp">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-3 font-semibold">Wie es funktioniert</p>
              <div className="space-y-3">
                {[
                  { icon: PlusCircle, label: 'Raum erstellen', desc: 'Öffne einen Raum & lade Freunde ein', color: 'text-cinema-red' },
                  { icon: Film,       label: 'Filme vorschlagen', desc: 'Jeder schlägt bis zu 3 Wunschfilme vor', color: 'text-cinema-purple' },
                  { icon: Sparkles,   label: 'Abstimmen & gewinnen', desc: 'Likes & Dislikes bestimmen den Sieger', color: 'text-cinema-gold' },
                ].map(({ icon: Icon, label, desc, color }, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <div className={`mt-0.5 shrink-0 ${color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-white">{label}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── Discover Panel (Film & Nutzer-Suche) ─── */}
      <DiscoverPanel
        onOpenAuth={onOpenAuth}
        onOpenReview={movie => onOpenReview?.(movie.id, movie.title, movie.poster)}
      />

      {/* ─── Trending Reviews ──────────────────────── */}
      <TrendingReviews
        onOpenReview={onOpenReview}
      />
    </div>
  );
};
