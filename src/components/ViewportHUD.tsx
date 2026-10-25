import React from 'react';
import { Eye, EyeOff, Volume2, VolumeX, Sparkles, Radio, Clapperboard, Video } from 'lucide-react';
import { DirectorState } from '../types';

interface ViewportHUDProps {
  state: DirectorState;
  onUpdateState: (updates: Partial<DirectorState>) => void;
  isDockVisible: boolean;
  onToggleDock: () => void;
  onQuickSlash: () => void;
}

export const ViewportHUD: React.FC<ViewportHUDProps> = ({
  state,
  onUpdateState,
  isDockVisible,
  onToggleDock,
  onQuickSlash,
}) => {
  return (
    <>
      {/* Top Floating Status Cluster */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none z-20">
        <div className="flex items-center gap-2.5 pointer-events-auto">
          {/* Logo Badge */}
          <div className="flex items-center gap-2 bg-zinc-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-zinc-800 shadow-xl">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
            <span className="text-xs font-bold text-white tracking-wider">JARS 3D STUDIO</span>
            <span className="text-[10px] text-zinc-500 uppercase">v2.5</span>
          </div>

          {/* Active Status Badge */}
          <div className="hidden sm:flex items-center gap-2 bg-zinc-950/70 backdrop-blur-md px-3 py-1.5 rounded-xl border border-zinc-800/80 text-xs">
            <span className="text-zinc-400">Actor:</span>
            <span className="font-semibold text-cyan-400">{state.characterName}</span>
            <span className="text-zinc-600">|</span>
            <span className="text-zinc-400">Set:</span>
            <span className="font-semibold text-pink-400 capitalize">{state.environment.replace('_', ' ')}</span>
          </div>
        </div>

        {/* Recording Banner if active */}
        {state.isRecordingVideo && (
          <div className="flex items-center gap-2 bg-red-600/90 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg animate-pulse pointer-events-auto">
            <span className="w-2 h-2 rounded-full bg-white"></span>
            <span>REC 60FPS</span>
          </div>
        )}

        {/* Right Action Icons */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Quick Action: Attack / Flourish */}
          <button
            onClick={onQuickSlash}
            className="px-3 py-1.5 bg-zinc-950/80 hover:bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-semibold text-zinc-200 flex items-center gap-1.5 shadow-xl transition-all hover:border-zinc-700 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Action Strike</span>
          </button>

          {/* Dock Visibility Toggle */}
          <button
            onClick={onToggleDock}
            title={isDockVisible ? 'Hide Director Dock (Clean View)' : 'Show Director Dock'}
            className="p-2 bg-zinc-950/80 hover:bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-300 hover:text-white shadow-xl transition-all cursor-pointer"
          >
            {isDockVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 9:16 TikTok Mobile Framing Mask (when in 9:16 mode) */}
      {state.aspectRatio === '9:16' && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
          <div className="h-full aspect-[9/16] border-2 border-dashed border-cyan-400/40 rounded-3xl shadow-[0_0_0_9999px_rgba(0,0,0,0.65)] relative">
            <div className="absolute top-3 left-4 bg-black/60 px-2 py-0.5 rounded text-[10px] text-cyan-400 font-mono">
              TikTok Mobile 9:16 Safe Frame
            </div>
          </div>
        </div>
      )}
    </>
  );
};
