import React, { useState, useEffect } from 'react';
import { VeoConfig, GeneratedAsset } from '../types';
import { generateVeoVideo } from '../services/geminiService';
import { Loader } from './ui/Loader';
import { Key, Play, AlertCircle, Film, Sparkles, MonitorPlay } from 'lucide-react';

interface VideoStudioProps {
  onAssetCreated: (asset: GeneratedAsset) => void;
}

const GENRES = ['Sci-Fi', 'Fantasy', 'Action', 'Horror', 'Documentary', 'Cyberpunk', 'Noir', 'Animation'];
const THEMES = ['Dystopian', 'Uplifting', 'Dark', 'Retro', 'Futuristic', 'Surreal', 'Realistic'];

const VideoStudio: React.FC<VideoStudioProps> = ({ onAssetCreated }) => {
  const [apiKeyReady, setApiKeyReady] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Prompt Construction State
  const [genre, setGenre] = useState(GENRES[0]);
  const [theme, setTheme] = useState(THEMES[0]);
  const [customDetails, setCustomDetails] = useState('');
  
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<VeoConfig>({
    aspectRatio: '16:9',
    resolution: '720p'
  });

  const checkKey = async () => {
    if (window.aistudio && window.aistudio.hasSelectedApiKey) {
      const hasKey = await window.aistudio.hasSelectedApiKey();
      setApiKeyReady(hasKey);
    } else {
       if (process.env.API_KEY) {
         setApiKeyReady(true);
       }
    }
  };

  useEffect(() => {
    checkKey();
  }, []);

  const handleConnect = async () => {
    if (window.aistudio) {
      try {
        await window.aistudio.openSelectKey();
        setApiKeyReady(true);
      } catch (e) {
        console.error(e);
        setError("Failed to select API key.");
      }
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    
    // Construct the prompt
    const fullPrompt = `A high quality ${theme} ${genre} movie scene. ${customDetails}`;
    
    try {
      const url = await generateVeoVideo(fullPrompt, config);
      onAssetCreated({
        id: Date.now().toString(),
        type: 'video',
        url,
        prompt: fullPrompt,
        createdAt: Date.now(),
        metadata: { ...config, genre, theme }
      });
      setCustomDetails(''); 
    } catch (err: any) {
      console.error(err);
      if (err.message && err.message.includes("Requested entity was not found")) {
         setError("API Key validation failed. Please reconnect your project.");
         setApiKeyReady(false);
      } else {
         setError(err.message || "Failed to generate video.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!apiKeyReady) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center space-y-6 max-w-lg mx-auto">
        <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500">
          <Key size={32} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Connect Google Cloud</h2>
          <p className="text-zinc-400">
            To use the Veo video generation model, you need to connect a paid Google Cloud Project with the Gemini API enabled.
          </p>
        </div>
        <button
          onClick={handleConnect}
          className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
        >
          Select Project API Key
        </button>
        <div className="text-xs text-zinc-500">
          <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="underline hover:text-emerald-400">
            Learn more about billing
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pb-20 max-w-5xl mx-auto py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Col: Controls */}
        <div className="lg:col-span-2 space-y-6">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-300 flex items-center gap-2"><Film size={16}/> Genre</label>
                        <select 
                            value={genre}
                            onChange={(e) => setGenre(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none appearance-none"
                        >
                            {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-300 flex items-center gap-2"><Sparkles size={16}/> Theme</label>
                        <select 
                            value={theme}
                            onChange={(e) => setTheme(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none appearance-none"
                        >
                            {THEMES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-300">Plot Details & Visual Style</label>
                    <textarea
                        value={customDetails}
                        onChange={(e) => setCustomDetails(e.target.value)}
                        placeholder="Describe specific characters, setting, or action (e.g., A detective walking through rain-slicked streets of 1940s Chicago)..."
                        className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-4 text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none min-h-[150px] resize-none"
                        disabled={loading}
                    />
                </div>
            </div>
        </div>

        {/* Right Col: Config & Action */}
        <div className="space-y-6">
             <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-6">
                <h3 className="font-bold text-white flex items-center gap-2"><MonitorPlay size={18} /> Format Settings</h3>
                
                <div className="space-y-3">
                    <label className="text-xs uppercase font-bold text-zinc-500">Aspect Ratio</label>
                    <div className="grid grid-cols-2 gap-2">
                    {(['16:9', '9:16'] as const).map((ratio) => (
                        <button
                        key={ratio}
                        onClick={() => setConfig({ ...config, aspectRatio: ratio })}
                        className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
                            config.aspectRatio === ratio
                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                            : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                        }`}
                        >
                        {ratio}
                        </button>
                    ))}
                    </div>
                </div>

                <div className="space-y-3">
                    <label className="text-xs uppercase font-bold text-zinc-500">Resolution</label>
                    <div className="grid grid-cols-2 gap-2">
                    {(['720p', '1080p'] as const).map((res) => (
                        <button
                        key={res}
                        onClick={() => setConfig({ ...config, resolution: res })}
                        className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
                            config.resolution === res
                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                            : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                        }`}
                        >
                        {res}
                        </button>
                    ))}
                    </div>
                </div>

                <div className="pt-4 border-t border-zinc-800">
                    <button
                        onClick={handleGenerate}
                        disabled={loading}
                        className={`w-full py-4 rounded-lg font-bold text-lg flex items-center justify-center gap-2 transition-all ${
                        loading
                            ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-900/20'
                        }`}
                    >
                        {loading ? (
                        <span className="flex items-center gap-2">Producing...</span>
                        ) : (
                        <>
                            <Play size={20} fill="currentColor" /> Create Original
                        </>
                        )}
                    </button>
                </div>

                {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2 text-red-400 text-xs">
                        <AlertCircle size={14} className="mt-0.5 shrink-0" />
                        <p>{error}</p>
                    </div>
                )}
             </div>
             
             <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                 <p className="text-xs text-zinc-500 leading-relaxed">
                     <strong className="text-zinc-300">Note:</strong> Veo generation can take 1-2 minutes. Your generated content will appear in your "Library" tab.
                 </p>
             </div>
        </div>

      </div>

      {loading && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center">
            <Loader text="Directing your scene with Veo..." />
        </div>
      )}
    </div>
  );
};

export default VideoStudio;