import * as THREE from 'three';
import { CharacterId, VisemeFrame } from '../types';
import { ProceduralTextures } from './ProceduralTextures';

export interface CharacterRig {
  root: THREE.Group;
  pelvis: THREE.Group;
  spine: THREE.Group;
  chest: THREE.Group;
  neck: THREE.Group;
  head: THREE.Group;
  jaw: THREE.Group;
  leftEye: THREE.Mesh | null;
  rightEye: THREE.Mesh | null;
  mouthMesh: THREE.Mesh | null;
  leftShoulder: THREE.Group;
  leftArm: THREE.Group;
  leftForearm: THREE.Group;
  leftHand: THREE.Group;
  rightShoulder: THREE.Group;
  rightArm: THREE.Group;
  rightForearm: THREE.Group;
  rightHand: THREE.Group;
  weaponProp: THREE.Group | null;
  leftThigh: THREE.Group;
  leftShin: THREE.Group;
  leftFoot: THREE.Group;
  rightThigh: THREE.Group;
  rightShin: THREE.Group;
  rightFoot: THREE.Group;
  secondaryCloth: THREE.Group | null;
  characterId: CharacterId;
  baseHeight: number;
}

export class CharacterFactory {
  /**
   * Builds high-fidelity composite 3D character with articulated joints and facial lip-sync rig
   */
  static createCharacter(characterId: CharacterId): CharacterRig {
    switch (characterId) {
      case 'jason_slasher':
        return this.createSlasherRevenant();
      case 'cyber_vtuber':
        return this.createCyberVTuber();
      case 'titan_mech':
        return this.createTitanMech();
      case 'anime_sorcerer':
        return this.createAnimeSorcerer();
      case 'jars_cartoon':
      default:
        return this.createJarsCartoon();
    }
  }

