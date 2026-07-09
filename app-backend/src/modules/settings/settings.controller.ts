import type { Request, Response } from 'express';
import { getSettings, updateSettings } from './settings.service.js';

export const getSettingsController = async (req: Request, res: Response) => {
    try {
        const restaurant_id = req.user?.restaurant_id;
        if (!restaurant_id) return res.status(400).json({ message: 'No restaurant linked to this account' });
        const response = await getSettings(restaurant_id);
        res.status(200).json(response);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const putSettingsController = async (req: Request, res: Response) => {
    try {
        const restaurant_id = req.user?.restaurant_id;
        if (!restaurant_id) return res.status(400).json({ message: 'No restaurant linked to this account' });
        const response = await updateSettings(restaurant_id, req.body);
        res.status(200).json(response);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};