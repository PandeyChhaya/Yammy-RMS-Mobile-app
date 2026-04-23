import { v2 as cloudinary } from 'cloudinary';
import { Router } from 'express';
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { protect, restrictTo } from '../../middleware/auth.middleware.js';
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

router.get('/', protect, getApprovedMinisController);                                          
router.get('/my', protect, restrictTo('admin'), getMyMinisController);                         
router.get('/all', protect, restrictTo('superadmin'), getAllMinisController);                   
router.post('/', protect, restrictTo('admin'), upload.single('video'), uploadMiniController);  
router.patch('/:id/status', protect, restrictTo('superadmin'), updateMiniStatusController);    
router.delete('/:id', protect, restrictTo('admin', 'superadmin'), deleteMiniController);       
router.patch('/:id/view', incrementViewController);                                            

export default router;