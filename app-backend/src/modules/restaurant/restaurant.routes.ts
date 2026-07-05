import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';

import {
    deleteRestaurantController,
    getActiveRestaurantsController,
    getAllRestaurantController,
    getRestaurantController,
    postRestaurantController,
    putRestaurantController,
} from './restaurant.controller.js';

const router = Router();

router.post("/", authenticate, postRestaurantController);
router.get("/", getAllRestaurantController);
router.get("/active", getActiveRestaurantsController);
router.get("/:id", getRestaurantController);
router.put("/:id", putRestaurantController);
router.delete("/:id", deleteRestaurantController);

export default router;