import { Router } from 'express';
import { protect } from '../../middleware/auth.middleware.js';
import {
    deleteTableController,
    getAllTablesController,
    getTableController,
    postTableController,
    putTableController,
} from './tables.controller.js';

const router = Router();

router.post('/',     protect, postTableController);
router.get('/',      protect, getAllTablesController);
router.get('/:id',   protect, getTableController);
router.put('/:id',   protect, putTableController);
router.delete('/:id',protect, deleteTableController);

export default router;