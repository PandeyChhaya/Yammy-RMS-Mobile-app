import { Router } from 'express';

import { deleteCategoryController, getAllCategoryController, getCategoryController, postCategoryController, putCategoryController } from './categories.controller.js';


const router = Router();

router.post("/", postCategoryController);
router.get("/", getAllCategoryController);
router.get("/:id", getCategoryController);
router.put("/:id",  putCategoryController);
router.delete("/:id",  deleteCategoryController);

export default router;
