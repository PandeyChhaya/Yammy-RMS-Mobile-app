import { Router } from 'express';
import { protect } from '../../middleware/auth.middleware.js';
import { deleteOrderController, getAllOrderController, getOrderController, postOrderController, putOrderController, updateOrderStatusController } from './orders.controller.js';


const router = Router();

router.post("/",protect, postOrderController);
router.get("/", protect, getAllOrderController);
router.get("/:id", protect, getOrderController);
router.put("/:id", protect, putOrderController);
router.delete("/:id", protect , deleteOrderController);
router.patch("/:id/status", protect, updateOrderStatusController);

export default router;
