
export type Category = string;

export interface Episode {
  title: string;
  description: string;
  duration: string;
  id?: string;
  seasonNumber?: number;
  episodeNumber?: number;
  videoUrl?: string;
  thumbnailUrl?: string;
}

export interface Movie {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string; // Portrait or landscape small
  backdropUrl: string; // Large landscape
  genre: Category[];
  rating: string; // e.g. PG-13, TV-MA
  matchScore: number; // e.g. 98% match
  year: number;
  duration: string;
  videoUrl: string;
  featured?: boolean;
  contentType: 'movie' | 'series';
  
  // TV Series specific fields
  numberOfSeasons?: number;
  currentSeason?: number;
  episodes?: Episode[];
  seriesId?: string;
}

export enum AppView {
  HOME = 'HOME',
  MOVIES = 'MOVIES',
  SERIES = 'SERIES',
  SEARCH = 'SEARCH',
  MY_LIST = 'MY_LIST',
  STUDIO = 'STUDIO'
}

export interface UserProfile {
  username: string;
  avatarUrl: string;
}

export interface VeoConfig {
  aspectRatio: '16:9' | '9:16';
  resolution: '720p' | '1080p';
}

export interface ImageConfig {
  aspectRatio: '1:1' | '16:9' | '4:3' | '3:4';
  style: string;
}

export interface GeneratedAsset {
  id: string;
  type: 'video' | 'image';
  url: string;
  prompt: string;
  createdAt: number;
  metadata?: {
    resolution?: string;
    aspectRatio?: string;
    [key: string]: any;
  };
}

declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
}
