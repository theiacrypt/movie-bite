import React, { useState, useEffect, useRef } from 'react';
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
import { suppenstudiosAuth } from './services/suppenstudiosAuth.js';
import { notificationService } from './services/notificationService.js';

import { LegalModal } from './components/LegalModal.js';

export function App() {
  const [legalModalOpen, setLegalModalOpen] = useState(false);
  const [legalTab, setLegalTab] = useState<'impressum' | 'datenschutz' | 'tmdb'>('impressum');
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
    updateSettings,
    toggleReady,
    startPhase,
    addMovie,
    removeMovie,
    submitVotes,
    restartGame
  } = useRoom();

  const prevPhaseRef = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const codeParam = urlParams.get('room');
      if (codeParam) {
        setInitialRoomCode(codeParam.toUpperCase().trim());
      }
    }
  }, []);

  // Synchronize URL with active room code
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const currentUrl = new URL(window.location.href);
      if (room?.code) {
        if (currentUrl.searchParams.get('room') !== room.code) {
          currentUrl.searchParams.set('room', room.code);
          window.history.replaceState({}, '', currentUrl.toString());
        }
      }
    }
  }, [room?.code]);

  // Trigger push notification on phase transition
  useEffect(() => {
    if (room?.phase && room.phase !== prevPhaseRef.current) {
      if (prevPhaseRef.current !== null) {
        notificationService.notifyPhaseChange(room.phase, room.code);
      }
      prevPhaseRef.current = room.phase;
    }
  }, [room?.phase, room?.code]);

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
        onOpenAuth={() => suppenstudiosAuth.redirectToSSO()}
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
            onOpenAuth={() => suppenstudiosAuth.redirectToSSO()}
            onOpenReview={(movieId, movieTitle, moviePoster) =>
              setReviewMovie({ id: movieId, title: movieTitle, poster: moviePoster } as Movie)
            }
          />
        ) : room.phase === 'LOBBY' ? (
          <LobbyView
            room={room}
            currentPlayerId={playerId}
            onToggleReady={toggleReady}
            onStartRound1={() => startPhase('ROUND_1_SUGGEST')}
            onOpenShare={() => setIsShareOpen(true)}
            onUpdateSettings={updateSettings}
            onOpenAuth={() => suppenstudiosAuth.redirectToSSO()}
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
            results={room.results || []}
            isHost={room.hostId === playerId}
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
        onOpenAuth={() => { setIsFavoritesOpen(false); suppenstudiosAuth.redirectToSSO(); }}
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
      <footer className="border-t border-white/5 py-5 px-6 text-center text-xs text-slate-400 bg-theater-950/60">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-400">
          <p className="flex items-center gap-2 flex-wrap">
            <span>© {new Date().getFullYear()} Movie-Bite</span>
            <span>•</span>
            <span className="text-slate-300 font-medium">Suppenstudios</span>
          </p>
          <div className="flex items-center gap-4 flex-wrap justify-center">
            <a
              href="https://account.suppenstudios.work"
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-400/90 hover:text-amber-300 transition font-medium"
            >
              Suppenstudios Account
            </a>
            <button
              onClick={() => { setLegalTab('impressum'); setLegalModalOpen(true); }}
              className="text-slate-400 hover:text-slate-200 transition underline underline-offset-4"
            >
              Impressum
            </button>
            <button
              onClick={() => { setLegalTab('datenschutz'); setLegalModalOpen(true); }}
              className="text-slate-400 hover:text-slate-200 transition underline underline-offset-4"
            >
              Datenschutz
            </button>
            <button
              onClick={() => { setLegalTab('tmdb'); setLegalModalOpen(true); }}
              className="text-slate-400 hover:text-slate-200 transition underline underline-offset-4"
            >
              TMDB Lizenz
            </button>
          </div>
        </div>
      </footer>

      {/* Legal Modal */}
      <LegalModal
        isOpen={legalModalOpen}
        onClose={() => setLegalModalOpen(false)}
        initialTab={legalTab}
      />
    </div>
  );
}

export default App;
