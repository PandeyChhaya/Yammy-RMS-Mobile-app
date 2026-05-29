import { Router } from 'express';
import {
    deleteTableController,
    getAllTablesController,
    getTableController,
    postTableController,
    putTableController,
} from './tables.controller.js';

const router = Router();

router.post('/',     postTableController);
router.get('/',       getAllTablesController);
router.get('/:id',    getTableController);
router.put('/:id',    putTableController);
router.delete('/:id', deleteTableController);

export default router;