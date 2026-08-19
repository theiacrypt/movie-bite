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

export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function getStoredPlayerId(): string {
  if (typeof localStorage !== 'undefined') {
    // Check if user is logged into Suppenstudios Account
    try {
      const userRaw = localStorage.getItem('suppenstudios_user');
      if (userRaw) {
        const parsed = JSON.parse(userRaw);
        if (parsed?.id) return `user_${parsed.id}`;
      }
    } catch (_) {}

    let pid = localStorage.getItem('movie_bite_player_id');
    if (!pid) {
      pid = `mb_${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem('movie_bite_player_id', pid);
    }
    return pid;
  }
  return `mb_${Math.random().toString(36).substring(2, 9)}`;
}

class CloudflareWorkerSocket implements UnifiedSocket {
  public connected = false;
  public id = getStoredPlayerId();
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
    this.openWebSocket();
    return this;
  }

  private openWebSocket(payloadOnOpen?: string) {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      if (payloadOnOpen && this.ws.readyState === WebSocket.OPEN) {
        console.log('📡 [Socket] Sende Payload an bestehenden WebSocket:', payloadOnOpen);
        this.ws.send(payloadOnOpen);
      }
      return;
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    try {
      const fullUrl = `${this.url}?playerId=${encodeURIComponent(this.id)}${this.roomCode ? `&code=${encodeURIComponent(this.roomCode)}` : ''}`;
      console.log(`🔌 [Socket] Öffne WebSocket-Verbindung zu: ${fullUrl}`);
      this.ws = new WebSocket(fullUrl);

      this.ws.onopen = () => {
        console.log(`✅ [Socket] WebSocket erfolgreich verbunden! PlayerID: ${this.id}, RoomCode: ${this.roomCode || '(keiner)'}`);
        this.connected = true;
        this.startHeartbeat();
        this.emitLocal('connect');
        if (payloadOnOpen && this.ws?.readyState === WebSocket.OPEN) {
          console.log('📤 [Socket] Sende aufgeschobenes Initial-Payload:', payloadOnOpen);
          this.ws.send(payloadOnOpen);
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.event === 'pong') return;

          console.log(`📥 [Socket] Nachricht empfangen: [${payload.event}]`, payload.data);

          if (payload.event && payload.event.startsWith('callback_')) {
            const cbId = payload.event.replace('callback_', '');
            const cb = this.pendingCallbacks.get(cbId);
            if (cb) {
              this.pendingCallbacks.delete(cbId);
              console.log(`🎯 [Socket] Callback aufgelöst für ID ${cbId}:`, payload.data);
              cb(payload.data);
            }
            return;
          }

          if (payload.event) {
            this.emitLocal(payload.event, payload.data);
          }
        } catch (e) {
          console.error('❌ [Socket] Fehler beim Parsen der Worker-Nachricht:', e);
        }
      };

      this.ws.onclose = (ev) => {
        console.warn(`⚠️ [Socket] WebSocket getrennt (Code: ${ev.code}, Reason: ${ev.reason || 'keine'})`);
        this.handleDisconnect();
      };

      this.ws.onerror = (err) => {
        console.error('❌ [Socket] WebSocket Fehler:', err);
        this.emitLocal('connect_error', err);
        this.handleDisconnect();
      };
    } catch (err) {
      console.error('❌ [Socket] Fehler beim Erstellen des WebSockets:', err);
      this.emitLocal('connect_error', err);
      this.scheduleReconnect();
    }
  }

  private reconnectToRoom(code: string, payloadToSend?: string) {
    console.log(`🔄 [Socket] Wechsle zu Raum [${code}] (Verbindung wird neu aufgebaut)...`);
    this.roomCode = code;
    this.stopHeartbeat();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.onclose = null;
      this.ws.onerror = null;
      this.ws.onmessage = null;
      this.ws.onopen = null;
      try {
        this.ws.close();
      } catch (_) {}
      this.ws = null;
    }
    this.connected = false;
    this.openWebSocket(payloadToSend);
  }

  private handleDisconnect() {
    this.connected = false;
    this.stopHeartbeat();
    this.emitLocal('disconnect');
    this.scheduleReconnect();
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    console.log('⏱️ [Socket] Reconnect geplant in 2.5s...');
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.openWebSocket();
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
      this.ws.onclose = null;
      this.ws.onerror = null;
      this.ws.onmessage = null;
      this.ws.onopen = null;
      try {
        this.ws.close();
      } catch (_) {}
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
    let callbackId: string | undefined;
    if (callback) {
      callbackId = `cb_${++this.callbackCounter}_${Date.now()}`;
      this.pendingCallbacks.set(callbackId, callback);
    }

    console.log(`📤 [Socket.emit] Sende Event [${event}]:`, { data, callbackId });

    if (event === 'create_room') {
      const code = (data?.code || generateRoomCode()).toUpperCase().trim();
      const payloadData = { ...data, code, playerId: this.id };
      const payload = JSON.stringify({ event, data: payloadData, callbackId });
      console.log(`🆕 [Socket.emit] create_room -> Ziel-Code: ${code}`);
      this.reconnectToRoom(code, payload);
      return this;
    }

    if (event === 'join_room') {
      const code = (data?.code || '').toUpperCase().trim();
      const payloadData = { ...data, code, playerId: this.id };
      const payload = JSON.stringify({ event, data: payloadData, callbackId });
      console.log(`🚪 [Socket.emit] join_room -> Ziel-Code: ${code}, Aktueller roomCode: ${this.roomCode}`);
      if (code && this.roomCode !== code) {
        this.reconnectToRoom(code, payload);
      } else if (this.connected && this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(payload);
      } else {
        this.reconnectToRoom(code || this.roomCode, payload);
      }
      return this;
    }

    const payload = JSON.stringify({ event, data, callbackId });

    if (this.connected && this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(payload);
    } else {
      this.openWebSocket(payload);
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
