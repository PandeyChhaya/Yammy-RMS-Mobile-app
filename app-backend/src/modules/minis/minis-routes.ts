import { v2 as cloudinary } from 'cloudinary';
import { Router } from 'express';
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import {
  deleteMiniController,
  getAllMinisController,
  getApprovedMinisController,
  getMyMinisController,
  incrementViewController,
  updateMiniStatusController,
  uploadMiniController,
} from './minis-controller.js';

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'yammy/minis',
    resource_type: 'video',
    allowed_formats: ['mp4', 'mov', 'avi'],
  } as any,
});

const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

const router = Router();

router.get('/',  getApprovedMinisController);
router.get('/my', getMyMinisController);
router.get('/all',  getAllMinisController);

// multer/cloudinary errors (bad format, file too large, network issue
// during upload) otherwise bypass our controllers entirely and hit
// Express's default HTML error page — the app then tries to JSON.parse
// that HTML and crashes with "Unexpected character: <"
router.post('/', (req, res, next) => {
  upload.single('video')(req, res, (err) => {
    if (err) {
      console.log('Mini upload error (full):', JSON.stringify(err, Object.getOwnPropertyNames(err)));
      const message = err.message || err?.error?.message || 'Upload failed';
      return res.status(400).json({ message });
    }
    next();
  });
}, uploadMiniController);

router.patch('/:id/status', updateMiniStatusController);
router.delete('/:id', deleteMiniController);
router.patch('/:id/view', incrementViewController);

export default router;