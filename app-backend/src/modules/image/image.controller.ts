import type { Request, Response } from 'express';
import { searchUnsplash, uploadImageFromBuffer, uploadImageFromUrl } from './image.service.js';

export const searchUnsplashController = async (req: Request, res: Response) => {
    try {
        const query = String(req.query.query ?? '');
        const page = req.query.page ? parseInt(String(req.query.page)) : 1;

        if (!query.trim()) {
            res.status(400).json({ message: 'query is required' });
            return;
        }

        const results = await searchUnsplash(query, page);
        res.status(200).json(results);
    } catch (error: any) {
        res.status(400).json({ message: error.message ?? error });
    }
};

export const uploadFromUrlController = async (req: Request, res: Response) => {
    try {
        const { image_url, folder } = req.body;

        if (!image_url) {
            res.status(400).json({ message: 'image_url is required' });
            return;
        }

        const secureUrl = await uploadImageFromUrl(image_url, folder);
        res.status(200).json({ image_url: secureUrl });
    } catch (error: any) {
        res.status(400).json({ message: error.message ?? error });
    }
};

export const uploadFromFileController = async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            res.status(400).json({ message: 'No file uploaded' });
            return;
        }

        const folder = req.body?.folder;
        const secureUrl = await uploadImageFromBuffer(req.file.buffer, folder);
        res.status(200).json({ image_url: secureUrl });
    } catch (error: any) {
        res.status(400).json({ message: error.message ?? error });
    }
};