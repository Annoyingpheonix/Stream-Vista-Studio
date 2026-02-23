
import React, { useRef } from 'react';
import { Movie } from '../types';
import { ChevronLeft, ChevronRight, Play, Plus, Check } from 'lucide-react';

interface MovieRowProps {
  title: string;
  movies: Movie[];
  myList: string[];
  onMovieClick: (movie: Movie) => void;
  onToggleMyList: (movie: Movie) => void;
  orientation?: 'landscape' | 'portrait';
}

const MovieRow: React.FC<MovieRowProps> = ({ 
  title, 
  movies, 
  myList, 
  onMovieClick, 
  onToggleMyList,
  orientation = 'landscape' 
}) => {
  const rowRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (rowRef.current) {
      const { scrollLeft, clientWidth } = rowRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - clientWidth : scrollLeft + clientWidth;
      rowRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  // Dimensions based on orientation
  const cardClass = orientation === 'portrait' 
    ? 'w-[160px] md:w-[200px] aspect-[2/3]' 
    : 'w-[200px] md:w-[280px] aspect-video';

  return (
    <div className="py-4 md:py-8 space-y-3 relative group/row">
      <h2 className="text-xl md:text-2xl font-bold text-white px-4 md:px-16 hover:text-emerald-400 transition-colors cursor-pointer inline-flex items-center gap-2">
        {title} <span className="text-xs text-emerald-400 opacity-0 group-hover/row:opacity-100 transition-opacity">Explore All</span>
      </h2>

      <div className="relative group">
        <button
          className="absolute left-0 top-0 bottom-0 z-40 bg-black/50 hover:bg-black/70 w-12 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white hover:text-emerald-400 rounded-r-xl"
          onClick={() => scroll('left')}
        >
          <ChevronLeft size={32} />
        </button>

        <div
          ref={rowRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide px-4 md:px-16 scroll-smooth pb-8"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {movies.map((movie) => {
            const isInList = myList.includes(movie.id);
            return (
              <div
                key={movie.id}
                className={`flex-none ${cardClass} relative group/card cursor-pointer transition-all duration-300 hover:z-50 hover:scale-105`}
                onClick={() => onMovieClick(movie)}
              >
                <img
                  src={orientation === 'portrait' ? movie.thumbnailUrl : movie.backdropUrl}
                  alt={movie.title}
                  className="w-full h-full object-cover rounded-md shadow-lg"
                  loading="lazy"
                />
                
                {/* Hover Card */}
                <div className="absolute inset-0 bg-black/80 opacity-0 group-hover/card:opacity-100 transition-opacity flex flex-col justify-center items-center rounded-md p-4 text-center backdrop-blur-sm border border-zinc-800">
                  <h3 className="font-bold text-white text-sm mb-2 line-clamp-2">{movie.title}</h3>
                  <div className="flex gap-3 mb-2">
                      <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center hover:bg-emerald-50 transition-colors shadow-lg shadow-white/20">
                          <Play size={16} fill="black" className="text-black ml-0.5" />
                      </div>
                      <div 
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleMyList(movie);
                        }}
                        className={`w-8 h-8 rounded-full border flex items-center justify-center transition-colors hover:bg-zinc-800 ${isInList ? 'border-emerald-400 text-emerald-400' : 'border-zinc-400 hover:border-white text-white'}`}
                      >
                          {isInList ? <Check size={16} /> : <Plus size={16} />}
                      </div>
                  </div>
                  <div className="text-xs text-emerald-400 font-bold mb-1">{movie.matchScore}% Match</div>
                  <div className="text-[10px] text-zinc-400 mb-1">{movie.year}</div>
                  <div className="flex flex-wrap justify-center gap-1 mt-1">
                      {movie.genre.slice(0, 1).map(g => (
                          <span key={g} className="text-[10px] text-zinc-300 border border-zinc-700 px-1 rounded">{g}</span>
                      ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <button
          className="absolute right-0 top-0 bottom-0 z-40 bg-black/50 hover:bg-black/70 w-12 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white hover:text-emerald-400 rounded-l-xl"
          onClick={() => scroll('right')}
        >
          <ChevronRight size={32} />
        </button>
      </div>
    </div>
  );
};

export default MovieRow;
