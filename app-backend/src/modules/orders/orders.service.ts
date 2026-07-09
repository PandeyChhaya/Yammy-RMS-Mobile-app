import prisma from '../../db.js';

const serializeOrder = (order: any) => ({
    ...order,
    total_amount: order.total_amount != null ? Number(order.total_amount) : order.total_amount,
    discount:     order.discount     != null ? Number(order.discount)     : order.discount,
    order_items: order.order_items?.map((item: any) => ({
        ...item,
        unit_price: item.unit_price != null ? Number(item.unit_price) : item.unit_price,
        subtotal:   item.subtotal   != null ? Number(item.subtotal)   : item.subtotal,
    })),
});

export const postOrder = async (body: any) => {
    const { order_type, special_notes, discount, table_id, user_id, items } = body;

    if (!Array.isArray(items) || items.length === 0) {
        throw new Error('Order must include at least one item');
    }

    const table = await prisma.tables.findUnique({ where: { table_id } });
    if (!table) throw new Error('Table does not exist');

    // Never trust client-sent prices — look them up server-side.
    const menuItemIds = items.map((i: any) => i.menu_item_id);
    const menuItems = await prisma.menu_items.findMany({
        where: { menu_items_id: { in: menuItemIds } },
    });
    const priceMap = new Map(menuItems.map((m) => [m.menu_items_id, m]));

    let subtotal = 0;
    const orderItemsData = items.map((item: any) => {
        const menuItem = priceMap.get(item.menu_item_id);
        if (!menuItem) throw new Error(`Menu item ${item.menu_item_id} does not exist`);
        if (!menuItem.is_available) throw new Error(`${menuItem.menu_items_name} is currently unavailable`);

        const unit_price = Number(menuItem.price);
        const quantity = Number(item.quantity) || 1;
        const line_subtotal = unit_price * quantity;
        subtotal += line_subtotal;

        return {
            menu_item_id: item.menu_item_id,
            quantity,
            unit_price,
            subtotal: line_subtotal,
            special_request: item.special_request ?? null,
        };
    });

    const discountAmount = Number(discount) || 0;
    const tax = subtotal * 0.13;
    const total_amount = subtotal - discountAmount + tax;

    const postNewOrder = await prisma.orders.create({
        data: {
            order_type,
            special_notes,
            discount: discountAmount,
            subtotal,
            tax,
            total_amount,
            table_id,
            user_id,
            restaurant_id: table.restaurant_id,
            order_items: { create: orderItemsData },
        },
        include: { order_items: true },
    });

    return {
        message: "New Order created!!",
        order_id: postNewOrder.order_id,
        total_amount: Number(postNewOrder.total_amount),
    };
};
export const getOrder = async (body: any) => {
    const { order_id } = body;

    const orderExists = await prisma.orders.findUnique({
        where: { order_id },
        include: { order_items: true },
    });
    if (!orderExists) throw new Error("Order doesnt exist!!");
    return serializeOrder(orderExists);
};

export const getAllOrder = async (restaurant_id?: number) => {
    const orders = await prisma.orders.findMany({
        where: {
            ...(restaurant_id && { restaurant_id }),
        },
        include: { order_items: true },
        orderBy: { created_at: 'desc' },
    });
    return orders.map(serializeOrder);
};

export const updateOrderStatus = async (body: any) => {
    const { order_id, order_status } = body;
    const orderExists = await prisma.orders.findUnique({ where: { order_id } });
    if (!orderExists) throw new Error('Order does not exist');
    const updated = await prisma.orders.update({
        where: { order_id },
        data: { order_status, updated_at: new Date() },
    });
    return { message: 'Status updated!', order_id: updated.order_id, order_status: updated.order_status };
};

export const putOrder = async (body: any) => {
    const { order_id, order_type, special_notes, discount } = body;

    const orderExists = await prisma.orders.findUnique({ where: { order_id } });
    if (!orderExists) throw new Error("Order doesnt exist!!");

    const updatedOrder = await prisma.orders.update({
        where: { order_id },
        data: { order_type, special_notes, discount },
    });
    return { message: "Order updated successfully!!", order_id: updatedOrder.order_id };
};

export const deleteOrder = async (body: any) => {
    const { order_id } = body;

    const orderExists = await prisma.orders.findUnique({ where: { order_id } });
    if (!orderExists) throw new Error("Order doesnt exist!!");

    await prisma.orders.delete({ where: { order_id } });
    return { message: "Order deleted successfully!", order_id };
};