import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Bookmark,
  Check,
  CheckCircle2,
  Download,
  Info,
  Layers,
  Lightbulb,
  Moon,
  Paintbrush,
  Plus,
  Redo2,
  RotateCcw,
  Sofa,
  Sparkles,
  Sun,
  Undo2,
  Upload,
  Wand2,
} from 'lucide-react';
import { StudioCanvasStage, type CanvasTool } from '../components/StudioCanvasStage';
import {
  CEILING_COLOR_PRESETS,
  DECOR_ADDONS,
  DEFAULT_CUSTOMIZATIONS,
  FLOORING_OPTIONS,
  ROOM_TYPES,
  SOFA_COLOR_PRESETS,
  WALL_COLOR_PRESETS,
} from '../data/catalog';
import { useAuth } from '../hooks/useAuth';
import { useCatalog } from '../hooks/useCatalog';
import { useTheme } from '../hooks/useTheme';
import { useToast } from '../hooks/useToast';
import { designsApi } from '../services/api';
import { mapStyleCardToStudioPreset } from '../services/supabaseData';
import { logDesignEvent } from '../studio/analytics';
import { loadAndNormalizeRoomImage } from '../studio/imageQuality';
import {
  OVERLAY_CATALOG,
  addonToOverlayKind,
  createSmartOverlay,
  flattenStudioToPng,
} from '../studio/overlays';
import { STARTER_IDEA_GROUPS, parseExtraInstructions } from '../studio/parser';
import {
  STUDIO_STYLE_PRESETS,
  presetToCustomizations,
  renderAllPresetThumbnails,
  type StylePresetDefinition,
} from '../studio/presets';
import { featherMask, renderEditedRoomCanvas } from '../studio/recolor';
import {
  applyBrushToMask,
  createEmptyEditableRoomMasks,
  magicWandFloodFill,
  preloadSegmentationModel,
  recomputeAllBoxes,
  refineMaskEdges,
  segmentRoomImage,
} from '../studio/segmentation';
import type {
  DecorOverlayItem,
  ImageQualityReport,
  ModelLoadProgress,
  OverlayKind,
  OverlayVariant,
  RegionKey,
  RoomMasks,
} from '../studio/types';
import type {
  Customizations,
  DecorAddon,
  DesignStyleId,
  FlooringType,
  LightingMood,
  RoomType,
} from '../types/decora';

interface StudioPageProps {
  initialImage?: string;
  customizations: Customizations;
  onCustomizationsChange: (next: Customizations) => void;
  roomType: RoomType;
  onRoomTypeChange: (room: RoomType) => void;
  selectedStyleId: DesignStyleId;
  onStyleChange: (id: DesignStyleId) => void;
  onSavedDesign: () => void;
}

type StudioTab = 'walls' | 'floor' | 'furniture' | 'decor' | 'lighting' | 'instructions';

interface StudioSnapshot {
  customizations: Customizations;
  overlays: DecorOverlayItem[];
  selectedStyleId: DesignStyleId;
}

