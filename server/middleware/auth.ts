import type { NextFunction, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ApiError } from './errorHandler.ts';

const JWT_SECRET =
  process.env.JWT_SECRET || 'decoraai-dev-jwt-secret-change-in-production';
const JWT_EXPIRES_IN = '7d';

export interface AuthPayload {
  userId: string;
  email: string;
  name: string;
  role?: 'user' | 'admin';
}

export interface AuthenticatedRequest extends Request {
  user?: AuthPayload;
}

/**
 * Hash a plaintext password with bcrypt (cost factor 10).
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Verify a plaintext password against a stored bcrypt hash.
 */
export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Issue a signed JWT for an authenticated user.
 */
export function signAuthToken(payload: AuthPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Verify a Bearer JWT and return its payload.
 */
export function verifyAuthToken(token: string): AuthPayload {
  return jwt.verify(token, JWT_SECRET) as AuthPayload;
}

/**
 * Strict JWT authentication middleware for protected routes.
 */
export function requireAuth(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction,
): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    next(new ApiError(401, 'Authentication required. Please sign in to continue.'));
    return;
  }

  const token = header.slice(7).trim();
  try {
    req.user = verifyAuthToken(token);
    next();
  } catch {
    next(new ApiError(401, 'Session expired or invalid token. Please sign in again.'));
  }
}

/**
 * Strict Admin role middleware (must be used after requireAuth).
 */
export function requireAdmin(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction,
): void {
  if (!req.user || req.user.role !== 'admin') {
    next(new ApiError(403, 'Administrator access is required for this resource.'));
    return;
  }
  next();
}

/**
 * Optional JWT middleware that attaches req.user when a valid Bearer token is present,
 * allowing guests to browse sample/public studio capabilities seamlessly.
 */
export function optionalAuth(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction,
): void {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    const token = header.slice(7).trim();
    try {
      req.user = verifyAuthToken(token);
    } catch {
      // Ignore expired/invalid optional token so guest actions still work
    }
  }
  next();
}
