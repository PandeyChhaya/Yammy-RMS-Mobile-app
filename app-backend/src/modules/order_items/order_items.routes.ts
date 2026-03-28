import { Router } from 'express';
import { protect } from '../../middleware/auth.middleware.js';
import { deleteOrderItemController, getAllOrderItemController, getOrderItemController, postOrderItemController, putOrderItemController } from './order_items.controller.js';

const router = Router();

router.post('/', protect, postOrderItemController);
router.get('/', protect, getAllOrderItemController);
router.put('/:id', protect, putOrderItemController);
router.delete('/:id', protect,deleteOrderItemController);
router.get('/:id', protect, getOrderItemController);

export default router;