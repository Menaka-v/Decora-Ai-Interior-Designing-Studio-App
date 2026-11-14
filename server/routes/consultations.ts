import { Router } from 'express';
import {
  optionalAuth,
  requireAdmin,
  requireAuth,
  type AuthenticatedRequest,
} from '../middleware/auth.ts';
import { ApiError } from '../middleware/errorHandler.ts';
import { store, type ConsultationStatus } from '../services/store.ts';

const router = Router();
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_STATUSES: ConsultationStatus[] = [
  'Pending',
  'Confirmed',
  'Completed',
  'Cancelled',
];

router.get('/', optionalAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (req.user?.role === 'admin') {
      const consultations = await store.listAllConsultations();
      res.json({ consultations });
      return;
    }
    const consultations = await store.listConsultations(req.user?.userId ?? null);
    res.json({ consultations });
  } catch (err) {
    next(err);
  }
});

router.get(
  '/admin/all',
  requireAuth,
  requireAdmin,
  async (_req: AuthenticatedRequest, res, next) => {
    try {
      const [consultations, users] = await Promise.all([
        store.listAllConsultations(),
        store.listUsersSummary(),
      ]);
      res.json({ consultations, users });
    } catch (err) {
      next(err);
    }
  },
);

router.post('/', optionalAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const {
      designerId,
      designerName,
      name,
      email,
      phone,
      roomType,
      preferredDate,
      preferredTime,
      message,
    } = req.body as {
      designerId?: string;
      designerName?: string;
      name?: string;
      email?: string;
      phone?: string;
      roomType?: string;
      preferredDate?: string;
      preferredTime?: string;
      message?: string;
    };

    if (!name || name.trim().length < 2) {
      throw new ApiError(400, 'Please enter your full name.');
    }
    if (!email || !EMAIL_RE.test(email.trim())) {
      throw new ApiError(400, 'Please enter a valid email address.');
    }
    if (!phone || phone.trim().length < 7) {
      throw new ApiError(400, 'Please enter a valid phone number.');
    }
    if (!roomType || !preferredDate || !preferredTime) {
      throw new ApiError(400, 'Please choose a room type, preferred date, and time.');
    }

    const consultation = await store.createConsultation({
      userId: req.user?.userId ?? null,
      designerId: designerId || 'designer-ananya',
      designerName: designerName || 'Ananya Verma',
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      roomType,
      preferredDate,
      preferredTime,
      message: message?.trim() || '',
    });

    res.status(201).json({ consultation });
  } catch (err) {
    next(err);
  }
});

router.patch(
  '/:id/status',
  requireAuth,
  requireAdmin,
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const id = String(req.params.id);
      const { status } = req.body as { status?: ConsultationStatus };
      if (!status || !VALID_STATUSES.includes(status)) {
        throw new ApiError(
          400,
          'Status must be Pending, Confirmed, Completed, or Cancelled.',
        );
      }

      const updated = await store.updateConsultationStatus(id, status);
      if (!updated) {
        throw new ApiError(404, 'Consultation booking not found.');
      }
      res.json({ consultation: updated });
    } catch (err) {
      next(err);
    }
  },
);

router.delete(
  '/:id',
  requireAuth,
  requireAdmin,
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const id = String(req.params.id);
      const deleted = await store.deleteConsultation(id);
      if (!deleted) {
        throw new ApiError(404, 'Consultation booking not found.');
      }
      res.json({ ok: true, id });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
