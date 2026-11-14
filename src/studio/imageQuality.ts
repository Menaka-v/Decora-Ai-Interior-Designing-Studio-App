import type { ImageQualityReport } from './types';

const MAX_LONG_EDGE = 1600;

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not decode room image.'));
    img.src = src;
  });
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Unable to read image file.'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.readAsDataURL(file);
  });
}

/**
 * Estimates image sharpness via Laplacian variance on a 256px-wide grayscale sample
 * and computes average perceptual luminance (0..255).
 */
function analyzeCanvasQuality(
  canvas: HTMLCanvasElement,
  originalWidth: number,
  originalHeight: number,
): ImageQualityReport {
  const sampleWidth = Math.min(256, canvas.width);
  const sampleHeight = Math.max(1, Math.round((canvas.height / canvas.width) * sampleWidth));

  const sampleCanvas = document.createElement('canvas');
  sampleCanvas.width = sampleWidth;
  sampleCanvas.height = sampleHeight;
  const sctx = sampleCanvas.getContext('2d');

  if (!sctx) {
    return {
      originalWidth,
      originalHeight,
      width: canvas.width,
      height: canvas.height,
      avgBrightness: 140,
      blurScore: 120,
      isDark: false,
      isSmall: originalWidth < 600,
      isBlurry: false,
      warnings: originalWidth < 600 ? ['Image width is under 600px, so fine details may look soft.'] : [],
    };
  }

  sctx.drawImage(canvas, 0, 0, sampleWidth, sampleHeight);
  const { data } = sctx.getImageData(0, 0, sampleWidth, sampleHeight);
  const len = sampleWidth * sampleHeight;
  const lum = new Float32Array(len);

  let brightnessSum = 0;
  for (let i = 0; i < len; i += 1) {
    const off = i * 4;
    const l = 0.299 * data[off] + 0.587 * data[off + 1] + 0.114 * data[off + 2];
    lum[i] = l;
    brightnessSum += l;
  }

  const avgBrightness = brightnessSum / len;

  // 4-neighbor Laplacian variance
  let lapSum = 0;
  let lapSqSum = 0;
  let count = 0;
  for (let y = 1; y < sampleHeight - 1; y += 1) {
    for (let x = 1; x < sampleWidth - 1; x += 1) {
      const idx = y * sampleWidth + x;
      const lap =
        lum[idx - 1] +
        lum[idx + 1] +
        lum[idx - sampleWidth] +
        lum[idx + sampleWidth] -
        4 * lum[idx];
      lapSum += lap;
      lapSqSum += lap * lap;
      count += 1;
    }
  }

  const meanLap = count > 0 ? lapSum / count : 0;
  const blurScore = count > 0 ? lapSqSum / count - meanLap * meanLap : 100;

  const isDark = avgBrightness < 58;
  const isSmall = originalWidth < 600;
  const isBlurry = blurScore < 32;

  const warnings: string[] = [];
  if (isDark) {
    warnings.push('This photo looks very dark — well-lit daytime photos give cleaner wall colors.');
  }
  if (isSmall) {
    warnings.push(
      `This image is small (${originalWidth}px wide; recommended 600px+) so surfaces may look pixelated.`,
    );
  }
  if (isBlurry) {
    warnings.push('This photo appears blurry, which can soften wall and window edges.');
  }

  return {
    originalWidth,
    originalHeight,
    width: canvas.width,
    height: canvas.height,
    avgBrightness,
    blurScore,
    isDark,
    isSmall,
    isBlurry,
    warnings,
  };
}

/**
 * Loads a File or URL, auto-resizes to max 1600px on the long edge,
 * and returns normalized ImageData + quality diagnostics.
 */
export async function loadAndNormalizeRoomImage(
  source: File | string,
): Promise<{
  dataUrl: string;
  imageData: ImageData;
  width: number;
  height: number;
  quality: ImageQualityReport;
}> {
  const src = typeof source === 'string' ? source : await readFileAsDataUrl(source);
  const img = await loadImageElement(src);

  const originalWidth = img.naturalWidth || img.width || 1200;
  const originalHeight = img.naturalHeight || img.height || 800;

  const scale =
    Math.max(originalWidth, originalHeight) > MAX_LONG_EDGE
      ? MAX_LONG_EDGE / Math.max(originalWidth, originalHeight)
      : 1;

  const width = Math.max(1, Math.round(originalWidth * scale));
  const height = Math.max(1, Math.round(originalHeight * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Browser Canvas 2D context is unavailable.');
  }

  ctx.drawImage(img, 0, 0, width, height);
  const imageData = ctx.getImageData(0, 0, width, height);
  const quality = analyzeCanvasQuality(canvas, originalWidth, originalHeight);
  const dataUrl = canvas.toDataURL('image/jpeg', 0.92);

  return {
    dataUrl,
    imageData,
    width,
    height,
    quality,
  };
}
