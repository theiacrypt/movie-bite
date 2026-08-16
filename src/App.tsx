import React, { useState, useEffect } from 'react';
import { Header } from './components/Header.js';
import { WelcomeScreen } from './components/WelcomeScreen.js';
import { LobbyView } from './components/LobbyView.js';
import { Round1Suggestions } from './components/Round1Suggestions.js';
import { Round2Voting } from './components/Round2Voting.js';
import { WinnerShowdown } from './components/WinnerShowdown.js';
import { ShareModal } from './components/ShareModal.js';
import { SuppenstudiosAuthModal } from './components/SuppenstudiosAuthModal.js';
import { MovieReviewsModal } from './components/MovieReviewsModal.js';
import { FavoritesModal } from './components/FavoritesModal.js';
import { Movie } from './types/game.js';
import { useRoom } from './hooks/useRoom.js';

export function App() {
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(false);
  const [reviewMovie, setReviewMovie] = useState<Movie | null>(null);
  const [initialRoomCode, setInitialRoomCode] = useState('');

  const {
    room,
    playerId,
    error,
    loading,
    createRoom,
    joinRoom,
    toggleReady,
    startPhase,
    addMovie,
    removeMovie,
    submitVotes,
    restartGame
  } = useRoom();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const codeParam = urlParams.get('room');
      if (codeParam) {
        setInitialRoomCode(codeParam.toUpperCase().trim());
      }
    }
  }, []);

  const openReview = (movie: Movie) => {
    setReviewMovie(movie);
  };

  return (
    <div className="min-h-screen bg-theater-950 text-slate-100 flex flex-col font-sans">
      <Header
        roomCode={room?.code}
        phase={room?.phase}
        playerCount={room?.players.length}
        onOpenShare={() => setIsShareOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenFavorites={() => setIsFavoritesOpen(true)}
      />

      <main className="flex-1 pb-12">
        {!room ? (
          <WelcomeScreen
            onCreateRoom={createRoom}
            onJoinRoom={joinRoom}
            initialRoomCode={initialRoomCode}
            error={error}
            loading={loading}
          />
        ) : room.phase === 'LOBBY' ? (
          <LobbyView
            room={room}
            currentPlayerId={playerId}
            onToggleReady={toggleReady}
            onStartRound1={() => startPhase('ROUND_1_SUGGEST')}
            onOpenShare={() => setIsShareOpen(true)}
          />
        ) : room.phase === 'ROUND_1_SUGGEST' ? (
          <Round1Suggestions
            room={room}
            currentPlayerId={playerId}
            onAddMovie={addMovie}
            onRemoveMovie={removeMovie}
            onStartVoting={() => startPhase('ROUND_2_VOTE')}
            onOpenReview={openReview}
          />
        ) : room.phase === 'ROUND_2_VOTE' ? (
          <Round2Voting
            room={room}
            currentPlayerId={playerId}
            onSubmitVotes={submitVotes}
            onForceShowdown={() => startPhase('WINNER_SHOWDOWN')}
          />
        ) : (
          <WinnerShowdown
            room={room}
            currentPlayerId={playerId}
            onRestartGame={restartGame}
            onOpenReview={openReview}
          />
        )}
      </main>

      {/* Share Modal */}
      {room && (
        <ShareModal
          roomCode={room.code}
          isOpen={isShareOpen}
          onClose={() => setIsShareOpen(false)}
        />
      )}

      {/* Suppenstudios Account Modal */}
      <SuppenstudiosAuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />

      {/* Favoriten Modal (global) */}
      <FavoritesModal
        isOpen={isFavoritesOpen}
        onClose={() => setIsFavoritesOpen(false)}
        onOpenAuth={() => { setIsFavoritesOpen(false); setIsAuthOpen(true); }}
      />

      {/* Film-Rezensionen Modal */}
      {reviewMovie && (
        <MovieReviewsModal
          isOpen={!!reviewMovie}
          movieId={reviewMovie.id}
          movieTitle={reviewMovie.title}
          moviePoster={reviewMovie.poster}
          onClose={() => setReviewMovie(null)}
          onOpenAuth={() => {
            setReviewMovie(null);
            setIsAuthOpen(true);
          }}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-white/5 py-4 px-6 text-center text-xs text-slate-400">
        <p>
          Movie-Bite • Entwickelt für{' '}
          <strong className="text-slate-300">movie-bite.suppenstudios.work</strong> • Mit ❤️ & 🍿
        </p>
      </footer>
    </div>
  );
}

export default App;
