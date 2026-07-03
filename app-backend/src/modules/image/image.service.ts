import { v2 as cloudinary } from 'cloudinary';
import type { UnsplashPhotoResult } from './image.types.js';

const UNSPLASH_API_URL = 'https://api.unsplash.com/search/photos';

function configureCloudinary() {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
    });
}

export const searchUnsplash = async (query: string, page = 1): Promise<UnsplashPhotoResult[]> => {
    const key = process.env.UNSPLASH_ACCESS_KEY;
    if (!key) throw new Error('Unsplash is not configured on the server (missing UNSPLASH_ACCESS_KEY)');

    const url = `${UNSPLASH_API_URL}?query=${encodeURIComponent(query)}&page=${page}&per_page=20&orientation=squarish`;

    const response = await fetch(url, {
        headers: { Authorization: `Client-ID ${key}` },
    });

    if (!response.ok) throw new Error(`Unsplash search failed (${response.status})`);

    const data = await response.json();

    return (data.results ?? []).map((photo: any) => ({
        id: photo.id,
        thumb_url: photo.urls.small,
        full_url: photo.urls.regular,
        description: photo.alt_description ?? photo.description ?? null,
        photographer: photo.user?.name ?? 'Unknown',
        photographer_url: photo.user?.links?.html ?? '',
    }));
};

export const uploadImageFromUrl = async (imageUrl: string, folder = 'yammy/categories'): Promise<string> => {
    configureCloudinary();
    const result = await cloudinary.uploader.upload(imageUrl, { folder });
    return result.secure_url;
};

export const uploadImageFromBuffer = async (buffer: Buffer, folder = 'yammy/categories'): Promise<string> => {
    configureCloudinary();
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream({ folder }, (error, result) => {
            if (error || !result) {
                reject(error ?? new Error('Cloudinary upload failed'));
                return;
            }
            resolve(result.secure_url);
        });
        stream.end(buffer);
    });
};