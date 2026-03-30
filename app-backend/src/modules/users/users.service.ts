import prisma from '../../db.js';

export const postUser= async(body:any)=>{

    const {user_name, user_email, user_password,user_role}= body;

    const userExists = await prisma.users.findUnique({
        where:{user_email},
    });
    if(userExists) throw new Error ("User already exists!!");

    const postNewUser = await prisma.users.create({
        data:{
            user_name,
            user_password,
            user_role,
            user_email
        }
    });
    return {message:("New User registered successfully!!"), user_id:postNewUser.user_id};
};
export const getUser = async(body:any)=>{
    
    const{ user_email}= body;

    const userExists= await prisma.users.findUnique({
        where:{user_email},
    });
    if(!userExists) throw new Error ("User doesnt exist!!!");

    return userExists;
};
export const getAllUsers= async()=>{

    const users= await prisma.users.findMany();
    return users;
};
export const putUser= async(body:any)=>{
    const{user_id, user_email, user_name, user_role}= body;

    const userExists= await prisma.users.findUnique({
        where:{user_id},
    });
    if(!userExists) throw new Error ("User doesnt exist!!");

    const updatedUser=await prisma.users.update({
        where:{ 
            user_id,
        },
        data:{
            user_name,
            user_email,
            user_role
        }
    })

    return {message: ("User updated successfully!!"), user_id: updatedUser.user_id}
};
export const deleteUser= async(body:any)=>{
    const {user_id}= body;

    const userExists= await prisma.users.findUnique({
        where:{user_id},
    });
    if(!userExists) throw new Error("User doesnt exist!!");

    await prisma.users.delete({
        where:{
            user_id,
        }
    })
    return{message:("User deleted successfully;"), user_id};
};