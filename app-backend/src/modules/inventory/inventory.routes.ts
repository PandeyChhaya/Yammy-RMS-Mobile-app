import { Router } from 'express'
import { protect } from '../../middleware/auth.middleware.js'
import {
    deleteIngredientController,
    deleteInvoiceController,
    deleteSupplierController,
    getAllIngredientsController,
    getAllInvoicesController,
    getAllSuppliersController,
    getDashboardController,
    getIngredientController,
    getInvoiceController, getInvoiceItemsController,
    getStockAlertsController,
    getStockMovementsController,
    getSupplierController,
    markAlertAsReadController,
    postIngredientController,
    postSupplierController,
    putIngredientController,
    putSupplierController,
} from './inventory.controller.js'

const router = Router()

router.post('/ingredients',          protect, postIngredientController)
router.get('/ingredients',           protect, getAllIngredientsController)
router.get('/ingredients/:id',       protect, getIngredientController)
router.put('/ingredients/:id',       protect, putIngredientController)
router.delete('/ingredients/:id',    protect, deleteIngredientController)

router.post('/suppliers',            protect, postSupplierController)
router.get('/suppliers',             protect, getAllSuppliersController)
router.get('/suppliers/:id',         protect, getSupplierController)
router.put('/suppliers/:id',         protect, putSupplierController)
router.delete('/suppliers/:id',      protect, deleteSupplierController)

router.get('/invoices',              protect, getAllInvoicesController)
router.get('/invoices/:id',          protect, getInvoiceController)
router.get('/invoices/:id/items',    protect, getInvoiceItemsController)
router.delete('/invoices/:id',       protect, deleteInvoiceController)

router.get('/movements',             protect, getStockMovementsController)
router.get('/alerts',                protect, getStockAlertsController)
router.put('/alerts/:id/read',       protect, markAlertAsReadController)
router.get('/dashboard',             protect, getDashboardController)

export default router