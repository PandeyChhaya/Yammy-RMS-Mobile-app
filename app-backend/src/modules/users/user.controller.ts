import type { Request, Response } from 'express';
import { postUser } from './users.service.js';

export const postUserController= async(req:Request, res:Response)=>{
    try{
        const response= await postUser(req.body);
        res.status(201).json(response);
    }
    catch(error){
        res.status(400).json({message:error});
    }
};
