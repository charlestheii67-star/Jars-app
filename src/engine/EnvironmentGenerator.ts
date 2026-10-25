import * as THREE from 'three';
import { EnvironmentBiome, LightingMood } from '../types';
import { ProceduralTextures } from './ProceduralTextures';

export interface EnvironmentScene {
  group: THREE.Group;
  fogColor: THREE.Color;
  fogNear: number;
  fogFar: number;
  sunColor: THREE.Color;
  sunIntensity: number;
  sunPosition: THREE.Vector3;
  hemiSkyColor: THREE.Color;
  hemiGroundColor: THREE.Color;
  hemiIntensity: number;
  animatedElements: Array<(time: number) => void>;
}

export class EnvironmentGenerator {
  /**
   * Generates rich procedural 3D environments with zero external 404 dependencies
   */
  static generateEnvironment(biome: EnvironmentBiome, mood: LightingMood): EnvironmentScene {
    const group = new THREE.Group();
    group.name = `Env_${biome}`;
    const animatedElements: Array<(time: number) => void> = [];

    let fogColor = new THREE.Color(0x0a101a);
    let fogNear = 8;
    let fogFar = 55;
    let sunColor = new THREE.Color(0x94a3b8);
    let sunIntensity = 1.2;
    let sunPosition = new THREE.Vector3(12, 18, 10);
    let hemiSkyColor = new THREE.Color(0x1e293b);
    let hemiGroundColor = new THREE.Color(0x0f172a);
    let hemiIntensity = 0.6;

    switch (biome) {
      case 'crystal_lake': {
        fogColor = new THREE.Color(0x060c14);
        fogNear = 6;
        fogFar = 42;
        sunColor = new THREE.Color(0x60a5fa); // Cold moonlight
        sunIntensity = 1.1;
        sunPosition.set(-10, 16, -14);
        hemiSkyColor = new THREE.Color(0x0f172a);
        hemiGroundColor = new THREE.Color(0x020617);
        hemiIntensity = 0.45;

        // 1. Muddy Shoreline Ground
        const groundMat = new THREE.MeshStandardMaterial({
          color: 0x1a2118,
          roughness: 0.9,
          metalness: 0.05,
        });
        const groundGeo = new THREE.PlaneGeometry(120, 120, 32, 32);
        // Add subtle procedural terrain waves
        const posAttr = groundGeo.attributes.position;
        for (let i = 0; i < posAttr.count; i++) {
          const vx = posAttr.getX(i);
          const vy = posAttr.getY(i);
          const dist = Math.sqrt(vx * vx + vy * vy);
          const elevation = Math.sin(vx * 0.1) * Math.cos(vy * 0.1) * 0.4 + (dist > 20 ? (dist - 20) * 0.15 : 0);
          posAttr.setZ(i, elevation);
        }
        groundGeo.computeVertexNormals();

        const ground = new THREE.Mesh(groundGeo, groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = 0;
        ground.receiveShadow = true;
        group.add(ground);

        // 2. Crystal Lake Water Plane
        const waterMat = new THREE.MeshStandardMaterial({
          color: 0x05131f,
          roughness: 0.15,
          metalness: 0.65,
        });
        const waterGeo = new THREE.PlaneGeometry(80, 50, 16, 16);
        const water = new THREE.Mesh(waterGeo, waterMat);
        water.rotation.x = -Math.PI / 2;
        water.position.set(0, -0.05, -28);
        water.receiveShadow = true;
        group.add(water);

        // Water ripple animation
        animatedElements.push((time) => {
          water.position.y = -0.05 + Math.sin(time * 1.5) * 0.02;
        });

        // 3. Rustic Wooden Pier / Dock
        const woodPlankTex = ProceduralTextures.getWoodPlankTexture();
        const pierWoodMat = new THREE.MeshStandardMaterial({
          map: woodPlankTex,
          roughness: 0.75,
          metalness: 0.1,
        });

        const pierGroup = new THREE.Group();
        pierGroup.position.set(0, 0.08, -8);

        // Main deck planks
        const pierDeck = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.12, 14), pierWoodMat);
        pierDeck.position.z = -5;
        pierDeck.castShadow = true;
        pierDeck.receiveShadow = true;
        pierGroup.add(pierDeck);

        // Pier support pilings
        for (let pz = -1; pz >= -11; pz -= 3) {
          [-1.1, 1.1].forEach((px) => {
            const post = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.11, 2.2, 8), pierWoodMat);
            post.position.set(px, -0.9, pz);
            post.castShadow = true;
            pierGroup.add(post);
          });
        }

