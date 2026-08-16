import { SearchMovieResult } from '../types/game.js';
import { getBackendBaseUrl } from './socket.js';

export interface MovieSearchParams {
  query?: string;
  genre?: string;
  minRating?: number;
  runtimeCategory?: 'short' | 'medium' | 'long' | 'all';
  soundtrack?: boolean;
  sortBy?: 'popularity' | 'rating' | 'year' | 'runtime';
}

const TMDB_API_KEY = "15d2ea6d0dc1d476efbca3eba2b9bbfb";

// Curated high-rated movies collection with rich metadata
export const CURATED_POPULAR_MOVIES: SearchMovieResult[] = [
  {
    id: "tmdb-157336",
    title: "Interstellar",
    year: "2014",
    poster: "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
    plot: "Ein Team von Entdeckern nutzt ein neu entdecktes Wurmloch, um die Grenzen der menschlichen Raumfahrt zu überwinden und eine neue Heimat zu finden.",
    genre: ["Sci-Fi", "Drama", "Abenteuer"],
    rating: 8.7,
    runtime: "169 min",
    runtimeMinutes: 169,
    soundtrackHighlight: "Hans Zimmer (Kult-Orgel-Score)"
  },
  {
    id: "tmdb-27205",
    title: "Inception",
    year: "2010",
    poster: "https://image.tmdb.org/t/p/w500/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg",
    plot: "Ein Dieb, der in die Träume von Menschen eindringt, erhält den Auftrag, einen Gedanken in das Unterbewusstsein eines Erben einzupflanzen.",
    genre: ["Action", "Sci-Fi", "Abenteuer"],
    rating: 8.8,
    runtime: "148 min",
    runtimeMinutes: 148,
    soundtrackHighlight: "Hans Zimmer ('Time')"
  },
  {
    id: "tmdb-693134",
    title: "Dune: Part Two",
    year: "2024",
    poster: "https://image.tmdb.org/t/p/w500/czembW0Rk1Ke7desVsc3umEvTXd.jpg",
    plot: "Paul Atreides verbündet sich mit Chani und den Fremen, während er Rache an den Verschwörern sucht, die seine Familie zerstört haben.",
    genre: ["Sci-Fi", "Abenteuer", "Action"],
    rating: 8.6,
    runtime: "166 min",
    runtimeMinutes: 166,
    soundtrackHighlight: "Hans Zimmer (Epischer Wüstensound)"
  },
  {
    id: "tmdb-120",
    title: "Der Herr der Ringe: Die Gefährten",
    year: "2001",
    poster: "https://image.tmdb.org/t/p/w500/6oom5QYQ2yQTMJIbnvbkBL9cDK6.jpg",
    plot: "Ein schüchterner Hobbit aus dem Auenland begibt sich mit acht Gefährten auf die Reise, um den Einen Ring im Schicksalsberg zu vernichten.",
    genre: ["Abenteuer", "Fantasy", "Action"],
    rating: 8.9,
    runtime: "178 min",
    runtimeMinutes: 178,
    soundtrackHighlight: "Howard Shore (Oscar-Meisterwerk)"
  },
  {
    id: "tmdb-98",
    title: "Gladiator",
    year: "2000",
    poster: "https://image.tmdb.org/t/p/w500/ty8TGRuvJLPUmAR1H1nRIsgwvim.jpg",
    plot: "Ein verratener römischer General sinnt im Kolosseum als Gladiator auf Rache gegen den korrupten Kaiser, der seine Familie ermordete.",
    genre: ["Action", "Drama", "Abenteuer"],
    rating: 8.5,
    runtime: "155 min",
    runtimeMinutes: 155,
    soundtrackHighlight: "Hans Zimmer & Lisa Gerrard ('Now We Are Free')"
  },
  {
    id: "tmdb-313369",
    title: "La La Land",
    year: "2016",
    poster: "https://image.tmdb.org/t/p/w500/uDO8zWDhfWwoFdKS4fzkVJt0Rf0.jpg",
    plot: "Eine aufstrebende Schauspielerin und ein leidenschaftlicher Jazz-Pianist verlieben sich in Los Angeles, während sie für ihre Träume kämpfen.",
    genre: ["Musik", "Romantik", "Drama", "Komödie"],
    rating: 8.0,
    runtime: "128 min",
    runtimeMinutes: 128,
    soundtrackHighlight: "Justin Hurwitz ('City of Stars' - 2x Oscar)"
  },
  {
    id: "tmdb-244786",
    title: "Whiplash",
    year: "2014",
    poster: "https://image.tmdb.org/t/p/w500/7fn624j5lj3xTme2SgiLCe3P6EH.jpg",
    plot: "Ein junger, talentierter Jazz-Schlagzeuger gerät an einen tyrannischen Bandleader, der ihn bis an seine mentalen und körperlichen Grenzen treibt.",
    genre: ["Drama", "Musik"],
    rating: 8.5,
    runtime: "107 min",
    runtimeMinutes: 107,
    soundtrackHighlight: "Spektakulärer Jazz-Soundtrack"
  },
  {
    id: "tmdb-424694",
    title: "Bohemian Rhapsody",
    year: "2018",
    poster: "https://image.tmdb.org/t/p/w500/lHu1wtNMPYAem6sy5rl8M7vsWYR.jpg",
    plot: "Die Feier der legendären Rockband Queen und ihres außergewöhnlichen Leadsängers Freddie Mercury bis zum legendären Live-Aid-Auftritt.",
    genre: ["Musik", "Drama", "Biografie"],
    rating: 8.0,
    runtime: "135 min",
    runtimeMinutes: 135,
    soundtrackHighlight: "Queen Originalaufnahmen & Live Aid"
  },
  {
    id: "tmdb-20526",
    title: "Tron: Legacy",
    year: "2010",
    poster: "https://image.tmdb.org/t/p/w500/vuifSrd8wzsU0jg7cu0uIPZ1A1C.jpg",
    plot: "Der Sohn eines Computergenies wird in die digitale Rasterwelt hineingezogen, in der sein Vater seit 20 Jahren gefangen ist.",
    genre: ["Sci-Fi", "Action", "Abenteuer"],
    rating: 7.4,
    runtime: "125 min",
    runtimeMinutes: 125,
    soundtrackHighlight: "Daft Punk (Elektronischer Meilenstein)"
  },
  {
    id: "tmdb-64690",
    title: "Drive",
    year: "2011",
    poster: "https://image.tmdb.org/t/p/w500/602vevIURmpENz40CuWwh0x074t.jpg",
    plot: "Ein Hollywood-Stuntfahrer, der nachts als Fluchtwagenfahrer arbeitet, versucht einer Nachbarin und deren Sohn vor der Mafia zu helfen.",
    genre: ["Drama", "Thriller", "Krimi"],
    rating: 7.9,
    runtime: "100 min",
    runtimeMinutes: 100,
    soundtrackHighlight: "Kavinsky & Cliff Martinez (Synthwave-Kult)"
  },
  {
    id: "tmdb-194",
    title: "Die fabelhafte Welt der Amélie",
    year: "2001",
    poster: "https://image.tmdb.org/t/p/w500/52U1F90wD0c5GZqK4YF5aUf9k5P.jpg",
    plot: "Die verträumte Kellnerin Amélie beschließt, heimlich das Leben der Menschen in ihrem Pariser Viertel zum Besseren zu verändern.",
    genre: ["Komödie", "Romantik"],
    rating: 8.3,
    runtime: "122 min",
    runtimeMinutes: 122,
    soundtrackHighlight: "Yann Tiersen (Akkordeon & Klavier-Ikone)"
  },
  {
    id: "tmdb-155",
    title: "The Dark Knight",
    year: "2008",
    poster: "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
    plot: "Batman stellt sich der Bedrohung durch das kriminelle Genie Joker, der Gotham City in Chaos und Anarchie stürzt.",
    genre: ["Action", "Krimi", "Drama", "Thriller"],
    rating: 9.0,
    runtime: "152 min",
    runtimeMinutes: 152,
    soundtrackHighlight: "Hans Zimmer & James Newton Howard"
  },
  {
    id: "tmdb-550",
    title: "Fight Club",
    year: "1999",
    poster: "https://image.tmdb.org/t/p/w500/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
    plot: "Ein unzufriedener Versicherungsangestellter gründet mit einem charismatischen Seifenverkäufer einen Untergrund-Kampfclub.",
    genre: ["Drama", "Thriller", "Krimi"],
    rating: 8.8,
    runtime: "139 min",
    runtimeMinutes: 139,
    soundtrackHighlight: "The Dust Brothers & The Pixies ('Where Is My Mind?')"
  },
  {
    id: "tmdb-680",
    title: "Pulp Fiction",
    year: "1994",
    poster: "https://image.tmdb.org/t/p/w500/vQWk5R9gLggBu5m4ZwfuvPjkUtm.jpg",
    plot: "Vier miteinander verwobene Geschichten aus der Unterwelt von Los Angeles rund um Auftragskiller, Boxer und Gangsterbosse.",
    genre: ["Thriller", "Krimi", "Drama"],
    rating: 8.9,
    runtime: "154 min",
    runtimeMinutes: 154,
    soundtrackHighlight: "Kult-Surf-Rock & Funk ('Misirlou', 'You Never Can Tell')"
  },
  {
    id: "tmdb-872585",
    title: "Oppenheimer",
    year: "2023",
    poster: "https://image.tmdb.org/t/p/w500/ptpr0kGAckfQkJeJIt8st5dglvd.jpg",
    plot: "Die Geschichte des amerikanischen Wissenschaftlers J. Robert Oppenheimer und seiner Rolle bei der Entwicklung der Atombombe.",
    genre: ["Drama", "Geschichte", "Biografie"],
    rating: 8.8,
    runtime: "180 min",
    runtimeMinutes: 180,
    soundtrackHighlight: "Ludwig Göransson (Oscar-Gewinner 'Can You Hear the Music')"
  },
  {
    id: "tmdb-324857",
    title: "Spider-Man: A New Universe",
    year: "2018",
    poster: "https://image.tmdb.org/t/p/w500/iiZZdoQBEYBv6id8su7ImL0oCbD.jpg",
    plot: "Der Teenager Miles Morales wird zur neuen Spider-Man und verbündet sich mit Spider-Helden aus anderen Dimensionen.",
    genre: ["Animation", "Action", "Abenteuer", "Sci-Fi"],
    rating: 8.4,
    runtime: "117 min",
    runtimeMinutes: 117,
    soundtrackHighlight: "Daniel Pemberton & Post Malone ('Sunflower')"
  },
  {
    id: "tmdb-496243",
    title: "Parasite",
    year: "2019",
    poster: "https://image.tmdb.org/t/p/w500/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg",
    plot: "Die arbeitslose Familie Kim schleust sich nach und nach mit Tricks als Hauspersonal bei der wohlhabenden Familie Park ein.",
    genre: ["Thriller", "Drama", "Komödie"],
    rating: 8.5,
    runtime: "132 min",
    runtimeMinutes: 132
  },
  {
    id: "tmdb-372058",
    title: "Your Name.",
    year: "2016",
    poster: "https://image.tmdb.org/t/p/w500/q719jXXEzOoYaps6qFsxWa93bu.jpg",
    plot: "Zwei Jugendliche tauschen auf unerklärliche Weise periodisch die Körper und versuchen, sich in der realen Welt zu finden.",
    genre: ["Animation", "Romantik", "Drama", "Fantasy"],
    rating: 8.5,
    runtime: "106 min",
    runtimeMinutes: 106,
    soundtrackHighlight: "RADWIMPS (Herzerwärmender J-Rock Score)"
  },
  {
    id: "tmdb-129",
    title: "Chihiros Reise ins Zauberland",
    year: "2001",
    poster: "https://image.tmdb.org/t/p/w500/oRvEGv5b72g8L5zQ4q4bJzJ2U1a.jpg",
    plot: "Ein 10-jähriges Mädchen gerät in ein geheimnisvolles Badehaus der Götter und Geister, um ihre verzauberten Eltern zu retten.",
    genre: ["Animation", "Fantasy", "Familie", "Abenteuer"],
    rating: 8.5,
    runtime: "125 min",
    runtimeMinutes: 125,
    soundtrackHighlight: "Joe Hisaishi (Studio Ghibli Meisterwerk)"
  },
  {
    id: "tmdb-389",
    title: "12 Angry Men",
    year: "1957",
    poster: "https://image.tmdb.org/t/p/w500/ow3wq89wM8qd5X7hWKxiRfsFf9C.jpg",
    plot: "Zwölf Geschworene verhandeln über das Schicksal eines 18-jährigen Jungen, der wegen Mordes an seinem Vater angeklagt ist.",
    genre: ["Drama", "Krimi"],
    rating: 9.0,
    runtime: "96 min",
    runtimeMinutes: 96
  },
  {
    id: "tmdb-533535",
    title: "Deadpool & Wolverine",
    year: "2024",
    poster: "https://image.tmdb.org/t/p/w500/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg",
    plot: "Ein lustloser Wade Wilson kämpft sich durchs Zivilleben, als eine neue Bedrohung ihn zwingt, erneut zum Anzug zu greifen – mit Wolverine an seiner Seite.",
    genre: ["Action", "Komödie", "Sci-Fi"],
    rating: 7.7,
    runtime: "128 min",
    runtimeMinutes: 128,
    soundtrackHighlight: "Madonna & 2000er Pop-Hymnen ('Like a Prayer')"
  },
  {
    id: "tmdb-597",
    title: "Titanic",
    year: "1997",
    poster: "https://image.tmdb.org/t/p/w500/9xjZS2rlVxm8SFx8kPC3aIGCOYQ.jpg",
    plot: "Die tragische Liebesgeschichte zwischen dem armen Künstler Jack und der wohlhabenden Rose an Bord der unglückseligen Titanic.",
    genre: ["Drama", "Romantik"],
    rating: 7.9,
    runtime: "194 min",
    runtimeMinutes: 194,
    soundtrackHighlight: "James Horner & Céline Dion ('My Heart Will Go On')"
  },
  {
    id: "tmdb-429",
    title: "Zwei glorreiche Halunken",
    year: "1966",
    poster: "https://image.tmdb.org/t/p/w500/bX2xnavhMYjWDoZp1VM6VnU1xwe.jpg",
    plot: "Drei Revolverhelden liefern sich während des amerikanischen Bürgerkriegs ein Wettrennen um einen vergrabenen Goldschatz.",
    genre: ["Western", "Abenteuer"],
    rating: 8.5,
    runtime: "178 min",
    runtimeMinutes: 178,
    soundtrackHighlight: "Ennio Morricone (Legendäres Pfeif-Thema)"
  },
  {
    id: "tmdb-11",
    title: "Star Wars: Eine neue Hoffnung",
    year: "1977",
    poster: "https://image.tmdb.org/t/p/w500/6FfCtAuVAW8XJjZ7eWeLibRLWTw.jpg",
    plot: "Luke Skywalker schließt sich einer Rebellengruppe an, um die Galaxie vor der Tyrannei des bösen Imperiums zu retten.",
    genre: ["Sci-Fi", "Abenteuer", "Action"],
    rating: 8.2,
    runtime: "121 min",
    runtimeMinutes: 121,
    soundtrackHighlight: "John Williams (Die berühmteste Filmmusik aller Zeiten)"
  },
  {
    id: "tmdb-603",
    title: "Matrix",
    year: "1999",
    poster: "https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg",
    plot: "Ein Computer-Hacker erfährt von mysteriösen Rebellen die schockierende Wahrheit über seine Realität und seine Rolle im Krieg gegen die Maschinen.",
    genre: ["Action", "Sci-Fi"],
    rating: 8.7,
    runtime: "136 min",
    runtimeMinutes: 136,
    soundtrackHighlight: "Don Davis & Rage Against the Machine / Clubbed to Death"
  },
  {
    id: "tmdb-278",
    title: "Die Verurteilten",
    year: "1994",
    poster: "https://image.tmdb.org/t/p/w500/lyQVs2Z9ndEZ579agIEUrRiFAzC.jpg",
    plot: "Ein unschuldig zu lebenslanger Haft verurteilter Banker schließt im berüchtigten Shawshank-Gefängnis eine lebenslange Freundschaft.",
    genre: ["Drama", "Krimi"],
    rating: 9.3,
    runtime: "142 min",
    runtimeMinutes: 142,
    soundtrackHighlight: "Thomas Newman"
  },
  {
    id: "tmdb-13",
    title: "Forrest Gump",
    year: "1994",
    poster: "https://image.tmdb.org/t/p/w500/saHP97rTPS5eLmrLQEcANmKrsFl.jpg",
    plot: "Die herzerwärmende Lebensreise des gutherzigen Forrest Gump, der zufällig einige der bedeutendsten historischen Ereignisse des 20. Jahrhunderts prägt.",
    genre: ["Komödie", "Drama", "Romantik"],
    rating: 8.8,
    runtime: "142 min",
    runtimeMinutes: 142,
    soundtrackHighlight: "Alan Silvestri (Feder-Thema & Classic Rock Hits)"
  },
  {
    id: "tmdb-77",
    title: "Memento",
    year: "2000",
    poster: "https://image.tmdb.org/t/p/w500/yuNs09hvpHVU1cBTCAk9z9a2Ykm.jpg",
    plot: "Ein Mann ohne Kurzzeitgedächtnis versucht anhand von Tätowierungen und Polaroid-Fotos den Mörder seiner Frau zu finden.",
    genre: ["Mystery", "Thriller"],
    rating: 8.4,
    runtime: "113 min",
    runtimeMinutes: 113
  },
  {
    id: "tmdb-105",
    title: "Zurück in die Zukunft",
    year: "1985",
    poster: "https://image.tmdb.org/t/p/w500/7lyBcpYB0Qt8gYvXYaEZUNNsHg1.jpg",
    plot: "Marty McFly reist mit einem zur Zeitmaschine umgebauten DeLorean versehentlich 30 Jahre in die Vergangenheit ins Jahr 1955.",
    genre: ["Abenteuer", "Komödie", "Sci-Fi", "Familie"],
    rating: 8.5,
    runtime: "116 min",
    runtimeMinutes: 116,
    soundtrackHighlight: "Alan Silvestri & Huey Lewis ('The Power of Love')"
  },
  {
    id: "tmdb-299536",
    title: "Avengers: Infinity War",
    year: "2018",
    poster: "https://image.tmdb.org/t/p/w500/7WsyChQLEftFiDOVTGkv3hFpyyt.jpg",
    plot: "Die Avengers und ihre Verbündeten müssen alles riskieren, um den mächtigen Titanen Thanos daran zu hindern, das Universum zu dezimieren.",
    genre: ["Action", "Sci-Fi", "Abenteuer"],
    rating: 8.3,
    runtime: "149 min",
    runtimeMinutes: 149,
    soundtrackHighlight: "Alan Silvestri (Avengers Main Theme)"
  },
  {
    id: "tmdb-118340",
    title: "Guardians of the Galaxy",
    year: "2014",
    poster: "https://image.tmdb.org/t/p/w500/r7vmZjiyZw9rpJMQJdXpjgiCOk9.jpg",
    plot: "Eine chaotische Gruppe von Weltraum-Outlaws schließt sich zusammen, um eine mächtige Kugel vor einem fanatischen Krieger zu beschützen.",
    genre: ["Action", "Sci-Fi", "Komödie", "Abenteuer"],
    rating: 8.0,
    runtime: "121 min",
    runtimeMinutes: 121,
    soundtrackHighlight: "Awesome Mix Vol. 1 (70s/80s Pop & Rock Gold)"
  },
  {
    id: "tmdb-807",
    title: "Sieben",
    year: "1995",
    poster: "https://image.tmdb.org/t/p/w500/69Sns8WoET6CfaYlIkHbla4l7nC.jpg",
    plot: "Zwei Detectives jagen einen Serienmörder, der seine grausamen Verbrechen nach den sieben Todsünden inszeniert.",
    genre: ["Krimi", "Mystery", "Thriller"],
    rating: 8.6,
    runtime: "127 min",
    runtimeMinutes: 127
  },
  {
    id: "tmdb-500",
    title: "Reservoir Dogs",
    year: "1992",
    poster: "https://image.tmdb.org/t/p/w500/xi8Iu6Fab06F1B8476iN5L54s7U.jpg",
    plot: "Nach einem fehlgeschlagenen Juwelenraub versammeln sich überlebende Kriminelle und verdächtigen sich gegenseitig, ein Polizeispitzel zu sein.",
    genre: ["Krimi", "Thriller"],
    rating: 8.3,
    runtime: "99 min",
    runtimeMinutes: 99,
    soundtrackHighlight: "K-Billy's Super Sounds of the 70s ('Stuck in the Middle with You')"
  },
  {
    id: "tmdb-424",
    title: "Schindlers Liste",
    year: "1993",
    poster: "https://image.tmdb.org/t/p/w500/sF1U4EUQS8YHUYjNl3pMGNIQyr0.jpg",
    plot: "Der deutsche Industrielle Oskar Schindler rettet während des Zweiten Weltkriegs über tausend jüdischen Zwangsarbeitern das Leben.",
    genre: ["Drama", "Geschichte", "Krieg"],
    rating: 8.9,
    runtime: "195 min",
    runtimeMinutes: 195,
    soundtrackHighlight: "John Williams & Itzhak Perlman (Violin-Meisterwerk)"
  }
];

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

