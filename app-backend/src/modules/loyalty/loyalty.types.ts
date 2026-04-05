export interface PostEarnPoints{
    customer_id: number,
    order_id: number,
    amount_paid:number
}
export interface PostRedeemPoints{
    customer_id: number,
    points_to_redeem: number,
}
export interface GetLoyaltyBalance{
    customer_id: number,
}
export interface DeleteTransactions{    
    transaction_id: number,
}
export interface Loyalty_transactions{
    transaction_id: number,
    customer_id: number,
    order_id?: number,
    points:number,
    transaction_type: 'earned' | 'redeemed',
    description?: string,
    created_at: Date
}

