import type { Request, Response } from 'express';
import { deleteInventory, getAllInventory, getInventory, postInventory, putInventory } from './inventory.service.js';

export const postInventoryController = async (req: Request, res: Response) => {
    try {
        const response = await postInventory(req.body);
        res.status(201).json(response);
    } catch (error) {
        res.status(400).json({ message: error });
    }
};

export const getInventoryController = async (req: Request, res: Response) => {
    try {
        const response = await getInventory({ inventory_id: parseInt(String(req.params.id)) });
        res.status(200).json(response);
    } catch (error) {
        res.status(400).json({ message: error });
    }
};

export const getAllInventoryController = async (req: Request, res: Response) => {
    try {
        const response = await getAllInventory();
        res.status(200).json(response);
    } catch (error) {
        res.status(400).json({ message: error });
    }
};

export const putInventoryController = async (req: Request, res: Response) => {
    try {
        const response = await putInventory({ ...req.body, inventory_id: parseInt(String(req.params.id)) });
        res.status(200).json(response);
    } catch (error) {
        res.status(400).json({ message: error });
    }
};

export const deleteInventoryController = async (req: Request, res: Response) => {
    try {
        const response = await deleteInventory({ inventory_id: parseInt(String(req.params.id)) });
        res.status(200).json(response);
    } catch (error) {
        res.status(400).json({ message: error });
    }
};