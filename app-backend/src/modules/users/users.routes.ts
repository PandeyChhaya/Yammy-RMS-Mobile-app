import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import { deleteUserController, getAllUserController, getUserController, postUserController, putUserController } from './user.controller.js';
const router = Router();

router.post('/', authenticate, postUserController);
router.get('/', authenticate, getAllUserController);
router.put('/:id',  authenticate, putUserController);
router.delete('/:id',  authenticate,deleteUserController);
router.get('/:id',  authenticate, getUserController);

export default router;