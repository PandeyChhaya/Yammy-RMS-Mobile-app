import type { Request, Response } from 'express';
import {
    deleteRestaurant,
    getActiveRestaurants,
    getAllRestaurant,
    getRestaurant,
    postRestaurant,
    putRestaurant,
} from './restaurant.service.js';

export const postRestaurantController = async (req: Request, res: Response) => {
    try {
        const response = await postRestaurant(req.body);
        res.status(201).json(response);
    } catch (error) {
        res.status(400).json({ message: error });
    }
};

export const getRestaurantController = async (req: Request, res: Response) => {
    try {
        const response = await getRestaurant({ restaurant_id: parseInt(String(req.params.id)) });
        res.status(200).json(response);
    } catch (error) {
        res.status(400).json({ message: error });
    }
};

export const getAllRestaurantController = async (req: Request, res: Response) => {
    try {
        const response = await getAllRestaurant();
        res.status(200).json(response);
    } catch (error) {
        res.status(400).json({ message: error });
    }
};

// public endpoint - used by customer BrowseRestaurants screen
export const getActiveRestaurantsController = async (req: Request, res: Response) => {
    try {
        const response = await getActiveRestaurants();
        res.status(200).json(response);
    } catch (error) {
        res.status(400).json({ message: error });
    }
};

export const putRestaurantController = async (req: Request, res: Response) => {
    try {
        const response = await putRestaurant({ ...req.body, restaurant_id: parseInt(String(req.params.id)) });
        res.status(200).json(response);
    } catch (error) {
        res.status(400).json({ message: error });
    }
};

export const deleteRestaurantController = async (req: Request, res: Response) => {
    try {
        const response = await deleteRestaurant({ restaurant_id: parseInt(String(req.params.id)) });
        res.status(200).json(response);
    } catch (error) {
        res.status(400).json({ message: error });
    }
};