import { Router } from 'express';
import { protect } from '../../middleware/auth.middleware.js';
import { deleteUserController, getAllUserController, getUserController, postUserController, putUserController } from './user.controller.js';
const router = Router();

router.post('/', protect, postUserController);
router.get('/', protect, getAllUserController);
router.put('/:id', protect, putUserController);
router.delete('/:id', protect, deleteUserController);
router.get('/:id', protect, getUserController);

export default router;