export interface PostTable{
    table_number: number,
    floor?: number,
    capacity?: number,
    table_status?: string,
    order: string,
    reservation: string,
};
export interface GetTable{
    table_id: number,
};
export interface GetAllTable{
    table_number: number,
};
export interface PutTable{
    table_id: number,
};
export interface DeleteTable{
    table_id: number,
};