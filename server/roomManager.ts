import { RoomState, Player, Movie, UserVote, MovieScore, GamePhase } from '../src/types/game.js';

export class RoomManager {
  private rooms: Map<string, RoomState> = new Map();

  createRoom(hostPlayer: { id: string; name: string; avatar: string }): RoomState {
    const code = this.generateUniqueCode();
    const host: Player = {
      id: hostPlayer.id,
      name: hostPlayer.name.trim() || 'Host',
      avatar: hostPlayer.avatar || '🍿',
      isHost: true,
      isReady: true,
      hasFinishedVoting: false,
      joinedAt: Date.now()
    };

    const room: RoomState = {
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

    this.rooms.set(code, room);
    return room;
  }

  getRoom(code: string): RoomState | undefined {
    return this.rooms.get(code.toUpperCase());
  }

  joinRoom(code: string, player: { id: string; name: string; avatar: string }): RoomState | { error: string } {
    const room = this.getRoom(code);
    if (!room) {
      return { error: 'Raum nicht gefunden' };
    }

    const existingPlayerIndex = room.players.findIndex(p => p.id === player.id);
    if (existingPlayerIndex >= 0) {
      // Reconnect/update existing player
      room.players[existingPlayerIndex].name = player.name.trim() || room.players[existingPlayerIndex].name;
      room.players[existingPlayerIndex].avatar = player.avatar || room.players[existingPlayerIndex].avatar;
      return room;
    }

    const newPlayer: Player = {
      id: player.id,
      name: player.name.trim() || `Gast ${room.players.length + 1}`,
      avatar: player.avatar || '🎬',
      isHost: room.players.length === 0,
      isReady: false,
      hasFinishedVoting: false,
      joinedAt: Date.now()
    };

    if (newPlayer.isHost) {
      room.hostId = newPlayer.id;
    }

    room.players.push(newPlayer);
    return room;
  }

  leaveRoom(code: string, playerId: string): RoomState | null {
    const room = this.getRoom(code);
    if (!room) return null;

    room.players = room.players.filter(p => p.id !== playerId);

    // If host left, assign new host if players left
    if (room.hostId === playerId && room.players.length > 0) {
      room.players[0].isHost = true;
      room.hostId = room.players[0].id;
    }

    // Clean up empty rooms after 30 minutes
    if (room.players.length === 0) {
      this.rooms.delete(room.code);
      return null;
    }

    return room;
  }

  toggleReady(code: string, playerId: string): RoomState | undefined {
    const room = this.getRoom(code);
    if (!room) return undefined;

    const player = room.players.find(p => p.id === playerId);
    if (player) {
      player.isReady = !player.isReady;
    }
    return room;
  }

  setPhase(code: string, phase: GamePhase): RoomState | undefined {
    const room = this.getRoom(code);
    if (!room) return undefined;

    room.phase = phase;

    if (phase === 'ROUND_2_VOTE') {
      // Reset player voting status
      room.players.forEach(p => p.hasFinishedVoting = false);
    } else if (phase === 'WINNER_SHOWDOWN') {
      this.calculateResults(room);
    }

    return room;
  }

  addMovieSuggestion(code: string, playerId: string, movieData: Movie): { room?: RoomState; error?: string } {
    const room = this.getRoom(code);
    if (!room) return { error: 'Raum nicht gefunden' };

    const player = room.players.find(p => p.id === playerId);
    if (!player) return { error: 'Spieler nicht im Raum' };

    const playerMovies = room.movies.filter(m => m.suggestedBy?.id === playerId);
    if (playerMovies.length >= room.settings.maxSuggestionsPerPlayer) {
      return { error: `Maximal ${room.settings.maxSuggestionsPerPlayer} Vorschläge pro Spieler erlaubt.` };
    }

    // Check if already in list
    if (room.movies.some(m => m.id === movieData.id || m.title.toLowerCase() === movieData.title.toLowerCase())) {
      return { error: 'Dieser Film wurde bereits vorgeschlagen!' };
    }

    const movieWithAuthor: Movie = {
      ...movieData,
      suggestedBy: {
        id: player.id,
        name: player.name,
        avatar: player.avatar
      }
    };

    room.movies.push(movieWithAuthor);
    return { room };
  }

  removeMovieSuggestion(code: string, playerId: string, movieId: string): RoomState | undefined {
    const room = this.getRoom(code);
    if (!room) return undefined;

    const movie = room.movies.find(m => m.id === movieId);
    if (!movie) return room;

    const isHost = room.hostId === playerId;
    const isOwner = movie.suggestedBy?.id === playerId;

    if (isHost || isOwner) {
      room.movies = room.movies.filter(m => m.id !== movieId);
    }

    return room;
  }

  submitVotes(code: string, playerId: string, votes: UserVote[]): RoomState | undefined {
    const room = this.getRoom(code);
    if (!room) return undefined;

    room.votes[playerId] = votes;
    const player = room.players.find(p => p.id === playerId);
    if (player) {
      player.hasFinishedVoting = true;
    }

    // Check if all active players have finished voting
    const allFinished = room.players.length > 0 && room.players.every(p => p.hasFinishedVoting);
    if (allFinished) {
      room.phase = 'WINNER_SHOWDOWN';
      this.calculateResults(room);
    }

    return room;
  }

  calculateResults(room: RoomState): void {
    const movieScores: MovieScore[] = room.movies.map(movie => {
      let likes = 0;
      let dislikes = 0;
      let superlikes = 0;
      const voters: { playerName: string; playerAvatar: string; type: any }[] = [];

      Object.entries(room.votes).forEach(([voterId, userVotes]) => {
        const voter = room.players.find(p => p.id === voterId);
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

      // Superlikes count as 2, Likes as 1, Dislikes as -1
      const netScore = (likes * 1) + (superlikes * room.settings.superVoteWeight) - (dislikes * 1);

      return {
        movie,
        likes,
        dislikes,
        superlikes,
        netScore,
        votedBy: voters
      };
    });

    // Sort by Net Score descending, then by Rating, then by total likes
    movieScores.sort((a, b) => {
      if (b.netScore !== a.netScore) return b.netScore - a.netScore;
      if ((b.superlikes + b.likes) !== (a.superlikes + a.likes)) {
        return (b.superlikes + b.likes) - (a.superlikes + a.likes);
      }
      return b.movie.rating - a.movie.rating;
    });

    room.results = movieScores;
    room.winner = movieScores.length > 0 ? movieScores[0] : undefined;
  }

  restartGame(code: string): RoomState | undefined {
    const room = this.getRoom(code);
    if (!room) return undefined;

    room.phase = 'LOBBY';
    room.movies = [];
    room.votes = {};
    room.results = undefined;
    room.winner = undefined;
    room.players.forEach(p => {
      p.isReady = false;
      p.hasFinishedVoting = false;
    });

    return room;
  }

  private generateUniqueCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    if (this.rooms.has(code)) {
      return this.generateUniqueCode();
    }
    return code;
  }
}
