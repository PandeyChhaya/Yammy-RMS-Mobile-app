import { Router } from 'express';
import { protect } from '../../middleware/auth.middleware.js';
import {
    deletePaymentController,
    esewaFailureCallback,
    esewaSuccessCallback,
    getAllPaymentsController,
    getPaymentController,
    initiateEsewaController,
    postPaymentController,
    putPaymentController,
    verifyEsewaController,
} from './payments.controller.js';

const router = Router();

router.post('/', protect, postPaymentController);
router.get('/', protect, getAllPaymentsController);
router.put('/:id', protect, putPaymentController);
router.delete('/:id', protect, deletePaymentController);
router.get('/:id', protect, getPaymentController);

router.post('/esewa/initiate', protect, initiateEsewaController);
router.post('/esewa/verify', protect, verifyEsewaController);
router.get('/esewa/callback/success', esewaSuccessCallback);
router.get('/esewa/callback/failure', esewaFailureCallback);

export default router;