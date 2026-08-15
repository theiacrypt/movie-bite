import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    const isDev = import.meta.env.DEV;

    // Configurable backend URL if frontend is separated from backend
    const customUrl = 
      (typeof window !== 'undefined' && (window as any).__MOVIE_BITE_BACKEND_URL__) ||
      (typeof localStorage !== 'undefined' && localStorage.getItem('MOVIE_BITE_BACKEND_URL')) ||
      (import.meta.env.VITE_BACKEND_URL as string);

    let serverUrl: string | undefined = customUrl;

    if (!serverUrl && isDev && typeof window !== 'undefined' && window.location.port === '3000') {
      serverUrl = 'http://localhost:3001';
    }

    // Default to origin in production
    socket = io(serverUrl || undefined, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 25,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
      // Polling first ensures maximum compatibility behind Nginx / Cloudflare / Reverse Proxies
      transports: ['polling', 'websocket'],
      upgrade: true,
      withCredentials: false
    });

    socket.on('connect', () => {
      console.log('⚡ Socket.IO erfolgreich verbunden! ID:', socket?.id);
    });

    socket.on('connect_error', (err) => {
      console.warn('⚠️ Socket Verbindungsfehler:', err.message);
    });
  }
  return socket;
}
