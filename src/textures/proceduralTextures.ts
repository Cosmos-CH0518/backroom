import * as THREE from 'three';

/**
 * Creates rich procedural textures using HTML Canvas.
 * Instant generation, zero network lag, authentic Backrooms Level 0 look.
 */

// 1. Level 0 Mono-Yellow Wallpaper Texture
export function createWallpaperTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Base yellowish-tan background
  ctx.fillStyle = '#bfa559';
  ctx.fillRect(0, 0, 512, 512);

  // Subtle repeating vertical wallpaper stripe pattern
  const stripeWidth = 16;
  for (let x = 0; x < 512; x += stripeWidth) {
    ctx.fillStyle = (x / stripeWidth) % 2 === 0 ? '#b69a4d' : '#c3ab61';
    ctx.fillRect(x, 0, stripeWidth, 512);

    // Fine stripe accent line
    ctx.fillStyle = 'rgba(120, 95, 35, 0.15)';
    ctx.fillRect(x, 0, 1.5, 512);
  }

  // Diamond/Fleur vintage floral geometric wallpaper motif
  ctx.fillStyle = 'rgba(100, 80, 25, 0.08)';
  for (let y = 0; y < 512; y += 32) {
    for (let x = 0; x < 512; x += 32) {
      const offsetX = (y / 32) % 2 === 0 ? 0 : 16;
      ctx.beginPath();
      ctx.arc(x + offsetX, y, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Fiber noise & mold stains
  const imgData = ctx.getImageData(0, 0, 512, 512);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 22;
    data[i] = Math.min(255, Math.max(0, data[i] + noise));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise * 0.8));
  }
  ctx.putImageData(imgData, 0, 0);

  // Water stain / mold gradients
  const grad = ctx.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0, 'rgba(60, 50, 20, 0.15)');
  grad.addColorStop(0.2, 'rgba(0, 0, 0, 0)');
  grad.addColorStop(0.85, 'rgba(0, 0, 0, 0)');
  grad.addColorStop(1, 'rgba(50, 40, 15, 0.3)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  // Bottom Baseboard / Skirting board
  ctx.fillStyle = '#4a3d24';
  ctx.fillRect(0, 485, 512, 27);
  ctx.fillStyle = '#2d2414';
  ctx.fillRect(0, 483, 512, 2);
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.fillRect(0, 486, 512, 3);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 1);
  return texture;
}

// 2. Damp/Moist Office Carpet Texture
export function createCarpetTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Base dirty olive/tan carpet hue
  ctx.fillStyle = '#655e42';
  ctx.fillRect(0, 0, 512, 512);

  // Heavy speckled carpet fibers
  const imgData = ctx.getImageData(0, 0, 512, 512);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const fiberNoise = (Math.random() - 0.5) * 45;
    data[i] = Math.min(255, Math.max(0, data[i] + fiberNoise));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + fiberNoise * 0.95));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + fiberNoise * 0.7));
  }
  ctx.putImageData(imgData, 0, 0);

  // Damp/wet fluid stains
  for (let s = 0; s < 6; s++) {
    const sx = Math.random() * 512;
    const sy = Math.random() * 512;
    const rad = 25 + Math.random() * 50;
    const stainGrad = ctx.createRadialGradient(sx, sy, 0, sx, sy, rad);
    stainGrad.addColorStop(0, 'rgba(35, 30, 18, 0.45)');
    stainGrad.addColorStop(0.6, 'rgba(45, 40, 22, 0.25)');
    stainGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = stainGrad;
    ctx.beginPath();
    ctx.arc(sx, sy, rad, 0, Math.PI * 2);
    ctx.fill();
  }

  // Subtle 2x2 meter carpet seam tile lines
  ctx.strokeStyle = 'rgba(20, 18, 10, 0.35)';
  ctx.lineWidth = 2;
  ctx.strokeRect(0, 0, 512, 512);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 1);
  return texture;
}

// 3. Acoustic Drop Ceiling Tiles
export function createCeilingTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Off-white / aged grey-yellow plaster base
  ctx.fillStyle = '#cbc7b4';
  ctx.fillRect(0, 0, 512, 512);

  // 2x2 grid tiles
  const tileSize = 256;
  ctx.strokeStyle = '#6e695c';
  ctx.lineWidth = 6;
  for (let x = 0; x <= 512; x += tileSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 512);
    ctx.stroke();
  }
  for (let y = 0; y <= 512; y += tileSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y);
    ctx.stroke();
  }

  // Metal T-bar grid bevel
  ctx.strokeStyle = '#8f8878';
  ctx.lineWidth = 2;
  for (let x = 0; x <= 512; x += tileSize) {
    ctx.beginPath();
    ctx.moveTo(x - 2, 0);
    ctx.lineTo(x - 2, 512);
    ctx.stroke();
  }

  // Acoustic noise and worm-like perforations
  ctx.fillStyle = 'rgba(70, 65, 55, 0.4)';
  for (let i = 0; i < 900; i++) {
    const px = Math.random() * 512;
    const py = Math.random() * 512;
    const len = 1 + Math.random() * 4;
    ctx.fillRect(px, py, len, 1.2);
  }

  // Aged yellowing
  const grad = ctx.createRadialGradient(256, 256, 50, 256, 256, 320);
  grad.addColorStop(0, 'rgba(215, 195, 120, 0.15)');
  grad.addColorStop(1, 'rgba(80, 70, 45, 0.3)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 1);
  return texture;
}

