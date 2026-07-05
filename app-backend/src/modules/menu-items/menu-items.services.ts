import prisma from '../../db.js';

export const postMenuItems = async (body: any, restaurant_id: number) => {
    const {
        menu_items_name,
        slug,
        price,
        cost_price,
        menu_items_category_id,
        menu_items_description,
        image_url,
        is_available,
        prep_time,
        calories,
        display_order,
    } = body;

    const existing = await prisma.menu_items.findFirst({ where: { slug, restaurant_id } });
    if (existing) throw new Error('Menu Item already exists!!');

    const created = await prisma.menu_items.create({
        data: {
            menu_items_name,
            slug,
            price,
            cost_price,
            menu_items_category_id,
            menu_items_description,
            image_url,
            is_available: is_available ?? true,
            prep_time,
            calories,
            display_order,
            restaurant_id,
        },
    });

    return { message: 'Menu Item Created Successfully', menu_items_id: created.menu_items_id };
};

export const getMenuItems = async (body: any) => {
    const { menu_items_id } = body;

    const item = await prisma.menu_items.findUnique({ where: { menu_items_id } });
    if (!item) throw new Error('Menu Item doesnt exist!!');

    return item;
};

// customer/kiosk app calls this with ?restaurant_id=5 to scope the menu
export const getAllMenuItems = async (restaurant_id?: number) => {
    const items = await prisma.menu_items.findMany({
        where: restaurant_id ? { restaurant_id } : undefined,
        orderBy: { display_order: 'asc' },
        include: { categories: true },
    });
    return items;
};

export const putMenuItems = async (body: any) => {
    const {
        menu_items_id,
        menu_items_name,
        slug,
        price,
        cost_price,
        menu_items_category_id,
        menu_items_description,
        image_url,
        is_available,
        prep_time,
        calories,
        display_order,
    } = body;

    const existing = await prisma.menu_items.findUnique({ where: { menu_items_id } });
    if (!existing) throw new Error('Menu Item doesnt exist!!');

    const updated = await prisma.menu_items.update({
        where: { menu_items_id },
        data: {
            menu_items_name,
            slug,
            price,
            cost_price,
            menu_items_category_id,
            menu_items_description,
            image_url,
            is_available,
            prep_time,
            calories,
            display_order,
        },
    });

    return { message: 'Menu Item Updated Successfully!!', menu_items_id: updated.menu_items_id };
};

export const deleteMenuItem = async (body: any) => {
    const { menu_items_id } = body;

    const existing = await prisma.menu_items.findUnique({ where: { menu_items_id } });
    if (!existing) throw new Error('Menu Item doesnt exist!!');

    await prisma.menu_items.delete({ where: { menu_items_id } });

    return { message: 'Menu Item Deleted Successfully!!', menu_items_id };
};