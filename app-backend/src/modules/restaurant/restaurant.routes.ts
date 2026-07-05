import { Router } from 'express';

import {
    deleteRestaurantController,
    getActiveRestaurantsController,
    getAllRestaurantController,
    getRestaurantController,
    postRestaurantController,
    putRestaurantController,
} from './restaurant.controller.js';

const router = Router();

router.post("/", postRestaurantController);
router.get("/", getAllRestaurantController);
router.get("/active", getActiveRestaurantsController);
router.get("/:id", getRestaurantController);
router.put("/:id", putRestaurantController);
router.delete("/:id", deleteRestaurantController);

export default router;