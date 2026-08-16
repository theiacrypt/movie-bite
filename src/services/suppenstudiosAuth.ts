import { startRegistration, startAuthentication } from '@simplewebauthn/browser';

export interface User {
  id: string;
  username: string;
  email?: string;
  avatar_url?: string;
  totp_enabled: boolean;
  has_passkey?: boolean;
}

export interface Review {
  id: string;
  movie_id: string;
  movie_title: string;
  movie_poster?: string;
  rating: number; // 1 - 10
  review_text: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  username?: string;
  avatar_url?: string;
}

export interface ReviewsResponse {
  movieId: string;
  count: number;
  averageRating: number | null;
  reviews: Review[];
}

const AUTH_STORAGE_KEY = 'suppenstudios_auth_token';
const USER_STORAGE_KEY = 'suppenstudios_auth_user';

// Basis-URL für Auth Service (standardmäßig lokaler Auth-Worker Port 8787 oder konfigurierbar)
const getApiBase = () => {
  if (typeof window !== 'undefined') {
    const custom = localStorage.getItem('suppenstudios_auth_api_url');
    if (custom) return custom;
    // Wenn lokal entwickelt wird, kann localhost:8787 oder der Live-Worker genutzt werden
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:8787';
    }
  }
  return 'https://suppenstudios-auth.suppenchris.workers.dev';
};

class SuppenstudiosAuthService {
  private token: string | null = null;
  private currentUser: User | null = null;
  private listeners: ((user: User | null) => void)[] = [];

  constructor() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem(AUTH_STORAGE_KEY);
      const cached = localStorage.getItem(USER_STORAGE_KEY);
      if (cached) {
        try {
          this.currentUser = JSON.parse(cached);
        } catch (_) {}
      }
      if (this.token) {
        this.fetchProfile().catch(() => this.logout());
      }
    }
  }

  public subscribe(callback: (user: User | null) => void) {
    this.listeners.push(callback);
    callback(this.currentUser);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  private notify() {
    this.listeners.forEach(l => l(this.currentUser));
  }

  public getToken(): string | null {
    return this.token;
  }

  public getUser(): User | null {
    return this.currentUser;
  }

  public isLoggedIn(): boolean {
    return !!this.token && !!this.currentUser;
  }

  public setApiBase(url: string) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('suppenstudios_auth_api_url', url);
    }
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const baseUrl = getApiBase();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || `Fehler (${response.status})`);
    }
    return data;
  }

  // --- Authentifizierung ---

  public async register(username: string, password: string, email?: string) {
    const data = await this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password, email }),
    });

    if (data.token && data.user) {
      this.setSession(data.token, data.user);
    }
    return data;
  }

  public async login(username: string, password: string) {
    const data = await this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });

    if (data.requires2FA) {
      return { requires2FA: true, tempToken: data.tempToken, message: data.message };
    }

    if (data.token && data.user) {
      this.setSession(data.token, data.user);
    }
    return data;
  }

  public async validate2FALogin(tempToken: string, code: string) {
    const data = await this.request('/api/auth/2fa/validate-login', {
      method: 'POST',
      body: JSON.stringify({ tempToken, code }),
    });

    if (data.token && data.user) {
      this.setSession(data.token, data.user);
    }
    return data;
  }

  // --- Passkeys (WebAuthn) ---

  public async registerPasskey(deviceName = 'Mein Passkey') {
    if (!this.isLoggedIn()) throw new Error('Bitte melde dich zuerst an.');

    // 1. Registration Options abholen
    const { options, challengeId } = await this.request('/api/auth/passkey/register-options', {
      method: 'POST',
    });

    // 2. Browser WebAuthn Prompt starten
    const passkeyResponse = await startRegistration({ optionsJSON: options });

    // 3. Antwort an Worker zur Verifikation senden
    const result = await this.request('/api/auth/passkey/register-verify', {
      method: 'POST',
      body: JSON.stringify({ response: passkeyResponse, challengeId, deviceName }),
    });

    if (this.currentUser) {
      this.currentUser.has_passkey = true;
      this.notify();
    }

    return result;
  }

  public async loginWithPasskey(username?: string) {
    // 1. Authentication Options abholen
    const { options, challengeId } = await this.request('/api/auth/passkey/login-options', {
      method: 'POST',
      body: JSON.stringify({ username }),
    });

    // 2. Browser WebAuthn Prompt ausführen
    const passkeyResponse = await startAuthentication({ optionsJSON: options });

    // 3. Antwort prüfen & Session starten
    const data = await this.request('/api/auth/passkey/login-verify', {
      method: 'POST',
      body: JSON.stringify({ response: passkeyResponse, challengeId }),
    });

    if (data.token && data.user) {
      this.setSession(data.token, data.user);
    }
    return data;
  }

  // --- 2FA (TOTP Authenticator) ---

  public async setup2FA() {
    return await this.request('/api/auth/2fa/setup', { method: 'POST' });
  }

  public async verify2FASetup(code: string) {
    const res = await this.request('/api/auth/2fa/verify-setup', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
    if (this.currentUser) {
      this.currentUser.totp_enabled = true;
      this.notify();
    }
    return res;
  }

  public async disable2FA(codeOrPassword: { code?: string; password?: string }) {
    const res = await this.request('/api/auth/2fa/disable', {
      method: 'POST',
      body: JSON.stringify(codeOrPassword),
    });
    if (this.currentUser) {
      this.currentUser.totp_enabled = false;
      this.notify();
    }
    return res;
  }

  // --- Profil & Session ---

  public async fetchProfile() {
    if (!this.token) return null;
    try {
      const data = await this.request('/api/auth/me', { method: 'GET' });
      if (data.user) {
        this.currentUser = {
          ...data.user,
          has_passkey: (data.passkeys || []).length > 0,
        };
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(this.currentUser));
        this.notify();
      }
      return data;
    } catch (err) {
      this.logout();
      return null;
    }
  }

  private setSession(token: string, user: User) {
    this.token = token;
    this.currentUser = user;
    localStorage.setItem(AUTH_STORAGE_KEY, token);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    this.notify();
  }

  public logout() {
    this.token = null;
    this.currentUser = null;
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
    this.notify();
  }

  // --- Movie Reviews ---

  public async getMovieReviews(movieId: string | number): Promise<ReviewsResponse> {
    return await this.request(`/api/reviews/movie/${movieId}`, { method: 'GET' });
  }

  public async submitMovieReview(params: {
    movieId: string | number;
    movieTitle: string;
    moviePoster?: string;
    rating: number; // 1 - 10
    reviewText?: string;
  }) {
    return await this.request('/api/reviews', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  public async deleteReview(reviewId: string) {
    return await this.request(`/api/reviews/${reviewId}`, { method: 'DELETE' });
  }

  public async getMyReviews(): Promise<{ reviews: Review[] }> {
    return await this.request('/api/reviews/my', { method: 'GET' });
  }
}

export const suppenstudiosAuth = new SuppenstudiosAuthService();
