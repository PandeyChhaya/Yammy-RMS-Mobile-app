import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import {
    deleteReservationController,
    getReservationController,
    getReservationsByDateController,
    postReservationController,
    putReservationController,
    updateReservationStatusController,
} from './reservations.controller.js';


const router = Router();

router.post('/',             authenticate, postReservationController);
router.get('/',              authenticate, getReservationsByDateController);
router.get('/:id',           authenticate, getReservationController);
router.put('/:id',           authenticate, putReservationController);
router.put('/:id/status',    authenticate, updateReservationStatusController);
router.delete('/:id',        authenticate, deleteReservationController);

export default router;