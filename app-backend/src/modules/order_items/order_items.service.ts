import prisma from '../../db.js';


export const postOrderItems = async(body:any)=>{

    const{order_id,menu_item_id, quantity, unit_price, special_request}= body;
    const subtotal = quantity * unit_price;

const createOrderItem = await prisma.order_items.create({
    data:{
        order_id,
        menu_item_id, 
        quantity,
        unit_price,
        subtotal,
        special_request,
    }
});
    return {message:"Order Item created successfully!!", order_item_id:createOrderItem.order_item_id}
};

export const getAllOrderItems= async()=>{
    const orderItems = await prisma.order_items.findMany();
    return orderItems;
};
export const getOrderItems= async(body:any)=>{
    const {order_item_id}= body;

    const checkOrderItemExists= await prisma.order_items.findUnique({
        where:{order_item_id},
    })
    if(!checkOrderItemExists) throw new Error ("Order Item doesnt exist!!");

    return checkOrderItemExists;
};
export const putOrderItems= async(body:any)=>{
    const{order_item_id, quantity, unit_price, special_request}= body;

    const checkOrderItemExists = await prisma.order_items.findUnique({
        where:{order_item_id},
    })
    if(!checkOrderItemExists) throw new Error ("Order Item doesnt exist!!");

    const updatedOrderItem= await prisma.order_items.update({
        where:{
            order_item_id,
        },
        data:{
            quantity,
            unit_price, 
            special_request,   
        }
    });
    return {message:("Order Item Updated Successfully!!"), order_item_id: updatedOrderItem.order_item_id};

}
export const deleteOrderItem = async(body:any)=>{
    const {order_item_id}= body;

    const checkOrderItemExists = await prisma.order_items.findUnique({
        where:{order_item_id},
    });
    if(!checkOrderItemExists) throw new Error ("Order Item doesnt exist!!");

     await prisma.order_items.delete ({
        where:{order_item_id}
    })

    return{message:("Order Items deleted successfully!!"), order_item_id};
}