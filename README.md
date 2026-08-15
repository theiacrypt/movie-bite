# 🍿 Movie-Bite (`movie-bite.suppenstudios.work`)

> Die moderne, cineastische Echtzeit-Web-App für Filmabende mit Freunden.

Erstelle einen Raum, teile den Link oder QR-Code mit deiner Gruppe, sammelt in **Runde 1** eure Filmvorschläge über die integrierte Movie-API und stimmt in **Runde 2** mit Likes, Dislikes und eurem persönlichen Super-Vote über den Sieger ab!

---

## ✨ Features

- 🎟️ **Echtzeit-Räume & Lobby**:
  - Schnelle Raumerstellung mit 6-stelligem Code.
  - 1-Klick-Einladungslink & QR-Code für Smartphones.
  - Avatar-Auswahl (Popcorn, Filmklappe, Pizza, Soda...) & Nicknames.
  - Host-Verwaltung & Live-Synchronisation via WebSockets (Socket.IO).
- 🎬 **Runde 1: Filme vorschlagen & suchen**:
  - Live-Filmdatenbank-Suche mit Postern, Bewertungen, Genre, Erscheinungsjahr & Handlungsübersicht.
  - Jeder Teilnehmer kann bis zu 3 Wunschfilme einreichen.
  - Live-Pool aller Vorschläge.
- 🗳️ **Runde 2: Voting & Favoriten**:
  - Interaktives Card-Deck Voting.
  - ❤️ **Like (+1)**: Favorit für den Abend.
  - 👎 **Dislike (-1)**: Auf keinen Fall heute schauen.
  - ⭐ **Super-Vote (+2)**: Dein persönlicher Hauptfavorit (1x pro Spieler).
  - Live-Fortschrittsanzeige der Wähler.
- 🏆 **Siegerehrung & Finale**:
  - Dramatische Gewinner-Enthüllung mit Konfetti-Explosion und Fanfare.
  - Rangliste aller vorgeschlagenen Filme mit genauer Punkte- & Stimmenauswertung.
  - Direkte Links zu YouTube-Trailern und Streaming-Verfügbarkeit auf JustWatch.
  - Nahtloser Neustart für den nächsten Durchgang.
- 🎨 **Kino-Design**:
  - Dunkles Theater-Design mit Glassmorphism & feinen Glow-Effekten.
  - Integrierte Audio-Effekte (synthetisiert über Web Audio API, ohne externe Abhängigkeiten).
  - 100% responsiv für Smartphone, Tablet und Desktop.

---

## 🚀 Schnelleinstieg & Installation

### Voraussetzungen
- [Node.js](https://nodejs.org/) (Version 18 oder neuer)
- `npm`

### Installation
```bash
# 1. Abhängigkeiten installieren
npm install

# 2. Entwicklungsserver starten
npm run dev
```

Die Anwendung ist nun erreichbar unter `http://localhost:3001` (bzw. `http://localhost:3000` im Client-Dev-Modus).

### Produktions-Build
```bash
# Bauen für Produktion
npm run build

# Starten
npm run start
```

---

## ⚙️ Umgebungsvariablen (Optional)

In einer `.env`-Datei können optional folgende Variablen gesetzt werden:

```env
PORT=3001
TMDB_API_KEY=dein_tmdb_api_key_hier  # Optional (Fallback ist integriert)
```

---

## 🛠️ Tech-Stack

- **Frontend**: React 19, TypeScript, Vite, TailwindCSS, Lucide Icons, Canvas-Confetti
- **Backend / Real-Time**: Node.js, Express, Socket.IO, TypeScript
- **Movie API**: The Movie Database (TMDB) API & kuratierte Filmdatenbank mit intelligentem Caching

---

## 📄 Lizenz
Entwickelt für **Suppenstudios** • `movie-bite.suppenstudios.work`
