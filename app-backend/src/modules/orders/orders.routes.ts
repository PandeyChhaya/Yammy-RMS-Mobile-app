import { Router } from 'express';
import { deleteOrderController, getAllOrderController, getOrderController, postOrderController, putOrderController, updateOrderStatusController } from './orders.controller.js';


const router = Router();

router.post("/", postOrderController);
router.get("/",  getAllOrderController);
router.get("/:id",  getOrderController);
router.put("/:id",  putOrderController);
router.delete("/:id",  deleteOrderController);
router.patch("/:id/status",  updateOrderStatusController);

export default router;
