import React, { useState } from 'react';
import { X, Copy, Check, QrCode, MessageCircle, Sparkles } from 'lucide-react';
import { soundFx } from '../services/soundEffects.js';

interface ShareModalProps {
  roomCode: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ roomCode, isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}?room=${roomCode}`
    : `https://movie-bite.suppenstudios.work/?room=${roomCode}`;

  const handleCopy = () => {
    soundFx.playPop();
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(`Komm in meinen Movie-Bite Raum (${roomCode}) und stimme mit ab, was wir heute schauen:\n${shareUrl}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  // QR code image URL from public api
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shareUrl)}&color=ffffff&bgcolor=111726`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in">
      <div 
        className="fixed -inset-10 bg-black/75 backdrop-blur-md cursor-pointer"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-md glass-panel rounded-2xl p-6 border border-white/10 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg bg-theater-900/60 hover:bg-theater-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="inline-flex p-3 rounded-2xl bg-cinema-red/10 border border-cinema-red/20 text-cinema-red mb-3">
            <QrCode className="w-7 h-7" />
          </div>
          <h3 className="font-display font-bold text-xl text-white">Freunde einladen</h3>
          <p className="text-sm text-slate-400 mt-1">
            Teile den Link oder lass deine Freunde den QR-Code mit dem Handy scannen!
          </p>
        </div>

        {/* QR Code */}
        <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-theater-900/80 border border-white/5 mb-6">
          <div className="p-3 bg-theater-850 rounded-lg border border-white/10 shadow-inner">
            <img
              src={qrUrl}
              alt="Room QR Code"
              className="w-40 h-40 rounded object-contain"
              loading="lazy"
            />
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs text-slate-400 uppercase tracking-widest font-mono font-semibold">Raumcode:</span>
            <span className="font-mono text-lg font-black text-cinema-gold tracking-widest bg-theater-800 px-3 py-0.5 rounded border border-cinema-gold/30">
              {roomCode}
            </span>
          </div>
        </div>

        {/* Copy Link Input */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="w-full bg-theater-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-slate-300 font-mono focus:outline-none focus:border-cinema-red select-all"
            />
            <button
              onClick={handleCopy}
              className={`px-4 py-2.5 rounded-xl font-medium text-xs flex items-center gap-1.5 shrink-0 transition-all ${
                copied
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-cinema-red hover:bg-red-700 text-white shadow-lg shadow-cinema-red/20 active:scale-95'
              }`}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Kopiert!' : 'Kopieren'}</span>
            </button>
          </div>

          <button
            onClick={handleWhatsApp}
            className="w-full py-2.5 rounded-xl bg-[#25D366]/15 hover:bg-[#25D366]/25 border border-[#25D366]/30 text-[#25D366] text-xs font-semibold flex items-center justify-center gap-2 transition-all active:scale-98"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Über WhatsApp teilen</span>
          </button>
        </div>
      </div>
    </div>
  );
};
