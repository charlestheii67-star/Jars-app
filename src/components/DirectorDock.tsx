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
} from 'lucide-react';
import {
  AnimationState,
  CameraShot,
  CharacterConfig,
  CharacterId,
  CinematicSceneScript,
  DirectorState,
  EnvironmentBiome,
  LightingMood,
  VoiceProfile,
  WeatherType,
} from '../types';
import { SceneManager } from '../engine/SceneManager';
import { ModelImporter } from '../engine/ModelImporter';
import { globalAudioVoiceEngine } from '../engine/AudioVoiceEngine';
import { TikTokLiveStudio } from './TikTokLiveStudio';

interface DirectorDockProps {
  sceneManager: SceneManager | null;
  state: DirectorState;
  onUpdateState: (updates: Partial<DirectorState>) => void;
  voiceProfile: VoiceProfile;
  onUpdateVoiceProfile: (updates: Partial<VoiceProfile>) => void;
}

const PRESET_CHARACTERS: CharacterConfig[] = [
  {
    id: 'jason_slasher',
    name: 'The Lake Revenant',
    subtitle: 'Immortal Slasher Archetype',
    personality: 'Silent, relentless, terrifying, immortal predator devoted to Camp Crystal Lake',
    dialogueStyle: 'Deep, guttural, threatening whispers with long pauses and cold finality',
    defaultAnimation: 'stalk',
    voiceProfile: {
      presetName: 'Slasher Growl',
      pitch: 0.35,
      rate: 0.75,
      reverb: 0.8,
      distortion: 0.6,
      formantShift: -8,
      voiceGender: 'monster',
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
    voiceProfile: {
      presetName: 'Cyber V-Tuber',
      pitch: 1.45,
      rate: 1.15,
      reverb: 0.3,
      distortion: 0.1,
      formantShift: 4,
      voiceGender: 'female',
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
    voiceProfile: {
      presetName: 'Titan Synthesizer',
      pitch: 0.6,
      rate: 0.9,
      reverb: 0.5,
      distortion: 0.7,
      formantShift: -5,
      voiceGender: 'robot',
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
    voiceProfile: {
      presetName: 'Arcane Voice',
      pitch: 1.1,
      rate: 0.95,
      reverb: 0.7,
      distortion: 0.05,
      formantShift: 2,
      voiceGender: 'male',
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
    voiceProfile: {
      presetName: 'Cartoon Pitch',
      pitch: 1.7,
      rate: 1.3,
      reverb: 0.2,
      distortion: 0.0,
      formantShift: 8,
      voiceGender: 'male',
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

  // Custom 3D Model file input ref
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [importedModelName, setImportedModelName] = useState<string | null>(null);

  // Voice recording simulation
  const [isRecordingVoiceSample, setIsRecordingVoiceSample] = useState(false);
  const [customVoiceName, setCustomVoiceName] = useState('My Cloned Voice');
  const [testSpeechText, setTestSpeechText] = useState('Welcome to Jars 3D Studio. Every character speaks with real-time lip-sync and physics motion.');

  // Handle Character Change
  const handleSelectCharacter = (char: CharacterConfig) => {
    onUpdateState({
      characterId: char.id,
      characterName: char.name,
      personalityPrompt: char.personality,
      dialogueStylePrompt: char.dialogueStyle,
      animationState: char.defaultAnimation,
    });
    onUpdateVoiceProfile(char.voiceProfile);

    if (sceneManager) {
      sceneManager.loadCharacter(char.id);
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

  // Perform Cinematic Scene
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

    // 4. Voice synthesis & real-time lip sync
    globalAudioVoiceEngine.speak(currentScript.dialogue, voiceProfile, () => {
      onUpdateState({ isPerformingScene: false });
      handleSelectAnimation('idle');
    });
  };

  // Test Speech Synthesis
  const handleTestSpeech = () => {
    if (sceneManager) {
      sceneManager.setAnimationState('talk');
    }
    globalAudioVoiceEngine.speak(testSpeechText, voiceProfile, () => {
      if (sceneManager) {
        sceneManager.setAnimationState('idle');
      }
    });
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
            <Mic className="w-3.5 h-3.5" />
            <span>Voice & Lip-Sync</span>
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

            {/* Animation Poses */}
            <div className="pt-2">
              <span className="text-[11px] font-semibold text-zinc-400 block mb-2">Kinematic Animation State:</span>
              <div className="flex flex-wrap gap-1.5">
                {(['idle', 'stalk', 'walk', 'slash', 'talk', 'dance', 'ragdollShock'] as AnimationState[]).map((anim) => (
                  <button
                    key={anim}
                    onClick={() => handleSelectAnimation(anim)}
                    className={`px-3 py-1 rounded-lg text-xs capitalize cursor-pointer transition-colors ${
                      state.animationState === anim
                        ? 'bg-cyan-500 text-zinc-950 font-bold'
                        : 'bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-800'
                    }`}
                  >
                    {anim === 'ragdollShock' ? 'Physics Ragdoll' : anim}
                  </button>
                ))}
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

        {/* TAB 4: AI VOICE CLONING & LIP-SYNC STUDIO */}
        {activeTab === 'voice' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-300">Voice Synthesis & Cloning DSP:</span>
                <span className="text-[10px] text-cyan-400 font-mono">Active Profile: {voiceProfile.presetName}</span>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-zinc-900/60 p-3 rounded-xl border border-zinc-800">
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-zinc-400">Voice Pitch</span>
                    <span className="text-cyan-400 font-mono">{voiceProfile.pitch.toFixed(2)}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.2"
                    max="2.0"
                    step="0.05"
                    value={voiceProfile.pitch}
                    onChange={(e) => onUpdateVoiceProfile({ pitch: parseFloat(e.target.value) })}
                    className="w-full accent-cyan-400"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-zinc-400">Speech Rate</span>
                    <span className="text-cyan-400 font-mono">{voiceProfile.rate.toFixed(2)}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="1.8"
                    step="0.05"
                    value={voiceProfile.rate}
                    onChange={(e) => onUpdateVoiceProfile({ rate: parseFloat(e.target.value) })}
                    className="w-full accent-cyan-400"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-zinc-400">Harmonic Distortion</span>
                    <span className="text-pink-400 font-mono">{Math.round(voiceProfile.distortion * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={voiceProfile.distortion}
                    onChange={(e) => onUpdateVoiceProfile({ distortion: parseFloat(e.target.value) })}
                    className="w-full accent-pink-400"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-zinc-400">Acoustic Reverb</span>
                    <span className="text-pink-400 font-mono">{Math.round(voiceProfile.reverb * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={voiceProfile.reverb}
                    onChange={(e) => onUpdateVoiceProfile({ reverb: parseFloat(e.target.value) })}
                    className="w-full accent-pink-400"
                  />
                </div>
              </div>

              {/* Sound Effects Player */}
              <div>
                <span className="text-[11px] font-semibold text-zinc-400 block mb-1.5">Cinematic Audio Stingers:</span>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'metalSlash', label: 'Horror Machete Slash' },
                    { id: 'subBassBoom', label: 'Sub-Bass Movie Boom' },
                    { id: 'synthDrone', label: 'Dark Synth Drone' },
                    { id: 'thunder', label: 'Thunder Strike' },
                    { id: 'kiKiMaMa', label: 'Ki-Ki-Ki, Ma-Ma-Ma' },
                  ].map((sfx) => (
                    <button
                      key={sfx.id}
                      onClick={() => globalAudioVoiceEngine.playSoundEffect(sfx.id as any)}
                      className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded text-xs text-zinc-300 hover:text-white transition-colors cursor-pointer"
                    >
                      {sfx.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Test Speech Synthesizer & Lip-Sync Card */}
            <div className="bg-zinc-900/80 rounded-xl p-3 border border-zinc-800 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block mb-1">Live Lip-Sync Test</span>
                <textarea
                  rows={3}
                  value={testSpeechText}
                  onChange={(e) => setTestSpeechText(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-xs text-white focus:outline-none focus:border-cyan-400 resize-none"
                />
              </div>

              <button
                onClick={handleTestSpeech}
                className="mt-3 w-full py-2 bg-gradient-to-r from-cyan-400 to-pink-500 hover:opacity-95 text-zinc-950 font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-lg"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>Speak with Real-Time Lip-Sync</span>
              </button>
            </div>
          </div>
        )}

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
