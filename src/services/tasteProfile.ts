import { Review, suppenstudiosAuth } from './suppenstudiosAuth.js';
import { SearchMovieResult, Movie } from '../types/game.js';
import { unlockSideQuestAchievement } from './sidequestTriggers.js';

export interface ReviewCategoryOption {
  id: string;
  label: string;
  category: 'music' | 'pacing' | 'acting' | 'story' | 'visuals' | 'emotion' | 'recommendation';
  type: 'positive' | 'negative' | 'neutral';
}

export const REVIEW_CATEGORIES = {
  music: {
    title: 'Musik & Sound',
    options: [
      { id: 'music_epic', label: 'Epischer Soundtrack', category: 'music', type: 'positive' },
      { id: 'music_great', label: 'Tolle Musik & Atmosphäre', category: 'music', type: 'positive' },
      { id: 'music_subtle', label: 'Unauffälliger Score', category: 'music', type: 'neutral' },
      { id: 'music_annoying', label: 'Nervig / Unpassend', category: 'music', type: 'negative' }
    ]
  },
  pacing: {
    title: 'Pacing & Dynamik',
    options: [
      { id: 'pacing_perfect', label: 'Perfektes Tempo', category: 'pacing', type: 'positive' },
      { id: 'pacing_gripping', label: 'Fesselnd von Anfang bis Ende', category: 'pacing', type: 'positive' },
      { id: 'pacing_slow', label: 'Zu langatmig / Zieht sich', category: 'pacing', type: 'negative' },
      { id: 'pacing_hectic', label: 'Zu hektisch / Reizüberflutung', category: 'pacing', type: 'negative' },
      { id: 'pacing_slow_start', label: 'Zäher Anfang, starkes Finale', category: 'pacing', type: 'neutral' }
    ]
  },
  acting: {
    title: 'Schauspiel & Cast',
    options: [
      { id: 'acting_oscar', label: 'Oscar-reife Darbietung', category: 'acting', type: 'positive' },
      { id: 'acting_great', label: 'Starke Chemie im Cast', category: 'acting', type: 'positive' },
      { id: 'acting_wooden', label: 'Hölzern / Mittelmäßig', category: 'acting', type: 'negative' }
    ]
  },
  story: {
    title: 'Story & Plot',
    options: [
      { id: 'story_mindfuck', label: 'Geniale Twists & Mindfuck', category: 'story', type: 'positive' },
      { id: 'story_deep', label: 'Tiefgründig & bewegend', category: 'story', type: 'positive' },
      { id: 'story_predictable', label: 'Vorhersehbar / Klischee', category: 'story', type: 'negative' },
      { id: 'story_plotholes', label: 'Logiklöcher', category: 'story', type: 'negative' }
    ]
  },
  visuals: {
    title: 'Visuals & Kamera',
    options: [
      { id: 'visuals_masterpiece', label: 'Visuelles Meisterwerk', category: 'visuals', type: 'positive' },
      { id: 'visuals_camera', label: 'Starke Ästhetik & Licht', category: 'visuals', type: 'positive' },
      { id: 'visuals_weak_cgi', label: 'Schwaches CGI', category: 'visuals', type: 'negative' }
    ]
  },
  emotion: {
    title: 'Emotion & Vibe',
    options: [
      { id: 'emotion_goosebumps', label: 'Gänsehaut', category: 'emotion', type: 'positive' },
      { id: 'emotion_tears', label: 'Tränenreich & berührend', category: 'emotion', type: 'positive' },
      { id: 'emotion_funny', label: 'Lachkrämpfe / Urkomisch', category: 'emotion', type: 'positive' },
      { id: 'emotion_scary', label: 'Gruselig / Beklemmend', category: 'emotion', type: 'neutral' },
      { id: 'emotion_popcorn', label: 'Gehirn aus & Popcorn genießen', category: 'emotion', type: 'positive' }
    ]
  },
  recommendation: {
    title: 'Empfehlung & Kontext',
    options: [
      { id: 'rec_rewatch', label: 'Sofort wieder schauen', category: 'recommendation', type: 'positive' },
      { id: 'rec_date', label: 'Perfekt für Date-Night', category: 'recommendation', type: 'positive' },
      { id: 'rec_friends', label: 'Bester Filmabend mit Freunden', category: 'recommendation', type: 'positive' },
      { id: 'rec_once', label: 'Einmal reicht völlig', category: 'recommendation', type: 'neutral' }
    ]
  }
} as const;

