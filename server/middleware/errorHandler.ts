import type { NextFunction, Request, Response } from 'express';

/**
 * Custom HTTP error carrying a status code and optional validation details.
 */
export class ApiError extends Error {
  statusCode: number;
  details?: unknown;

  constructor(statusCode: number, message: string, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.name = 'ApiError';
  }
}

/**
 * Express error handling middleware returning structured JSON error responses.
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      error: err.message,
      details: err.details,
    });
    return;
  }

  // Multer file size / format errors
  if (typeof err === 'object' && err !== null && 'code' in err) {
    const code = (err as { code?: string }).code;
    if (code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({ error: 'Uploaded image must be 10MB or smaller.' });
      return;
    }
  }

  const message =
    err instanceof Error ? err.message : 'An unexpected server error occurred.';
  console.error('[DecoraAI Server Error]', err);
  res.status(500).json({ error: message });
}
