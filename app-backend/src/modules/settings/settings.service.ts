import prisma from '../../db.js';

export const getSettings = async (restaurant_id: number) => {
    const restaurant = await prisma.restaurants.findUnique({
        where: { restaurant_id },
        select: {
            restaurant_id: true,
            restaurant_name: true,
            phone: true,
            address: true,
            logo_url: true,
            cover_image_url: true,
        },
    });
    if (!restaurant) throw new Error('Restaurant not found');
    return restaurant;
};

export const updateSettings = async (restaurant_id: number, body: any) => {
    const { restaurant_name, phone, address, logo_url, cover_image_url } = body;

    const exists = await prisma.restaurants.findUnique({ where: { restaurant_id } });
    if (!exists) throw new Error('Restaurant not found');

    const updated = await prisma.restaurants.update({
        where: { restaurant_id },
        data: {
            ...(restaurant_name !== undefined && { restaurant_name }),
            ...(phone !== undefined && { phone }),
            ...(address !== undefined && { address }),
            ...(logo_url !== undefined && { logo_url }),
            ...(cover_image_url !== undefined && { cover_image_url }),
            updated_at: new Date(),
        },
    });

    return { message: 'Settings updated successfully!!', restaurant_id: updated.restaurant_id };
};