import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';

import { deleteCategoryController, getAllCategoryController, getCategoryController, postCategoryController, putCategoryController } from './categories.controller.js';


const router = Router();

router.post("/", authenticate, postCategoryController);
router.get("/", getAllCategoryController);
router.get("/:id", authenticate,getCategoryController);
router.put("/:id", authenticate, putCategoryController);
router.delete("/:id", authenticate, deleteCategoryController);

export default router;