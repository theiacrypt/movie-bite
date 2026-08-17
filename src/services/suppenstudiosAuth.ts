import { startRegistration, startAuthentication } from '@simplewebauthn/browser';

export interface User {
  id: string;
  username: string;
  email?: string;
  avatar_url?: string;
  role?: string;
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
  role?: string;
}

export interface ReviewsResponse {
  movieId: string;
  count: number;
  averageRating: number | null;
  reviews: Review[];
}

export interface FavoriteMovie {
  id: string;
  title: string;
  year: string;
  poster: string;
  plot: string;
  genre: string[];
  rating: number;
  runtime?: string;
  runtimeMinutes?: number;
  addedAt: number; // timestamp
  listName?: string; // optional group
}

export interface FollowedUser {
  username: string;
  userId: string;
  followedAt: number;
}

const AUTH_STORAGE_KEY = 'suppenstudios_auth_token';
const USER_STORAGE_KEY = 'suppenstudios_auth_user';

const getFavoritesKey = (userId?: string) =>
  `moviebite_favorites_${userId || 'guest'}`;

const getFollowingKey = (userId?: string) =>
  `moviebite_following_${userId || 'guest'}`;

// Basis-URL für Auth Service
const getApiBase = () => {
  if (typeof window !== 'undefined') {
    const custom = localStorage.getItem('suppenstudios_auth_api_url');
    if (custom) return custom;
  }
  return 'https://suppenstudios-auth.suppenchris.workers.dev';
};

export { getBackendBaseUrl } from './socket.js';

export interface UserSearchResult {
  id?: string;
  username: string;
  avatar_url?: string;
  favoriteCount?: number;
  review_count?: number;
}

class SuppenstudiosAuthService {
  private token: string | null = null;
  private currentUser: User | null = null;
  private listeners: ((user: User | null) => void)[] = [];

