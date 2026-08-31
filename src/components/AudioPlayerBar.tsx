import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, X, Music, Volume2 } from 'lucide-react';
import { Ticket } from '../types';

interface AudioPlayerBarProps {
  currentTrack: Ticket | null;
  onClose: () => void;
}

export const AudioPlayerBar: React.FC<AudioPlayerBarProps> = ({ currentTrack, onClose }) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (currentTrack) {
      setIsPlaying(true);
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {
          // auto play policy fallback
          setIsPlaying(false);
        });
      }
    }
  }, [currentTrack]);

  if (!currentTrack) return null;

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  return (
    <div
      id="floating-audio-player"
      className="fixed bottom-20 left-4 right-4 max-w-md mx-auto z-40 bg-[#16171f]/95 backdrop-blur-md border border-[#00D26A]/30 rounded-2xl p-2.5 shadow-2xl shadow-black/80 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-4"
    >
      <audio
        ref={audioRef}
        src={currentTrack.audioPreviewUrl || 'https://cdn.freesound.org/previews/573/573539_11861866-lq.mp3'}
        onEnded={() => setIsPlaying(false)}
      />

      {/* Track Art & Info */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="relative w-11 h-11 rounded-xl overflow-hidden shrink-0 border border-neutral-700">
          <img
            src={currentTrack.image}
            alt={currentTrack.name}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          {isPlaying && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-0.5">
              <span className="w-1 bg-[#00D26A] h-3 animate-pulse"></span>
              <span className="w-1 bg-[#00D26A] h-5 animate-pulse delay-75"></span>
              <span className="w-1 bg-[#00D26A] h-2 animate-pulse delay-150"></span>
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-[#00D26A] font-bold uppercase tracking-wider flex items-center gap-1">
              <Music size={10} /> NOW PLAYING
            </span>
          </div>
          <h4 className="text-sm font-bold text-white truncate">{currentTrack.name}</h4>
          <p className="text-xs text-neutral-400 truncate">{currentTrack.artist}</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={togglePlay}
          className="w-9 h-9 rounded-full bg-[#00D26A] hover:bg-[#00e875] text-black flex items-center justify-center font-bold shadow-lg shadow-[#00D26A]/30 transition-transform active:scale-95"
        >
          {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" className="ml-0.5" />}
        </button>

        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white flex items-center justify-center transition-colors"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
};
