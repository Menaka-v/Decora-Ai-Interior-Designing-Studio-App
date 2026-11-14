import type { Customizations, DecorAddon, DesignStyleId, FlooringType, LightingMood } from '../types/decora';
import { renderEditedRoomCanvas } from './recolor';
import type { OverlayKind, OverlayVariant, RoomMasks } from './types';

export interface StylePresetDefinition {
  id: DesignStyleId;
  name: string;
  tagline: string;
  wallColor: string;
  wallColorName: string;
  wallIntensity: number;
  ceilingColor: string;
  ceilingColorName: string;
  ceilingIntensity: number;
  flooring: FlooringType;
  sofaBedColor: string;
  furnitureIntensity: number;
  lightingMood: LightingMood;
  brightness: number;
  contrast: number;
  warmth: number;
  vignette: number;
  decorItems: Array<{ kind: OverlayKind; variant: OverlayVariant; color: string; addon: DecorAddon }>;
}

export const STUDIO_STYLE_PRESETS: StylePresetDefinition[] = [
  {
    id: 'modern',
    name: 'Modern',
    tagline: 'Alabaster walls, walnut accents & sculptural glow',
    wallColor: '#F3F0EA',
    wallColorName: 'Warm Alabaster',
    wallIntensity: 68,
    ceilingColor: '#FAFAFA',
    ceilingColorName: 'Crisp Chalk',
    ceilingIntensity: 35,
    flooring: 'Light Wood',
    sofaBedColor: '#0F5E66',
    furnitureIntensity: 75,
    lightingMood: 'Natural Daylight',
    brightness: 6,
    contrast: 8,
    warmth: 4,
    vignette: 8,
    decorItems: [
      { kind: 'wallArt', variant: 'triptych', color: '#E86A58', addon: 'Wall Art' },
      { kind: 'floorLamp', variant: 'default', color: '#F6E3B4', addon: 'Lamps' },
      { kind: 'rug', variant: 'rectangular', color: '#DFD6C7', addon: 'Rugs' },
    ],
  },
  {
    id: 'minimalist',
    name: 'Minimalist',
    tagline: 'Pure chalk walls, pale concrete & quiet form',
    wallColor: '#F5F5F4',
    wallColorName: 'Pure Chalk',
    wallIntensity: 72,
    ceilingColor: '#FFFFFF',
    ceilingColorName: 'Pure White',
    ceilingIntensity: 45,
    flooring: 'Concrete',
    sofaBedColor: '#CBD5E1',
    furnitureIntensity: 70,
    lightingMood: 'Cool',
    brightness: 10,
    contrast: 4,
    warmth: -6,
    vignette: 0,
    decorItems: [
      { kind: 'mirror', variant: 'default', color: '#334155', addon: 'Mirrors' },
      { kind: 'plants', variant: 'snake', color: '#2F6E49', addon: 'Plants' },
    ],
  },
  {
    id: 'scandinavian',
    name: 'Scandinavian',
    tagline: 'Sage mist walls, pale oak & airy sheer linen',
    wallColor: '#A9BFA8',
    wallColorName: 'Sage Mist',
    wallIntensity: 66,
    ceilingColor: '#FAFAFA',
    ceilingColorName: 'Crisp Chalk',
    ceilingIntensity: 30,
    flooring: 'Light Wood',
    sofaBedColor: '#E3DAC9',
    furnitureIntensity: 68,
    lightingMood: 'Natural Daylight',
    brightness: 12,
    contrast: 4,
    warmth: 6,
    vignette: 0,
    decorItems: [
      { kind: 'curtains', variant: 'sheer', color: '#F8FAFC', addon: 'Curtains' },
      { kind: 'plants', variant: 'monstera', color: '#2F6E49', addon: 'Plants' },
      { kind: 'rug', variant: 'round', color: '#D6C3A5', addon: 'Rugs' },
    ],
  },
  {
    id: 'bohemian',
    name: 'Bohemian',
    tagline: 'Sunlit terracotta, kilim rugs & lush foliage',
    wallColor: '#D9785C',
    wallColorName: 'Sunlit Terracotta',
    wallIntensity: 64,
    ceilingColor: '#FAF3E7',
    ceilingColorName: 'Warm Ivory',
    ceilingIntensity: 30,
    flooring: 'Dark Wood',
    sofaBedColor: '#D49A2A',
    furnitureIntensity: 74,
    lightingMood: 'Warm',
    brightness: 4,
    contrast: 6,
    warmth: 18,
    vignette: 18,
    decorItems: [
      { kind: 'rug', variant: 'patterned', color: '#C96F53', addon: 'Rugs' },
      { kind: 'plants', variant: 'hanging', color: '#2F6E49', addon: 'Plants' },
      { kind: 'cushions', variant: 'default', color: '#E07A5F', addon: 'Cushions' },
    ],
  },
  {
    id: 'luxury',
    name: 'Luxury',
    tagline: 'Deep slate walls, Calacatta marble & gold lighting',
    wallColor: '#384659',
    wallColorName: 'Deep Slate',
    wallIntensity: 74,
    ceilingColor: '#F6F1E7',
    ceilingColorName: 'Warm Ivory',
    ceilingIntensity: 35,
    flooring: 'Marble',
    sofaBedColor: '#1E3A5F',
    furnitureIntensity: 78,
    lightingMood: 'Evening',
    brightness: -2,
    contrast: 12,
    warmth: 12,
    vignette: 26,
    decorItems: [
      { kind: 'chandelier', variant: 'default', color: '#D4AF37', addon: 'Chandelier' },
      { kind: 'mirror', variant: 'default', color: '#D4AF37', addon: 'Mirrors' },
      { kind: 'curtains', variant: 'blackout', color: '#DFD2BE', addon: 'Curtains' },
    ],
  },
  {
    id: 'coastal',
    name: 'Coastal',
    tagline: 'Coastal teal walls, sheer curtains & pale oak',
    wallColor: '#7DB9B6',
    wallColorName: 'Coastal Teal',
    wallIntensity: 64,
    ceilingColor: '#FFFFFF',
    ceilingColorName: 'Pure White',
    ceilingIntensity: 40,
    flooring: 'Light Wood',
    sofaBedColor: '#F5EFE0',
    furnitureIntensity: 70,
    lightingMood: 'Natural Daylight',
    brightness: 14,
    contrast: 4,
    warmth: 2,
    vignette: 0,
    decorItems: [
      { kind: 'curtains', variant: 'sheer', color: '#F8FAFC', addon: 'Curtains' },
      { kind: 'rug', variant: 'round', color: '#DFC9A6', addon: 'Rugs' },
      { kind: 'plants', variant: 'monstera', color: '#357A52', addon: 'Plants' },
    ],
  },
  {
    id: 'japandi',
    name: 'Japandi',
    tagline: 'Sandstone clay, warm ash & meditative calm',
    wallColor: '#D4B99E',
    wallColorName: 'Sandstone Clay',
    wallIntensity: 68,
    ceilingColor: '#F5F0E6',
    ceilingColorName: 'Warm Alabaster',
    ceilingIntensity: 30,
    flooring: 'Light Wood',
    sofaBedColor: '#5C6451',
    furnitureIntensity: 72,
    lightingMood: 'Warm',
    brightness: 4,
    contrast: 4,
    warmth: 10,
    vignette: 10,
    decorItems: [
      { kind: 'shelves', variant: 'default', color: '#A67B5B', addon: 'Floating Shelves' },
      { kind: 'plants', variant: 'snake', color: '#2F6E49', addon: 'Plants' },
      { kind: 'tableLamp', variant: 'default', color: '#FAF3E0', addon: 'Lamps' },
    ],
  },
  {
    id: 'industrial',
    name: 'Industrial',
    tagline: 'Warm gray walls, gray tiles & cognac tones',
    wallColor: '#78716C',
    wallColorName: 'Warm Slate',
    wallIntensity: 65,
    ceilingColor: '#E5E7EB',
    ceilingColorName: 'Soft Concrete',
    ceilingIntensity: 25,
    flooring: 'Gray Tiles',
    sofaBedColor: '#9A5B32',
    furnitureIntensity: 78,
    lightingMood: 'Evening',
    brightness: -2,
    contrast: 14,
    warmth: 6,
    vignette: 22,
    decorItems: [
      { kind: 'wallArt', variant: 'gallery', color: '#9A5B32', addon: 'Wall Art' },
      { kind: 'floorLamp', variant: 'default', color: '#F6E3B4', addon: 'Lamps' },
    ],
  },
];

