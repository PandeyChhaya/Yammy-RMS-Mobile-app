import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import {
    deleteTableController,
    getAllTablesController,
    getTableController,
    postTableController,
    putTableController,
} from './tables.controller.js';

const router = Router();

router.post('/',     authenticate, postTableController);
router.get('/',      authenticate, getAllTablesController);
router.get('/:id',   authenticate,  getTableController);
router.put('/:id',    authenticate, putTableController);
router.delete('/:id', authenticate, deleteTableController);

export default router;