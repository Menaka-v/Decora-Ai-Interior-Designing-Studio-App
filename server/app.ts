import path from 'node:path';
import cors from 'cors';
import express from 'express';
import { errorHandler } from './middleware/errorHandler.ts';
import authRoutes from './routes/auth.ts';
import consultationsRoutes from './routes/consultations.ts';
import designsRoutes from './routes/designs.ts';
import uploadRoutes from './routes/upload.ts';

/**
 * Create and configure the DecoraAI Express application.
 */
export function createApiApp() {
  const app = express();

  app.use(
    cors({
      origin: true,
      credentials: true,
    }),
  );

  // Support base64 room uploads up to 25MB
  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ extended: true, limit: '25mb' }));

  // Serve uploaded room photos statically
  app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads')));

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, service: 'DecoraAI API' });
  });

  // Domain API routes
  app.use('/api/auth', authRoutes);
  app.use('/api/designs', designsRoutes);
  app.use('/api/upload', uploadRoutes);
  app.use('/api/consultations', consultationsRoutes);

  // Structured JSON error handling
  app.use(errorHandler);

  return app;
}
