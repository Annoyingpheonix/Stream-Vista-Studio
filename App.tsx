
import React, { useState, useEffect } from 'react';
import { AppView, Movie, GeneratedAsset, UserProfile } from './types';
import { fetchContent } from './services/contentService';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import MovieRow from './components/MovieRow';
import VideoPlayer from './components/VideoPlayer';
import Studio from './components/Studio';
import { Loader } from './components/ui/Loader';
import { ErrorBanner } from './components/ui/ErrorBanner';
import { Search, Plus, Play, Check, Film } from 'lucide-react';

const App = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.HOME);
  const [playingMovie, setPlayingMovie] = useState<Movie | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [myList, setMyList] = useState<string[]>([]);
  
  // Watch History (Video IDs)
  const [watchHistory, setWatchHistory] = useState<string[]>([]);

  // User Profile
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('streamvista_profile');
    return saved ? JSON.parse(saved) : {
        username: 'Guest User',
        avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop&crop=faces'
    };
  });

  // Content State
  const [allMovies, setAllMovies] = useState<Movie[]>([]);
  const [allSeries, setAllSeries] = useState<Movie[]>([]);
  const [featuredMovie, setFeaturedMovie] = useState<Movie | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // User Creations State
  const [generatedAssets, setGeneratedAssets] = useState<GeneratedAsset[]>([]);
  const [myCreations, setMyCreations] = useState<Movie[]>([]);

  // Load Content
  const loadContent = async () => {
    setIsLoading(true);
    setError(null);
    const { movies, series, error: fetchError } = await fetchContent();
    
    if (fetchError) {
      setError(fetchError);
    }

    setAllMovies(movies);
    setAllSeries(series);
    
    const combined = [...movies, ...series.slice(0, 5)];
    // Try to find a featured movie
    const potentialFeature = combined.find(m => m.featured) || combined.find(m => m.genre.includes('Space')) || combined[0];
    setFeaturedMovie(potentialFeature);
    
    setIsLoading(false);
  };

  useEffect(() => {
    loadContent();
  }, []);

  const handleUpdateProfile = (newProfile: UserProfile) => {
    setUserProfile(newProfile);
    localStorage.setItem('streamvista_profile', JSON.stringify(newProfile));
  };

  const allContent = [...allMovies, ...allSeries, ...myCreations];
  
  // Filtering Categories
  const newReleases = allContent.filter(m => m.year >= 2023).sort((a,b) => b.year - a.year);
  const trendingContent = allContent.sort((a,b) => b.matchScore - a.matchScore).slice(0, 15);
  
  const westernContent = allContent.filter(m => m.genre.includes('Western'));
  const noirContent = allContent.filter(m => m.genre.includes('Noir') || m.genre.includes('Crime'));
  const sciFiContent = allContent.filter(m => m.genre.includes('Sci-Fi') || m.genre.includes('Horror'));
  const documentaryContent = allContent.filter(m => m.genre.includes('Documentary') || m.genre.includes('Space') || m.genre.includes('Nature'));
  const superheroContent = allContent.filter(m => m.genre.includes('Superhero') || m.genre.includes('Action'));
  const dramaContent = allContent.filter(m => m.genre.includes('Drama') && !m.genre.includes('Noir'));

  // TV Series specific filters
  const animeContent = allSeries.filter(m => m.genre.includes('Anime'));
  const animationContent = allSeries.filter(m => m.genre.includes('Animation') && !m.genre.includes('Anime'));
  const comedySeries = allSeries.filter(m => m.genre.includes('Comedy'));
  const mysterySeries = allSeries.filter(m => m.genre.includes('Mystery'));

  // Resolve Watch History to Movie objects
  const continueWatchingContent = watchHistory
    .map(id => allContent.find(m => m.id === id))
    .filter((m): m is Movie => !!m)
    .reverse();

  const filteredMovies = allContent.filter(m => 
    m.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    m.genre.some(g => g.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const myListMovies = allContent.filter(m => myList.includes(m.id));

  const handlePlay = (movie: Movie) => {
    setPlayingMovie(movie);
    // Add to history immediately on click
    setWatchHistory(prev => {
       const newHistory = prev.filter(id => id !== movie.id); // remove if exists
       return [...newHistory, movie.id]; // add to end (most recent)
    });
  };

  const handleClosePlayer = () => {
    setPlayingMovie(null);
  };
  
  const getNextMovie = (current: Movie): Movie | null => {
     // Simple logic: get next in same genre or just random trending
     const similar = allContent.filter(m => m.id !== current.id && m.genre.some(g => current.genre.includes(g)));
     return similar.length > 0 ? similar[Math.floor(Math.random() * similar.length)] : null;
  };

  const handleToggleMyList = (movie: Movie) => {
    setMyList(prev => 
      prev.includes(movie.id) 
        ? prev.filter(id => id !== movie.id) 
        : [...prev, movie.id]
    );
  };

  const handleAssetCreated = (asset: GeneratedAsset) => {
      setGeneratedAssets(prev => [asset, ...prev]);

      if (asset.type === 'video') {
        const newMovie: Movie = {
            id: asset.id,
            title: 'AI Original: ' + (asset.metadata?.genre || 'Untitled'),
            description: asset.prompt,
            thumbnailUrl: 'https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?q=80&w=500&auto=format&fit=crop',
            backdropUrl: 'https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?q=80&w=1600&auto=format&fit=crop',
            genre: ['AI Original', asset.metadata?.genre as string || 'Sci-Fi'],
            rating: 'NR',
            matchScore: 100,
            year: new Date().getFullYear(),
            duration: 'Preview',
            videoUrl: asset.url,
            contentType: 'movie'
        };
        setMyCreations(prev => [newMovie, ...prev]);
      }
  };

  const handleDeleteAsset = (id: string) => {
    setGeneratedAssets(prev => prev.filter(a => a.id !== id));
    setMyCreations(prev => prev.filter(m => m.id !== id));
  };

  if (playingMovie) {
    return (
        <VideoPlayer 
            movie={playingMovie} 
            onClose={handleClosePlayer} 
            nextMovie={getNextMovie(playingMovie)}
            onPlayNext={handlePlay}
        />
    );
  }

  if (isLoading) {
      return (
          <div className="min-h-screen bg-black flex items-center justify-center">
              <Loader text="Accessing Global Archives..." />
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-black text-white pb-20">
      <Navbar 
        currentView={currentView} 
        onChangeView={setCurrentView} 
        userProfile={userProfile}
        onUpdateProfile={handleUpdateProfile}
      />

      {error && (
        <div className="fixed top-20 left-0 w-full z-30 px-4 md:px-16">
          <ErrorBanner message={error} onRetry={loadContent} />
        </div>
      )}

      {currentView === AppView.HOME && featuredMovie && (
        <>
          <Hero 
            movie={featuredMovie} 
            onPlay={handlePlay} 
            isInMyList={myList.includes(featuredMovie.id)}
            onToggleMyList={() => handleToggleMyList(featuredMovie)}
          />
          <div className="relative z-10 -mt-32 space-y-4">
             {continueWatchingContent.length > 0 && (
                 <MovieRow 
                    title="Continue Watching" 
                    movies={continueWatchingContent} 
                    myList={myList}
                    onMovieClick={handlePlay} 
                    onToggleMyList={handleToggleMyList}
                 />
             )}
             
             {/* New Releases - Portrait Mode */}
             {newReleases.length > 0 && (
                <MovieRow 
                title="New Releases" 
                movies={newReleases} 
                myList={myList}
                onMovieClick={handlePlay} 
                onToggleMyList={handleToggleMyList}
                orientation="portrait"
                />
             )}

             {myCreations.length > 0 && (
                 <MovieRow 
                    title="Your AI Originals" 
                    movies={myCreations} 
                    myList={myList}
                    onMovieClick={handlePlay} 
                    onToggleMyList={handleToggleMyList}
                 />
             )}
             
             <MovieRow 
               title="Trending Now" 
               movies={trendingContent} 
               myList={myList}
               onMovieClick={handlePlay} 
               onToggleMyList={handleToggleMyList}
             />
             
             {animeContent.length > 0 && (
                <MovieRow 
                title="Anime" 
                movies={animeContent} 
                myList={myList}
                onMovieClick={handlePlay} 
                onToggleMyList={handleToggleMyList}
                orientation="portrait"
                />
             )}
             
             {superheroContent.length > 0 && (
                <MovieRow 
                title="Superheroes & Action" 
                movies={superheroContent} 
                myList={myList}
                onMovieClick={handlePlay} 
                onToggleMyList={handleToggleMyList}
                />
             )}

             {documentaryContent.length > 0 && (
                <MovieRow 
                title="Space & Nature" 
                movies={documentaryContent} 
                myList={myList}
                onMovieClick={handlePlay} 
                onToggleMyList={handleToggleMyList}
                />
             )}

             {comedySeries.length > 0 && (
                <MovieRow 
                title="Comedy Series" 
                movies={comedySeries} 
                myList={myList}
                onMovieClick={handlePlay} 
                onToggleMyList={handleToggleMyList}
                />
             )}

             {animationContent.length > 0 && (
                <MovieRow 
                title="Animation & Cartoons" 
                movies={animationContent} 
                myList={myList}
                onMovieClick={handlePlay} 
                onToggleMyList={handleToggleMyList}
                />
             )}

             {westernContent.length > 0 && (
                <MovieRow 
                title="Classic Westerns" 
                movies={westernContent} 
                myList={myList}
                onMovieClick={handlePlay} 
                onToggleMyList={handleToggleMyList}
                />
             )}

             {mysterySeries.length > 0 && (
                <MovieRow 
                title="TV Mystery & Thrillers" 
                movies={mysterySeries} 
                myList={myList}
                onMovieClick={handlePlay} 
                onToggleMyList={handleToggleMyList}
                />
             )}

             {noirContent.length > 0 && (
                <MovieRow 
                title="Film Noir" 
                movies={noirContent} 
                myList={myList}
                onMovieClick={handlePlay} 
                onToggleMyList={handleToggleMyList}
                />
             )}
             
             {dramaContent.length > 0 && (
                <MovieRow 
                title="Golden Age Dramas" 
                movies={dramaContent} 
                myList={myList}
                onMovieClick={handlePlay} 
                onToggleMyList={handleToggleMyList}
                />
             )}
          </div>
        </>
      )}

      {currentView === AppView.STUDIO && (
          <Studio 
            onAssetCreated={handleAssetCreated} 
            assets={generatedAssets}
            onDeleteAsset={handleDeleteAsset}
          />
      )}

      {currentView === AppView.SEARCH && (
         <div className="pt-24 px-4 md:px-16 min-h-screen">
             <div className="relative mb-8 max-w-3xl mx-auto">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                 <input 
                    type="text" 
                    placeholder="Search titles, genres, people..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-zinc-800 border-none outline-none ring-0 text-white pl-12 pr-4 py-4 rounded-none border-b-2 border-zinc-700 focus:border-white transition-colors text-lg placeholder:text-zinc-500"
                    autoFocus
                 />
             </div>
             
             {searchQuery && (
                 <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
                    {filteredMovies.map(movie => {
                        const isInList = myList.includes(movie.id);
                        return (
                          <div key={movie.id} className="group cursor-pointer relative" onClick={() => handlePlay(movie)}>
                              <div className="aspect-[2/3] relative rounded-md overflow-hidden mb-2">
                                  <img src={movie.thumbnailUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                      <div className="bg-white/90 rounded-full p-3">
                                          <Play fill="black" className="text-black ml-0.5" size={20} />
                                      </div>
                                  </div>
                                  <button 
                                      onClick={(e) => {
                                          e.stopPropagation();
                                          handleToggleMyList(movie);
                                      }}
                                      className={`absolute top-2 right-2 p-1.5 rounded-full border bg-black/50 hover:bg-black/70 transition-colors opacity-0 group-hover:opacity-100 ${isInList ? 'border-emerald-500 text-emerald-500' : 'border-white text-white'}`}
                                  >
                                      {isInList ? <Check size={16} /> : <Plus size={16} />}
                                  </button>
                              </div>
                              <h3 className="font-bold text-zinc-200 group-hover:text-white truncate">{movie.title}</h3>
                              <p className="text-xs text-zinc-500 capitalize">{movie.contentType}</p>
                          </div>
                        );
                    })}
                    {filteredMovies.length === 0 && (
                        <div className="col-span-full text-center text-zinc-500 py-12">
                            No results found for "{searchQuery}"
                        </div>
                    )}
                 </div>
             )}
             
             {!searchQuery && (
                 <div className="flex flex-col items-center justify-center text-zinc-500 py-32 space-y-4">
                     <Film size={48} className="opacity-20" />
                     <p className="text-xl">Find your next story.</p>
                 </div>
             )}
         </div>
      )}

      {currentView === AppView.MOVIES && (
        <div className="pt-24 px-4 md:px-16">
           <h1 className="text-3xl font-bold mb-8 flex items-center gap-3">
               Movies <span className="text-sm font-normal text-zinc-500 mt-1">({allMovies.length})</span>
           </h1>
           <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                {allMovies.map(movie => (
                    <div key={movie.id} className="group cursor-pointer" onClick={() => handlePlay(movie)}>
                        <div className="aspect-[2/3] relative rounded-md overflow-hidden mb-2">
                            <img src={movie.thumbnailUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                             {/* Hover Overlay */}
                             <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors" />
                        </div>
                        <h3 className="font-medium text-zinc-300 group-hover:text-white truncate">{movie.title}</h3>
                        <div className="flex items-center gap-2 text-xs text-zinc-500">
                            <span>{movie.year}</span>
                            <span className="border border-zinc-700 px-1 rounded">{movie.rating}</span>
                        </div>
                    </div>
                ))}
           </div>
        </div>
      )}

      {currentView === AppView.SERIES && (
        <div className="pt-24 px-4 md:px-16">
           <h1 className="text-3xl font-bold mb-8 flex items-center gap-3">
               TV Shows & Cartoons <span className="text-sm font-normal text-zinc-500 mt-1">({allSeries.length})</span>
           </h1>
           <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                {allSeries.map(movie => (
                    <div key={movie.id} className="group cursor-pointer" onClick={() => handlePlay(movie)}>
                        <div className="aspect-[2/3] relative rounded-md overflow-hidden mb-2">
                            <img src={movie.thumbnailUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        </div>
                        <h3 className="font-medium text-zinc-300 group-hover:text-white truncate">{movie.title}</h3>
                        <div className="flex items-center gap-2 text-xs text-zinc-500">
                            <span>{movie.genre[0]}</span>
                            <span>•</span>
                            <span>{movie.matchScore}% Match</span>
                        </div>
                    </div>
                ))}
           </div>
        </div>
      )}
      
      {currentView === AppView.MY_LIST && (
         <div className="pt-24 px-4 md:px-16 min-h-screen">
             <h1 className="text-3xl font-bold mb-8">My List</h1>
             
             {myListMovies.length > 0 ? (
                 <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {myListMovies.map(movie => (
                        <div key={movie.id} className="group cursor-pointer relative" onClick={() => handlePlay(movie)}>
                            <div className="aspect-video relative rounded-md overflow-hidden mb-2">
                                <img src={movie.backdropUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <div className="bg-white/90 rounded-full p-3">
                                        <Play fill="black" className="text-black ml-0.5" size={20} />
                                    </div>
                                </div>
                                <button 
                                      onClick={(e) => {
                                          e.stopPropagation();
                                          handleToggleMyList(movie);
                                      }}
                                      className="absolute top-2 right-2 p-1.5 rounded-full border border-emerald-500 bg-black/50 text-emerald-500 hover:bg-red-500/20 hover:border-red-500 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                      title="Remove from list"
                                  >
                                      <Check size={16} />
                                  </button>
                            </div>
                            <h3 className="font-bold text-zinc-200 group-hover:text-white">{movie.title}</h3>
                            <p className="text-xs text-zinc-400">{movie.duration}</p>
                        </div>
                    ))}
                 </div>
             ) : (
                <div className="flex flex-col items-center justify-center mt-20 text-center">
                    <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mb-4">
                        <Plus className="text-zinc-500" size={32} />
                    </div>
                    <h2 className="text-xl font-bold text-zinc-300">Your list is empty</h2>
                    <p className="text-zinc-500 mt-2">Add shows and movies to keep track of what you want to watch.</p>
                </div>
             )}
         </div>
      )}

    </div>
  );
};

export default App;
