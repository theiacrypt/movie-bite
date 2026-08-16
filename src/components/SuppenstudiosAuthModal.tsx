import React, { useState, useEffect } from 'react';
import {
  User as UserIcon,
  Lock,
  Key,
  ShieldCheck,
  ShieldAlert,
  Fingerprint,
  QrCode,
  LogOut,
  X,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Film
} from 'lucide-react';
import { suppenstudiosAuth, User, Review } from '../services/suppenstudiosAuth.js';

interface SuppenstudiosAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SuppenstudiosAuthModal: React.FC<SuppenstudiosAuthModalProps> = ({ isOpen, onClose }) => {
  const [user, setUser] = useState<User | null>(suppenstudiosAuth.getUser());
  const [tab, setTab] = useState<'login' | 'register' | 'profile' | '2fa_setup' | 'my_reviews'>('login');

  // Formular-Zustände
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [deviceName, setDeviceName] = useState('');

  // 2FA Login Zustand
  const [temp2FAToken, setTemp2FAToken] = useState<string | null>(null);
  const [totpCode, setTotpCode] = useState('');

  // 2FA Setup Zustand
  const [totpSetupData, setTotpSetupData] = useState<{ secret: string; qrUri: string; formattedSecret: string } | null>(null);
  const [setupCode, setSetupCode] = useState('');

  // Reviews Zustand
  const [myReviews, setMyReviews] = useState<Review[]>([]);

