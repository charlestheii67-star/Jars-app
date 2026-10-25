import * as THREE from 'three';
import { AnimationState, CameraShot, CharacterId, EnvironmentBiome, LightingMood, WeatherType } from '../types';
import { CharacterFactory, CharacterRig } from './CharacterModels';
import { EnvironmentGenerator, EnvironmentScene } from './EnvironmentGenerator';
import { globalAudioVoiceEngine } from './AudioVoiceEngine';

export class SceneManager {
  private container: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;

  // Environment & Lighting
  private currentBiome: EnvironmentBiome = 'crystal_lake';
  private currentMood: LightingMood = 'normal';
  private envScene: EnvironmentScene | null = null;
  private dirLight: THREE.DirectionalLight;
  private hemiLight: THREE.HemisphereLight;
  private rimLight: THREE.PointLight;

  // Character
  private characterRig: CharacterRig | null = null;
  private animationState: AnimationState = 'idle';
  private animTimer = 0;
  private ragdollImpulse = 0;
  private characterScale = 1.0;
  private animationSpeed = 1.0;

  // Weather Particles
  private particles: THREE.Points | null = null;
  private particlePositions: Float32Array | null = null;
  private currentWeather: WeatherType = 'denseMist';

  // Camera Shots & Smoothing
  private currentShot: CameraShot = 'wide';
  private targetCameraPos = new THREE.Vector3(0, 1.8, 4.5);
  private targetLookAt = new THREE.Vector3(0, 1.2, 0);
  private currentLookAt = new THREE.Vector3(0, 1.2, 0);
  private orbitAngle = 0;
  private isUserOrbiting = false;
  private orbitRadius = 4.5;
  private orbitPhi = Math.PI / 2.2;
  private orbitTheta = 0;

