import { diskStorage } from 'multer';
import { existsSync, mkdirSync } from 'fs';
import { extname, resolve } from 'path';

export const UPLOADS_ROOT = resolve(process.cwd(), 'uploads', 'lab-results');

export const labResultFileStorage = diskStorage({
  destination: (_req, _file, cb) => {
    if (!existsSync(UPLOADS_ROOT)) {
      mkdirSync(UPLOADS_ROOT, { recursive: true });
    }
    cb(null, UPLOADS_ROOT);
  },
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extname(file.originalname)}`;
    cb(null, unique);
  },
});
