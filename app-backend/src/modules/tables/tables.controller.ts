import type { Request, Response } from 'express';
import { deleteTable, getAllTable, getTable, postTable, putTable } from './tables.service.js';

export const postTableController= async(req:Request, res:Response)=>{
    try{
        const response = await postTable(req.body);
        res.status(201).json(response);
    }
    catch(error){
         res.status(400).json({ message: error});
    }
}

export const getTableController= async(req:Request, res:Response)=>{
    try{
        const response= await getTable({table_id: parseInt(String(req.params.id))});
        res.status(200).json(response);
    }
    catch(error){
        res.status(400).json({message:error});
    }
};
export const getAllTableController = async(req:Request, res:Response)=>{
    try{
        const response= await getAllTable();
        res.status(200).json(response);
    }
    catch(error){
        res.status(400).json({message:error});
    }
} ;
export const putTableController= async(req:Request, res: Response)=>{
    try{
        const response= await putTable({...req.body, table_id: parseInt(String(req.params.id))});
        res.status(200).json(response);
    }
    catch(error){
        res.status(400).json({message:error});
    }
};
export const deleteTableController= async(req:Request, res:Response)=>{
    try{
        const response= await deleteTable({ table_id: parseInt(String(req.params.id)) });
        res.status(200).json(response)
    }catch(error){
        res.status(400).json({message:error});
    }
};