  // Status & Feedback
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const unsub = suppenstudiosAuth.subscribe((u) => {
      setUser(u);
      if (u) {
        if (tab === 'login' || tab === 'register') {
          setTab('profile');
        }
      }
    });
    return unsub;
  }, [tab]);

  // Wenn Modal geöffnet wird und User eingeloggt ist, direkt Profil zeigen
  useEffect(() => {
    if (isOpen) {
      setError(null);
      setSuccess(null);
      if (user) {
        setTab('profile');
      } else {
        setTab('login');
      }
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await suppenstudiosAuth.login(username, password);
      if (res.requires2FA) {
        setTemp2FAToken(res.tempToken);
        setSuccess(res.message);
      } else {
        setSuccess('Erfolgreich angemeldet!');
        setTimeout(() => setTab('profile'), 500);
      }
    } catch (err: any) {
      setError(err.message || 'Login fehlgeschlagen');
    } finally {
      setLoading(false);
    }
  };

  const handle2FAValidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!temp2FAToken) return;
    setLoading(true);
    setError(null);

    try {
      await suppenstudiosAuth.validate2FALogin(temp2FAToken, totpCode);
      setTemp2FAToken(null);
      setTotpCode('');
      setSuccess('2FA-Verifikation erfolgreich!');
      setTimeout(() => setTab('profile'), 500);
    } catch (err: any) {
      setError(err.message || 'Ungültiger 2FA-Code');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await suppenstudiosAuth.register(username, password, email || undefined);
      setSuccess('Account erfolgreich erstellt!');
      setTimeout(() => setTab('profile'), 500);
    } catch (err: any) {
      setError(err.message || 'Registrierung fehlgeschlagen');
    } finally {
      setLoading(false);
    }
  };

  const handlePasskeyLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await suppenstudiosAuth.loginWithPasskey(username || undefined);
      setSuccess('Erfolgreich mit Passkey angemeldet!');
      setTimeout(() => setTab('profile'), 500);
    } catch (err: any) {
      setError(err.message || 'Passkey-Login abgebrochen');
    } finally {
      setLoading(false);
    }
  };

  const handleStart2FASetup = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await suppenstudiosAuth.setup2FA();
      setTotpSetupData(data);
      setTab('2fa_setup');
    } catch (err: any) {
      setError(err.message || '2FA-Setup konnte nicht gestartet werden');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FASetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await suppenstudiosAuth.verify2FASetup(setupCode);
      setSuccess('2FA erfolgreich aktiviert!');
      setTotpSetupData(null);
      setSetupCode('');
      setTimeout(() => setTab('profile'), 700);
    } catch (err: any) {
      setError(err.message || 'Falscher Bestätigungscode');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterPasskey = async () => {
    setLoading(true);
    setError(null);
    try {
      await suppenstudiosAuth.registerPasskey(deviceName || 'Mein Gerät');
      setSuccess('Passkey erfolgreich registriert!');
      setDeviceName('');
    } catch (err: any) {
      setError(err.message || 'Passkey-Registrierung fehlgeschlagen');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMyReviews = async () => {
    setLoading(true);
    try {
      const data = await suppenstudiosAuth.getMyReviews();
      setMyReviews(data.reviews || []);
      setTab('my_reviews');
    } catch (err: any) {
      setError('Rezensionen konnten nicht geladen werden');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    suppenstudiosAuth.logout();
    setTab('login');
    setUsername('');
    setPassword('');
    setSuccess('Abgemeldet');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-theater-900 border border-white/15 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 bg-theater-950/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-cinema-red flex items-center justify-center shadow-md">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">Suppenstudios ID</h2>
              <p className="text-[11px] text-slate-400">Zentraler Account & Filmrezensionen</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Alerts */}
        {error && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-red-500/15 border border-red-500/30 flex items-start gap-2.5 text-xs text-red-300">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-start gap-2.5 text-xs text-emerald-300">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{success}</span>
          </div>
        )}

        {/* Tabs wenn nicht eingeloggt */}
        {!user && !temp2FAToken && (
          <div className="flex border-b border-white/10 px-6 pt-2 bg-theater-950/40">
            <button
              onClick={() => { setTab('login'); setError(null); }}
              className={`flex-1 pb-3 text-xs font-semibold tracking-wider uppercase transition-all border-b-2 ${
                tab === 'login'
                  ? 'border-cinema-red text-white'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Anmelden
            </button>
            <button
              onClick={() => { setTab('register'); setError(null); }}
              className={`flex-1 pb-3 text-xs font-semibold tracking-wider uppercase transition-all border-b-2 ${
                tab === 'register'
                  ? 'border-cinema-red text-white'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Konto erstellen
            </button>
          </div>
        )}

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          {/* --- 2FA Login Challenge --- */}
          {temp2FAToken ? (
            <form onSubmit={handle2FAValidate} className="space-y-4">
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-center space-y-2">
                <ShieldAlert className="w-8 h-8 text-amber-400 mx-auto" />
                <h3 className="text-sm font-semibold text-white">2-Faktor-Authentifizierung</h3>
                <p className="text-xs text-slate-300">
                  Gib den 6-stelligen Code aus deiner Authenticator-App (Google Authenticator, Authy, Apple etc.) ein:
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">6-stelliger Code</label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="123456"
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full text-center text-2xl font-mono tracking-widest px-4 py-3 rounded-xl bg-theater-950 border border-white/15 text-white focus:outline-none focus:border-amber-400"
                  autoFocus
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setTemp2FAToken(null)}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-theater-800 hover:bg-theater-750 text-xs font-semibold text-slate-300"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  disabled={loading || totpCode.length !== 6}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-xs font-semibold text-theater-950 shadow-md"
                >
                  {loading ? 'Wird geprüft...' : 'Bestätigen'}
                </button>
              </div>
            </form>
          ) : !user ? (
            /* --- Login / Register Views --- */
            tab === 'login' ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Benutzername</label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      placeholder="z. B. MovieLover"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-theater-950 border border-white/15 text-white text-sm focus:outline-none focus:border-cinema-red"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Passwort</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-theater-950 border border-white/15 text-white text-sm focus:outline-none focus:border-cinema-red"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cinema-red to-cinema-red-deep hover:from-cinema-red-hover hover:to-cinema-red text-white font-semibold text-sm shadow-lg shadow-cinema-red/20 disabled:opacity-50 active:scale-[0.98] transition-all"
                >
                  {loading ? 'Anmelden...' : 'Anmelden'}
                </button>

                <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-white/10"></div>
                  <span className="flex-shrink mx-3 text-[11px] text-slate-500 uppercase tracking-wider">Oder</span>
                  <div className="flex-grow border-t border-white/10"></div>
                </div>

                {/* Passkey Login Button */}
                <button
                  type="button"
                  onClick={handlePasskeyLogin}
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-xl bg-theater-800 hover:bg-theater-750 border border-white/15 flex items-center justify-center gap-2 text-white font-semibold text-xs transition-all active:scale-[0.98]"
                >
                  <Fingerprint className="w-4 h-4 text-emerald-400" />
                  <span>Mit Passkey (Touch ID / Windows Hello) anmelden</span>
                </button>
              </form>
            ) : (
              /* --- Registrieren --- */
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Benutzername *</label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      placeholder="Dein Wunschname"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-theater-950 border border-white/15 text-white text-sm focus:outline-none focus:border-cinema-red"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">E-Mail (optional)</label>
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-theater-950 border border-white/15 text-white text-sm focus:outline-none focus:border-cinema-red"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Passwort * (min. 6 Zeichen)</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-theater-950 border border-white/15 text-white text-sm focus:outline-none focus:border-cinema-red"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cinema-red to-cinema-red-deep hover:from-cinema-red-hover hover:to-cinema-red text-white font-semibold text-sm shadow-lg shadow-cinema-red/20 disabled:opacity-50 active:scale-[0.98] transition-all"
                >
                  {loading ? 'Konto wird erstellt...' : 'Account erstellen'}
                </button>
              </form>
            )
          ) : tab === '2fa_setup' && totpSetupData ? (
            /* --- 2FA Setup Flow --- */
            <form onSubmit={handleVerify2FASetup} className="space-y-4">
              <div className="text-center space-y-1">
                <QrCode className="w-8 h-8 text-amber-400 mx-auto" />
                <h3 className="text-sm font-bold text-white">Authenticator einrichten</h3>
                <p className="text-xs text-slate-300">
                  Scanne den QR-Code oder gib den Secret Key in deine App ein:
                </p>
              </div>

              {/* QR Code Darstellung per otpauth URL */}
              <div className="flex flex-col items-center justify-center p-3 bg-white rounded-xl shadow-inner mx-auto w-48 h-48">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(totpSetupData.qrUri)}`}
                  alt="2FA QR Code"
                  className="w-40 h-40"
                />
              </div>

              <div className="p-2.5 rounded-xl bg-theater-950 border border-white/10 text-center">
                <p className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">Manueller Schlüssel</p>
                <p className="text-xs font-mono font-bold text-amber-300 tracking-wider select-all mt-0.5">
                  {totpSetupData.formattedSecret}
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Code aus App zur Bestätigung:</label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  placeholder="123456"
                  value={setupCode}
                  onChange={(e) => setSetupCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full text-center text-xl font-mono tracking-widest px-4 py-2.5 rounded-xl bg-theater-950 border border-white/15 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setTab('profile')}
                  className="flex-1 py-2 px-3 rounded-xl bg-theater-800 text-xs font-semibold text-slate-300"
                >
                  Zurück
                </button>
                <button
                  type="submit"
                  disabled={loading || setupCode.length !== 6}
                  className="flex-1 py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-theater-950 text-xs font-bold"
                >
                  {loading ? 'Wird aktiviert...' : 'Aktivieren'}
                </button>
              </div>
            </form>
          ) : tab === 'my_reviews' ? (
            /* --- Eigene Rezensionen --- */
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <Film className="w-4 h-4 text-cinema-red" />
                  <span>Meine Filmrezensionen ({myReviews.length})</span>
                </h3>
                <button
                  onClick={() => setTab('profile')}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Zurück zum Profil
                </button>
              </div>

              {myReviews.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">
                  Du hast noch keine Rezensionen verfasst. Suche nach einem Film in Movie-Bite und schreibe deine erste Kritik!
                </p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {myReviews.map((rev) => (
                    <div key={rev.id} className="p-3 rounded-xl bg-theater-950/80 border border-white/10 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">{rev.movie_title}</span>
                        <span className="text-xs font-bold text-amber-400 px-2 py-0.5 rounded-md bg-amber-400/10 border border-amber-400/20">
                          ★ {rev.rating}/10
                        </span>
                      </div>
                      {rev.review_text && (
                        <p className="text-xs text-slate-300 line-clamp-2 italic">"{rev.review_text}"</p>
                      )}
                      <p className="text-[10px] text-slate-500">{new Date(rev.created_at).toLocaleDateString('de-DE')}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* --- Profil & Sicherheit --- */
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-theater-950 border border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cinema-red to-cinema-red-deep flex items-center justify-center text-white font-bold text-base shadow">
                    {user?.username.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{user?.username}</h3>
                    <p className="text-[11px] text-slate-400">{user?.email || 'Keine E-Mail hinterlegt'}</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
                  title="Abmelden"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>

              {/* Sicherheits-Optionen */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Sicherheit & 2FA</h4>

                {/* Authenticator App */}
                <div className="p-3.5 rounded-xl bg-theater-950/60 border border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className={`w-5 h-5 ${user?.totp_enabled ? 'text-emerald-400' : 'text-slate-500'}`} />
                    <div>
                      <div className="text-xs font-semibold text-white">Authenticator App (TOTP)</div>
                      <div className="text-[10px] text-slate-400">
                        {user?.totp_enabled ? 'Aktiviert (Geschützt mit 6-stelligem Code)' : 'Nicht aktiviert'}
                      </div>
                    </div>
                  </div>
                  {user?.totp_enabled ? (
                    <span className="text-[10px] px-2 py-1 bg-emerald-500/20 text-emerald-300 rounded-md font-semibold border border-emerald-500/30">
                      Aktiv
                    </span>
                  ) : (
                    <button
                      onClick={handleStart2FASetup}
                      disabled={loading}
                      className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-theater-950 text-xs font-semibold shadow-sm"
                    >
                      Einrichten
                    </button>
                  )}
                </div>

                {/* Passkeys */}
                <div className="p-3.5 rounded-xl bg-theater-950/60 border border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Fingerprint className={`w-5 h-5 ${user?.has_passkey ? 'text-emerald-400' : 'text-slate-500'}`} />
                      <div>
                        <div className="text-xs font-semibold text-white">Passkey (Biometrie / FIDO2)</div>
                        <div className="text-[10px] text-slate-400">
                          {user?.has_passkey ? 'Passkey registriert' : 'Passwortloses Einloggen mit Touch ID / Windows Hello'}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <input
                      type="text"
                      placeholder="Gerätename (z. B. MacBook)"
                      value={deviceName}
                      onChange={(e) => setDeviceName(e.target.value)}
                      className="flex-1 px-3 py-1.5 text-xs rounded-lg bg-theater-900 border border-white/10 text-white focus:outline-none focus:border-cinema-red"
                    />
                    <button
                      onClick={handleRegisterPasskey}
                      disabled={loading}
                      className="px-3 py-1.5 rounded-lg bg-theater-800 hover:bg-theater-750 text-xs font-semibold text-white border border-white/10"
                    >
                      + Passkey hinzufügen
                    </button>
                  </div>
                </div>
              </div>

              {/* Meine Rezensionen Button */}
              <button
                onClick={handleLoadMyReviews}
                className="w-full py-2.5 px-4 rounded-xl bg-theater-850 hover:bg-theater-800 border border-white/10 flex items-center justify-center gap-2 text-xs font-semibold text-slate-200 transition-all"
              >
                <Film className="w-4 h-4 text-cinema-red" />
                <span>Meine Filmrezensionen anzeigen</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
