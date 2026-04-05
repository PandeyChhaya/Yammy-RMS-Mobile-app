export interface PostReservation {
    customer_id: number
    table_id: number
    party_size: number
    reserved_at: Date
    reservation_notes?: string
}

export interface GetReservation {
    reservation_id: number
}

export interface PutReservation {
    reservation_id: number
    reservation_status: 'pending' | 'confirmed' | 'cancelled'
    reservation_notes?: string
    party_size?: number
}

export interface DeleteReservation {
    reservation_id: number
}

export interface Reservation {
    reservation_id: number
    customer_id: number
    table_id: number
    party_size: number
    reserved_at: Date
    reservation_status: 'pending' | 'confirmed' | 'cancelled'
    reservation_notes?: string
    created_at: Date
}