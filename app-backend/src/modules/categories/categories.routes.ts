import { Router } from 'express';
import { protect } from '../../middleware/auth.middleware.js';
import { deleteCategoryController, getAllCategoryController, getCategoryController, postCategoryController, putCategoryController } from './categories.controller.js';


const router = Router();

router.post("/",protect, postCategoryController);
router.get("/", protect, getAllCategoryController);
router.get("/:id", protect, getCategoryController);
router.put("/:id", protect, putCategoryController);
router.delete("/:id", protect , deleteCategoryController);

export default router;
