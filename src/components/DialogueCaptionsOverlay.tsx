import React from 'react';
import { CaptionConfig, CaptionStyle } from '../types';

interface DialogueCaptionsOverlayProps {
  captionConfig: CaptionConfig;
  isSpeaking: boolean;
  characterName: string;
}

export const DialogueCaptionsOverlay: React.FC<DialogueCaptionsOverlayProps> = ({
  captionConfig,
  isSpeaking,
  characterName,
}) => {
  if (!captionConfig.enabled || (!isSpeaking && !captionConfig.visibleText)) {
    return null;
  }

  const text = captionConfig.visibleText || captionConfig.currentText;
  const speaker = captionConfig.speakerName || characterName;

  switch (captionConfig.style) {
    case 'tiktok_viral':
      return (
        <div className="absolute bottom-28 left-1/2 -translate-x-1/2 max-w-lg w-[90%] pointer-events-none z-20 text-center animate-bounce-subtle">
          <div className="inline-block bg-black/80 px-4 py-2.5 rounded-2xl border-2 border-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.5)]">
            <span className="block text-[10px] uppercase font-black text-cyan-400 tracking-widest mb-0.5">
              @{speaker}
            </span>
            <p className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
              {text.split(' ').map((word, i, arr) => (
                <span
                  key={i}
                  className={
                    i === arr.length - 1
                      ? 'text-yellow-300 scale-110 inline-block px-1 bg-pink-600/40 rounded'
                      : 'text-white'
                  }
                >
                  {word}{' '}
                </span>
              ))}
            </p>
          </div>
        </div>
      );

    case 'retro_rpg':
      return (
        <div className="absolute bottom-28 left-1/2 -translate-x-1/2 max-w-xl w-[90%] pointer-events-none z-20 font-mono">
          <div className="bg-black/95 p-4 rounded-lg border-4 border-white shadow-[0_0_0_4px_black] text-white">
            <div className="flex items-center gap-2 mb-1.5 border-b-2 border-white/40 pb-1">
              <span className="w-2.5 h-2.5 bg-yellow-400 animate-pulse inline-block"></span>
              <span className="text-xs uppercase font-bold tracking-widest text-yellow-300">
                {speaker}
              </span>
            </div>
            <p className="text-sm sm:text-base leading-relaxed tracking-wider">
              {text}
              {isSpeaking && <span className="inline-block w-2 h-4 bg-white ml-1 animate-pulse" />}
            </p>
          </div>
        </div>
      );

    case 'horror_whisper':
      return (
        <div className="absolute bottom-28 left-1/2 -translate-x-1/2 max-w-xl w-[90%] pointer-events-none z-20 text-center">
          <div className="bg-black/85 px-6 py-3 rounded-xl border border-red-900/60 shadow-[0_0_25px_rgba(185,28,28,0.3)]">
            <span className="block text-[11px] uppercase tracking-[0.3em] font-serif text-red-500 mb-1">
              * {speaker} *
            </span>
            <p className="text-sm sm:text-base font-serif italic text-zinc-300 tracking-wide leading-relaxed">
              "{text}"
            </p>
          </div>
        </div>
      );

    case 'cinema':
    default:
      return (
        <div className="absolute bottom-28 left-1/2 -translate-x-1/2 max-w-2xl w-[90%] pointer-events-none z-20 text-center">
          <div className="inline-block bg-black/75 px-5 py-2.5 rounded-xl backdrop-blur-sm border border-zinc-800/60 shadow-2xl">
            <span className="block text-[10px] uppercase font-bold text-cyan-400 tracking-widest mb-1">
              {speaker}
            </span>
            <p className="text-sm sm:text-base font-semibold text-yellow-300 drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] tracking-wide">
              {text}
            </p>
          </div>
        </div>
      );
  }
};
