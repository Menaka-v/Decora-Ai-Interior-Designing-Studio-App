import type { FlooringType } from '../types/decora';

const textureCache = new Map<string, ImageData>();

function hash2d(x: number, y: number): number {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
  return n - Math.floor(n);
}

function smoothNoise(x: number, y: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);

  const a = hash2d(ix, iy);
  const b = hash2d(ix + 1, iy);
  const c = hash2d(ix, iy + 1);
  const d = hash2d(ix + 1, iy + 1);

  return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
}

function fbm(x: number, y: number): number {
  let val = 0;
  let amp = 0.5;
  let freq = 1;
  for (let i = 0; i < 4; i += 1) {
    val += amp * smoothNoise(x * freq, y * freq);
    freq *= 2.02;
    amp *= 0.5;
  }
  return val;
}

export function normalizeFloorType(floor: FlooringType): FlooringType {
  if (floor === 'Wood') return 'Light Wood';
  if (floor === 'Tiles') return 'Gray Tiles';
  return floor;
}

/**
 * Generates a tileable 512x512 procedural floor texture on an offscreen canvas.
 */
export function getProceduralFloorTexture(floorInput: FlooringType): ImageData | null {
  const floor = normalizeFloorType(floorInput);
  if (floor === 'Original') return null;

  const cached = textureCache.get(floor);
  if (cached) return cached;

  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const img = ctx.createImageData(size, size);
  const d = img.data;

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const idx = (y * size + x) * 4;
      let r = 200;
      let g = 180;
      let b = 150;

      if (floor === 'Light Wood' || floor === 'Dark Wood') {
        const plankHeight = 64;
        const plankRow = Math.floor(y / plankHeight);
        const rowOffset = (plankRow % 2) * 180 + (plankRow % 3) * 70;
        const plankCol = Math.floor((x + rowOffset) / 256);
        const localY = y % plankHeight;
        const localX = (x + rowOffset) % 256;
        const isSeam = localY <= 1 || localX <= 1;

        const plankTone = hash2d(plankCol, plankRow) * 18 - 9;
        const grain =
          Math.sin(
            (y + fbm(x * 0.015, y * 0.04) * 26) * 0.45 + hash2d(plankCol, plankRow) * 6,
          ) *
            0.5 +
          0.5;
        const fineGrain = smoothNoise(x * 0.08, y * 0.55) * 10 - 5;

        if (floor === 'Light Wood') {
          r = 212 + plankTone + grain * 18 + fineGrain;
          g = 176 + plankTone + grain * 14 + fineGrain;
          b = 132 + plankTone + grain * 10 + fineGrain;
          if (isSeam) {
            r -= 44;
            g -= 40;
            b -= 34;
          }
        } else {
          r = 98 + plankTone + grain * 16 + fineGrain;
          g = 66 + plankTone * 0.8 + grain * 11 + fineGrain * 0.7;
          b = 45 + plankTone * 0.6 + grain * 8 + fineGrain * 0.5;
          if (isSeam) {
            r -= 28;
            g -= 22;
            b -= 18;
          }
        }
      } else if (floor === 'Marble') {
        const tileSize = 256;
        const tx = x % tileSize;
        const ty = y % tileSize;
        const isSeam = tx <= 1 || ty <= 1;

        const warp = fbm(x * 0.012, y * 0.012) * 8;
        const vein = Math.abs(Math.sin((x * 0.018 + y * 0.012) + warp));
        const sharpVein = Math.pow(1 - vein, 5);
        const cloud = fbm(x * 0.008, y * 0.008);

        r = 244 - cloud * 12 - sharpVein * 68;
        g = 242 - cloud * 12 - sharpVein * 66;
        b = 238 - cloud * 10 - sharpVein * 60;
        if (isSeam) {
          r -= 24;
          g -= 24;
          b -= 22;
        }
      } else if (floor === 'Gray Tiles') {
        const tileSize = 128;
        const tx = x % tileSize;
        const ty = y % tileSize;
        const col = Math.floor(x / tileSize);
        const row = Math.floor(y / tileSize);
        const isGrout = tx <= 2 || ty <= 2;

        const tileTone = hash2d(col, row) * 10 - 5;
        const speckle = fbm(x * 0.06, y * 0.06) * 16 - 8;

        if (isGrout) {
          r = 112;
          g = 116;
          b = 122;
        } else {
          r = 168 + tileTone + speckle;
          g = 172 + tileTone + speckle;
          b = 176 + tileTone + speckle;
        }
      } else if (floor === 'Carpet') {
        const weave =
          ((x + y) % 4 === 0 ? 8 : -4) +
          (smoothNoise(x * 0.25, y * 0.25) - 0.5) * 24 +
          (fbm(x * 0.03, y * 0.03) - 0.5) * 14;
        r = 205 + weave;
        g = 197 + weave;
        b = 185 + weave;
      } else if (floor === 'Concrete') {
        const cloud = fbm(x * 0.018, y * 0.018) * 32 - 16;
        const pores = smoothNoise(x * 0.22, y * 0.22) * 12 - 6;
        r = 152 + cloud + pores;
        g = 154 + cloud + pores;
        b = 157 + cloud + pores;
      }

      d[idx] = Math.max(0, Math.min(255, Math.round(r)));
      d[idx + 1] = Math.max(0, Math.min(255, Math.round(g)));
      d[idx + 2] = Math.max(0, Math.min(255, Math.round(b)));
      d[idx + 3] = 255;
    }
  }

  textureCache.set(floor, img);
  return img;
}