export interface WatchedMovieItem {
  id: string;
  title: string;
  poster: string;
  year?: string;
  genre?: string[];
  watchedAt: number;
  roomCode?: string;
  reviewed?: boolean;
  userRating?: number;
  userTags?: string[];
}

export interface ReadReviewRecord {
  reviewId: string;
  movieId: string | number;
  author: string;
  rating: number;
  readAt: number;
  tags?: string[];
}

export interface EnrichedReviewData {
  movieId: string | number;
  movieTitle: string;
  moviePoster?: string;
  rating: number;
  reviewText?: string;
  selectedTags: string[];
  readReviewsPriorCount?: number;
  influenceAlignment?: 'confirmed_hype' | 'independent_contrarian' | 'neutral';
  submittedAt: number;
}

export interface UserTasteProfile {
  totalReviews: number;
  archetype: string;
  bio: string;
  favoriteTags: string[];
  dislikedTags: string[];
  dimensions: {
    musicScore: number; // 0 - 100
    pacingSpeed: 'Hektisch' | 'Rasantes Tempo' | 'Ausgewogen' | 'Slow-Burn' | 'Nicht ermittelt';
    actingImportance: number; // 0 - 100
    mindfuckPreference: number; // 0 - 100
    visualImportance: number; // 0 - 100
    criticIndependence: number; // 0 - 100 (wie stark unabhängig von gelesenen Reviews)
  };
  preferredGenres: string[];
}

const STORAGE_WATCHED_KEY = 'moviebite_watched_history';
const STORAGE_READ_REVIEWS_KEY = 'moviebite_read_reviews_history';
const STORAGE_ENRICHED_REVIEWS_KEY = 'moviebite_enriched_reviews';

class TasteProfileService {
  private listeners: (() => void)[] = [];

