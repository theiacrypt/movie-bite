import { io, Socket } from 'socket.io-client';

export interface UnifiedSocket {
  connected: boolean;
  id: string;
  on(event: string, callback: (...args: any[]) => void): this;
  off(event: string, callback?: (...args: any[]) => void): this;
  once(event: string, callback: (...args: any[]) => void): this;
  emit(event: string, data?: any, callback?: (...args: any[]) => void): this;
  connect(): this;
  disconnect(): this;
}

export function getBackendBaseUrl(): string {
  const isDev = import.meta.env.DEV;

  const customUrl =
    (typeof window !== 'undefined' && (window as any).__MOVIE_BITE_BACKEND_URL__) ||
    (typeof localStorage !== 'undefined' && localStorage.getItem('MOVIE_BITE_BACKEND_URL')) ||
    (import.meta.env.VITE_BACKEND_URL as string);

  if (customUrl) {
    return customUrl.replace(/\/+$/, '');
  }

  if (isDev) {
    return 'http://localhost:3001';
  }

  // If on Pages or custom domain, fallback to Cloudflare Worker backend
  if (
    typeof window !== 'undefined' &&
    (window.location.hostname.includes('pages.dev') ||
      window.location.hostname.includes('suppenstudios.work') ||
      window.location.hostname.includes('localhost') ||
      window.location.hostname.includes('127.0.0.1'))
  ) {
    return 'https://movie-bite-worker.suppenchris.workers.dev';
  }

  return typeof window !== 'undefined' ? window.location.origin : '';
}

class CloudflareWorkerSocket implements UnifiedSocket {
  public connected = false;
  public id = `cf_${Math.random().toString(36).substring(2, 9)}`;
  private ws: WebSocket | null = null;
  private listeners: Map<string, Set<Function>> = new Map();
  private callbackCounter = 0;
  private pendingCallbacks: Map<string, Function> = new Map();
  private reconnectTimer: any = null;
  private pingInterval: any = null;
  private url: string;
  private roomCode: string = '';

  constructor(backendUrl: string) {
    let wsUrl = backendUrl;
    if (wsUrl.startsWith('http://')) {
      wsUrl = wsUrl.replace('http://', 'ws://');
    } else if (wsUrl.startsWith('https://')) {
      wsUrl = wsUrl.replace('https://', 'wss://');
    } else if (!wsUrl.startsWith('ws://') && !wsUrl.startsWith('wss://')) {
      const proto = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      wsUrl = `${proto}//${wsUrl}`;
    }

    // Clean trailing slash
    wsUrl = wsUrl.replace(/\/+$/, '');
    this.url = `${wsUrl}/ws`;
  }

  public connect(): this {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return this;
    }

    try {
      const fullUrl = `${this.url}?playerId=${encodeURIComponent(this.id)}${this.roomCode ? `&code=${encodeURIComponent(this.roomCode)}` : ''}`;
      this.ws = new WebSocket(fullUrl);

      this.ws.onopen = () => {
        this.connected = true;
        this.startHeartbeat();
        this.emitLocal('connect');
      };

      this.ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.event === 'pong') return;

          if (payload.event && payload.event.startsWith('callback_')) {
            const cbId = payload.event.replace('callback_', '');
            const cb = this.pendingCallbacks.get(cbId);
            if (cb) {
              this.pendingCallbacks.delete(cbId);
              cb(payload.data);
            }
            return;
          }

          if (payload.event) {
            this.emitLocal(payload.event, payload.data);
          }
        } catch (e) {
          console.error('Error parsing worker message:', e);
        }
      };

      this.ws.onclose = () => {
        this.handleDisconnect();
      };

      this.ws.onerror = (err) => {
        this.emitLocal('connect_error', err);
        this.handleDisconnect();
      };
    } catch (err) {
      this.emitLocal('connect_error', err);
      this.scheduleReconnect();
    }

    return this;
  }

  private handleDisconnect() {
    this.connected = false;
    this.stopHeartbeat();
    this.emitLocal('disconnect');
    this.scheduleReconnect();
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, 2500);
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.pingInterval = setInterval(() => {
      if (this.connected && this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ event: 'ping' }));
      }
    }, 15000);
  }

  private stopHeartbeat() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  public disconnect(): this {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.connected = false;
    return this;
  }

  public on(event: string, callback: (...args: any[]) => void): this {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    return this;
  }

  public off(event: string, callback?: (...args: any[]) => void): this {
    if (!callback) {
      this.listeners.delete(event);
    } else {
      this.listeners.get(event)?.delete(callback);
    }
    return this;
  }

  public once(event: string, callback: (...args: any[]) => void): this {
    const onceWrapper = (...args: any[]) => {
      this.off(event, onceWrapper);
      callback(...args);
    };
    this.on(event, onceWrapper);
    return this;
  }

  public emit(event: string, data?: any, callback?: (...args: any[]) => void): this {
    if (event === 'join_room' && data?.code) {
      this.roomCode = data.code;
    }

    let callbackId: string | undefined;
    if (callback) {
      callbackId = `cb_${++this.callbackCounter}_${Date.now()}`;
      this.pendingCallbacks.set(callbackId, callback);
    }

    const payload = JSON.stringify({ event, data, callbackId });

    if (this.connected && this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(payload);
    } else {
      this.connect();
      this.once('connect', () => {
        if (this.ws?.readyState === WebSocket.OPEN) {
          this.ws.send(payload);
        }
      });
    }

    return this;
  }

  private emitLocal(event: string, ...args: any[]) {
    const set = this.listeners.get(event);
    if (set) {
      set.forEach((cb) => {
        try {
          cb(...args);
        } catch (e) {
          console.error(`Error in listener for ${event}:`, e);
        }
      });
    }
  }
}

let socketInstance: UnifiedSocket | null = null;

export function getSocket(): UnifiedSocket {
  if (!socketInstance) {
    const isDev = import.meta.env.DEV;
    const serverUrl = getBackendBaseUrl();

    const isWorker =
      serverUrl.includes('workers.dev') ||
      serverUrl.includes('pages.dev') ||
      serverUrl.includes('/ws') ||
      (!isDev && serverUrl.startsWith('http'));

    if (isWorker) {
      socketInstance = new CloudflareWorkerSocket(serverUrl);
      socketInstance.connect();
    } else {
      // Standard Socket.IO Node.js connection
      const socket = io(serverUrl || undefined, {
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 25,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 10000,
        transports: ['polling', 'websocket'],
        upgrade: true,
        withCredentials: false
      });

      socket.on('connect', () => {
        console.log('⚡ Socket.IO erfolgreich verbunden! ID:', socket.id);
      });

      socket.on('connect_error', (err) => {
        console.warn('⚠️ Socket Verbindungsfehler:', err.message);
      });

      socketInstance = socket as unknown as UnifiedSocket;
    }
  }
  return socketInstance;
}
