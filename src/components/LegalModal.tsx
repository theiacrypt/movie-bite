import React, { useState } from 'react';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'impressum' | 'datenschutz' | 'tmdb';
}

export const LegalModal: React.FC<LegalModalProps> = ({ isOpen, onClose, initialTab = 'impressum' }) => {
  const [activeTab, setActiveTab] = useState<'impressum' | 'datenschutz' | 'tmdb'>(initialTab);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden text-slate-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚖️</span>
            <h2 className="text-lg font-bold text-white">Rechtliche Hinweise & Datenschutz</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/30 px-4">
          <button
            onClick={() => setActiveTab('impressum')}
            className={`py-3 px-4 text-sm font-semibold border-b-2 transition ${
              activeTab === 'impressum'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Impressum
          </button>
          <button
            onClick={() => setActiveTab('datenschutz')}
            className={`py-3 px-4 text-sm font-semibold border-b-2 transition ${
              activeTab === 'datenschutz'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Datenschutz
          </button>
          <button
            onClick={() => setActiveTab('tmdb')}
            className={`py-3 px-4 text-sm font-semibold border-b-2 transition ${
              activeTab === 'tmdb'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            TMDB Lizenz
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-sm leading-relaxed">
          {activeTab === 'impressum' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-white">Angaben gemäß § 5 DDG</h3>
              <p>
                <strong>Christopher Schupp</strong><br />
                Suppenstudios – Movie-Bite<br />
                Hugo-Herrmann-Str. 77<br />
                88213 Ravensburg<br />
                Deutschland
              </p>

              <h3 className="text-base font-bold text-white pt-2">Kontakt</h3>
              <p>
                Telefon: <a href="tel:+4915906701049" className="text-indigo-400 hover:underline">+49 1590 6701049</a><br />
                E-Mail: <a href="mailto:chef@suppenstudios.work" className="text-indigo-400 hover:underline">chef@suppenstudios.work</a>
              </p>

              <h3 className="text-base font-bold text-white pt-2">Verantwortlich nach § 18 Abs. 2 MStV</h3>
              <p>
                Christopher Schupp<br />
                Hugo-Herrmann-Str. 77<br />
                88213 Ravensburg
              </p>

              <h3 className="text-base font-bold text-white pt-2">EU-Streitschlichtung</h3>
              <p className="text-slate-400">
                Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:{' '}
                <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">
                  https://ec.europa.eu/consumers/odr
                </a>.<br />
                Wir sind nicht verpflichtet und nicht bereit, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.
              </p>
            </div>
          )}

          {activeTab === 'datenschutz' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-white">Datenschutzerklärung (DSGVO)</h3>
              <p>
                <strong>Verantwortlicher:</strong> Christopher Schupp, Hugo-Herrmann-Str. 77, 88213 Ravensburg. E-Mail: chef@suppenstudios.work.
              </p>
              <h4 className="font-semibold text-slate-100">1. Filmabstimmung & Lobbys</h4>
              <p className="text-slate-300">
                Zur gemeinsamen Filmauswahl werden Raum-Codes, Nicknames, Filmvorschläge und Abstimmungsergebnisse temporär in der Datenbank verarbeitet.
              </p>
              <h4 className="font-semibold text-slate-100">2. Suppenstudios SSO & Kontodaten</h4>
              <p className="text-slate-300">
                Wenn Sie sich mit Ihrem Suppenstudios-Konto anmelden (z.B. für Film-Favoriten und Reviews), werden Ihr Benutzername und Session-Token verarbeitet (Art. 6 Abs. 1 lit. b DSGVO).
              </p>
              <h4 className="font-semibold text-slate-100">3. Betroffenenrechte</h4>
              <p className="text-slate-400">
                Sie haben das Recht auf Auskunft, Berichtigung, Löschung und Beschwerde bei der Datenschutzaufsichtsbehörde (LfDI Baden-Württemberg).
              </p>
            </div>
          )}

          {activeTab === 'tmdb' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-slate-800/60 rounded-xl border border-slate-700">
                <img
                  src="https://www.themoviedb.org/assets/2/v4/logos/v2/blue_square_2-d537fb228cf3ded904ef09b136fe3fec72548ebc1fea3fbbd1ad9e36364db38b.svg"
                  alt="TMDB Logo"
                  className="w-12 h-12 object-contain"
                />
                <div>
                  <h3 className="text-sm font-bold text-white">The Movie Database (TMDB) API</h3>
                  <p className="text-xs text-slate-300">
                    Filmdaten, Poster, Beschreibungen und Bewertungen werden bereitgestellt durch die TMDB API.
                  </p>
                </div>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                This product uses the TMDB API but is not endorsed or certified by TMDB.<br />
                Movie-Bite nutzt die Programmierschnittstelle von The Movie Database (TMDB) zur Bereitstellung von Filminformationen, steht jedoch in keiner offiziellen geschäftlichen Verbindung zu TMDB.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition text-sm"
          >
            Schließen
          </button>
        </div>

      </div>
    </div>
  );
};
