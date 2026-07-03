import { Router } from 'express';
import multer from 'multer';
import {
    searchUnsplashController,
    uploadFromFileController,
    uploadFromUrlController,
} from './image.controller.js';

const router = Router();

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 8 * 1024 * 1024 },
});

router.get('/unsplash/search', searchUnsplashController);
router.post('/upload-from-url', uploadFromUrlController);
router.post('/upload-from-file', upload.single('image'), uploadFromFileController);

export default router;