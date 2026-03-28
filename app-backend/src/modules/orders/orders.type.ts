export interface PostOrder{
    order_type: string,
    table_id:number,
    user_id: number,
    special_notes?: string,
    discount?: number,
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
