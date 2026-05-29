import { Router } from 'express';
import {
    deleteReservationController,
    getReservationController,
    getReservationsByDateController,
    postReservationController,
    putReservationController,
    updateReservationStatusController,
} from './reservations.controller.js';

const router = Router();

router.post('/',             postReservationController);
router.get('/',              getReservationsByDateController);
router.get('/:id',           getReservationController);
router.put('/:id',           putReservationController);
router.put('/:id/status',    updateReservationStatusController);
router.delete('/:id',        deleteReservationController);

export default router;