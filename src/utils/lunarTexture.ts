import * as THREE from 'three';

export function createLunarTextureCanvas(width = 2048, height = 1024): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  ctx.fillStyle = '#181b22';
  ctx.fillRect(0, 0, width, height);

  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  function hashNoise(x: number, y: number, seed: number) {
    let h = seed + x * 374761393 + y * 668265263;
    h = (h ^ (h >> 13)) * 1274126177;
    return (h & 0x7fffffff) / 0x7fffffff;
  }

  for (let y = 0; y < height; y++) {
    const lat = (y / height) * Math.PI - Math.PI / 2;
    for (let x = 0; x < width; x++) {
      const n1 = hashNoise(Math.floor(x / 16), Math.floor(y / 16), 101);
      const n2 = hashNoise(Math.floor(x / 48), Math.floor(y / 48), 202);
      const n3 = hashNoise(Math.floor(x / 120), Math.floor(y / 120), 303);

      let val = n1 * 0.3 + n2 * 0.4 + n3 * 0.3;
      if (lat < -1.39) {
        const polarFactor = Math.max(0, (-lat - 1.39) / 0.18);
        val *= 1 - polarFactor * 0.35;
      }

      const idx = (y * width + x) * 4;
      const baseGrey = Math.floor(35 + val * 110);

      data[idx] = Math.min(255, Math.floor(baseGrey * 0.92));
      data[idx + 1] = Math.min(255, Math.floor(baseGrey * 0.96));
      data[idx + 2] = Math.min(255, Math.floor(baseGrey * 1.05));
      data[idx + 3] = 255;
    }
  }
  ctx.putImageData(imgData, 0, 0);

  for (let i = 0; i < 400; i++) {
    const cx = Math.floor(hashNoise(i, 1, 555) * width);
    const cy = Math.floor(hashNoise(i, 2, 666) * height);
    const r = Math.floor(3 + Math.pow(hashNoise(i, 3, 777), 2) * 45);

    const grad = ctx.createRadialGradient(cx, cy, r * 0.2, cx, cy, r * 1.4);
    grad.addColorStop(0, 'rgba(10, 12, 18, 0.85)');
    grad.addColorStop(0.6, 'rgba(25, 30, 40, 0.4)');
    grad.addColorStop(0.85, 'rgba(180, 200, 220, 0.55)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 1.4, 0, 2 * Math.PI);
    ctx.fill();
  }

  return canvas;
}

export function createLunarThreeTexture(): THREE.CanvasTexture {
  const canvas = createLunarTextureCanvas();
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.needsUpdate = true;
  return texture;
}
