import { Router } from 'express';
import {
  hashPassword,
  requireAuth,
  signAuthToken,
  verifyPassword,
  type AuthenticatedRequest,
} from '../middleware/auth.ts';
import { ApiError } from '../middleware/errorHandler.ts';
import { store } from '../services/store.ts';

const router = Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password, preferredStyle } = req.body as {
      name?: string;
      email?: string;
      password?: string;
      preferredStyle?: string;
    };

    if (!name || name.trim().length < 2) {
      throw new ApiError(400, 'Please enter your full name (at least 2 characters).');
    }
    if (!email || !EMAIL_RE.test(email.trim())) {
      throw new ApiError(400, 'Please enter a valid email address.');
    }
    if (!password || password.length < 6) {
      throw new ApiError(400, 'Password must be at least 6 characters long.');
    }

    const existing = await store.findUserByEmail(email);
    if (existing) {
      throw new ApiError(409, 'An account with this email already exists.');
    }

    const passwordHash = await hashPassword(password);
    const user = await store.createUser({
      name,
      email,
      passwordHash,
      preferredStyle,
    });

    const token = signAuthToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    res.status(201).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        preferredStyle: user.preferredStyle,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body as {
      email?: string;
      password?: string;
    };

    if (!email || !EMAIL_RE.test(email.trim())) {
      throw new ApiError(400, 'Please enter a valid email address.');
    }
    if (!password) {
      throw new ApiError(400, 'Please enter your password.');
    }

    const user = await store.findUserByEmail(email);
    if (!user) {
      throw new ApiError(401, 'Invalid email or password.');
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      throw new ApiError(401, 'Invalid email or password.');
    }

    const token = signAuthToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        preferredStyle: user.preferredStyle,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.get('/me', requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      throw new ApiError(401, 'Authentication required.');
    }

    const user = await store.findUserById(userId);
    if (!user) {
      throw new ApiError(404, 'User profile not found.');
    }

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        preferredStyle: user.preferredStyle,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.patch('/profile', requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      throw new ApiError(401, 'Authentication required.');
    }

    const { name, preferredStyle } = req.body as {
      name?: string;
      preferredStyle?: string;
    };

    const updated = await store.updateUserProfile(userId, { name, preferredStyle });
    if (!updated) {
      throw new ApiError(404, 'User profile not found.');
    }

    res.json({
      user: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        role: updated.role,
        preferredStyle: updated.preferredStyle,
        createdAt: updated.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
