export interface PostPayment{
    order_id: number,
    payment_method: string,
    amount_paid: number,
    change_given: number,
    transaction_ref: string,
};
export interface GetPayment{
    payment_id: number,
};
export interface PutPayment{
    payment_status: string,
    transaction_ref: string,
    payment_id: number,
}

;
export interface DeletePayment{
    payment_id: number,

};