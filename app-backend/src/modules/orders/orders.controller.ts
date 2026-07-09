import type { Request, Response } from 'express';
import { deleteOrder, getAllOrder, getOrder, postOrder, putOrder, updateOrderStatus } from './orders.service.js';

export const postOrderController = async (req: Request, res: Response) => {
    try {
        const user_id = req.user?.user_id;
        if (!user_id) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }
        const response = await postOrder({ ...req.body, user_id });
        res.status(201).json(response);
    } catch (error) {
        res.status(400).json({ message: error instanceof Error ? error.message : error });
    }
};

export const getOrderController = async (req: Request, res: Response) => {
    try {
        const response = await getOrder({ order_id: parseInt(String(req.params.id)) });
        res.status(200).json(response);
    } catch (error) {
        res.status(400).json({ message: error });
    }
};

export const getAllOrderController = async (req: Request, res: Response) => {
    try {
        const restaurant_id = req.user?.restaurant_id
            ?? (req.query.restaurant_id ? parseInt(String(req.query.restaurant_id)) : undefined);
        const orders = await getAllOrder(restaurant_id);
        const mapped = orders.map((o: any) => ({
            ...o,
            items: o.order_items,
        }));
        res.status(200).json(mapped);
    } catch (error) {
        res.status(400).json({ message: error });
    }
};

export const putOrderController = async (req: Request, res: Response) => {
    try {
        const response = await putOrder({ ...req.body, order_id: parseInt(String(req.params.id)) });
        res.status(200).json(response);
    } catch (error) {
        res.status(400).json({ message: error });
    }
};

export const updateOrderStatusController = async (req: Request, res: Response) => {
    try {
        const response = await updateOrderStatus({
            order_id:     parseInt(String(req.params.id)),
            order_status: req.body.order_status,
        });
        res.status(200).json(response);
    } catch (error) {
        res.status(400).json({ message: error });
    }
};

export const deleteOrderController = async (req: Request, res: Response) => {
    try {
        const response = await deleteOrder({ order_id: parseInt(String(req.params.id)) });
        res.status(200).json(response);
    } catch (error) {
        res.status(400).json({ message: error });
    }
};