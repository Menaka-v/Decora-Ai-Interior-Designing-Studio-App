import React, { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Brush,
  Eraser,
  Eye,
  EyeOff,
  Loader2,
  MousePointer,
  MoveHorizontal,
  RotateCw,
  ScanSearch,
  Sparkles,
  Trash2,
  Wand2,
} from 'lucide-react';
import { buildOverlayDataUri } from '../studio/overlays';
import {
  REGION_KEYS,
  REGION_META,
  buildHighlightOverlayImageData,
} from '../studio/segmentation';
import type {
  DecorOverlayItem,
  ImageQualityReport,
  ModelLoadProgress,
  RegionKey,
  RoomMasks,
} from '../studio/types';

export type CanvasTool = 'select' | 'brush' | 'eraser' | 'wand';

interface StudioCanvasStageProps {
  originalImageData: ImageData | null;
  editedCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  roomMasks: RoomMasks | null;
  overlays: DecorOverlayItem[];
  selectedOverlayId: string | null;
  onSelectOverlay: (id: string | null) => void;
  onUpdateOverlay: (id: string, patch: Partial<DecorOverlayItem>, commitHistory?: boolean) => void;
  onDeleteOverlay: (id: string) => void;
  onShiftOverlayZ: (id: string, dir: 'up' | 'down') => void;
  roomAvgBrightness: number;
  compareMode: boolean;
  onToggleCompareMode: () => void;
  tool: CanvasTool;
  onToolChange: (t: CanvasTool) => void;
  activeMaskRegion: RegionKey;
  onActiveMaskRegionChange: (r: RegionKey) => void;
  brushSize: number;
  onBrushSizeChange: (size: number) => void;
  onMaskStroke: (normX: number, normY: number, isEnd?: boolean) => void;
  onMagicWandClick: (normX: number, normY: number) => void;
  onRefineEdges: () => void;
  onReanalyzeRoom: () => void;
  modelProgress: ModelLoadProgress;
  qualityReport: ImageQualityReport | null;
  qualityDismissed: boolean;
  onContinueAnyway: () => void;
  onUploadAnother: () => void;
}

const OVERLAY_QUICK_COLORS = [
  '#F8FAFC',
  '#E07A5F',
  '#2F6E49',
  '#0D9488',
  '#1E3A5F',
  '#D4AF37',
  '#C96F53',
  '#334155',
];

