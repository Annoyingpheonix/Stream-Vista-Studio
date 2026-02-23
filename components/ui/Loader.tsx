import React from 'react';

export const Loader: React.FC<{ text?: string }> = ({ text = "Generating..." }) => (
  <div className="flex flex-col items-center justify-center p-8 space-y-4">
    <div className="relative w-16 h-16">
      <div className="absolute top-0 left-0 w-full h-full border-4 border-emerald-500/30 rounded-full"></div>
      <div className="absolute top-0 left-0 w-full h-full border-4 border-t-emerald-500 rounded-full animate-spin"></div>
    </div>
    <p className="text-zinc-400 text-sm animate-pulse font-medium">{text}</p>
  </div>
);