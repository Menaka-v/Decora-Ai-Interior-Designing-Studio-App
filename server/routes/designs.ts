import { Router } from 'express';
import { optionalAuth, type AuthenticatedRequest } from '../middleware/auth.ts';
import { ApiError } from '../middleware/errorHandler.ts';
import { store } from '../services/store.ts';

const router = Router();

router.get('/', optionalAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const designs = await store.listDesigns(req.user?.userId ?? null);
    res.json({ designs });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const design = await store.getDesignById(String(req.params.id));
    if (!design) {
      throw new ApiError(404, 'Design not found.');
    }
    res.json({ design });
  } catch (err) {
    next(err);
  }
});

router.post('/', optionalAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const {
      title,
      originalImage,
      generatedImages,
      selectedVariationIndex,
      style,
      styleId,
      roomType,
      customizations,
      tags,
    } = req.body as {
      title?: string;
      originalImage?: string;
      generatedImages?: unknown[];
      selectedVariationIndex?: number;
      style?: string;
      styleId?: string;
      roomType?: string;
      customizations?: Record<string, unknown>;
      tags?: string[];
    };

    if (!originalImage || !Array.isArray(generatedImages) || generatedImages.length === 0) {
      throw new ApiError(400, 'Design must include an original image and at least one variation.');
    }
    if (!style || !roomType || !customizations) {
      throw new ApiError(400, 'Style, roomType, and customizations are required.');
    }

    const created = await store.createDesign({
      userId: req.user?.userId ?? null,
      title: title?.trim() || `${style} ${roomType}`,
      originalImage,
      generatedImages: generatedImages as never,
      selectedVariationIndex: selectedVariationIndex ?? 0,
      style,
      styleId: styleId || style.toLowerCase().replace(/\s+/g, '-'),
      roomType,
      customizations: customizations as never,
      tags: Array.isArray(tags) && tags.length > 0 ? tags : [roomType, style],
      isFavorite: false,
    });

    res.status(201).json({ design: created });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/favorite', optionalAuth, async (req, res, next) => {
  try {
    const updated = await store.toggleFavoriteDesign(String(req.params.id));
    if (!updated) {
      throw new ApiError(404, 'Design not found.');
    }
    res.json({ design: updated });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/tags', optionalAuth, async (req, res, next) => {
  try {
    const { tags } = req.body as { tags?: string[] };
    if (!Array.isArray(tags)) {
      throw new ApiError(400, 'Tags must be an array of strings.');
    }
    const updated = await store.updateDesignTags(String(req.params.id), tags);
    if (!updated) {
      throw new ApiError(404, 'Design not found.');
    }
    res.json({ design: updated });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', optionalAuth, async (req, res, next) => {
  try {
    const deleted = await store.deleteDesign(String(req.params.id));
    if (!deleted) {
      throw new ApiError(404, 'Design not found.');
    }
    res.json({ ok: true, id: String(req.params.id) });
  } catch (err) {
    next(err);
  }
});

export default router;
