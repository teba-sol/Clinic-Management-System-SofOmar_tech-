import { memoryStorage } from 'multer';
import { resolve } from 'path';

export const UPLOADS_ROOT = resolve(process.cwd(), 'uploads', 'lab-results');

export const labResultFileStorage = memoryStorage();