// 4. Fluorescent Ceiling Light Diffuser Panel
export function createLightFixtureTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Aluminium frame
  ctx.fillStyle = '#444';
  ctx.fillRect(0, 0, 256, 256);

  // Milky light diffuser
  ctx.fillStyle = '#fffae0';
  ctx.fillRect(16, 16, 224, 224);

  // Twin fluorescent tubes glow
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(50, 24, 30, 208);
  ctx.fillRect(176, 24, 30, 208);

  // Inner grid / prismatic plastic
  ctx.fillStyle = 'rgba(200, 180, 120, 0.15)';
  for (let y = 16; y < 240; y += 8) {
    ctx.fillRect(16, y, 224, 2);
  }

  return new THREE.CanvasTexture(canvas);
}

// 5. Emergency Exit Door Texture
export function createExitDoorTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Heavy steel door
  ctx.fillStyle = '#2f3438';
  ctx.fillRect(0, 0, 512, 512);

  // Door Frame
  ctx.strokeStyle = '#181a1c';
  ctx.lineWidth = 16;
  ctx.strokeRect(8, 8, 496, 496);

  // Door panels
  ctx.strokeStyle = '#1c2024';
  ctx.lineWidth = 6;
  ctx.strokeRect(40, 40, 432, 200);
  ctx.strokeRect(40, 270, 432, 200);

  // Luminous EXIT sign above or on door
  ctx.fillStyle = '#0a3818';
  ctx.fillRect(120, 80, 272, 80);
  ctx.strokeStyle = '#12b848';
  ctx.lineWidth = 4;
  ctx.strokeRect(120, 80, 272, 80);

  ctx.fillStyle = '#39ff14';
  ctx.font = 'bold 38px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('EXIT / 非常口', 256, 120);

  // Push bar handle
  ctx.fillStyle = '#e63946';
  ctx.fillRect(60, 280, 392, 24);
  ctx.fillStyle = '#888';
  ctx.fillRect(40, 275, 20, 34);
  ctx.fillRect(452, 275, 20, 34);

  // Keyhole / Lock
  ctx.fillStyle = '#e5a93b';
  ctx.beginPath();
  ctx.arc(430, 230, 12, 0, Math.PI * 2);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

// 6. Smiler / Entity Face Sprite Texture
export function createEntityTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, 256, 256);

  // Shadowy body silhouette
  const bodyGrad = ctx.createRadialGradient(128, 128, 10, 128, 128, 120);
  bodyGrad.addColorStop(0, 'rgba(0, 0, 0, 0.95)');
  bodyGrad.addColorStop(0.7, 'rgba(5, 5, 5, 0.8)');
  bodyGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.arc(128, 128, 120, 0, Math.PI * 2);
  ctx.fill();

  // Glowing white piercing eyes
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = '#ffffff';
  ctx.shadowBlur = 15;

  // Left Eye
  ctx.beginPath();
  ctx.ellipse(85, 95, 14, 20, Math.PI / 10, 0, Math.PI * 2);
  ctx.fill();

  // Right Eye
  ctx.beginPath();
  ctx.ellipse(171, 95, 14, 20, -Math.PI / 10, 0, Math.PI * 2);
  ctx.fill();

  // Wide menacing glowing grin with razor teeth
  ctx.beginPath();
  ctx.arc(128, 130, 65, 0.15 * Math.PI, 0.85 * Math.PI, false);
  ctx.lineWidth = 14;
  ctx.strokeStyle = '#ffffff';
  ctx.stroke();

  // Teeth details
  ctx.fillStyle = '#ffffff';
  for (let a = 0.22 * Math.PI; a <= 0.78 * Math.PI; a += 0.08 * Math.PI) {
    const tx = 128 + Math.cos(a) * 65;
    const ty = 130 + Math.sin(a) * 65;
    ctx.fillRect(tx - 3, ty - 12, 6, 12);
  }

  return new THREE.CanvasTexture(canvas);
}

// 7. Graffiti Decal Texture
export function createGraffitiTexture(text: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, 512, 256);

  ctx.fillStyle = '#8b0000'; // Blood red spray paint
  ctx.font = '900 36px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Spray drip effect
  ctx.shadowColor = 'rgba(139, 0, 0, 0.6)';
  ctx.shadowBlur = 8;
  ctx.fillText(text, 256, 128);

  // Scratch marks
  ctx.strokeStyle = 'rgba(100, 0, 0, 0.8)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(80, 70);
  ctx.lineTo(440, 190);
  ctx.moveTo(70, 180);
  ctx.lineTo(450, 80);
  ctx.stroke();

  return new THREE.CanvasTexture(canvas);
}
