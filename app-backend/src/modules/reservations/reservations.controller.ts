import type { Request, Response } from 'express';
import {
    deleteReservation,
    getAllReservations,
    getReservation,
    getReservationsByCustomer,
    postReservation,
    putReservation,
} from './reservations.service.js';


export const postReservationController = async (req: Request, res: Response) => {
    try {
        const response = await postReservation(req.body);
        res.status(201).json(response);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};


export const getReservationController = async (req: Request, res: Response) => {
    try {
        const reservation_id = parseInt(String(req.params.id));
        const response = await getReservation({ reservation_id });
        res.status(200).json(response);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};


export const getAllReservationsController = async (req: Request, res: Response) => {
    try {
        const response = await getAllReservations();
        res.status(200).json(response);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};


export const getReservationsByCustomerController = async (req: Request, res: Response) => {
    try {
        const customer_id = parseInt(String(req.params.id));
        const response = await getReservationsByCustomer({ customer_id });
        res.status(200).json(response);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};


export const putReservationController = async (req: Request, res: Response) => {
    try {
        const reservation_id = parseInt(String(req.params.id));
        const response = await putReservation({ reservation_id, ...req.body });
        res.status(200).json(response);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};


export const deleteReservationController = async (req: Request, res: Response) => {
    try {
        const reservation_id = parseInt(String(req.params.id));
        const response = await deleteReservation({ reservation_id });
        res.status(200).json(response);
    } catch (error: any) {
        res.status(400).json({ message: error.messag
         });
    }
};