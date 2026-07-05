import type { Request, Response } from 'express';
import { deleteCategory, getAllCategory, getCategory, postCategory, putCategory } from './categories.service.js';

export const postCategoryController = async (req: Request, res: Response) => {
    try {
        const restaurant_id = req.user?.restaurant_id;
        if (!restaurant_id) {
            return res.status(400).json({ message: 'No restaurant linked to this account' });
        }
        const response = await postCategory(req.body, restaurant_id);
        res.status(201).json(response);
    } catch (error) {
        res.status(400).json({ message: error });
    }
};

export const getCategoryController = async (req: Request, res: Response) => {
    try {
        const response = await getCategory({ category_id: parseInt(String(req.params.id)) });
        res.status(200).json(response);
    } catch (error) {
        res.status(400).json({ message: error });
    }
};

// customer app calls this with ?restaurant_id=5 to get that restaurant's categories only
export const getAllCategoryController = async (req: Request, res: Response) => {
    try {
        const restaurant_id = req.query.restaurant_id ? parseInt(String(req.query.restaurant_id)) : undefined;
        const response = await getAllCategory(restaurant_id);
        res.status(200).json(response);
    } catch (error) {
        res.status(400).json({ message: error });
    }
};

export const putCategoryController = async (req: Request, res: Response) => {
    try {
        const response = await putCategory({ ...req.body, category_id: parseInt(String(req.params.id)) });
        res.status(200).json(response);
    } catch (error) {
        res.status(400).json({ message: error });
    }
};

export const deleteCategoryController = async (req: Request, res: Response) => {
    try {
        const response = await deleteCategory({ category_id: parseInt(String(req.params.id)) });
        res.status(200).json(response);
    } catch (error) {
        res.status(400).json({ message: error });
    }
};