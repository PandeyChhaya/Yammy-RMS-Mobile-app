export interface PostReservation {
    table_id: number;
    party_size: number;
    reserved_at: string;
    reservation_notes?: string;
}

export interface GetReservation {
    reservation_id: number;
}

export interface PutReservation {
    party_size?:          number;
    reserved_at?:         string;
    reservation_status?:  string;
    reservation_notes?:   string;
}

export interface DeleteReservation {
    reservation_id: number;
}