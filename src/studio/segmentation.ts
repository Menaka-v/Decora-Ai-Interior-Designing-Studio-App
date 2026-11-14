import { env, pipeline, type ImageSegmentationPipeline } from '@huggingface/transformers';
import type { ModelLoadProgress, RegionBoundingBox, RegionKey, RoomMasks } from './types';

const MODEL_ID = 'Xenova/segformer-b0-finetuned-ade-512-512';
const CACHE_FLAG_KEY = 'decoraai_segformer_cached_v1';

export const REGION_KEYS: RegionKey[] = [
  'wall',
  'ceiling',
  'floor',
  'window',
  'door',
  'curtain',
  'furniture',
  'rug',
];

export const REGION_META: Record<
  RegionKey,
  { label: string; color: string; rgba: [number, number, number] }
> = {
  wall: { label: 'Walls', color: '#0D9488', rgba: [13, 148, 136] },
  ceiling: { label: 'Ceiling', color: '#7C3AED', rgba: [124, 58, 237] },
  floor: { label: 'Floor', color: '#EA580C', rgba: [234, 88, 12] },
  window: { label: 'Windows', color: '#0284C7', rgba: [2, 132, 199] },
  door: { label: 'Doors', color: '#D97706', rgba: [217, 119, 6] },
  curtain: { label: 'Curtains', color: '#DB2777', rgba: [219, 39, 119] },
  furniture: { label: 'Furniture', color: '#E11D48', rgba: [225, 29, 72] },
  rug: { label: 'Rug / Carpet', color: '#059669', rgba: [5, 150, 105] },
};

let segmenterPromise: Promise<ImageSegmentationPipeline> | null = null;

function isModelPreviouslyCached(): boolean {
  try {
    return localStorage.getItem(CACHE_FLAG_KEY) === 'true';
  } catch {
    return false;
  }
}

function markModelCached(): void {
  try {
    localStorage.setItem(CACHE_FLAG_KEY, 'true');
  } catch {
    // Ignore storage issues
  }
}

function mapLabelToRegion(label: string | null): RegionKey | null {
  if (!label) return null;
  const l = label.toLowerCase();

  if (l === 'wall' || l.includes('wall')) return 'wall';
  if (l === 'ceiling' || l.includes('ceiling')) return 'ceiling';
  if (l === 'floor' || l.includes('floor') || l.includes('ground')) return 'floor';
  if (l.includes('window')) return 'window';
  if (l === 'door' || l.includes('door')) return 'door';
  if (l.includes('curtain') || l.includes('blind')) return 'curtain';
  if (l.includes('rug') || l.includes('carpet')) return 'rug';
  if (
    l.includes('sofa') ||
    l.includes('couch') ||
    l.includes('bed') ||
    l.includes('chair') ||
    l.includes('armchair') ||
    l.includes('table') ||
    l.includes('desk') ||
    l.includes('cabinet') ||
    l.includes('ottoman') ||
    l.includes('bench') ||
    l.includes('shelf') ||
    l.includes('bookcase') ||
    l.includes('chest') ||
    l.includes('wardrobe') ||
    l.includes('counter') ||
    l.includes('cushion')
  ) {
    return 'furniture';
  }
  return null;
}

export function createEmptyMaskRecord(width: number, height: number): Record<RegionKey, Uint8Array> {
  const size = width * height;
  return {
    wall: new Uint8Array(size),
    ceiling: new Uint8Array(size),
    floor: new Uint8Array(size),
    window: new Uint8Array(size),
    door: new Uint8Array(size),
    curtain: new Uint8Array(size),
    furniture: new Uint8Array(size),
    rug: new Uint8Array(size),
  };
}

