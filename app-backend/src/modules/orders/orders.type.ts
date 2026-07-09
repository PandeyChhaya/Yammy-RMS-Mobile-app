export interface OrderItemInput {
    menu_item_id: number,
    quantity: number,
    special_request?: string,
};
export interface PostOrder{
    order_type: string,
    table_id: number,
    special_notes?: string,
    discount?: number,
    items: OrderItemInput[],
};
export interface GetOrder{
    order_id: number,
};
export interface PutOrder{
    order_id: number,
    order_status: string,
    special_notes: string,
    discount?: number,
};
export interface DeleteOrder{
    order_id: number,
};