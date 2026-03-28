import type { Request, Response } from 'express';
import { deleteOrderItem, getAllOrderItems, getOrderItems, postOrderItems, putOrderItems } from './order_items.service.js';

export const postOrderItemController= async(req:Request, res:Response)=>{
    try{
        const response = await postOrderItems(req.body);
        res.status(201).json(response);
    }
    catch(error){
         res.status(400).json({ message: error});
    }
}

export const getOrderItemController= async(req:Request, res:Response)=>{
    try{
        const response= await getOrderItems({order_item_id: parseInt(String(req.params.id))});
        res.status(200).json(response);
    }
    catch(error){
        res.status(400).json({message:error});
    }
};
export const getAllOrderItemController = async(req:Request, res:Response)=>{
    try{
        const response= await getAllOrderItems();
        res.status(200).json(response);
    }
    catch(error){
        res.status(400).json({message:error});
    }
} ;
export const putOrderItemController= async(req:Request, res: Response)=>{
    try{
        const response= await putOrderItems({...req.body, order_item_id: parseInt(String(req.params.id))});
        res.status(200).json(response);
    }
    catch(error){
        res.status(400).json({message:error});
    }
};
export const deleteOrderItemController= async(req:Request, res:Response)=>{
    try{
        const response= await deleteOrderItem({ order_item_id: parseInt(String(req.params.id)) });
        res.status(200).json(response)
    }catch(error){
        res.status(400).json({message:error});
    }
};