import { Router } from 'express'
import { authenticate } from '../../middleware/auth.middleware.js'
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

router.post('/ingredients',        authenticate,    postIngredientController)
router.get('/ingredients',          authenticate, getAllIngredientsController)
router.get('/ingredients/:id',       authenticate, getIngredientController)
router.put('/ingredients/:id',       authenticate, putIngredientController)
router.delete('/ingredients/:id',    authenticate,  deleteIngredientController)

router.post('/suppliers',           authenticate,   postSupplierController)
router.get('/suppliers',            authenticate,   getAllSuppliersController)
router.get('/suppliers/:id',        authenticate,   getSupplierController)
router.put('/suppliers/:id',        authenticate,  putSupplierController)
router.delete('/suppliers/:id',     authenticate,  deleteSupplierController)

router.get('/invoices',             authenticate,   getAllInvoicesController)
router.get('/invoices/:id',        authenticate,   getInvoiceController)
router.get('/invoices/:id/items',  authenticate,   getInvoiceItemsController)
router.delete('/invoices/:id',      authenticate,  deleteInvoiceController)

router.get('/movements',          authenticate,    getStockMovementsController)
router.get('/alerts',             authenticate,   getStockAlertsController)
router.put('/alerts/:id/read',     authenticate,   markAlertAsReadController)
router.get('/dashboard',         authenticate,     getDashboardController)

export default router