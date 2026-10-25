export type CharacterId = 'jason_slasher' | 'cyber_vtuber' | 'titan_mech' | 'anime_sorcerer' | 'jars_cartoon' | 'custom_imported';

export type EnvironmentBiome = 'crystal_lake' | 'cyberpunk_alley' | 'martian_outpost' | 'ruins_wasteland' | 'soundstage_studio';

export type CameraShot = 'wide' | 'closeUp' | 'dutch' | 'lowAngle' | 'orbit' | 'dolly' | 'freeOrbit';

export type AnimationState = 'idle' | 'stalk' | 'walk' | 'slash' | 'talk' | 'dance' | 'ragdollShock';

export type LightingMood = 'normal' | 'bloodMoon' | 'neon' | 'goldenHour' | 'foggyHorror' | 'overcast';

export type WeatherType = 'none' | 'heavyRain' | 'denseMist' | 'fireEmbers' | 'cyberDust' | 'snow';

export interface CharacterConfig {
  id: CharacterId;
  name: string;
  subtitle: string;
  personality: string;
  dialogueStyle: string;
  defaultAnimation: AnimationState;
  voiceProfile: VoiceProfile;
  primaryColor: string;
  accentColor: string;
}

export interface VoiceProfile {
  presetName: string;
  pitch: number; // 0.5 to 2.0
  rate: number;  // 0.5 to 2.0
  reverb: number; // 0 to 1
  distortion: number; // 0 to 1
  formantShift: number; // -12 to +12 semitones
  voiceGender: 'male' | 'female' | 'monster' | 'robot';
  sampleAudioUrl?: string;
  isCloned?: boolean;
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
}
