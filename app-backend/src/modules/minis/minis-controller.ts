import type { Request, Response } from 'express';
import {
  getAllMinisForSuperAdmin,
  getApprovedMinis,
  getMyMinis,
  incrementViewCount,
  updateMiniStatus,
  uploadMiniVideo,
} from './minis-service.js';

export const uploadMiniController = async (req: Request, res: Response) => {
  try {
    if (!req.file) { res.status(400).json({ message: 'No video file provided' }); return; }
    if (!req.user?.restaurant_id) {
      res.status(400).json({ message: 'No restaurant linked to this account' });
      return;
    }
    const response = await uploadMiniVideo(
      { ...req.body, user_id: req.user.user_id, restaurant_id: req.user.restaurant_id },
      req.file.path
    );
    res.status(201).json(response);
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Upload failed' });
  }
};

export const getApprovedMinisController = async (req: Request, res: Response) => {
  try {
    const restaurant_id = req.query.restaurant_id ? parseInt(String(req.query.restaurant_id)) : undefined;
    const response = await getApprovedMinis(restaurant_id);
    res.status(200).json(response);
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Failed to load minis' });
  }
};

export const getMyMinisController = async (req: Request, res: Response) => {
  try {
    const response = await getMyMinis(req.user!.user_id);
    res.status(200).json(response);
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Failed to load your minis' });
  }
};

export const getAllMinisController = async (req: Request, res: Response) => {
  try {
    const response = await getAllMinisForSuperAdmin();
    res.status(200).json(response);
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Failed to load minis' });
  }
};

export const updateMiniStatusController = async (req: Request, res: Response) => {
  try {
    const mini_id = parseInt(String(req.params.id));
    const response = await updateMiniStatus({ ...req.body, mini_id });
    res.status(200).json(response);
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Failed to update status' });
  }
};

export const deleteMiniController = async (req: Request, res: Response) => {
  try {
    const mini_id = parseInt(String(req.params.id));
    const response = await deleteMini(mini_id, req.user!.user_id, req.user!.user_role);
    res.status(200).json(response);
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Failed to delete mini' });
  }
};

export const incrementViewController = async (req: Request, res: Response) => {
  try {
    const mini_id = parseInt(String(req.params.id));
    await incrementViewCount(mini_id);
    res.status(200).json({ message: 'View counted' });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Failed to count view' });
  }
};