  // Screen/Media Recorder
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];

  // Lifecycle
  private isRunning = true;
  private clock = new THREE.Clock();

  constructor(container: HTMLElement) {
    this.container = container;

    // Software WebGL Detection per Three.js skill
    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    this.renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true, // For 4K snapshots and media recording
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = !isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setSize(container.clientWidth, container.clientHeight);

    this.container.appendChild(this.renderer.domElement);

    // Scene & Camera
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 120);
    this.camera.position.set(0, 1.8, 4.5);

    // Standard Lighting Rig
    this.dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    this.dirLight.position.set(10, 16, 10);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 1024;
    this.dirLight.shadow.mapSize.height = 1024;
    this.dirLight.shadow.camera.near = 0.5;
    this.dirLight.shadow.camera.far = 40;
    this.dirLight.shadow.camera.left = -8;
    this.dirLight.shadow.camera.right = 8;
    this.dirLight.shadow.camera.top = 8;
    this.dirLight.shadow.camera.bottom = -8;
    this.scene.add(this.dirLight);

    this.hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x0f172a, 0.6);
    this.scene.add(this.hemiLight);

    this.rimLight = new THREE.PointLight(0x38bdf8, 1.5, 12, 1.2);
    this.rimLight.position.set(0, 2.5, -3);
    this.scene.add(this.rimLight);

    // Initial setup
    this.setupEnvironment('crystal_lake', 'normal');
    this.loadCharacter('jason_slasher');
    this.setupWeatherParticles('denseMist');
    this.setupEventListeners();

    // Start render loop
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  public setupEnvironment(biome: EnvironmentBiome, mood: LightingMood) {
    if (this.envScene) {
      this.scene.remove(this.envScene.group);
    }

    this.currentBiome = biome;
    this.currentMood = mood;
    this.envScene = EnvironmentGenerator.generateEnvironment(biome, mood);
    this.scene.add(this.envScene.group);

    // Update scene fog & lights
    this.scene.fog = new THREE.Fog(this.envScene.fogColor, this.envScene.fogNear, this.envScene.fogFar);
    this.scene.background = this.envScene.fogColor;

    this.dirLight.color.copy(this.envScene.sunColor);
    this.dirLight.intensity = this.envScene.sunIntensity;
    this.dirLight.position.copy(this.envScene.sunPosition);

    this.hemiLight.color.copy(this.envScene.hemiSkyColor);
    this.hemiLight.groundColor.copy(this.envScene.hemiGroundColor);
    this.hemiLight.intensity = this.envScene.hemiIntensity;

    // Set rim light based on biome
    if (biome === 'crystal_lake') {
      this.rimLight.color.setHex(0x60a5fa);
    } else if (biome === 'cyberpunk_alley') {
      this.rimLight.color.setHex(0xec4899);
    } else if (biome === 'martian_outpost') {
      this.rimLight.color.setHex(0xf97316);
    } else {
      this.rimLight.color.setHex(0x38bdf8);
    }
  }

  public loadCharacter(characterId: CharacterId) {
    if (this.characterRig) {
      this.scene.remove(this.characterRig.root);
    }
    this.characterRig = CharacterFactory.createCharacter(characterId);
    this.characterRig.root.scale.setScalar(this.characterScale);
    this.scene.add(this.characterRig.root);
  }

  public setCustomRig(rig: CharacterRig) {
    if (this.characterRig) {
      this.scene.remove(this.characterRig.root);
    }
    this.characterRig = rig;
    this.characterRig.root.scale.setScalar(this.characterScale);
    this.scene.add(this.characterRig.root);
  }

  public setCharacterScale(scale: number) {
    this.characterScale = Math.max(0.2, Math.min(4.0, scale));
    if (this.characterRig) {
      this.characterRig.root.scale.setScalar(this.characterScale);
    }
  }

  public setAnimationSpeed(speed: number) {
    this.animationSpeed = Math.max(0.1, Math.min(3.0, speed));
  }

  public toggleSkeletonVisualizer(show: boolean) {
    if (this.characterRig) {
      const vis = this.characterRig.root.getObjectByName('AIRig_SkeletonVisualizer');
      if (vis) {
        vis.visible = show;
      }
    }
  }

  public setAnimationState(state: AnimationState) {
    this.animationState = state;
    if (state === 'ragdollShock') {
      this.ragdollImpulse = 1.0;
    }
  }

  public setCameraShot(shot: CameraShot) {
    this.currentShot = shot;
    switch (shot) {
      case 'closeUp':
        this.targetCameraPos.set(0, 1.85, 1.25);
        this.targetLookAt.set(0, 1.8, 0);
        break;
      case 'lowAngle':
        this.targetCameraPos.set(0.6, 0.35, 2.2);
        this.targetLookAt.set(0, 1.6, 0);
        break;
      case 'dutch':
        this.targetCameraPos.set(-1.4, 1.2, 2.4);
        this.targetLookAt.set(0, 1.4, 0);
        this.camera.rotation.z = 0.15;
        break;
      case 'dolly':
        this.targetCameraPos.set(0, 1.5, 3.8);
        this.targetLookAt.set(0, 1.2, 0);
        break;
      case 'orbit':
        this.targetLookAt.set(0, 1.3, 0);
        break;
      case 'wide':
      default:
        this.targetCameraPos.set(0, 1.7, 4.2);
        this.targetLookAt.set(0, 1.2, 0);
        break;
    }
  }

  public setupWeatherParticles(type: WeatherType) {
    if (this.particles) {
      this.scene.remove(this.particles);
      this.particles = null;
    }

    this.currentWeather = type;
    if (type === 'none') return;

    const count = 1200;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 28;
      positions[i * 3 + 1] = Math.random() * 16;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 28;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.particlePositions = positions;

    let pColor = 0xa5b4fc;
    let pSize = 0.08;

    if (type === 'fireEmbers') {
      pColor = 0xf97316;
      pSize = 0.12;
    } else if (type === 'heavyRain') {
      pColor = 0x93c5fd;
      pSize = 0.06;
    } else if (type === 'denseMist') {
      pColor = 0xe2e8f0;
      pSize = 0.18;
    } else if (type === 'cyberDust') {
      pColor = 0x06b6d4;
      pSize = 0.1;
    }

    const mat = new THREE.PointsMaterial({
      color: pColor,
      size: pSize,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.particles = new THREE.Points(geo, mat);
    this.scene.add(this.particles);
  }

  /**
   * Procedural Kinematics & Secondary Joint Physics
   */
  private updateCharacterAnimation(delta: number) {
    if (!this.characterRig) return;
    this.animTimer += delta * this.animationSpeed;
    const t = this.animTimer;
    const rig = this.characterRig;

    // Apply Real-time Viseme Lip Sync from Audio Engine
    const viseme = globalAudioVoiceEngine.update(delta);
    CharacterFactory.applyVisemeToRig(rig, viseme);

    // Base organic chest breathing
    const breath = Math.sin(t * 1.8) * 0.03;
    rig.chest.scale.set(1.0 + breath, 1.0 + breath * 0.5, 1.0 + breath);

    switch (this.animationState) {
      case 'idle': {
        // Natural subtle weight shift
        const sway = Math.sin(t * 1.2) * 0.03;
        rig.pelvis.position.y = 1.1 + Math.sin(t * 2.4) * 0.01;
        rig.spine.rotation.z = THREE.MathUtils.lerp(rig.spine.rotation.z, sway, 0.1);
        rig.spine.rotation.x = THREE.MathUtils.lerp(rig.spine.rotation.x, 0.04, 0.1);

        // Arms relax naturally at sides
        rig.leftArm.rotation.x = THREE.MathUtils.lerp(rig.leftArm.rotation.x, 0.1 + sway * 0.5, 0.1);
        rig.rightArm.rotation.x = THREE.MathUtils.lerp(rig.rightArm.rotation.x, -0.15, 0.1);
        rig.rightForearm.rotation.x = THREE.MathUtils.lerp(rig.rightForearm.rotation.x, -0.4, 0.1);
        break;
      }

      case 'stalk': {
        // Heavy, deliberate, menacing creep (Jason archetype)
        const stalkCycle = Math.sin(t * 2.0);
        rig.pelvis.position.y = 1.08 + Math.abs(stalkCycle) * 0.03;
        rig.spine.rotation.x = 0.12; // Forward predatory lean
        rig.spine.rotation.y = stalkCycle * 0.05;

        // Slow heavy arm posture with machete angled
        rig.leftArm.rotation.x = -0.2 + stalkCycle * 0.15;
        rig.rightArm.rotation.x = 0.35 + Math.sin(t * 1.0) * 0.1;
        rig.rightForearm.rotation.x = -0.7;

        // Legs step forward slowly
        rig.leftThigh.rotation.x = stalkCycle * 0.35;
        rig.rightThigh.rotation.x = -stalkCycle * 0.35;
        break;
      }

      case 'walk': {
        const walkCycle = Math.sin(t * 4.0);
        const cosWalk = Math.cos(t * 4.0);
        rig.pelvis.position.y = 1.1 + Math.abs(cosWalk) * 0.04;
        rig.spine.rotation.y = walkCycle * 0.08;

        rig.leftThigh.rotation.x = walkCycle * 0.55;
        rig.rightThigh.rotation.x = -walkCycle * 0.55;
        rig.leftShin.rotation.x = Math.max(0, -walkCycle * 0.6);
        rig.rightShin.rotation.x = Math.max(0, walkCycle * 0.6);

        rig.leftArm.rotation.x = -walkCycle * 0.45;
        rig.rightArm.rotation.x = walkCycle * 0.35;
        break;
      }

      case 'run': {
        // High speed athletic sprint with strong forward lean
        const runCycle = Math.sin(t * 8.0);
        const cosRun = Math.cos(t * 8.0);
        rig.pelvis.position.y = 1.1 + Math.abs(cosRun) * 0.12;
        rig.spine.rotation.x = 0.32; // Aggressive forward tilt
        rig.spine.rotation.y = runCycle * 0.15;

        rig.leftThigh.rotation.x = runCycle * 1.0;
        rig.rightThigh.rotation.x = -runCycle * 1.0;
        rig.leftShin.rotation.x = Math.max(0, -runCycle * 1.1);
        rig.rightShin.rotation.x = Math.max(0, runCycle * 1.1);

        rig.leftArm.rotation.x = -runCycle * 1.1;
        rig.rightArm.rotation.x = runCycle * 1.1;
        rig.leftForearm.rotation.x = -1.2;
        rig.rightForearm.rotation.x = -1.2;
        break;
      }

      case 'slash': {
        // Explosive Machete / Weapon Attack with windup and impact
        const attackCycle = (t * 2.2) % 2.0;
        if (attackCycle < 0.6) {
          // Windup raise high
          rig.spine.rotation.x = -0.15;
          rig.spine.rotation.y = -0.3;
          rig.rightArm.rotation.x = 1.6; // Raise arm up
          rig.rightForearm.rotation.x = -1.2;
          rig.rightHand.rotation.z = 0.4;
        } else if (attackCycle < 1.0) {
          // Explosive downward slice!
          rig.spine.rotation.x = 0.35;
          rig.spine.rotation.y = 0.25;
          rig.rightArm.rotation.x = -0.9;
          rig.rightForearm.rotation.x = -0.2;
          this.camera.position.x += (Math.random() - 0.5) * 0.04;
        } else {
          // Recover to tense posture
          rig.spine.rotation.x = THREE.MathUtils.lerp(rig.spine.rotation.x, 0.05, 0.1);
          rig.rightArm.rotation.x = THREE.MathUtils.lerp(rig.rightArm.rotation.x, -0.2, 0.1);
        }
        break;
      }

      case 'combatCombo': {
        // 3-Hit Combo Attack: Cross Slash -> Backhand Cleave -> Heavy Chop
        const comboTime = (t * 2.5) % 3.0;
        if (comboTime < 1.0) {
          // Hit 1: Horizontal Cleave
          const p = comboTime;
          rig.spine.rotation.y = THREE.MathUtils.lerp(-0.4, 0.6, p);
          rig.rightArm.rotation.x = 0.8;
          rig.rightArm.rotation.z = THREE.MathUtils.lerp(0.6, -0.8, p);
        } else if (comboTime < 2.0) {
          // Hit 2: Backhand Upward Slice
          const p = comboTime - 1.0;
          rig.spine.rotation.y = THREE.MathUtils.lerp(0.5, -0.5, p);
          rig.rightArm.rotation.x = THREE.MathUtils.lerp(-0.5, 1.2, p);
          rig.rightForearm.rotation.x = -0.6;
        } else {
          // Hit 3: Jump & Overhead Execution
          const p = comboTime - 2.0;
          if (p < 0.4) {
            rig.pelvis.position.y = 1.4; // Jump up
            rig.rightArm.rotation.x = 2.2;
            rig.leftArm.rotation.x = 1.8;
          } else {
            rig.pelvis.position.y = 0.9; // Slam down
            rig.rightArm.rotation.x = -0.8;
            rig.leftArm.rotation.x = -0.6;
            this.camera.position.y += (Math.random() - 0.5) * 0.05;
          }
        }
        break;
      }

      case 'jump': {
        // Dynamic Athletic Jump with Windup and Ground Impact
        const jumpCycle = (t * 2.0) % 2.0;
        if (jumpCycle < 0.4) {
          // Crouch anticipation
          rig.pelvis.position.y = 0.85;
          rig.leftThigh.rotation.x = 0.6;
          rig.rightThigh.rotation.x = 0.6;
          rig.spine.rotation.x = 0.2;
          rig.leftArm.rotation.x = -0.6;
          rig.rightArm.rotation.x = -0.6;
        } else if (jumpCycle < 1.2) {
          // In the air! Peak height
          const airPhase = (jumpCycle - 0.4) / 0.8;
          const arc = Math.sin(airPhase * Math.PI);
          rig.pelvis.position.y = 1.1 + arc * 1.2;
          rig.leftThigh.rotation.x = -0.3;
          rig.rightThigh.rotation.x = 0.4;
          rig.leftArm.rotation.x = 1.6;
          rig.rightArm.rotation.x = 1.6;
        } else {
          // Landing impact
          rig.pelvis.position.y = 0.9;
          rig.leftThigh.rotation.x = 0.4;
          rig.rightThigh.rotation.x = 0.4;
          this.camera.position.y += (Math.random() - 0.5) * 0.03;
        }
        break;
      }

      case 'celebrate': {
        // Hype TikTok Stream Celebration / Victory Cheer
        const cheerPulse = Math.sin(t * 6.0);
        rig.pelvis.position.y = 1.1 + Math.abs(cheerPulse) * 0.1;
        rig.spine.rotation.y = Math.sin(t * 3.0) * 0.2;

        rig.rightArm.rotation.x = 2.2 + cheerPulse * 0.3;
        rig.leftArm.rotation.x = 2.2 - cheerPulse * 0.3;
        rig.rightForearm.rotation.x = -0.5;
        rig.leftForearm.rotation.x = -0.5;
        break;
      }

      case 'cower': {
        // Fearful defense / cowering in terror
        const shudder = Math.sin(t * 18.0) * 0.04;
        rig.pelvis.position.y = 0.95;
        rig.spine.rotation.x = 0.25 + shudder;
        rig.head.rotation.x = 0.3;

        rig.leftArm.rotation.x = 1.5;
        rig.rightArm.rotation.x = 1.5;
        rig.leftForearm.rotation.z = -1.1;
        rig.rightForearm.rotation.z = 1.1;
        break;
      }

      case 'evilLaugh': {
        // Menacing shoulder-shuddering evil laugh
        const laugh = Math.sin(t * 14.0) * 0.08;
        rig.spine.rotation.x = -0.15 + laugh;
        rig.head.rotation.x = -0.35 + laugh * 0.5;
        rig.head.rotation.z = Math.sin(t * 4.0) * 0.06;

        rig.leftArm.rotation.x = 0.5;
        rig.rightArm.rotation.x = 0.5;
        rig.leftForearm.rotation.x = -0.8;
        rig.rightForearm.rotation.x = -0.8;
        break;
      }

      case 'ninjaSneak': {
        // Low stealth crouch walk
        const sneakCycle = Math.sin(t * 3.0);
        rig.pelvis.position.y = 0.78 + Math.abs(sneakCycle) * 0.03;
        rig.spine.rotation.x = 0.45;
        rig.leftThigh.rotation.x = sneakCycle * 0.6;
        rig.rightThigh.rotation.x = -sneakCycle * 0.6;
        rig.leftArm.rotation.x = -sneakCycle * 0.4;
        rig.rightArm.rotation.x = sneakCycle * 0.4;
        break;
      }

      case 'bow': {
        // Elegant theatrical bow
        const bowCycle = Math.sin(t * 1.2);
        rig.spine.rotation.x = 0.65;
        rig.head.rotation.x = 0.2;
        rig.rightArm.rotation.x = 0.8;
        rig.rightForearm.rotation.z = 0.8; // Hand over heart
        rig.leftArm.rotation.x = -0.4; // Arm extended behind
        break;
      }

      case 'talk': {
        // Expressive dialogue gesturing
        const talkPulse = Math.sin(t * 3.5);
        rig.spine.rotation.x = 0.06;
        rig.leftArm.rotation.x = 0.4 + talkPulse * 0.2;
        rig.leftForearm.rotation.x = -0.6 + talkPulse * 0.3;
        rig.rightArm.rotation.x = 0.3 - talkPulse * 0.15;
        rig.rightForearm.rotation.x = -0.5 - talkPulse * 0.2;
        break;
      }

      case 'dance': {
        // Energetic rhythm groove for TikTok hype moments
        const beat = Math.sin(t * 6.0);
        rig.pelvis.position.y = 1.1 + Math.abs(beat) * 0.08;
        rig.spine.rotation.z = beat * 0.2;
        rig.spine.rotation.y = Math.cos(t * 3.0) * 0.25;

        rig.leftArm.rotation.x = 1.4 + beat * 0.3;
        rig.rightArm.rotation.x = 1.4 - beat * 0.3;
        rig.leftForearm.rotation.z = 0.6;
        rig.rightForearm.rotation.z = -0.6;
        break;
      }

      case 'ragdollShock': {
        // Knockback physics impulse
        if (this.ragdollImpulse > 0) {
          rig.spine.rotation.x = -0.45 * this.ragdollImpulse;
          rig.pelvis.position.z = -0.3 * this.ragdollImpulse;
          rig.head.rotation.x = 0.5 * this.ragdollImpulse;
          this.ragdollImpulse -= delta * 1.5;
        } else {
          this.animationState = 'idle';
        }
        break;
      }
    }

    // Secondary Cloth / Coat-Tail Spring Physics
    if (rig.secondaryCloth) {
      const clothLag = Math.sin(t * 3.0) * 0.15 + (rig.spine.rotation.x * 0.5);
      rig.secondaryCloth.rotation.x = THREE.MathUtils.lerp(rig.secondaryCloth.rotation.x, clothLag, 0.15);
    }
  }

  /**
   * Weather Particle Loop
   */
  private updateWeather(delta: number) {
    if (!this.particles || !this.particlePositions) return;

    const positions = this.particlePositions;
    const count = positions.length / 3;

    for (let i = 0; i < count; i++) {
      const yIdx = i * 3 + 1;
      const xIdx = i * 3;

      if (this.currentWeather === 'heavyRain') {
        positions[yIdx] -= delta * 18;
      } else if (this.currentWeather === 'fireEmbers') {
        positions[yIdx] += delta * 1.8;
        positions[xIdx] += Math.sin(this.animTimer + i) * delta * 0.8;
      } else {
        // Mist / dust
        positions[yIdx] -= delta * 0.8;
        positions[xIdx] += Math.cos(this.animTimer * 0.5 + i) * delta * 0.4;
      }

      if (positions[yIdx] < 0) {
        positions[yIdx] = 16;
      } else if (positions[yIdx] > 16) {
        positions[yIdx] = 0;
      }
    }

    this.particles.geometry.attributes.position.needsUpdate = true;
  }

  /**
   * Smooth Camera Tracking
   */
  private updateCamera(delta: number) {
    if (this.currentShot === 'orbit') {
      this.orbitAngle += delta * 0.4;
      const ox = Math.sin(this.orbitAngle) * 3.8;
      const oz = Math.cos(this.orbitAngle) * 3.8;
      this.targetCameraPos.set(ox, 1.7, oz);
    } else if (this.isUserOrbiting) {
      const x = this.orbitRadius * Math.sin(this.orbitPhi) * Math.sin(this.orbitTheta);
      const y = this.orbitRadius * Math.cos(this.orbitPhi) + 1.2;
      const z = this.orbitRadius * Math.sin(this.orbitPhi) * Math.cos(this.orbitTheta);
      this.targetCameraPos.set(x, y, z);
    }

    // Exponential Damping Camera Interpolation: 1 - Math.exp(-k * dt)
    const factor = 1.0 - Math.exp(-8.0 * delta);
    this.camera.position.lerp(this.targetCameraPos, factor);
    this.currentLookAt.lerp(this.targetLookAt, factor);
    this.camera.lookAt(this.currentLookAt);
  }

  private animate() {
    if (!this.isRunning) return;
    requestAnimationFrame(this.animate);

    const delta = Math.min(this.clock.getDelta(), 0.05);

    // Update animated environment props
    if (this.envScene) {
      for (const fn of this.envScene.animatedElements) {
        fn(this.animTimer);
      }
    }

    this.updateCharacterAnimation(delta);
    this.updateWeather(delta);
    this.updateCamera(delta);

    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Video Recorder for Cinematic Clips & Live Stream captures
   */
  public startRecording(onChunkReady?: (blob: Blob) => void): boolean {
    try {
      const canvas = this.renderer.domElement;
      const stream = canvas.captureStream(60);
      this.recordedChunks = [];

      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9',
      });

      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          this.recordedChunks.push(e.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        const fullBlob = new Blob(this.recordedChunks, { type: 'video/webm' });
        if (onChunkReady) onChunkReady(fullBlob);
      };

      this.mediaRecorder.start();
      return true;
    } catch (e) {
      console.error('MediaRecorder error:', e);
      return false;
    }
  }

  public stopRecording(): Blob | null {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
      return new Blob(this.recordedChunks, { type: 'video/webm' });
    }
    return null;
  }

  public captureSnapshot(): string {
    return this.renderer.domElement.toDataURL('image/jpeg', 0.95);
  }

  public resize(width: number, height: number) {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  private setupEventListeners() {
    let isDragging = false;
    let prevX = 0;
    let prevY = 0;

    const el = this.renderer.domElement;

    el.addEventListener('mousedown', (e) => {
      isDragging = true;
      this.isUserOrbiting = true;
      prevX = e.clientX;
      prevY = e.clientY;
    });

    window.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const dx = e.clientX - prevX;
      const dy = e.clientY - prevY;
      prevX = e.clientX;
      prevY = e.clientY;

      this.orbitTheta -= dx * 0.008;
      this.orbitPhi = Math.max(0.2, Math.min(Math.PI / 1.8, this.orbitPhi - dy * 0.008));
    });

    window.addEventListener('mouseup', () => {
      isDragging = false;
    });

    el.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.orbitRadius = Math.max(1.2, Math.min(10.0, this.orbitRadius + e.deltaY * 0.005));
    }, { passive: false });
  }

  public destroy() {
    this.isRunning = false;
    this.renderer.dispose();
    if (this.container.contains(this.renderer.domElement)) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
