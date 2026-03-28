import { Router } from 'express';
import { protect } from '../../middleware/auth.middleware.js';
import { deletePaymentController, getAllPaymentsController, getPaymentController, postPaymentController, putPaymentController } from './payments.controller.js';

const router = Router();

router.post('/', protect, postPaymentController);
router.get('/', protect, getAllPaymentsController);
router.put('/:id', protect, putPaymentController);
router.delete('/:id', protect,deletePaymentController);
router.get('/:id', protect, getPaymentController);

export default router;