import prisma from '../../db.js';

export const postInventory = async (body: any) => {
    const { item_name, unit, quantity, reorder_level, cost_per_unit, supplier } = body;

    const inventoryExists = await prisma.inventory.findFirst({
        where: { item_name },
    });

    if (inventoryExists) throw new Error('Inventory item already exists');

    const postNewInventory = await prisma.inventory.create({
        data: {
            item_name,
            unit,
            quantity,
            reorder_level,
            cost_per_unit,
            supplier,
        },
    });

    return { message: 'New Inventory item created!!', inventory_id: postNewInventory.inventory_id };
};

export const getInventory = async (body: any) => {
    const { inventory_id } = body;

    const inventoryExists = await prisma.inventory.findUnique({
        where: { inventory_id },
    });

    if (!inventoryExists) throw new Error('Inventory item does not exist!!');

    return inventoryExists;
};

export const getAllInventory = async () => {
    const inventory = await prisma.inventory.findMany();
    return inventory;
};

export const putInventory = async (body: any) => {
    const { inventory_id, item_name, unit, quantity, reorder_level, cost_per_unit, supplier, is_active } = body;

    const inventoryExists = await prisma.inventory.findUnique({
        where: { inventory_id },
    });

    if (!inventoryExists) throw new Error('Inventory item does not exist!!');

    const updatedInventory = await prisma.inventory.update({
        where: { inventory_id },
        data: {
            item_name,
            unit,
            quantity,
            reorder_level,
            cost_per_unit,
            supplier,
            is_active,
        },
    });

    return { message: 'Inventory item updated successfully!!', inventory_id: updatedInventory.inventory_id };
};

export const deleteInventory = async (body: any) => {
    const { inventory_id } = body;

    const inventoryExists = await prisma.inventory.findUnique({
        where: { inventory_id },
    });

    if (!inventoryExists) throw new Error('Inventory item does not exist!!');

    await prisma.inventory.delete({
        where: { inventory_id },
    });

    return { message: 'Inventory item deleted successfully!', inventory_id };
};