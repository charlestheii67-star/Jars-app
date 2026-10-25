import React, { useState, useRef } from 'react';
import {
  Film,
  User,
  Sliders,
  TreePine,
  Mic,
  Radio,
  Camera,
  Play,
  Square,
  Sparkles,
  Upload,
  Volume2,
  VolumeX,
  Download,
  Video,
  Layers,
  Wand2,
  Eye,
  RefreshCw,
  Cpu,
  Music,
  FileAudio,
  Subtitles,
} from 'lucide-react';
import {
  AnimationState,
  CameraShot,
  CaptionStyle,
  CharacterConfig,
  CharacterId,
  CinematicSceneScript,
  DirectorState,
  EnvironmentBiome,
  LightingMood,
  SpeechBlipType,
  WeatherType,
} from '../types';
import { SceneManager } from '../engine/SceneManager';
import { ModelImporter } from '../engine/ModelImporter';
import { globalAudioVoiceEngine } from '../engine/AudioVoiceEngine';
import { TikTokLiveStudio } from './TikTokLiveStudio';
import { AIRiggingModal } from './AIRiggingModal';

interface DirectorDockProps {
  sceneManager: SceneManager | null;
  state: DirectorState;
  onUpdateState: (updates: Partial<DirectorState>) => void;
  voiceProfile?: any;
  onUpdateVoiceProfile?: (updates: any) => void;
}

const PRESET_CHARACTERS: CharacterConfig[] = [
  {
    id: 'jason_slasher',
    name: 'The Lake Revenant',
    subtitle: 'Immortal Slasher Archetype',
    personality: 'Silent, relentless, terrifying, immortal predator devoted to Camp Crystal Lake',
    dialogueStyle: 'Deep, guttural, threatening whispers with long pauses and cold finality',
    defaultAnimation: 'stalk',
    blipConfig: {
      soundType: 'slasher_grunt',
      pitch: 0.65,
      speedMs: 95,
      pitchVariation: 0.35,
      volume: 0.9,
    },
    primaryColor: '#166534',
    accentColor: '#dc2626',
  },
  {
    id: 'cyber_vtuber',
    name: 'Nova (V-Tuber)',
    subtitle: 'High-Tech Cyber Streamer',
    personality: 'Fast-talking, witty, charismatic cyberpunk streamer with neon tech gear',
    dialogueStyle: 'Enthusiastic, tech-slang, audience-focused, energetic callouts',
    defaultAnimation: 'dance',
    blipConfig: {
      soundType: 'cyber_holo',
      pitch: 1.35,
      speedMs: 58,
      pitchVariation: 0.3,
      volume: 0.85,
    },
    primaryColor: '#06b6d4',
    accentColor: '#ec4899',
  },
  {
    id: 'titan_mech',
    name: 'AX-7 Titan Mech',
    subtitle: 'Heavy Autonomous Battleframe',
    personality: 'Cold, calculated, tactical military combat AI unit',
    dialogueStyle: 'Synthesized, protocol-driven, monotone, tactical telemetry readouts',
    defaultAnimation: 'walk',
    blipConfig: {
      soundType: 'mech_relay',
      pitch: 0.8,
      speedMs: 80,
      pitchVariation: 0.15,
      volume: 0.9,
    },
    primaryColor: '#eab308',
    accentColor: '#ef4444',
  },
  {
    id: 'anime_sorcerer',
    name: 'Kaito the Astral Seeker',
    subtitle: 'Ethereal Magic Wielder',
    personality: 'Mysterious, wise, poetic celestial spellcaster',
    dialogueStyle: 'Eloquent, metaphorical, dramatic anime hero speech',
    defaultAnimation: 'talk',
    blipConfig: {
      soundType: 'crystal_whisper',
      pitch: 1.05,
      speedMs: 70,
      pitchVariation: 0.25,
      volume: 0.85,
    },
    primaryColor: '#7c3aed',
    accentColor: '#f59e0b',
  },
  {
    id: 'jars_cartoon',
    name: 'Bloop the Mascot',
    subtitle: 'Expressive Jars AI Avatar',
    personality: 'Bouncy, hyperactive, comedic slapstick cartoon character',
    dialogueStyle: 'High-pitch excitement, silly jokes, joyful comedic punchlines',
    defaultAnimation: 'idle',
    blipConfig: {
      soundType: 'animal_speak',
      pitch: 1.5,
      speedMs: 55,
      pitchVariation: 0.45,
      volume: 0.9,
    },
    primaryColor: '#3b82f6',
    accentColor: '#f97316',
  },
];

