import React, { useState, useRef, useEffect } from 'react';
import { Movie } from '../types';
import { ArrowLeft, SkipForward, Volume2, VolumeX, Play, RotateCcw } from 'lucide-react';

interface VideoPlayerProps {
  movie: Movie;
  onClose: () => void;
  onComplete?: () => void;
  nextMovie?: Movie | null;
  onPlayNext?: (movie: Movie) => void;
}

const AD_SOURCE = 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4';
const SKIP_DELAY_SEC = 5;

const VideoPlayer: React.FC<VideoPlayerProps> = ({ movie, onClose, onComplete, nextMovie, onPlayNext }) => {
  // Logic: AI Originals (user generated) don't have ads. Others do.
  const isPremiumContent = movie.genre.includes('AI Original');
  const [showAd, setShowAd] = useState(!isPremiumContent);
  const [adCountdown, setAdCountdown] = useState(SKIP_DELAY_SEC);
  const [canSkip, setCanSkip] = useState(false);
  const [adEnded, setAdEnded] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showNextOverlay, setShowNextOverlay] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);

  // Check if content is an embed (YouTube, Vimeo, or Archive.org)
  const isEmbed = 
    movie.videoUrl.includes('youtube.com') || 
    movie.videoUrl.includes('youtu.be') || 
    movie.videoUrl.includes('vimeo') || 
    movie.videoUrl.includes('embed') ||
    movie.videoUrl.includes('archive.org');

  // Ad Timer Logic
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (showAd && !adEnded) {
      timer = setInterval(() => {
        setAdCountdown((prev) => {
          if (prev <= 1) {
            setCanSkip(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [showAd, adEnded]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      
      // Only handle playback shortcuts if we have a direct video ref (not iframe)
      if (videoRef.current) {
        if (e.key === ' ') {
            e.preventDefault();
            if (videoRef.current.paused) videoRef.current.play();
            else videoRef.current.pause();
        }
        if (e.key === 'm') {
            videoRef.current.muted = !videoRef.current.muted;
            setIsMuted(videoRef.current.muted);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleSkipAd = () => {
    setShowAd(false);
    setAdEnded(true);
    // If it's a regular video, play it. If iframe, it will mount and autoplay via URL param (if supported).
    if (!isEmbed && videoRef.current) {
      videoRef.current.src = movie.videoUrl;
      videoRef.current.load();
      videoRef.current.play().catch(e => console.log("Autoplay blocked", e));
    }
  };

  const handleVideoEnded = () => {
    if (showAd) {
      handleSkipAd();
    } else {
      setShowNextOverlay(true);
      if (onComplete) onComplete();
    }
  };

  const handleReplay = () => {
    setShowNextOverlay(false);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play();
    }
  };

  // Toggle Mute
  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

  // Construct safe embed URL
  const getEmbedUrl = (url: string) => {
      // Archive.org embeds usually auto-play if configured, but strict autoplay often blocked by browsers for iframes
      if (url.includes('archive.org')) return `${url}?autoplay=1`;
      if (url.includes('?')) return `${url}&autoplay=1`;
      return `${url}?autoplay=1`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col justify-center items-center overflow-hidden font-sans">
      {/* Top Bar */}
      <div className="absolute top-0 left-0 w-full p-6 z-20 flex justify-between items-start bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
         <div className="pointer-events-auto flex items-center gap-4">
             <button
                onClick={onClose}
                className="text-white/80 hover:text-white transition-colors hover:bg-white/10 p-2 rounded-full"
            >
                <ArrowLeft size={28} />
            </button>
            <div className="text-shadow-md">
                <h2 className="text-white font-bold text-lg drop-shadow-md">
                    {showAd ? 'Advertisement' : movie.title}
                </h2>
                {!showAd && <p className="text-zinc-300 text-xs">{movie.rating} • {movie.year}</p>}
            </div>
         </div>
      </div>

      {/* Video Content */}
      <div className="relative w-full h-full bg-black flex items-center justify-center">
        
        {/* Case 1: Ad is playing (Always use local video) */}
        {showAd && (
             <video
                ref={videoRef}
                src={AD_SOURCE}
                className="w-full h-full object-contain"
                autoPlay
                playsInline
                disablePictureInPicture
                onEnded={handleVideoEnded}
                controls={false}
                style={{ maxHeight: '100vh', maxWidth: '100vw' }}
            />
        )}

        {/* Case 2: Content is Embed (Iframe) - Only show after ad */}
        {!showAd && isEmbed && (
            <iframe
                src={getEmbedUrl(movie.videoUrl)}
                title={movie.title}
                className="w-full h-full border-none"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                style={{ backgroundColor: '#000' }}
            />
        )}

        {/* Case 3: Content is Direct Video - Only show after ad */}
        {!showAd && !isEmbed && (
            <video
                ref={videoRef}
                src={movie.videoUrl}
                className="w-full h-full object-contain"
                autoPlay
                playsInline
                controls={!showNextOverlay}
                onEnded={handleVideoEnded}
                controlsList="nodownload"
                style={{ maxHeight: '100vh', maxWidth: '100vw' }}
            />
        )}
        
        {/* Ad Overlay UI */}
        {showAd && (
            <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-8 z-10">
                <div className="flex justify-end">
                    <div className="bg-black/40 backdrop-blur px-3 py-1 rounded text-xs text-white/70 font-medium uppercase tracking-wider border border-white/10">
                        Ad · {adCountdown > 0 ? `0:0${adCountdown}` : 'Video will play after ad'}
                    </div>
                </div>
                
                <div className="flex justify-between items-end pointer-events-auto">
                    <div className="text-white/50 text-xs">
                        <a href="#" className="hover:text-white underline">Why am I seeing this?</a>
                    </div>
                    
                    <div className="flex gap-4 items-center">
                        <button onClick={toggleMute} className="p-3 bg-black/40 hover:bg-black/60 rounded-full text-white backdrop-blur border border-white/10 transition-colors">
                            {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                        </button>
                        
                        {canSkip ? (
                             <button 
                                onClick={handleSkipAd}
                                className="group flex items-center gap-2 px-6 py-3 bg-white text-black font-bold rounded hover:bg-zinc-200 transition-all shadow-lg shadow-black/50"
                             >
                                Skip <SkipForward size={20} className="group-hover:translate-x-0.5 transition-transform"/>
                             </button>
                        ) : (
                            <div className="px-6 py-3 bg-black/60 text-zinc-400 font-medium rounded backdrop-blur border border-white/10">
                                Skip in {adCountdown}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}

        {/* Up Next / Replay Overlay (Only for native videos that trigger onEnded) */}
        {showNextOverlay && (
            <div className="absolute inset-0 z-30 bg-black/80 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-500">
                <div className="max-w-4xl w-full p-8 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                    <div className="space-y-6 text-center md:text-left">
                        <div>
                             <h3 className="text-zinc-400 text-sm font-medium uppercase tracking-widest mb-2">Just Watched</h3>
                             <h1 className="text-3xl font-bold text-white mb-2">{movie.title}</h1>
                             <p className="text-zinc-500 text-sm line-clamp-3">{movie.description}</p>
                        </div>
                        <button 
                            onClick={handleReplay}
                            className="inline-flex items-center gap-2 text-white hover:text-emerald-400 transition-colors font-medium"
                        >
                            <RotateCcw size={20} /> Replay Video
                        </button>
                    </div>

                    {nextMovie && onPlayNext ? (
                         <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl hover:scale-105 transition-transform duration-300 cursor-pointer group" onClick={() => onPlayNext(nextMovie)}>
                             <div className="aspect-video relative">
                                 <img src={nextMovie.backdropUrl} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                                 <div className="absolute inset-0 flex items-center justify-center">
                                     <div className="w-16 h-16 bg-emerald-600 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                         <Play fill="white" className="ml-1 text-white" />
                                     </div>
                                 </div>
                                 <div className="absolute top-4 left-4 bg-black/60 px-2 py-1 rounded text-xs text-white font-bold backdrop-blur">
                                     UP NEXT
                                 </div>
                             </div>
                             <div className="p-4 bg-zinc-900">
                                 <h4 className="font-bold text-white truncate">{nextMovie.title}</h4>
                                 <p className="text-xs text-zinc-500 mt-1">{nextMovie.duration} • {nextMovie.genre[0]}</p>
                             </div>
                         </div>
                    ) : (
                         <div className="flex items-center justify-center">
                             <button onClick={onClose} className="px-8 py-3 bg-white text-black font-bold rounded hover:bg-zinc-200 transition-colors">
                                 Back to Browse
                             </button>
                         </div>
                    )}
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default VideoPlayer;