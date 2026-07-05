import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import { deleteMenuItemsController, getAllMenuItemsController, getMenuItemsController, postMenuItemsController, putMenuItemsController } from './menu-items.controller.js';

const router = Router();

router.post('/', authenticate, postMenuItemsController);
router.get('/:id', getMenuItemsController);
router.get('/', authenticate, getAllMenuItemsController);
router.put('/:id', authenticate, putMenuItemsController);
router.delete('/:id', authenticate, deleteMenuItemsController);

export default router;