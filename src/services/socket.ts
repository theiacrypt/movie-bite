import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    const isDev = import.meta.env.DEV;
    // In dev mode when accessed via Vite (port 3000), connect directly to port 3001
    const serverUrl = (isDev && typeof window !== 'undefined' && window.location.port === '3000')
      ? 'http://localhost:3001'
      : undefined;

    socket = io(serverUrl, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 15,
      reconnectionDelay: 1000,
      timeout: 8000,
      transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
      console.log('⚡ Socket connected to server with ID:', socket?.id);
    });

    socket.on('connect_error', (err) => {
      console.warn('⚠️ Socket connection error:', err.message);
    });
  }
  return socket;
}
