import { useState, useEffect, useCallback, useRef } from 'react';
import { getSocket } from '../services/socket.js';
import { RoomState, UserVote } from '../types/game.js';

export function useRoom() {
  const [room, setRoom] = useState<RoomState | null>(null);
  const [playerId, setPlayerId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const socketRef = useRef(getSocket());

  useEffect(() => {
    const socket = socketRef.current;

    setIsConnected(socket.connected);

    const onConnect = () => {
      setIsConnected(true);
      setError(null);
    };

    const onDisconnect = () => {
      setIsConnected(false);
    };

    const handleRoomUpdated = (updatedRoom: RoomState) => {
      setRoom(updatedRoom);
      setError(null);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('room_updated', handleRoomUpdated);

    if (!socket.connected) {
      socket.connect();
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('room_updated', handleRoomUpdated);
    };
  }, []);

  const createRoom = useCallback((name: string, avatar: string) => {
    setLoading(true);
    setError(null);
    const socket = socketRef.current;

    const performCreate = () => {
      const timeout = setTimeout(() => {
        setLoading(false);
        setError('Server antwortet nicht. Bitte stelle sicher, dass der Server läuft.');
      }, 6000);

      socket.emit('create_room', { name, avatar }, (res: any) => {
        clearTimeout(timeout);
        setLoading(false);
        if (res && res.success) {
          setRoom(res.room);
          setPlayerId(res.playerId);
        } else {
          setError(res?.error || 'Fehler beim Erstellen des Raumes');
        }
      });
    };

    if (!socket.connected) {
      socket.connect();
      socket.once('connect', () => {
        performCreate();
      });
    } else {
      performCreate();
    }
  }, []);

  const joinRoom = useCallback((code: string, name: string, avatar: string) => {
    setLoading(true);
    setError(null);
    const socket = socketRef.current;

    const performJoin = () => {
      const timeout = setTimeout(() => {
        setLoading(false);
        setError('Server antwortet nicht. Bitte überprüfe den Raumcode oder deine Verbindung.');
      }, 6000);

      socket.emit('join_room', { code, name, avatar }, (res: any) => {
        clearTimeout(timeout);
        setLoading(false);
        if (res && res.success) {
          setRoom(res.room);
          setPlayerId(res.playerId);
        } else {
          setError(res?.error || 'Raum nicht gefunden');
        }
      });
    };

    if (!socket.connected) {
      socket.connect();
      socket.once('connect', () => {
        performJoin();
      });
    } else {
      performJoin();
    }
  }, []);

  const toggleReady = useCallback(() => {
    const socket = socketRef.current;
    socket.emit('toggle_ready');
  }, []);

  const startPhase = useCallback((phase: string) => {
    const socket = socketRef.current;
    socket.emit('start_phase', phase);
  }, []);

  const addMovie = useCallback((movie: any) => {
    const socket = socketRef.current;
    socket.emit('add_movie', movie, (res: any) => {
      if (res && !res.success && res.error) {
        alert(res.error);
      }
    });
  }, []);

  const removeMovie = useCallback((movieId: string) => {
    const socket = socketRef.current;
    socket.emit('remove_movie', movieId);
  }, []);

  const submitVotes = useCallback((votes: UserVote[]) => {
    const socket = socketRef.current;
    socket.emit('submit_votes', votes);
  }, []);

  const restartGame = useCallback(() => {
    const socket = socketRef.current;
    socket.emit('restart_game');
  }, []);

  return {
    room,
    playerId,
    error,
    loading,
    isConnected,
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
