import { Router } from 'express';
import { protect } from '../../middleware/auth.middleware.js';
import { deleteTableController, getAllTableController, getTableController, postTableController, putTableController } from './tables.controller.js';

const router = Router();

router.post('/', protect, postTableController);
router.get('/', protect, getAllTableController);
router.put('/:id', protect, putTableController);
router.delete('/:id', protect, deleteTableController);
router.get('/:id', protect, getTableController);

export default router;