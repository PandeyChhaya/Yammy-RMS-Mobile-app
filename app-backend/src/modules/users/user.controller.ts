import type { Request, Response } from 'express';
import { deleteUser, getAllUsers, getUser, postUser, putUser } from './users.service.js';

export const postUserController = async (req: Request, res: Response) => {
  try {
    const response = await postUser({
      ...req.body,
      restaurant_id: req.user?.restaurant_id,
    });
    res.status(201).json(response);
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};
  export const getUserController=async(req:Request, res: Response)=>{
    try{
        const response= await getUser({user_id: parseInt(String(req.params.id))});
        res.status(200).json(response);
    }
    catch(error){
        res.status(400).json({message:error});
    }
};
export const getAllUserController = async (req: Request, res: Response) => {
  try {
    const restaurant_id = req.user?.restaurant_id
    const response = await getAllUsers(restaurant_id ?? undefined)
    res.status(200).json(response)
  } catch (error) {
    res.status(400).json({ message: (error as Error).message })
  }
}
export const putUserController= async(req:Request, res: Response)=>{
    try{
        const response= await putUser({...req.body, user_id: parseInt(String(req.params.id))});
        res.status(200).json(response);
    }
    catch (error) {
  res.status(400).json({ message: (error as Error).message });
}
};
export const deleteUserController= async(req:Request, res:Response)=>{
    try{
        const response= await deleteUser({ user_id: parseInt(String(req.params.id)) });
        res.status(200).json(response)
    }catch (error) {
  res.status(400).json({ message: (error as Error).message });
}
};