/**
 * Applies the procedural floor texture inside the detected floor mask with
 * pseudo-3D perspective tapering (tiles/planks scale smaller near top of floor mask)
 * and luminance-preserving blending so existing room shadows stay natural.
 */
export function applyProceduralFloorToBuffer(
  dst: Uint8ClampedArray,
  src: Uint8ClampedArray,
  floorMask: Uint8Array,
  width: number,
  height: number,
  floorType: FlooringType,
  perspectiveScale: number,
): void {
  const texture = getProceduralFloorTexture(floorType);
  if (!texture) return;

  // Find floor vertical bounds for perspective depth mapping
  let minY = height;
  let maxY = 0;
  for (let y = 0; y < height; y += 2) {
    const rowOff = y * width;
    for (let x = 0; x < width; x += 4) {
      if (floorMask[rowOff + x] > 127) {
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
        break;
      }
    }
  }

  if (maxY <= minY) return;

  const texW = texture.width;
  const texH = texture.height;
  const texData = texture.data;
  const floorSpan = Math.max(1, maxY - minY);
  const tileBaseScale = 0.65 + (1 - Math.max(0.15, Math.min(1, perspectiveScale))) * 1.45;
  const halfW = width * 0.5;

  for (let y = minY; y <= maxY; y += 1) {
    // t=0 at horizon (top of floor mask), t=1 at camera foreground (bottom)
    const t = Math.max(0.05, (y - minY) / floorSpan);
    // Perspective depth projection: distant rows compress faster in V and converge horizontally in U
    const depthFactor = 0.32 + t * 1.28;
    const invDepth = 1 / depthFactor;
    const vCoord = ((1 - t) * 420 * tileBaseScale * (0.65 + 0.55 * invDepth)) % texH;
    const ty = (Math.floor(vCoord) + texH) % texH;

    const rowOff = y * width;
    for (let x = 0; x < width; x += 1) {
      const mVal = floorMask[rowOff + x];
      if (mVal < 8) continue;

      const uCoord = ((x - halfW) * invDepth * tileBaseScale * 0.9 + texW * 10) % texW;
      const tx = (Math.floor(uCoord) + texW) % texW;
      const tIdx = (ty * texW + tx) * 4;

      const tr = texData[tIdx];
      const tg = texData[tIdx + 1];
      const tb = texData[tIdx + 2];

      const pOff = (rowOff + x) * 4;
      const sr = src[pOff];
      const sg = src[pOff + 1];
      const sb = src[pOff + 2];

      // Preserve room lighting & shadows: compare pixel luminance against regional floor norm
      const origLum = (0.299 * sr + 0.587 * sg + 0.114 * sb) / 255;
      const shadowBoost = 0.48 + origLum * 0.72;

      const blendedR = Math.min(255, tr * shadowBoost);
      const blendedG = Math.min(255, tg * shadowBoost);
      const blendedB = Math.min(255, tb * shadowBoost);

      const alpha = (mVal / 255) * 0.92;
      dst[pOff] = Math.round(sr * (1 - alpha) + blendedR * alpha);
      dst[pOff + 1] = Math.round(sg * (1 - alpha) + blendedG * alpha);
      dst[pOff + 2] = Math.round(sb * (1 - alpha) + blendedB * alpha);
    }
  }
}
