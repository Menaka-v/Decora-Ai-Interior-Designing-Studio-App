import type { Customizations } from '../types/decora';
import { applyProceduralFloorToBuffer } from './floorTextures';
import type { RoomMasks } from './types';

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16);
    const g = parseInt(clean[1] + clean[1], 16);
    const b = parseInt(clean[2] + clean[2], 16);
    return [isNaN(r) ? 200 : r, isNaN(g) ? 200 : g, isNaN(b) ? 200 : b];
  }
  if (clean.length === 6) {
    const r = parseInt(clean.slice(0, 2), 16);
    const g = parseInt(clean.slice(2, 4), 16);
    const b = parseInt(clean.slice(4, 6), 16);
    return [isNaN(r) ? 200 : r, isNaN(g) ? 200 : g, isNaN(b) ? 200 : b];
  }
  return [200, 200, 200];
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;

  if (max === min) return [0, 0, l];

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === rn) h = (gn - bn) / d + (gn < bn ? 6 : 0);
  else if (max === gn) h = (bn - rn) / d + 2;
  else h = (rn - gn) / d + 4;

  return [h / 6, s, l];
}

function hueToRgb(p: number, q: number, t: number): number {
  let tt = t;
  if (tt < 0) tt += 1;
  if (tt > 1) tt -= 1;
  if (tt < 1 / 6) return p + (q - p) * 6 * tt;
  if (tt < 1 / 2) return q;
  if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
  return p;
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  if (s === 0) {
    const v = Math.round(l * 255);
    return [v, v, v];
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return [
    Math.round(hueToRgb(p, q, h + 1 / 3) * 255),
    Math.round(hueToRgb(p, q, h) * 255),
    Math.round(hueToRgb(p, q, h - 1 / 3) * 255),
  ];
}

/**
 * Separable 3x3 box feather on a binary mask (0..255) to create smooth 1.5px edges
 * without jagged paint halos.
 */
export function featherMask(mask: Uint8Array, width: number, height: number): Uint8Array {
  const temp = new Uint8Array(mask.length);
  const out = new Uint8Array(mask.length);

  for (let y = 0; y < height; y += 1) {
    const row = y * width;
    for (let x = 0; x < width; x += 1) {
      const left = x > 0 ? mask[row + x - 1] : mask[row + x];
      const center = mask[row + x];
      const right = x < width - 1 ? mask[row + x + 1] : mask[row + x];
      temp[row + x] = (left + center * 2 + right) >> 2;
    }
  }

  for (let y = 0; y < height; y += 1) {
    const row = y * width;
    const upRow = y > 0 ? (y - 1) * width : row;
    const dnRow = y < height - 1 ? (y + 1) * width : row;
    for (let x = 0; x < width; x += 1) {
      out[row + x] = (temp[upRow + x] + temp[row + x] * 2 + temp[dnRow + x]) >> 2;
    }
  }

  return out;
}

/**
 * Recolors ONLY pixels inside `mask` using HSL hue+saturation replacement and
 * preserved original luminance (with subtle dark/light target correction so dark
 * surfaces can turn bright and light surfaces can turn rich).
 */
function recolorMaskRegion(
  dst: Uint8ClampedArray,
  src: Uint8ClampedArray,
  mask: Uint8Array,
  targetHex: string,
  intensityPct: number,
): void {
  if (intensityPct <= 0) return;
  const intensity = Math.max(0, Math.min(1, intensityPct / 100));
  const [tr, tg, tb] = hexToRgb(targetHex);
  const [th, ts, tl] = rgbToHsl(tr, tg, tb);

  const len = mask.length;
  for (let i = 0; i < len; i += 1) {
    const mVal = mask[i];
    if (mVal < 6) continue;

    const off = i * 4;
    const sr = src[off];
    const sg = src[off + 1];
    const sb = src[off + 2];

    const [, , origL] = rgbToHsl(sr, sg, sb);
    // Preserve texture & shadow modulation (origL), gently shifting average lightness toward target tl
    const adjustedL = Math.max(
      0.03,
      Math.min(0.97, origL * (1 - 0.34 * intensity) + tl * (0.34 * intensity) + (tl - 0.52) * 0.16 * intensity),
    );
    const [nr, ng, nb] = hslToRgb(th, ts, adjustedL);

    const alpha = (mVal / 255) * intensity;
    dst[off] = Math.round(sr * (1 - alpha) + nr * alpha);
    dst[off + 1] = Math.round(sg * (1 - alpha) + ng * alpha);
    dst[off + 2] = Math.round(sb * (1 - alpha) + nb * alpha);
  }
}

/**
 * Renders the full edited room image from the ORIGINAL ImageData + masks + customizations
 * onto the destination canvas. Never mutates originalImageData.
 */
export function renderEditedRoomCanvas(
  targetCanvas: HTMLCanvasElement,
  originalImageData: ImageData,
  roomMasks: RoomMasks | null,
  customizations: Customizations,
  featheredCache?: Partial<Record<'wall' | 'ceiling' | 'furniture' | 'floor', Uint8Array>>,
): void {
  const { width, height, data: origData } = originalImageData;
  if (targetCanvas.width !== width) targetCanvas.width = width;
  if (targetCanvas.height !== height) targetCanvas.height = height;

  const ctx = targetCanvas.getContext('2d');
  if (!ctx) return;

  const outData = new Uint8ClampedArray(origData);

  if (roomMasks) {
    const wallMask =
      featheredCache?.wall ?? featherMask(roomMasks.masks.wall, width, height);
    const ceilingMask =
      featheredCache?.ceiling ?? featherMask(roomMasks.masks.ceiling, width, height);
    const furnitureMask =
      featheredCache?.furniture ?? featherMask(roomMasks.masks.furniture, width, height);
    const floorMask =
      featheredCache?.floor ?? featherMask(roomMasks.masks.floor, width, height);

    if (customizations.wallIntensity > 0) {
      recolorMaskRegion(
        outData,
        origData,
        wallMask,
        customizations.wallColor,
        customizations.wallIntensity,
      );
    }

    if (customizations.ceilingIntensity > 0) {
      recolorMaskRegion(
        outData,
        outData,
        ceilingMask,
        customizations.ceilingColor,
        customizations.ceilingIntensity,
      );
    }

    if (customizations.furnitureIntensity > 0) {
      recolorMaskRegion(
        outData,
        outData,
        furnitureMask,
        customizations.sofaBedColor,
        customizations.furnitureIntensity,
      );
    }

    if (customizations.flooring !== 'Original') {
      applyProceduralFloorToBuffer(
        outData,
        outData,
        floorMask,
        width,
        height,
        customizations.flooring,
        customizations.floorPerspectiveScale,
      );
    }
  }

  // Global Lighting pass (Brightness, Contrast, Warmth, Vignette) directly on pixel buffer
  const brightnessShift = customizations.brightness * 1.4; // -50..50 -> -70..70
  const contrastFactor =
    (259 * (customizations.contrast * 1.8 + 255)) /
    (255 * (259 - customizations.contrast * 1.8));
  const warmthShift = customizations.warmth * 0.7;
  const vignetteStrength = Math.max(0, Math.min(1, customizations.vignette / 100));

  const hasLightingChanges =
    brightnessShift !== 0 ||
    customizations.contrast !== 0 ||
    warmthShift !== 0 ||
    vignetteStrength > 0;

  if (hasLightingChanges) {
    const halfW = width * 0.5;
    const halfH = height * 0.5;
    const maxDistSq = halfW * halfW + halfH * halfH;

    for (let y = 0; y < height; y += 1) {
      const dy = y - halfH;
      const rowOff = y * width;
      for (let x = 0; x < width; x += 1) {
        const off = (rowOff + x) * 4;
        let r = outData[off];
        let g = outData[off + 1];
        let b = outData[off + 2];

        // Warmth: shift R up, B down (or vice versa for cool)
        r += warmthShift;
        g += warmthShift * 0.2;
        b -= warmthShift;

        // Contrast & brightness
        r = contrastFactor * (r - 128) + 128 + brightnessShift;
        g = contrastFactor * (g - 128) + 128 + brightnessShift;
        b = contrastFactor * (b - 128) + 128 + brightnessShift;

        // Soft edge vignette
        if (vignetteStrength > 0) {
          const dx = x - halfW;
          const distNorm = Math.sqrt((dx * dx + dy * dy) / maxDistSq);
          const falloff = Math.max(0, distNorm - 0.35) / 0.65;
          const vig = 1 - vignetteStrength * 0.55 * falloff * falloff;
          r *= vig;
          g *= vig;
          b *= vig;
        }

        outData[off] = Math.max(0, Math.min(255, Math.round(r)));
        outData[off + 1] = Math.max(0, Math.min(255, Math.round(g)));
        outData[off + 2] = Math.max(0, Math.min(255, Math.round(b)));
      }
    }
  }

  const outImageData = new ImageData(outData, width, height);
  ctx.putImageData(outImageData, 0, 0);
}
