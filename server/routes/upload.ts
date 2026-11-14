import fs from 'node:fs';
import path from 'node:path';
import { Router } from 'express';
import multer from 'multer';
import { ApiError } from '../middleware/errorHandler.ts';

const router = Router();
const UPLOAD_DIR = path.resolve(process.cwd(), 'uploads');

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new ApiError(400, 'Only JPG and PNG images up to 10MB are supported.'));
    }
  },
});

router.post('/', upload.single('image'), (req, res, next) => {
  try {
    if (!req.file) {
      throw new ApiError(400, 'Please select a JPG or PNG image file to upload.');
    }

    const ext = req.file.mimetype === 'image/png' ? 'png' : 'jpg';
    const filename = `room_${Date.now()}_${Math.random().toString(36).slice(2, 7)}.${ext}`;
    const filepath = path.join(UPLOAD_DIR, filename);
    fs.writeFileSync(filepath, req.file.buffer);

    const dataUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;

    res.status(201).json({
      url: `/uploads/${filename}`,
      dataUrl,
      filename,
      size: req.file.size,
      mimeType: req.file.mimetype,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
