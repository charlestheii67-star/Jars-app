export type CharacterId = 'jason_slasher' | 'cyber_vtuber' | 'titan_mech' | 'anime_sorcerer' | 'jars_cartoon' | 'custom_imported';

export type EnvironmentBiome = 'crystal_lake' | 'cyberpunk_alley' | 'martian_outpost' | 'ruins_wasteland' | 'soundstage_studio';

export type CameraShot = 'wide' | 'closeUp' | 'dutch' | 'lowAngle' | 'orbit' | 'dolly' | 'freeOrbit';

export type AnimationState =
  | 'idle'
  | 'stalk'
  | 'walk'
  | 'run'
  | 'slash'
  | 'talk'
  | 'dance'
  | 'ragdollShock'
  | 'jump'
  | 'celebrate'
  | 'cower'
  | 'evilLaugh'
  | 'combatCombo'
  | 'ninjaSneak'
  | 'bow';

export type LightingMood = 'normal' | 'bloodMoon' | 'neon' | 'goldenHour' | 'foggyHorror' | 'overcast';

export type WeatherType = 'none' | 'heavyRain' | 'denseMist' | 'fireEmbers' | 'cyberDust' | 'snow';

export type SpeechBlipType =
  | 'slasher_grunt'
  | 'retro_8bit'
  | 'cyber_holo'
  | 'animal_speak'
  | 'crystal_whisper'
  | 'mech_relay'
  | 'custom_sound';

export interface VoiceProfile {
  presetName?: string;
  pitch?: number;
  rate?: number;
  reverb?: number;
  distortion?: number;
  soundType?: SpeechBlipType;
  customAudioBuffer?: AudioBuffer | null;
  [key: string]: any;
}

export interface SpeechBlipConfig {
  soundType: SpeechBlipType;
  pitch: number;          // 0.2 to 2.5
  speedMs: number;        // 35ms to 160ms per syllable
  pitchVariation: number; // 0 to 1
  customAudioBuffer?: AudioBuffer | null;
  customAudioFileName?: string;
  customAudioDuration?: number;
  volume: number;         // 0 to 1
}

export interface AIRiggingData {
  isRigged: boolean;
  jointCount: number;
  symmetryScore: number;
  rigConfidence: number;
  hasJawSocket: boolean;
  showBoneSkeleton: boolean;
  rigPreset: 'humanoid' | 'biped' | 'creature' | 'mechanical';
  statusMessage?: string;
}

export interface CharacterConfig {
  id: CharacterId;
  name: string;
  subtitle: string;
  personality: string;
  dialogueStyle: string;
  defaultAnimation: AnimationState;
  blipConfig: SpeechBlipConfig;
  primaryColor: string;
  accentColor: string;
}

export interface VisemeFrame {
  jawOpen: number;       // 0 to 1
  mouthWide: number;     // 0 to 1
  mouthPucker: number;   // 0 to 1
  chinDrop: number;      // 0 to 1
  eyebrowArch: number;   // -1 to 1
  eyeBlinkLeft: number;  // 0 to 1
  eyeBlinkRight: number; // 0 to 1
  headNod: number;       // -1 to 1
  headTilt: number;      // -1 to 1
}

export interface CinematicSceneScript {
  title: string;
  logline: string;
  dialogue: string;
  cameraShot: CameraShot;
  animation: AnimationState;
  lightingMood: LightingMood;
  soundEffect: 'none' | 'metalSlash' | 'subBassBoom' | 'synthDrone' | 'thunder' | 'kiKiMaMa';
  audienceReaction: string;
}

export interface TikTokGift {
  id: string;
  name: string;
  icon: string;
  coins: number;
  effectType: 'rose' | 'galaxy' | 'lion' | 'crown' | 'fireworks';
}

export interface TikTokComment {
  id: string;
  user: string;
  avatar: string;
  text: string;
  badge?: string;
  isCommand?: boolean;
  commandAction?: string;
  timestamp: number;
}

export type CaptionStyle = 'cinema' | 'tiktok_viral' | 'retro_rpg' | 'horror_whisper';

export interface CaptionConfig {
  enabled: boolean;
  style: CaptionStyle;
  currentText: string;
  speakerName: string;
  visibleText: string;
}

export interface DirectorState {
  characterId: CharacterId;
  characterName: string;
  personalityPrompt: string;
  dialogueStylePrompt: string;
  environment: EnvironmentBiome;
  lightingMood: LightingMood;
  weather: WeatherType;
  cameraShot: CameraShot;
  animationState: AnimationState;
  isPerformingScene: boolean;
  isLiveStreaming: boolean;
  aspectRatio: '16:9' | '9:16';
  isRecordingVideo: boolean;
  audioMuted: boolean;
  speechText: string;
  isSpeaking: boolean;
  clonedVoiceName: string;
  characterScale: number;
  animationSpeed: number;
  speechBlipConfig: SpeechBlipConfig;
  aiRigging: AIRiggingData;
  captionConfig: CaptionConfig;
}
