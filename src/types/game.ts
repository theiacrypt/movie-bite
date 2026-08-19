export interface Movie {
  id: string;
  title: string;
  year: string;
  poster: string;
  backdrop?: string;
  plot: string;
  genre: string[];
  rating: number; // 0 - 10
  votesCount?: number;
  runtime?: string;
  runtimeMinutes?: number;
  soundtrackHighlight?: string;
  director?: string;
  actors?: string;
  suggestedBy?: {
    id: string;
    name: string;
    avatar: string;
  };
}

export interface Player {
  id: string;
  name: string;
  avatar: string;
  isHost: boolean;
  isReady: boolean;
  hasFinishedVoting: boolean;
  joinedAt: number;
}

export type VoteType = 'like' | 'dislike' | 'superlike' | 'neutral';

export interface UserVote {
  movieId: string;
  type: VoteType;
}

export type GamePhase = 'LOBBY' | 'ROUND_1_SUGGEST' | 'ROUND_2_VOTE' | 'WINNER_SHOWDOWN';

export interface RoomSettings {
  maxSuggestionsPerPlayer: number; // 0 = unlimited / keine Grenze
  votingTimeLimitSeconds: number; // 0 for unlimited (host controls)
  allowDislikes: boolean;
  superVoteWeight: number;
}

export interface MovieScore {
  movie: Movie;
  likes: number;
  dislikes: number;
  superlikes: number;
  neutrals: number;
  netScore: number;
  votedBy: {
    playerName: string;
    playerAvatar: string;
    type: VoteType;
  }[];
}

export interface RoomState {
  code: string;
  hostId: string;
  phase: GamePhase;
  players: Player[];
  movies: Movie[];
  votes: Record<string, UserVote[]>; // playerId -> UserVote[]
  settings: RoomSettings;
  results?: MovieScore[];
  winner?: MovieScore;
  createdAt: number;
}

export interface SearchMovieResult {
  id: string;
  title: string;
  year: string;
  poster: string;
  plot: string;
  genre: string[];
  rating: number;
  runtime?: string;
  runtimeMinutes?: number;
  soundtrackHighlight?: string;
}
