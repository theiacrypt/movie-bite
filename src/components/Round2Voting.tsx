import React, { useState } from 'react';
import { Heart, ThumbsDown, Star, Sparkles, CheckCircle2, ChevronRight, ChevronLeft, Info, Users, Clock } from 'lucide-react';
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

  const movies = room.movies;
  const currentMovie = movies[currentIndex];
  const totalMovies = movies.length;

  const superVoteUsed = Object.values(votes).includes('superlike');
  const finishedVotersCount = room.players.filter(p => p.hasFinishedVoting).length;

  const handleVote = (type: VoteType) => {
    if (!currentMovie || isSubmitted) return;

    if (type === 'like') soundFx.playLike();
    else if (type === 'dislike') soundFx.playDislike();
    else if (type === 'superlike') soundFx.playSuperlike();

    const updatedVotes = {
      ...votes,
      [currentMovie.id]: type
    };
    setVotes(updatedVotes);

    if (currentIndex < totalMovies - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handleFinalSubmit = () => {
    soundFx.playPop();
    const formattedVotes: UserVote[] = movies.map(m => ({
      movieId: m.id,
      type: votes[m.id] || 'like' // default like if not chosen
    }));
    onSubmitVotes(formattedVotes);
  };

  const allVotedLocally = movies.every(m => votes[m.id] !== undefined);

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
            Gib jedem Film deine Stimme mit Like, Dislike oder deinem 1x Super-Vote!
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
        <div className="glass-panel rounded-3xl p-8 sm:p-12 text-center border border-white/10 space-y-4">
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
      ) : (
        /* Interactive Voting Card Deck */
        <div className="space-y-6">
          {/* Progress bar */}
          <div className="w-full bg-theater-900 rounded-full h-2 overflow-hidden border border-white/5">
            <div
              className="bg-gradient-to-r from-cinema-red to-cinema-gold h-full transition-all duration-300"
              style={{ width: `${((currentIndex + (votes[currentMovie?.id] ? 1 : 0)) / totalMovies) * 100}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold px-1">
            <span>Film {currentIndex + 1} von {totalMovies}</span>
            <span>{Object.keys(votes).length} von {totalMovies} bewertet</span>
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
                        {votes[currentMovie.id] === 'like' && (
                          <span className="text-emerald-400 inline-flex items-center gap-1">
                            <Heart className="w-3.5 h-3.5 fill-emerald-400 inline" /> Like (+1)
                          </span>
                        )}
                        {votes[currentMovie.id] === 'dislike' && (
                          <span className="text-red-400 inline-flex items-center gap-1">
                            <ThumbsDown className="w-3.5 h-3.5 inline" /> Dislike (-1)
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

                  {/* 3 Voting Buttons */}
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => handleVote('dislike')}
                      className={`py-4 rounded-2xl font-bold text-xs sm:text-sm flex flex-col items-center justify-center gap-1.5 transition-all shadow-lg active:scale-95 border ${
                        votes[currentMovie.id] === 'dislike'
                          ? 'bg-red-600/30 border-red-500 text-red-300 scale-105 shadow-red-500/30'
                          : 'bg-theater-900 hover:bg-theater-850 text-slate-400 hover:text-red-400 border-white/5'
                      }`}
                    >
                      <ThumbsDown className="w-6 h-6 text-red-400" />
                      <span>Dislike</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleVote('like')}
                      className={`py-4 rounded-2xl font-bold text-xs sm:text-sm flex flex-col items-center justify-center gap-1.5 transition-all shadow-lg active:scale-95 border ${
                        votes[currentMovie.id] === 'like'
                          ? 'bg-emerald-600/30 border-emerald-500 text-emerald-300 scale-105 shadow-emerald-500/30'
                          : 'bg-theater-900 hover:bg-theater-850 text-slate-400 hover:text-emerald-400 border-white/5'
                      }`}
                    >
                      <Heart className="w-6 h-6 text-emerald-400 fill-emerald-400" />
                      <span>Like (+1)</span>
                    </button>

                    <button
                      type="button"
                      disabled={superVoteUsed && votes[currentMovie.id] !== 'superlike'}
                      onClick={() => handleVote('superlike')}
                      className={`py-4 rounded-2xl font-bold text-xs sm:text-sm flex flex-col items-center justify-center gap-1.5 transition-all shadow-lg active:scale-95 border ${
                        votes[currentMovie.id] === 'superlike'
                          ? 'bg-cinema-gold/30 border-cinema-gold text-yellow-300 scale-105 shadow-cinema-gold/30'
                          : superVoteUsed
                          ? 'bg-theater-950 text-slate-600 border-white/5 opacity-40 cursor-not-allowed'
                          : 'bg-theater-900 hover:bg-theater-850 text-slate-400 hover:text-yellow-300 border-white/5'
                      }`}
                    >
                      <Star className="w-6 h-6 text-cinema-gold fill-cinema-gold" />
                      <span>Super (+2)</span>
                    </button>
                  </div>

                  {/* Navigation controls */}
                  <div className="flex items-center justify-between pt-2">
                    <button
                      disabled={currentIndex === 0}
                      onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                      className="p-2 rounded-xl bg-theater-900 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>

                    {allVotedLocally ? (
                      <button
                        onClick={handleFinalSubmit}
                        className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-600/30 active:scale-95"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Abstimmung abschicken</span>
                      </button>
                    ) : (
                      <span className="text-[11px] text-slate-500">Stimme für alle Filme ab</span>
                    )}

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
