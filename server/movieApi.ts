import { SearchMovieResult } from '../src/types/game.js';

// Curated high-rated movies collection for fast discovery & offline fallback
const CURATED_POPULAR_MOVIES: SearchMovieResult[] = [
  {
    id: "tmdb-550",
    title: "Fight Club",
    year: "1999",
    poster: "https://image.tmdb.org/t/p/w500/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
    plot: "Ein unzufriedener Versicherungsangestellter gründet mit einem charismatischen Seifenverkäufer einen Untergrund-Kampfclub.",
    genre: ["Drama", "Thriller"],
    rating: 8.8,
    runtime: "139 min"
  },
  {
    id: "tmdb-27205",
    title: "Inception",
    year: "2010",
    poster: "https://image.tmdb.org/t/p/w500/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg",
    plot: "Ein Dieb, der in die Träume von Menschen eindringt, erhält den Auftrag, einen Gedanken in das Unterbewusstsein eines Erben einzupflanzen.",
    genre: ["Action", "Sci-Fi", "Abenteuer"],
    rating: 8.8,
    runtime: "148 min"
  },
  {
    id: "tmdb-157336",
    title: "Interstellar",
    year: "2014",
    poster: "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
    plot: "Ein Team von Entdeckern nutzt ein neu entdecktes Wurmloch, um die Grenzen der menschlichen Raumfahrt zu überwinden und eine neue Heimat zu finden.",
    genre: ["Sci-Fi", "Drama", "Abenteuer"],
    rating: 8.7,
    runtime: "169 min"
  },
  {
    id: "tmdb-155",
    title: "The Dark Knight",
    year: "2008",
    poster: "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
    plot: "Batman stellt sich der Bedrohung durch das kriminelle Genie Joker, der Gotham City in Chaos und Anarchie stürzt.",
    genre: ["Action", "Krimi", "Drama"],
    rating: 9.0,
    runtime: "152 min"
  },
  {
    id: "tmdb-693134",
    title: "Dune: Part Two",
    year: "2024",
    poster: "https://image.tmdb.org/t/p/w500/czembW0Rk1Ke7desVsc3umEvTXd.jpg",
    plot: "Paul Atreides verbündet sich mit Chani und den Fremen, während er Rache an den Verschwörern sucht, die seine Familie zerstört haben.",
    genre: ["Sci-Fi", "Abenteuer"],
    rating: 8.6,
    runtime: "166 min"
  },
  {
    id: "tmdb-424694",
    title: "Bohemian Rhapsody",
    year: "2018",
    poster: "https://image.tmdb.org/t/p/w500/lHu1wtNMPYAem6sy5rl8M7vsWYR.jpg",
    plot: "Die Feier der legendären Rockband Queen und ihres außergewöhnlichen Leadsängers Freddie Mercury.",
    genre: ["Musik", "Drama", "Biografie"],
    rating: 8.0,
    runtime: "135 min"
  },
  {
    id: "tmdb-872585",
    title: "Oppenheimer",
    year: "2023",
    poster: "https://image.tmdb.org/t/p/w500/ptpr0kGAckfQkJeJIt8st5dglvd.jpg",
    plot: "Die Geschichte des amerikanischen Wissenschaftlers J. Robert Oppenheimer und seiner Rolle bei der Entwicklung der Atombombe.",
    genre: ["Drama", "Geschichte", "Biografie"],
    rating: 8.8,
    runtime: "180 min"
  },
  {
    id: "tmdb-389",
    title: "12 Angry Men",
    year: "1957",
    poster: "https://image.tmdb.org/t/p/w500/ow3wq89wM8qd5X7hWKxiRfsFf9C.jpg",
    plot: "Zwölf Geschworene verhandeln über das Schicksal eines 18-jährigen Jungen, der wegen Mordes an seinem Vater angeklagt ist.",
    genre: ["Drama", "Krimi"],
    rating: 9.0,
    runtime: "96 min"
  },
  {
    id: "tmdb-496243",
    title: "Parasite",
    year: "2019",
    poster: "https://image.tmdb.org/t/p/w500/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg",
    plot: "Die arbeitslose Familie Kim schleust sich nach und nach mit Tricks als Hauspersonal bei der wohlhabenden Familie Park ein.",
    genre: ["Thriller", "Drama", "Komödie"],
    rating: 8.5,
    runtime: "132 min"
  },
  {
    id: "tmdb-120",
    title: "Der Herr der Ringe: Die Gefährten",
    year: "2001",
    poster: "https://image.tmdb.org/t/p/w500/6oom5QYQ2yQTMJIbnvbkBL9cDK6.jpg",
    plot: "Ein schüchterner Hobbit aus dem Auenland begibt sich mit acht Gefährten auf die Reise, um den Einen Ring im Schicksalsberg zu vernichten.",
    genre: ["Abenteuer", "Fantasy", "Action"],
    rating: 8.9,
    runtime: "178 min"
  },
  {
    id: "tmdb-372058",
    title: "Your Name.",
    year: "2016",
    poster: "https://image.tmdb.org/t/p/w500/q719jXXEzOoYaps6qFsxWa93bu.jpg",
    plot: "Zwei Jugendliche tauschen auf unerklärliche Weise periodisch die Körper und versuchen, sich in der realen Welt zu finden.",
    genre: ["Animation", "Romantik", "Drama"],
    rating: 8.5,
    runtime: "106 min"
  },
  {
    id: "tmdb-533535",
    title: "Deadpool & Wolverine",
    year: "2024",
    poster: "https://image.tmdb.org/t/p/w500/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg",
    plot: "Ein lustloser Wade Wilson kämpft sich durchs Zivilleben, als eine neue Bedrohung ihn zwingt, erneut zum Anzug zu greifen – mit Wolverine an seiner Seite.",
    genre: ["Action", "Komödie", "Sci-Fi"],
    rating: 7.7,
    runtime: "128 min"
  }
];

