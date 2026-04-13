export interface PostTable {
    table_number: string;
    floor?: string;
    capacity: number;
}

export interface GetTable {
    table_id: number;
}

export interface PutTable {
    table_number?: string;
    floor?: string;
    capacity?: number;
    table_status?: string;
}

export interface DeleteTable {
    table_id: number;
}