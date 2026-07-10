import type { Request, Response } from 'express';
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
    getInvoiceById,
    getInvoiceItems,
    getStockAlerts,
    getStockMovements,
    getSupplierById,
    markAlertAsRead,
    updateIngredient,
    updateSupplier,
} from './inventory.service.js';

// ==================== INGREDIENTS ====================

export const postIngredientController = async (req: Request, res: Response) => {
    try {

        console.log('req.user:', req.user)
    const restaurant_id = req.user?.restaurant_id
    console.log('restaurant_id:', restaurant_id)

        if (!restaurant_id) {
            return res.status(400).json({ message: 'No restaurant linked to this account' });
        }

        const response = await createIngredient(req.body, restaurant_id);
        res.status(201).json(response);
    } catch (error) {
        res.status(400).json({ message: error });
    }
};

export const getAllIngredientsController = async (req: Request, res: Response) => {
    try {
        console.log('req.user:', req.user)
        const restaurant_id =
            req.user?.restaurant_id ??
            (req.query.restaurant_id
                ? parseInt(String(req.query.restaurant_id))
                : undefined);
        console.log('filtering by restaurant_id:', restaurant_id)
        const response = await getAllIngredients(restaurant_id);
        res.status(200).json(response);
    } catch (error) {
        res.status(400).json({ message: (error as Error).message });
    }
};

export const getIngredientController = async (req: Request, res: Response) => {
    try {
        const response = await getIngredientById(String(req.params.id));
        res.status(200).json(response);
    } catch (error) {
        res.status(400).json({ message: error });
    }
};

export const putIngredientController = async (req: Request, res: Response) => {
    try {
        const response = await updateIngredient(
            String(req.params.id),
            req.body
        );

        res.status(200).json(response);
    } catch (error) {
        res.status(400).json({ message: error });
    }
};

export const deleteIngredientController = async (req: Request, res: Response) => {
    try {
        const response = await deleteIngredient(String(req.params.id));
        res.status(200).json(response);
    } catch (error) {
        res.status(400).json({ message: error });
    }
};

// ==================== SUPPLIERS ====================

export const postSupplierController = async (req: Request, res: Response) => {
    try {
        const restaurant_id = req.user?.restaurant_id;

        if (!restaurant_id) {
            return res.status(400).json({ message: 'No restaurant linked to this account' });
        }

        const response = await createSupplier(req.body, restaurant_id);
        res.status(201).json(response);
    } catch (error) {
        res.status(400).json({ message: error });
    }
};

export const getAllSuppliersController = async (req: Request, res: Response) => {
    try {
        const restaurant_id =
            req.user?.restaurant_id ??
            (req.query.restaurant_id
                ? parseInt(String(req.query.restaurant_id))
                : undefined);

        const response = await getAllSuppliers(restaurant_id);
        res.status(200).json(response);
    } catch (error) {
        res.status(400).json({ message: error });
    }
};

export const getSupplierController = async (req: Request, res: Response) => {
    try {
        const response = await getSupplierById(String(req.params.id));
        res.status(200).json(response);
    } catch (error) {
        res.status(400).json({ message: error });
    }
};

export const putSupplierController = async (req: Request, res: Response) => {
    try {
        const response = await updateSupplier(
            String(req.params.id),
            req.body
        );

        res.status(200).json(response);
    } catch (error) {
        res.status(400).json({ message: error });
    }
};

export const deleteSupplierController = async (req: Request, res: Response) => {
    try {
        const response = await deleteSupplier(String(req.params.id));
        res.status(200).json(response);
    } catch (error) {
        res.status(400).json({ message: error });
    }
};

// ==================== INVOICES ====================

export const getAllInvoicesController = async (req: Request, res: Response) => {
    try {
        const restaurant_id =
            req.user?.restaurant_id ??
            (req.query.restaurant_id
                ? parseInt(String(req.query.restaurant_id))
                : undefined);

        const response = await getAllInvoices(restaurant_id);
        res.status(200).json(response);
    } catch (error) {
        res.status(400).json({ message: error });
    }
};

export const getInvoiceController = async (req: Request, res: Response) => {
    try {
        const response = await getInvoiceById(String(req.params.id));
        res.status(200).json(response);
    } catch (error) {
        res.status(400).json({ message: error });
    }
};

export const getInvoiceItemsController = async (req: Request, res: Response) => {
    try {
        const response = await getInvoiceItems(String(req.params.id));
        res.status(200).json(response);
    } catch (error) {
        res.status(400).json({ message: error });
    }
};

export const deleteInvoiceController = async (req: Request, res: Response) => {
    try {
        const response = await deleteInvoice(String(req.params.id));
        res.status(200).json(response);
    } catch (error) {
        res.status(400).json({ message: error });
    }
};

// ==================== STOCK ====================

export const getStockMovementsController = async (req: Request, res: Response) => {
    try {
        const restaurant_id =
            req.user?.restaurant_id ??
            (req.query.restaurant_id
                ? parseInt(String(req.query.restaurant_id))
                : undefined);

        const response = await getStockMovements(
            req.query.ingredient_id as string | undefined,
            restaurant_id
        );

        res.status(200).json(response);
    } catch (error) {
        res.status(400).json({ message: error });
    }
};

export const getStockAlertsController = async (req: Request, res: Response) => {
    try {
        const restaurant_id =
            req.user?.restaurant_id ??
            (req.query.restaurant_id
                ? parseInt(String(req.query.restaurant_id))
                : undefined);

        const response = await getStockAlerts(restaurant_id);
        res.status(200).json(response);
    } catch (error) {
        res.status(400).json({ message: error });
    }
};

export const markAlertAsReadController = async (req: Request, res: Response) => {
    try {
        const response = await markAlertAsRead(String(req.params.id));
        res.status(200).json(response);
    } catch (error) {
        res.status(400).json({ message: error });
    }
};

// ==================== DASHBOARD ====================

export const getDashboardController = async (req: Request, res: Response) => {
    try {
        const restaurant_id =
            req.user?.restaurant_id ??
            (req.query.restaurant_id
                ? parseInt(String(req.query.restaurant_id))
                : undefined);

        if (!restaurant_id) {
            return res.status(400).json({ message: 'No restaurant linked to this account' });
        }

        const response = await getDashboardData(restaurant_id);
        res.status(200).json(response);
    } catch (error) {
        res.status(400).json({ message: error });
    }
};