  constructor() {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const ssoToken = urlParams.get('token');
      if (ssoToken) {
        localStorage.setItem(AUTH_STORAGE_KEY, ssoToken);
        urlParams.delete('token');
        urlParams.delete('sso_auth');
        const cleanQuery = urlParams.toString() ? `?${urlParams.toString()}` : '';
        window.history.replaceState({}, document.title, `${window.location.pathname}${cleanQuery}${window.location.hash}`);
      }

      this.token = localStorage.getItem(AUTH_STORAGE_KEY) || this.getCookie('suppenstudios_session');
      const cached = localStorage.getItem(USER_STORAGE_KEY);
      if (cached) {
        try { this.currentUser = JSON.parse(cached); } catch (_) {}
      }
      // Eagerly verify session / SSO cookie from Suppenstudios ecosystem
      this.fetchProfile().catch(() => {
        if (!cached) this.logout();
      });
    }
  }

  public redirectToSSO(options: { mode?: 'passkey' | 'password' | 'register'; returnTo?: string } = {}) {
    if (typeof window === 'undefined') return;
    const returnTo = options.returnTo || window.location.href;
    const authUrl = new URL('https://auth.suppenstudios.work');
    authUrl.searchParams.set('return_to', returnTo);
    authUrl.searchParams.set('app', 'Movie-Bite');
    if (options.mode) authUrl.searchParams.set('mode', options.mode);
    window.location.href = authUrl.toString();
  }

  private getCookie(name: string): string | null {
    if (typeof document === 'undefined') return null;
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? decodeURIComponent(match[2]) : null;
  }

  private setCookie(name: string, value: string, maxAge = 604800) {
    if (typeof document === 'undefined') return;
    let domainPart = '';
    if (window.location.hostname.endsWith('suppenstudios.work')) {
      domainPart = '; domain=.suppenstudios.work';
    }
    const isSecure = window.location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax${isSecure}${domainPart}`;
  }

  private deleteCookie(name: string) {
    if (typeof document === 'undefined') return;
    let domainPart = '';
    if (window.location.hostname.endsWith('suppenstudios.work')) {
      domainPart = '; domain=.suppenstudios.work';
    }
    document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax${domainPart}`;
  }

  public subscribe(callback: (user: User | null) => void) {
    this.listeners.push(callback);
    callback(this.currentUser);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  private notify() { this.listeners.forEach(l => l(this.currentUser)); }

  public getToken(): string | null { return this.token; }
  public getUser(): User | null { return this.currentUser; }
  public isLoggedIn(): boolean { return !!this.token && !!this.currentUser; }
  public isChef(): boolean {
    if (!this.currentUser || !this.token) return false;
    if (this.currentUser.role === 'chef') return true;
    return this.currentUser.username.toLowerCase() === 'chef';
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
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`;

    const response = await fetch(`${baseUrl}${endpoint}`, {
      ...options,
      headers,
      credentials: 'include',
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || `Fehler (${response.status})`);
    return data;
  }

  // --- Authentifizierung ---

  public async register(username: string, password: string, email?: string) {
    const data = await this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password, email }),
    });
    if (data.token && data.user) this.setSession(data.token, data.user);
    return data;
  }

  public async login(username: string, password: string) {
    const data = await this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    if (data.requires2FA) return { requires2FA: true, tempToken: data.tempToken, message: data.message };
    if (data.token && data.user) this.setSession(data.token, data.user);
    return data;
  }

  public async validate2FALogin(tempToken: string, code: string) {
    const data = await this.request('/api/auth/2fa/validate-login', {
      method: 'POST',
      body: JSON.stringify({ tempToken, code }),
    });
    if (data.token && data.user) this.setSession(data.token, data.user);
    return data;
  }

  // --- Passkeys (WebAuthn) ---

  public async registerPasskey(deviceName = 'Mein Passkey') {
    if (!this.isLoggedIn()) throw new Error('Bitte melde dich zuerst an.');
    const { options, challengeId } = await this.request('/api/auth/passkey/register-options', { method: 'POST' });
    const passkeyResponse = await startRegistration({ optionsJSON: options });
    const result = await this.request('/api/auth/passkey/register-verify', {
      method: 'POST',
      body: JSON.stringify({ response: passkeyResponse, challengeId, deviceName }),
    });
    if (this.currentUser) { this.currentUser.has_passkey = true; this.notify(); }
    return result;
  }

  public async loginWithPasskey(username?: string) {
    const { options, challengeId } = await this.request('/api/auth/passkey/login-options', {
      method: 'POST',
      body: JSON.stringify({ username }),
    });
    const passkeyResponse = await startAuthentication({ optionsJSON: options });
    const data = await this.request('/api/auth/passkey/login-verify', {
      method: 'POST',
      body: JSON.stringify({ response: passkeyResponse, challengeId }),
    });
    if (data.token && data.user) this.setSession(data.token, data.user);
    return data;
  }

  // --- 2FA (TOTP) ---

  public async setup2FA() { return await this.request('/api/auth/2fa/setup', { method: 'POST' }); }

  public async verify2FASetup(code: string) {
    const res = await this.request('/api/auth/2fa/verify-setup', {
      method: 'POST', body: JSON.stringify({ code }),
    });
    if (this.currentUser) { this.currentUser.totp_enabled = true; this.notify(); }
    return res;
  }

  public async disable2FA(codeOrPassword: { code?: string; password?: string }) {
    const res = await this.request('/api/auth/2fa/disable', {
      method: 'POST', body: JSON.stringify(codeOrPassword),
    });
    if (this.currentUser) { this.currentUser.totp_enabled = false; this.notify(); }
    return res;
  }

  // --- Profil & Session ---

  public async fetchProfile() {
    try {
      const data = await this.request('/api/auth/me', { method: 'GET' });
      if (data && data.user) {
        if (data.token) {
          this.token = data.token;
          localStorage.setItem(AUTH_STORAGE_KEY, data.token);
          this.setCookie('suppenstudios_session', data.token);
        }
        this.currentUser = { ...data.user, has_passkey: (data.passkeys || []).length > 0 };
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(this.currentUser));
        this.notify();
        return data;
      }
    } catch (err) {
      if (this.token) {
        this.logout();
      }
      return null;
    }
  }

  private setSession(token: string, user: User) {
    this.token = token;
    this.currentUser = user;
    localStorage.setItem(AUTH_STORAGE_KEY, token);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    this.setCookie('suppenstudios_session', token);
    this.notify();
  }

  public async logout() {
    try {
      await this.request('/api/auth/logout', { method: 'POST' }).catch(() => {});
    } catch (_) {}
    this.token = null;
    this.currentUser = null;
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
    this.deleteCookie('suppenstudios_session');
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
    rating: number;
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

  /** Versucht, öffentliche Rezensionen eines Nutzers zu laden (graceful fallback) */
  public async getUserReviews(username: string): Promise<{ reviews: Review[] }> {
    try {
      return await this.request(`/api/reviews/user/${encodeURIComponent(username)}`, { method: 'GET' });
    } catch {
      return { reviews: [] };
    }
  }

  /** Lädt beliebte/trending Rezensionen (nach helpful_count gewichtet) */
  public async getTopReviews(limit = 30): Promise<{ reviews: Review[] }> {
    try {
      return await this.request(`/api/reviews/top?limit=${limit}`, { method: 'GET' });
    } catch {
      // Fallback: eigene Reviews + Chef Reviews kombinieren
      try {
        const [mine, chef] = await Promise.allSettled([
          this.getMyReviews(),
          this.getUserReviews('Chef'),
        ]);
        const all: Review[] = [
          ...(mine.status === 'fulfilled' ? mine.value.reviews : []),
          ...(chef.status === 'fulfilled' ? chef.value.reviews : []),
        ];
        return { reviews: all };
      } catch {
        return { reviews: [] };
      }
    }
  }

  // --- Favoriten (localStorage, userId-spezifisch) ---

  public getFavorites(): FavoriteMovie[] {
    try {
      const key = getFavoritesKey(this.currentUser?.id);
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  }

  public addFavorite(movie: Omit<FavoriteMovie, 'addedAt'>): void {
    const favs = this.getFavorites();
    const exists = favs.find(f => f.id === movie.id);
    if (exists) return;
    const updated = [{ ...movie, addedAt: Date.now() }, ...favs];
    localStorage.setItem(getFavoritesKey(this.currentUser?.id), JSON.stringify(updated));
    this.notifyFavorites();
  }

  public removeFavorite(movieId: string): void {
    const favs = this.getFavorites().filter(f => f.id !== movieId);
    localStorage.setItem(getFavoritesKey(this.currentUser?.id), JSON.stringify(favs));
    this.notifyFavorites();
  }

  public isFavorite(movieId: string): boolean {
    return this.getFavorites().some(f => f.id === movieId);
  }

  public updateFavoriteList(movieId: string, listName: string): void {
    const favs = this.getFavorites().map(f =>
      f.id === movieId ? { ...f, listName } : f
    );
    localStorage.setItem(getFavoritesKey(this.currentUser?.id), JSON.stringify(favs));
    this.notifyFavorites();
  }

  private favoriteListeners: (() => void)[] = [];

  public subscribeFavorites(cb: () => void) {
    this.favoriteListeners.push(cb);
    return () => { this.favoriteListeners = this.favoriteListeners.filter(l => l !== cb); };
  }

  private notifyFavorites() { this.favoriteListeners.forEach(l => l()); }

  // --- Follower (localStorage) ---

  public getFollowing(): FollowedUser[] {
    try {
      const key = getFollowingKey(this.currentUser?.id);
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  }

  public followUser(username: string, userId: string): void {
    if (!this.currentUser) return;
    const list = this.getFollowing();
    if (list.find(f => f.username === username)) return;
    const updated: FollowedUser[] = [{ username, userId, followedAt: Date.now() }, ...list];
    localStorage.setItem(getFollowingKey(this.currentUser.id), JSON.stringify(updated));
  }

  public unfollowUser(username: string): void {
    if (!this.currentUser) return;
    const updated = this.getFollowing().filter(f => f.username !== username);
    localStorage.setItem(getFollowingKey(this.currentUser.id), JSON.stringify(updated));
  }

  public isFollowing(username: string): boolean {
    return this.getFollowing().some(f => f.username === username);
  }

  /** Sucht Nutzer über die Auth-API */
  public async searchUsers(query: string): Promise<UserSearchResult[]> {
    const clean = query.trim();
    if (!clean) return [];
    try {
      const res = await this.request(`/api/users/search?q=${encodeURIComponent(clean)}`);
      if (Array.isArray(res)) return res as UserSearchResult[];
      if (res?.users && Array.isArray(res.users)) return res.users as UserSearchResult[];
      return [];
    } catch (err) {
      console.warn('User search failed:', err);
      return [];
    }
  }

  /** Sucht einen Nutzer nach exaktem Benutzernamen */
  public async findUserByExactName(username: string): Promise<UserSearchResult | null> {
    const clean = username.trim();
    if (!clean) return null;
    const results = await this.searchUsers(clean);
    return results.find(u => u.username.toLowerCase() === clean.toLowerCase()) || null;
  }

  /**
   * Prüft ob der Nutzer existiert und folgt ihm nur, wenn er im System gefunden wird
   */
  public async followUserVerified(username: string): Promise<{ success: boolean; error?: string; user?: UserSearchResult }> {
    if (!this.currentUser) {
      return { success: false, error: 'Bitte melde dich zuerst an.' };
    }
    const clean = username.trim();
    if (!clean) {
      return { success: false, error: 'Bitte gib einen Nutzernamen ein.' };
    }
    if (this.currentUser.username.toLowerCase() === clean.toLowerCase()) {
      return { success: false, error: 'Du kannst dir nicht selbst folgen.' };
    }
    if (this.isFollowing(clean)) {
      return { success: false, error: `Du folgst „${clean}“ bereits.` };
    }

    const targetUser = await this.findUserByExactName(clean);
    if (!targetUser) {
      return { success: false, error: `Nutzer „${clean}“ existiert nicht bei Suppenstudios.` };
    }

    const list = this.getFollowing();
    const targetId = targetUser.id || targetUser.username;
    const updated: FollowedUser[] = [{ username: targetUser.username, userId: targetId, followedAt: Date.now() }, ...list];
    localStorage.setItem(getFollowingKey(this.currentUser.id), JSON.stringify(updated));
    return { success: true, user: targetUser };
  }

  /** Lädt Favoriten eines anderen Nutzers aus dessen localStorage-Export via API (Fallback: leer) */
  public getFollowedUserFavorites(username: string): FavoriteMovie[] {
    // Offline-Fallback: In lokalem Cache schauen, ob wir diese User-Favs bereits haben
    try {
      const key = `moviebite_favs_cache_${username}`;
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  }
}

export const suppenstudiosAuth = new SuppenstudiosAuthService();
