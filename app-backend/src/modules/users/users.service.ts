import bcrypt from 'bcrypt';
import prisma from '../../db.js';

export const postUser = async (body: any) => {
  const { user_name, user_email, user_password, user_role } = body;

  const userExists = await prisma.users.findUnique({ where: { user_email } });
  if (userExists) throw new Error("User already exists!!");

  const hashedPassword = await bcrypt.hash(user_password, 10);

  const postNewUser = await prisma.users.create({
    data: {
      user_name,
      user_password: hashedPassword,
      user_role,
      user_email,
      is_active: true,
      first_login: true,
      restaurant_id: body.restaurant_id,
    }
  });
  return { message: "New User registered successfully!!", user_id: postNewUser.user_id };
};
export const getUser = async(body:any)=>{
    
    const{ user_email}= body;

    const userExists= await prisma.users.findUnique({
        where:{user_email},
    });
    if(!userExists) throw new Error ("User doesnt exist!!!");

    return userExists;
};
export const getAllUsers = async (restaurant_id?: number) => {
  const users = await prisma.users.findMany({
    where: {
      user_role: { not: 'SuperAdmin' },
      ...(restaurant_id ? { restaurant_id } : {}),
    },
  });
  return users;
};
export const putUser = async (body: any) => {
    const { user_id, user_email, user_name, user_role, is_active } = body;

    const userExists = await prisma.users.findUnique({
        where: { user_id },
    });
    if (!userExists) throw new Error("User doesnt exist!!");
    if (userExists.user_role === 'SuperAdmin') throw new Error("Cannot modify SuperAdmin");

    const updatedUser = await prisma.users.update({
        where: {
            user_id,
        },
        data: {
            ...(user_name !== undefined && { user_name }),
            ...(user_email !== undefined && { user_email }),
            ...(user_role !== undefined && { user_role }),
            ...(is_active !== undefined && { is_active }),
        },
    });

    return { message: ("User updated successfully!!"), user_id: updatedUser.user_id };
};
export const deleteUser = async (body: any) => {
  const { user_id } = body;

  const userExists = await prisma.users.findUnique({
    where: { user_id },
  });
  if (!userExists) throw new Error("User doesn't exist!!");
  
  if (userExists.user_role === 'SuperAdmin') throw new Error("Cannot delete SuperAdmin");

  await prisma.users.delete({ where: { user_id } });
  return { message: "User deleted successfully", user_id };
};