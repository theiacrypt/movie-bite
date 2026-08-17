import React, { useState, useEffect, useCallback } from 'react';
import {
  Flame, RefreshCw, Crown, Star, Heart, MessageSquare,
  ThumbsUp, Film, Sparkles, Quote, AlertTriangle
} from 'lucide-react';
import { suppenstudiosAuth, Review } from '../services/suppenstudiosAuth.js';

const CHEF_USERNAME = 'Chef';
const DISPLAY_COUNT = 6;

interface TrendingReviewsProps {
  onOpenReview?: (movieId: string, movieTitle: string, moviePoster?: string) => void;
}

/** Weighted shuffle: Reviews mit mehr helpful_count erscheinen öfter, aber nie deterministisch */
function weightedShuffle(reviews: Review[], count: number): Review[] {
  if (reviews.length === 0) return [];

  // Gewichtete Zufalls-Scores: helpful_count * Gewichtsfaktor + Zufall
  const scored = reviews.map(r => {
    const likes   = (r as any).helpful_count ?? 0;
    const isChef  = r.role === 'chef' || r.username?.toLowerCase() === 'chef';
    // Chef bekommt +4 Bonus, dann weighted random
    const score   = (likes * 2.5) + (isChef ? 4 : 0) + Math.random() * 6;
    return { review: r, score };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, count)
    .map(s => s.review);
}

function formatDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch { return ''; }
}

function cleanReviewText(text: string) {
  return text?.replace(/^\[SPOILER\]/, '') ?? '';
}

function hasSpoiler(text: string) {
  return text?.startsWith('[SPOILER]') ?? false;
}

/** Gibt eine farbige Klasse basierend auf der Bewertung zurück */
function ratingColor(rating: number) {
  if (rating >= 8) return 'text-emerald-400';
  if (rating >= 6) return 'text-cinema-gold';
  if (rating >= 4) return 'text-amber-500';
  return 'text-red-400';
}

