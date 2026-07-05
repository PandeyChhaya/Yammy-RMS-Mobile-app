import prisma from '../../db.js';

export const postTable = async (body: any) => {
    const { table_number, floor, capacity, restaurant_id } = body;

    const tableExists = await prisma.tables.findFirst({
        where: { table_number, restaurant_id },
    });

    if (tableExists) throw new Error('Table already exists');

    const newTable = await prisma.tables.create({
        data: {
            table_number,
            floor,
            capacity,
            restaurant_id,
        },
    });

    return { message: 'Table created successfully!', table_id: newTable.table_id };
};

export const getTable = async (body: any) => {
    const { table_id } = body;

    const table = await prisma.tables.findUnique({
        where: { table_id },
    });

    if (!table) throw new Error('Table does not exist');
    return table;
};

export const getAllTables = async (restaurant_id?: number) => {
    const tables = await prisma.tables.findMany({
        where: {
            is_active: true,
            ...(restaurant_id && { restaurant_id }),
        },
        orderBy: { table_number: 'asc' },
    });
    return tables;
};

export const putTable = async (body: any) => {
    const { table_id, table_number, floor, capacity, table_status } = body;

    const tableExists = await prisma.tables.findUnique({
        where: { table_id },
    });

    if (!tableExists) throw new Error('Table does not exist');

    const updatedTable = await prisma.tables.update({
        where: { table_id },
        data: {
            ...(table_number  && { table_number }),
            ...(floor         && { floor }),
            ...(capacity      && { capacity }),
            ...(table_status  && { table_status }),
            updated_at: new Date(),
        },
    });

    return { message: 'Table updated successfully!', table_id: updatedTable.table_id };
};

export const deleteTable = async (body: any) => {
    const { table_id } = body;

    const tableExists = await prisma.tables.findUnique({
        where: { table_id },
    });

    if (!tableExists) throw new Error('Table does not exist');

    await prisma.tables.update({
        where: { table_id },
        data: { is_active: false },
    });

    return { message: 'Table deleted successfully!', table_id };
};