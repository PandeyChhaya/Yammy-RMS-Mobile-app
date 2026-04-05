import { Router } from 'express';
import { protect } from '../../middleware/auth.middleware.js';
import {
    deleteTransactionController,
    getAllTransactionsController,
    getLoyaltyBalanceController,
    postEarnPointsController,
    postRedeemPointsController,
} from './loyalty.controller.js';

const loyaltyRouter = Router();

loyaltyRouter.post('/earn', protect, postEarnPointsController);

loyaltyRouter.post('/redeem', protect, postRedeemPointsController);

loyaltyRouter.get('/balance/:id', protect, getLoyaltyBalanceController);

loyaltyRouter.get('/transactions/:id', protect, getAllTransactionsController);

loyaltyRouter.delete('/transactions/:id', protect, deleteTransactionController);

export default loyaltyRouter;