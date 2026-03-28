import type { Request, Response } from 'express';
import { deletePayment, getAllPayments, getPayment, postPayment, putPayment } from './payments.service.js';

export const postPaymentController = async (req: Request, res: Response) => {
    try {
        const response = await postPayment(req.body);
        res.status(201).json(response);
    } catch (error) {
        res.status(400).json({ message: error });
    }
};

export const getPaymentController = async (req: Request, res: Response) => {
    try {
        const response = await getPayment({ payment_id: parseInt(String(req.params.id)) });
        res.status(200).json(response);
    } catch (error) {
        res.status(400).json({ message: error });
    }
};

export const getAllPaymentsController = async (req: Request, res: Response) => {
    try {
        const response = await getAllPayments();
        res.status(200).json(response);
    } catch (error) {
        res.status(400).json({ message: error });
    }
};

export const putPaymentController = async (req: Request, res: Response) => {
    try {
        const response = await putPayment({ ...req.body, payment_id: parseInt(String(req.params.id)) });
        res.status(200).json(response);
    } catch (error) {
        res.status(400).json({ message: error });
    }
};

export const deletePaymentController = async (req: Request, res: Response) => {
    try {
        const response = await deletePayment({ payment_id: parseInt(String(req.params.id)) });
        res.status(200).json(response);
    } catch (error) {
        res.status(400).json({ message: error });
    }
};