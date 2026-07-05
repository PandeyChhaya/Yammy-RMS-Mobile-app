import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import { deleteOrderController, getAllOrderController, getOrderController, postOrderController, putOrderController, updateOrderStatusController } from './orders.controller.js';


const router = Router();

router.post("/", authenticate, postOrderController);
router.get("/",  authenticate, getAllOrderController);
router.get("/:id", authenticate, getOrderController);
router.put("/:id", authenticate, putOrderController);
router.delete("/:id", authenticate, deleteOrderController);
router.patch("/:id/status", authenticate, updateOrderStatusController);

export default router;