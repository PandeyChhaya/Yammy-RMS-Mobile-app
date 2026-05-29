import { Router } from 'express';
import { deleteMenuItemsController, getAllMenuItemsController, getMenuItemsController, postMenuItemsController, putMenuItemsController } from './menu-items.controller.js';

const router = Router();

router.post('/',postMenuItemsController);
router.get('/:id', getMenuItemsController);
router.get('/',  getAllMenuItemsController);
router.put('/:id', putMenuItemsController);
router.delete('/:id',  deleteMenuItemsController);

export default router;