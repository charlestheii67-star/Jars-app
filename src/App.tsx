/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { SceneManager } from './engine/SceneManager';
import { DirectorState } from './types';
import { DirectorDock } from './components/DirectorDock';
import { ViewportHUD } from './components/ViewportHUD';
import { DialogueCaptionsOverlay } from './components/DialogueCaptionsOverlay';
import { AndroidReleaseModal } from './components/AndroidReleaseModal';
import { globalAudioVoiceEngine } from './engine/AudioVoiceEngine';

export default function App() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const sceneManagerRef = useRef<SceneManager | null>(null);

  const [state, setState] = useState<DirectorState>({
    characterId: 'jason_slasher',
    characterName: 'The Lake Revenant',
    personalityPrompt: 'Silent, relentless, terrifying, immortal predator devoted to Camp Crystal Lake',
    dialogueStylePrompt: 'Deep, guttural, threatening whispers with long pauses and cold finality',
    environment: 'crystal_lake',
    lightingMood: 'normal',
    weather: 'denseMist',
    cameraShot: 'wide',
    animationState: 'stalk',
    isPerformingScene: false,
    isLiveStreaming: false,
    aspectRatio: '16:9',
    isRecordingVideo: false,
    audioMuted: false,
    speechText: '',
    isSpeaking: false,
    clonedVoiceName: 'Slasher Growl',
    characterScale: 1.0,
    animationSpeed: 1.0,
    speechBlipConfig: {
      soundType: 'slasher_grunt',
      pitch: 0.65,
      speedMs: 95,
      pitchVariation: 0.35,
      volume: 0.9,
    },
    aiRigging: {
      isRigged: true,
      jointCount: 18,
      symmetryScore: 98.7,
      rigConfidence: 97.4,
      hasJawSocket: true,
      showBoneSkeleton: false,
      rigPreset: 'humanoid',
    },
    captionConfig: {
      enabled: true,
      style: 'cinema',
      currentText: '',
      speakerName: 'The Lake Revenant',
      visibleText: '',
    },
  });

  const [isDockVisible, setIsDockVisible] = useState(true);
  const [isAndroidModalOpen, setIsAndroidModalOpen] = useState(false);

  // Initialize Three.js SceneManager once on mount
  useEffect(() => {
    if (!containerRef.current) return;

    const manager = new SceneManager(containerRef.current);
    sceneManagerRef.current = manager;

    const handleResize = () => {
      if (containerRef.current && sceneManagerRef.current) {
        sceneManagerRef.current.resize(
          containerRef.current.clientWidth,
          containerRef.current.clientHeight
        );
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      manager.destroy();
      sceneManagerRef.current = null;
    };
  }, []);

  const handleUpdateState = (updates: Partial<DirectorState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  };

  const handleQuickSlash = () => {
    if (sceneManagerRef.current) {
      sceneManagerRef.current.setAnimationState('slash');
      globalAudioVoiceEngine.playSoundEffect('metalSlash');
      setTimeout(() => {
        if (sceneManagerRef.current) {
          sceneManagerRef.current.setAnimationState(state.animationState);
        }
      }, 1400);
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black select-none font-sans">
      {/* Three.js 3D Viewport Canvas Container */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Viewport Status & Safe Frame Overlay */}
      <ViewportHUD
        state={state}
        onUpdateState={handleUpdateState}
        isDockVisible={isDockVisible}
        onToggleDock={() => setIsDockVisible(!isDockVisible)}
        onQuickSlash={handleQuickSlash}
        onOpenAndroidModal={() => setIsAndroidModalOpen(true)}
      />

      {/* Live Dialogue Captions Overlay */}
      <DialogueCaptionsOverlay
        captionConfig={state.captionConfig}
        isSpeaking={state.isSpeaking || state.isPerformingScene}
        characterName={state.characterName}
      />

      {/* Floating Director Studio Dock */}
      {isDockVisible && (
        <DirectorDock
          sceneManager={sceneManagerRef.current}
          state={state}
          onUpdateState={handleUpdateState}
          onOpenAndroidModal={() => setIsAndroidModalOpen(true)}
        />
      )}

      {/* Official Android Release APK & GitHub Distribution Modal */}
      <AndroidReleaseModal
        isOpen={isAndroidModalOpen}
        onClose={() => setIsAndroidModalOpen(false)}
      />
    </div>
  );
}
