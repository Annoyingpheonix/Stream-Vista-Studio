import React, { useState } from 'react';
import { ImageConfig, GeneratedAsset } from '../types';
import { generateProImage } from '../services/geminiService';
import { Loader } from './ui/Loader';
import { Image as ImageIcon, Wand2, AlertCircle } from 'lucide-react';

interface ImageStudioProps {
  onAssetCreated: (asset: GeneratedAsset) => void;
}

const ImageStudio: React.FC<ImageStudioProps> = ({ onAssetCreated }) => {
  const [loading, setLoading] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<ImageConfig>({
    aspectRatio: '1:1',
    style: 'photorealistic'
  });

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const url = await generateProImage(prompt, config);
      onAssetCreated({
        id: Date.now().toString(),
        type: 'image',
        url,
        prompt,
        createdAt: Date.now(),
        metadata: { aspectRatio: config.aspectRatio }
      });
      setPrompt('');
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to generate image.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col max-w-4xl mx-auto w-full p-6">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white flex items-center gap-3">
          <ImageIcon className="text-emerald-400" />
          Pro Image Studio
        </h2>
        <p className="text-zinc-400 mt-2">Create stunning 2K images with Gemini 3 Pro.</p>
      </div>

      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-300">Prompt</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="A cyberpunk street food vendor in Tokyo, neon lights, rain, highly detailed, 8k..."
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-4 text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none min-h-[120px] resize-none"
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-300">Aspect Ratio</label>
          <div className="grid grid-cols-4 gap-2">
            {(['1:1', '16:9', '4:3', '3:4'] as const).map((ratio) => (
              <button
                key={ratio}
                onClick={() => setConfig({ ...config, aspectRatio: ratio })}
                className={`px-3 py-3 rounded-lg text-sm font-medium border transition-all ${
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

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3 text-red-400 text-sm">
            <AlertCircle size={16} className="mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        <div className="pt-4">
          <button
            onClick={handleGenerate}
            disabled={loading || !prompt.trim()}
            className={`w-full py-4 rounded-lg font-bold text-lg flex items-center justify-center gap-2 transition-all ${
              loading || !prompt.trim()
                ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20'
            }`}
          >
            {loading ? (
              <span className="flex items-center gap-2">Painting Pixels...</span>
            ) : (
              <>
                <Wand2 size={20} /> Generate Image
              </>
            )}
          </button>
        </div>
      </div>

      {loading && <Loader text="Gemini 3 Pro is crafting your masterpiece..." />}
    </div>
  );
};

export default ImageStudio;