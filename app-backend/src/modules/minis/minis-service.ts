import { v2 as cloudinary } from 'cloudinary';
import prisma from '../../db.js';
import type { CreateMini, UpdateMiniStatus } from './minis-types.js';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadMiniVideo = async (body: CreateMini, filePath: string) => {
  const { user_id, title, description } = body;

  const upload = await cloudinary.uploader.upload(filePath, {
    resource_type: 'video',
    folder: 'yammy/minis',
  });

  const mini = await prisma.minis.create({
    data: {
      user_id,
      title,
      description,
      video_url: upload.secure_url,
      thumbnail_url: upload.secure_url.replace('/upload/', '/upload/so_0/').replace(/\.\w+$/, '.jpg'),
      status: 'pending',
    },
  });

  return { message: 'Mini uploaded successfully, pending approval', mini_id: mini.mini_id };
};

export const getApprovedMinis = async () => {
  return await prisma.minis.findMany({
    where: { status: 'approved' },
    include: { users: { select: { user_id: true, user_name: true } } },
    orderBy: { created_at: 'desc' },
  });
};

export const getMyMinis = async (user_id: number) => {
  return await prisma.minis.findMany({
    where: { user_id },
    orderBy: { created_at: 'desc' },
  });
};

export const getAllMinisForSuperAdmin = async () => {
  return await prisma.minis.findMany({
    include: { users: { select: { user_id: true, user_name: true } } },
    orderBy: { created_at: 'desc' },
  });
};

export const updateMiniStatus = async (body: UpdateMiniStatus) => {
  const { mini_id, status, rejection_reason } = body;

  const exists = await prisma.minis.findUnique({ where: { mini_id } });
  if (!exists) throw new Error('Mini not found');

  const updated = await prisma.minis.update({
    where: { mini_id },
    data: { status, rejection_reason: rejection_reason || null, updated_at: new Date() },
  });

  return { message: `Mini ${status} successfully`, mini_id: updated.mini_id };
};

export const deleteMini = async (mini_id: number, user_id: number, role: string) => {
  const exists = await prisma.minis.findUnique({ where: { mini_id } });
  if (!exists) throw new Error('Mini not found');

  if (role !== 'superadmin' && exists.user_id !== user_id) {
    throw new Error('Unauthorized');
  }

  const urlParts = exists.video_url.split('/');
  const lastPart = urlParts[urlParts.length - 1] ?? 'unknown';
const publicId = 'yammy/minis/' + lastPart.split('.')[0];
  await cloudinary.uploader.destroy(publicId, { resource_type: 'video' });

  await prisma.minis.delete({ where: { mini_id } });
  return { message: 'Mini deleted successfully', mini_id };
};

export const incrementViewCount = async (mini_id: number) => {
  return await prisma.minis.update({
    where: { mini_id },
    data: { view_count: { increment: 1 } },
  });
};