import * as THREE from 'three';

// Cache generated procedural textures to conserve GPU memory
const textureCache = new Map<string, THREE.CanvasTexture>();

export class ProceduralTextures {
  /**
   * Generates weathered hockey mask texture with subtle grime, scratches, and red triangular chevrons
   */
  static getHockeyMaskTexture(): THREE.CanvasTexture {
    const key = 'hockey_mask';
    if (textureCache.has(key)) return textureCache.get(key)!;

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Base weathered off-white/bone color
    ctx.fillStyle = '#ddd3bd';
    ctx.fillRect(0, 0, 512, 512);

    // Weathering noise & grime streaks
    for (let i = 0; i < 2000; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const gray = Math.floor(Math.random() * 80 + 80);
      ctx.fillStyle = `rgba(${gray}, ${gray - 15}, ${gray - 30}, 0.08)`;
      ctx.fillRect(x, y, Math.random() * 8 + 2, Math.random() * 4 + 1);
    }

    // Dirt around perimeter and ventilation holes
    const grad = ctx.createRadialGradient(256, 256, 120, 256, 256, 256);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(0.8, 'rgba(60, 45, 30, 0.15)');
    grad.addColorStop(1, 'rgba(30, 20, 10, 0.45)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);

    // Weathered Red Chevrons (Top forehead triangle & cheek triangles)
    ctx.fillStyle = '#8b1c1c';
    // Forehead chevron
    ctx.beginPath();
    ctx.moveTo(256, 100);
    ctx.lineTo(230, 160);
    ctx.lineTo(282, 160);
    ctx.closePath();
    ctx.fill();

    // Left cheek chevron
    ctx.beginPath();
    ctx.moveTo(170, 290);
    ctx.lineTo(130, 315);
    ctx.lineTo(165, 340);
    ctx.closePath();
    ctx.fill();

    // Right cheek chevron
    ctx.beginPath();
    ctx.moveTo(342, 290);
    ctx.lineTo(382, 315);
    ctx.lineTo(347, 340);
    ctx.closePath();
    ctx.fill();

    // Scratches across surface
    ctx.strokeStyle = 'rgba(50, 40, 30, 0.3)';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 15; i++) {
      ctx.beginPath();
      const sx = Math.random() * 400 + 50;
      const sy = Math.random() * 400 + 50;
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + (Math.random() - 0.5) * 60, sy + (Math.random() - 0.5) * 60);
      ctx.stroke();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    textureCache.set(key, tex);
    return tex;
  }

  /**
   * Generates blood-rusted pitted steel texture for the slasher machete
   */
  static getRustedSteelTexture(): THREE.CanvasTexture {
    const key = 'rusted_steel';
    if (textureCache.has(key)) return textureCache.get(key)!;

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Base dark industrial steel
    ctx.fillStyle = '#4a4d52';
    ctx.fillRect(0, 0, 512, 512);

    // Heavy rust and corrosion patches
    for (let i = 0; i < 120; i++) {
      const rx = Math.random() * 512;
      const ry = Math.random() * 512;
      const rad = Math.random() * 40 + 10;
      const rustGrad = ctx.createRadialGradient(rx, ry, 2, rx, ry, rad);
      rustGrad.addColorStop(0, 'rgba(125, 48, 20, 0.7)');
      rustGrad.addColorStop(0.7, 'rgba(84, 32, 12, 0.4)');
      rustGrad.addColorStop(1, 'rgba(40, 20, 10, 0)');
      ctx.fillStyle = rustGrad;
      ctx.beginPath();
      ctx.arc(rx, ry, rad, 0, Math.PI * 2);
      ctx.fill();
    }

    // Scratched sharp blade edge bevel at top
    const edgeGrad = ctx.createLinearGradient(0, 0, 0, 80);
    edgeGrad.addColorStop(0, '#c8cdd4');
    edgeGrad.addColorStop(1, 'rgba(74, 77, 82, 0)');
    ctx.fillStyle = edgeGrad;
    ctx.fillRect(0, 0, 512, 80);

    // Deep dried blood streaks
    ctx.strokeStyle = 'rgba(70, 8, 8, 0.75)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(100, 30);
    ctx.quadraticCurveTo(240, 70, 380, 45);
    ctx.stroke();

    const tex = new THREE.CanvasTexture(canvas);
    textureCache.set(key, tex);
    return tex;
  }

