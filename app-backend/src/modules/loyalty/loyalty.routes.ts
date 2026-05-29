import { Router } from 'express';
import {
    deleteTransactionController,
    getAllTransactionsController,
    getLoyaltyBalanceController,
    postEarnPointsController,
    postRedeemPointsController,
} from './loyalty.controller.js';

const loyaltyRouter = Router();

loyaltyRouter.post('/earn',  postEarnPointsController);

loyaltyRouter.post('/redeem',  postRedeemPointsController);

loyaltyRouter.get('/balance/:id', getLoyaltyBalanceController);

loyaltyRouter.get('/transactions/:id',  getAllTransactionsController);

loyaltyRouter.delete('/transactions/:id',  deleteTransactionController);

export default loyaltyRouter;