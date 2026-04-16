import { Router } from 'express';
import { protect } from '../../middleware/auth.middleware.js';
import { deleteInventoryController, getAllInventoryController, getInventoryController, postInventoryController, putInventoryController } from './inventory.controller.js';

const router = Router();

router.post('/', protect, postInventoryController);
router.get('/', protect, getAllInventoryController);
router.get('/:id', protect, getInventoryController);
router.put('/:id', protect, putInventoryController);
router.delete('/:id', protect, deleteInventoryController);

export default router;