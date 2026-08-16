import React, { useState, useEffect } from 'react';
import {
  Star,
  MessageSquare,
  X,
  Send,
  Trash2,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Film,
  Crown,
  Eye,
  EyeOff,
  ThumbsUp,
  AlertTriangle
} from 'lucide-react';
import { suppenstudiosAuth, Review, User } from '../services/suppenstudiosAuth.js';

interface MovieReviewsModalProps {
  movieId: string | number;
  movieTitle: string;
  moviePoster?: string;
  isOpen: boolean;
  onClose: () => void;
  onOpenAuth?: () => void;
}

const CHEF_USERNAME = 'Chef';

function isChef(username?: string): boolean {
  return username?.toLowerCase() === CHEF_USERNAME.toLowerCase();
}

interface ReviewWithLocal extends Review {
  _helpfulLocal?: boolean;
  _helpfulCount?: number;
}

export const MovieReviewsModal: React.FC<MovieReviewsModalProps> = ({
  movieId,
  movieTitle,
  moviePoster,
  isOpen,
  onClose,
  onOpenAuth
}) => {
  const [currentUser, setCurrentUser] = useState<User | null>(suppenstudiosAuth.getUser());
  const [reviews, setReviews] = useState<ReviewWithLocal[]>([]);
  const [averageRating, setAverageRating] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [rating, setRating] = useState<number>(8);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [reviewText, setReviewText] = useState('');
  const [hasSpoiler, setHasSpoiler] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  // Spoiler reveal tracking
  const [revealedSpoilers, setRevealedSpoilers] = useState<Set<string>>(new Set());

  useEffect(() => {
    const unsub = suppenstudiosAuth.subscribe(setCurrentUser);
    return unsub;
  }, []);

  const loadReviews = async () => {
    if (!movieId) return;
    setLoading(true);
    try {
      const res = await suppenstudiosAuth.getMovieReviews(movieId);
      // Sort: Chef always first, then by date
      const sorted = (res.reviews || []).sort((a, b) => {
        if (isChef(a.username) && !isChef(b.username)) return -1;
        if (!isChef(a.username) && isChef(b.username)) return 1;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
      setReviews(sorted);
      setAverageRating(res.averageRating);

      if (currentUser) {
        const myRev = sorted.find(r => r.user_id === currentUser.id);
        if (myRev) {
          setRating(myRev.rating);
          setReviewText(myRev.review_text || '');
        }
      }
    } catch (err) {
      console.error('Fehler beim Laden der Reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && movieId) {
      setFeedback(null);
      setRevealedSpoilers(new Set());
      loadReviews();
    }
  }, [isOpen, movieId, currentUser?.id]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) { onOpenAuth?.(); return; }

    setSubmitting(true);
    setFeedback(null);
    try {
      const res = await suppenstudiosAuth.submitMovieReview({
        movieId,
        movieTitle,
        moviePoster,
        rating,
        reviewText: hasSpoiler ? `[SPOILER]${reviewText}` : reviewText
      });
      setFeedback({ type: 'success', text: res.message || 'Rezension veröffentlicht! 🎬' });
      await loadReviews();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Fehler beim Speichern' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (reviewId: string) => {
    if (!confirm('Rezension wirklich löschen?')) return;
    try {
      await suppenstudiosAuth.deleteReview(reviewId);
      setFeedback({ type: 'success', text: 'Rezension gelöscht.' });
      setReviewText('');
      setHasSpoiler(false);
      await loadReviews();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Löschen fehlgeschlagen' });
    }
  };

  const toggleHelpful = (reviewId: string) => {
    setReviews(prev => prev.map(r => {
      if (r.id !== reviewId) return r;
      const wasHelpful = r._helpfulLocal;
      return {
        ...r,
        _helpfulLocal: !wasHelpful,
        _helpfulCount: (r._helpfulCount ?? 0) + (wasHelpful ? -1 : 1)
      };
    }));
  };

  const toggleSpoilerReveal = (reviewId: string) => {
    setRevealedSpoilers(prev => {
      const next = new Set(prev);
      if (next.has(reviewId)) next.delete(reviewId); else next.add(reviewId);
      return next;
    });
  };

  const getReviewText = (rev: ReviewWithLocal) => {
    const text = rev.review_text || '';
    if (text.startsWith('[SPOILER]')) return { text: text.slice(9), hasSpoiler: true };
    return { text, hasSpoiler: false };
  };

  // Star rating color
  const starColor = (star: number, current: number) =>
    star <= current ? 'text-amber-400 fill-amber-400' : 'text-slate-600';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-theater-900 border border-white/15 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-zoomIn">

        {/* Header */}
        <div className="px-5 py-4 border-b border-white/10 bg-theater-950/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            {moviePoster ? (
              <div className="poster-scanlines rounded-lg overflow-hidden shadow-md">
                <img
                  src={moviePoster.startsWith('http') ? moviePoster : `https://image.tmdb.org/t/p/w92${moviePoster}`}
                  alt={movieTitle}
                  className="w-10 h-14 object-cover"
                />
              </div>
            ) : (
              <div className="w-10 h-14 bg-theater-800 rounded-lg flex items-center justify-center">
                <Film className="w-5 h-5 text-slate-500" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold text-white">{movieTitle}</h2>
                {averageRating !== null && (
                  <span className="text-xs font-bold text-amber-400 px-2 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/20">
                    ★ {averageRating}/10 · {reviews.length} {reviews.length === 1 ? 'Rezension' : 'Rezensionen'}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Community Rezensionen & Bewertungen</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">

          {/* Feedback Banner */}
          {feedback && (
            <div className={`p-3 rounded-xl flex items-center gap-2 text-xs animate-slideUp ${
              feedback.type === 'success'
                ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                : 'bg-red-500/15 border border-red-500/30 text-red-300'
            }`}>
              {feedback.type === 'success'
                ? <CheckCircle2 className="w-4 h-4 shrink-0" />
                : <AlertCircle className="w-4 h-4 shrink-0" />
              }
              <span>{feedback.text}</span>
            </div>
          )}

          {/* ─── Write Review Form ─────────────────── */}
          <div className="p-4 rounded-2xl bg-theater-950/70 border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-cinema-red" />
                {currentUser ? 'Deine Rezension' : 'Mit Suppenstudios-Account bewerten'}
              </span>
              {currentUser && (
                <span className="text-xs font-semibold text-amber-400">
                  {hoverRating ?? rating} / 10
                </span>
              )}
            </div>

            {currentUser ? (
              <form onSubmit={handleSubmit} className="space-y-3">
                {/* Stars */}
                <div className="flex items-center gap-1 flex-wrap py-1">
                  {[1,2,3,4,5,6,7,8,9,10].map(star => (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(null)}
                      onClick={() => setRating(star)}
                      className="p-0.5 transition-transform hover:scale-125"
                    >
                      <Star className={`w-5 h-5 transition-colors ${starColor(star, hoverRating ?? rating)}`} />
                    </button>
                  ))}
                </div>

                <textarea
                  rows={3}
                  placeholder="Deine Meinung zum Film? Was hat dich begeistert oder enttäuscht?"
                  value={reviewText}
                  onChange={e => setReviewText(e.target.value)}
                  className="w-full p-3 text-xs text-white bg-theater-900 border border-white/15 rounded-xl focus:outline-none focus:border-cinema-red resize-none transition-colors"
                />

                {/* Options row */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <div
                      onClick={() => setHasSpoiler(p => !p)}
                      className={`w-8 h-4 rounded-full transition-all relative ${hasSpoiler ? 'bg-amber-500' : 'bg-slate-700'}`}
                    >
                      <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-all ${hasSpoiler ? 'left-4' : 'left-0.5'}`} />
                    </div>
                    <span className="text-[10px] text-slate-400 group-hover:text-slate-300 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-amber-500" />
                      Enthält Spoiler
                    </span>
                  </label>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="py-2 px-4 rounded-xl bg-gradient-to-r from-cinema-red to-orange-600 hover:from-red-600 hover:to-orange-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-cinema-red/20 disabled:opacity-50 transition-all active:scale-95"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {submitting ? 'Wird gespeichert...' : 'Veröffentlichen'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="text-center py-4 space-y-2">
                <p className="text-xs text-slate-400">
                  Melde dich an, um Filmrezensionen zu schreiben und mit der Community zu teilen.
                </p>
                <button
                  type="button"
                  onClick={onOpenAuth}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-theater-800 hover:bg-theater-750 text-xs font-semibold text-white border border-white/10 shadow-sm transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Jetzt anmelden / Konto erstellen
                </button>
              </div>
            )}
          </div>

          {/* ─── Reviews List ──────────────────────── */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              Alle Rezensionen
              <span className="font-mono text-slate-500">({reviews.length})</span>
            </h3>

            {loading ? (
              <div className="space-y-2">
                {[1,2].map(i => <div key={i} className="h-20 rounded-xl shimmer" />)}
              </div>
            ) : reviews.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs space-y-1">
                <MessageSquare className="w-8 h-8 mx-auto text-slate-700 mb-2" />
                Noch keine Rezensionen. Sei der Erste!
              </div>
            ) : (
              <div className="space-y-3">
                {reviews.map(rev => {
                  const chef = isChef(rev.username);
                  const { text: revText, hasSpoiler: spoiler } = getReviewText(rev);
                  const revealed = revealedSpoilers.has(rev.id);
                  const isOwn = currentUser?.id === rev.user_id;

                  return (
                    <div
                      key={rev.id}
                      className={`p-4 rounded-2xl border space-y-2.5 relative group transition-all ${
                        chef ? 'chef-review-card' : 'bg-theater-950/60 border-white/10'
                      }`}
                    >
                      {/* Chef Banner */}
                      {chef && (
                        <div className="flex items-center gap-2 pb-2 border-b border-cinema-gold/20">
                          <Crown className="w-4 h-4 text-cinema-gold fill-cinema-gold" />
                          <span className="text-[11px] font-black text-cinema-gold uppercase tracking-widest neon-text-gold">
                            Chef's Pick
                          </span>
                          <span className="chef-badge ml-auto">
                            <Crown className="w-2.5 h-2.5" />
                            Chef
                          </span>
                        </div>
                      )}

                      {/* Author row */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-md ${
                            chef
                              ? 'bg-gradient-to-tr from-cinema-gold to-amber-500 text-theater-950'
                              : 'bg-gradient-to-tr from-cinema-purple to-cinema-red'
                          }`}>
                            {rev.username ? rev.username.substring(0, 2).toUpperCase() : 'U'}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className={`text-xs font-bold ${chef ? 'text-cinema-gold' : 'text-white'}`}>
                                {rev.username || 'Suppenstudios Nutzer'}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-500">
                              {new Date(rev.created_at).toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-black flex items-center gap-0.5 ${chef ? 'text-cinema-gold neon-text-gold' : 'text-amber-400'}`}>
                            ★ {rev.rating}
                            <span className="text-xs font-normal text-slate-500">/10</span>
                          </span>

                          {isOwn && (
                            <button
                              onClick={() => handleDelete(rev.id)}
                              className="p-1 text-slate-600 hover:text-red-400 rounded transition-colors opacity-0 group-hover:opacity-100"
                              title="Rezension löschen"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Review text */}
                      {revText && (
                        <div>
                          {spoiler && !revealed ? (
                            <button
                              onClick={() => toggleSpoilerReveal(rev.id)}
                              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-amber-500/8 border border-amber-500/20 text-amber-400 text-xs font-semibold hover:bg-amber-500/15 transition-all"
                            >
                              <EyeOff className="w-3.5 h-3.5" />
                              Spoiler verbergen — klicke zum Anzeigen
                            </button>
                          ) : (
                            <div className="relative">
                              <p className={`text-xs leading-relaxed pl-1 ${chef ? 'text-amber-50' : 'text-slate-300'}`}>
                                {revText}
                              </p>
                              {spoiler && revealed && (
                                <button
                                  onClick={() => toggleSpoilerReveal(rev.id)}
                                  className="mt-1 text-[10px] text-amber-500 hover:text-amber-400 flex items-center gap-1 transition-colors"
                                >
                                  <Eye className="w-3 h-3" /> Spoiler wieder verbergen
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Helpful vote */}
                      {!isOwn && (
                        <div className="flex justify-end pt-1 border-t border-white/5">
                          <button
                            onClick={() => toggleHelpful(rev.id)}
                            className={`flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-lg transition-all ${
                              rev._helpfulLocal
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                                : 'text-slate-500 hover:text-slate-300 border border-transparent hover:border-white/10'
                            }`}
                          >
                            <ThumbsUp className={`w-3 h-3 ${rev._helpfulLocal ? 'fill-emerald-400' : ''}`} />
                            Hilfreich
                            {(rev._helpfulCount ?? 0) > 0 && (
                              <span className="ml-0.5 opacity-70">({rev._helpfulCount})</span>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
