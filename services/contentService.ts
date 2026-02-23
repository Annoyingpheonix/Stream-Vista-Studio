
import { Movie } from '../types';

interface ArchiveItem {
  identifier: string;
  title: string;
  description: string;
  year?: string;
  downloads?: number;
  avg_rating?: string;
}

// Emergency fallback content in case all APIs fail
const FALLBACK_CONTENT: Movie[] = [
  {
    id: 'fallback-1',
    title: 'Night of the Living Dead',
    description: 'A ragtag group of Pennsylvanians barricade themselves in an old farmhouse to remain safe from a bloodthirsty, flesh-eating breed of monsters.',
    thumbnailUrl: 'https://archive.org/services/img/night_of_the_living_dead',
    backdropUrl: 'https://archive.org/services/img/night_of_the_living_dead',
    genre: ['Horror', 'Classic'],
    rating: 'NR',
    matchScore: 98,
    year: 1968,
    duration: '1h 36m',
    videoUrl: 'https://archive.org/download/night_of_the_living_dead/night_of_the_living_dead_512kb.mp4',
    contentType: 'movie',
    featured: true
  },
  {
    id: 'fallback-2',
    title: 'Popeye the Sailor',
    description: 'Classic animation featuring Popeye, Olive Oyl, and Bluto.',
    thumbnailUrl: 'https://archive.org/services/img/Popeye_Shuteye',
    backdropUrl: 'https://archive.org/services/img/Popeye_Shuteye',
    genre: ['Animation', 'Comedy'],
    rating: 'G',
    matchScore: 95,
    year: 1950,
    duration: '15m',
    videoUrl: 'https://archive.org/download/Popeye_Shuteye/Popeye_Shuteye_512kb.mp4',
    contentType: 'series'
  }
];

// Helper: Safe Fetch with Timeout
const safeFetch = async (url: string, timeout = 8000): Promise<Response> => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(id);
        if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
        return response;
    } catch (error) {
        clearTimeout(id);
        throw error;
    }
};

// ------------------------------------------------------------------
// API 1: Internet Archive (Archive.org)
// ------------------------------------------------------------------

const fetchFromArchiveOrg = async (query: string, limit: number): Promise<ArchiveItem[]> => {
  const url = `https://archive.org/advancedsearch.php?q=${encodeURIComponent(query)}&fl[]=identifier,title,description,year,downloads,avg_rating&sort[]=downloads+desc&rows=${limit}&page=1&output=json`;
  
  try {
    const response = await safeFetch(url);
    const data = await response.json();
    return data.response?.docs || [];
  } catch (error) {
    console.warn(`Archive.org fetch failed for query "${query}":`, error);
    return [];
  }
};

const cleanDescription = (desc?: string) => {
  if (!desc) return "No description available.";
  return desc.replace(/<[^>]*>/g, '').slice(0, 300) + (desc.length > 300 ? '...' : '');
};

const mapArchiveToMovie = (item: ArchiveItem, type: 'movie' | 'series', genre: string[]): Movie => {
  const imgUrl = `https://archive.org/services/img/${item.identifier}`;
  return {
    id: item.identifier,
    title: item.title,
    description: cleanDescription(item.description),
    thumbnailUrl: imgUrl,
    backdropUrl: imgUrl, 
    genre: genre,
    rating: 'TV-PG',
    matchScore: item.avg_rating ? Math.round(parseFloat(item.avg_rating) * 20) : 75 + Math.floor(Math.random() * 20),
    year: item.year ? parseInt(item.year) : 1960,
    duration: type === 'movie' ? 'Full Movie' : 'Episode',
    videoUrl: `https://archive.org/embed/${item.identifier}`,
    contentType: type
  };
};

// ------------------------------------------------------------------
// API 2: Wikimedia Commons (MediaWiki API)
// ------------------------------------------------------------------

