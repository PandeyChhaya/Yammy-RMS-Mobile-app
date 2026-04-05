import { Router } from 'express';
import { protect } from '../../middleware/auth.middleware.js';
import {
    deleteReservationController,
    getAllReservationsController,
    getReservationController,
    getReservationsByCustomerController,
    postReservationController,
    putReservationController,
} from './reservations.controller.js';

const reservationsRouter = Router();

reservationsRouter.post('/', protect, postReservationController);

reservationsRouter.get('/', protect, getAllReservationsController);

reservationsRouter.get('/:id', protect, getReservationController);

reservationsRouter.get('/customer/:id', protect, getReservationsByCustomerController);

reservationsRouter.put('/:id', protect, putReservationController);

reservationsRouter.delete('/:id', protect, deleteReservationController);

export default reservationsRouter;