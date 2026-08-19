import React, { useState } from 'react';
import {
  Heart, ThumbsDown, Star, Sparkles, CheckCircle2, ChevronRight, ChevronLeft,
  Info, Users, MinusCircle, ListFilter, RotateCcw, Send, Check
} from 'lucide-react';
import { RoomState, Movie, UserVote, VoteType } from '../types/game.js';
import { MovieDetailModal } from './MovieDetailModal.js';
import { soundFx } from '../services/soundEffects.js';

interface Round2VotingProps {
  room: RoomState;
  currentPlayerId: string;
  onSubmitVotes: (votes: UserVote[]) => void;
  onForceShowdown: () => void;
}

export const Round2Voting: React.FC<Round2VotingProps> = ({
  room,
  currentPlayerId,
  onSubmitVotes,
  onForceShowdown
}) => {
  const isHost = room.hostId === currentPlayerId;
  const me = room.players.find(p => p.id === currentPlayerId);
  const isSubmitted = me?.hasFinishedVoting || false;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [votes, setVotes] = useState<Record<string, VoteType>>({});
  const [selectedDetailMovie, setSelectedDetailMovie] = useState<Movie | null>(null);
  const [viewMode, setViewMode] = useState<'card' | 'summary'>('card');

  const movies = room.movies;
  const currentMovie = movies[currentIndex];
  const totalMovies = movies.length;

  const superVoteUsed = Object.values(votes).includes('superlike');
  const finishedVotersCount = room.players.filter(p => p.hasFinishedVoting).length;

  const handleVote = (type: VoteType, targetMovieId?: string) => {
    const movieId = targetMovieId || currentMovie?.id;
    if (!movieId || isSubmitted) return;

    if (type === 'like') soundFx.playLike();
    else if (type === 'dislike') soundFx.playDislike();
    else if (type === 'superlike') soundFx.playSuperlike();
    else soundFx.playPop();

    // If changing superlike, clear previous superlike if set on other movie
    let newVotes = { ...votes };
    if (type === 'superlike') {
      Object.keys(newVotes).forEach(id => {
        if (newVotes[id] === 'superlike' && id !== movieId) {
          newVotes[id] = 'like';
        }
      });
    }

    newVotes[movieId] = type;
    setVotes(newVotes);

    if (!targetMovieId) {
      if (currentIndex < totalMovies - 1) {
        setCurrentIndex(prev => prev + 1);
      } else {
        // Automatically show summary review when all movies have been voted
        setViewMode('summary');
      }
    }
  };

  const handleFinalSubmit = () => {
    soundFx.playPop();
    const formattedVotes: UserVote[] = movies.map(m => ({
      movieId: m.id,
      type: votes[m.id] || 'neutral' // default to neutral if unvoted
    }));
    onSubmitVotes(formattedVotes);
  };

  const allVotedLocally = movies.length > 0 && movies.every(m => votes[m.id] !== undefined);

  const stats = {
    likes: Object.values(votes).filter(v => v === 'like').length,
    neutrals: Object.values(votes).filter(v => v === 'neutral').length,
    dislikes: Object.values(votes).filter(v => v === 'dislike').length,
    superlikes: Object.values(votes).filter(v => v === 'superlike').length,
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header Banner */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cinema-red/15 border border-cinema-red/30 text-red-300 text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Runde 2 von 2</span>
          </div>
          <h2 className="font-display font-black text-2xl sm:text-3xl text-white">
            Favoriten wählen & abstimmen
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Bewerte jeden Film mit Like (+1), Neutral (0), Dislike (-1) oder 1x Super-Vote (+2)!
          </p>
        </div>

        {/* Live Voting Progress */}
        <div className="bg-theater-900/80 px-4 py-3 rounded-2xl border border-white/5 flex items-center gap-3">
          <Users className="w-5 h-5 text-cinema-gold shrink-0" />
          <div>
            <div className="text-xs text-slate-400 font-semibold uppercase">Abgestimmt</div>
            <div className="font-display font-bold text-white text-sm">
              {finishedVotersCount} / {room.players.length} Spieler
            </div>
          </div>
        </div>
      </div>

      {isSubmitted ? (
        /* Waiting for other players */
        <div className="glass-panel rounded-3xl p-8 sm:p-12 text-center border border-white/10 space-y-4 animate-in fade-in">
          <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/30">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="font-display font-bold text-2xl text-white">Deine Stimmen sind abgegeben!</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            Wir warten auf die restlichen Teilnehmer. Sobald alle fertig sind, wird der Gewinnerfilm enthüllt!
          </p>

          <div className="pt-4 flex flex-wrap gap-2 justify-center">
            {room.players.map(p => (
              <div
                key={p.id}
                className={`px-3 py-1.5 rounded-full border text-xs font-medium flex items-center gap-1.5 ${
                  p.hasFinishedVoting
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                    : 'bg-theater-900 border-white/5 text-slate-400'
                }`}
              >
                <span>{p.avatar}</span>
                <span>{p.name}</span>
                {p.hasFinishedVoting && <CheckCircle2 className="w-3.5 h-3.5" />}
              </div>
            ))}
          </div>

          {isHost && (
            <div className="pt-6">
              <button
                onClick={() => {
                  soundFx.playPop();
                  onForceShowdown();
                }}
                className="px-6 py-3 rounded-2xl bg-theater-800 hover:bg-theater-700 text-slate-300 hover:text-white border border-white/10 text-xs font-semibold transition-all shadow-md active:scale-95"
              >
                Voting jetzt beenden & Gewinner enthüllen (Host)
              </button>
            </div>
          )}
        </div>
      ) : viewMode === 'summary' ? (
        /* Summary / Review Table before Final Submission */
        <div className="glass-panel rounded-3xl p-5 sm:p-7 border border-white/10 space-y-6 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
            <div>
              <h3 className="font-display font-bold text-xl text-white flex items-center gap-2">
                <ListFilter className="w-5 h-5 text-cinema-red" />
                <span>Überprüfe deine Bewertungen</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Hier siehst du all deine Entscheidungen auf einen Blick. Du kannst jede Bewertung noch anpassen!
              </p>
            </div>

            <button
              onClick={() => setViewMode('card')}
              className="px-3.5 py-2 rounded-xl bg-theater-900 hover:bg-theater-850 border border-white/10 text-xs font-semibold text-slate-300 flex items-center gap-1.5 self-start sm:self-auto transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Zur Kartenansicht</span>
            </button>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center">
              <div className="flex items-center justify-center gap-1.5 text-emerald-400 font-bold text-sm">
                <Heart className="w-4 h-4 fill-emerald-400" />
                <span>{stats.likes} Likes (+1)</span>
              </div>
            </div>
            <div className="p-3 rounded-2xl bg-slate-500/10 border border-slate-500/20 text-center">
              <div className="flex items-center justify-center gap-1.5 text-slate-300 font-bold text-sm">
                <MinusCircle className="w-4 h-4" />
                <span>{stats.neutrals} Neutral (0)</span>
              </div>
            </div>
            <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-center">
              <div className="flex items-center justify-center gap-1.5 text-red-400 font-bold text-sm">
                <ThumbsDown className="w-4 h-4" />
                <span>{stats.dislikes} Dislikes (-1)</span>
              </div>
            </div>
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center">
              <div className="flex items-center justify-center gap-1.5 text-yellow-400 font-bold text-sm">
                <Star className="w-4 h-4 fill-yellow-400" />
                <span>{stats.superlikes} Super (+2)</span>
              </div>
            </div>
          </div>

          {/* Interactive Review Table */}
          <div className="divide-y divide-white/5 overflow-hidden rounded-2xl border border-white/10 bg-theater-900/60">
            {movies.map((movie, idx) => {
              const currentVote = votes[movie.id] || 'neutral';
              return (
                <div
                  key={movie.id}
                  className="p-3.5 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-theater-850/50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs font-mono font-bold text-slate-500 w-5">#{idx + 1}</span>
                    <img
                      src={movie.poster}
                      alt={movie.title}
                      className="w-12 h-16 object-cover rounded-xl shrink-0 shadow bg-theater-950 cursor-pointer"
                      onClick={() => setSelectedDetailMovie(movie)}
                    />
                    <div className="min-w-0">
                      <h4
                        onClick={() => setSelectedDetailMovie(movie)}
                        className="font-display font-bold text-sm sm:text-base text-white hover:text-cinema-red cursor-pointer truncate transition-colors"
                      >
                        {movie.title}
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                        <span>{movie.year}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-cinema-gold">
                          <Star className="w-3 h-3 fill-cinema-gold" />
                          {movie.rating}
                        </span>
                        {movie.runtime && (
                          <>
                            <span>•</span>
                            <span>{movie.runtime}</span>
                          </>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* 4-Option Vote Buttons in Table Row */}
                  <div className="grid grid-cols-4 gap-1.5 shrink-0 self-end md:self-center w-full md:w-auto">
                    {/* Dislike */}
                    <button
                      type="button"
                      onClick={() => handleVote('dislike', movie.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1 border transition-all ${
                        currentVote === 'dislike'
                          ? 'bg-red-600/30 border-red-500 text-red-300 shadow-md shadow-red-500/20'
                          : 'bg-theater-900 text-slate-400 hover:text-red-400 border-white/5'
                      }`}
                    >
                      <ThumbsDown className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Dislike</span>
                      <span className="text-[10px]">(-1)</span>
                    </button>

                    {/* Neutral */}
                    <button
                      type="button"
                      onClick={() => handleVote('neutral', movie.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1 border transition-all ${
                        currentVote === 'neutral'
                          ? 'bg-slate-700/50 border-slate-400 text-white shadow-md'
                          : 'bg-theater-900 text-slate-400 hover:text-slate-200 border-white/5'
                      }`}
                    >
                      <MinusCircle className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Neutral</span>
                      <span className="text-[10px]">(0)</span>
                    </button>

                    {/* Like */}
                    <button
                      type="button"
                      onClick={() => handleVote('like', movie.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1 border transition-all ${
                        currentVote === 'like'
                          ? 'bg-emerald-600/30 border-emerald-500 text-emerald-300 shadow-md shadow-emerald-500/20'
                          : 'bg-theater-900 text-slate-400 hover:text-emerald-400 border-white/5'
                      }`}
                    >
                      <Heart className="w-3.5 h-3.5 fill-current" />
                      <span className="hidden sm:inline">Like</span>
                      <span className="text-[10px]">(+1)</span>
                    </button>

                    {/* Superlike */}
                    <button
                      type="button"
                      onClick={() => handleVote('superlike', movie.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1 border transition-all ${
                        currentVote === 'superlike'
                          ? 'bg-cinema-gold/30 border-cinema-gold text-yellow-300 shadow-md shadow-cinema-gold/20'
                          : 'bg-theater-900 text-slate-400 hover:text-yellow-300 border-white/5'
                      }`}
                    >
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <span className="hidden sm:inline">Super</span>
                      <span className="text-[10px]">(+2)</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Confirm & Submit Button */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-slate-400">
              {allVotedLocally
                ? '✅ Alle Filme bewertet!'
                : `Hinweis: Noch ${movies.length - Object.keys(votes).length} Filme unbewertet (zählen als Neutral).`}
            </p>

            <button
              onClick={handleFinalSubmit}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-xl shadow-emerald-600/30 active:scale-95 transition-all"
            >
              <Send className="w-4 h-4" />
              <span>Stimmen endgültig abschicken</span>
            </button>
          </div>
        </div>
      ) : (
        /* Interactive Voting Card Deck */
        <div className="space-y-6 animate-in fade-in">
          {/* Progress bar */}
          <div className="w-full bg-theater-900 rounded-full h-2 overflow-hidden border border-white/5">
            <div
              className="bg-gradient-to-r from-cinema-red to-cinema-gold h-full transition-all duration-300"
              style={{ width: `${((currentIndex + (votes[currentMovie?.id] ? 1 : 0)) / totalMovies) * 100}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold px-1">
            <span>Film {currentIndex + 1} von {totalMovies}</span>
            <button
              onClick={() => setViewMode('summary')}
              className="text-cinema-red hover:underline flex items-center gap-1 font-bold"
            >
              <ListFilter className="w-3.5 h-3.5" />
              <span>Tabelle & Zusammenfassung ({Object.keys(votes).length}/{totalMovies})</span>
            </button>
          </div>

          {/* Current Movie Vote Card */}
          {currentMovie && (
            <div className="glass-panel rounded-3xl overflow-hidden border border-white/10 shadow-2xl relative">
              <div className="grid grid-cols-1 md:grid-cols-2">
                {/* Poster & Backdrop */}
                <div className="relative h-72 sm:h-96 md:h-full min-h-[320px] bg-theater-950 overflow-hidden">
                  <img
                    src={currentMovie.poster}
                    alt={currentMovie.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-theater-950 via-transparent to-transparent md:hidden" />

                  {/* Badges */}
                  <div className="absolute top-4 left-4 flex items-center gap-1 bg-theater-950/80 backdrop-blur-md px-3 py-1 rounded-xl border border-cinema-gold/30 text-cinema-gold text-xs font-bold shadow-lg">
                    <Star className="w-4 h-4 fill-cinema-gold" />
                    <span>{currentMovie.rating}</span>
                  </div>

                  <button
                    onClick={() => setSelectedDetailMovie(currentMovie)}
                    className="absolute top-4 right-4 p-2 rounded-xl bg-theater-950/80 backdrop-blur-md border border-white/10 text-slate-300 hover:text-white transition-colors"
                  >
                    <Info className="w-4 h-4" />
                  </button>
                </div>

                {/* Details & Voting Controls */}
                <div className="p-6 sm:p-8 flex flex-col justify-between space-y-6">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-semibold text-slate-400 bg-theater-900 px-2.5 py-0.5 rounded-lg">
                        {currentMovie.year}
                      </span>
                      {currentMovie.genre.map((g) => (
                        <span key={g} className="text-xs bg-theater-900 text-slate-300 px-2.5 py-0.5 rounded-lg">
                          {g}
                        </span>
                      ))}
                    </div>

                    <h3 className="font-display font-black text-2xl sm:text-3xl text-white tracking-tight leading-tight">
                      {currentMovie.title}
                    </h3>

                    <p className="text-sm text-slate-300 mt-4 leading-relaxed line-clamp-4 bg-theater-900/40 p-4 rounded-2xl border border-white/5">
                      {currentMovie.plot}
                    </p>

                    {currentMovie.suggestedBy && (
                      <p className="text-xs text-slate-400 mt-3 flex items-center gap-1.5">
                        <span>{currentMovie.suggestedBy.avatar}</span>
                        <span>Vorgeschlagen von <strong className="text-slate-200">{currentMovie.suggestedBy.name}</strong></span>
                      </p>
                    )}
                  </div>

                  {/* Current Choice Indicator */}
                  {votes[currentMovie.id] && (
                    <div className="p-3 rounded-2xl bg-theater-900 border border-white/10 text-center">
                      <span className="text-xs text-slate-400">Deine Wahl für diesen Film: </span>
                      <span className="text-xs font-bold uppercase tracking-wider text-white inline-flex items-center gap-1.5 ml-1">
                        {votes[currentMovie.id] === 'dislike' && (
                          <span className="text-red-400 inline-flex items-center gap-1">
                            <ThumbsDown className="w-3.5 h-3.5 inline" /> Dislike (-1)
                          </span>
                        )}
                        {votes[currentMovie.id] === 'neutral' && (
                          <span className="text-slate-300 inline-flex items-center gap-1">
                            <MinusCircle className="w-3.5 h-3.5 inline" /> Neutral (0)
                          </span>
                        )}
                        {votes[currentMovie.id] === 'like' && (
                          <span className="text-emerald-400 inline-flex items-center gap-1">
                            <Heart className="w-3.5 h-3.5 fill-emerald-400 inline" /> Like (+1)
                          </span>
                        )}
                        {votes[currentMovie.id] === 'superlike' && (
                          <span className="text-yellow-400 inline-flex items-center gap-1">
                            <Star className="w-3.5 h-3.5 fill-yellow-400 inline" /> Super-Vote (+2)
                          </span>
                        )}
                      </span>
                    </div>
                  )}

                  {/* 4 Voting Buttons */}
                  <div className="grid grid-cols-4 gap-2">
                    {/* Dislike */}
                    <button
                      type="button"
                      onClick={() => handleVote('dislike')}
                      className={`py-3.5 rounded-2xl font-bold text-xs flex flex-col items-center justify-center gap-1 transition-all shadow-lg active:scale-95 border ${
                        votes[currentMovie.id] === 'dislike'
                          ? 'bg-red-600/30 border-red-500 text-red-300 scale-105 shadow-red-500/30'
                          : 'bg-theater-900 hover:bg-theater-850 text-slate-400 hover:text-red-400 border-white/5'
                      }`}
                    >
                      <ThumbsDown className="w-5 h-5 text-red-400" />
                      <span>Dislike</span>
                      <span className="text-[10px] text-slate-500">(-1)</span>
                    </button>

                    {/* Neutral */}
                    <button
                      type="button"
                      onClick={() => handleVote('neutral')}
                      className={`py-3.5 rounded-2xl font-bold text-xs flex flex-col items-center justify-center gap-1 transition-all shadow-lg active:scale-95 border ${
                        votes[currentMovie.id] === 'neutral'
                          ? 'bg-slate-700/50 border-slate-400 text-white scale-105 shadow-slate-500/30'
                          : 'bg-theater-900 hover:bg-theater-850 text-slate-400 hover:text-slate-200 border-white/5'
                      }`}
                    >
                      <MinusCircle className="w-5 h-5 text-slate-300" />
                      <span>Neutral</span>
                      <span className="text-[10px] text-slate-500">(0)</span>
                    </button>

                    {/* Like */}
                    <button
                      type="button"
                      onClick={() => handleVote('like')}
                      className={`py-3.5 rounded-2xl font-bold text-xs flex flex-col items-center justify-center gap-1 transition-all shadow-lg active:scale-95 border ${
                        votes[currentMovie.id] === 'like'
                          ? 'bg-emerald-600/30 border-emerald-500 text-emerald-300 scale-105 shadow-emerald-500/30'
                          : 'bg-theater-900 hover:bg-theater-850 text-slate-400 hover:text-emerald-400 border-white/5'
                      }`}
                    >
                      <Heart className="w-5 h-5 text-emerald-400 fill-emerald-400" />
                      <span>Like</span>
                      <span className="text-[10px] text-slate-500">(+1)</span>
                    </button>

                    {/* Superlike */}
                    <button
                      type="button"
                      onClick={() => handleVote('superlike')}
                      className={`py-3.5 rounded-2xl font-bold text-xs flex flex-col items-center justify-center gap-1 transition-all shadow-lg active:scale-95 border ${
                        votes[currentMovie.id] === 'superlike'
                          ? 'bg-cinema-gold/30 border-cinema-gold text-yellow-300 scale-105 shadow-cinema-gold/30'
                          : 'bg-theater-900 hover:bg-theater-850 text-slate-400 hover:text-yellow-300 border-white/5'
                      }`}
                    >
                      <Star className="w-5 h-5 text-cinema-gold fill-cinema-gold" />
                      <span>Super</span>
                      <span className="text-[10px] text-slate-500">(+2)</span>
                    </button>
                  </div>

                  {/* Navigation & Table Review link */}
                  <div className="flex items-center justify-between pt-2">
                    <button
                      disabled={currentIndex === 0}
                      onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                      className="p-2 rounded-xl bg-theater-900 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>

                    <button
                      onClick={() => setViewMode('summary')}
                      className="px-4 py-2 rounded-xl bg-theater-850 hover:bg-theater-800 text-slate-200 border border-white/10 text-xs font-semibold flex items-center gap-1.5 transition-all shadow"
                    >
                      <ListFilter className="w-3.5 h-3.5 text-cinema-red" />
                      <span>Tabelle / Übersicht</span>
                    </button>

                    <button
                      disabled={currentIndex === totalMovies - 1}
                      onClick={() => setCurrentIndex(prev => Math.min(totalMovies - 1, prev + 1))}
                      className="p-2 rounded-xl bg-theater-900 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <MovieDetailModal
        movie={selectedDetailMovie}
        onClose={() => setSelectedDetailMovie(null)}
      />
    </div>
  );
};