export function StudioCanvasStage({
  originalImageData,
  editedCanvasRef,
  roomMasks,
  overlays,
  selectedOverlayId,
  onSelectOverlay,
  onUpdateOverlay,
  onDeleteOverlay,
  onShiftOverlayZ,
  roomAvgBrightness,
  compareMode,
  onToggleCompareMode,
  tool,
  onToolChange,
  activeMaskRegion,
  onActiveMaskRegionChange,
  brushSize,
  onBrushSizeChange,
  onMaskStroke,
  onMagicWandClick,
  onRefineEdges,
  onReanalyzeRoom,
  modelProgress,
  qualityReport,
  qualityDismissed,
  onContinueAnyway,
  onUploadAnother,
}: StudioCanvasStageProps) {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const originalCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [showRegionHighlights, setShowRegionHighlights] = useState(false);
  const [visibleRegions, setVisibleRegions] = useState<Record<RegionKey, boolean>>({
    wall: true,
    ceiling: true,
    floor: true,
    window: true,
    door: true,
    curtain: true,
    furniture: true,
    rug: true,
  });
  const [splitPct, setSplitPct] = useState(50);
  const [draggingSplit, setDraggingSplit] = useState(false);
  const [isPaintingMask, setIsPaintingMask] = useState(false);

  // Drag/resize/rotate state for SVG overlays
  const dragStateRef = useRef<{
    mode: 'move' | 'resize' | 'rotate';
    id: string;
    startClientX: number;
    startClientY: number;
    origX: number;
    origY: number;
    origW: number;
    origH: number;
    origRot: number;
  } | null>(null);

  // Paint original image onto Before canvas whenever originalImageData updates
  useEffect(() => {
    const canvas = originalCanvasRef.current;
    if (!canvas || !originalImageData) return;
    canvas.width = originalImageData.width;
    canvas.height = originalImageData.height;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.putImageData(originalImageData, 0, 0);
    }
  }, [originalImageData]);

  // Paint colored region mask highlight canvas
  useEffect(() => {
    const canvas = maskCanvasRef.current;
    if (!canvas || !roomMasks) return;
    canvas.width = roomMasks.width;
    canvas.height = roomMasks.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (!showRegionHighlights && tool === 'select') {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    const activeVis = showRegionHighlights
      ? visibleRegions
      : ({
          wall: activeMaskRegion === 'wall',
          ceiling: activeMaskRegion === 'ceiling',
          floor: activeMaskRegion === 'floor',
          window: activeMaskRegion === 'window',
          door: activeMaskRegion === 'door',
          curtain: activeMaskRegion === 'curtain',
          furniture: activeMaskRegion === 'furniture',
          rug: activeMaskRegion === 'rug',
        } as Record<RegionKey, boolean>);

    const overlayImg = buildHighlightOverlayImageData(
      roomMasks.masks,
      roomMasks.width,
      roomMasks.height,
      activeVis,
    );
    ctx.putImageData(overlayImg, 0, 0);
  }, [roomMasks, showRegionHighlights, visibleRegions, tool, activeMaskRegion]);

  const getNormalizedCoords = (clientX: number, clientY: number) => {
    const el = stageRef.current;
    if (!el) return { nx: 0.5, ny: 0.5 };
    const rect = el.getBoundingClientRect();
    return {
      nx: Math.max(0, Math.min(1, (clientX - rect.left) / rect.width)),
      ny: Math.max(0, Math.min(1, (clientY - rect.top) / rect.height)),
    };
  };

  const handleStagePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (compareMode) {
      setDraggingSplit(true);
      e.currentTarget.setPointerCapture(e.pointerId);
      const { nx } = getNormalizedCoords(e.clientX, e.clientY);
      setSplitPct(Math.max(4, Math.min(96, nx * 100)));
      return;
    }

    if (tool === 'brush' || tool === 'eraser') {
      setIsPaintingMask(true);
      e.currentTarget.setPointerCapture(e.pointerId);
      const { nx, ny } = getNormalizedCoords(e.clientX, e.clientY);
      onMaskStroke(nx, ny, false);
      return;
    }

    if (tool === 'wand') {
      const { nx, ny } = getNormalizedCoords(e.clientX, e.clientY);
      onMagicWandClick(nx, ny);
      return;
    }

    if (tool === 'select') {
      onSelectOverlay(null);
    }
  };

  const handleStagePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (compareMode && draggingSplit) {
      const { nx } = getNormalizedCoords(e.clientX, e.clientY);
      setSplitPct(Math.max(4, Math.min(96, nx * 100)));
      return;
    }

    if ((tool === 'brush' || tool === 'eraser') && isPaintingMask) {
      const { nx, ny } = getNormalizedCoords(e.clientX, e.clientY);
      onMaskStroke(nx, ny, false);
      return;
    }

    const drag = dragStateRef.current;
    const stageEl = stageRef.current;
    if (!drag || !stageEl) return;

    const rect = stageEl.getBoundingClientRect();
    const dx = (e.clientX - drag.startClientX) / rect.width;
    const dy = (e.clientY - drag.startClientY) / rect.height;

    if (drag.mode === 'move') {
      onUpdateOverlay(
        drag.id,
        {
          x: Math.max(0.05, Math.min(0.95, drag.origX + dx)),
          y: Math.max(0.05, Math.min(0.95, drag.origY + dy)),
        },
        false,
      );
    } else if (drag.mode === 'resize') {
      const nextW = Math.max(0.06, Math.min(0.75, drag.origW + dx * 1.4));
      const aspectRatio = drag.origH / Math.max(0.01, drag.origW);
      const nextH = Math.max(0.06, Math.min(0.75, nextW * aspectRatio));
      onUpdateOverlay(drag.id, { width: nextW, height: nextH }, false);
    } else if (drag.mode === 'rotate') {
      const cx = rect.left + drag.origX * rect.width;
      const cy = rect.top + drag.origY * rect.height;
      const angle = (Math.atan2(e.clientY - cy, e.clientX - cx) * 180) / Math.PI + 90;
      onUpdateOverlay(drag.id, { rotation: Math.round(angle) }, false);
    }
  };

  const handleStagePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (draggingSplit) {
      setDraggingSplit(false);
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    }
    if (isPaintingMask) {
      setIsPaintingMask(false);
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
      const { nx, ny } = getNormalizedCoords(e.clientX, e.clientY);
      onMaskStroke(nx, ny, true);
    }
    if (dragStateRef.current) {
      const id = dragStateRef.current.id;
      dragStateRef.current = null;
      onUpdateOverlay(id, {}, true);
    }
  };

  const selectedOverlay = overlays.find((o) => o.id === selectedOverlayId) || null;
  const aspectStyle = originalImageData
    ? { aspectRatio: `${originalImageData.width} / ${originalImageData.height}` }
    : { aspectRatio: '16 / 10' };

  const overlayBrightnessPct = Math.round(
    78 + (Math.max(40, Math.min(220, roomAvgBrightness)) / 220) * 32,
  );

  const hasQualityWarnings =
    qualityReport && qualityReport.warnings.length > 0 && !qualityDismissed;

  return (
    <div className="space-y-3">
      {/* Model download / analysis progress bar */}
      {(modelProgress.status === 'downloading' ||
        modelProgress.status === 'cached' ||
        modelProgress.status === 'analyzing') && (
        <div className="rounded-xl border border-teal-200 bg-teal-50/80 px-4 py-3 dark:border-teal-900/60 dark:bg-teal-950/30">
          <div className="flex items-center justify-between gap-2 text-xs font-medium text-teal-900 dark:text-teal-200">
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-[#0D9488]" />
              <span>{modelProgress.message}</span>
            </span>
            <span className="font-mono tabular-nums">{modelProgress.progress}%</span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-teal-200/70 dark:bg-teal-900">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#0D9488] to-[#FF6B5B] transition-all duration-200"
              style={{ width: `${modelProgress.progress}%` }}
            />
          </div>
        </div>
      )}

      {modelProgress.status === 'error' && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
          {modelProgress.message}
        </div>
      )}

      {/* Image Quality Warning Toast/Banner */}
      {hasQualityWarnings && (
        <div
          role="status"
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200"
        >
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <div>
              <div className="font-semibold">Photo Quality Tip</div>
              <ul className="mt-0.5 list-disc pl-4 text-[11px] leading-relaxed">
                {qualityReport.warnings.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onContinueAnyway}
              className="cursor-pointer rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-amber-900 hover:bg-amber-100 dark:border-amber-800 dark:bg-slate-900 dark:text-amber-200"
            >
              Continue anyway
            </button>
            <button
              type="button"
              onClick={onUploadAnother}
              className="cursor-pointer rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700"
            >
              Upload another
            </button>
          </div>
        </div>
      )}

      {/* Canvas Interactive Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2.5 dark:border-slate-800 dark:bg-slate-950">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              if (compareMode) onToggleCompareMode();
              onToolChange('select');
            }}
            className={`inline-flex cursor-pointer items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
              !compareMode && tool === 'select'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200'
            }`}
          >
            <MousePointer className="h-3.5 w-3.5" />
            <span>Select Decor</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (compareMode) onToggleCompareMode();
              onToolChange('brush');
            }}
            className={`inline-flex cursor-pointer items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
              !compareMode && tool === 'brush'
                ? 'bg-[#0D9488] text-white'
                : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200'
            }`}
          >
            <Brush className="h-3.5 w-3.5" />
            <span>Brush</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (compareMode) onToggleCompareMode();
              onToolChange('eraser');
            }}
            className={`inline-flex cursor-pointer items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
              !compareMode && tool === 'eraser'
                ? 'bg-rose-600 text-white'
                : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200'
            }`}
          >
            <Eraser className="h-3.5 w-3.5" />
            <span>Eraser</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (compareMode) onToggleCompareMode();
              onToolChange('wand');
            }}
            title="Click a surface to flood-fill its mask by color similarity"
            className={`inline-flex cursor-pointer items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
              !compareMode && tool === 'wand'
                ? 'bg-[#6D28D9] text-white'
                : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200'
            }`}
          >
            <Wand2 className="h-3.5 w-3.5" />
            <span>Magic Wand</span>
          </button>

          {(tool === 'brush' || tool === 'eraser' || tool === 'wand') && !compareMode && (
            <>
              <select
                aria-label="Target region mask"
                value={activeMaskRegion}
                onChange={(e) => onActiveMaskRegionChange(e.target.value as RegionKey)}
                className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-medium text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              >
                {REGION_KEYS.map((k) => (
                  <option key={k} value={k}>
                    Mask: {REGION_META[k].label}
                  </option>
                ))}
              </select>

              {(tool === 'brush' || tool === 'eraser') && (
                <label className="inline-flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                  <span>Size</span>
                  <input
                    type="range"
                    min={10}
                    max={80}
                    value={brushSize}
                    onChange={(e) => onBrushSizeChange(Number(e.target.value))}
                    className="w-16 accent-[#0D9488]"
                  />
                </label>
              )}
            </>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={onRefineEdges}
            disabled={!roomMasks}
            title="Smooth ragged borders and protect window edges from paint bleed"
            className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          >
            <Sparkles className="h-3.5 w-3.5 text-[#F59E0B]" />
            <span>Refine edges</span>
          </button>

          <button
            type="button"
            onClick={() => setShowRegionHighlights((v) => !v)}
            className={`inline-flex cursor-pointer items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
              showRegionHighlights
                ? 'border-[#0D9488] bg-teal-50 text-teal-800 dark:bg-teal-950/40 dark:text-teal-200'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200'
            }`}
          >
            {showRegionHighlights ? (
              <EyeOff className="h-3.5 w-3.5" />
            ) : (
              <Eye className="h-3.5 w-3.5" />
            )}
            <span>Regions</span>
          </button>

          <button
            type="button"
            onClick={onReanalyzeRoom}
            className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          >
            <ScanSearch className="h-3.5 w-3.5 text-[#0D9488]" />
            <span>Re-scan</span>
          </button>

          <button
            type="button"
            onClick={onToggleCompareMode}
            className={`inline-flex cursor-pointer items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
              compareMode
                ? 'bg-[#FF6B5B] text-white'
                : 'border border-slate-200 bg-white text-slate-800 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100'
            }`}
          >
            <MoveHorizontal className="h-3.5 w-3.5" />
            <span>Before / After</span>
          </button>
        </div>
      </div>

      {/* Toggleable region highlight pills */}
      {showRegionHighlights && roomMasks && (
        <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-800 dark:bg-slate-900">
          <span className="mr-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            Detected Regions:
          </span>
          {REGION_KEYS.map((key) => {
            const box = roomMasks.boxes[key];
            const active = visibleRegions[key];
            const meta = REGION_META[key];
            const pct = box ? Math.round(box.coverage * 100) : 0;
            return (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setVisibleRegions((prev) => ({ ...prev, [key]: !prev[key] }));
                  onActiveMaskRegionChange(key);
                }}
                className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-2 py-1 text-[11px] font-medium transition-opacity ${
                  active
                    ? 'border-slate-300 bg-slate-50 text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100'
                    : 'border-slate-200 bg-slate-100 text-slate-400 opacity-55 dark:border-slate-800 dark:bg-slate-950'
                }`}
              >
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: meta.color }}
                />
                <span>{meta.label}</span>
                <span className="font-mono text-[10px] text-slate-500">
                  {pct > 0 ? `${pct}%` : '0%'}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Main Canvas Stage (Stacked Edited + Original + Mask Highlight + Interactive SVG Overlays) */}
      <div
        ref={stageRef}
        onPointerDown={handleStagePointerDown}
        onPointerMove={handleStagePointerMove}
        onPointerUp={handleStagePointerUp}
        style={aspectStyle}
        className={`relative w-full select-none overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-sm dark:border-slate-800 dark:bg-slate-950 ${
          compareMode
            ? 'cursor-ew-resize touch-none'
            : tool !== 'select'
              ? 'cursor-crosshair touch-none'
              : 'cursor-default'
        }`}
      >
        {/* Edited Canvas (After) */}
        <canvas
          ref={editedCanvasRef}
          className="h-full w-full object-contain block"
        />

        {/* Interactive SVG Decor Overlays (rendered on the After side) */}
        <div
          className="pointer-events-none absolute inset-0 overflow-hidden"
          style={
            compareMode
              ? { clipPath: `inset(0 0 0 ${splitPct}%)` }
              : undefined
          }
        >
          {overlays
            .slice()
            .sort((a, b) => a.zIndex - b.zIndex)
            .map((item) => {
              const isSelected = !compareMode && item.id === selectedOverlayId;
              const uri = buildOverlayDataUri(item);

              return (
                <div
                  key={item.id}
                  onPointerDown={(e) => {
                    if (compareMode || tool !== 'select') return;
                    e.stopPropagation();
                    onSelectOverlay(item.id);
                    dragStateRef.current = {
                      mode: 'move',
                      id: item.id,
                      startClientX: e.clientX,
                      startClientY: e.clientY,
                      origX: item.x,
                      origY: item.y,
                      origW: item.width,
                      origH: item.height,
                      origRot: item.rotation,
                    };
                  }}
                  style={{
                    left: `${item.x * 100}%`,
                    top: `${item.y * 100}%`,
                    width: `${item.width * 100}%`,
                    height: `${item.height * 100}%`,
                    transform: `translate(-50%, -50%) rotate(${item.rotation}deg)`,
                    zIndex: item.zIndex,
                    opacity: item.opacity,
                    filter: `brightness(${overlayBrightnessPct}%) drop-shadow(0px 8px 14px rgba(15,23,42,0.28))`,
                  }}
                  className={`pointer-events-auto absolute touch-none ${
                    tool === 'select' && !compareMode ? 'cursor-move' : 'pointer-events-none'
                  } ${
                    isSelected
                      ? 'ring-2 ring-[#FF6B5B] ring-offset-1 ring-offset-transparent rounded-lg'
                      : 'hover:ring-1 hover:ring-white/60 rounded-lg'
                  }`}
                >
                  <img
                    src={uri}
                    alt={item.label}
                    draggable={false}
                    className="h-full w-full object-fill pointer-events-none select-none"
                  />

                  {isSelected && (
                    <>
                      {/* Top Rotate Handle */}
                      <button
                        type="button"
                        aria-label={`Rotate ${item.label}`}
                        onPointerDown={(e) => {
                          e.stopPropagation();
                          dragStateRef.current = {
                            mode: 'rotate',
                            id: item.id,
                            startClientX: e.clientX,
                            startClientY: e.clientY,
                            origX: item.x,
                            origY: item.y,
                            origW: item.width,
                            origH: item.height,
                            origRot: item.rotation,
                          };
                        }}
                        className="absolute -top-7 left-1/2 flex h-6 w-6 -translate-x-1/2 cursor-grab items-center justify-center rounded-full bg-slate-900 text-white shadow ring-2 ring-white"
                      >
                        <RotateCw className="h-3 w-3" />
                      </button>

                      {/* Bottom-Right Resize Handle */}
                      <button
                        type="button"
                        aria-label={`Resize ${item.label}`}
                        onPointerDown={(e) => {
                          e.stopPropagation();
                          dragStateRef.current = {
                            mode: 'resize',
                            id: item.id,
                            startClientX: e.clientX,
                            startClientY: e.clientY,
                            origX: item.x,
                            origY: item.y,
                            origW: item.width,
                            origH: item.height,
                            origRot: item.rotation,
                          };
                        }}
                        className="absolute -right-2 -bottom-2 h-4 w-4 cursor-nwse-resize rounded-full border-2 border-white bg-[#FF6B5B] shadow"
                      />
                    </>
                  )}
                </div>
              );
            })}
        </div>

        {/* Original Canvas (Before, clipped on left during compareMode) */}
        <canvas
          ref={originalCanvasRef}
          style={{ clipPath: `inset(0 ${100 - splitPct}% 0 0)` }}
          className={`pointer-events-none absolute inset-0 h-full w-full object-contain ${
            compareMode ? 'block' : 'hidden'
          }`}
        />

        {/* Mask Highlight Overlay Canvas */}
        <canvas
          ref={maskCanvasRef}
          className="pointer-events-none absolute inset-0 h-full w-full object-contain"
        />

        {/* Before / After Slider Handle & Labels */}
        {compareMode && (
          <>
            <div className="pointer-events-none absolute top-3 left-3 rounded-lg bg-slate-950/75 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
              Original
            </div>
            <div className="pointer-events-none absolute top-3 right-3 rounded-lg bg-slate-950/75 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
              Edited Room
            </div>
            <div
              className="pointer-events-none absolute inset-y-0 w-0.5 bg-white shadow-[0_0_12px_rgba(0,0,0,0.45)]"
              style={{ left: `${splitPct}%` }}
            >
              <div className="absolute top-1/2 left-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-slate-900/90 text-white shadow-lg">
                <MoveHorizontal className="h-4 w-4" />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Selected Decor Overlay Inspector Bar */}
      {selectedOverlay && !compareMode && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-900 dark:text-white">
              {selectedOverlay.label}
            </span>
            <span className="text-slate-400">·</span>
            <span className="text-slate-500 dark:text-slate-400">
              Drag to move · Corner dot to resize · Top handle to rotate
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1">
              {OVERLAY_QUICK_COLORS.map((hex) => (
                <button
                  key={hex}
                  type="button"
                  aria-label={`Set ${selectedOverlay.label} color ${hex}`}
                  onClick={() => onUpdateOverlay(selectedOverlay.id, { color: hex }, true)}
                  className={`h-5 w-5 cursor-pointer rounded-full border ${
                    selectedOverlay.color.toUpperCase() === hex.toUpperCase()
                      ? 'border-slate-900 ring-2 ring-[#FF6B5B] dark:border-white'
                      : 'border-slate-300 dark:border-slate-700'
                  }`}
                  style={{ backgroundColor: hex }}
                />
              ))}
              <input
                type="color"
                aria-label="Custom decor item color"
                value={selectedOverlay.color}
                onChange={(e) =>
                  onUpdateOverlay(selectedOverlay.id, { color: e.target.value.toUpperCase() }, true)
                }
                className="ml-1 h-6 w-7 cursor-pointer rounded border border-slate-200 bg-transparent p-0 dark:border-slate-700"
              />
            </div>

            <button
              type="button"
              onClick={() => onShiftOverlayZ(selectedOverlay.id, 'up')}
              title="Bring Forward"
              className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <ArrowUp className="h-3.5 w-3.5" />
              <span>Forward</span>
            </button>
            <button
              type="button"
              onClick={() => onShiftOverlayZ(selectedOverlay.id, 'down')}
              title="Send Back"
              className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <ArrowDown className="h-3.5 w-3.5" />
              <span>Back</span>
            </button>
            <button
              type="button"
              onClick={() => onDeleteOverlay(selectedOverlay.id)}
              className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 font-medium text-rose-700 hover:bg-rose-100 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Delete</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
