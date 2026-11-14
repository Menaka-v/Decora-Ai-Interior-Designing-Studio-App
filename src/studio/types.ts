export type RegionKey =
  | 'wall'
  | 'ceiling'
  | 'floor'
  | 'window'
  | 'door'
  | 'curtain'
  | 'furniture'
  | 'rug';

export interface RegionBoundingBox {
  /** Normalized coordinates 0..1 */
  x: number;
  y: number;
  w: number;
  h: number;
  coverage: number;
}

export interface RoomMasks {
  width: number;
  height: number;
  masks: Record<RegionKey, Uint8Array>;
  boxes: Record<RegionKey, RegionBoundingBox | null>;
  detectedKeys: RegionKey[];
  method: 'segformer' | 'heuristic' | 'manual';
}

export interface ImageQualityReport {
  originalWidth: number;
  originalHeight: number;
  width: number;
  height: number;
  avgBrightness: number;
  blurScore: number;
  isDark: boolean;
  isSmall: boolean;
  isBlurry: boolean;
  warnings: string[];
}

export type OverlayKind =
  | 'curtains'
  | 'plants'
  | 'rug'
  | 'wallArt'
  | 'floorLamp'
  | 'tableLamp'
  | 'mirror'
  | 'shelves'
  | 'cushions'
  | 'chandelier';

export type OverlayVariant =
  | 'sheer'
  | 'blackout'
  | 'floral'
  | 'monstera'
  | 'snake'
  | 'hanging'
  | 'round'
  | 'rectangular'
  | 'patterned'
  | 'single'
  | 'triptych'
  | 'gallery'
  | 'default';

export interface DecorOverlayItem {
  id: string;
  kind: OverlayKind;
  variant: OverlayVariant;
  label: string;
  /** Center X in normalized 0..1 canvas space */
  x: number;
  /** Center Y in normalized 0..1 canvas space */
  y: number;
  /** Width in normalized 0..1 canvas space */
  width: number;
  /** Height in normalized 0..1 canvas space */
  height: number;
  rotation: number;
  color: string;
  zIndex: number;
  opacity: number;
}

export interface ModelLoadProgress {
  status: 'idle' | 'downloading' | 'cached' | 'analyzing' | 'ready' | 'error';
  progress: number;
  message: string;
}