/**
 * Direct client-side TMDB search with curated fallback & local filtering
 */
export async function directTmdbSearch(params: MovieSearchParams | string): Promise<SearchMovieResult[]> {
  const options: MovieSearchParams = typeof params === 'string' ? { query: params } : params;
  const trimmed = (options.query || '').trim();
  const genreFilter = options.genre && options.genre !== 'all' && options.genre !== 'Alle' ? options.genre.toLowerCase() : null;
  const minRating = options.minRating || 0;
  const runtimeCat = options.runtimeCategory || 'all';
  const soundtrackOnly = !!options.soundtrack;
  const sortBy = options.sortBy || 'popularity';

  let results: SearchMovieResult[] = [];

  if (trimmed) {
    try {
      const url = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(trimmed)}&language=de-DE&include_adult=false`;
      const response = await fetch(url, { headers: { 'Accept': 'application/json' } });
      
      if (response.ok) {
        const data: any = await response.json();
        if (data.results && data.results.length > 0) {
          results = data.results.slice(0, 24).map((item: any) => {
            const year = item.release_date ? item.release_date.substring(0, 4) : 'N/A';
            const poster = item.poster_path 
              ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
              : 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&auto=format&fit=crop&q=60';
            
            const movieGenres = getGenreNames(item.genre_ids);
            
            const matchingCurated = CURATED_POPULAR_MOVIES.find(c => 
              c.title.toLowerCase() === (item.title || '').toLowerCase() || 
              (item.original_title && c.title.toLowerCase() === item.original_title.toLowerCase())
            );

            return {
              id: `tmdb-${item.id}`,
              title: item.title || item.original_title,
              year: year,
              poster: poster,
              plot: item.overview || "Keine deutsche Beschreibung verfügbar.",
              genre: movieGenres,
              rating: Math.round((item.vote_average || 7.0) * 10) / 10,
              runtime: matchingCurated?.runtime || undefined,
              runtimeMinutes: matchingCurated?.runtimeMinutes || undefined,
              soundtrackHighlight: matchingCurated?.soundtrackHighlight || (movieGenres.includes('Musik') ? 'Musikfilm / Soundtrack' : undefined)
            };
          });
        }
      }
    } catch (err) {
      console.warn("Direct TMDB fetch failed:", err);
    }
  }

  // Fallback to Curated Movies
  if (results.length === 0) {
    if (trimmed) {
      const lowerQuery = trimmed.toLowerCase();
      results = CURATED_POPULAR_MOVIES.filter(m => 
        m.title.toLowerCase().includes(lowerQuery) || 
        m.genre.some(g => g.toLowerCase().includes(lowerQuery)) ||
        m.year.includes(lowerQuery) ||
        (m.soundtrackHighlight && m.soundtrackHighlight.toLowerCase().includes(lowerQuery))
      );
    } else {
      results = [...CURATED_POPULAR_MOVIES];
    }
  }

  // Apply Filters
  let filtered = results.filter(movie => {
    if (genreFilter) {
      const matchesGenre = movie.genre.some(g => g.toLowerCase() === genreFilter);
      if (!matchesGenre) return false;
    }

    if (minRating > 0 && movie.rating < minRating) {
      return false;
    }

    if (soundtrackOnly) {
      const hasSoundtrack = !!movie.soundtrackHighlight || movie.genre.some(g => g.toLowerCase() === 'musik');
      if (!hasSoundtrack) return false;
    }

    if (runtimeCat !== 'all' && movie.runtimeMinutes) {
      if (runtimeCat === 'short' && movie.runtimeMinutes >= 100) return false;
      if (runtimeCat === 'medium' && (movie.runtimeMinutes < 100 || movie.runtimeMinutes > 140)) return false;
      if (runtimeCat === 'long' && movie.runtimeMinutes <= 140) return false;
    }

    return true;
  });

  // Apply Sorting
  filtered.sort((a, b) => {
    if (sortBy === 'rating') {
      return b.rating - a.rating;
    }
    if (sortBy === 'year') {
      return parseInt(b.year || '0') - parseInt(a.year || '0');
    }
    if (sortBy === 'runtime') {
      const rtA = a.runtimeMinutes || 120;
      const rtB = b.runtimeMinutes || 120;
      return rtA - rtB;
    }
    if (soundtrackOnly) {
      const scoreA = (a.soundtrackHighlight ? 10 : 0) + a.rating;
      const scoreB = (b.soundtrackHighlight ? 10 : 0) + b.rating;
      return scoreB - scoreA;
    }
    return 0;
  });

  return filtered;
}

/**
 * Universal Movie Search function: tries backend first, falls back immediately to direct TMDB/curated search
 */
export async function searchMoviesUniversal(params: MovieSearchParams | string): Promise<SearchMovieResult[]> {
  const options: MovieSearchParams = typeof params === 'string' ? { query: params } : params;
  const baseUrl = getBackendBaseUrl();

  // Try backend API first
  try {
    const urlParams = new URLSearchParams();
    if (options.query?.trim()) urlParams.set('q', options.query.trim());
    if (options.genre && options.genre !== 'Alle' && options.genre !== 'all') urlParams.set('genre', options.genre);
    if (options.soundtrack) urlParams.set('soundtrack', 'true');
    if (options.minRating && options.minRating > 0) urlParams.set('minRating', options.minRating.toString());
    if (options.runtimeCategory && options.runtimeCategory !== 'all') urlParams.set('runtime', options.runtimeCategory);
    if (options.sortBy && options.sortBy !== 'popularity') urlParams.set('sortBy', options.sortBy);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(`${baseUrl}/api/search?${urlParams.toString()}`, {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' }
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.results) && data.results.length > 0) {
        return data.results;
      }
    }
  } catch (err) {
    // Backend fetch failed (e.g. offline, local dev without server, worker error) - fallback below
    console.debug('Backend search failed, using client-side TMDB search fallback:', err);
  }

  // Fallback to client-side TMDB search
  return directTmdbSearch(options);
}
