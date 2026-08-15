import { useState, useEffect, useCallback } from 'react';
import { getSocket } from '../services/socket.js';
import { RoomState, UserVote } from '../types/game.js';

export function useRoom() {
  const [room, setRoom] = useState<RoomState | null>(null);
  const [playerId, setPlayerId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const socket = getSocket();

    const handleRoomUpdated = (updatedRoom: RoomState) => {
      setRoom(updatedRoom);
      setError(null);
    };

    socket.on('room_updated', handleRoomUpdated);

    return () => {
      socket.off('room_updated', handleRoomUpdated);
    };
  }, []);

  const createRoom = useCallback((name: string, avatar: string) => {
    setLoading(true);
    setError(null);
    const socket = getSocket();

    socket.emit('create_room', { name, avatar }, (res: any) => {
      setLoading(false);
      if (res && res.success) {
        setRoom(res.room);
        setPlayerId(res.playerId);
      } else {
        setError(res?.error || 'Fehler beim Erstellen des Raumes');
      }
    });
  }, []);

  const joinRoom = useCallback((code: string, name: string, avatar: string) => {
    setLoading(true);
    setError(null);
    const socket = getSocket();

    socket.emit('join_room', { code, name, avatar }, (res: any) => {
      setLoading(false);
      if (res && res.success) {
        setRoom(res.room);
        setPlayerId(res.playerId);
      } else {
        setError(res?.error || 'Raum nicht gefunden');
      }
    });
  }, []);

  const toggleReady = useCallback(() => {
    const socket = getSocket();
    socket.emit('toggle_ready');
  }, []);

  const startPhase = useCallback((phase: string) => {
    const socket = getSocket();
    socket.emit('start_phase', phase);
  }, []);

  const addMovie = useCallback((movie: any) => {
    const socket = getSocket();
    socket.emit('add_movie', movie, (res: any) => {
      if (res && !res.success && res.error) {
        alert(res.error);
      }
    });
  }, []);

  const removeMovie = useCallback((movieId: string) => {
    const socket = getSocket();
    socket.emit('remove_movie', movieId);
  }, []);

  const submitVotes = useCallback((votes: UserVote[]) => {
    const socket = getSocket();
    socket.emit('submit_votes', votes);
  }, []);

  const restartGame = useCallback(() => {
    const socket = getSocket();
    socket.emit('restart_game');
  }, []);

  return {
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
  };
}