const fetchFromWikimedia = async (category: string, labelGenre: string[], limit: number = 10): Promise<Movie[]> => {
    const url = `https://commons.wikimedia.org/w/api.php?origin=*&action=query&format=json&generator=categorymembers&gcmtitle=${encodeURIComponent(category)}&gcmtype=file&gcmsort=timestamp&gcmdir=desc&prop=imageinfo&iiprop=url|extmetadata|dimensions&iiurlwidth=600&gcmstart=2023-01-01T00:00:00Z&gcmlimit=${limit}`;
    
    try {
        const res = await safeFetch(url);
        const data = await res.json();
        if(!data.query || !data.query.pages) return [];
        
        return Object.values(data.query.pages).map((page: any) => {
            const info = page.imageinfo?.[0];
            const meta = info?.extmetadata;
            
            if (!info?.url || !info.url.match(/\.(webm|ogv|mp4)$/i)) return null;

            return {
                id: `wiki-${page.pageid}`,
                title: (meta?.ObjectName?.value || page.title.replace(/^File:|(\.webm|\.ogv|\.mp4)$/g, '')).replace(/_/g, ' '),
                description: meta?.ImageDescription?.value?.replace(/<[^>]*>/g, '').slice(0, 200) || 'Featured video from Wikimedia Commons.',
                thumbnailUrl: info.thumburl || 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?q=80&w=500&auto=format&fit=crop',
                backdropUrl: info.thumburl || 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?q=80&w=1600&auto=format&fit=crop',
                genre: labelGenre,
                rating: 'G',
                matchScore: 92,
                year: meta?.DateTimeOriginal?.value ? new Date(meta.DateTimeOriginal.value).getFullYear() : 2023,
                duration: 'Clip',
                videoUrl: info.url,
                contentType: 'movie'
            };
        }).filter(Boolean) as Movie[];
    } catch (e) {
        console.warn("Wikimedia fetch error", e);
        return [];
    }
};

// ------------------------------------------------------------------
// API 3: NASA Image and Video Library
// ------------------------------------------------------------------

const fetchFromNASA = async (query: string, limit: number = 10): Promise<Movie[]> => {
    const url = `https://images-api.nasa.gov/search?q=${encodeURIComponent(query)}&media_type=video&page_size=${limit}`;

    try {
        const res = await safeFetch(url);
        const data = await res.json();
        const items = data.collection?.items || [];

        const movies = await Promise.all(items.map(async (item: any) => {
            const datum = item.data?.[0];
            const link = item.links?.[0]; // Thumbnail
            
            if (!datum || !link) return null;

            const nasaId = datum.nasa_id;
            const mp4Url = `https://images-assets.nasa.gov/video/${nasaId}/${nasaId}~orig.mp4`; 

            return {
                id: `nasa-${nasaId}`,
                title: datum.title,
                description: datum.description || "Official footage from NASA.",
                thumbnailUrl: link.href,
                backdropUrl: link.href,
                genre: ['Documentary', 'Space', 'Science'],
                rating: 'G',
                matchScore: 99,
                year: new Date(datum.date_created).getFullYear(),
                duration: 'Clip',
                videoUrl: mp4Url, 
                contentType: 'movie'
            } as Movie;
        }));

        return movies.filter((m): m is Movie => m !== null);
    } catch (e) {
        console.warn("NASA API fetch error", e);
        return [];
    }
};

// ------------------------------------------------------------------
// API 4: iTunes Search API (Modern Movies & TV)
// ------------------------------------------------------------------

