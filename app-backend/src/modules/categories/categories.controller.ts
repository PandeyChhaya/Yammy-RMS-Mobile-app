import type { Request, Response } from 'express';
import { deleteCategory, getAllCategory, getCategory, postCategory, putCategory } from './categories.service.js';

export const postCategoryController = async (req: Request, res: Response) => {
    try {
        const response = await postCategory(req.body);
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

export const getAllCategoryController = async (req: Request, res: Response) => {
    try {
        const response = await getAllCategory();
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