export const TrendingReviews: React.FC<TrendingReviewsProps> = ({ onOpenReview }) => {
  const [allReviews, setAllReviews] = useState<Review[]>([]);
  const [displayed, setDisplayed] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [shuffleCount, setShuffleCount] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [revealedSpoilers, setRevealedSpoilers] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    suppenstudiosAuth.getTopReviews(40).then(res => {
      if (!cancelled) {
        setAllReviews(res.reviews ?? []);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, []);

  // Re-shuffle whenever allReviews loads or shuffleCount changes
  useEffect(() => {
    if (allReviews.length > 0) {
      setDisplayed(weightedShuffle(allReviews, DISPLAY_COUNT));
    }
  }, [allReviews, shuffleCount]);

  const handleShuffle = useCallback(() => {
    setSpinning(true);
    setTimeout(() => setSpinning(false), 500);
    setShuffleCount(c => c + 1);
    setRevealedSpoilers(new Set());
  }, []);

  const toggleSpoiler = (id: string) => {
    setRevealedSpoilers(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto mt-8">
        <div className="flex items-center gap-3 mb-4 px-1">
          <Flame className="w-5 h-5 text-cinema-red animate-pulse" />
          <span className="text-sm font-bold text-slate-300">Beliebte Rezensionen</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-44 rounded-2xl shimmer" />
          ))}
        </div>
      </div>
    );
  }

  if (displayed.length === 0) return null;

  return (
    <div className="w-full max-w-4xl mx-auto mt-8">

      {/* ─── Section header ───────────────────────── */}
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-xl bg-cinema-red/15 border border-cinema-red/25">
            <Flame className="w-4 h-4 text-cinema-red" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white tracking-tight">Beliebte Rezensionen</h3>
            <p className="text-[10px] text-slate-500">Täglich neu gemischt — Zufall entscheidet</p>
          </div>
        </div>

        <button
          onClick={handleShuffle}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-theater-800/80 hover:bg-theater-750 border border-white/8 hover:border-cinema-green/30 text-xs font-semibold text-slate-300 hover:text-cinema-green transition-all active:scale-95 group"
        >
          <RefreshCw className={`w-3.5 h-3.5 transition-transform duration-500 ${spinning ? 'rotate-180' : 'group-hover:rotate-90'}`} />
          Neu mischen
        </button>
      </div>

      {/* ─── Review Cards ─────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {displayed.map((review, idx) => {
          const isChef    = review.role === 'chef' || review.username?.toLowerCase() === 'chef';
          const spoiler   = hasSpoiler(review.review_text ?? '');
          const text      = cleanReviewText(review.review_text ?? '');
          const revealed  = revealedSpoilers.has(review.id);
          const likes     = (review as any).helpful_count ?? 0;

          return (
            <div
              key={`${review.id}-${shuffleCount}`}
              className={`flex flex-col rounded-2xl border overflow-hidden transition-all group animate-fadeIn
                ${isChef
                  ? 'bg-theater-900/90 border-cinema-gold/30 shadow-sm shadow-cinema-gold/10'
                  : 'bg-theater-900/60 border-white/8 hover:border-cinema-red/30'
                }`}
              style={{ animationDelay: `${idx * 60}ms` }}
            >
              {/* Chef banner */}
              {isChef && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-cinema-gold/8 border-b border-cinema-gold/15">
                  <Crown className="w-3 h-3 text-cinema-gold fill-cinema-gold" />
                  <span className="text-[10px] font-black text-cinema-gold uppercase tracking-widest neon-text-gold">
                    Chef's Pick
                  </span>
                  <Sparkles className="w-2.5 h-2.5 text-cinema-gold ml-auto" />
                </div>
              )}

              {/* Movie info row */}
              <div
                className="flex items-center gap-3 px-3 pt-3 pb-2 cursor-pointer"
                onClick={() => onOpenReview?.(review.movie_id, review.movie_title, review.movie_poster)}
              >
                {/* Poster thumbnail */}
                <div className="w-9 h-12 rounded-lg overflow-hidden shrink-0 bg-theater-800 poster-scanlines">
                  {review.movie_poster ? (
                    <img
                      src={review.movie_poster.startsWith('http') ? review.movie_poster : `https://image.tmdb.org/t/p/w92${review.movie_poster}`}
                      alt={review.movie_title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Film className="w-4 h-4 text-slate-600" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-bold line-clamp-1 group-hover:text-cinema-red transition-colors ${isChef ? 'text-cinema-gold' : 'text-white'}`}>
                    {review.movie_title}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Star className={`w-3 h-3 ${ratingColor(review.rating)}`} />
                    <span className={`text-xs font-black ${ratingColor(review.rating)}`}>
                      {review.rating}
                    </span>
                    <span className="text-[10px] text-slate-500">/10</span>
                  </div>
                </div>

                <MessageSquare className="w-3.5 h-3.5 text-slate-600 group-hover:text-cinema-red transition-colors shrink-0" />
              </div>

              {/* Review text */}
              <div className="px-3 pb-2 flex-1">
                {text ? (
                  spoiler && !revealed ? (
                    <button
                      onClick={() => toggleSpoiler(review.id)}
                      className="w-full text-[10px] text-amber-400 bg-amber-500/8 border border-amber-500/20 rounded-lg py-1.5 font-semibold hover:bg-amber-500/15 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <AlertTriangle className="w-3 h-3 text-amber-400" />
                      <span>Spoiler — Tippen zum Anzeigen</span>
                    </button>
                  ) : (
                    <div>
                      <Quote className="w-3 h-3 text-slate-700 mb-1" />
                      <p className={`text-[11px] leading-relaxed line-clamp-3 ${isChef ? 'text-amber-50' : 'text-slate-300'}`}>
                        {text}
                      </p>
                      {spoiler && revealed && (
                        <button onClick={() => toggleSpoiler(review.id)} className="text-[9px] text-amber-500 mt-1 hover:text-amber-400">
                          Spoiler verbergen
                        </button>
                      )}
                    </div>
                  )
                ) : (
                  <p className="text-[11px] text-slate-600 italic">Keine Textrezension</p>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-3 py-2 border-t border-white/5 mt-auto">
                {/* Author */}
                <div className="flex items-center gap-1.5">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 ${
                    isChef
                      ? 'bg-cinema-gold text-theater-950'
                      : 'bg-gradient-to-tr from-cinema-red/50 to-cinema-purple/50 text-white'
                  }`}>
                    {isChef ? <Crown className="w-2.5 h-2.5" /> : (review.username?.substring(0, 1) ?? '?').toUpperCase()}
                  </div>
                  <span className={`text-[10px] font-semibold ${isChef ? 'text-cinema-gold' : 'text-slate-300'}`}>
                    {review.username ?? 'Anonym'}
                  </span>
                  <span className="text-[9px] text-slate-600">
                    · {formatDate(review.created_at)}
                  </span>
                </div>

                {/* Helpful count */}
                {likes > 0 && (
                  <div className="flex items-center gap-1 text-[10px] text-slate-400 font-semibold">
                    <ThumbsUp className="w-3 h-3 text-cinema-green" />
                    <span>{likes}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer hint */}
      <p className="text-center text-[10px] text-slate-600 mt-4">
        Klicke auf eine Karte · um alle Rezensionen zum Film zu sehen
      </p>
    </div>
  );
};
