import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import {
  deleteMini,
  getAllMinisForSuperAdmin,
  getApprovedMinis,
  getMyMinis,
  incrementViewCount,
  updateMiniStatus,
  uploadMiniVideo,
} from './minis-service.js';

const getUserFromToken = (req: Request): { user_id: number; user_role: string } => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No token provided');
  }
  const token = authHeader.split(' ')[1];
  const JWT_SECRET = process.env.JWT_SECRET as string;
  const decoded = jwt.verify(token, JWT_SECRET) as any;
  return { user_id: decoded.user_id, user_role: decoded.user_role };
};

export const uploadMiniController = async (req: Request, res: Response) => {
  try {
    if (!req.file) { res.status(400).json({ message: 'No video file provided' }); return; }
    const { user_id } = getUserFromToken(req);
    const response = await uploadMiniVideo({ ...req.body, user_id }, req.file.path);
    res.status(201).json(response);
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Upload failed' });
  }
};

export const getApprovedMinisController = async (req: Request, res: Response) => {
  try {
    const response = await getApprovedMinis();
    res.status(200).json(response);
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Failed to load minis' });
  }
};

export const getMyMinisController = async (req: Request, res: Response) => {
  try {
    const { user_id } = getUserFromToken(req);
    const response = await getMyMinis(user_id);
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
    const { user_id, user_role } = getUserFromToken(req);
    const response = await deleteMini(mini_id, user_id, user_role);
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