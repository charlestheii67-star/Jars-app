import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { CharacterRig } from './CharacterModels';

export class ModelImporter {
  private static gltfLoader = new GLTFLoader();
  private static objLoader = new OBJLoader();

  /**
   * Imports custom 3D model file (.glb, .gltf, .obj) and converts it into a controllable CharacterRig
   */
  static async loadCustomModel(file: File): Promise<CharacterRig> {
    const filename = file.name.toLowerCase();
    const arrayBuffer = await file.arrayBuffer();

    let modelObject: THREE.Object3D;

    if (filename.endsWith('.glb') || filename.endsWith('.gltf')) {
      const gltf = await new Promise<any>((resolve, reject) => {
        this.gltfLoader.parse(arrayBuffer, '', resolve, reject);
      });
      modelObject = gltf.scene || gltf.scenes[0];
    } else if (filename.endsWith('.obj')) {
      const text = new TextDecoder().decode(arrayBuffer);
      modelObject = this.objLoader.parse(text);
    } else {
      throw new Error('Unsupported format. Please upload a .glb, .gltf, or .obj 3D file.');
    }

    // Normalize scale and center model so it stands naturally on the stage
    const box = new THREE.Box3().setFromObject(modelObject);
    const size = new THREE.Vector3();
    box.getSize(size);
    const center = new THREE.Vector3();
    box.getCenter(center);

    // Target height around 2.0 units
    const maxDim = Math.max(size.x, size.y, size.z);
    const scaleFactor = 2.0 / (maxDim || 1);
    modelObject.scale.setScalar(scaleFactor);

    // Recompute box after scale
    box.setFromObject(modelObject);
    // Align bottom flush with y = 0
    modelObject.position.x = -center.x * scaleFactor;
    modelObject.position.y = -box.min.y;
    modelObject.position.z = -center.z * scaleFactor;

    // Enable shadows on all child meshes
    modelObject.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    // Wrap into CharacterRig structure so animators and lip-sync work
    const root = new THREE.Group();
    root.name = `Imported_${file.name}`;
    root.add(modelObject);

    // Create virtual articulation joints for procedural kinematics
    const pelvis = new THREE.Group();
    pelvis.position.y = 1.0;
    root.add(pelvis);

    const spine = new THREE.Group();
    pelvis.add(spine);

    const chest = new THREE.Group();
    chest.position.y = 0.3;
    spine.add(chest);

    const neck = new THREE.Group();
    neck.position.y = 0.4;
    chest.add(neck);

    const head = new THREE.Group();
    neck.add(head);

    // Virtual jaw for automated lip sync
    const jaw = new THREE.Group();
    head.add(jaw);

    // Check if imported model has morph targets or mouth mesh
    let mouthMesh: THREE.Mesh | null = null;
    modelObject.traverse((node) => {
      if ((node as THREE.Mesh).isMesh && /mouth|jaw|lip|face/i.test(node.name)) {
        mouthMesh = node as THREE.Mesh;
      }
    });

    const leftShoulder = new THREE.Group();
    leftShoulder.position.set(-0.3, 0.3, 0);
    chest.add(leftShoulder);
    const leftArm = new THREE.Group();
    leftShoulder.add(leftArm);
    const leftForearm = new THREE.Group();
    leftArm.add(leftForearm);
    const leftHand = new THREE.Group();
    leftForearm.add(leftHand);

    const rightShoulder = new THREE.Group();
    rightShoulder.position.set(0.3, 0.3, 0);
    chest.add(rightShoulder);
    const rightArm = new THREE.Group();
    rightShoulder.add(rightArm);
    const rightForearm = new THREE.Group();
    rightArm.add(rightForearm);
    const rightHand = new THREE.Group();
    rightForearm.add(rightHand);

    const leftThigh = new THREE.Group();
    leftThigh.position.set(-0.15, 0, 0);
    pelvis.add(leftThigh);
    const leftShin = new THREE.Group();
    leftThigh.add(leftShin);
    const leftFoot = new THREE.Group();
    leftShin.add(leftFoot);

    const rightThigh = new THREE.Group();
    rightThigh.position.set(0.15, 0, 0);
    pelvis.add(rightThigh);
    const rightShin = new THREE.Group();
    rightThigh.add(rightShin);
    const rightFoot = new THREE.Group();
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
      characterId: 'custom_imported',
      baseHeight: 2.0,
    };
  }
}
