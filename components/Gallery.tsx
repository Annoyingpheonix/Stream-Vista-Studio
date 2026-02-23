import React from 'react';
import { GeneratedAsset } from '../types';
import { Play, Download, Trash2, Image as ImageIcon } from 'lucide-react';

interface GalleryProps {
  assets: GeneratedAsset[];
  onDelete: (id: string) => void;
}

const Gallery: React.FC<GalleryProps> = ({ assets, onDelete }) => {
  if (assets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-zinc-500">
        <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mb-4">
          <ImageIcon className="w-8 h-8 opacity-50" />
        </div>
        <p className="text-lg font-medium">No creations yet</p>
        <p className="text-sm">Head to the studio to start creating.</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto w-full">
      <h2 className="text-3xl font-bold text-white mb-8">Your Library</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {assets.map((asset) => (
          <div key={asset.id} className="group relative bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-700 transition-all flex flex-col">
            <div className="aspect-video relative bg-black flex items-center justify-center overflow-hidden">
              {asset.type === 'video' ? (
                <video
                  src={asset.url}
                  controls
                  className="w-full h-full object-contain"
                  poster="https://picsum.photos/800/450?grayscale" // Placeholder poster
                />
              ) : (
                <img
                  src={asset.url}
                  alt={asset.prompt}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-500"
                />
              )}
              
              <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                 <a
                  href={asset.url}
                  download={`streamvista-${asset.id}.${asset.type === 'video' ? 'mp4' : 'png'}`}
                  className="p-2 bg-black/60 backdrop-blur text-white rounded-lg hover:bg-black/80 transition-colors"
                  title="Download"
                >
                  <Download size={16} />
                </a>
                <button
                  onClick={() => onDelete(asset.id)}
                  className="p-2 bg-red-500/80 backdrop-blur text-white rounded-lg hover:bg-red-600 transition-colors"
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            
            <div className="p-4 flex flex-col flex-grow justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${asset.type === 'video' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-teal-500/20 text-teal-400'}`}>
                    {asset.type}
                  </span>
                  <span className="text-xs text-zinc-500">
                    {new Date(asset.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-zinc-300 line-clamp-2" title={asset.prompt}>
                  {asset.prompt}
                </p>
              </div>
              
              {asset.metadata && (
                <div className="mt-4 pt-3 border-t border-zinc-800 flex gap-4 text-xs text-zinc-500">
                  {asset.metadata.resolution && (
                    <span>{asset.metadata.resolution}</span>
                  )}
                  {asset.metadata.aspectRatio && (
                    <span>{asset.metadata.aspectRatio}</span>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Gallery;