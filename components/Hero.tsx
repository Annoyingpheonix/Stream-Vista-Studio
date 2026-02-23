import React from 'react';
import { Movie } from '../types';
import { Play, Plus, Check } from 'lucide-react';

interface HeroProps {
  movie: Movie;
  onPlay: (movie: Movie) => void;
  isInMyList: boolean;
  onToggleMyList: () => void;
}

const Hero: React.FC<HeroProps> = ({ movie, onPlay, isInMyList, onToggleMyList }) => {
  return (
    <div className="relative h-[80vh] w-full">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={movie.backdropUrl}
          alt={movie.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/50 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
      </div>

      {/* Content */}
      <div className="relative h-full flex items-center px-8 md:px-16 pt-20">
        <div className="max-w-2xl space-y-6">
          <div className="flex items-center gap-3 text-sm font-medium text-zinc-300">
             <span className="text-emerald-400 font-bold">{movie.matchScore}% Match</span>
             <span>{movie.year}</span>
             <span className="border border-zinc-600 px-1 rounded text-xs">{movie.rating}</span>
             <span>{movie.duration}</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold text-white drop-shadow-lg leading-tight">
            {movie.title}
          </h1>
          
          <p className="text-lg text-zinc-200 line-clamp-3 drop-shadow-md">
            {movie.description}
          </p>

          <div className="flex items-center gap-4 pt-4">
            <button
              onClick={() => onPlay(movie)}
              className="flex items-center gap-2 bg-white text-black px-8 py-3 rounded hover:bg-emerald-50 transition-colors font-bold text-lg"
            >
              <Play fill="currentColor" size={24} /> Play
            </button>
            <button
              onClick={onToggleMyList}
              className="flex items-center gap-2 bg-zinc-800/80 text-white px-8 py-3 rounded hover:bg-zinc-700 transition-colors font-bold text-lg backdrop-blur-sm"
            >
              {isInMyList ? <Check size={24} className="text-emerald-400" /> : <Plus size={24} />}
              {isInMyList ? 'Saved' : 'My List'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;