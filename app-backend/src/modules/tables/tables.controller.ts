import type { Request, Response } from 'express';
import { deleteTable, getAllTables, getTable, postTable, putTable } from './tables.service.js';

export const postTableController = async (req: Request, res: Response) => {
    try {
        if (!req.user?.restaurant_id) {
            return res.status(400).json({ message: 'No restaurant linked to this account' });
        }
        const response = await postTable({ ...req.body, restaurant_id: req.user.restaurant_id });
        res.status(201).json(response);
    } catch (error) {
        res.status(400).json({ message: error });
    }
};

export const getTableController = async (req: Request, res: Response) => {
    try {
        const response = await getTable({ table_id: parseInt(String(req.params.id)) });
        res.status(200).json(response);
    } catch (error) {
        res.status(400).json({ message: error });
    }
};

export const getAllTablesController = async (req: Request, res: Response) => {
    try {
        const restaurant_id = req.user?.restaurant_id
            ?? (req.query.restaurant_id ? parseInt(String(req.query.restaurant_id)) : undefined);
        const response = await getAllTables(restaurant_id);
        res.status(200).json(response);
    } catch (error) {
        res.status(400).json({ message: error });
    }
};

export const putTableController = async (req: Request, res: Response) => {
    try {
        const response = await putTable({ ...req.body, table_id: parseInt(String(req.params.id)) });
        res.status(200).json(response);
    } catch (error) {
        res.status(400).json({ message: error });
    }
};

export const deleteTableController = async (req: Request, res: Response) => {
    try {
        const response = await deleteTable({ table_id: parseInt(String(req.params.id)) });
        res.status(200).json(response);
    } catch (error) {
        res.status(400).json({ message: error });
    }
};