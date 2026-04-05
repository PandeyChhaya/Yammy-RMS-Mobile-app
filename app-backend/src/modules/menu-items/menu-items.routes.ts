import { Router } from 'express';
import { protect } from '../../middleware/auth.middleware.js';
import { deleteMenuItemsController, getAllMenuItemsController, getMenuItemsController, postMenuItemsController, putMenuItemsController } from './menu-items.controller.js';

const router = Router();

router.post('/',protect,postMenuItemsController);
router.get('/:id', getMenuItemsController);
router.get('/', protect, getAllMenuItemsController);
router.put('/:id',protect, putMenuItemsController);
router.delete('/:id', protect, deleteMenuItemsController);

export default router;