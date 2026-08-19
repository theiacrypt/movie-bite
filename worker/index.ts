import { RoomDurableObject } from './roomDurableObject.js';
import { SearchMovieResult } from '../src/types/game.js';
import { CURATED_POPULAR_MOVIES, searchMovies as baseSearchMovies, MovieSearchParams } from '../server/movieApi.js';

export { RoomDurableObject };

export interface Env {
  MOVIE_ROOM: DurableObjectNamespace;
  ASSETS?: Fetcher;
  TMDB_API_KEY?: string;
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders()
      });
    }

    // API: Health Check
    if (url.pathname === '/api/health') {
      return new Response(
        JSON.stringify({ status: 'ok', service: 'movie-bite-worker', time: new Date().toISOString() }),
        {
          headers: { ...corsHeaders(), 'Content-Type': 'application/json' }
        }
      );
    }

    // API: Movie Search with Filters
    if (url.pathname === '/api/search') {
      const query = url.searchParams.get('q') || '';
      const genre = url.searchParams.get('genre') || 'all';
      const minRating = url.searchParams.get('minRating') ? parseFloat(url.searchParams.get('minRating')!) : 0;
      const runtimeCategory = (url.searchParams.get('runtime') as any) || 'all';
      const soundtrack = url.searchParams.get('soundtrack') === 'true' || url.searchParams.get('soundtrack') === '1';
      const sortBy = (url.searchParams.get('sortBy') as any) || 'popularity';

      const results = await baseSearchMovies({
        query,
        genre,
        minRating,
        runtimeCategory,
        soundtrack,
        sortBy
      });

      return new Response(JSON.stringify({ results }), {
        headers: { ...corsHeaders(), 'Content-Type': 'application/json' }
      });
    }

    // API: Room State Inspection
    if (url.pathname.startsWith('/api/rooms/')) {
      const code = url.pathname.replace('/api/rooms/', '').toUpperCase();
      if (!code) {
        return new Response(JSON.stringify({ error: 'Code fehlt' }), {
          status: 400,
          headers: { ...corsHeaders(), 'Content-Type': 'application/json' }
        });
      }

      const id = env.MOVIE_ROOM.idFromName(code);
      const stub = env.MOVIE_ROOM.get(id);
      const res = await stub.fetch(request);
      return new Response(await res.text(), {
        headers: { ...corsHeaders(), 'Content-Type': 'application/json' }
      });
    }

    // WebSocket / Real-time Gateway
    if (url.pathname === '/ws' || url.pathname.startsWith('/socket.io') || request.headers.get('Upgrade') === 'websocket') {
      let code = url.searchParams.get('code') || '';
      const playerId = url.searchParams.get('playerId') || '(none)';
      
      // If no code provided yet (e.g. creating room or initial handshake)
      if (!code) {
        code = `TEMP_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      }

      const cleanCode = code.toUpperCase().trim();
      console.log(`[Worker] WS Verbindung -> Code: ${cleanCode}, PlayerId: ${playerId}`);
      const id = env.MOVIE_ROOM.idFromName(cleanCode);
      const stub = env.MOVIE_ROOM.get(id);
      return stub.fetch(request);
    }

    // Serve Static Assets (Frontend) if available
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response('Movie-Bite Cloudflare Worker läuft!', {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
  }
};
