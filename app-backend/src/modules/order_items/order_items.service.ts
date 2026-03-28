import prisma from '../../db.js';


export const postOrderItems = async(body:any)=>{

    const{menu_item_id, quantity, unit_price, special_request}= body;

    const createOrderItem = await prisma.order_items.create({
        data:{
            menu_item_id, 
            quantity,
            unit_price,
            special_request,
        }
    });
    return {message:"Order Item created successfully!!", order_item_id:createOrderItem.order_id}
};

export const getAllOrderItems= async()=>{
    const orderItems = await prisma.order_items.findMany();
    return orderItems;
};
export const getOrderItems= async(body:any)=>{
    const {order_item_id}= body;

    const checkOrderItemExists= await prisma.tables.findUnique({
        where:{order_item_id},
    })
    if(!checkOrderItemExists) throw new Error ("Order Item doesnt exist!!");

    return checkOrderItemExists;
};
export const putOrderItems= async(body:any)=>{
    const{menu_item_id, quantity, unit_price, special_request}= body;

    const checkMenuItemExists = await prisma.menu_items.findUnique({
        where:{menu_item_id},
    })
    if(!checkMenuItemExists) throw new Error ("Menu Item doesnt exist!!");

    const updatedMenuItem= await prisma.menu_items.update({
        where:{
            menu_item_id,
        },
        data:{
            quantity,
            unit_price, 
            special_request,   
        }
    });
    return {message:("Menu Item Updated Successfully!!"), menu_item_id: updatedMenuItem.menu_item_id};

}
export const deleteMenuItem = async(body:any)=>{
    const {menu_item_id}= body;

    const checkMenuItemExists = await prisma.menu_items.findUnique({
        where:{menu_item_id},
    });
    if(!checkMenuItemExists) throw new Error ("Menu Item doesnt exist!!");

     await prisma.menu_items.delete ({
        where:{menu_item_id}
    })

    return{message:("Menu Items deleted successfully!!"), menu_item_id};
}