import React from 'react';
import { AlertCircle, RefreshCcw } from 'lucide-react';

interface ErrorBannerProps {
  message: string;
  onRetry?: () => void;
}

export const ErrorBanner: React.FC<ErrorBannerProps> = ({ message, onRetry }) => {
  return (
    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center justify-between max-w-2xl mx-auto my-4 animate-in fade-in slide-in-from-top-4">
      <div className="flex items-center gap-3">
        <AlertCircle className="text-red-400" size={24} />
        <div>
          <h4 className="font-bold text-red-400 text-sm">Connection Issue</h4>
          <p className="text-zinc-400 text-xs">{message}</p>
        </div>
      </div>
      {onRetry && (
        <button 
          onClick={onRetry}
          className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-xs font-bold transition-colors"
        >
          <RefreshCcw size={14} /> Retry
        </button>
      )}
    </div>
  );
};
