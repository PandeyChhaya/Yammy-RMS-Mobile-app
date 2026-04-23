import prisma from '../../db.js';

export const postOrder = async(body:any)=>{

    const {order_type, special_notes, discount, table_id, user_id}= body;


    const postNewOrder = await prisma.orders.create({
        data:{
            order_type,
            special_notes,
            discount,
            table_id,
            user_id,
        }
    });
    return {message:"New Order created!!" , order_id:postNewOrder.order_id}
};

export const getOrder= async(body:any)=>{

    const {order_id}= body;

    const orderExists = await prisma.orders.findUnique(
        {
            where:{order_id},
        }
    );
    if(!orderExists) throw new Error ("Order doesnt exist!!");
     return orderExists;
};

export const getAllOrder= async()=>{

    const order = await prisma.orders.findMany(
        {
        include: {
            order_items: true,  
        },
        orderBy: { created_at: 'desc' },
    }
    );
    return order;
} 
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

export const putOrder=async(body:any)=>{

    const {order_id, order_type, special_notes, discount}= body;

    const orderExists= await prisma.orders.findUnique({
        where: {order_id},
    });
    if (!orderExists) throw new Error ("Order doesnt exist!!");

    const updatedOrder= await prisma.orders.update({
        where:{
            order_id,
        },
        data:{
            order_type,
            special_notes,
            discount,
        }})
        return{message: "Order updated successfully!!" , order_id: updatedOrder.order_id};
    };

    

    export const deleteOrder= async(body:any)=>{

        const{order_id}= body;

        const orderExists= await prisma.orders.findUnique({
            where:{order_id},
        });

        if(!orderExists) throw new Error("Order doesnt exist!!");

        
        
        await prisma.orders.delete({
            where:{order_id},
        });

        return {message:"Order deleted successfully!", order_id};
      
    }