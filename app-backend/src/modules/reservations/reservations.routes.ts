import { Router } from 'express';
import { protect } from '../../middleware/auth.middleware.js';
import {
    deleteReservationController,
    getReservationController,
    getReservationsByDateController,
    postReservationController,
    putReservationController,
    updateReservationStatusController,
} from './reservations.controller.js';

const router = Router();

router.post('/',            protect, postReservationController);
router.get('/',             protect, getReservationsByDateController);
router.get('/:id',          protect, getReservationController);
router.put('/:id',          protect, putReservationController);
router.put('/:id/status',   protect, updateReservationStatusController);
router.delete('/:id',       protect, deleteReservationController);

export default router;