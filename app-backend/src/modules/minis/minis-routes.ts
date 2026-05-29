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
router.post('/',  upload.single('video'), uploadMiniController);
router.patch('/:id/status', updateMiniStatusController);
router.delete('/:id', deleteMiniController);
router.patch('/:id/view', incrementViewController);                                        

export default router;