export function presetToCustomizations(
  preset: StylePresetDefinition,
  prev: Customizations,
): Customizations {
  return {
    ...prev,
    wallColor: preset.wallColor,
    wallColorName: preset.wallColorName,
    wallIntensity: preset.wallIntensity,
    ceilingColor: preset.ceilingColor,
    ceilingColorName: preset.ceilingColorName,
    ceilingIntensity: preset.ceilingIntensity,
    flooring: preset.flooring,
    sofaBedColor: preset.sofaBedColor,
    furnitureIntensity: preset.furnitureIntensity,
    lightingMood: preset.lightingMood,
    brightness: preset.brightness,
    contrast: preset.contrast,
    warmth: preset.warmth,
    vignette: preset.vignette,
    decorAddons: Array.from(new Set(preset.decorItems.map((d) => d.addon))),
  };
}

/**
 * Downsamples the current room + masks to ~220px wide and renders live
 * thumbnail previews for each of the 8 style presets so users can compare
 * before clicking.
 */
export function renderAllPresetThumbnails(
  originalImageData: ImageData,
  roomMasks: RoomMasks | null,
  baseCustomizations: Customizations,
): Record<string, string> {
  const thumbW = 220;
  const thumbH = Math.max(120, Math.round((originalImageData.height / originalImageData.width) * thumbW));

  const srcCanvas = document.createElement('canvas');
  srcCanvas.width = originalImageData.width;
  srcCanvas.height = originalImageData.height;
  const sctx = srcCanvas.getContext('2d');
  if (!sctx) return {};
  sctx.putImageData(originalImageData, 0, 0);

  const smallCanvas = document.createElement('canvas');
  smallCanvas.width = thumbW;
  smallCanvas.height = thumbH;
  const smCtx = smallCanvas.getContext('2d');
  if (!smCtx) return {};
  smCtx.drawImage(srcCanvas, 0, 0, thumbW, thumbH);
  const smallImageData = smCtx.getImageData(0, 0, thumbW, thumbH);

  // Downsample masks once
  let smallMasks: RoomMasks | null = null;
  if (roomMasks) {
    const downsampleMask = (mask: Uint8Array): Uint8Array => {
      const out = new Uint8Array(thumbW * thumbH);
      for (let y = 0; y < thumbH; y += 1) {
        const sy = Math.floor((y * roomMasks.height) / thumbH);
        const dstRow = y * thumbW;
        const srcRow = sy * roomMasks.width;
        for (let x = 0; x < thumbW; x += 1) {
          const sx = Math.floor((x * roomMasks.width) / thumbW);
          out[dstRow + x] = mask[srcRow + sx];
        }
      }
      return out;
    };

    smallMasks = {
      width: thumbW,
      height: thumbH,
      masks: {
        wall: downsampleMask(roomMasks.masks.wall),
        ceiling: downsampleMask(roomMasks.masks.ceiling),
        floor: downsampleMask(roomMasks.masks.floor),
        window: downsampleMask(roomMasks.masks.window),
        door: downsampleMask(roomMasks.masks.door),
        curtain: downsampleMask(roomMasks.masks.curtain),
        furniture: downsampleMask(roomMasks.masks.furniture),
        rug: downsampleMask(roomMasks.masks.rug),
      },
      boxes: roomMasks.boxes,
      detectedKeys: roomMasks.detectedKeys,
      method: roomMasks.method,
    };
  }

  const outCanvas = document.createElement('canvas');
  outCanvas.width = thumbW;
  outCanvas.height = thumbH;

  const previews: Record<string, string> = {};
  for (const preset of STUDIO_STYLE_PRESETS) {
    const c = presetToCustomizations(preset, baseCustomizations);
    renderEditedRoomCanvas(outCanvas, smallImageData, smallMasks, c);
    previews[preset.id] = outCanvas.toDataURL('image/jpeg', 0.8);
  }

  return previews;
}
