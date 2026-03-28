export interface PostOrderItems{
    order_id: number,
    menu_item_id: number,
    quantity: number,
    unit_price: number,
    special_request?: string,
};
export interface GetOrderItems{
    order_item_id: number,
};
export interface PutOrderItems{
    order_item_id: number,
    quantity: number,
    unit_price: number,
    special_request?: string,
    
};
export interface DeleteOrderItems{
    order_item_id: number,
};
