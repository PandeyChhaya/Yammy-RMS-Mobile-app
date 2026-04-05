import type { Request, Response } from 'express';
import {
    deleteTransaction,
    getAllTransactions,
    getLoyaltyBalance,
    postEarnPoints,
    postRedeemPoints,
} from './loyalty.service.js';


export const postEarnPointsController = async (req: Request, res: Response) => {
    try {
        const response = await postEarnPoints(req.body);
        res.status(201).json(response);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};


export const postRedeemPointsController = async (req: Request, res: Response) => {
    try {
        const response = await postRedeemPoints(req.body);
        res.status(201).json(response);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};


export const getLoyaltyBalanceController = async (req: Request, res: Response) => {
    try {
        const customer_id = parseInt(String(req.params.id));
        const response = await getLoyaltyBalance({ customer_id });
        res.status(200).json(response);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};


export const getAllTransactionsController = async (req: Request, res: Response) => {
    try {
        const customer_id = parseInt(String(req.params.id));
        const response = await getAllTransactions({ customer_id });
        res.status(200).json(response);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};


export const deleteTransactionController = async (req: Request, res: Response) => {
    try {
        const transaction_id = parseInt(String(req.params.id));
        const response = await deleteTransaction({ transaction_id });
        res.status(200).json(response);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};