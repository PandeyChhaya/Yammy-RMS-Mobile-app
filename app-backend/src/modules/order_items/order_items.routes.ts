import { Router } from 'express';
import { deleteOrderItemController, getAllOrderItemController, getOrderItemController, postOrderItemController, putOrderItemController } from './order_items.controller.js';

const router = Router();

router.post('/', postOrderItemController);
router.get('/', getAllOrderItemController);
router.put('/:id',  putOrderItemController);
router.delete('/:id', deleteOrderItemController);
router.get('/:id',  getOrderItemController);

export default router;