export const DirectorDock: React.FC<DirectorDockProps> = ({
  sceneManager,
  state,
  onUpdateState,
  voiceProfile,
  onUpdateVoiceProfile,
}) => {
  const [activeTab, setActiveTab] = useState<'character' | 'environment' | 'director' | 'voice' | 'tiktok' | 'camera'>('director');
  const [scenePrompt, setScenePrompt] = useState('Direct a tense, cinematic standoff where the character confronts an intruder at the edge of the dark woods.');
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [currentScript, setCurrentScript] = useState<CinematicSceneScript | null>(null);

  const [isAIRigModalOpen, setIsAIRigModalOpen] = useState(false);
  const sfxFileInputRef = useRef<HTMLInputElement | null>(null);

  // Custom 3D Model file input ref
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [importedModelName, setImportedModelName] = useState<string | null>(null);

  const [testSpeechText, setTestSpeechText] = useState('Welcome to Jars 3D Studio. Every character speaks with custom sound effect blips and live captions.');

  // Handle Character Scale & Speed Change
  const handleScaleChange = (scale: number) => {
    const clamped = Math.max(0.3, Math.min(3.5, scale));
    onUpdateState({ characterScale: clamped });
    if (sceneManager) {
      sceneManager.setCharacterScale(clamped);
    }
  };

  const handleSpeedChange = (speed: number) => {
    const clamped = Math.max(0.2, Math.min(3.0, speed));
    onUpdateState({ animationSpeed: clamped });
    if (sceneManager) {
      sceneManager.setAnimationSpeed(clamped);
    }
  };

  // Handle Character Change
  const handleSelectCharacter = (char: CharacterConfig) => {
    onUpdateState({
      characterId: char.id,
      characterName: char.name,
      personalityPrompt: char.personality,
      dialogueStylePrompt: char.dialogueStyle,
      animationState: char.defaultAnimation,
      speechBlipConfig: char.blipConfig,
    });

    if (sceneManager) {
      sceneManager.loadCharacter(char.id);
      sceneManager.setCharacterScale(state.characterScale || 1.0);
      sceneManager.setAnimationSpeed(state.animationSpeed || 1.0);
      sceneManager.setAnimationState(char.defaultAnimation);
    }
  };

  // Handle Custom 3D Model Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !sceneManager) return;

    try {
      setImportedModelName(file.name);
      const rig = await ModelImporter.loadCustomModel(file);
      sceneManager.setCustomRig(rig);
      onUpdateState({
        characterId: 'custom_imported',
        characterName: file.name.replace(/\.[^/.]+$/, ''),
      });
    } catch (err: any) {
      alert(err.message || 'Error loading 3D model');
    }
  };

  // Handle Custom Sound Effect Audio Upload as Character Voice
  const handleCustomSFXUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const buffer = await globalAudioVoiceEngine.loadAudioFileAsBuffer(file);
      onUpdateState({
        speechBlipConfig: {
          ...state.speechBlipConfig,
          soundType: 'custom_sound',
          customAudioBuffer: buffer,
          customAudioFileName: file.name,
          customAudioDuration: buffer.duration,
        },
      });
    } catch (err: any) {
      alert('Could not decode audio file: ' + err?.message);
    }
  };

  // Handle Environment Change
  const handleSelectEnvironment = (biome: EnvironmentBiome) => {
    onUpdateState({ environment: biome });
    if (sceneManager) {
      sceneManager.setupEnvironment(biome, state.lightingMood);
    }
  };

  const handleSelectMood = (mood: LightingMood) => {
    onUpdateState({ lightingMood: mood });
    if (sceneManager) {
      sceneManager.setupEnvironment(state.environment, mood);
    }
  };

  const handleSelectWeather = (weather: WeatherType) => {
    onUpdateState({ weather });
    if (sceneManager) {
      sceneManager.setupWeatherParticles(weather);
    }
  };

  const handleSelectCameraShot = (shot: CameraShot) => {
    onUpdateState({ cameraShot: shot });
    if (sceneManager) {
      sceneManager.setCameraShot(shot);
    }
  };

  const handleSelectAnimation = (anim: AnimationState) => {
    onUpdateState({ animationState: anim });
    if (sceneManager) {
      sceneManager.setAnimationState(anim);
    }
  };

  // AI Script Generation
  const handleGenerateScript = async () => {
    setIsGeneratingScript(true);
    try {
      const res = await fetch('/api/generate-scene', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: scenePrompt,
          characterName: state.characterName,
          personality: state.personalityPrompt,
          mood: state.lightingMood,
          environment: state.environment,
        }),
      });

      const data = await res.json();
      if (data.success && data.data) {
        setCurrentScript(data.data);
      }
    } catch (e) {
      console.warn(e);
    } finally {
      setIsGeneratingScript(false);
    }
  };

  // Perform Cinematic Scene with Custom Sound Effect Speech Blips & Synchronized Captions
  const handlePerformScene = () => {
    if (!currentScript || !sceneManager) return;
    onUpdateState({ isPerformingScene: true });

    // 1. Stage camera angle
    handleSelectCameraShot(currentScript.cameraShot || 'closeUp');
    // 2. Trigger character animation
    handleSelectAnimation(currentScript.animation || 'talk');
    // 3. Play sound effect
    if (currentScript.soundEffect && currentScript.soundEffect !== 'none') {
      globalAudioVoiceEngine.playSoundEffect(currentScript.soundEffect);
    }

    // 4. Reset captions
    onUpdateState({
      captionConfig: {
        ...state.captionConfig,
        currentText: currentScript.dialogue,
        visibleText: '',
        speakerName: state.characterName,
      },
    });

    // 5. Speech Blips with live typewriter caption callback
    globalAudioVoiceEngine.speakWithBlips(
      currentScript.dialogue,
      state.speechBlipConfig,
      () => {
        onUpdateState({ isPerformingScene: false });
        handleSelectAnimation('idle');
      },
      (visibleText) => {
        onUpdateState({
          captionConfig: {
            ...state.captionConfig,
            currentText: currentScript.dialogue,
            visibleText,
            speakerName: state.characterName,
          },
        });
      }
    );
  };

  // Test Speech Blips & Captions
  const handleTestSpeech = () => {
    if (sceneManager) {
      sceneManager.setAnimationState('talk');
    }
    onUpdateState({
      isSpeaking: true,
      captionConfig: {
        ...state.captionConfig,
        currentText: testSpeechText,
        visibleText: '',
        speakerName: state.characterName,
      },
    });

    globalAudioVoiceEngine.speakWithBlips(
      testSpeechText,
      state.speechBlipConfig,
      () => {
        onUpdateState({ isSpeaking: false });
        if (sceneManager) {
          sceneManager.setAnimationState('idle');
        }
      },
      (visibleText) => {
        onUpdateState({
          captionConfig: {
            ...state.captionConfig,
            currentText: testSpeechText,
            visibleText,
            speakerName: state.characterName,
          },
        });
      }
    );
  };

  // Record 60fps WebM clip
  const handleToggleRecordVideo = () => {
    if (!sceneManager) return;

    if (!state.isRecordingVideo) {
      const success = sceneManager.startRecording((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Jars3D_Scene_${Date.now()}.webm`;
        a.click();
      });
      if (success) {
        onUpdateState({ isRecordingVideo: true });
      }
    } else {
      sceneManager.stopRecording();
      onUpdateState({ isRecordingVideo: false });
    }
  };

  // 4K Snapshot
  const handleTakeSnapshot = () => {
    if (!sceneManager) return;
    const dataUrl = sceneManager.captureSnapshot();
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `Jars3D_Shot_${Date.now()}.jpg`;
    a.click();
  };

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[95%] max-w-5xl bg-zinc-950/90 border border-zinc-800 rounded-2xl shadow-2xl backdrop-blur-xl text-white overflow-hidden transition-all z-30">
      {/* Top Dock Navigation Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-800/80 bg-zinc-900/60">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-500 to-pink-500 flex items-center justify-center shadow-md">
            <Film className="w-4 h-4 text-zinc-950" />
          </div>
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-white">Jars 3D Director Studio</h2>
            <span className="text-[10px] text-zinc-400">Cinematic Animation & Live Stream Engine</span>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-1 bg-zinc-950/80 p-1 rounded-xl border border-zinc-800">
          <button
            onClick={() => setActiveTab('director')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'director' ? 'bg-cyan-500 text-zinc-950 font-bold shadow-sm' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span>AI Director</span>
          </button>

          <button
            onClick={() => setActiveTab('character')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'character' ? 'bg-cyan-500 text-zinc-950 font-bold shadow-sm' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>3D Character</span>
          </button>

          <button
            onClick={() => setActiveTab('environment')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'environment' ? 'bg-cyan-500 text-zinc-950 font-bold shadow-sm' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <TreePine className="w-3.5 h-3.5" />
            <span>Environment</span>
          </button>

          <button
            onClick={() => setActiveTab('voice')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'voice' ? 'bg-cyan-500 text-zinc-950 font-bold shadow-sm' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <FileAudio className="w-3.5 h-3.5" />
            <span>Speech Blips & SFX</span>
          </button>

          <button
            onClick={() => setActiveTab('tiktok')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'tiktok' ? 'bg-gradient-to-r from-cyan-400 to-pink-500 text-zinc-950 font-bold shadow-md' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>TikTok Live</span>
          </button>

          <button
            onClick={() => setActiveTab('camera')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'camera' ? 'bg-cyan-500 text-zinc-950 font-bold shadow-sm' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Cinematography</span>
          </button>
        </div>

        {/* Global Quick Action: Record Video / Aspect Ratio */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onUpdateState({ aspectRatio: state.aspectRatio === '16:9' ? '9:16' : '16:9' })}
            className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-[11px] font-semibold text-zinc-200 rounded-lg border border-zinc-700 transition-colors cursor-pointer"
          >
            {state.aspectRatio === '16:9' ? '16:9 Cinema' : '9:16 Mobile Live'}
          </button>

          <button
            onClick={handleToggleRecordVideo}
            className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
              state.isRecordingVideo
                ? 'bg-red-500 text-white animate-pulse'
                : 'bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700'
            }`}
          >
            {state.isRecordingVideo ? <Square className="w-3 h-3 fill-current" /> : <Video className="w-3 h-3" />}
            <span>{state.isRecordingVideo ? 'Stop REC' : 'Record'}</span>
          </button>
        </div>
      </div>

      {/* Dock Content Body */}
      <div className="p-4 max-h-72 overflow-y-auto">
        {/* TAB 1: AI SCENE DIRECTOR */}
        {activeTab === 'director' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-3">
              <div>
                <label className="text-xs font-semibold text-zinc-300 mb-1 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Natural Language Scene Prompt</span>
                </label>
                <div className="flex gap-2">
                  <textarea
                    rows={2}
                    value={scenePrompt}
                    onChange={(e) => setScenePrompt(e.target.value)}
                    placeholder="Describe scene action, dialogue tone, and emotional beats..."
                    className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-cyan-400 resize-none"
                  />
                  <button
                    onClick={handleGenerateScript}
                    disabled={isGeneratingScript}
                    className="px-4 bg-gradient-to-tr from-cyan-500 to-pink-500 hover:opacity-90 text-zinc-950 font-bold rounded-lg text-xs flex flex-col items-center justify-center gap-1 cursor-pointer disabled:opacity-50 shrink-0 shadow-lg"
                  >
                    {isGeneratingScript ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                    <span>Generate Beat</span>
                  </button>
                </div>
              </div>

              {/* Sample Quick Directing Prompts */}
              <div className="flex flex-wrap gap-1.5 text-[11px]">
                <span className="text-zinc-500 py-0.5">Quick Prompts:</span>
                {[
                  'Campground Confrontation with the Slasher',
                  'Cyberpunk Streamer Hacking Mainframe',
                  'Titan Battleframe Defensive Protocol',
                  'Horror Whispering in the Woods',
                  'TikTok Viral Celebration Dance',
                ].map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => setScenePrompt(preset)}
                    className="px-2 py-0.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Generated Script Playback Card */}
            <div className="bg-zinc-900/80 rounded-xl p-3 border border-zinc-800 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">Active Scene Beat</span>
                  {currentScript && (
                    <span className="text-[10px] text-zinc-500 uppercase">{currentScript.cameraShot} Shot</span>
                  )}
                </div>
                {currentScript ? (
                  <div className="space-y-1.5">
                    <h4 className="text-xs font-bold text-white">{currentScript.title}</h4>
                    <p className="text-[11px] text-zinc-400 italic">"{currentScript.dialogue}"</p>
                  </div>
                ) : (
                  <p className="text-xs text-zinc-500 py-3 text-center">Click Generate Beat to produce a cinematic performance script.</p>
                )}
              </div>

              <button
                onClick={handlePerformScene}
                disabled={!currentScript || state.isPerformingScene}
                className="mt-3 w-full py-2 bg-pink-500 hover:bg-pink-400 text-zinc-950 font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 transition-colors shadow-lg"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{state.isPerformingScene ? 'Performing Scene...' : 'Action! (Perform Scene)'}</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: 3D CHARACTER SELECTION & CUSTOM MODEL IMPORTER */}
        {activeTab === 'character' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-300">Choose 3D Character Archetype or Import Custom Model:</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsAIRigModalOpen(true)}
                  className="px-3 py-1.5 bg-gradient-to-r from-cyan-500/20 to-pink-500/20 hover:from-cyan-500/30 hover:to-pink-500/30 border border-cyan-500/40 text-cyan-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all shadow-md"
                >
                  <Cpu className="w-3.5 h-3.5 text-pink-400" />
                  <span>AI Auto-Rigging</span>
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Upload className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Import 3D Model (.glb / .gltf / .obj)</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".glb,.gltf,.obj"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            </div>

            {/* Character Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {PRESET_CHARACTERS.map((char) => (
                <div
                  key={char.id}
                  onClick={() => handleSelectCharacter(char)}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                    state.characterId === char.id
                      ? 'bg-zinc-900 border-cyan-400 ring-1 ring-cyan-400/50 shadow-lg'
                      : 'bg-zinc-900/60 border-zinc-800/80 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: char.accentColor }}
                    />
                    <h4 className="text-xs font-bold text-white truncate">{char.name}</h4>
                  </div>
                  <p className="text-[10px] text-zinc-400 line-clamp-2">{char.subtitle}</p>
                </div>
              ))}
            </div>

            {/* Character Personality & Dialogue Prompts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-zinc-800/80">
              <div>
                <label className="text-[11px] font-semibold text-zinc-400 mb-1 block">Character Personality Prompt</label>
                <input
                  type="text"
                  value={state.personalityPrompt}
                  onChange={(e) => onUpdateState({ personalityPrompt: e.target.value })}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-zinc-400 mb-1 block">Dialogue & Speech Style Prompt</label>
                <input
                  type="text"
                  value={state.dialogueStylePrompt}
                  onChange={(e) => onUpdateState({ dialogueStylePrompt: e.target.value })}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            {/* Model Resizing & Scale Controls */}
            <div className="pt-3 border-t border-zinc-800/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-zinc-300">Model Scale & Resizing:</span>
                  <span className="text-xs font-mono font-bold text-cyan-400">
                    {(state.characterScale || 1.0).toFixed(2)}x Scale
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-zinc-500">Presets:</span>
                  {[
                    { label: 'Mini 0.5x', scale: 0.5 },
                    { label: 'Compact 0.8x', scale: 0.8 },
                    { label: 'Normal 1.0x', scale: 1.0 },
                    { label: 'Giant 1.5x', scale: 1.5 },
                    { label: 'Titan 2.2x', scale: 2.2 },
                  ].map((p) => (
                    <button
                      key={p.label}
                      onClick={() => handleScaleChange(p.scale)}
                      className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors cursor-pointer ${
                        Math.abs((state.characterScale || 1.0) - p.scale) < 0.05
                          ? 'bg-cyan-500 text-zinc-950 font-bold'
                          : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-zinc-900/60 p-3 rounded-xl border border-zinc-800">
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-zinc-400">Character Model Scale</span>
                    <span className="text-cyan-400 font-mono">{(state.characterScale || 1.0).toFixed(2)}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.3"
                    max="3.0"
                    step="0.05"
                    value={state.characterScale || 1.0}
                    onChange={(e) => handleScaleChange(parseFloat(e.target.value))}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] text-zinc-500 mt-0.5">
                    <span>0.3x (Chibi)</span>
                    <span>1.0x (Standard)</span>
                    <span>3.0x (Colossus)</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-zinc-400">Animation Motion Speed</span>
                    <span className="text-pink-400 font-mono">{(state.animationSpeed || 1.0).toFixed(2)}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.25"
                    max="2.5"
                    step="0.05"
                    value={state.animationSpeed || 1.0}
                    onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
                    className="w-full accent-pink-400 cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] text-zinc-500 mt-0.5">
                    <span>0.25x (Slow-Mo)</span>
                    <span>1.0x (Normal)</span>
                    <span>2.5x (Hyper)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Categorized Model Animations Deck */}
            <div className="pt-2 border-t border-zinc-800/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-300">Model Animations:</span>
                <span className="text-[10px] text-pink-400 font-mono uppercase">
                  Current: {state.animationState}
                </span>
              </div>

              {/* Animation Categories */}
              <div className="space-y-2">
                {/* Combat & Slasher */}
                <div>
                  <span className="text-[10px] uppercase font-bold text-red-400 tracking-wider block mb-1">Combat & Stalking</span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { id: 'stalk', label: 'Menacing Stalk' },
                      { id: 'slash', label: 'Heavy Slash' },
                      { id: 'combatCombo', label: '3-Hit Combo' },
                      { id: 'ninjaSneak', label: 'Ninja Sneak' },
                    ].map((anim) => (
                      <button
                        key={anim.id}
                        onClick={() => handleSelectAnimation(anim.id as AnimationState)}
                        className={`px-3 py-1 rounded-lg text-xs cursor-pointer transition-all ${
                          state.animationState === anim.id
                            ? 'bg-red-500 text-white font-bold shadow-md shadow-red-500/20'
                            : 'bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-800'
                        }`}
                      >
                        {anim.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Locomotion & Action */}
                <div>
                  <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider block mb-1">Action & Locomotion</span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { id: 'walk', label: 'Natural Walk' },
                      { id: 'run', label: 'Athletic Run' },
                      { id: 'jump', label: 'Dynamic Jump' },
                      { id: 'ragdollShock', label: 'Physics Ragdoll' },
                    ].map((anim) => (
                      <button
                        key={anim.id}
                        onClick={() => handleSelectAnimation(anim.id as AnimationState)}
                        className={`px-3 py-1 rounded-lg text-xs cursor-pointer transition-all ${
                          state.animationState === anim.id
                            ? 'bg-cyan-500 text-zinc-950 font-bold shadow-md shadow-cyan-500/20'
                            : 'bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-800'
                        }`}
                      >
                        {anim.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Social & Live Stream */}
                <div>
                  <span className="text-[10px] uppercase font-bold text-pink-400 tracking-wider block mb-1">Social, Streams & Acting</span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { id: 'talk', label: 'Expressive Talk' },
                      { id: 'dance', label: 'TikTok Live Dance' },
                      { id: 'celebrate', label: 'Victory Celebrate' },
                      { id: 'bow', label: 'Theatrical Bow' },
                    ].map((anim) => (
                      <button
                        key={anim.id}
                        onClick={() => handleSelectAnimation(anim.id as AnimationState)}
                        className={`px-3 py-1 rounded-lg text-xs cursor-pointer transition-all ${
                          state.animationState === anim.id
                            ? 'bg-pink-500 text-zinc-950 font-bold shadow-md shadow-pink-500/20'
                            : 'bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-800'
                        }`}
                      >
                        {anim.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Reactions & Emotion */}
                <div>
                  <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider block mb-1">Emotion & Reactions</span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { id: 'cower', label: 'Terrified Cower' },
                      { id: 'evilLaugh', label: 'Menacing Evil Laugh' },
                      { id: 'idle', label: 'Calm Breathing' },
                    ].map((anim) => (
                      <button
                        key={anim.id}
                        onClick={() => handleSelectAnimation(anim.id as AnimationState)}
                        className={`px-3 py-1 rounded-lg text-xs cursor-pointer transition-all ${
                          state.animationState === anim.id
                            ? 'bg-amber-400 text-zinc-950 font-bold shadow-md shadow-amber-400/20'
                            : 'bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-800'
                        }`}
                      >
                        {anim.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: PROCEDURAL ENVIRONMENT GENERATOR */}
        {activeTab === 'environment' && (
          <div className="space-y-4">
            <div>
              <span className="text-xs font-semibold text-zinc-300 block mb-2">Procedural Biome Presets:</span>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                {[
                  { id: 'crystal_lake', name: 'Crystal Lake', desc: 'Misty pine forest & wooden dock' },
                  { id: 'cyberpunk_alley', name: 'Cyberpunk Alley', desc: 'Reflective asphalt & neon signs' },
                  { id: 'martian_outpost', name: 'Martian Outpost', desc: 'Red canyon dunes & biodome' },
                  { id: 'ruins_wasteland', name: 'Post-Apocalyptic', desc: 'Cracked earth & ruined highway' },
                  { id: 'soundstage_studio', name: 'Soundstage Studio', desc: 'Infinite cyclorama & light truss' },
                ].map((biome) => (
                  <button
                    key={biome.id}
                    onClick={() => handleSelectEnvironment(biome.id as EnvironmentBiome)}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                      state.environment === biome.id
                        ? 'bg-zinc-900 border-cyan-400 shadow-lg'
                        : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    <h4 className="text-xs font-bold text-white">{biome.name}</h4>
                    <p className="text-[10px] text-zinc-400 mt-1">{biome.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-zinc-800/80">
              {/* Lighting Mood */}
              <div>
                <span className="text-xs font-semibold text-zinc-400 block mb-2">Cinematic Lighting Mood:</span>
                <div className="flex flex-wrap gap-1.5">
                  {(['normal', 'bloodMoon', 'neon', 'goldenHour'] as LightingMood[]).map((mood) => (
                    <button
                      key={mood}
                      onClick={() => handleSelectMood(mood)}
                      className={`px-3 py-1 rounded-lg text-xs capitalize cursor-pointer transition-colors ${
                        state.lightingMood === mood
                          ? 'bg-pink-500 text-zinc-950 font-bold'
                          : 'bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-800'
                      }`}
                    >
                      {mood}
                    </button>
                  ))}
                </div>
              </div>

              {/* Weather Particles */}
              <div>
                <span className="text-xs font-semibold text-zinc-400 block mb-2">Procedural Weather Particles:</span>
                <div className="flex flex-wrap gap-1.5">
                  {(['none', 'denseMist', 'heavyRain', 'fireEmbers', 'cyberDust'] as WeatherType[]).map((w) => (
                    <button
                      key={w}
                      onClick={() => handleSelectWeather(w)}
                      className={`px-3 py-1 rounded-lg text-xs capitalize cursor-pointer transition-colors ${
                        state.weather === w
                          ? 'bg-cyan-500 text-zinc-950 font-bold'
                          : 'bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-800'
                      }`}
                    >
                      {w}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: SPEECH BLIPS, CUSTOM SFX VOICE & CAPTIONS STUDIO */}
        {activeTab === 'voice' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-3">
              {/* Sound Profile Selector */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-300">Speech Blip Voice & Custom Sound Effect:</span>
                <span className="text-[10px] text-cyan-400 font-mono uppercase">
                  Profile: {state.speechBlipConfig?.soundType?.replace('_', ' ') || 'Slasher Grunt'}
                </span>
              </div>

              {/* Sound Type Buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'slasher_grunt', label: 'Slasher Grunt', desc: 'Throat clicks & rasps' },
                  { id: 'retro_8bit', label: '8-Bit Retro RPG', desc: 'Undertale style beeps' },
                  { id: 'cyber_holo', label: 'Cyber Synth', desc: 'Holographic chirps' },
                  { id: 'animal_speak', label: 'Animal Speak', desc: 'Cartoon pitch chatter' },
                  { id: 'crystal_whisper', label: 'Crystal Rune', desc: 'Ethereal rune chimes' },
                  { id: 'mech_relay', label: 'Mech Relay', desc: 'Pneumatic servo clicks' },
                  { id: 'custom_sound', label: 'Custom SFX File', desc: state.speechBlipConfig?.customAudioFileName || 'Upload audio file' },
                ].map((sfx) => (
                  <button
                    key={sfx.id}
                    onClick={() =>
                      onUpdateState({
                        speechBlipConfig: {
                          ...state.speechBlipConfig,
                          soundType: sfx.id as SpeechBlipType,
                        },
                      })
                    }
                    className={`p-2 rounded-xl border text-left cursor-pointer transition-all ${
                      state.speechBlipConfig?.soundType === sfx.id
                        ? 'bg-zinc-900 border-cyan-400 shadow-lg ring-1 ring-cyan-400/40'
                        : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    <span className="text-xs font-bold text-white block">{sfx.label}</span>
                    <span className="text-[10px] text-zinc-400 line-clamp-1">{sfx.desc}</span>
                  </button>
                ))}

                {/* Custom SFX Upload Button */}
                <button
                  onClick={() => sfxFileInputRef.current?.click()}
                  className="p-2 rounded-xl border border-dashed border-pink-500/50 bg-pink-500/10 hover:bg-pink-500/20 text-pink-300 text-left cursor-pointer transition-all flex flex-col justify-center"
                >
                  <div className="flex items-center gap-1.5 text-xs font-bold">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload SFX</span>
                  </div>
                  <span className="text-[10px] text-pink-400/80">.wav, .mp3, .ogg</span>
                </button>
                <input
                  ref={sfxFileInputRef}
                  type="file"
                  accept="audio/*"
                  onChange={handleCustomSFXUpload}
                  className="hidden"
                />
              </div>

              {/* Speech Blips Modulation Controls */}
              <div className="grid grid-cols-2 gap-3 bg-zinc-900/60 p-3 rounded-xl border border-zinc-800">
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-zinc-400">Blip Pitch</span>
                    <span className="text-cyan-400 font-mono">{(state.speechBlipConfig?.pitch || 1.0).toFixed(2)}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.2"
                    max="2.5"
                    step="0.05"
                    value={state.speechBlipConfig?.pitch || 1.0}
                    onChange={(e) =>
                      onUpdateState({
                        speechBlipConfig: {
                          ...state.speechBlipConfig,
                          pitch: parseFloat(e.target.value),
                        },
                      })
                    }
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-zinc-400">Blip Cadence / Speed</span>
                    <span className="text-cyan-400 font-mono">{state.speechBlipConfig?.speedMs || 75}ms</span>
                  </div>
                  <input
                    type="range"
                    min="35"
                    max="160"
                    step="5"
                    value={state.speechBlipConfig?.speedMs || 75}
                    onChange={(e) =>
                      onUpdateState({
                        speechBlipConfig: {
                          ...state.speechBlipConfig,
                          speedMs: parseInt(e.target.value),
                        },
                      })
                    }
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-zinc-400">Pitch Jitter / Variation</span>
                    <span className="text-pink-400 font-mono">{Math.round((state.speechBlipConfig?.pitchVariation || 0.3) * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={state.speechBlipConfig?.pitchVariation || 0.3}
                    onChange={(e) =>
                      onUpdateState({
                        speechBlipConfig: {
                          ...state.speechBlipConfig,
                          pitchVariation: parseFloat(e.target.value),
                        },
                      })
                    }
                    className="w-full accent-pink-400 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-zinc-400">Blip Volume</span>
                    <span className="text-pink-400 font-mono">{Math.round((state.speechBlipConfig?.volume ?? 0.9) * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.05"
                    value={state.speechBlipConfig?.volume ?? 0.9}
                    onChange={(e) =>
                      onUpdateState({
                        speechBlipConfig: {
                          ...state.speechBlipConfig,
                          volume: parseFloat(e.target.value),
                        },
                      })
                    }
                    className="w-full accent-pink-400 cursor-pointer"
                  />
                </div>
              </div>

              {/* Dialogue Captions Settings */}
              <div className="bg-zinc-900/60 p-3 rounded-xl border border-zinc-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Subtitles className="w-4 h-4 text-yellow-400" />
                    <span className="text-xs font-semibold text-zinc-200">Live Dialogue Captions</span>
                  </div>
                  <label className="flex items-center gap-1.5 text-xs text-zinc-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={state.captionConfig?.enabled ?? true}
                      onChange={(e) =>
                        onUpdateState({
                          captionConfig: {
                            ...state.captionConfig,
                            enabled: e.target.checked,
                          },
                        })
                      }
                      className="rounded bg-zinc-950 border-zinc-700 text-yellow-400 focus:ring-0"
                    />
                    <span>Show Captions</span>
                  </label>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {[
                    { id: 'cinema', label: 'Cinema Subtitles' },
                    { id: 'tiktok_viral', label: 'TikTok Viral Bold' },
                    { id: 'retro_rpg', label: 'Retro RPG Box' },
                    { id: 'horror_whisper', label: 'Horror Whisper' },
                  ].map((style) => (
                    <button
                      key={style.id}
                      onClick={() =>
                        onUpdateState({
                          captionConfig: {
                            ...state.captionConfig,
                            style: style.id as CaptionStyle,
                          },
                        })
                      }
                      className={`px-2.5 py-1 rounded-lg text-xs cursor-pointer transition-colors ${
                        state.captionConfig?.style === style.id
                          ? 'bg-yellow-400 text-zinc-950 font-bold'
                          : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                    >
                      {style.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Test Speech Blips & Lip-Sync Card */}
            <div className="bg-zinc-900/80 rounded-xl p-3 border border-zinc-800 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block mb-1">
                  Live Blips & Captions Test
                </span>
                <textarea
                  rows={3}
                  value={testSpeechText}
                  onChange={(e) => setTestSpeechText(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-xs text-white focus:outline-none focus:border-cyan-400 resize-none"
                />
              </div>

              <div className="space-y-2 mt-3">
                <button
                  onClick={handleTestSpeech}
                  className="w-full py-2 bg-gradient-to-r from-cyan-400 to-pink-500 hover:opacity-95 text-zinc-950 font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-lg"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Play Speech Blips</span>
                </button>

                {state.speechBlipConfig?.customAudioFileName && (
                  <p className="text-[10px] text-pink-400 text-center truncate">
                    Loaded SFX: {state.speechBlipConfig.customAudioFileName}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* AI Auto-Rigging Modal */}
        <AIRiggingModal
          isOpen={isAIRigModalOpen}
          onClose={() => setIsAIRigModalOpen(false)}
          sceneManager={sceneManager}
          aiRigging={state.aiRigging}
          onUpdateAIRigging={(updates) =>
            onUpdateState({
              aiRigging: { ...state.aiRigging, ...updates },
            })
          }
          characterName={state.characterName}
        />

        {/* TAB 5: TIKTOK LIVE & SCREEN AWARENESS */}
        {activeTab === 'tiktok' && (
          <TikTokLiveStudio
            characterName={state.characterName}
            characterRig={sceneManager ? (sceneManager as any).characterRig : null}
            personality={state.personalityPrompt}
            dialogueStyle={state.dialogueStylePrompt}
            voiceProfile={voiceProfile}
            onTriggerAnimation={handleSelectAnimation}
            onTriggerCameraShot={handleSelectCameraShot}
          />
        )}

        {/* TAB 6: CINEMATOGRAPHY & EXPORT */}
        {activeTab === 'camera' && (
          <div className="space-y-4">
            <div>
              <span className="text-xs font-semibold text-zinc-300 block mb-2">Director's Camera Presets:</span>
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                {[
                  { id: 'wide', name: 'Wide Angle' },
                  { id: 'closeUp', name: 'Close-Up Portrait' },
                  { id: 'lowAngle', name: 'Hero Low Angle' },
                  { id: 'dutch', name: 'Action Dutch' },
                  { id: 'orbit', name: '360° Orbit Pan' },
                  { id: 'dolly', name: 'Dolly Tracking' },
                ].map((shot) => (
                  <button
                    key={shot.id}
                    onClick={() => handleSelectCameraShot(shot.id as CameraShot)}
                    className={`py-2 px-2.5 rounded-lg border text-center text-xs cursor-pointer transition-colors ${
                      state.cameraShot === shot.id
                        ? 'bg-cyan-500 text-zinc-950 font-bold'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
                    }`}
                  >
                    {shot.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-zinc-800/80">
              <span className="text-xs text-zinc-400">Click and drag in the 3D viewport to freely orbit the camera. Scroll to zoom.</span>
              <button
                onClick={handleTakeSnapshot}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-semibold border border-zinc-700 flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Camera className="w-3.5 h-3.5 text-cyan-400" />
                <span>Export 4K Snapshot</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
