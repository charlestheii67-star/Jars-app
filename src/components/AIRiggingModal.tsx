import React, { useState } from 'react';
import { Cpu, Bone, CheckCircle2, RefreshCw, Eye, EyeOff, Sliders, Sparkles, X } from 'lucide-react';
import { AIRiggingData } from '../types';
import { SceneManager } from '../engine/SceneManager';
import { AIRiggingEngine } from '../engine/AIRiggingEngine';

interface AIRiggingModalProps {
  isOpen: boolean;
  onClose: () => void;
  sceneManager: SceneManager | null;
  aiRigging: AIRiggingData;
  onUpdateAIRigging: (updates: Partial<AIRiggingData>) => void;
  characterName: string;
}

export const AIRiggingModal: React.FC<AIRiggingModalProps> = ({
  isOpen,
  onClose,
  sceneManager,
  aiRigging,
  onUpdateAIRigging,
  characterName,
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState<string>('');

  if (!isOpen) return null;

  const handleRunAutoRig = () => {
    if (!sceneManager) return;
    setIsScanning(true);
    setScanStep('Analyzing 3D vertex clusters and bounding box...');

    setTimeout(() => {
      setScanStep('Detecting anatomical landmarks: Pelvis, Spine, Shoulders, Jaw...');
    }, 600);

    setTimeout(() => {
      setScanStep('Synthesizing 18-joint kinematic bone chain & jaw socket...');
    }, 1200);

    setTimeout(() => {
      // Execute auto-rigging on current character rig
      const currentRig = (sceneManager as any).characterRig;
      if (currentRig) {
        const { rig, data } = AIRiggingEngine.runAutoRigging(currentRig.root);
        sceneManager.setCustomRig(rig);
        sceneManager.toggleSkeletonVisualizer(aiRigging.showBoneSkeleton);
        onUpdateAIRigging({
          ...data,
          showBoneSkeleton: aiRigging.showBoneSkeleton,
        });
      }
      setIsScanning(false);
      setScanStep('');
    }, 1800);
  };

  const handleToggleSkeletonVisualizer = () => {
    const nextVal = !aiRigging.showBoneSkeleton;
    onUpdateAIRigging({ showBoneSkeleton: nextVal });
    if (sceneManager) {
      sceneManager.toggleSkeletonVisualizer(nextVal);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-lg w-full text-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-800 bg-zinc-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-400 to-pink-500 flex items-center justify-center shadow-md">
              <Cpu className="w-4 h-4 text-zinc-950" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">AI Auto-Rigging Engine</h3>
              <p className="text-[10px] text-zinc-400">Anatomical Bone Binding & Jaw Viseme Rigging</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 space-y-4">
          {/* Target Model Status */}
          <div className="flex items-center justify-between bg-zinc-900/80 p-3 rounded-xl border border-zinc-800">
            <div>
              <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block">Target 3D Model</span>
              <span className="text-xs font-semibold text-white">{characterName}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Rigged & Articulated</span>
            </div>
          </div>

          {/* AI Rig Telemetry Stats */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-800 text-center">
              <span className="text-[10px] text-zinc-500 uppercase block">Joints</span>
              <span className="text-base font-mono font-bold text-white">{aiRigging.jointCount || 18} Bones</span>
            </div>
            <div className="bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-800 text-center">
              <span className="text-[10px] text-zinc-500 uppercase block">Symmetry</span>
              <span className="text-base font-mono font-bold text-cyan-400">{aiRigging.symmetryScore || 98.7}%</span>
            </div>
            <div className="bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-800 text-center">
              <span className="text-[10px] text-zinc-500 uppercase block">Jaw Socket</span>
              <span className="text-base font-mono font-bold text-pink-400">Active</span>
            </div>
          </div>

          {/* Scanning Progress Banner */}
          {isScanning && (
            <div className="bg-zinc-900 p-3.5 rounded-xl border border-cyan-500/40 text-center space-y-2">
              <div className="flex items-center justify-center gap-2 text-cyan-400 text-xs font-semibold">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>{scanStep}</span>
              </div>
              <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-gradient-to-r from-cyan-400 to-pink-500 h-full animate-pulse w-3/4"></div>
              </div>
            </div>
          )}

          {/* Actions & Toggles */}
          <div className="space-y-2.5 pt-1">
            <button
              onClick={handleRunAutoRig}
              disabled={isScanning}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-cyan-500 via-pink-500 to-amber-400 hover:opacity-95 text-zinc-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:opacity-50 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isScanning ? 'Auto-Rigging Model...' : 'Re-Run AI Auto-Rigging'}</span>
            </button>

            <button
              onClick={handleToggleSkeletonVisualizer}
              className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold border flex items-center justify-center gap-2 cursor-pointer transition-all ${
                aiRigging.showBoneSkeleton
                  ? 'bg-pink-500/20 text-pink-300 border-pink-500/50'
                  : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-800'
              }`}
            >
              <Bone className="w-4 h-4" />
              <span>{aiRigging.showBoneSkeleton ? 'Hide AI Skeleton Visualizer' : 'Show AI Skeleton Visualizer'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