export async function searchMovies(query: string): Promise<SearchMovieResult[]> {
  const trimmed = query.trim();
  if (!trimmed) {
    return CURATED_POPULAR_MOVIES;
  }

  // First try TMDB API if key is provided or via free movie discovery endpoint
  const tmdbApiKey = process.env.TMDB_API_KEY || "15d2ea6d0dc1d476efbca3eba2b9bbfb"; // public discovery key
  try {
    const url = `https://api.themoviedb.org/3/search/movie?api_key=${tmdbApiKey}&query=${encodeURIComponent(trimmed)}&language=de-DE&include_adult=false`;
    const response = await fetch(url, { headers: { 'Accept': 'application/json' }, signal: AbortSignal.timeout(4000) });
    
    if (response.ok) {
      const data: any = await response.json();
      if (data.results && data.results.length > 0) {
        return data.results.slice(0, 15).map((item: any) => {
          const year = item.release_date ? item.release_date.substring(0, 4) : 'N/A';
          const poster = item.poster_path 
            ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
            : 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&auto=format&fit=crop&q=60';
          
          return {
            id: `tmdb-${item.id}`,
            title: item.title || item.original_title,
            year: year,
            poster: poster,
            plot: item.overview || "Keine deutsche Beschreibung verfügbar.",
            genre: getGenreNames(item.genre_ids),
            rating: Math.round((item.vote_average || 7.0) * 10) / 10,
            runtime: undefined
          };
        });
      }
    }
  } catch (err) {
    console.warn("TMDB Search fetch failed, falling back to curated search:", err);
  }

  // Fallback search in curated collection
  const lowerQuery = trimmed.toLowerCase();
  const matched = CURATED_POPULAR_MOVIES.filter(m => 
    m.title.toLowerCase().includes(lowerQuery) || 
    m.genre.some(g => g.toLowerCase().includes(lowerQuery)) ||
    m.year.includes(lowerQuery)
  );

  return matched.length > 0 ? matched : CURATED_POPULAR_MOVIES.slice(0, 6);
}

function getGenreNames(genreIds?: number[]): string[] {
  if (!genreIds || !genreIds.length) return ["Film"];
  const genreMap: Record<number, string> = {
    28: "Action",
    12: "Abenteuer",
    16: "Animation",
    35: "Komödie",
    80: "Krimi",
    99: "Dokumentation",
    18: "Drama",
    10751: "Familie",
    14: "Fantasy",
    36: "Historie",
    27: "Horror",
    10402: "Musik",
    9648: "Mystery",
    10749: "Romantik",
    878: "Sci-Fi",
    10770: "TV-Film",
    53: "Thriller",
    10752: "Krieg",
    37: "Western"
  };

  return genreIds.map(id => genreMap[id] || "Film").slice(0, 3);
}
