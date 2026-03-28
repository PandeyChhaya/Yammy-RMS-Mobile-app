import prisma from '../../db.js';


export const postMenuItems = async(body:any)=>{

    const {menu_items_name, slug, price}= body;// destructuring

    const existingMenuItems = await prisma.menu_items.findUnique({
        where :{slug},
    
    })
    if (existingMenuItems) throw new Error("Menu Item already exists!!");

    const updatedMenuItem=await  prisma.menu_items.create({
        data:{
            menu_items_name,
            slug,
            price,
        }
    });

    return{message: "Menu Item Updated Successfully", menu_items_id: updatedMenuItem.menu_items_id}


};
export const getMenuItems= async(body:any)=>{

    const{menu_items_id}= body;

    const menuItemsExist = await prisma.menu_items.findUnique({
        where :{menu_items_id},
    });

    if(!menuItemsExist) throw new Error("Menu Item doesnt exist!!" );

    return menuItemsExist;

};

export const getAllMenuItems = async()=>{

    const menuItems= await prisma.menu_items.findMany();
    return menuItems;

};

export const putMenuItems= async(body:any)=>{

    const {menu_items_id, menu_items_name, slug, price}= body;

    const menuItemsExists= await prisma.menu_items.findUnique({
        where :{menu_items_id},
    })

    if(!menuItemsExists) throw new Error ("Menu Item doesnt exist!!");

    const updatedMenuItem = await prisma.menu_items.update({
        where:{menu_items_id},

        data :{
            menu_items_name,
            slug,
            price,
        } })

        return {message:("Menu Item Updated Successfully!!"), menu_items_id:updatedMenuItem.menu_items_id}


};
 
export const deleteMenuItem = async(body:any)=>{

    const {menu_items_id}= body;
    
    const checkMenuItemExist= await prisma.menu_items.findUnique({
        where:{menu_items_id},
    })

    if(!checkMenuItemExist) throw new Error ("Menu Item Doesnt exist!!");

    await prisma.menu_items.delete({
        where:{menu_items_id},
    });

    return{message:("Menu Item Deleted Successfully!!"), menu_items_id};
}