  public subscribe(cb: () => void) {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter(l => l !== cb);
    };
  }

  private notify() {
    this.listeners.forEach(l => l());
  }

  // --- 1. Watched Movies History ---

  public getWatchedMovies(): WatchedMovieItem[] {
    try {
      const raw = localStorage.getItem(STORAGE_WATCHED_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  public recordWatchedMovie(movie: { id: string | number; title: string; poster?: string; year?: string; genre?: string[] }, roomCode?: string) {
    const list = this.getWatchedMovies();
    const movieIdStr = String(movie.id);
    const existing = list.find(m => m.id === movieIdStr);

    if (existing) {
      existing.watchedAt = Date.now();
      if (roomCode) existing.roomCode = roomCode;
    } else {
      list.unshift({
        id: movieIdStr,
        title: movie.title,
        poster: movie.poster || '',
        year: movie.year,
        genre: movie.genre,
        watchedAt: Date.now(),
        roomCode,
        reviewed: false
      });
    }

    localStorage.setItem(STORAGE_WATCHED_KEY, JSON.stringify(list.slice(0, 30)));
    this.notify();
  }

  public getUnreviewedWatchedMovies(): WatchedMovieItem[] {
    return this.getWatchedMovies().filter(m => !m.reviewed);
  }

  public markWatchedAsReviewed(movieId: string | number, rating?: number, tags?: string[]) {
    const list = this.getWatchedMovies();
    const item = list.find(m => m.id === String(movieId));
    if (item) {
      item.reviewed = true;
      if (rating) item.userRating = rating;
      if (tags) item.userTags = tags;
      localStorage.setItem(STORAGE_WATCHED_KEY, JSON.stringify(list));
      this.notify();
    }
  }

  // --- 2. Track Read Reviews & Influence ---

  public getReadReviewsHistory(): ReadReviewRecord[] {
    try {
      const raw = localStorage.getItem(STORAGE_READ_REVIEWS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  public recordReviewRead(review: Review, movieId: string | number) {
    const list = this.getReadReviewsHistory();
    const id = review.id;
    if (!list.find(r => r.reviewId === id)) {
      list.push({
        reviewId: id,
        movieId,
        author: review.username,
        rating: review.rating,
        readAt: Date.now()
      });
      localStorage.setItem(STORAGE_READ_REVIEWS_KEY, JSON.stringify(list.slice(-50)));
    }
  }

  public getPriorReadReviewsForMovie(movieId: string | number): ReadReviewRecord[] {
    const list = this.getReadReviewsHistory();
    return list.filter(r => String(r.movieId) === String(movieId));
  }

  // --- 3. Enriched Reviews with Detailed Categories ---

  public getEnrichedReviews(): EnrichedReviewData[] {
    try {
      const raw = localStorage.getItem(STORAGE_ENRICHED_REVIEWS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  public async saveEnrichedReview(params: {
    movieId: string | number;
    movieTitle: string;
    moviePoster?: string;
    rating: number;
    reviewText?: string;
    selectedTags: string[];
    hasSpoiler?: boolean;
  }): Promise<{ message: string; influenceText?: string }> {
    const priorReads = this.getPriorReadReviewsForMovie(params.movieId);
    
    // Influence comparison
    let alignment: 'confirmed_hype' | 'independent_contrarian' | 'neutral' = 'neutral';
    let influenceText = '';

    if (priorReads.length > 0) {
      const avgPriorRating = priorReads.reduce((s, r) => s + r.rating, 0) / priorReads.length;
      const diff = params.rating - avgPriorRating;

      if (Math.abs(diff) <= 1.5) {
        alignment = 'confirmed_hype';
        influenceText = `Dein Urteil stimmt eng mit den ${priorReads.length} zuvor gelesenen Kritiken überein (Einfluss: Bestätigt).`;
      } else if (diff <= -2.5) {
        alignment = 'independent_contrarian';
        influenceText = `Unabhängige Kritik: Du fandest den Film deutlich schwächer als zuvor gelesene Reviews (${avgPriorRating.toFixed(1)} vs ${params.rating}).`;
      } else if (diff >= 2.5) {
        alignment = 'independent_contrarian';
        influenceText = `Eigenständige Begeisterung: Du hast den Film viel positiver erlebt als vorab gelesen (${avgPriorRating.toFixed(1)} vs ${params.rating})!`;
      }
    }

    // Save locally
    const reviews = this.getEnrichedReviews();
    const existingIdx = reviews.findIndex(r => String(r.movieId) === String(params.movieId));
    
    const entry: EnrichedReviewData = {
      movieId: params.movieId,
      movieTitle: params.movieTitle,
      moviePoster: params.moviePoster,
      rating: params.rating,
      reviewText: params.reviewText,
      selectedTags: params.selectedTags,
      readReviewsPriorCount: priorReads.length,
      influenceAlignment: alignment,
      submittedAt: Date.now()
    };

    if (existingIdx >= 0) {
      reviews[existingIdx] = entry;
    } else {
      reviews.unshift(entry);
    }
    localStorage.setItem(STORAGE_ENRICHED_REVIEWS_KEY, JSON.stringify(reviews));

    // Also mark in watched list
    this.markWatchedAsReviewed(params.movieId, params.rating, params.selectedTags);

    // Send to Suppenstudios API
    let tagString = params.selectedTags.length > 0 ? `\n[TAGS: ${params.selectedTags.join(', ')}]` : '';
    let fullText = (params.reviewText || '') + tagString;
    if (params.hasSpoiler) fullText = `[SPOILER]${fullText}`;

    try {
      await suppenstudiosAuth.submitMovieReview({
        movieId: params.movieId,
        movieTitle: params.movieTitle,
        moviePoster: params.moviePoster,
        rating: params.rating,
        reviewText: fullText
      });
    } catch (err) {
      console.warn("Could not sync review to Suppenstudios API:", err);
    }

    // 🏆 Trigger SideQuest Ecosystem Achievements
    try {
      unlockSideQuestAchievement('couch_kritiker');
      if (params.rating <= 1 && (params.reviewText || '').length >= 60) {
        unlockSideQuestAchievement('hate_watcher');
      }
      if (reviews.length >= 20) {
        unlockSideQuestAchievement('cineast_meisterklasse');
      }
      if (this.getWatchedMovies().length >= 10) {
        unlockSideQuestAchievement('popcorn_gourmet');
      }
    } catch (_) {}

    this.notify();
    return {
      message: 'Rezension & detaillierte Bewertung erfolgreich gespeichert!',
      influenceText: influenceText || undefined
    };
  }

  // --- 4. Smart Taste Profile Calculation ---

  public getTasteProfile(): UserTasteProfile {
    const reviews = this.getEnrichedReviews();
    const favorites = suppenstudiosAuth.getFavorites();

    const tagCounts: Record<string, number> = {};
    let musicPositive = 0;
    let musicNegative = 0;
    let pacingSlowCount = 0;
    let pacingFastCount = 0;
    let actingPositive = 0;
    let mindfuckPositive = 0;
    let visualPositive = 0;
    let contrarianCount = 0;

    reviews.forEach(rev => {
      rev.selectedTags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        if (tag.startsWith('music_epic') || tag.startsWith('music_great')) musicPositive++;
        if (tag.startsWith('music_annoying')) musicNegative++;
        if (tag.startsWith('pacing_slow')) pacingSlowCount++;
        if (tag.startsWith('pacing_perfect') || tag.startsWith('pacing_gripping')) pacingFastCount++;
        if (tag.startsWith('acting_oscar') || tag.startsWith('acting_great')) actingPositive++;
        if (tag.startsWith('story_mindfuck')) mindfuckPositive++;
        if (tag.startsWith('visuals_masterpiece') || tag.startsWith('visuals_camera')) visualPositive++;
      });

      if (rev.influenceAlignment === 'independent_contrarian') {
        contrarianCount++;
      }
    });

    const totalRev = Math.max(reviews.length, 1);
    const musicScore = Math.min(100, Math.round((musicPositive / totalRev) * 90) + 10);
    const actingImportance = Math.min(100, Math.round((actingPositive / totalRev) * 85) + 15);
    const mindfuckPreference = Math.min(100, Math.round((mindfuckPositive / totalRev) * 95));
    const visualImportance = Math.min(100, Math.round((visualPositive / totalRev) * 90) + 10);
    const criticIndependence = Math.min(100, Math.round((contrarianCount / totalRev) * 80) + 20);

    let pacingSpeed: UserTasteProfile['dimensions']['pacingSpeed'] = 'Ausgewogen';
    if (pacingFastCount > pacingSlowCount && pacingFastCount >= 2) pacingSpeed = 'Rasantes Tempo';
    else if (pacingSlowCount >= 2) pacingSpeed = 'Slow-Burn';
    else if (reviews.length === 0) pacingSpeed = 'Nicht ermittelt';

    // Top tags
    const sortedTags = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([t]) => {
        // Resolve label
        for (const cat of Object.values(REVIEW_CATEGORIES)) {
          const opt = cat.options.find(o => o.id === t);
          if (opt) return opt.label;
        }
        return t;
      });

    const favoriteTags = sortedTags.slice(0, 4);

    // Preferred genres from favorites + high reviews
    const genreMap: Record<string, number> = {};
    favorites.forEach(f => f.genre?.forEach(g => { genreMap[g] = (genreMap[g] || 0) + 2; }));
    const preferredGenres = Object.entries(genreMap)
      .sort((a, b) => b[1] - a[1])
      .map(([g]) => g)
      .slice(0, 3);

    // Archetype Determination
    let archetype = 'Kino-Entdecker';
    let bio = 'Vielseitiger Film-Genießer mit Freude an spannenden Kino-Abenden.';

    if (musicScore >= 70 && mindfuckPreference >= 50) {
      archetype = 'Audiophiler Mindfuck-Enthusiast';
      bio = 'Liebt Filme mit grandiosen, epischen Soundtracks und genialen Plot-Twists.';
    } else if (musicScore >= 75) {
      archetype = 'Der Soundtrack-Ästhet';
      bio = 'Gute Filmmusik ist für dich die halbe Miete – ohne epischen Score fehlt etwas.';
    } else if (mindfuckPreference >= 60) {
      archetype = 'Der Mindfuck-Stratege';
      bio = 'Vorhersehbare Plots langweilen dich – du suchst unvorhersehbare Twists.';
    } else if (criticIndependence >= 65) {
      archetype = 'Unbeugsamer Kritiker';
      bio = 'Lässt sich nicht vom Hype leiten und bewertet Filme mit messerscharfem eigenem Auge.';
    } else if (visualImportance >= 70) {
      archetype = 'Der Visual-Visionär';
      bio = 'Kameraführung, CGI und atemberaubende Bildwelten begeistern dich am meisten.';
    } else if (reviews.length >= 3) {
      archetype = 'Der passionierte Cineast';
      bio = 'Ausgeglichener Filmgeschmack mit klarem Fokus auf packende Story & gute Charaktere.';
    }

    return {
      totalReviews: reviews.length,
      archetype,
      bio,
      favoriteTags: favoriteTags.length > 0 ? favoriteTags : ['Gute Story', 'Epischer Soundtrack'],
      dislikedTags: pacingSlowCount > 1 ? ['Langatmige Szenen'] : ['Logiklöcher'],
      dimensions: {
        musicScore,
        pacingSpeed,
        actingImportance,
        mindfuckPreference,
        visualImportance,
        criticIndependence
      },
      preferredGenres: preferredGenres.length > 0 ? preferredGenres : ['Sci-Fi', 'Action', 'Drama']
    };
  }

  // --- 5. Personalized Recommendation Matching Score ---

  public calculateMovieMatch(movie: SearchMovieResult | Movie): { score: number; matchReasons: string[] } {
    const profile = this.getTasteProfile();
    let score = 75; // baseline match
    const reasons: string[] = [];

    const movieGenres = (movie as any).genre || [];
    const titleLower = movie.title.toLowerCase();
    const hasSoundtrack = !!(movie as any).soundtrackHighlight || movieGenres.includes('Musik');

    // Music score matching
    if (profile.dimensions.musicScore >= 60 && hasSoundtrack) {
      score += 12;
      reasons.push('Passt zu deiner Vorliebe für erstklassige Soundtracks');
    }

    // Genre match
    const commonGenres = movieGenres.filter((g: string) => profile.preferredGenres.includes(g));
    if (commonGenres.length > 0) {
      score += commonGenres.length * 5;
      reasons.push(`Dein Lieblingsgenre: ${commonGenres.join(', ')}`);
    }

    // Mindfuck / Plot match
    if (profile.dimensions.mindfuckPreference >= 50 && (movieGenres.includes('Mystery') || movieGenres.includes('Sci-Fi') || titleLower.includes('inception') || titleLower.includes('shutter') || titleLower.includes('memento'))) {
      score += 8;
      reasons.push('Hohes Potenzial für geniale Story-Twists');
    }

    const finalScore = Math.min(99, Math.max(60, score));
    return {
      score: finalScore,
      matchReasons: reasons.length > 0 ? reasons : ['Hohe Übereinstimmung mit deinem Geschmacksprofil']
    };
  }
}

export const tasteProfileService = new TasteProfileService();
