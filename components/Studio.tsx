import React, { useState } from 'react';
import { GeneratedAsset } from '../types';
import VideoStudio from './VideoStudio';
import ImageStudio from './ImageStudio';
import Gallery from './Gallery';
import { Clapperboard, Image as ImageIcon, Grid, Layers } from 'lucide-react';

interface StudioProps {
  onAssetCreated: (asset: GeneratedAsset) => void;
  assets: GeneratedAsset[];
  onDeleteAsset: (id: string) => void;
}

type StudioTab = 'video' | 'image' | 'gallery';

const Studio: React.FC<StudioProps> = ({ onAssetCreated, assets, onDeleteAsset }) => {
  const [activeTab, setActiveTab] = useState<StudioTab>('video');

  const tabs = [
    { id: 'video', label: 'Video FX', icon: Clapperboard },
    { id: 'image', label: 'Image Gen', icon: ImageIcon },
    { id: 'gallery', label: 'Library', icon: Grid },
  ] as const;

  return (
    <div className="min-h-screen pt-20 pb-20 bg-zinc-950">
      {/* Studio Header & Nav */}
      <div className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between py-4 gap-4">
            <div className="flex items-center gap-2 text-white">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-900/20">
                <Layers className="text-white" size={20} />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">Creative Studio</h1>
                <p className="text-xs text-zinc-400">Powered by Gemini & Veo</p>
              </div>
            </div>

            <div className="flex bg-black/40 p-1 rounded-xl border border-zinc-800">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
                    activeTab === tab.id
                      ? 'bg-zinc-800 text-white shadow-sm'
                      : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
                  }`}
                >
                  <tab.icon size={16} />
                  {tab.label}
                  {tab.id === 'gallery' && assets.length > 0 && (
                    <span className="ml-1 text-[10px] bg-emerald-600 text-white px-1.5 py-0.5 rounded-full">
                      {assets.length}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        {activeTab === 'video' && (
          <div className="max-w-7xl mx-auto">
            <VideoStudio onAssetCreated={(asset) => {
              onAssetCreated(asset);
              // Optional: Switch to gallery or show toast
            }} />
          </div>
        )}

        {activeTab === 'image' && (
          <div className="max-w-7xl mx-auto py-8">
            <ImageStudio onAssetCreated={(asset) => {
               onAssetCreated(asset);
            }} />
          </div>
        )}

        {activeTab === 'gallery' && (
          <Gallery assets={assets} onDelete={onDeleteAsset} />
        )}
      </div>
    </div>
  );
};

export default Studio;