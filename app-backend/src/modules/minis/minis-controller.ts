import type { Request, Response } from 'express';
import {
    deleteMini,
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
    const user_id = (req as any).user.user_id;
    const response = await uploadMiniVideo({ ...req.body, user_id }, req.file.path);
    res.status(201).json(response);
  } catch (error) {
    res.status(400).json({ message: error });
  }
};

export const getApprovedMinisController = async (req: Request, res: Response) => {
  try {
    const response = await getApprovedMinis();
    res.status(200).json(response);
  } catch (error) {
    res.status(400).json({ message: error });
  }
};

export const getMyMinisController = async (req: Request, res: Response) => {
  try {
    const user_id = (req as any).user.user_id;
    const response = await getMyMinis(user_id);
    res.status(200).json(response);
  } catch (error) {
    res.status(400).json({ message: error });
  }
};

export const getAllMinisController = async (req: Request, res: Response) => {
  try {
    const response = await getAllMinisForSuperAdmin();
    res.status(200).json(response);
  } catch (error) {
    res.status(400).json({ message: error });
  }
};

export const updateMiniStatusController = async (req: Request, res: Response) => {
  try {
    const mini_id = parseInt(String(req.params.id));
    const response = await updateMiniStatus({ ...req.body, mini_id });
    res.status(200).json(response);
  } catch (error) {
    res.status(400).json({ message: error });
  }
};

export const deleteMiniController = async (req: Request, res: Response) => {
  try {
    const mini_id = parseInt(String(req.params.id));
    const user_id = (req as any).user.user_id;
    const role = (req as any).user.user_role;
    const response = await deleteMini(mini_id, user_id, role);
    res.status(200).json(response);
  } catch (error) {
    res.status(400).json({ message: error });
  }
};

export const incrementViewController = async (req: Request, res: Response) => {
  try {
    const mini_id = parseInt(String(req.params.id));
    await incrementViewCount(mini_id);
    res.status(200).json({ message: 'View counted' });
  } catch (error) {
    res.status(400).json({ message: error });
  }
};