const fetchFromITunes = async (term: string, media: 'movie' | 'tvShow', limit: number = 20): Promise<Movie[]> => {
    // iTunes API is open and allows CORS
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&media=${media}&limit=${limit}&explicit=no&country=US`;

    try {
        const res = await safeFetch(url);
        const data = await res.json();
        
        return (data.results || []).map((item: any) => {
             // iTunes images are 100x100. Replace to get higher res (600x600)
             const highResImage = item.artworkUrl100?.replace('100x100bb', '600x600bb') || item.artworkUrl100;
             
             return {
                 id: `itunes-${item.trackId}`,
                 title: item.trackName,
                 description: item.longDescription || item.shortDescription || item.collectionName || "No description available.",
                 thumbnailUrl: highResImage,
                 backdropUrl: highResImage, // Will be cropped by CSS object-cover
                 genre: [item.primaryGenreName],
                 rating: item.contentAdvisoryRating || 'PG-13',
                 matchScore: 85 + Math.floor(Math.random() * 15),
                 year: new Date(item.releaseDate).getFullYear(),
                 duration: 'Preview',
                 videoUrl: item.previewUrl,
                 contentType: media === 'movie' ? 'movie' : 'series',
                 numberOfSeasons: 1, 
                 currentSeason: 1
             } as Movie;
        }).filter((m: Movie) => m.videoUrl); // Only return items with playable previews
    } catch (e) {
        console.warn(`iTunes fetch failed for ${term}`, e);
        return [];
    }
};


// ------------------------------------------------------------------
// Main Fetch Function
// ------------------------------------------------------------------

export const fetchContent = async (): Promise<{ movies: Movie[], series: Movie[], error?: string }> => {
  try {
    // PARALLEL FETCHING
    const [
        featFilms, 
        sciFiHorror, 
        westerns, 
        noir, 
        cartoons, 
        nasaContent, 
        natureWiki,
        tvComedy,
        tvMystery,
        tvSciFi,
        superheroes,
        // New Modern Content
        modernMovies,
        modernAction,
        modernTV,
        modernAnime
    ] = await Promise.all([
        // Archive.org Sections
        fetchFromArchiveOrg('collection:(feature_films) AND mediatype:(movies) AND downloads:[20000 TO 10000000]', 20),
        fetchFromArchiveOrg('collection:(feature_films) AND mediatype:(movies) AND (subject:(sci-fi) OR subject:(horror))', 20),
        fetchFromArchiveOrg('collection:(feature_films) AND mediatype:(movies) AND subject:(western)', 15),
        fetchFromArchiveOrg('collection:(feature_films) AND mediatype:(movies) AND subject:(film_noir)', 15),
        fetchFromArchiveOrg('collection:(animation_and_cartoons) AND mediatype:(movies)', 25),
        
        // NASA API
        fetchFromNASA('space exploration', 15),

        // Wikimedia
        fetchFromWikimedia('Category:Videos_of_wildlife', ['Documentary', 'Nature'], 10),

        // Archive.org TV
        fetchFromArchiveOrg('collection:(classic_tv) AND mediatype:(movies) AND (subject:(comedy) OR subject:(sitcom))', 20),
        fetchFromArchiveOrg('collection:(classic_tv) AND mediatype:(movies) AND (subject:(mystery) OR subject:(crime) OR subject:(detective))', 20),
        fetchFromArchiveOrg('collection:(classic_tv) AND mediatype:(movies) AND (subject:(sci-fi) OR subject:(science fiction))', 20),
        fetchFromArchiveOrg('subject:(superhero) AND mediatype:(movies)', 10),

        // iTunes Modern Content
        fetchFromITunes('movie 2024', 'movie', 15),
        fetchFromITunes('action thriller', 'movie', 15),
        fetchFromITunes('tv series', 'tvShow', 15),
        fetchFromITunes('anime', 'tvShow', 15)
    ]);

    // -- Process Movies --
    let movies: Movie[] = [
        ...modernMovies, // Put modern first
        ...modernAction,
        ...featFilms.map(i => mapArchiveToMovie(i, 'movie', ['Classic', 'Drama'])),
        ...sciFiHorror.map(i => mapArchiveToMovie(i, 'movie', ['Sci-Fi', 'Horror'])),
        ...westerns.map(i => mapArchiveToMovie(i, 'movie', ['Western', 'Action'])),
        ...noir.map(i => mapArchiveToMovie(i, 'movie', ['Noir', 'Crime'])),
        ...nasaContent, 
        ...natureWiki,  
        ...superheroes.map(i => mapArchiveToMovie(i, 'movie', ['Action', 'Superhero']))
    ];

    // -- Process Series --
    let series: Movie[] = [
        ...modernTV,
        ...modernAnime.map(m => ({...m, genre: ['Anime', 'Animation']})),
        ...cartoons.map(i => mapArchiveToMovie(i, 'series', ['Animation', 'Family', 'Classic'])),
        ...tvComedy.map(i => mapArchiveToMovie(i, 'series', ['Comedy', 'Sitcom', 'Classic TV'])),
        ...tvMystery.map(i => mapArchiveToMovie(i, 'series', ['Mystery', 'Crime', 'Classic TV'])),
        ...tvSciFi.map(i => mapArchiveToMovie(i, 'series', ['Sci-Fi', 'Classic TV']))
    ];

    // --- FALLBACK MECHANISM ---
    if (movies.length === 0 && series.length === 0) {
        console.error("All external APIs failed. Loading emergency fallback content.");
        movies = FALLBACK_CONTENT.filter(m => m.contentType === 'movie');
        series = FALLBACK_CONTENT.filter(m => m.contentType === 'series');
        return { movies, series, error: "Network issues detected. Showing offline library." };
    }

    // Deduplicate by ID
    const uniqueMovies = Array.from(new Map(movies.map(m => [m.id, m])).values());
    const uniqueSeries = Array.from(new Map(series.map(s => [s.id, s])).values());

    // Shuffle
    const shuffledMovies = uniqueMovies.sort(() => Math.random() - 0.5);

    // Set Featured Movie (Prefer Modern or Space)
    const heroCandidates = uniqueMovies.filter(m => 
        (m.year > 2020 || m.genre.includes('Space') || m.genre.includes('Sci-Fi')) && 
        !m.id.startsWith('itunes') // iTunes posters don't look great as hero backdrops usually
    );
    
    // If we have a good landscape hero, use it. Otherwise fallback to random.
    if (heroCandidates.length > 0) {
        heroCandidates[0].featured = true;
    } else if (shuffledMovies.length > 0) {
        shuffledMovies[0].featured = true;
    }

    return { movies: shuffledMovies, series: uniqueSeries };

  } catch (error) {
    console.error("Critical error fetching content:", error);
    return { 
        movies: FALLBACK_CONTENT.filter(m => m.contentType === 'movie'), 
        series: FALLBACK_CONTENT.filter(m => m.contentType === 'series'),
        error: "Failed to load dynamic content." 
    };
  }
};
