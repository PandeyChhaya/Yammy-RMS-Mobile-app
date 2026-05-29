import { Router } from 'express';
import { deleteUserController, getAllUserController, getUserController, postUserController, putUserController } from './user.controller.js';
const router = Router();

router.post('/',  postUserController);
router.get('/', getAllUserController);
router.put('/:id',  putUserController);
router.delete('/:id',  deleteUserController);
router.get('/:id',  getUserController);

export default router;