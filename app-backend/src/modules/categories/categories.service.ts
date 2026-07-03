import prisma from '../../db.js';

export const postCategory = async (body: any) => {
    const { category_name, category_description, slug, image_url } = body;

    const categoryExists = await prisma.categories.findUnique({
        where: { slug },
    });

    if (categoryExists) throw new Error('Category already exists');

    const created = await prisma.categories.create({
        data: {
            category_name,
            category_description,
            slug,
            image_url,
        },
    });

    return { message: 'New Category created!!', category_id: created.category_id };
};

export const getCategory = async (body: any) => {
    const { category_id } = body;

    const categoryExists = await prisma.categories.findUnique({
        where: { category_id },
    });

    if (!categoryExists) throw new Error('Categories doesnt exist!!');
    return categoryExists;
};

export const getAllCategory = async () => {
    const categories = await prisma.categories.findMany();
    return categories;
};

export const putCategory = async (body: any) => {
    const { category_id, category_name, category_description, slug, image_url, is_active } = body;

    const categoryExists = await prisma.categories.findUnique({
        where: { category_id },
    });
    if (!categoryExists) throw new Error('Category doesnt exist!!');

    const updated = await prisma.categories.update({
        where: {
            category_id,
        },
        data: {
            category_name,
            category_description,
            slug,
            image_url,
            is_active,
        },
    });

    return { message: 'Category updated successfully!!', category_id: updated.category_id };
};

export const deleteCategory = async (body: any) => {
    const { category_id } = body;

    const categoryExists = await prisma.categories.findUnique({
        where: { category_id },
    });

    if (!categoryExists) throw new Error('Category doesnt exist!!');

    await prisma.categories.delete({
        where: { category_id },
    });

    return { message: 'Category deleted successfully!', category_id };
};