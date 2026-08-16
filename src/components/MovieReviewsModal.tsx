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
  Film
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

export const MovieReviewsModal: React.FC<MovieReviewsModalProps> = ({
  movieId,
  movieTitle,
  moviePoster,
  isOpen,
  onClose,
  onOpenAuth
}) => {
  const [currentUser, setCurrentUser] = useState<User | null>(suppenstudiosAuth.getUser());
  const [reviews, setReviews] = useState<Review[]>([]);
  const [averageRating, setAverageRating] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Formular
  const [rating, setRating] = useState<number>(8);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [reviewText, setReviewText] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  useEffect(() => {
    const unsub = suppenstudiosAuth.subscribe(setCurrentUser);
    return unsub;
  }, []);

  const loadReviews = async () => {
    if (!movieId) return;
    setLoading(true);
    try {
      const res = await suppenstudiosAuth.getMovieReviews(movieId);
      setReviews(res.reviews || []);
      setAverageRating(res.averageRating);

      // Falls der aktuelle User schon eine Rezension hat, vorbefüllen
      if (currentUser) {
        const myRev = (res.reviews || []).find(r => r.user_id === currentUser.id);
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
      loadReviews();
    }
  }, [isOpen, movieId, currentUser?.id]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onOpenAuth?.();
      return;
    }

    setSubmitting(true);
    setFeedback(null);
    try {
      const res = await suppenstudiosAuth.submitMovieReview({
        movieId,
        movieTitle,
        moviePoster,
        rating,
        reviewText
      });
      setFeedback({ type: 'success', text: res.message || 'Rezension gespeichert!' });
      await loadReviews();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Fehler beim Speichern' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (reviewId: string) => {
    if (!confirm('Möchtest du diese Rezension wirklich löschen?')) return;
    try {
      await suppenstudiosAuth.deleteReview(reviewId);
      setFeedback({ type: 'success', text: 'Rezension gelöscht.' });
      setReviewText('');
      await loadReviews();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Löschen fehlgeschlagen' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-theater-900 border border-white/15 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 bg-theater-950/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {moviePoster ? (
              <img
                src={moviePoster.startsWith('http') ? moviePoster : `https://image.tmdb.org/t/p/w92${moviePoster}`}
                alt={movieTitle}
                className="w-10 h-14 object-cover rounded-lg shadow-md"
              />
            ) : (
              <div className="w-10 h-14 bg-theater-800 rounded-lg flex items-center justify-center">
                <Film className="w-5 h-5 text-slate-500" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-wide">{movieTitle}</h2>
                {averageRating !== null && (
                  <span className="text-xs font-bold text-amber-400 px-2 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/20">
                    ★ {averageRating}/10 ({reviews.length})
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">Community Rezensionen & Bewertungen</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Feedback */}
          {feedback && (
            <div
              className={`p-3 rounded-xl flex items-center gap-2 text-xs ${
                feedback.type === 'success'
                  ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                  : 'bg-red-500/15 border border-red-500/30 text-red-300'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <AlertCircle className="w-4 h-4" />
              )}
              <span>{feedback.text}</span>
            </div>
          )}

          {/* Eingabeformular für Rezension */}
          <div className="p-4 rounded-2xl bg-theater-950/70 border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-cinema-red" />
                {currentUser ? 'Deine Rezension schreiben' : 'Mit Suppenstudios-Account bewerten'}
              </span>
              {currentUser && (
                <span className="text-xs font-semibold text-amber-400">
                  {hoverRating !== null ? hoverRating : rating} von 10 Sternen
                </span>
              )}
            </div>

            {currentUser ? (
              <form onSubmit={handleSubmit} className="space-y-3">
                {/* 10 Sterne Skala */}
                <div className="flex items-center gap-1 flex-wrap py-1">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(null)}
                      onClick={() => setRating(star)}
                      className="p-1 text-slate-600 hover:scale-125 transition-transform"
                    >
                      <Star
                        className={`w-5 h-5 ${
                          star <= (hoverRating !== null ? hoverRating : rating)
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-slate-600'
                        }`}
                      />
                    </button>
                  ))}
                </div>

                <textarea
                  rows={3}
                  placeholder="Wie fandest du den Film? Was hat dir besonders gefallen (oder missfallen)?"
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  className="w-full p-3 text-xs text-white bg-theater-900 border border-white/15 rounded-xl focus:outline-none focus:border-cinema-red resize-none"
                />

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="py-2 px-4 rounded-xl bg-gradient-to-r from-cinema-red to-orange-600 hover:from-cinema-red-hover hover:to-orange-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md disabled:opacity-50 transition-all"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{submitting ? 'Wird gespeichert...' : 'Rezension veröffentlichen'}</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="text-center py-4 space-y-2">
                <p className="text-xs text-slate-400">
                  Melde dich mit deinem Suppenstudios-Account an, um Filmrezensionen zu schreiben und mit der Community zu teilen.
                </p>
                <button
                  type="button"
                  onClick={onOpenAuth}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-theater-800 hover:bg-theater-750 text-xs font-semibold text-white border border-white/10 shadow-sm"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Jetzt anmelden / Konto erstellen</span>
                </button>
              </div>
            )}
          </div>

          {/* Liste aller Rezensionen */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Alle Rezensionen ({reviews.length})
            </h3>

            {loading ? (
              <p className="text-xs text-slate-500 text-center py-6">Rezensionen werden geladen...</p>
            ) : reviews.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs">
                Noch keine Rezensionen zu diesem Film. Sei der Erste, der seine Meinung teilt!
              </div>
            ) : (
              <div className="space-y-3">
                {reviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="p-4 rounded-xl bg-theater-950/60 border border-white/10 space-y-2 relative group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-purple-500 to-cinema-red flex items-center justify-center text-white text-xs font-bold">
                          {rev.username ? rev.username.substring(0, 2).toUpperCase() : 'U'}
                        </div>
                        <div>
                          <span className="text-xs font-bold text-white">{rev.username || 'Suppenstudios Nutzer'}</span>
                          <span className="text-[10px] text-slate-500 ml-2">
                            {new Date(rev.created_at).toLocaleDateString('de-DE')}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-amber-400 flex items-center gap-0.5">
                          ★ {rev.rating}/10
                        </span>

                        {currentUser && currentUser.id === rev.user_id && (
                          <button
                            onClick={() => handleDelete(rev.id)}
                            className="p-1 text-slate-500 hover:text-red-400 rounded transition-colors"
                            title="Rezension löschen"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {rev.review_text && (
                      <p className="text-xs text-slate-300 leading-relaxed pl-9">
                        {rev.review_text}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