  /**
   * The Slasher Revenant (Jason Archetype)
   * Towering silhouette, weathered field coat, iconic hockey mask with articulated jaw, and blood-rusted machete
   */
  private static createSlasherRevenant(): CharacterRig {
    const root = new THREE.Group();
    root.name = 'Jason_Slasher_Root';

    // Materials with contrasting roughness/metalness
    const coatMat = new THREE.MeshStandardMaterial({
      color: 0x222a24, // Dark mossy field jacket
      roughness: 0.85,
      metalness: 0.1,
    });
    const undershirtMat = new THREE.MeshStandardMaterial({
      color: 0x16181b,
      roughness: 0.9,
      metalness: 0.05,
    });
    const leatherMat = new THREE.MeshStandardMaterial({
      color: 0x1d1712, // Dark weathered boots/gloves
      roughness: 0.7,
      metalness: 0.2,
    });
    const denimMat = new THREE.MeshStandardMaterial({
      color: 0x1e242c, // Muddy work trousers
      roughness: 0.95,
      metalness: 0.05,
    });
    const skinGargoyleMat = new THREE.MeshStandardMaterial({
      color: 0x474944, // Ashen decayed skin
      roughness: 0.8,
      metalness: 0.1,
    });
    const maskMat = new THREE.MeshStandardMaterial({
      map: ProceduralTextures.getHockeyMaskTexture(),
      roughness: 0.45,
      metalness: 0.15,
    });
    const macheteSteelMat = new THREE.MeshStandardMaterial({
      map: ProceduralTextures.getRustedSteelTexture(),
      roughness: 0.35,
      metalness: 0.85,
    });

    // 1. Pelvis (Centered at y = 1.1)
    const pelvis = new THREE.Group();
    pelvis.position.y = 1.1;
    root.add(pelvis);

    const pelvisMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.22, 0.22, 8), denimMat);
    pelvisMesh.castShadow = true;
    pelvisMesh.receiveShadow = true;
    pelvis.add(pelvisMesh);

    // 2. Spine & Massive Chest
    const spine = new THREE.Group();
    spine.position.y = 0.12;
    pelvis.add(spine);

    const chest = new THREE.Group();
    chest.position.y = 0.28;
    spine.add(chest);

    // Broad heavy upper torso (Jacket over layered work shirt)
    const chestMesh = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.46, 0.34), coatMat);
    chestMesh.position.y = 0.15;
    chestMesh.castShadow = true;
    chestMesh.receiveShadow = true;
    chest.add(chestMesh);

    // Collar / lapels
    const collarMesh = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.12, 0.36), coatMat);
    collarMesh.position.y = 0.4;
    chest.add(collarMesh);

    // Torn undershirt opening
    const chestInner = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 0.32), undershirtMat);
    chestInner.position.set(0, 0.16, 0.175);
    chest.add(chestInner);

    // 3. Neck & Weathered Head
    const neck = new THREE.Group();
    neck.position.y = 0.44;
    chest.add(neck);

    const neckMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.14, 8), skinGargoyleMat);
    neck.add(neckMesh);

    const head = new THREE.Group();
    head.position.y = 0.16;
    neck.add(head);

    // Decayed cranium
    const craniumMesh = new THREE.Mesh(new THREE.SphereGeometry(0.19, 12, 10), skinGargoyleMat);
    craniumMesh.scale.set(0.9, 1.1, 1.0);
    craniumMesh.castShadow = true;
    head.add(craniumMesh);

    // Mask plate (Upper half)
    const maskUpper = new THREE.Mesh(new THREE.SphereGeometry(0.21, 16, 12, 0, Math.PI), maskMat);
    maskUpper.rotation.y = -Math.PI / 2;
    maskUpper.position.set(0, 0.04, 0.04);
    maskUpper.castShadow = true;
    head.add(maskUpper);

    // Dark void eyes behind mask
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x050505 });
    const leftEye = new THREE.Mesh(new THREE.CircleGeometry(0.032, 8), eyeMat);
    leftEye.position.set(-0.065, 0.05, 0.22);
    head.add(leftEye);

    const rightEye = new THREE.Mesh(new THREE.CircleGeometry(0.032, 8), eyeMat);
    rightEye.position.set(0.065, 0.05, 0.22);
    head.add(rightEye);

    // Mask straps
    const strapMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
    const topStrap = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.02, 0.38), strapMat);
    topStrap.position.set(0, 0.19, 0);
    head.add(topStrap);

    // Articulated Jaw (Lower face and chin that drops down for lip-sync speech)
    const jaw = new THREE.Group();
    jaw.position.set(0, -0.06, 0.06);
    head.add(jaw);

    const jawMesh = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.12, 0.18), maskMat);
    jawMesh.position.set(0, -0.06, 0.05);
    jawMesh.castShadow = true;
    jaw.add(jawMesh);

    // Mouth cavity inside
    const mouthInner = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.04, 0.02), new THREE.MeshBasicMaterial({ color: 0x1a0505 }));
    mouthInner.position.set(0, 0.01, 0.13);
    jaw.add(mouthInner);

    // 4. Arms & Huge Shoulders
    // Left Arm
    const leftShoulder = new THREE.Group();
    leftShoulder.position.set(-0.38, 0.35, 0);
    chest.add(leftShoulder);

    const leftShoulderPad = new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 8), coatMat);
    leftShoulder.add(leftShoulderPad);

    const leftArm = new THREE.Group();
    leftArm.position.y = -0.05;
    leftShoulder.add(leftArm);

    const leftBicep = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.09, 0.32, 8), coatMat);
    leftBicep.position.y = -0.16;
    leftBicep.castShadow = true;
    leftArm.add(leftBicep);

    const leftForearm = new THREE.Group();
    leftForearm.position.y = -0.32;
    leftArm.add(leftForearm);

    const leftForearmMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.08, 0.28, 8), coatMat);
    leftForearmMesh.position.y = -0.14;
    leftForearmMesh.castShadow = true;
    leftForearm.add(leftForearmMesh);

    const leftHand = new THREE.Group();
    leftHand.position.y = -0.28;
    leftForearm.add(leftHand);

    const leftHandMesh = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.12, 0.08), leatherMat);
    leftHandMesh.position.y = -0.06;
    leftHand.add(leftHandMesh);

    // Right Arm (Armed with Machete)
    const rightShoulder = new THREE.Group();
    rightShoulder.position.set(0.38, 0.35, 0);
    chest.add(rightShoulder);

    const rightShoulderPad = new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 8), coatMat);
    rightShoulder.add(rightShoulderPad);

    const rightArm = new THREE.Group();
    rightArm.position.y = -0.05;
    rightShoulder.add(rightArm);

    const rightBicep = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.09, 0.32, 8), coatMat);
    rightBicep.position.y = -0.16;
    rightBicep.castShadow = true;
    rightArm.add(rightBicep);

    const rightForearm = new THREE.Group();
    rightForearm.position.y = -0.32;
    rightArm.add(rightForearm);

    const rightForearmMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.08, 0.28, 8), coatMat);
    rightForearmMesh.position.y = -0.14;
    rightForearmMesh.castShadow = true;
    rightForearm.add(rightForearmMesh);

    const rightHand = new THREE.Group();
    rightHand.position.y = -0.28;
    rightForearm.add(rightHand);

    const rightHandMesh = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.12, 0.08), leatherMat);
    rightHandMesh.position.y = -0.06;
    rightHand.add(rightHandMesh);

    // Rusted Heavy Machete Prop in Right Hand
    const weaponProp = new THREE.Group();
    weaponProp.position.set(0, -0.08, 0.04);
    weaponProp.rotation.x = Math.PI / 2;
    rightHand.add(weaponProp);

    // Handle
    const macheteHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.024, 0.22, 8), leatherMat);
    macheteHandle.position.y = -0.05;
    weaponProp.add(macheteHandle);

    // Blade
    const bladeGeo = new THREE.BoxGeometry(0.02, 0.72, 0.1);
    const macheteBlade = new THREE.Mesh(bladeGeo, macheteSteelMat);
    macheteBlade.position.set(0, 0.38, 0.02);
    macheteBlade.castShadow = true;
    weaponProp.add(macheteBlade);

    // 5. Heavy Trousers & Boots (Legs)
    // Left Leg
    const leftThigh = new THREE.Group();
    leftThigh.position.set(-0.16, -0.1, 0);
    pelvis.add(leftThigh);

    const leftThighMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.1, 0.44, 8), denimMat);
    leftThighMesh.position.y = -0.22;
    leftThighMesh.castShadow = true;
    leftThigh.add(leftThighMesh);

    const leftShin = new THREE.Group();
    leftShin.position.y = -0.44;
    leftThigh.add(leftShin);

    const leftShinMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.09, 0.44, 8), denimMat);
    leftShinMesh.position.y = -0.22;
    leftShinMesh.castShadow = true;
    leftShin.add(leftShinMesh);

    const leftFoot = new THREE.Group();
    leftFoot.position.y = -0.44;
    leftShin.add(leftFoot);

    const leftBootMesh = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 0.28), leatherMat);
    leftBootMesh.position.set(0, -0.06, 0.06);
    leftBootMesh.castShadow = true;
    leftFoot.add(leftBootMesh);

    // Right Leg
    const rightThigh = new THREE.Group();
    rightThigh.position.set(0.16, -0.1, 0);
    pelvis.add(rightThigh);

    const rightThighMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.1, 0.44, 8), denimMat);
    rightThighMesh.position.y = -0.22;
    rightThighMesh.castShadow = true;
    rightThigh.add(rightThighMesh);

    const rightShin = new THREE.Group();
    rightShin.position.y = -0.44;
    rightThigh.add(rightShin);

    const rightShinMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.09, 0.44, 8), denimMat);
    rightShinMesh.position.y = -0.22;
    rightShinMesh.castShadow = true;
    rightShin.add(rightShinMesh);

    const rightFoot = new THREE.Group();
    rightFoot.position.y = -0.44;
    rightShin.add(rightFoot);

    const rightBootMesh = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 0.28), leatherMat);
    rightBootMesh.position.set(0, -0.06, 0.06);
    rightBootMesh.castShadow = true;
    rightFoot.add(rightBootMesh);

    // Weathered Coat Tails (Secondary Physics)
    const secondaryCloth = new THREE.Group();
    secondaryCloth.position.set(0, -0.05, -0.1);
    pelvis.add(secondaryCloth);

    const coatTailMesh = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.38, 0.04), coatMat);
    coatTailMesh.position.y = -0.19;
    coatTailMesh.castShadow = true;
    secondaryCloth.add(coatTailMesh);

    return {
      root,
      pelvis,
      spine,
      chest,
      neck,
      head,
      jaw,
      leftEye,
      rightEye,
      mouthMesh: mouthInner,
      leftShoulder,
      leftArm,
      leftForearm,
      leftHand,
      rightShoulder,
      rightArm,
      rightForearm,
      rightHand,
      weaponProp,
      leftThigh,
      leftShin,
      leftFoot,
      rightThigh,
      rightShin,
      rightFoot,
      secondaryCloth,
      characterId: 'jason_slasher',
      baseHeight: 2.15,
    };
  }

  /**
   * Cyberpunk VTuber Avatar (Nova)
   */
  private static createCyberVTuber(): CharacterRig {
    const root = new THREE.Group();
    root.name = 'Cyber_VTuber_Root';

    const techJacketMat = new THREE.MeshStandardMaterial({
      color: 0x121824,
      roughness: 0.3,
      metalness: 0.6,
    });
    const neonCyanMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      emissive: 0x06b6d4,
      emissiveIntensity: 1.2,
      roughness: 0.2,
      metalness: 0.8,
    });
    const neonPinkMat = new THREE.MeshStandardMaterial({
      color: 0xec4899,
      emissive: 0xec4899,
      emissiveIntensity: 1.2,
      roughness: 0.2,
      metalness: 0.8,
    });
    const skinMat = new THREE.MeshStandardMaterial({
      color: 0xffdfd0,
      roughness: 0.6,
      metalness: 0.05,
    });
    const hairMat = new THREE.MeshStandardMaterial({
      color: 0x22d3ee,
      roughness: 0.4,
      metalness: 0.3,
    });

    const pelvis = new THREE.Group();
    pelvis.position.y = 0.95;
    root.add(pelvis);

    const pelvisMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.16, 0.18, 8), techJacketMat);
    pelvis.add(pelvisMesh);

    const spine = new THREE.Group();
    spine.position.y = 0.1;
    pelvis.add(spine);

    const chest = new THREE.Group();
    chest.position.y = 0.22;
    spine.add(chest);

    const chestMesh = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.36, 0.24), techJacketMat);
    chestMesh.position.y = 0.12;
    chestMesh.castShadow = true;
    chest.add(chestMesh);

    // Glowing chest LED trim
    const trim = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.03, 0.25), neonPinkMat);
    trim.position.y = 0.22;
    chest.add(trim);

    const neck = new THREE.Group();
    neck.position.y = 0.32;
    chest.add(neck);

    const head = new THREE.Group();
    head.position.y = 0.14;
    neck.add(head);

    const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 12), skinMat);
    headMesh.castShadow = true;
    head.add(headMesh);

    // Visor / Eyeglasses
    const visorMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      emissive: 0x06b6d4,
      emissiveIntensity: 1.5,
      roughness: 0.1,
      metalness: 0.9,
    });
    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.06, 0.12), visorMat);
    visor.position.set(0, 0.04, 0.12);
    head.add(visor);

    // Anime Hair bangs and twin tails
    const hairBangs = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.2, 6), hairMat);
    hairBangs.position.set(0, 0.12, 0.08);
    hairBangs.rotation.x = 0.4;
    head.add(hairBangs);

    // Articulated Jaw for Speech Lip-Sync
    const jaw = new THREE.Group();
    jaw.position.set(0, -0.06, 0.04);
    head.add(jaw);

    const jawMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.06, 0.08, 8), skinMat);
    jawMesh.position.set(0, -0.04, 0.02);
    jaw.add(jawMesh);

    const mouthInner = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.02, 0.02), new THREE.MeshBasicMaterial({ color: 0x831843 }));
    mouthInner.position.set(0, 0, 0.08);
    jaw.add(mouthInner);

    // Arms
    const leftShoulder = new THREE.Group();
    leftShoulder.position.set(-0.25, 0.26, 0);
    chest.add(leftShoulder);
    const leftArm = new THREE.Group();
    leftShoulder.add(leftArm);
    const leftBicep = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.25, 8), techJacketMat);
    leftBicep.position.y = -0.12;
    leftArm.add(leftBicep);
    const leftForearm = new THREE.Group();
    leftForearm.position.y = -0.25;
    leftArm.add(leftForearm);
    const leftForearmMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.04, 0.22, 8), skinMat);
    leftForearmMesh.position.y = -0.11;
    leftForearm.add(leftForearmMesh);
    const leftHand = new THREE.Group();
    leftHand.position.y = -0.22;
    leftForearm.add(leftHand);

    const rightShoulder = new THREE.Group();
    rightShoulder.position.set(0.25, 0.26, 0);
    chest.add(rightShoulder);
    const rightArm = new THREE.Group();
    rightShoulder.add(rightArm);
    const rightBicep = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.25, 8), techJacketMat);
    rightBicep.position.y = -0.12;
    rightArm.add(rightBicep);
    const rightForearm = new THREE.Group();
    rightForearm.position.y = -0.25;
    rightArm.add(rightForearm);
    const rightForearmMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.04, 0.22, 8), skinMat);
    rightForearmMesh.position.y = -0.11;
    rightForearm.add(rightForearmMesh);
    const rightHand = new THREE.Group();
    rightHand.position.y = -0.22;
    rightForearm.add(rightHand);

    // Holographic Streamer Mic Prop in hand
    const weaponProp = new THREE.Group();
    weaponProp.position.set(0, -0.05, 0.05);
    weaponProp.rotation.x = Math.PI / 4;
    rightHand.add(weaponProp);

    const micHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.018, 0.16, 8), techJacketMat);
    weaponProp.add(micHandle);
    const micHead = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 8), neonCyanMat);
    micHead.position.y = 0.09;
    weaponProp.add(micHead);

    // Legs
    const leftThigh = new THREE.Group();
    leftThigh.position.set(-0.12, -0.08, 0);
    pelvis.add(leftThigh);
    const leftShin = new THREE.Group();
    leftShin.position.y = -0.38;
    leftThigh.add(leftShin);
    const leftFoot = new THREE.Group();
    leftFoot.position.y = -0.38;
    leftShin.add(leftFoot);

    const rightThigh = new THREE.Group();
    rightThigh.position.set(0.12, -0.08, 0);
    pelvis.add(rightThigh);
    const rightShin = new THREE.Group();
    rightShin.position.y = -0.38;
    rightThigh.add(rightShin);
    const rightFoot = new THREE.Group();
    rightFoot.position.y = -0.38;
    rightShin.add(rightFoot);

    [leftThigh, rightThigh].forEach(t => {
      const m = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.065, 0.38, 8), techJacketMat);
      m.position.y = -0.19;
      t.add(m);
    });

    [leftShin, rightShin].forEach(s => {
      const m = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.055, 0.38, 8), skinMat);
      m.position.y = -0.19;
      s.add(m);
    });

    [leftFoot, rightFoot].forEach(f => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.08, 0.22), neonPinkMat);
      m.position.set(0, -0.04, 0.04);
      f.add(m);
    });

    return {
      root,
      pelvis,
      spine,
      chest,
      neck,
      head,
      jaw,
      leftEye: null,
      rightEye: null,
      mouthMesh: mouthInner,
      leftShoulder,
      leftArm,
      leftForearm,
      leftHand,
      rightShoulder,
      rightArm,
      rightForearm,
      rightHand,
      weaponProp,
      leftThigh,
      leftShin,
      leftFoot,
      rightThigh,
      rightShin,
      rightFoot,
      secondaryCloth: null,
      characterId: 'cyber_vtuber',
      baseHeight: 1.75,
    };
  }

  /**
   * Titan Industrial Mech Unit (AX-7)
   */
  private static createTitanMech(): CharacterRig {
    const root = new THREE.Group();
    root.name = 'Titan_Mech_Root';

    const armorMat = new THREE.MeshStandardMaterial({
      color: 0x374151,
      metalness: 0.85,
      roughness: 0.35,
    });
    const yellowHazardMat = new THREE.MeshStandardMaterial({
      color: 0xeab308,
      metalness: 0.4,
      roughness: 0.5,
    });
    const opticGlowMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0xef4444,
      emissiveIntensity: 2.0,
      roughness: 0.2,
      metalness: 0.9,
    });

    const pelvis = new THREE.Group();
    pelvis.position.y = 1.05;
    root.add(pelvis);

    const pelvisMesh = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.24, 0.32), armorMat);
    pelvis.add(pelvisMesh);

    const spine = new THREE.Group();
    spine.position.y = 0.15;
    pelvis.add(spine);

    const chest = new THREE.Group();
    chest.position.y = 0.32;
    spine.add(chest);

    const chestMesh = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.52, 0.48), armorMat);
    chestMesh.position.y = 0.2;
    chestMesh.castShadow = true;
    chest.add(chestMesh);

    // Hazard stripes
    const hazardStripe = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.08, 0.5), yellowHazardMat);
    hazardStripe.position.y = 0.35;
    chest.add(hazardStripe);

    const neck = new THREE.Group();
    neck.position.y = 0.5;
    chest.add(neck);

    const head = new THREE.Group();
    head.position.y = 0.1;
    neck.add(head);

    const headMesh = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.24, 0.3), armorMat);
    head.add(headMesh);

    // Glowing red optic scanner
    const optic = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.04, 0.32), opticGlowMat);
    optic.position.set(0, 0.03, 0.02);
    head.add(optic);

    const jaw = new THREE.Group();
    jaw.position.set(0, -0.1, 0.06);
    head.add(jaw);

    const jawPiston = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.08, 0.18), yellowHazardMat);
    jawPiston.position.y = -0.04;
    jaw.add(jawPiston);

    // Heavy hydraulic limbs
    const leftShoulder = new THREE.Group();
    leftShoulder.position.set(-0.48, 0.36, 0);
    chest.add(leftShoulder);
    const leftArm = new THREE.Group();
    leftShoulder.add(leftArm);
    const leftBicep = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.34, 0.18), armorMat);
    leftBicep.position.y = -0.17;
    leftArm.add(leftBicep);
    const leftForearm = new THREE.Group();
    leftForearm.position.y = -0.34;
    leftArm.add(leftForearm);
    const leftForearmMesh = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.32, 0.16), armorMat);
    leftForearmMesh.position.y = -0.16;
    leftForearm.add(leftForearmMesh);
    const leftHand = new THREE.Group();
    leftHand.position.y = -0.32;
    leftForearm.add(leftHand);

    const rightShoulder = new THREE.Group();
    rightShoulder.position.set(0.48, 0.36, 0);
    chest.add(rightShoulder);
    const rightArm = new THREE.Group();
    rightShoulder.add(rightArm);
    const rightBicep = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.34, 0.18), armorMat);
    rightBicep.position.y = -0.17;
    rightArm.add(rightBicep);
    const rightForearm = new THREE.Group();
    rightForearm.position.y = -0.34;
    rightArm.add(rightForearm);
    const rightForearmMesh = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.32, 0.16), armorMat);
    rightForearmMesh.position.y = -0.16;
    rightForearm.add(rightForearmMesh);
    const rightHand = new THREE.Group();
    rightHand.position.y = -0.32;
    rightForearm.add(rightHand);

    // Heavy Mech Cannon
    const weaponProp = new THREE.Group();
    weaponProp.position.set(0, -0.1, 0.1);
    rightHand.add(weaponProp);
    const cannonBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.48, 10), armorMat);
    cannonBarrel.rotation.x = Math.PI / 2;
    weaponProp.add(cannonBarrel);

    // Legs
    const leftThigh = new THREE.Group();
    leftThigh.position.set(-0.2, -0.12, 0);
    pelvis.add(leftThigh);
    const leftShin = new THREE.Group();
    leftShin.position.y = -0.42;
    leftThigh.add(leftShin);
    const leftFoot = new THREE.Group();
    leftFoot.position.y = -0.42;
    leftShin.add(leftFoot);

    const rightThigh = new THREE.Group();
    rightThigh.position.set(0.2, -0.12, 0);
    pelvis.add(rightThigh);
    const rightShin = new THREE.Group();
    rightShin.position.y = -0.42;
    rightThigh.add(rightShin);
    const rightFoot = new THREE.Group();
    rightFoot.position.y = -0.42;
    rightShin.add(rightFoot);

    [leftThigh, rightThigh].forEach(t => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.42, 0.2), armorMat);
      m.position.y = -0.21;
      t.add(m);
    });

    [leftShin, rightShin].forEach(s => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.42, 0.18), yellowHazardMat);
      m.position.y = -0.21;
      s.add(m);
    });

    [leftFoot, rightFoot].forEach(f => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.12, 0.32), armorMat);
      m.position.set(0, -0.06, 0.06);
      f.add(m);
    });

    return {
      root,
      pelvis,
      spine,
      chest,
      neck,
      head,
      jaw,
      leftEye: null,
      rightEye: null,
      mouthMesh: null,
      leftShoulder,
      leftArm,
      leftForearm,
      leftHand,
      rightShoulder,
      rightArm,
      rightForearm,
      rightHand,
      weaponProp,
      leftThigh,
      leftShin,
      leftFoot,
      rightThigh,
      rightShin,
      rightFoot,
      secondaryCloth: null,
      characterId: 'titan_mech',
      baseHeight: 2.2,
    };
  }

  /**
   * Anime Sorcerer (Kaito)
   */
  private static createAnimeSorcerer(): CharacterRig {
    const root = new THREE.Group();
    root.name = 'Anime_Sorcerer_Root';

    const robeMat = new THREE.MeshStandardMaterial({
      color: 0x4c1d95, // Deep royal purple
      roughness: 0.8,
      metalness: 0.1,
    });
    const goldTrimMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      roughness: 0.3,
      metalness: 0.8,
    });
    const skinMat = new THREE.MeshStandardMaterial({
      color: 0xffedd5,
      roughness: 0.7,
      metalness: 0.05,
    });
    const arcaneGlowMat = new THREE.MeshStandardMaterial({
      color: 0xa855f7,
      emissive: 0xa855f7,
      emissiveIntensity: 1.8,
      roughness: 0.1,
      metalness: 0.9,
    });

    const pelvis = new THREE.Group();
    pelvis.position.y = 1.0;
    root.add(pelvis);

    const spine = new THREE.Group();
    spine.position.y = 0.1;
    pelvis.add(spine);

    const chest = new THREE.Group();
    chest.position.y = 0.24;
    spine.add(chest);

    const chestMesh = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.38, 0.22), robeMat);
    chestMesh.position.y = 0.14;
    chest.add(chestMesh);

    const neck = new THREE.Group();
    neck.position.y = 0.34;
    chest.add(neck);

    const head = new THREE.Group();
    head.position.y = 0.15;
    neck.add(head);

    const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 12), skinMat);
    head.add(headMesh);

    const jaw = new THREE.Group();
    jaw.position.set(0, -0.06, 0.05);
    head.add(jaw);

    const jawMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.05, 0.08, 8), skinMat);
    jawMesh.position.set(0, -0.04, 0.01);
    jaw.add(jawMesh);

    // Floating Sorcery Catalyst Wand
    const weaponProp = new THREE.Group();
    weaponProp.position.set(0.35, 0.2, 0.15);
    chest.add(weaponProp);

    const crystalOrb = new THREE.Mesh(new THREE.OctahedronGeometry(0.09, 1), arcaneGlowMat);
    weaponProp.add(crystalOrb);

    const leftShoulder = new THREE.Group();
    leftShoulder.position.set(-0.25, 0.28, 0);
    chest.add(leftShoulder);
    const leftArm = new THREE.Group();
    leftShoulder.add(leftArm);
    const leftForearm = new THREE.Group();
    leftForearm.position.y = -0.26;
    leftArm.add(leftForearm);
    const leftHand = new THREE.Group();
    leftHand.position.y = -0.24;
    leftForearm.add(leftHand);

    const rightShoulder = new THREE.Group();
    rightShoulder.position.set(0.25, 0.28, 0);
    chest.add(rightShoulder);
    const rightArm = new THREE.Group();
    rightShoulder.add(rightArm);
    const rightForearm = new THREE.Group();
    rightForearm.position.y = -0.26;
    rightArm.add(rightForearm);
    const rightHand = new THREE.Group();
    rightHand.position.y = -0.24;
    rightForearm.add(rightHand);

    [leftArm, rightArm].forEach(a => {
      const m = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.26, 8), robeMat);
      m.position.y = -0.13;
      a.add(m);
    });

    [leftForearm, rightForearm].forEach(f => {
      const m = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.06, 0.24, 8), robeMat);
      m.position.y = -0.12;
      f.add(m);
    });

    // Flowing Robe Skirt (Secondary cloth)
    const secondaryCloth = new THREE.Group();
    secondaryCloth.position.set(0, 0, 0);
    pelvis.add(secondaryCloth);

    const robeSkirt = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.85, 12, 1, true), robeMat);
    robeSkirt.position.y = -0.42;
    secondaryCloth.add(robeSkirt);

    const leftThigh = new THREE.Group();
    leftThigh.position.set(-0.12, -0.05, 0);
    pelvis.add(leftThigh);
    const leftShin = new THREE.Group();
    leftShin.position.y = -0.4;
    leftThigh.add(leftShin);
    const leftFoot = new THREE.Group();
    leftFoot.position.y = -0.4;
    leftShin.add(leftFoot);

    const rightThigh = new THREE.Group();
    rightThigh.position.set(0.12, -0.05, 0);
    pelvis.add(rightThigh);
    const rightShin = new THREE.Group();
    rightShin.position.y = -0.4;
    rightThigh.add(rightShin);
    const rightFoot = new THREE.Group();
    rightFoot.position.y = -0.4;
    rightShin.add(rightFoot);

    return {
      root,
      pelvis,
      spine,
      chest,
      neck,
      head,
      jaw,
      leftEye: null,
      rightEye: null,
      mouthMesh: null,
      leftShoulder,
      leftArm,
      leftForearm,
      leftHand,
      rightShoulder,
      rightArm,
      rightForearm,
      rightHand,
      weaponProp,
      leftThigh,
      leftShin,
      leftFoot,
      rightThigh,
      rightShin,
      rightFoot,
      secondaryCloth,
      characterId: 'anime_sorcerer',
      baseHeight: 1.85,
    };
  }

  /**
   * Jars Cartoon Avatar (Bloop) - Expressive Stylized Mascot
   */
  private static createJarsCartoon(): CharacterRig {
    const root = new THREE.Group();
    root.name = 'Jars_Cartoon_Root';

    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x3b82f6, // Vibrant Jars Blue
      roughness: 0.4,
      metalness: 0.1,
    });
    const eyeWhiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const pupilMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
    const mouthMat = new THREE.MeshBasicMaterial({ color: 0x991b1b });

    const pelvis = new THREE.Group();
    pelvis.position.y = 0.8;
    root.add(pelvis);

    const spine = new THREE.Group();
    spine.position.y = 0.1;
    pelvis.add(spine);

    const chest = new THREE.Group();
    chest.position.y = 0.18;
    spine.add(chest);

    // Round bouncy body
    const bodyMesh = new THREE.Mesh(new THREE.SphereGeometry(0.38, 16, 16), bodyMat);
    bodyMesh.position.y = 0.22;
    bodyMesh.castShadow = true;
    chest.add(bodyMesh);

    const neck = new THREE.Group();
    neck.position.y = 0.48;
    chest.add(neck);

    const head = new THREE.Group();
    head.position.y = 0.1;
    neck.add(head);

    // Big expressive cartoon eyes
    const leftEye = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 12), eyeWhiteMat);
    leftEye.position.set(-0.11, 0.1, 0.3);
    head.add(leftEye);
    const leftPupil = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), pupilMat);
    leftPupil.position.set(0, 0, 0.06);
    leftEye.add(leftPupil);

    const rightEye = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 12), eyeWhiteMat);
    rightEye.position.set(0.11, 0.1, 0.3);
    head.add(rightEye);
    const rightPupil = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), pupilMat);
    rightPupil.position.set(0, 0, 0.06);
    rightEye.add(rightPupil);

    // Large Expressive Cartoon Mouth / Jaw
    const jaw = new THREE.Group();
    jaw.position.set(0, -0.08, 0.32);
    head.add(jaw);

    const mouthMesh = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.06, 0.04), mouthMat);
    jaw.add(mouthMesh);

    const leftShoulder = new THREE.Group();
    leftShoulder.position.set(-0.35, 0.2, 0);
    chest.add(leftShoulder);
    const leftArm = new THREE.Group();
    leftShoulder.add(leftArm);
    const leftForearm = new THREE.Group();
    leftForearm.position.y = -0.2;
    leftArm.add(leftForearm);
    const leftHand = new THREE.Group();
    leftHand.position.y = -0.18;
    leftForearm.add(leftHand);

    const rightShoulder = new THREE.Group();
    rightShoulder.position.set(0.35, 0.2, 0);
    chest.add(rightShoulder);
    const rightArm = new THREE.Group();
    rightShoulder.add(rightArm);
    const rightForearm = new THREE.Group();
    rightForearm.position.y = -0.2;
    rightArm.add(rightForearm);
    const rightHand = new THREE.Group();
    rightHand.position.y = -0.18;
    rightForearm.add(rightHand);

    [leftArm, rightArm].forEach(a => {
      const m = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.2, 8), bodyMat);
      m.position.y = -0.1;
      a.add(m);
    });

    [leftForearm, rightForearm].forEach(f => {
      const m = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.04, 0.18, 8), bodyMat);
      m.position.y = -0.09;
      f.add(m);
    });

    [leftHand, rightHand].forEach(h => {
      const m = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), eyeWhiteMat);
      h.add(m);
    });

    const leftThigh = new THREE.Group();
    leftThigh.position.set(-0.16, -0.05, 0);
    pelvis.add(leftThigh);
    const leftShin = new THREE.Group();
    leftShin.position.y = -0.28;
    leftThigh.add(leftShin);
    const leftFoot = new THREE.Group();
    leftFoot.position.y = -0.28;
    leftShin.add(leftFoot);

    const rightThigh = new THREE.Group();
    rightThigh.position.set(0.16, -0.05, 0);
    pelvis.add(rightThigh);
    const rightShin = new THREE.Group();
    rightShin.position.y = -0.28;
    rightThigh.add(rightShin);
    const rightFoot = new THREE.Group();
    rightFoot.position.y = -0.28;
    rightShin.add(rightFoot);

    [leftThigh, rightThigh].forEach(t => {
      const m = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.06, 0.28, 8), bodyMat);
      m.position.y = -0.14;
      t.add(m);
    });

    [leftShin, rightShin].forEach(s => {
      const m = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.28, 8), bodyMat);
      m.position.y = -0.14;
      s.add(m);
    });

    [leftFoot, rightFoot].forEach(f => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.1, 0.22), new THREE.MeshStandardMaterial({ color: 0xf97316 }));
      m.position.set(0, -0.05, 0.04);
      f.add(m);
    });

    return {
      root,
      pelvis,
      spine,
      chest,
      neck,
      head,
      jaw,
      leftEye,
      rightEye,
      mouthMesh,
      leftShoulder,
      leftArm,
      leftForearm,
      leftHand,
      rightShoulder,
      rightArm,
      rightForearm,
      rightHand,
      weaponProp: null,
      leftThigh,
      leftShin,
      leftFoot,
      rightThigh,
      rightShin,
      rightFoot,
      secondaryCloth: null,
      characterId: 'jars_cartoon',
      baseHeight: 1.45,
    };
  }

  /**
   * Applies automated real-time viseme lip-syncing & eye blinking to the character rig
   */
  static applyVisemeToRig(rig: CharacterRig, viseme: VisemeFrame) {
    if (rig.jaw) {
      // Rotate jaw down based on open amount
      const targetJawRotX = viseme.jawOpen * 0.45;
      rig.jaw.rotation.x = THREE.MathUtils.lerp(rig.jaw.rotation.x, targetJawRotX, 0.4);
      rig.jaw.position.y = THREE.MathUtils.lerp(rig.jaw.position.y, -0.06 - viseme.chinDrop * 0.05, 0.4);

      if (rig.mouthMesh) {
        rig.mouthMesh.scale.x = THREE.MathUtils.lerp(rig.mouthMesh.scale.x, 1.0 + viseme.mouthWide * 0.5 - viseme.mouthPucker * 0.3, 0.4);
        rig.mouthMesh.scale.y = THREE.MathUtils.lerp(rig.mouthMesh.scale.y, 1.0 + viseme.jawOpen * 1.8, 0.4);
      }
    }

    if (rig.head) {
      rig.head.rotation.x = THREE.MathUtils.lerp(rig.head.rotation.x, viseme.headNod, 0.2);
      rig.head.rotation.z = THREE.MathUtils.lerp(rig.head.rotation.z, viseme.headTilt, 0.2);
    }

    if (rig.leftEye && rig.rightEye) {
      const blinkScaleY = 1.0 - viseme.eyeBlinkLeft * 0.85;
      rig.leftEye.scale.y = blinkScaleY;
      rig.rightEye.scale.y = blinkScaleY;
    }
  }
}
