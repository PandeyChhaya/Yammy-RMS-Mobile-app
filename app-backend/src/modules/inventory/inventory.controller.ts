import type { Request, Response } from 'express'
import {
    createIngredient,
    createSupplier,
    deleteIngredient,
    deleteInvoice,
    deleteSupplier,
    getAllIngredients,
    getAllInvoices,
    getAllSuppliers,
    getDashboardData,
    getIngredientById,
    getInvoiceById, getInvoiceItems,
    getStockAlerts,
    getStockMovements,
    getSupplierById,
    markAlertAsRead,
    updateIngredient,
    updateSupplier,
} from './inventory.service.js'

const handle = (fn: Function) => async (req: Request, res: Response) => {
  try { res.json(await fn(req)) }
  catch (e: any) { res.status(400).json({ message: e.message }) }
}

const id = (req: Request) => String(req.params.id)

export const postIngredientController    = handle((req: Request) => createIngredient(req.body))
export const getAllIngredientsController  = handle(() => getAllIngredients())
export const getIngredientController     = handle((req: Request) => getIngredientById(id(req)))
export const putIngredientController     = handle((req: Request) => updateIngredient(id(req), req.body))
export const deleteIngredientController  = handle((req: Request) => deleteIngredient(id(req)))

export const postSupplierController      = handle((req: Request) => createSupplier(req.body))
export const getAllSuppliersController   = handle(() => getAllSuppliers())
export const getSupplierController       = handle((req: Request) => getSupplierById(id(req)))
export const putSupplierController       = handle((req: Request) => updateSupplier(id(req), req.body))
export const deleteSupplierController    = handle((req: Request) => deleteSupplier(id(req)))

export const getAllInvoicesController    = handle(() => getAllInvoices())
export const getInvoiceController        = handle((req: Request) => getInvoiceById(id(req)))
export const getInvoiceItemsController   = handle((req: Request) => getInvoiceItems(id(req)))
export const deleteInvoiceController     = handle((req: Request) => deleteInvoice(id(req)))

export const getStockMovementsController = handle((req: Request) => getStockMovements(req.query.ingredient_id as string | undefined))
export const getStockAlertsController    = handle(() => getStockAlerts())
export const markAlertAsReadController   = handle((req: Request) => markAlertAsRead(id(req)))
export const getDashboardController      = handle(() => getDashboardData())