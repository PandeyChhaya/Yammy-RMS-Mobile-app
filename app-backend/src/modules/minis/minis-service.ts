import { v2 as cloudinary } from 'cloudinary';
import prisma from '../../db.js';
import type { CreateMini, UpdateMiniStatus } from './minis-types.js';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// multer-storage-cloudinary already uploads the video during the
// multipart request — req.file.path (passed in here as filePath) is
// already the Cloudinary secure_url, so re-uploading it would upload
// the same video twice. We just use that URL directly.
export const uploadMiniVideo = async (body: CreateMini, filePath: string) => {
  const { user_id, restaurant_id, title, description } = body;

  const thumbnail_url = filePath.replace('/upload/', '/upload/so_0/').replace(/\.\w+$/, '.jpg');

  const mini = await prisma.minis.create({
    data: {
      user_id,
      restaurant_id,
      title,
      description,
      video_url: filePath,
      thumbnail_url,
      status: 'pending',
    },
  });

  return { message: 'Mini uploaded successfully, pending approval', mini_id: mini.mini_id };
};

export const getApprovedMinis = async (restaurant_id?: number) => {
  return await prisma.minis.findMany({
    where: {
      status: 'approved',
      ...(restaurant_id && { restaurant_id }),
    },
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

  // roles elsewhere in the app are stored like 'Super Admin' (capitalized,
  // with a space) — comparing against a raw 'superadmin' literal would
  // always fail and lock superadmin out of deleting others' minis
  const normalizedRole = role.replace(/\s+/g, '').toLowerCase();
  if (normalizedRole !== 'superadmin' && exists.user_id !== user_id) {
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