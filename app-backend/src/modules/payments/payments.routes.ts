import { Router } from 'express';
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

router.post('/',  postPaymentController);
router.get('/', getAllPaymentsController);
router.put('/:id',  putPaymentController);
router.delete('/:id',  deletePaymentController);
router.get('/:id',  getPaymentController);

router.post('/esewa/initiate',  initiateEsewaController);
router.post('/esewa/verify',  verifyEsewaController);
router.get('/esewa/callback/success', esewaSuccessCallback);
router.get('/esewa/callback/failure', esewaFailureCallback);

export default router;