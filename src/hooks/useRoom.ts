import { useState, useEffect, useCallback, useRef } from 'react';
import { getSocket, getStoredPlayerId } from '../services/socket.js';
import { RoomState, UserVote, RoomSettings } from '../types/game.js';

export function useRoom() {
  const [room, setRoom] = useState<RoomState | null>(null);
  const [playerId, setPlayerId] = useState<string>(() => getStoredPlayerId());
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
      if (typeof localStorage !== 'undefined' && updatedRoom?.code) {
        localStorage.setItem('movie_bite_active_room', updatedRoom.code);
      }
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('room_updated', handleRoomUpdated);

    if (!socket.connected) {
      socket.connect();
    }

    // Auto-reconnect if active room was stored in localStorage or URL
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const urlCode = urlParams.get('room')?.toUpperCase().trim();
      const savedCode = localStorage.getItem('movie_bite_active_room')?.toUpperCase().trim();
      const codeToJoin = urlCode || savedCode;

      const savedName = localStorage.getItem('movie_bite_player_name') || 'Gast';
      const savedAvatar = localStorage.getItem('movie_bite_player_avatar') || '🍿';

      if (codeToJoin && !room) {
        console.log(`🔄 [useRoom] Automatische Wiederverbindung zu Raum [${codeToJoin}]...`);
        socket.emit('join_room', {
          code: codeToJoin,
          name: savedName,
          avatar: savedAvatar,
          playerId: getStoredPlayerId()
        }, (res: any) => {
          if (res && res.success) {
            setRoom(res.room);
            setPlayerId(res.playerId);
            localStorage.setItem('movie_bite_active_room', res.room.code);
          } else {
            // Room might be expired or not found
            localStorage.removeItem('movie_bite_active_room');
          }
        });
      }
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('room_updated', handleRoomUpdated);
    };
  }, []);

  const createRoom = useCallback((name: string, avatar: string, settings?: Partial<RoomSettings>) => {
    console.log(`🎬 [useRoom] createRoom aufgerufen: Name="${name}", Avatar="${avatar}"`, settings);
    setLoading(true);
    setError(null);
    const socket = socketRef.current;

    const performCreate = () => {
      console.log('🚀 [useRoom] Sende create_room über Socket...');
      const timeout = setTimeout(() => {
        setLoading(false);
        console.error('⏰ [useRoom] Timeout bei create_room');
        setError('Server antwortet nicht. Bitte stelle sicher, dass der Server läuft.');
      }, 6000);

      socket.emit('create_room', { name, avatar, settings }, (res: any) => {
        clearTimeout(timeout);
        setLoading(false);
        console.log('📦 [useRoom] Antwort auf create_room:', res);
        if (res && res.success) {
          setRoom(res.room);
          setPlayerId(res.playerId);
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem('movie_bite_active_room', res.room.code);
            localStorage.setItem('movie_bite_player_name', name);
            localStorage.setItem('movie_bite_player_avatar', avatar);
          }
        } else {
          setError(res?.error || 'Fehler beim Erstellen des Raumes');
        }
      });
    };

    if (!socket.connected) {
      console.log('🔌 [useRoom] Socket nicht verbunden vor createRoom -> Verbinde...');
      socket.connect();
      socket.once('connect', () => {
        performCreate();
      });
    } else {
      performCreate();
    }
  }, []);

  const joinRoom = useCallback((code: string, name: string, avatar: string) => {
    const cleanCode = code.trim().toUpperCase();
    console.log(`🚪 [useRoom] joinRoom aufgerufen: Code="${cleanCode}", Name="${name}", Avatar="${avatar}"`);
    setLoading(true);
    setError(null);
    const socket = socketRef.current;

    const performJoin = () => {
      console.log(`🚀 [useRoom] Sende join_room für Code="${cleanCode}" über Socket...`);
      const timeout = setTimeout(() => {
        setLoading(false);
        console.error(`⏰ [useRoom] Timeout bei join_room für Code="${cleanCode}"`);
        setError('Server antwortet nicht. Bitte überprüfe den Raumcode oder deine Verbindung.');
      }, 6000);

      socket.emit('join_room', { code: cleanCode, name, avatar, playerId: getStoredPlayerId() }, (res: any) => {
        clearTimeout(timeout);
        setLoading(false);
        console.log(`📦 [useRoom] Antwort auf join_room [${cleanCode}]:`, res);
        if (res && res.success) {
          setRoom(res.room);
          setPlayerId(res.playerId);
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem('movie_bite_active_room', res.room.code);
            localStorage.setItem('movie_bite_player_name', name);
            localStorage.setItem('movie_bite_player_avatar', avatar);
          }
        } else {
          setError(res?.error || 'Raum nicht gefunden');
        }
      });
    };

    if (!socket.connected) {
      console.log('🔌 [useRoom] Socket nicht verbunden vor joinRoom -> Verbinde...');
      socket.connect();
      socket.once('connect', () => {
        performJoin();
      });
    } else {
      performJoin();
    }
  }, []);

  const updateSettings = useCallback((settings: Partial<RoomSettings>) => {
    const socket = socketRef.current;
    socket.emit('update_settings', settings, (res: any) => {
      if (res && !res.success && res.error) {
        alert(res.error);
      }
    });
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

  const leaveRoom = useCallback(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('movie_bite_active_room');
    }
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('room');
      window.history.replaceState({}, '', url.toString());
    }
    setRoom(null);
  }, []);

  return {
    room,
    playerId,
    error,
    loading,
    isConnected,
    createRoom,
    joinRoom,
    updateSettings,
    toggleReady,
    startPhase,
    addMovie,
    removeMovie,
    submitVotes,
    restartGame,
    leaveRoom
  };
}
