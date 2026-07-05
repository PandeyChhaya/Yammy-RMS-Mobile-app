import prisma from '../../db.js';

function slugify(name: string): string {
    return name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}

export const postRestaurant = async (body: any) => {
    const { restaurant_name, description, logo_url, cover_image_url, address, phone } = body;

    if (!restaurant_name) throw new Error('restaurant_name is required');

    const baseSlug = slugify(restaurant_name);
    let slug = baseSlug;
    let suffix = 1;

    while (await prisma.restaurants.findUnique({ where: { slug } })) {
        suffix += 1;
        slug = `${baseSlug}-${suffix}`;
    }

    const created = await prisma.restaurants.create({
        data: {
            restaurant_name,
            slug,
            description,
            logo_url,
            cover_image_url,
            address,
            phone,
        },
    });

    return { message: 'Restaurant created!!', restaurant_id: created.restaurant_id, slug: created.slug };
};

export const getRestaurant = async (body: any) => {
    const { restaurant_id } = body;

    const restaurantExists = await prisma.restaurants.findUnique({
        where: { restaurant_id },
    });

    if (!restaurantExists) throw new Error('Restaurant doesnt exist!!');
    return restaurantExists;
};

export const getAllRestaurant = async () => {
    const restaurants = await prisma.restaurants.findMany();
    return restaurants;
};

export const getActiveRestaurants = async () => {
    const restaurants = await prisma.restaurants.findMany({
        where: { is_active: true },
    });
    return restaurants;
};

export const putRestaurant = async (body: any) => {
    const { restaurant_id, restaurant_name, description, logo_url, cover_image_url, address, phone, is_active } = body;

    const restaurantExists = await prisma.restaurants.findUnique({
        where: { restaurant_id },
    });
    if (!restaurantExists) throw new Error('Restaurant doesnt exist!!');

    const updated = await prisma.restaurants.update({
        where: { restaurant_id },
        data: {
            restaurant_name,
            description,
            logo_url,
            cover_image_url,
            address,
            phone,
            is_active,
        },
    });

    return { message: 'Restaurant updated successfully!!', restaurant_id: updated.restaurant_id };
};

export const deleteRestaurant = async (body: any) => {
    const { restaurant_id } = body;

    const restaurantExists = await prisma.restaurants.findUnique({
        where: { restaurant_id },
    });

    if (!restaurantExists) throw new Error('Restaurant doesnt exist!!');

    await prisma.restaurants.delete({
        where: { restaurant_id },
    });

    return { message: 'Restaurant deleted successfully!', restaurant_id };
};