        // Mooring bollard with rope
        const bollard = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 0.45, 8), pierWoodMat);
        bollard.position.set(1.0, 0.25, -11);
        pierGroup.add(bollard);
        group.add(pierGroup);

        // 4. Abandoned Camp Cabin Porch (off to the side)
        const cabinGroup = new THREE.Group();
        cabinGroup.position.set(-8, 0, -2);
        cabinGroup.rotation.y = 0.45;

        // Porch floor
        const porchFloor = new THREE.Mesh(new THREE.BoxGeometry(7, 0.2, 5), pierWoodMat);
        porchFloor.position.set(0, 0.1, 0);
        porchFloor.castShadow = true;
        porchFloor.receiveShadow = true;
        cabinGroup.add(porchFloor);

        // Cabin wall
        const cabinWall = new THREE.Mesh(new THREE.BoxGeometry(7, 4.2, 0.3), pierWoodMat);
        cabinWall.position.set(0, 2.1, -2.4);
        cabinWall.castShadow = true;
        cabinGroup.add(cabinWall);

        // Cabin door frame
        const doorFrame = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.8, 0.4), new THREE.MeshStandardMaterial({ color: 0x110c08 }));
        doorFrame.position.set(0, 1.4, -2.4);
        cabinGroup.add(doorFrame);

        // Slanted corrugated porch roof
        const roof = new THREE.Mesh(new THREE.BoxGeometry(7.4, 0.15, 5.4), new THREE.MeshStandardMaterial({ color: 0x272e29, roughness: 0.9 }));
        roof.position.set(0, 3.8, 0);
        roof.rotation.x = 0.12;
        cabinGroup.add(roof);

        // Porch timber columns
        [-3.2, 3.2].forEach((cx) => {
          const col = new THREE.Mesh(new THREE.BoxGeometry(0.25, 3.6, 0.25), pierWoodMat);
          col.position.set(cx, 1.8, 2.2);
          col.castShadow = true;
          cabinGroup.add(col);
        });

        // Flickering kerosene lantern on the porch
        const lanternGroup = new THREE.Group();
        lanternGroup.position.set(-3.2, 2.6, 2.2);
        const lanternFrame = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.26, 6), new THREE.MeshStandardMaterial({ color: 0x18181b, metalness: 0.8 }));
        lanternGroup.add(lanternFrame);
        const lanternGlow = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.16, 6), new THREE.MeshBasicMaterial({ color: 0xf59e0b }));
        lanternGroup.add(lanternGlow);

        const lanternLight = new THREE.PointLight(0xf59e0b, 1.8, 8, 1.5);
        lanternLight.position.set(0, 0, 0);
        lanternGroup.add(lanternLight);
        cabinGroup.add(lanternGroup);

        animatedElements.push((time) => {
          // Flickering flame effect
          lanternLight.intensity = 1.6 + Math.sin(time * 12) * 0.3 + Math.cos(time * 23) * 0.2;
        });

        group.add(cabinGroup);

        // 5. Pine Trees Groves on perimeters
        const treePositions = [
          [-5, 4], [-8, 6], [-12, 2], [-14, -5],
          [6, 3], [10, 5], [13, -2], [8, -9],
          [-4, -18], [5, -20], [-12, -15], [14, -14],
          [0, 12], [-6, 14], [7, 15]
        ];

        const pineBarkMat = new THREE.MeshStandardMaterial({ color: 0x2d1f14, roughness: 0.9 });
        const pineNeedleMat = new THREE.MeshStandardMaterial({ color: 0x132318, roughness: 0.85 });

        treePositions.forEach(([tx, tz], idx) => {
          const tree = new THREE.Group();
          const treeScale = 0.8 + (idx % 5) * 0.15;
          tree.position.set(tx, 0, tz);
          tree.scale.setScalar(treeScale);

          // Trunk
          const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.32, 4.0, 7), pineBarkMat);
          trunk.position.y = 2.0;
          trunk.castShadow = true;
          tree.add(trunk);

          // 4 Tiered conical needle clusters
          [
            { y: 3.0, r: 1.8, h: 2.2 },
            { y: 4.4, r: 1.4, h: 2.0 },
            { y: 5.6, r: 1.0, h: 1.8 },
            { y: 6.6, r: 0.6, h: 1.5 },
          ].forEach((tier) => {
            const foliage = new THREE.Mesh(new THREE.ConeGeometry(tier.r, tier.h, 7), pineNeedleMat);
            foliage.position.y = tier.y;
            foliage.castShadow = true;
            tree.add(foliage);
          });

          group.add(tree);
        });

        // 6. Eerie Campfire in clearing
        const campfireGroup = new THREE.Group();
        campfireGroup.position.set(3.5, 0, 2.5);

        // Stone circle
        const stoneMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.9 });
        for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
          const stone = new THREE.Mesh(new THREE.DodecahedronGeometry(0.18, 0), stoneMat);
          stone.position.set(Math.cos(a) * 0.7, 0.1, Math.sin(a) * 0.7);
          campfireGroup.add(stone);
        }

        // Charred logs
        const logMat = new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.95 });
        [-0.3, 0, 0.3].forEach((lx, i) => {
          const log = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 0.9, 6), logMat);
          log.rotation.z = Math.PI / 2 + (i - 1) * 0.4;
          log.rotation.y = i * 0.7;
          log.position.set(lx * 0.5, 0.12, 0);
          campfireGroup.add(log);
        });

        // Fire embers light
        const fireLight = new THREE.PointLight(0xef4444, 2.2, 10, 1.8);
        fireLight.position.set(0, 0.4, 0);
        campfireGroup.add(fireLight);

        animatedElements.push((time) => {
          fireLight.intensity = 2.0 + Math.sin(time * 15) * 0.5 + Math.cos(time * 28) * 0.3;
          fireLight.color.setHex(Math.sin(time * 5) > 0 ? 0xef4444 : 0xf97316);
        });

        group.add(campfireGroup);
        break;
      }

      case 'cyberpunk_alley': {
        fogColor = new THREE.Color(0x0f0b1e);
        fogNear = 8;
        fogFar = 50;
        sunColor = new THREE.Color(0xec4899); // Neon Pink backlight
        sunIntensity = 1.0;
        sunPosition.set(10, 20, 8);
        hemiSkyColor = new THREE.Color(0x38bdf8); // Cyan fill
        hemiGroundColor = new THREE.Color(0x030712);
        hemiIntensity = 0.55;

        // Wet asphalt ground
        const asphaltMat = new THREE.MeshStandardMaterial({
          map: ProceduralTextures.getWetAsphaltTexture(),
          roughness: 0.25,
          metalness: 0.5,
        });
        const ground = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), asphaltMat);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        group.add(ground);

        // Cyber Skyscraper Facades along left and right alley sides
        const buildingMat = new THREE.MeshStandardMaterial({
          color: 0x111827,
          roughness: 0.4,
          metalness: 0.6,
        });
        const panelTex = ProceduralTextures.getCyberpunkPanelTexture();
        const techWallMat = new THREE.MeshStandardMaterial({
          map: panelTex,
          roughness: 0.3,
          metalness: 0.7,
        });

        const neonCyanMat = new THREE.MeshStandardMaterial({
          color: 0x06b6d4,
          emissive: 0x06b6d4,
          emissiveIntensity: 2.0,
        });
        const neonPinkMat = new THREE.MeshStandardMaterial({
          color: 0xec4899,
          emissive: 0xec4899,
          emissiveIntensity: 2.2,
        });
        const neonAmberMat = new THREE.MeshStandardMaterial({
          color: 0xfacc15,
          emissive: 0xfacc15,
          emissiveIntensity: 1.8,
        });

        // Left buildings
        [-12, -4, 4, 12].forEach((bz, idx) => {
          const bldg = new THREE.Mesh(new THREE.BoxGeometry(6, 18, 7.5), idx % 2 === 0 ? buildingMat : techWallMat);
          bldg.position.set(-7, 9, bz);
          bldg.castShadow = true;
          bldg.receiveShadow = true;
          group.add(bldg);

          // Glowing holographic billboards & kanji signs
          const sign = new THREE.Mesh(new THREE.BoxGeometry(0.2, 3.5, 2.5), idx % 2 === 0 ? neonCyanMat : neonPinkMat);
          sign.position.set(-3.9, 6 + (idx % 3) * 2, bz);
          group.add(sign);
        });

        // Right buildings
        [-12, -4, 4, 12].forEach((bz, idx) => {
          const bldg = new THREE.Mesh(new THREE.BoxGeometry(6, 16, 7.5), techWallMat);
          bldg.position.set(7, 8, bz);
          bldg.castShadow = true;
          bldg.receiveShadow = true;
          group.add(bldg);

          const sign = new THREE.Mesh(new THREE.BoxGeometry(0.2, 2.5, 4.0), idx % 2 === 0 ? neonPinkMat : neonAmberMat);
          sign.position.set(3.9, 7 + (idx % 2) * 2, bz);
          group.add(sign);
        });

        // Overhead cables and holographic arch
        const arch = new THREE.Mesh(new THREE.BoxGeometry(9, 0.4, 0.4), neonCyanMat);
        arch.position.set(0, 8.5, 0);
        group.add(arch);

        // Alley street lamps
        const lamp = new THREE.PointLight(0x06b6d4, 2.5, 12, 1.2);
        lamp.position.set(-2.5, 5, 2);
        group.add(lamp);

        const pinkFill = new THREE.PointLight(0xec4899, 2.5, 12, 1.2);
        pinkFill.position.set(2.5, 4, -2);
        group.add(pinkFill);

        animatedElements.push((time) => {
          lamp.intensity = 2.4 + Math.sin(time * 8) * 0.3;
          pinkFill.intensity = 2.4 + Math.cos(time * 7) * 0.3;
        });
        break;
      }

      case 'martian_outpost': {
        fogColor = new THREE.Color(0x3a150c);
        fogNear = 6;
        fogFar = 48;
        sunColor = new THREE.Color(0xfb923c); // Warm Martian sun
        sunIntensity = 1.3;
        sunPosition.set(14, 15, -12);
        hemiSkyColor = new THREE.Color(0x7c2d12);
        hemiGroundColor = new THREE.Color(0x2d0b04);
        hemiIntensity = 0.5;

        // Martian red soil
        const dirtMat = new THREE.MeshStandardMaterial({
          map: ProceduralTextures.getMartianDirtTexture(),
          roughness: 0.85,
          metalness: 0.1,
        });
        const ground = new THREE.Mesh(new THREE.PlaneGeometry(100, 100, 24, 24), dirtMat);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        group.add(ground);

        // Geodesic Research Biodome in background
        const domeMat = new THREE.MeshStandardMaterial({
          color: 0x94a3b8,
          roughness: 0.2,
          metalness: 0.8,
          wireframe: true,
        });
        const dome = new THREE.Mesh(new THREE.IcosahedronGeometry(7, 2), domeMat);
        dome.position.set(0, 0, -22);
        group.add(dome);

        // Bio-Dome interior light
        const domeLight = new THREE.PointLight(0x38bdf8, 3.5, 25);
        domeLight.position.set(0, 3, -22);
        group.add(domeLight);

        // Satellite Communication Tower
        const towerGroup = new THREE.Group();
        towerGroup.position.set(8, 0, -10);
        const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.25, 9, 8), new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.9 }));
        mast.position.y = 4.5;
        mast.castShadow = true;
        towerGroup.add(mast);

        // Dish
        const dish = new THREE.Mesh(new THREE.SphereGeometry(1.2, 12, 12, 0, Math.PI), new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.8 }));
        dish.rotation.x = 0.8;
        dish.position.set(0, 8.5, 0);
        towerGroup.add(dish);
        group.add(towerGroup);

        // Boulders & Crags
        const rockMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.95 });
        [[-4, -5], [-7, 2], [6, 4], [9, -4], [-8, -12]].forEach(([rx, rz], i) => {
          const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.7 + (i % 3) * 0.4, 1), rockMat);
          rock.position.set(rx, 0.5, rz);
          rock.scale.set(1.4, 0.8, 1.2);
          rock.castShadow = true;
          group.add(rock);
        });
        break;
      }

      case 'ruins_wasteland': {
        fogColor = new THREE.Color(0x191c18);
        fogNear = 6;
        fogFar = 45;
        sunColor = new THREE.Color(0xa3e635); // Toxic amber green tint
        sunIntensity = 1.0;
        sunPosition.set(-12, 15, 10);
        hemiSkyColor = new THREE.Color(0x365314);
        hemiGroundColor = new THREE.Color(0x0a0c08);
        hemiIntensity = 0.45;

        const groundMat = new THREE.MeshStandardMaterial({ color: 0x222725, roughness: 0.95 });
        const ground = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        group.add(ground);

        // Broken concrete highway pillars & twisted rebar
        const concreteMat = new THREE.MeshStandardMaterial({ color: 0x4b5563, roughness: 0.9 });
        const rebarMat = new THREE.MeshStandardMaterial({ color: 0x78350f, metalness: 0.9, roughness: 0.4 });

        [[-6, -6], [6, -8], [-5, 6], [7, 5]].forEach(([px, pz], idx) => {
          const pillar = new THREE.Mesh(new THREE.BoxGeometry(1.6, 6.0, 1.6), concreteMat);
          pillar.position.set(px, 2.5, pz);
          pillar.rotation.z = (idx % 2 === 0 ? 0.08 : -0.06);
          pillar.castShadow = true;
          pillar.receiveShadow = true;
          group.add(pillar);

          // Exposed jagged rebar wires
          const rebar = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.0, 5), rebarMat);
          rebar.position.set(px + 0.4, 5.8, pz + 0.3);
          rebar.rotation.x = 0.3;
          group.add(rebar);
        });

        // Rusted oil barrels
        [-2.5, 3.2].forEach((bx) => {
          const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 1.1, 10), rebarMat);
          barrel.position.set(bx, 0.55, -2);
          barrel.castShadow = true;
          group.add(barrel);
        });
        break;
      }

      case 'soundstage_studio':
      default: {
        fogColor = new THREE.Color(0x0f172a);
        fogNear = 25;
        fogFar = 90;
        sunColor = new THREE.Color(0xffffff); // Neutral 5600K Key Light
        sunIntensity = 1.4;
        sunPosition.set(8, 16, 10);
        hemiSkyColor = new THREE.Color(0x38bdf8);
        hemiGroundColor = new THREE.Color(0x1e293b);
        hemiIntensity = 0.65;

        // Clean Cyclorama Studio Floor
        const stageMat = new THREE.MeshStandardMaterial({
          color: 0x1e293b,
          roughness: 0.4,
          metalness: 0.2,
        });
        const ground = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), stageMat);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        group.add(ground);

        // Director Dolly Rail track
        const railMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.2 });
        [-1.2, 1.2].forEach((rx) => {
          const rail = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 16), railMat);
          rail.position.set(rx, 0.03, 3);
          rail.receiveShadow = true;
          group.add(rail);
        });

        // Studio Light Stands with Softbox
        [-4, 4].forEach((lx) => {
          const stand = new THREE.Group();
          stand.position.set(lx, 0, 4);

          const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 3.5, 8), railMat);
          pole.position.y = 1.75;
          stand.add(pole);

          // Softbox hood
          const softbox = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.7, 0.4), new THREE.MeshStandardMaterial({ color: 0x09090b }));
          softbox.position.set(0, 3.4, 0);
          softbox.rotation.y = lx > 0 ? -0.5 : 0.5;

          const diffuser = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.6), new THREE.MeshBasicMaterial({ color: 0xffffff }));
          diffuser.position.set(0, 0, 0.21);
          softbox.add(diffuser);
          stand.add(softbox);
          group.add(stand);
        });
        break;
      }
    }

    // Apply lighting mood overrides if specified
    if (mood === 'bloodMoon') {
      fogColor.setHex(0x1a0505);
      sunColor.setHex(0xdc2626);
      hemiSkyColor.setHex(0x7f1d1d);
      hemiGroundColor.setHex(0x110303);
      sunIntensity = 1.35;
    } else if (mood === 'neon') {
      fogColor.setHex(0x0c081e);
      sunColor.setHex(0xec4899);
      hemiSkyColor.setHex(0x06b6d4);
      sunIntensity = 1.2;
    } else if (mood === 'goldenHour') {
      fogColor.setHex(0x2d170b);
      sunColor.setHex(0xfb923c);
      hemiSkyColor.setHex(0xfef08a);
      sunIntensity = 1.4;
      sunPosition.set(20, 8, 14);
    }

    return {
      group,
      fogColor,
      fogNear,
      fogFar,
      sunColor,
      sunIntensity,
      sunPosition,
      hemiSkyColor,
      hemiGroundColor,
      hemiIntensity,
      animatedElements,
    };
  }
}