export function StudioPage({
  initialImage,
  customizations,
  onCustomizationsChange,
  roomType,
  onRoomTypeChange,
  selectedStyleId,
  onStyleChange,
  onSavedDesign,
}: StudioPageProps) {
  const { user } = useAuth();
  const { sampleRooms, styles: catalogStyles, stylesFromSupabase } = useCatalog();
  const { theme, toggleTheme } = useTheme();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const editedCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const studioPresets = useMemo<StylePresetDefinition[]>(() => {
    if (stylesFromSupabase && catalogStyles.length > 0) {
      return catalogStyles.map((card, idx) =>
        mapStyleCardToStudioPreset(card, idx),
      );
    }
    return STUDIO_STYLE_PRESETS;
  }, [stylesFromSupabase, catalogStyles]);

  const [roomImageUrl, setRoomImageUrl] = useState<string>(
    initialImage ||
      sampleRooms[0]?.imageUrl ||
      '/src/assets/images/hero_before_living_1794631596061.jpg',
  );
  const [uploadName, setUploadName] = useState<string>(
    initialImage ? 'Loaded Room Photo' : sampleRooms[0]?.label || 'Living Room',
  );
  const [showSamplePicker, setShowSamplePicker] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const [originalImageData, setOriginalImageData] = useState<ImageData | null>(null);
  const [qualityReport, setQualityReport] = useState<ImageQualityReport | null>(null);
  const [qualityDismissed, setQualityDismissed] = useState(false);

  const [roomMasks, setRoomMasks] = useState<RoomMasks | null>(null);
  const [maskRevision, setMaskRevision] = useState(0);
  const [modelProgress, setModelProgress] = useState<ModelLoadProgress>({
    status: 'idle',
    progress: 0,
    message: '',
  });

  const [activeTab, setActiveTab] = useState<StudioTab>('walls');
  const [compareMode, setCompareMode] = useState(false);
  const [tool, setTool] = useState<CanvasTool>('select');
  const [activeMaskRegion, setActiveMaskRegion] = useState<RegionKey>('wall');
  const [brushSize, setBrushSize] = useState(28);

  const [overlays, setOverlays] = useState<DecorOverlayItem[]>([]);
  const [selectedOverlayId, setSelectedOverlayId] = useState<string | null>(null);

  // Undo / Redo stacks
  const [history, setHistory] = useState<StudioSnapshot[]>([
    { customizations, overlays: [], selectedStyleId },
  ]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Live preset thumbnails & parser feedback
  const [presetThumbnails, setPresetThumbnails] = useState<Record<string, string>>({});
  const [appliedChecklist, setAppliedChecklist] = useState<string[]>([]);
  const [instructionWarning, setInstructionWarning] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [saveTagInput, setSaveTagInput] = useState('');

  // Preload SegFormer model in background when Studio opens
  useEffect(() => {
    void preloadSegmentationModel((prog) => {
      setModelProgress((prev) =>
        prev.status === 'analyzing' ? prev : prog,
      );
    });
  }, []);

  useEffect(() => {
    if (initialImage) {
      setRoomImageUrl(initialImage);
      setUploadName('Loaded Room Photo');
    }
  }, [initialImage]);

  const pushHistory = useCallback(
    (nextSnap: StudioSnapshot) => {
      setHistory((prev) => {
        const sliced = prev.slice(0, historyIndex + 1);
        const updated = [...sliced, nextSnap].slice(-25);
        setHistoryIndex(updated.length - 1);
        return updated;
      });
    },
    [historyIndex],
  );

  const updateCustomizations = useCallback(
    (next: Customizations, commit = true) => {
      onCustomizationsChange(next);
      if (commit) {
        pushHistory({ customizations: next, overlays, selectedStyleId });
      }
    },
    [onCustomizationsChange, overlays, pushHistory, selectedStyleId],
  );

  const handleUndo = () => {
    if (historyIndex <= 0) return;
    const prevIdx = historyIndex - 1;
    const snap = history[prevIdx];
    setHistoryIndex(prevIdx);
    onCustomizationsChange(snap.customizations);
    setOverlays(snap.overlays);
    onStyleChange(snap.selectedStyleId);
    setSelectedOverlayId(null);
  };

  const handleRedo = () => {
    if (historyIndex >= history.length - 1) return;
    const nextIdx = historyIndex + 1;
    const snap = history[nextIdx];
    setHistoryIndex(nextIdx);
    onCustomizationsChange(snap.customizations);
    setOverlays(snap.overlays);
    onStyleChange(snap.selectedStyleId);
    setSelectedOverlayId(null);
  };

  // Load room image, check quality, and run browser segmentation
  const processRoomSource = useCallback(
    async (source: File | string, label: string) => {
      setQualityDismissed(false);
      setUploadName(label);
      setSelectedOverlayId(null);

      try {
        const loaded = await loadAndNormalizeRoomImage(source);
        setOriginalImageData(loaded.imageData);
        setQualityReport(loaded.quality);
        setRoomImageUrl(loaded.dataUrl);

        if (loaded.quality.warnings.length > 0) {
          showToast(loaded.quality.warnings[0], 'info');
        }

        // Run browser AI segmentation
        try {
          const masks = await segmentRoomImage(
            loaded.dataUrl,
            loaded.width,
            loaded.height,
            setModelProgress,
          );
          setRoomMasks(masks);
          setMaskRevision((r) => r + 1);
        } catch {
          const fallback = createEmptyEditableRoomMasks(loaded.width, loaded.height);
          setRoomMasks(fallback);
          setMaskRevision((r) => r + 1);
          setModelProgress({
            status: 'error',
            progress: 0,
            message:
              'AI model could not download right now. Use the Magic Wand or Brush tool to select walls and floor.',
          });
        }
      } catch (err) {
        showToast(
          err instanceof Error ? err.message : 'Unable to process room photo.',
          'error',
        );
      }
    },
    [showToast],
  );

  useEffect(() => {
    void processRoomSource(roomImageUrl, uploadName);
    // Only re-run when user explicitly loads a new initialImage or triggers file/sample load
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialImage]);

  // Cache feathered masks per maskRevision so slider drags are instant (60fps)
  const featheredCache = useMemo(() => {
    if (!roomMasks) return undefined;
    const { width, height, masks } = roomMasks;
    return {
      wall: featherMask(masks.wall, width, height),
      ceiling: featherMask(masks.ceiling, width, height),
      furniture: featherMask(masks.furniture, width, height),
      floor: featherMask(masks.floor, width, height),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomMasks, maskRevision]);

  // Re-render edited canvas on every customization or mask change
  useEffect(() => {
    const canvas = editedCanvasRef.current;
    if (!canvas || !originalImageData) return;
    renderEditedRoomCanvas(
      canvas,
      originalImageData,
      roomMasks,
      customizations,
      featheredCache,
    );
  }, [originalImageData, roomMasks, customizations, featheredCache]);

  // Compute live thumbnails for the 8 Style Presets when image or masks update
  useEffect(() => {
    if (!originalImageData) return;
    const timer = window.setTimeout(() => {
      const thumbs = renderAllPresetThumbnails(
        originalImageData,
        roomMasks,
        customizations,
      );
      setPresetThumbnails(thumbs);
    }, 60);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [originalImageData, roomMasks, maskRevision]);

  const handleFileUpload = async (file: File) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      showToast('Please upload a JPG or PNG image file.', 'error');
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      showToast('Please upload a photo under 15MB.', 'error');
      return;
    }
    await processRoomSource(file, file.name);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void handleFileUpload(file);
  };

  // Mask Brush / Eraser / Magic Wand handlers
  const handleMaskStroke = (normX: number, normY: number, isEnd?: boolean) => {
    if (!roomMasks) return;
    const cx = normX * roomMasks.width;
    const cy = normY * roomMasks.height;
    const scaledRadius = (brushSize / 900) * Math.max(roomMasks.width, roomMasks.height);
    const add = tool === 'brush';

    applyBrushToMask(
      roomMasks.masks[activeMaskRegion],
      roomMasks.width,
      roomMasks.height,
      cx,
      cy,
      scaledRadius,
      add,
    );

    if (isEnd) {
      const { boxes, detectedKeys } = recomputeAllBoxes(
        roomMasks.masks,
        roomMasks.width,
        roomMasks.height,
      );
      roomMasks.boxes = boxes;
      roomMasks.detectedKeys = detectedKeys;
    }
    setMaskRevision((r) => r + 1);
  };

  const handleMagicWandClick = (normX: number, normY: number) => {
    if (!roomMasks || !originalImageData) return;
    const sx = Math.round(normX * roomMasks.width);
    const sy = Math.round(normY * roomMasks.height);
    const count = magicWandFloodFill(
      originalImageData,
      roomMasks.masks[activeMaskRegion],
      sx,
      sy,
      30,
    );
    const { boxes, detectedKeys } = recomputeAllBoxes(
      roomMasks.masks,
      roomMasks.width,
      roomMasks.height,
    );
    roomMasks.boxes = boxes;
    roomMasks.detectedKeys = detectedKeys;
    setMaskRevision((r) => r + 1);
    showToast(
      `Magic Wand added ${count.toLocaleString()} pixels to ${activeMaskRegion} mask.`,
      'info',
    );
  };

  const handleRefineEdges = () => {
    if (!roomMasks) return;
    const protectedMasks =
      activeMaskRegion === 'wall'
        ? [roomMasks.masks.window, roomMasks.masks.door, roomMasks.masks.curtain]
        : [];
    roomMasks.masks[activeMaskRegion] = refineMaskEdges(
      roomMasks.masks[activeMaskRegion],
      roomMasks.width,
      roomMasks.height,
      protectedMasks,
    );
    const { boxes, detectedKeys } = recomputeAllBoxes(
      roomMasks.masks,
      roomMasks.width,
      roomMasks.height,
    );
    roomMasks.boxes = boxes;
    roomMasks.detectedKeys = detectedKeys;
    setMaskRevision((r) => r + 1);
    showToast(`Refined ${activeMaskRegion} edges and cleared window borders.`, 'success');
  };

  // Overlay manipulation
  const handleUpdateOverlay = (
    id: string,
    patch: Partial<DecorOverlayItem>,
    commit = true,
  ) => {
    setOverlays((prev) => {
      const next = prev.map((item) => (item.id === id ? { ...item, ...patch } : item));
      if (commit) {
        pushHistory({ customizations, overlays: next, selectedStyleId });
      }
      return next;
    });
  };

  const handleDeleteOverlay = (id: string) => {
    const target = overlays.find((o) => o.id === id);
    const next = overlays.filter((o) => o.id !== id);
    setOverlays(next);
    if (selectedOverlayId === id) setSelectedOverlayId(null);

    if (target) {
      const remainingSameKind = next.some((o) => o.kind === target.kind);
      if (!remainingSameKind) {
        const entry = OVERLAY_CATALOG.find((c) => c.kind === target.kind);
        if (entry?.addon) {
          const nextCustom = {
            ...customizations,
            decorAddons: customizations.decorAddons.filter((a) => a !== entry.addon),
          };
          onCustomizationsChange(nextCustom);
          pushHistory({ customizations: nextCustom, overlays: next, selectedStyleId });
          return;
        }
      }
    }
    pushHistory({ customizations, overlays: next, selectedStyleId });
  };

  const handleShiftOverlayZ = (id: string, dir: 'up' | 'down') => {
    setOverlays((prev) => {
      const next = prev.map((o) =>
        o.id === id
          ? { ...o, zIndex: Math.max(1, o.zIndex + (dir === 'up' ? 2 : -2)) }
          : o,
      );
      pushHistory({ customizations, overlays: next, selectedStyleId });
      return next;
    });
  };

  const handleToggleAddonCheckbox = (addon: DecorAddon) => {
    const exists = customizations.decorAddons.includes(addon);
    const kind = addonToOverlayKind(addon);

    if (exists) {
      const nextAddons = customizations.decorAddons.filter((a) => a !== addon);
      const nextOverlays = overlays.filter((o) =>
        addon === 'Lamps'
          ? o.kind !== 'floorLamp' && o.kind !== 'tableLamp'
          : o.kind !== kind,
      );
      const nextCustom = { ...customizations, decorAddons: nextAddons };
      onCustomizationsChange(nextCustom);
      setOverlays(nextOverlays);
      setSelectedOverlayId(null);
      pushHistory({
        customizations: nextCustom,
        overlays: nextOverlays,
        selectedStyleId,
      });
    } else {
      const nextAddons = [...customizations.decorAddons, addon];
      const smartItem = createSmartOverlay(kind, roomMasks?.boxes ?? {}, {
        zIndex: 10 + overlays.length,
      });
      const nextOverlays = [...overlays, smartItem];
      const nextCustom = { ...customizations, decorAddons: nextAddons };
      onCustomizationsChange(nextCustom);
      setOverlays(nextOverlays);
      setSelectedOverlayId(smartItem.id);
      setTool('select');
      pushHistory({
        customizations: nextCustom,
        overlays: nextOverlays,
        selectedStyleId,
      });
    }
  };

  const handleAddSpecificOverlay = (
    kind: OverlayKind,
    variant: OverlayVariant,
    addon?: DecorAddon,
  ) => {
    const newItem = createSmartOverlay(kind, roomMasks?.boxes ?? {}, {
      variant,
      zIndex: 10 + overlays.length,
    });
    const nextOverlays = [...overlays, newItem];
    const nextAddons =
      addon && !customizations.decorAddons.includes(addon)
        ? [...customizations.decorAddons, addon]
        : customizations.decorAddons;
    const nextCustom = { ...customizations, decorAddons: nextAddons };
    onCustomizationsChange(nextCustom);
    setOverlays(nextOverlays);
    setSelectedOverlayId(newItem.id);
    setTool('select');
    pushHistory({
      customizations: nextCustom,
      overlays: nextOverlays,
      selectedStyleId,
    });
  };

  const handleApplyStylePreset = (preset: StylePresetDefinition) => {
    const nextCustom = presetToCustomizations(preset, customizations);
    const boxes = roomMasks?.boxes ?? {};
    const nextOverlays: DecorOverlayItem[] = preset.decorItems.map((d, idx) =>
      createSmartOverlay(d.kind, boxes, {
        variant: d.variant,
        color: d.color,
        zIndex: 10 + idx,
      }),
    );

    onStyleChange(preset.id);
    onCustomizationsChange(nextCustom);
    setOverlays(nextOverlays);
    setSelectedOverlayId(null);
    pushHistory({
      customizations: nextCustom,
      overlays: nextOverlays,
      selectedStyleId: preset.id,
    });

    logDesignEvent({
      action: 'preset_applied',
      style: preset.name,
      wallColor: nextCustom.wallColor,
      wallColorName: nextCustom.wallColorName,
      floorType: nextCustom.flooring,
      furnitureColor: nextCustom.sofaBedColor,
      addOns: nextCustom.decorAddons,
      roomType,
      instructionKeywords: [preset.name.toLowerCase()],
    });

    showToast(`Applied ${preset.name} style preset.`, 'success');
  };

  const handleApplyInstructions = (overrideText?: string) => {
    const textToParse = overrideText ?? customizations.extraInstructions;
    const outcome = parseExtraInstructions(
      textToParse,
      customizations,
      overlays,
      roomMasks?.boxes ?? {},
    );

    const nextCustom = {
      ...outcome.nextCustomizations,
      extraInstructions: textToParse,
    };
    const nextOverlays = [...overlays, ...outcome.newOverlays];

    onCustomizationsChange(nextCustom);
    setOverlays(nextOverlays);
    setAppliedChecklist(outcome.appliedChecklist);
    setInstructionWarning(outcome.warningMessage);
    setTool('select');

    if (outcome.appliedChecklist.length > 0) {
      pushHistory({
        customizations: nextCustom,
        overlays: nextOverlays,
        selectedStyleId,
      });

      const activePresetName =
        studioPresets.find((p) => p.id === selectedStyleId)?.name || 'Custom';

      logDesignEvent({
        action: 'instruction_applied',
        style: activePresetName,
        wallColor: nextCustom.wallColor,
        wallColorName: nextCustom.wallColorName,
        floorType: nextCustom.flooring,
        furnitureColor: nextCustom.sofaBedColor,
        addOns: nextCustom.decorAddons,
        roomType,
        instructionKeywords: outcome.keywordsMatched,
      });

      showToast(outcome.appliedChecklist.join(' · '), 'success');
    } else if (outcome.warningMessage) {
      showToast(outcome.warningMessage, 'info');
    }
  };

  const handleSurpriseMe = () => {
    const allIdeas = STARTER_IDEA_GROUPS.flatMap((g) => g.ideas);
    const picked = [...allIdeas].sort(() => Math.random() - 0.5).slice(0, 3);
    const combined = picked.join('. ');
    onCustomizationsChange({ ...customizations, extraInstructions: combined });
    handleApplyInstructions(combined);
  };

  const handleResetAll = () => {
    onCustomizationsChange(DEFAULT_CUSTOMIZATIONS);
    setOverlays([]);
    setSelectedOverlayId(null);
    setAppliedChecklist([]);
    setInstructionWarning(null);
    pushHistory({
      customizations: DEFAULT_CUSTOMIZATIONS,
      overlays: [],
      selectedStyleId,
    });
    showToast('Reset room edits back to original photo.', 'info');
  };

  const handleDownloadPng = async () => {
    const canvas = editedCanvasRef.current;
    if (!canvas) return;
    setDownloading(true);
    try {
      const pngDataUrl = await flattenStudioToPng(
        canvas,
        overlays,
        qualityReport?.avgBrightness ?? 140,
      );
      const link = document.createElement('a');
      link.href = pngDataUrl;
      link.download = `DecoraAI-${selectedStyleId}-${roomType
        .replace(/\s+/g, '-')
        .toLowerCase()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      const styleName =
        studioPresets.find((p) => p.id === selectedStyleId)?.name || 'Custom';
      logDesignEvent({
        action: 'png_downloaded',
        style: styleName,
        wallColor: customizations.wallColor,
        wallColorName: customizations.wallColorName,
        floorType: customizations.flooring,
        furnitureColor: customizations.sofaBedColor,
        addOns: customizations.decorAddons,
        roomType,
        instructionKeywords: [],
      });

      showToast('Downloaded edited room as PNG.', 'success');
    } finally {
      setDownloading(false);
    }
  };

  const handleSaveDesign = async () => {
    const canvas = editedCanvasRef.current;
    if (!canvas) return;
    setSaving(true);
    try {
      const flattenedPng = await flattenStudioToPng(
        canvas,
        overlays,
        qualityReport?.avgBrightness ?? 140,
      );
      const styleName =
        studioPresets.find((p) => p.id === selectedStyleId)?.name || 'Custom';
      const customTags = saveTagInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
      const tags = Array.from(
        new Set([roomType, styleName, customizations.wallColorName, ...customTags]),
      );

      const compressForGallery = (src: string, maxEdge = 960): Promise<string> =>
        new Promise((resolve) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            const scale = Math.min(1, maxEdge / Math.max(img.width, img.height));
            const c = document.createElement('canvas');
            c.width = Math.max(1, Math.round(img.width * scale));
            c.height = Math.max(1, Math.round(img.height * scale));
            const ctx = c.getContext('2d');
            if (!ctx) return resolve(src);
            ctx.drawImage(img, 0, 0, c.width, c.height);
            try {
              resolve(c.toDataURL('image/jpeg', 0.82));
            } catch {
              resolve(src);
            }
          };
          img.onerror = () => resolve(src);
          img.src = src;
        });

      const [storedOriginal, storedEdited] = await Promise.all([
        roomImageUrl.startsWith('data:')
          ? compressForGallery(roomImageUrl, 960)
          : Promise.resolve(roomImageUrl),
        compressForGallery(flattenedPng, 960),
      ]);

      await designsApi.save(
        {
          title: `${styleName} ${roomType}`,
          originalImage: storedOriginal,
          generatedImages: [
            {
              id: `render-${Date.now()}`,
              title: `${styleName} ${roomType}`,
              subtitle: `${customizations.wallColorName} walls · ${customizations.flooring} floor`,
              imageUrl: storedEdited,
              palette: [
                customizations.wallColor,
                customizations.sofaBedColor,
                customizations.ceilingColor,
              ],
              highlights: customizations.decorAddons,
              estimatedCost: customizations.budgetLevel,
              isLiveAiRender: false,
            },
          ],
          selectedVariationIndex: 0,
          style: styleName,
          styleId: selectedStyleId,
          roomType,
          customizations,
          tags,
        },
        user?.id,
      );

      logDesignEvent({
        action: 'design_saved',
        style: styleName,
        wallColor: customizations.wallColor,
        wallColorName: customizations.wallColorName,
        floorType: customizations.flooring,
        furnitureColor: customizations.sofaBedColor,
        addOns: customizations.decorAddons,
        roomType,
        instructionKeywords: [],
      });

      onSavedDesign();
      showToast('Design saved to My Designs.', 'success');
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Could not save design.',
        'error',
      );
    } finally {
      setSaving(false);
    }
  };

  const handleApplyLightingMood = (mood: LightingMood) => {
    let next = { ...customizations, lightingMood: mood };
    if (mood === 'Natural Daylight') {
      next = { ...next, brightness: 10, contrast: 5, warmth: 0, vignette: 0 };
    } else if (mood === 'Warm') {
      next = { ...next, brightness: 4, contrast: 4, warmth: 20, vignette: 18 };
    } else if (mood === 'Evening') {
      next = { ...next, brightness: -12, contrast: 14, warmth: 16, vignette: 38 };
    } else if (mood === 'Cool') {
      next = { ...next, brightness: 6, contrast: 6, warmth: -18, vignette: 0 };
    }
    updateCustomizations(next, true);
  };

  const tabs: Array<{ id: StudioTab; label: string; icon: React.ReactNode }> = [
    { id: 'walls', label: 'Walls', icon: <Paintbrush className="h-3.5 w-3.5" /> },
    { id: 'floor', label: 'Floor', icon: <Layers className="h-3.5 w-3.5" /> },
    { id: 'furniture', label: 'Furniture', icon: <Sofa className="h-3.5 w-3.5" /> },
    { id: 'decor', label: 'Decor', icon: <Plus className="h-3.5 w-3.5" /> },
    { id: 'lighting', label: 'Lighting', icon: <Lightbulb className="h-3.5 w-3.5" /> },
    { id: 'instructions', label: 'Instructions', icon: <Wand2 className="h-3.5 w-3.5" /> },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 pb-24 sm:px-6 lg:px-8">
      {/* Studio Workspace Header */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4 dark:border-slate-800">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Design Studio
          </h1>
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
            Real-time room redesign in your browser · AI surface detection · Instant HSL paint, procedural floors &amp; draggable decor
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label="Room type"
            value={roomType}
            onChange={(e) => onRoomTypeChange(e.target.value as RoomType)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          >
            {ROOM_TYPES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={toggleTheme}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            {theme === 'light' ? (
              <>
                <Moon className="h-3.5 w-3.5" />
                <span>Dark</span>
              </>
            ) : (
              <>
                <Sun className="h-3.5 w-3.5" />
                <span>Light</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Upload Guidance Tip Card + Upload Dropzone */}
      <div className="mb-6 space-y-3">
        <div className="flex items-start gap-2.5 rounded-xl border border-teal-200 bg-teal-50/70 px-4 py-2.5 text-xs text-teal-950 dark:border-teal-900/50 dark:bg-teal-950/30 dark:text-teal-200">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#0D9488]" />
          <p>
            For best results, use a clear, well-lit photo where the walls and floor are
            visible. Avoid very dark, blurry or cluttered photos.
          </p>
        </div>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-dashed bg-white px-4 py-3 transition-colors dark:bg-slate-900 ${
            isDragging
              ? 'border-[#0D9488] bg-teal-50/30 dark:bg-teal-950/20'
              : 'border-slate-300 dark:border-slate-700'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
              <Upload className="h-4 w-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-900 dark:text-white">
                Active Room: {uploadName}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                Drag &amp; drop a JPG or PNG photo (auto-resized up to 1600px) or try a built-in sample
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleFileUpload(file);
              }}
            />

            <button
              type="button"
              onClick={() => setShowSamplePicker((s) => !s)}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            >
              <Sparkles className="h-3.5 w-3.5 text-[#F59E0B]" />
              <span>Try sample room</span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
            >
              <Upload className="h-3.5 w-3.5" />
              <span>Upload Photo</span>
            </button>
          </div>
        </div>

        {showSamplePicker && (
          <div className="grid grid-cols-1 gap-3 rounded-2xl border border-slate-200 bg-white p-3 sm:grid-cols-3 dark:border-slate-800 dark:bg-slate-900">
            {sampleRooms.map((sample) => (
              <button
                key={sample.id}
                type="button"
                onClick={() => {
                  onRoomTypeChange(sample.roomType);
                  setShowSamplePicker(false);
                  void processRoomSource(sample.imageUrl, sample.label);
                }}
                className="group flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 p-2 text-left transition-colors hover:border-[#0D9488] hover:bg-teal-50/40 dark:border-slate-800 dark:hover:bg-teal-950/20"
              >
                <img
                  src={sample.imageUrl}
                  alt={sample.label}
                  referrerPolicy="no-referrer"
                  className="h-14 w-20 rounded-lg object-cover"
                />
                <div>
                  <div className="text-xs font-semibold text-slate-900 dark:text-white">
                    {sample.label}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Load well-lit {sample.roomType.toLowerCase()}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Workspace Split: Left Canvas (8 cols) + Right Tabbed Panel (4 cols) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8">
          <StudioCanvasStage
            originalImageData={originalImageData}
            editedCanvasRef={editedCanvasRef}
            roomMasks={roomMasks}
            overlays={overlays}
            selectedOverlayId={selectedOverlayId}
            onSelectOverlay={setSelectedOverlayId}
            onUpdateOverlay={handleUpdateOverlay}
            onDeleteOverlay={handleDeleteOverlay}
            onShiftOverlayZ={handleShiftOverlayZ}
            roomAvgBrightness={qualityReport?.avgBrightness ?? 140}
            compareMode={compareMode}
            onToggleCompareMode={() => setCompareMode((c) => !c)}
            tool={tool}
            onToolChange={setTool}
            activeMaskRegion={activeMaskRegion}
            onActiveMaskRegionChange={setActiveMaskRegion}
            brushSize={brushSize}
            onBrushSizeChange={setBrushSize}
            onMaskStroke={handleMaskStroke}
            onMagicWandClick={handleMagicWandClick}
            onRefineEdges={handleRefineEdges}
            onReanalyzeRoom={() => void processRoomSource(roomImageUrl, uploadName)}
            modelProgress={modelProgress}
            qualityReport={qualityReport}
            qualityDismissed={qualityDismissed}
            onContinueAnyway={() => setQualityDismissed(true)}
            onUploadAnother={() => fileInputRef.current?.click()}
          />

          {/* Style Presets Strip with Live Room Previews */}
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                  One-Click Style Presets (Live Previews of Your Room)
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Click any style card to apply coordinated wall paint, floor texture, upholstery, lighting &amp; decor
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {studioPresets.map((preset) => {
                const active = selectedStyleId === preset.id;
                const matchedStyleCard = catalogStyles.find(
                  (c) => c.id === preset.id || c.name.toLowerCase() === preset.name.toLowerCase(),
                );
                const thumbSrc =
                  presetThumbnails[preset.id] || matchedStyleCard?.imageUrl;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleApplyStylePreset(preset)}
                    className={`group cursor-pointer overflow-hidden rounded-xl border text-left transition-all ${
                      active
                        ? 'border-[#FF6B5B] ring-2 ring-[#FF6B5B]/35'
                        : 'border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                      {thumbSrc ? (
                        <img
                          src={thumbSrc}
                          alt={`${preset.name} live preview`}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[11px] text-slate-400">
                          Rendering...
                        </div>
                      )}
                      {active && (
                        <span className="absolute top-1.5 right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#FF6B5B] text-white shadow">
                          <Check className="h-3 w-3" />
                        </span>
                      )}
                    </div>
                    <div className="p-2.5">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-semibold text-slate-900 dark:text-white">
                          {preset.name}
                        </span>
                        <span className="flex items-center gap-0.5">
                          <span
                            className="h-2.5 w-2.5 rounded-full border border-slate-200"
                            style={{ backgroundColor: preset.wallColor }}
                          />
                          <span
                            className="h-2.5 w-2.5 rounded-full border border-slate-200"
                            style={{ backgroundColor: preset.sofaBedColor }}
                          />
                        </span>
                      </div>
                      <p className="mt-0.5 line-clamp-1 text-[10px] text-slate-500 dark:text-slate-400">
                        {preset.flooring} · {preset.wallColorName}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        </div>

        {/* Right Tabbed Control Panel (4 cols) */}
        <aside className="lg:col-span-4">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            {/* 6 Control Tabs */}
            <div className="grid grid-cols-3 gap-1 border-b border-slate-200 p-2 dark:border-slate-800">
              {tabs.map((t) => {
                const active = activeTab === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setActiveTab(t.id)}
                    className={`inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-xs font-semibold transition-colors whitespace-nowrap ${
                      active
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                        : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                    }`}
                  >
                    {t.icon}
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="p-5 space-y-5">
              {/* TAB 1: WALLS & CEILING */}
              {activeTab === 'walls' && (
                <div className="space-y-5">
                  <div>
                    <div className="mb-2 flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800 dark:text-slate-100">
                        Wall Paint Color
                      </span>
                      <span className="text-slate-500 dark:text-slate-400">
                        {customizations.wallColorName} · {customizations.wallColor}
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {WALL_COLOR_PRESETS.map((preset) => {
                        const selected =
                          customizations.wallColor.toLowerCase() ===
                          preset.hex.toLowerCase();
                        return (
                          <button
                            key={preset.hex}
                            type="button"
                            title={preset.name}
                            onClick={() =>
                              updateCustomizations({
                                ...customizations,
                                wallColor: preset.hex,
                                wallColorName: preset.name,
                                wallIntensity:
                                  customizations.wallIntensity === 0
                                    ? 70
                                    : customizations.wallIntensity,
                              })
                            }
                            className={`h-9 cursor-pointer rounded-xl border transition-transform hover:scale-105 ${
                              selected
                                ? 'border-slate-900 ring-2 ring-[#FF6B5B] dark:border-white'
                                : 'border-slate-200 dark:border-slate-700'
                            }`}
                            style={{ backgroundColor: preset.hex }}
                          />
                        );
                      })}
                    </div>

                    <div className="mt-2.5 flex items-center gap-2">
                      <input
                        type="color"
                        aria-label="Custom wall hex color"
                        value={customizations.wallColor}
                        onChange={(e) =>
                          updateCustomizations({
                            ...customizations,
                            wallColor: e.target.value.toUpperCase(),
                            wallColorName: 'Custom Paint',
                            wallIntensity:
                              customizations.wallIntensity === 0
                                ? 70
                                : customizations.wallIntensity,
                          })
                        }
                        className="h-9 w-11 cursor-pointer rounded-lg border border-slate-200 bg-transparent p-0.5 dark:border-slate-700"
                      />
                      <input
                        type="text"
                        value={customizations.wallColor}
                        onChange={(e) =>
                          updateCustomizations({
                            ...customizations,
                            wallColor: e.target.value,
                            wallColorName: 'Custom Paint',
                          })
                        }
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                      />
                    </div>

                    <label className="mt-3 block">
                      <div className="mb-1 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
                        <span>Wall Paint Intensity</span>
                        <span className="font-mono tabular-nums">
                          {customizations.wallIntensity}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={customizations.wallIntensity}
                        onChange={(e) =>
                          updateCustomizations(
                            { ...customizations, wallIntensity: Number(e.target.value) },
                            false,
                          )
                        }
                        onMouseUp={() =>
                          pushHistory({ customizations, overlays, selectedStyleId })
                        }
                        className="w-full accent-[#0D9488]"
                      />
                    </label>
                  </div>

                  <div className="border-t border-slate-100 pt-4 dark:border-slate-800">
                    <div className="mb-2 flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800 dark:text-slate-100">
                        Ceiling Paint
                      </span>
                      <span className="text-slate-500 dark:text-slate-400">
                        {customizations.ceilingColorName}
                      </span>
                    </div>
                    <div className="grid grid-cols-6 gap-2">
                      {CEILING_COLOR_PRESETS.map((preset) => (
                        <button
                          key={preset.hex}
                          type="button"
                          title={preset.name}
                          onClick={() =>
                            updateCustomizations({
                              ...customizations,
                              ceilingColor: preset.hex,
                              ceilingColorName: preset.name,
                              ceilingIntensity:
                                customizations.ceilingIntensity === 0
                                  ? 50
                                  : customizations.ceilingIntensity,
                            })
                          }
                          className={`h-8 cursor-pointer rounded-lg border ${
                            customizations.ceilingColor.toLowerCase() ===
                            preset.hex.toLowerCase()
                              ? 'border-slate-900 ring-2 ring-[#6D28D9] dark:border-white'
                              : 'border-slate-200 dark:border-slate-700'
                          }`}
                          style={{ backgroundColor: preset.hex }}
                        />
                      ))}
                    </div>

                    <label className="mt-3 block">
                      <div className="mb-1 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
                        <span>Ceiling Tint Intensity</span>
                        <span className="font-mono tabular-nums">
                          {customizations.ceilingIntensity}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={customizations.ceilingIntensity}
                        onChange={(e) =>
                          updateCustomizations(
                            { ...customizations, ceilingIntensity: Number(e.target.value) },
                            false,
                          )
                        }
                        className="w-full accent-[#6D28D9]"
                      />
                    </label>
                  </div>
                </div>
              )}

              {/* TAB 2: FLOOR */}
              {activeTab === 'floor' && (
                <div className="space-y-4">
                  <div>
                    <div className="mb-2 text-xs font-semibold text-slate-800 dark:text-slate-100">
                      Procedural Floor Material
                    </div>
                    <p className="mb-3 text-[11px] text-slate-500 dark:text-slate-400">
                      Generated in real time on offscreen canvas and blended inside the detected floor area while preserving shadows.
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {FLOORING_OPTIONS.map((floor) => {
                        const active = customizations.flooring === floor;
                        return (
                          <button
                            key={floor}
                            type="button"
                            onClick={() =>
                              updateCustomizations({
                                ...customizations,
                                flooring: floor as FlooringType,
                              })
                            }
                            className={`cursor-pointer rounded-xl px-3 py-2.5 text-left text-xs font-semibold transition-colors ${
                              active
                                ? 'bg-[#0D9488] text-white shadow-sm'
                                : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
                            }`}
                          >
                            {floor}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <label className="block border-t border-slate-100 pt-4 dark:border-slate-800">
                    <div className="mb-1 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
                      <span>Perspective Scale (Back-to-Front Taper)</span>
                      <span className="font-mono tabular-nums">
                        {Math.round(customizations.floorPerspectiveScale * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={20}
                      max={100}
                      value={Math.round(customizations.floorPerspectiveScale * 100)}
                      onChange={(e) =>
                        updateCustomizations(
                          {
                            ...customizations,
                            floorPerspectiveScale: Number(e.target.value) / 100,
                          },
                          false,
                        )
                      }
                      className="w-full accent-[#0D9488]"
                    />
                  </label>
                </div>
              )}

              {/* TAB 3: FURNITURE */}
              {activeTab === 'furniture' && (
                <div className="space-y-4">
                  <div>
                    <div className="mb-2 flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800 dark:text-slate-100">
                        Sofa / Bed / Furniture Color
                      </span>
                      <span className="font-mono text-slate-500">
                        {customizations.sofaBedColor}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {SOFA_COLOR_PRESETS.map((c) => {
                        const selected =
                          customizations.sofaBedColor.toLowerCase() ===
                          c.hex.toLowerCase();
                        return (
                          <button
                            key={c.hex}
                            type="button"
                            title={c.name}
                            onClick={() =>
                              updateCustomizations({
                                ...customizations,
                                sofaBedColor: c.hex,
                                furnitureIntensity:
                                  customizations.furnitureIntensity === 0
                                    ? 75
                                    : customizations.furnitureIntensity,
                              })
                            }
                            className={`h-8 w-8 cursor-pointer rounded-full border transition-transform hover:scale-110 ${
                              selected
                                ? 'border-slate-900 ring-2 ring-[#6D28D9] dark:border-white'
                                : 'border-slate-200 dark:border-slate-700'
                            }`}
                            style={{ backgroundColor: c.hex }}
                          />
                        );
                      })}
                      <input
                        type="color"
                        aria-label="Custom furniture color"
                        value={customizations.sofaBedColor}
                        onChange={(e) =>
                          updateCustomizations({
                            ...customizations,
                            sofaBedColor: e.target.value.toUpperCase(),
                            furnitureIntensity:
                              customizations.furnitureIntensity === 0
                                ? 75
                                : customizations.furnitureIntensity,
                          })
                        }
                        className="ml-auto h-8 w-10 cursor-pointer rounded-lg border border-slate-200 bg-transparent p-0.5 dark:border-slate-700"
                      />
                    </div>
                  </div>

                  <label className="block">
                    <div className="mb-1 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
                      <span>Upholstery Recolor Intensity</span>
                      <span className="font-mono tabular-nums">
                        {customizations.furnitureIntensity}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={customizations.furnitureIntensity}
                      onChange={(e) =>
                        updateCustomizations(
                          { ...customizations, furnitureIntensity: Number(e.target.value) },
                          false,
                        )
                      }
                      className="w-full accent-[#6D28D9]"
                    />
                  </label>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-[11px] text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
                    Tip: If a sofa or armchair wasn&apos;t detected, switch the canvas toolbar to{' '}
                    <span className="font-semibold">Brush</span> or{' '}
                    <span className="font-semibold">Magic Wand</span> with{' '}
                    <span className="font-semibold">Mask: Furniture</span> selected.
                  </div>
                </div>
              )}

              {/* TAB 4: DECOR */}
              {activeTab === 'decor' && (
                <div className="space-y-4">
                  <div>
                    <div className="mb-2 text-xs font-semibold text-slate-800 dark:text-slate-100">
                      Toggle Smart Decor Overlays
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {DECOR_ADDONS.map((addon) => {
                        const active = customizations.decorAddons.includes(addon);
                        return (
                          <button
                            key={addon}
                            type="button"
                            onClick={() => handleToggleAddonCheckbox(addon)}
                            className={`inline-flex cursor-pointer items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-medium transition-colors ${
                              active
                                ? 'bg-[#FF6B5B] text-white shadow-sm'
                                : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
                            }`}
                          >
                            {active && <Check className="h-3 w-3" />}
                            <span>{addon}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-2.5 border-t border-slate-100 pt-3 dark:border-slate-800">
                    <div className="text-xs font-semibold text-slate-800 dark:text-slate-100">
                      Add Variants (Draggable &amp; Resizable)
                    </div>
                    {OVERLAY_CATALOG.slice(0, 5).map((entry) => (
                      <div
                        key={entry.kind}
                        className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 dark:border-slate-800 dark:bg-slate-950"
                      >
                        <div className="mb-1.5 text-[11px] font-semibold text-slate-700 dark:text-slate-200">
                          {entry.label}
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {entry.variants.map((v) => (
                            <button
                              key={v.id}
                              type="button"
                              onClick={() =>
                                handleAddSpecificOverlay(entry.kind, v.id, entry.addon)
                              }
                              className="cursor-pointer rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 hover:border-[#0D9488] hover:text-[#0D9488] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                            >
                              + {v.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 5: LIGHTING */}
              {activeTab === 'lighting' && (
                <div className="space-y-4">
                  <div>
                    <div className="mb-2 text-xs font-semibold text-slate-800 dark:text-slate-100">
                      Lighting Mood Presets
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {(['Natural Daylight', 'Warm', 'Evening', 'Cool'] as LightingMood[]).map(
                        (mood) => (
                          <button
                            key={mood}
                            type="button"
                            onClick={() => handleApplyLightingMood(mood)}
                            className={`cursor-pointer rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${
                              customizations.lightingMood === mood
                                ? 'bg-[#6D28D9] text-white shadow-sm'
                                : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
                            }`}
                          >
                            {mood}
                          </button>
                        ),
                      )}
                    </div>
                  </div>

                  <div className="space-y-3 border-t border-slate-100 pt-3 dark:border-slate-800">
                    <label className="block">
                      <div className="mb-1 flex justify-between text-xs text-slate-600 dark:text-slate-300">
                        <span>Brightness</span>
                        <span className="font-mono tabular-nums">
                          {customizations.brightness > 0
                            ? `+${customizations.brightness}`
                            : customizations.brightness}
                        </span>
                      </div>
                      <input
                        type="range"
                        min={-40}
                        max={40}
                        value={customizations.brightness}
                        onChange={(e) =>
                          updateCustomizations(
                            { ...customizations, brightness: Number(e.target.value) },
                            false,
                          )
                        }
                        className="w-full accent-[#F59E0B]"
                      />
                    </label>

                    <label className="block">
                      <div className="mb-1 flex justify-between text-xs text-slate-600 dark:text-slate-300">
                        <span>Contrast</span>
                        <span className="font-mono tabular-nums">
                          {customizations.contrast > 0
                            ? `+${customizations.contrast}`
                            : customizations.contrast}
                        </span>
                      </div>
                      <input
                        type="range"
                        min={-30}
                        max={40}
                        value={customizations.contrast}
                        onChange={(e) =>
                          updateCustomizations(
                            { ...customizations, contrast: Number(e.target.value) },
                            false,
                          )
                        }
                        className="w-full accent-[#F59E0B]"
                      />
                    </label>

                    <label className="block">
                      <div className="mb-1 flex justify-between text-xs text-slate-600 dark:text-slate-300">
                        <span>Color Warmth</span>
                        <span className="font-mono tabular-nums">
                          {customizations.warmth > 0
                            ? `+${customizations.warmth}`
                            : customizations.warmth}
                        </span>
                      </div>
                      <input
                        type="range"
                        min={-40}
                        max={40}
                        value={customizations.warmth}
                        onChange={(e) =>
                          updateCustomizations(
                            { ...customizations, warmth: Number(e.target.value) },
                            false,
                          )
                        }
                        className="w-full accent-[#FF6B5B]"
                      />
                    </label>

                    <label className="block">
                      <div className="mb-1 flex justify-between text-xs text-slate-600 dark:text-slate-300">
                        <span>Cozy Vignette</span>
                        <span className="font-mono tabular-nums">
                          {customizations.vignette}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={80}
                        value={customizations.vignette}
                        onChange={(e) =>
                          updateCustomizations(
                            { ...customizations, vignette: Number(e.target.value) },
                            false,
                          )
                        }
                        className="w-full accent-[#6D28D9]"
                      />
                    </label>
                  </div>
                </div>
              )}

              {/* TAB 6: EXTRA INSTRUCTIONS + STARTER IDEA CHIPS */}
              {activeTab === 'instructions' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <label
                      htmlFor="studio-extra-instructions"
                      className="text-xs font-semibold text-slate-800 dark:text-slate-100"
                    >
                      Extra Instructions
                    </label>
                    <button
                      type="button"
                      onClick={handleSurpriseMe}
                      className="inline-flex cursor-pointer items-center gap-1 rounded-full bg-gradient-to-r from-[#FF6B5B] to-[#6D28D9] px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm transition-transform hover:scale-105"
                    >
                      <Sparkles className="h-3 w-3" />
                      <span>Surprise me</span>
                    </button>
                  </div>

                  <textarea
                    id="studio-extra-instructions"
                    rows={3}
                    value={customizations.extraInstructions}
                    onChange={(e) =>
                      updateCustomizations(
                        { ...customizations, extraInstructions: e.target.value },
                        false,
                      )
                    }
                    placeholder="e.g., Paint the walls sage green, add sheer white curtains, and add a monstera plant"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:border-[#0D9488] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />

                  <button
                    type="button"
                    onClick={() => handleApplyInstructions()}
                    className="w-full cursor-pointer rounded-xl bg-gradient-to-r from-[#0D9488] to-[#0891B2] py-2.5 text-xs font-semibold text-white shadow-sm hover:opacity-95"
                  >
                    Apply Instructions
                  </button>

                  {instructionWarning && (
                    <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-[11px] text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
                      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
                      <span>{instructionWarning}</span>
                    </div>
                  )}

                  {appliedChecklist.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 rounded-xl border border-teal-200 bg-teal-50/70 p-2.5 dark:border-teal-900/50 dark:bg-teal-950/20">
                      {appliedChecklist.map((item) => (
                        <span
                          key={item}
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-teal-800 dark:text-teal-300"
                        >
                          <CheckCircle2 className="h-3 w-3 shrink-0" />
                          <span>{item}</span>
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="space-y-2.5 border-t border-slate-100 pt-3 dark:border-slate-800">
                    <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                      Starter Idea Chips
                    </div>
                    {STARTER_IDEA_GROUPS.map((group) => (
                      <div key={group.group}>
                        <div className="mb-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                          {group.group}
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {group.ideas.map((idea) => (
                            <button
                              key={idea}
                              type="button"
                              onClick={() => {
                                const cur = customizations.extraInstructions.trim();
                                const nextText = cur
                                  ? `${cur}${cur.endsWith('.') ? ' ' : '. '}${idea}`
                                  : idea;
                                handleApplyInstructions(nextText);
                              }}
                              className={`cursor-pointer rounded-full border px-2.5 py-1 text-left text-[11px] font-medium transition-transform hover:scale-[1.02] ${group.chipClass}`}
                            >
                              {idea}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Optional Tags input for saving */}
              <div className="border-t border-slate-100 pt-4 dark:border-slate-800">
                <label
                  htmlFor="save-tags-input"
                  className="mb-1 block text-[11px] font-medium text-slate-500 dark:text-slate-400"
                >
                  Save Tags (comma-separated)
                </label>
                <input
                  id="save-tags-input"
                  type="text"
                  value={saveTagInput}
                  onChange={(e) => setSaveTagInput(e.target.value)}
                  placeholder="e.g., sunlit, phase-1, oak"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Sticky Bottom Studio Action Bar */}
      <div className="fixed right-0 bottom-0 left-0 z-30 border-t border-slate-200 bg-white/95 px-4 py-2.5 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/95">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              className="inline-flex cursor-pointer items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              <Undo2 className="h-3.5 w-3.5" />
              <span>Undo</span>
            </button>
            <button
              type="button"
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              className="inline-flex cursor-pointer items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              <Redo2 className="h-3.5 w-3.5" />
              <span>Redo</span>
            </button>
            <button
              type="button"
              onClick={handleResetAll}
              className="inline-flex cursor-pointer items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 dark:border-slate-700 dark:bg-slate-900 dark:text-rose-400"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset All</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={saving}
              onClick={() => void handleSaveDesign()}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-[#0D9488] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-teal-700 disabled:opacity-60"
            >
              <Bookmark className="h-3.5 w-3.5" />
              <span>{saving ? 'Saving...' : 'Save Design'}</span>
            </button>

            <button
              type="button"
              disabled={downloading}
              onClick={() => void handleDownloadPng()}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#FF6B5B] to-[#F59E0B] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:opacity-95 disabled:opacity-60"
            >
              <Download className="h-3.5 w-3.5" />
              <span>{downloading ? 'Exporting...' : 'Download PNG'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