export function computeMaskBoundingBox(
  mask: Uint8Array,
  width: number,
  height: number,
): RegionBoundingBox | null {
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  let count = 0;

  for (let y = 0; y < height; y += 1) {
    const rowOff = y * width;
    for (let x = 0; x < width; x += 1) {
      if (mask[rowOff + x] > 127) {
        count += 1;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (count < width * height * 0.004 || maxX < minX || maxY < minY) {
    return null;
  }

  return {
    x: minX / width,
    y: minY / height,
    w: (maxX - minX + 1) / width,
    h: (maxY - minY + 1) / height,
    coverage: count / (width * height),
  };
}

export function recomputeAllBoxes(
  masks: Record<RegionKey, Uint8Array>,
  width: number,
  height: number,
): { boxes: Record<RegionKey, RegionBoundingBox | null>; detectedKeys: RegionKey[] } {
  const boxes = {} as Record<RegionKey, RegionBoundingBox | null>;
  const detectedKeys: RegionKey[] = [];

  for (const key of REGION_KEYS) {
    const box = computeMaskBoundingBox(masks[key], width, height);
    boxes[key] = box;
    if (box) detectedKeys.push(key);
  }
  return { boxes, detectedKeys };
}

/**
 * Loads and caches the SegFormer ADE20K image segmentation pipeline in-browser.
 */
export async function getOrLoadSegmenter(
  onProgress?: (p: ModelLoadProgress) => void,
): Promise<ImageSegmentationPipeline> {
  const cached = isModelPreviouslyCached();

  if (!segmenterPromise) {
    env.allowLocalModels = false;
    env.useBrowserCache = true;

    onProgress?.({
      status: cached ? 'cached' : 'downloading',
      progress: 5,
      message: cached
        ? 'Loading from cache...'
        : 'Downloading the AI model (first time only, ~15 MB)...',
    });

    segmenterPromise = pipeline('image-segmentation', MODEL_ID, {
      progress_callback: (info: { status?: string; progress?: number; file?: string }) => {
        if (!onProgress) return;
        const pct = typeof info.progress === 'number' ? Math.round(info.progress) : undefined;
        if (info.status === 'progress' && pct !== undefined) {
          onProgress({
            status: cached ? 'cached' : 'downloading',
            progress: Math.max(8, Math.min(95, pct)),
            message: cached
              ? 'Loading from cache...'
              : `Downloading the AI model (first time only, ~15 MB)... ${pct}%`,
          });
        } else if (info.status === 'ready') {
          markModelCached();
          onProgress({
            status: 'ready',
            progress: 100,
            message: 'Room segmentation model ready.',
          });
        }
      },
    }).then((pipe) => {
      markModelCached();
      return pipe;
    });
  }

  try {
    const pipe = await segmenterPromise;
    return pipe;
  } catch (err) {
    segmenterPromise = null;
    throw err;
  }
}

export async function preloadSegmentationModel(
  onProgress?: (p: ModelLoadProgress) => void,
): Promise<boolean> {
  try {
    await getOrLoadSegmenter(onProgress);
    return true;
  } catch (err) {
    onProgress?.({
      status: 'error',
      progress: 0,
      message:
        err instanceof Error
          ? `AI model unavailable (${err.message}). Magic Wand manual selection is ready.`
          : 'AI model unavailable. Magic Wand manual selection is ready.',
    });
    return false;
  }
}

/**
 * Runs SegFormer image segmentation in the browser and converts output segments
 * into separate binary Uint8Array masks aligned to (targetWidth, targetHeight).
 */
export async function segmentRoomImage(
  imageDataUrl: string,
  targetWidth: number,
  targetHeight: number,
  onProgress?: (p: ModelLoadProgress) => void,
): Promise<RoomMasks> {
  const segmenter = await getOrLoadSegmenter(onProgress);

  onProgress?.({
    status: 'analyzing',
    progress: 96,
    message: 'Analyzing your room...',
  });

  const outputs = await segmenter(imageDataUrl);
  const masks = createEmptyMaskRecord(targetWidth, targetHeight);

  for (const item of outputs) {
    const regionKey = mapLabelToRegion(item.label);
    if (!regionKey || !item.mask) continue;

    const rawMask = item.mask;
    const mw = rawMask.width;
    const mh = rawMask.height;
    const mdata = rawMask.data;
    const channels = rawMask.channels || 1;
    const target = masks[regionKey];

    for (let y = 0; y < targetHeight; y += 1) {
      const sy = Math.min(mh - 1, Math.floor((y * mh) / targetHeight));
      const targetRow = y * targetWidth;
      const srcRow = sy * mw;
      for (let x = 0; x < targetWidth; x += 1) {
        const sx = Math.min(mw - 1, Math.floor((x * mw) / targetWidth));
        const val = mdata[(srcRow + sx) * channels];
        if (val > 127) {
          target[targetRow + x] = 255;
        }
      }
    }
  }

  // Prevent walls from bleeding into detected windows, doors, or curtains
  const totalPixels = targetWidth * targetHeight;
  const wallMask = masks.wall;
  const winMask = masks.window;
  const doorMask = masks.door;
  const curtainMask = masks.curtain;
  for (let i = 0; i < totalPixels; i += 1) {
    if (winMask[i] > 127 || doorMask[i] > 127 || curtainMask[i] > 127) {
      wallMask[i] = 0;
    }
  }

  const { boxes, detectedKeys } = recomputeAllBoxes(masks, targetWidth, targetHeight);

  onProgress?.({
    status: 'ready',
    progress: 100,
    message: `Detected ${detectedKeys.length} room surfaces.`,
  });

  return {
    width: targetWidth,
    height: targetHeight,
    masks,
    boxes,
    detectedKeys,
    method: 'segformer',
  };
}

/**
 * Fallback spatial heuristic if SegFormer fails offline/in restricted environments,
 * creating editable baseline masks so the user can refine with Brush or Magic Wand.
 */
export function createEmptyEditableRoomMasks(width: number, height: number): RoomMasks {
  const masks = createEmptyMaskRecord(width, height);
  const { boxes, detectedKeys } = recomputeAllBoxes(masks, width, height);
  return {
    width,
    height,
    masks,
    boxes,
    detectedKeys,
    method: 'manual',
  };
}

/**
 * Paints or erases a circular brush stroke onto a binary mask in-place.
 */
export function applyBrushToMask(
  mask: Uint8Array,
  width: number,
  height: number,
  cx: number,
  cy: number,
  radius: number,
  add: boolean,
): void {
  const r2 = radius * radius;
  const minX = Math.max(0, Math.floor(cx - radius));
  const maxX = Math.min(width - 1, Math.ceil(cx + radius));
  const minY = Math.max(0, Math.floor(cy - radius));
  const maxY = Math.min(height - 1, Math.ceil(cy + radius));
  const val = add ? 255 : 0;

  for (let y = minY; y <= maxY; y += 1) {
    const dy = y - cy;
    const rowOff = y * width;
    for (let x = minX; x <= maxX; x += 1) {
      const dx = x - cx;
      if (dx * dx + dy * dy <= r2) {
        mask[rowOff + x] = val;
      }
    }
  }
}

/**
 * Refines mask boundaries: fills small interior pinholes and erodes 1px along
 * protected window/door borders to eliminate paint bleed.
 */
export function refineMaskEdges(
  mask: Uint8Array,
  width: number,
  height: number,
  protectedMasks: Uint8Array[] = [],
): Uint8Array {
  const next = new Uint8Array(mask.length);

  // Step 1: Majority filter (3x3) to smooth ragged borders & close 1px pinholes
  for (let y = 1; y < height - 1; y += 1) {
    const row = y * width;
    for (let x = 1; x < width - 1; x += 1) {
      let neighbors = 0;
      for (let ky = -1; ky <= 1; ky += 1) {
        const kRow = (y + ky) * width;
        for (let kx = -1; kx <= 1; kx += 1) {
          if (mask[kRow + x + kx] > 127) neighbors += 1;
        }
      }
      next[row + x] = neighbors >= 5 ? 255 : 0;
    }
  }

  // Step 2: Erode 2px margin away from protected regions (windows/doors)
  if (protectedMasks.length > 0) {
    for (let y = 2; y < height - 2; y += 1) {
      const row = y * width;
      for (let x = 2; x < width - 2; x += 1) {
        if (next[row + x] === 0) continue;
        let nearProtected = false;
        for (const pMask of protectedMasks) {
          for (let ky = -2; ky <= 2 && !nearProtected; ky += 1) {
            const pRow = (y + ky) * width;
            for (let kx = -2; kx <= 2; kx += 1) {
              if (pMask[pRow + x + kx] > 127) {
                nearProtected = true;
                break;
              }
            }
          }
          if (nearProtected) break;
        }
        if (nearProtected) {
          next[row + x] = 0;
        }
      }
    }
  }

  return next;
}

/**
 * Magic-Wand flood-fill tool: selects contiguous pixels within RGB color distance
 * tolerance of the clicked seed pixel and adds them to the target mask.
 */
export function magicWandFloodFill(
  imageData: ImageData,
  targetMask: Uint8Array,
  startX: number,
  startY: number,
  tolerance = 32,
): number {
  const { width, height, data } = imageData;
  const sx = Math.max(0, Math.min(width - 1, Math.round(startX)));
  const sy = Math.max(0, Math.min(height - 1, Math.round(startY)));

  const seedIdx = (sy * width + sx) * 4;
  const sr = data[seedIdx];
  const sg = data[seedIdx + 1];
  const sb = data[seedIdx + 2];
  const maxDistSq = tolerance * tolerance * 3;

  const visited = new Uint8Array(width * height);
  const stack = new Int32Array(width * height);
  let sp = 0;
  stack[sp++] = sy * width + sx;
  visited[sy * width + sx] = 1;

  let added = 0;
  while (sp > 0) {
    const idx = stack[--sp];
    targetMask[idx] = 255;
    added += 1;

    const px = idx % width;
    const py = (idx - px) / width;

    const neighbors = [
      px > 0 ? idx - 1 : -1,
      px < width - 1 ? idx + 1 : -1,
      py > 0 ? idx - width : -1,
      py < height - 1 ? idx + width : -1,
    ];

    for (let i = 0; i < 4; i += 1) {
      const nIdx = neighbors[i];
      if (nIdx < 0 || visited[nIdx]) continue;
      visited[nIdx] = 1;

      const off = nIdx * 4;
      const dr = data[off] - sr;
      const dg = data[off + 1] - sg;
      const db = data[off + 2] - sb;
      if (dr * dr + dg * dg + db * db <= maxDistSq) {
        stack[sp++] = nIdx;
      }
    }
  }

  return added;
}

/**
 * Generates a semi-transparent overlay ImageData showing all visible region masks.
 */
export function buildHighlightOverlayImageData(
  masks: Record<RegionKey, Uint8Array>,
  width: number,
  height: number,
  visibleKeys: Record<RegionKey, boolean>,
): ImageData {
  const out = new ImageData(width, height);
  const dst = out.data;
  const len = width * height;

  for (const key of REGION_KEYS) {
    if (!visibleKeys[key]) continue;
    const mask = masks[key];
    const [r, g, b] = REGION_META[key].rgba;

    for (let i = 0; i < len; i += 1) {
      if (mask[i] > 127) {
        const off = i * 4;
        dst[off] = r;
        dst[off + 1] = g;
        dst[off + 2] = b;
        dst[off + 3] = 105;
      }
    }
  }

  return out;
}
