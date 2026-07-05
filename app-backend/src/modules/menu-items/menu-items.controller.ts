import type { Request, Response } from 'express';
import { deleteMenuItem, getAllMenuItems, getMenuItems, postMenuItems, putMenuItems } from './menu-items.services.js';

export const postMenuItemsController = async (req: Request, res: Response) => {
    try {
        const restaurant_id = req.user?.restaurant_id;
        if (!restaurant_id) {
            return res.status(400).json({ message: 'No restaurant linked to this account' });
        }
        const response = await postMenuItems(req.body, restaurant_id);
        res.status(201).json(response);
    } catch (error) {
        res.status(400).json({ message: error });
    }
};

export const getAllMenuItemsController = async (req: Request, res: Response) => {
    try {
        const restaurant_id = req.query.restaurant_id ? parseInt(String(req.query.restaurant_id)) : undefined;
        const response = await getAllMenuItems(restaurant_id);
        res.status(200).json(response);
    } catch (error) {
        res.status(400).json({ message: error });
    }
};

export const getMenuItemsController = async (req: Request, res: Response) => {
    try {
        const response = await getMenuItems({ menu_items_id: parseInt(String(req.params.id)) });
        res.status(200).json(response);
    } catch (error) {
        res.status(400).json({ message: error });
    }
};

export const putMenuItemsController = async (req: Request, res: Response) => {
    try {
        const response = await putMenuItems({
            ...req.body,
            menu_items_id: parseInt(String(req.params.id)),
        });
        res.status(200).json(response);
    } catch (error) {
        res.status(400).json({ message: error });
    }
};

export const deleteMenuItemsController = async (req: Request, res: Response) => {
    try {
        const response = await deleteMenuItem({ menu_items_id: parseInt(String(req.params.id)) });
        res.status(200).json(response);
    } catch (error) {
        res.status(400).json({ message: error });
    }
};