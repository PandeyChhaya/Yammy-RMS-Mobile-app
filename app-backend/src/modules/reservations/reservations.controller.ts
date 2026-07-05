import type { Request, Response } from 'express';
import {
    deleteReservation,
    getAllReservations,
    getReservation,
    getReservationsByDate,
    postReservation,
    putReservation,
    updateReservationStatus,
} from './reservations.service.js';

export const postReservationController = async (req: Request, res: Response) => {
    try {
        const response = await postReservation(req.body);
        res.status(201).json(response);
    } catch (error) {
        res.status(400).json({ message: (error as Error).message });
    }
};

export const getReservationController = async (req: Request, res: Response) => {
    try {
        const response = await getReservation({ reservation_id: parseInt(String(req.params.id)) });
        res.status(200).json(response);
    } catch (error) {
        res.status(400).json({ message: (error as Error).message });
    }
};

export const getReservationsByDateController = async (req: Request, res: Response) => {
    try {
        const { date } = req.query;
        if (!date) {
            const all = await getAllReservations();
            return res.status(200).json(all);
        }
        const response = await getReservationsByDate(String(date));
        res.status(200).json(response);
    } catch (error) {
        res.status(400).json({ message: (error as Error).message });
    }
};
export const putReservationController = async (req: Request, res: Response) => {
    try {
        const response = await putReservation({ ...req.body, reservation_id: parseInt(String(req.params.id)) });
        res.status(200).json(response);
    } catch (error) {
res.status(400).json({ message: (error as Error).message });    }
};

export const updateReservationStatusController = async (req: Request, res: Response) => {
    try {
        const response = await updateReservationStatus({
            reservation_id: parseInt(String(req.params.id)),
            status:         req.body.status,
        });
        res.status(200).json(response);
    } catch (error) {
res.status(400).json({ message: (error as Error).message });    }
};

export const deleteReservationController = async (req: Request, res: Response) => {
    try {
        const response = await deleteReservation({ reservation_id: parseInt(String(req.params.id)) });
        res.status(200).json(response);
    } catch (error) {
res.status(400).json({ message: (error as Error).message });    }
};