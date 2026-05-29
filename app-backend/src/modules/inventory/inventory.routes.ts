import { Router } from 'express'
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

router.post('/ingredients',           postIngredientController)
router.get('/ingredients',            getAllIngredientsController)
router.get('/ingredients/:id',        getIngredientController)
router.put('/ingredients/:id',        putIngredientController)
router.delete('/ingredients/:id',     deleteIngredientController)

router.post('/suppliers',             postSupplierController)
router.get('/suppliers',              getAllSuppliersController)
router.get('/suppliers/:id',          getSupplierController)
router.put('/suppliers/:id',          putSupplierController)
router.delete('/suppliers/:id',       deleteSupplierController)

router.get('/invoices',               getAllInvoicesController)
router.get('/invoices/:id',           getInvoiceController)
router.get('/invoices/:id/items',     getInvoiceItemsController)
router.delete('/invoices/:id',        deleteInvoiceController)

router.get('/movements',              getStockMovementsController)
router.get('/alerts',                getStockAlertsController)
router.put('/alerts/:id/read',        markAlertAsReadController)
router.get('/dashboard',              getDashboardController)

export default router