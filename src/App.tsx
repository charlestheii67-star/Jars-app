/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { SceneManager } from './engine/SceneManager';
import { DirectorState, VoiceProfile } from './types';
import { DirectorDock } from './components/DirectorDock';
import { ViewportHUD } from './components/ViewportHUD';
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
  });

  const [voiceProfile, setVoiceProfile] = useState<VoiceProfile>({
    presetName: 'Slasher Growl',
    pitch: 0.35,
    rate: 0.75,
    reverb: 0.8,
    distortion: 0.6,
    formantShift: -8,
    voiceGender: 'monster',
  });

  const [isDockVisible, setIsDockVisible] = useState(true);

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

  const handleUpdateVoiceProfile = (updates: Partial<VoiceProfile>) => {
    setVoiceProfile((prev) => ({ ...prev, ...updates }));
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
      />

      {/* Floating Director Studio Dock */}
      {isDockVisible && (
        <DirectorDock
          sceneManager={sceneManagerRef.current}
          state={state}
          onUpdateState={handleUpdateState}
          voiceProfile={voiceProfile}
          onUpdateVoiceProfile={handleUpdateVoiceProfile}
        />
      )}
    </div>
  );
}
