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
  AlertTriangle,
  Music,
  Zap,
  Smile,
  Check,
  Brain,
  Palette,
  Compass
} from 'lucide-react';
import { suppenstudiosAuth, Review, User, isChefUser } from '../services/suppenstudiosAuth.js';
import { tasteProfileService, REVIEW_CATEGORIES, ReviewCategoryOption } from '../services/tasteProfile.js';

interface MovieReviewsModalProps {
  movieId: string | number;
  movieTitle: string;
  moviePoster?: string;
  isOpen: boolean;
  onClose: () => void;
  onOpenAuth?: () => void;
}

const isChef = isChefUser;

interface ReviewWithLocal extends Review {
  _helpfulLocal?: boolean;
  _helpfulCount?: number;
  _parsedTags?: string[];
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
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showDetailedCategories, setShowDetailedCategories] = useState(true);
  const [hasSpoiler, setHasSpoiler] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; text: string; influenceText?: string } | null>(null);

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
      const sorted = (res.reviews || []).map(r => {
        let text = r.review_text || '';
        let tags: string[] = [];
        const match = text.match(/\[TAGS:\s*([^\]]+)\]/);
        if (match) {
          tags = match[1].split(',').map(t => t.trim());
          text = text.replace(/\[TAGS:\s*[^\]]+\]/, '').trim();
        }
        return {
          ...r,
          review_text: text,
          _parsedTags: tags
        };
      }).sort((a, b) => {
        if (isChef(a.username) && !isChef(b.username)) return -1;
        if (!isChef(a.username) && isChef(b.username)) return 1;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

      setReviews(sorted);
      setAverageRating(res.averageRating);

      // Record that user has seen/read these reviews for influence tracking
      sorted.forEach(rev => {
        tasteProfileService.recordReviewRead(rev, movieId);
      });

      // Populate my existing review if any
      const enrichedList = tasteProfileService.getEnrichedReviews();
      const myLocal = enrichedList.find(e => String(e.movieId) === String(movieId));
      if (myLocal) {
        setRating(myLocal.rating);
        setSelectedTags(myLocal.selectedTags || []);
        setReviewText(myLocal.reviewText || '');
      } else if (currentUser) {
        const myRev = sorted.find(r => r.user_id === currentUser.id);
        if (myRev) {
          setRating(myRev.rating);
          setReviewText(myRev.review_text || '');
          if (myRev._parsedTags?.length) setSelectedTags(myRev._parsedTags);
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

  const toggleTag = (tagId: string) => {
    setSelectedTags(prev =>
      prev.includes(tagId) ? prev.filter(t => t !== tagId) : [...prev, tagId]
    );
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) { onOpenAuth?.(); return; }

    setSubmitting(true);
    setFeedback(null);
    try {
      const result = await tasteProfileService.saveEnrichedReview({
        movieId,
        movieTitle,
        moviePoster,
        rating,
        reviewText,
        selectedTags,
        hasSpoiler
      });

      setFeedback({
        type: 'success',
        text: result.message,
        influenceText: result.influenceText
      });
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
                  <span className="text-xs font-bold text-amber-400 px-2.5 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/20 inline-flex items-center gap-1">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <span>{averageRating}/10 · {reviews.length} {reviews.length === 1 ? 'Rezension' : 'Rezensionen'}</span>
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
            <div className={`p-3.5 rounded-xl flex items-center gap-2 text-xs animate-slideUp ${
              feedback.type === 'success'
                ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                : 'bg-red-500/15 border border-red-500/30 text-red-300'
            }`}>
              {feedback.type === 'success'
                ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                : <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              }
              <span>{feedback.text}</span>
            </div>
          )}

          {/* ─── Write Review Form ─────────────────── */}
          <div className="p-4 sm:p-5 rounded-2xl bg-theater-950/80 border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-cinema-red" />
                {currentUser ? 'Deine detaillierte Rezension' : 'Mit Suppenstudios-Account bewerten'}
              </span>
              {currentUser && (
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-400/10 text-amber-400 border border-amber-400/20 font-mono">
                  {hoverRating ?? rating} / 10 Punkte
                </span>
              )}
            </div>

            {currentUser ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* 1-10 Stars Rating */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1.5">
                    Gesamtbewertung
                  </label>
                  <div className="flex items-center gap-1.5 flex-wrap p-2 rounded-xl bg-theater-900/90 border border-white/5">
                    {[1,2,3,4,5,6,7,8,9,10].map(star => (
                      <button
                        key={star}
                        type="button"
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(null)}
                        onClick={() => setRating(star)}
                        className="p-1 transition-transform hover:scale-125 focus:outline-none"
                      >
                        <Star className={`w-5 h-5 transition-colors ${starColor(star, hoverRating ?? rating)}`} />
                      </button>
                    ))}
                  </div>
                </div>

                {/* ─── Granular Categories Selector ─── */}
                <div className="space-y-3 p-3.5 rounded-xl bg-theater-900/60 border border-white/8">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-cinema-purple" />
                      Detaillierte Kriterien
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowDetailedCategories(p => !p)}
                      className="text-[10px] text-cinema-neon hover:underline font-semibold"
                    >
                      {showDetailedCategories ? 'Einklappen' : 'Kategorien wählen'}
                    </button>
                  </div>

                  {showDetailedCategories && (
                    <div className="space-y-3.5 pt-2">
                      {/* Musik & Sound */}
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 mb-1.5">
                          <Music className="w-3 h-3 text-amber-400" /> {REVIEW_CATEGORIES.music.title}
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {REVIEW_CATEGORIES.music.options.map(opt => {
                            const active = selectedTags.includes(opt.id);
                            return (
                              <button
                                key={opt.id}
                                type="button"
                                onClick={() => toggleTag(opt.id)}
                                className={`text-[11px] font-medium px-2.5 py-1 rounded-lg border transition-all active:scale-95 flex items-center gap-1 ${
                                  active
                                    ? 'bg-amber-400/20 border-amber-400 text-amber-300 shadow-sm'
                                    : 'bg-theater-850 border-white/10 text-slate-400 hover:text-slate-200 hover:border-white/20'
                                }`}
                              >
                                {active && <Check className="w-3 h-3" />}
                                {opt.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Pacing & Dynamik */}
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 mb-1.5">
                          <Zap className="w-3 h-3 text-cyan-400" /> {REVIEW_CATEGORIES.pacing.title}
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {REVIEW_CATEGORIES.pacing.options.map(opt => {
                            const active = selectedTags.includes(opt.id);
                            return (
                              <button
                                key={opt.id}
                                type="button"
                                onClick={() => toggleTag(opt.id)}
                                className={`text-[11px] font-medium px-2.5 py-1 rounded-lg border transition-all active:scale-95 flex items-center gap-1 ${
                                  active
                                    ? 'bg-cyan-400/20 border-cyan-400 text-cyan-300 shadow-sm'
                                    : 'bg-theater-850 border-white/10 text-slate-400 hover:text-slate-200 hover:border-white/20'
                                }`}
                              >
                                {active && <Check className="w-3 h-3" />}
                                {opt.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Story & Plot */}
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 mb-1.5">
                          <Brain className="w-3 h-3 text-purple-400" /> {REVIEW_CATEGORIES.story.title}
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {REVIEW_CATEGORIES.story.options.map(opt => {
                            const active = selectedTags.includes(opt.id);
                            return (
                              <button
                                key={opt.id}
                                type="button"
                                onClick={() => toggleTag(opt.id)}
                                className={`text-[11px] font-medium px-2.5 py-1 rounded-lg border transition-all active:scale-95 flex items-center gap-1 ${
                                  active
                                    ? 'bg-purple-400/20 border-purple-400 text-purple-300 shadow-sm'
                                    : 'bg-theater-850 border-white/10 text-slate-400 hover:text-slate-200 hover:border-white/20'
                                }`}
                              >
                                {active && <Check className="w-3 h-3" />}
                                {opt.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Schauspiel & Cast */}
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 mb-1.5">
                          <Smile className="w-3 h-3 text-emerald-400" /> {REVIEW_CATEGORIES.acting.title}
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {REVIEW_CATEGORIES.acting.options.map(opt => {
                            const active = selectedTags.includes(opt.id);
                            return (
                              <button
                                key={opt.id}
                                type="button"
                                onClick={() => toggleTag(opt.id)}
                                className={`text-[11px] font-medium px-2.5 py-1 rounded-lg border transition-all active:scale-95 flex items-center gap-1 ${
                                  active
                                    ? 'bg-emerald-400/20 border-emerald-400 text-emerald-300 shadow-sm'
                                    : 'bg-theater-850 border-white/10 text-slate-400 hover:text-slate-200 hover:border-white/20'
                                }`}
                              >
                                {active && <Check className="w-3 h-3" />}
                                {opt.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Visuals, Emotion & Empfehlung */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 mb-1.5">
                            <Palette className="w-3 h-3 text-pink-400" /> {REVIEW_CATEGORIES.visuals.title}
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {REVIEW_CATEGORIES.visuals.options.map(opt => {
                              const active = selectedTags.includes(opt.id);
                              return (
                                <button
                                  key={opt.id}
                                  type="button"
                                  onClick={() => toggleTag(opt.id)}
                                  className={`text-[10px] font-medium px-2 py-0.5 rounded-lg border transition-all active:scale-95 flex items-center gap-1 ${
                                    active
                                      ? 'bg-pink-400/20 border-pink-400 text-pink-300 shadow-sm'
                                      : 'bg-theater-850 border-white/10 text-slate-400 hover:text-slate-200'
                                  }`}
                                >
                                  {active && <Check className="w-2.5 h-2.5" />}
                                  {opt.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 mb-1.5">
                            <Compass className="w-3 h-3 text-indigo-400" /> {REVIEW_CATEGORIES.recommendation.title}
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {REVIEW_CATEGORIES.recommendation.options.map(opt => {
                              const active = selectedTags.includes(opt.id);
                              return (
                                <button
                                  key={opt.id}
                                  type="button"
                                  onClick={() => toggleTag(opt.id)}
                                  className={`text-[10px] font-medium px-2 py-0.5 rounded-lg border transition-all active:scale-95 flex items-center gap-1 ${
                                    active
                                      ? 'bg-indigo-400/20 border-indigo-400 text-indigo-300 shadow-sm'
                                      : 'bg-theater-850 border-white/10 text-slate-400 hover:text-slate-200'
                                  }`}
                                >
                                  {active && <Check className="w-2.5 h-2.5" />}
                                  {opt.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Review Textarea */}
                <textarea
                  rows={3}
                  placeholder="Deine Rezension: Was hat dich begeistert oder gestört? Wie war die Stimmung?"
                  value={reviewText}
                  onChange={e => setReviewText(e.target.value)}
                  className="w-full p-3 text-xs text-white bg-theater-900 border border-white/15 rounded-xl focus:outline-none focus:border-cinema-red resize-none transition-colors"
                />

                {/* Options row */}
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <div
                      onClick={() => setHasSpoiler(p => !p)}
                      className={`w-8 h-4 rounded-full transition-all relative ${hasSpoiler ? 'bg-amber-500' : 'bg-slate-700'}`}
                    >
                      <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-all ${hasSpoiler ? 'left-4' : 'left-0.5'}`} />
                    </div>
                    <span className="text-[10px] text-slate-400 group-hover:text-slate-300 flex items-center gap-1 font-medium">
                      <AlertTriangle className="w-3 h-3 text-amber-500" />
                      Enthält Spoiler
                    </span>
                  </label>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-cinema-red to-cinema-red-deep hover:from-cinema-red-hover hover:to-cinema-red text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-cinema-red/20 disabled:opacity-50 transition-all active:scale-95"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {submitting ? 'Wird analysiert & gespeichert...' : 'Rezension veröffentlichen'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="text-center py-4 space-y-2">
                <p className="text-xs text-slate-400">
                  Melde dich an, um Filmrezensionen zu schreiben und dein persönliches Geschmacksprofil zu schärfen.
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
                          <span className={`text-sm font-black flex items-center gap-1 ${chef ? 'text-cinema-gold neon-text-gold' : 'text-amber-400'}`}>
                            <Star className={`w-3.5 h-3.5 ${chef ? 'fill-cinema-gold text-cinema-gold' : 'fill-amber-400 text-amber-400'}`} />
                            <span>{rev.rating}</span>
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

                      {/* Tags Pill Badges */}
                      {rev._parsedTags && rev._parsedTags.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {rev._parsedTags.map(tagId => {
                            let label = tagId;
                            for (const cat of Object.values(REVIEW_CATEGORIES)) {
                              const opt = cat.options.find(o => o.id === tagId);
                              if (opt) { label = opt.label; break; }
                            }
                            return (
                              <span
                                key={tagId}
                                className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-theater-900 border border-white/10 text-slate-300"
                              >
                                {label}
                              </span>
                            );
                          })}
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
