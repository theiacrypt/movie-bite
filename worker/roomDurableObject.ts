import { RoomState, Player, Movie, UserVote, MovieScore, GamePhase } from '../src/types/game.js';

interface ClientAttachment {
  playerId: string;
  name: string;
  avatar: string;
}

export class RoomDurableObject {
  private state: DurableObjectState;
  private room: RoomState | null = null;
  private sockets: Map<WebSocket, ClientAttachment> = new Map();

  constructor(state: DurableObjectState, env: any) {
    this.state = state;
    this.state.blockConcurrencyWhile(async () => {
      try {
        const stored = await this.state.storage.get<RoomState>('room');
        if (stored) {
          this.room = stored;
        }
      } catch (_) {}
    });
  }

  private async saveRoom() {
    try {
      if (this.room) {
        await this.state.storage.put('room', this.room);
      }
    } catch (_) {}
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // If HTTP GET /room - return current state as JSON
    if (request.headers.get('Upgrade') !== 'websocket') {
      return new Response(JSON.stringify(this.room || { error: 'Raum nicht gefunden' }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    // WebSocket Upgrade
    const pair = new WebSocketPair();
    const [client, server] = [pair[0], pair[1]];

    const playerId = url.searchParams.get('playerId') || `p_${Math.random().toString(36).substring(2, 9)}`;
    const playerName = url.searchParams.get('name') || '';
    const avatar = url.searchParams.get('avatar') || '🍿';

    server.accept();

    const attachment: ClientAttachment = { playerId, name: playerName, avatar };
    this.sockets.set(server, attachment);

    server.addEventListener('message', async (event) => {
      try {
        const raw = typeof event.data === 'string' ? event.data : new TextDecoder().decode(event.data);
        const payload = JSON.parse(raw);
        await this.handleMessage(server, payload);
      } catch (err: any) {
        console.error('Fehler bei WebSocket-Nachricht:', err);
      }
    });

    server.addEventListener('close', () => {
      this.handleClose(server);
    });

    server.addEventListener('error', () => {
      this.handleClose(server);
    });

    return new Response(null, {
      status: 101,
      webSocket: client
    });
  }

  private async handleMessage(ws: WebSocket, msg: { event: string; data?: any; callbackId?: string }) {
    const { event, data, callbackId } = msg;
    const client = this.sockets.get(ws);
    if (!client) return;

    const sendResponse = (res: any) => {
      if (callbackId) {
        try {
          ws.send(JSON.stringify({ event: `callback_${callbackId}`, data: res }));
        } catch (e) {
          // ignore
        }
      }
    };

    switch (event) {
      case 'ping': {
        try {
          ws.send(JSON.stringify({ event: 'pong' }));
        } catch (e) {}
        break;
      }

      case 'create_room': {
        const name = (data?.name || client.name || 'Host').trim();
        const avatar = data?.avatar || client.avatar || '🍿';
        client.name = name;
        client.avatar = avatar;

        const code = (data?.code || this.generateRoomCode()).toUpperCase();
        console.log(`[DO] create_room: Code="${code}", Host="${name}" (PlayerId="${client.playerId}")`);
        const host: Player = {
          id: client.playerId,
          name,
          avatar,
          isHost: true,
          isReady: true,
          hasFinishedVoting: false,
          joinedAt: Date.now()
        };

        this.room = {
          code,
          hostId: host.id,
          phase: 'LOBBY',
          players: [host],
          movies: [],
          votes: {},
          settings: {
            maxSuggestionsPerPlayer: 3,
            votingTimeLimitSeconds: 0,
            allowDislikes: true,
            superVoteWeight: 2
          },
          createdAt: Date.now()
        };

        await this.saveRoom();
        console.log(`[DO] Raum [${code}] erfolgreich initialisiert mit Host: ${host.name}`);
        sendResponse({ success: true, room: this.room, playerId: client.playerId });
        this.broadcastRoom();
        break;
      }

      case 'join_room': {
        const code = (data?.code || '').toUpperCase().trim();
        const name = (data?.name || client.name || 'Gast').trim();
        const avatar = data?.avatar || client.avatar || '🎬';
        const targetPlayerId = data?.playerId || client.playerId;
        client.playerId = targetPlayerId;
        client.name = name;
        client.avatar = avatar;

        console.log(`[DO] join_room: Ziel-Code="${code}", Spieler="${name}" (ID="${targetPlayerId}"), Raum existiert? ${!!this.room} (Aktueller Raum-Code: ${this.room?.code || 'NULL'})`);

        if (!this.room) {
          console.warn(`[DO] FEHLER: Raum nicht gefunden für Code="${code}". this.room ist null in dieser DO-Instanz!`);
          sendResponse({ success: false, error: 'Raum nicht gefunden' });
          return;
        }

        const existingPlayer = this.room.players.find(p => p.id === targetPlayerId);
        if (existingPlayer) {
          existingPlayer.name = name || existingPlayer.name;
          existingPlayer.avatar = avatar || existingPlayer.avatar;
          console.log(`[DO] Spieler ${name} (${targetPlayerId}) wiederverbunden.`);
        } else {
          const newPlayer: Player = {
            id: targetPlayerId,
            name: name || `Gast ${this.room.players.length + 1}`,
            avatar,
            isHost: this.room.players.length === 0,
            isReady: false,
            hasFinishedVoting: false,
            joinedAt: Date.now()
          };

          if (newPlayer.isHost) {
            this.room.hostId = newPlayer.id;
          }

          this.room.players.push(newPlayer);
          console.log(`[DO] Neuer Spieler beigetreten: ${newPlayer.name} (${newPlayer.id}). Spieleranzahl nun: ${this.room.players.length}`);
        }

        await this.saveRoom();
        sendResponse({ success: true, room: this.room, playerId: targetPlayerId });
        this.broadcastRoom();
        break;
      }

      case 'toggle_ready': {
        if (!this.room) return;
        const player = this.room.players.find(p => p.id === client.playerId);
        if (player) {
          player.isReady = !player.isReady;
          await this.saveRoom();
          this.broadcastRoom();
        }
        break;
      }

      case 'start_phase': {
        if (!this.room) return;
        const phase: GamePhase = data;
        this.room.phase = phase;

        if (phase === 'ROUND_2_VOTE') {
          this.room.players.forEach(p => p.hasFinishedVoting = false);
        } else if (phase === 'WINNER_SHOWDOWN') {
          this.calculateResults();
        }

        await this.saveRoom();
        this.broadcastRoom();
        break;
      }

      case 'add_movie': {
        if (!this.room) {
          sendResponse({ success: false, error: 'Raum nicht gefunden' });
          return;
        }

        const movieData: Movie = data;
        const player = this.room.players.find(p => p.id === client.playerId);
        if (!player) {
          sendResponse({ success: false, error: 'Spieler nicht im Raum' });
          return;
        }

        const playerMovies = this.room.movies.filter(m => m.suggestedBy?.id === client.playerId);
        if (playerMovies.length >= this.room.settings.maxSuggestionsPerPlayer) {
          sendResponse({ success: false, error: `Maximal ${this.room.settings.maxSuggestionsPerPlayer} Vorschläge pro Spieler erlaubt.` });
          return;
        }

        if (this.room.movies.some(m => m.id === movieData.id || m.title.toLowerCase() === movieData.title.toLowerCase())) {
          sendResponse({ success: false, error: 'Dieser Film wurde bereits vorgeschlagen!' });
          return;
        }

        const movieWithAuthor: Movie = {
          ...movieData,
          suggestedBy: {
            id: player.id,
            name: player.name,
            avatar: player.avatar
          }
        };

        this.room.movies.push(movieWithAuthor);
        await this.saveRoom();
        sendResponse({ success: true, room: this.room });
        this.broadcastRoom();
        break;
      }

      case 'remove_movie': {
        if (!this.room) return;
        const movieId = typeof data === 'string' ? data : data?.movieId;
        const movie = this.room.movies.find(m => m.id === movieId);
        if (!movie) return;

        const isHost = this.room.hostId === client.playerId;
        const isOwner = movie.suggestedBy?.id === client.playerId;

        if (isHost || isOwner) {
          this.room.movies = this.room.movies.filter(m => m.id !== movieId);
          await this.saveRoom();
          this.broadcastRoom();
        }
        break;
      }

      case 'submit_votes': {
        if (!this.room) return;
        const votes: UserVote[] = data;
        this.room.votes[client.playerId] = votes;

        const player = this.room.players.find(p => p.id === client.playerId);
        if (player) {
          player.hasFinishedVoting = true;
        }

        const allFinished = this.room.players.length > 0 && this.room.players.every(p => p.hasFinishedVoting);
        if (allFinished) {
          this.room.phase = 'WINNER_SHOWDOWN';
          this.calculateResults();
        }

        await this.saveRoom();
        sendResponse({ success: true });
        this.broadcastRoom();
        break;
      }

      case 'restart_game': {
        if (!this.room) return;
        this.room.phase = 'LOBBY';
        this.room.movies = [];
        this.room.votes = {};
        this.room.results = undefined;
        this.room.winner = undefined;
        this.room.players.forEach(p => {
          p.isReady = false;
          p.hasFinishedVoting = false;
        });

        await this.saveRoom();
        this.broadcastRoom();
        break;
      }
    }
  }

  private async handleClose(ws: WebSocket) {
    const client = this.sockets.get(ws);
    this.sockets.delete(ws);

    if (!client || !this.room) return;

    // Check if client has another open connection (e.g. reconnecting)
    const hasOtherSocket = Array.from(this.sockets.values()).some(c => c.playerId === client.playerId);
    if (hasOtherSocket) return;

    // Remove player
    this.room.players = this.room.players.filter(p => p.id !== client.playerId);

    if (this.room.hostId === client.playerId && this.room.players.length > 0) {
      this.room.players[0].isHost = true;
      this.room.hostId = this.room.players[0].id;
    }

    await this.saveRoom();

    if (this.room.players.length > 0) {
      this.broadcastRoom();
    }
  }

  private calculateResults() {
    if (!this.room) return;

    const movieScores: MovieScore[] = this.room.movies.map(movie => {
      let likes = 0;
      let dislikes = 0;
      let superlikes = 0;
      const voters: { playerName: string; playerAvatar: string; type: any }[] = [];

      Object.entries(this.room!.votes).forEach(([voterId, userVotes]) => {
        const voter = this.room!.players.find(p => p.id === voterId);
        const vote = userVotes.find(v => v.movieId === movie.id);
        if (vote && voter) {
          voters.push({
            playerName: voter.name,
            playerAvatar: voter.avatar,
            type: vote.type
          });

          if (vote.type === 'like') likes++;
          else if (vote.type === 'dislike') dislikes++;
          else if (vote.type === 'superlike') superlikes++;
        }
      });

      const netScore = (likes * 1) + (superlikes * this.room!.settings.superVoteWeight) - (dislikes * 1);

      return {
        movie,
        likes,
        dislikes,
        superlikes,
        netScore,
        votedBy: voters
      };
    });

    movieScores.sort((a, b) => {
      if (b.netScore !== a.netScore) return b.netScore - a.netScore;
      if ((b.superlikes + b.likes) !== (a.superlikes + a.likes)) {
        return (b.superlikes + b.likes) - (a.superlikes + a.likes);
      }
      return b.movie.rating - a.movie.rating;
    });

    this.room.results = movieScores;
    this.room.winner = movieScores.length > 0 ? movieScores[0] : undefined;
  }

  private broadcastRoom() {
    if (!this.room) return;
    const msg = JSON.stringify({ event: 'room_updated', data: this.room });

    for (const ws of this.sockets.keys()) {
      try {
        ws.send(msg);
      } catch (e) {
        // failed send
      }
    }
  }

  private generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }
}
