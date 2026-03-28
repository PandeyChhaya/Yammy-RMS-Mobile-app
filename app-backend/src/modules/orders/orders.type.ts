export interface PostOrder{
    order_type: string,
    special_notes?: string,
    discount?: number,
    order_items: string,

};
export interface GetOrder{
    order_id: number,
    table_id: number,
};
export interface PutOrder{
    order_id: number,
    order_type: string,
    order_items: string,
    discount?: number,
};
export interface DeleteOrder{
    order_id: number,
};