  /**
   * Procedural Cyberpunk Neon Circuit & Grid texture
   */
  static getCyberpunkPanelTexture(): THREE.CanvasTexture {
    const key = 'cyberpunk_panel';
    if (textureCache.has(key)) return textureCache.get(key)!;

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#0a0d16';
    ctx.fillRect(0, 0, 512, 512);

    // Grid lines
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2;
    const step = 64;
    for (let x = 0; x < 512; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 512);
      ctx.stroke();
    }
    for (let y = 0; y < 512; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(512, y);
      ctx.stroke();
    }

    // Neon circuit traces
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 10;

    ctx.beginPath();
    ctx.moveTo(64, 128);
    ctx.lineTo(192, 128);
    ctx.lineTo(256, 192);
    ctx.lineTo(448, 192);
    ctx.stroke();

    ctx.strokeStyle = '#ec4899';
    ctx.shadowColor = '#ff00aa';
    ctx.beginPath();
    ctx.moveTo(128, 384);
    ctx.lineTo(256, 384);
    ctx.lineTo(320, 320);
    ctx.lineTo(448, 320);
    ctx.stroke();

    // Data nodes
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(256, 192, 6, 0, Math.PI * 2);
    ctx.arc(320, 320, 6, 0, Math.PI * 2);
    ctx.fill();

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    textureCache.set(key, tex);
    return tex;
  }

  /**
   * Procedural wet asphalt with reflective puddles
   */
  static getWetAsphaltTexture(): THREE.CanvasTexture {
    const key = 'wet_asphalt';
    if (textureCache.has(key)) return textureCache.get(key)!;

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#181a1f';
    ctx.fillRect(0, 0, 512, 512);

    // Gravel speckles
    for (let i = 0; i < 4000; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const shade = Math.floor(Math.random() * 40 + 20);
      ctx.fillStyle = `rgb(${shade}, ${shade}, ${shade})`;
      ctx.fillRect(x, y, 2, 2);
    }

    // Wet puddles
    ctx.fillStyle = 'rgba(30, 35, 45, 0.4)';
    for (let i = 0; i < 8; i++) {
      const px = Math.random() * 400 + 50;
      const py = Math.random() * 400 + 50;
      ctx.beginPath();
      ctx.ellipse(px, py, Math.random() * 60 + 30, Math.random() * 40 + 20, Math.random() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(4, 4);
    textureCache.set(key, tex);
    return tex;
  }

  /**
   * Procedural Wood plank texture for Crystal Lake pier and cabin
   */
  static getWoodPlankTexture(): THREE.CanvasTexture {
    const key = 'wood_planks';
    if (textureCache.has(key)) return textureCache.get(key)!;

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Weathered dark cedar wood
    ctx.fillStyle = '#3e2e21';
    ctx.fillRect(0, 0, 512, 512);

    const plankHeight = 64;
    for (let y = 0; y < 512; y += plankHeight) {
      // Dark seam between planks
      ctx.fillStyle = '#1c140e';
      ctx.fillRect(0, y + plankHeight - 3, 512, 3);

      // Wood grain lines
      ctx.strokeStyle = 'rgba(30, 20, 12, 0.45)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 8; i++) {
        ctx.beginPath();
        const gy = y + Math.random() * (plankHeight - 6);
        ctx.moveTo(0, gy);
        ctx.bezierCurveTo(170, gy + (Math.random() - 0.5) * 8, 340, gy + (Math.random() - 0.5) * 8, 512, gy);
        ctx.stroke();
      }

      // Occasional knot
      if (Math.random() > 0.4) {
        const kx = Math.random() * 400 + 56;
        const ky = y + plankHeight / 2;
        ctx.fillStyle = '#1a120b';
        ctx.beginPath();
        ctx.ellipse(kx, ky, 8, 5, 0.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    textureCache.set(key, tex);
    return tex;
  }

  /**
   * Procedural Martian crag texture
   */
  static getMartianDirtTexture(): THREE.CanvasTexture {
    const key = 'martian_dirt';
    if (textureCache.has(key)) return textureCache.get(key)!;

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#8f3b20';
    ctx.fillRect(0, 0, 512, 512);

    // Dust dunes and rocky ripples
    for (let i = 0; i < 3000; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const r = Math.floor(Math.random() * 40 + 120);
      const g = Math.floor(Math.random() * 30 + 40);
      const b = Math.floor(Math.random() * 20 + 20);
      ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
      ctx.fillRect(x, y, 3, 2);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(4, 4);
    textureCache.set(key, tex);
    return tex;
  }
}
