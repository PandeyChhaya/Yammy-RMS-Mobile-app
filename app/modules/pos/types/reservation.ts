export type ReservationStatus =
  | 'pending'
  | 'confirmed'
  | 'seated'
  | 'cancelled'
  | 'no_show'

export interface ReservationWithTable {
  // new DB fields
  reservation_id:     number
  reservation_status: ReservationStatus
  reserved_at:        string
  // old fields kept for ReservationsCalendar compatibility
  id:                 string
  status:             ReservationStatus
  reservation_time:   string
  // shared fields
  customer_name?:     string
  phone_number?:      string
  party_size:         number
  table_number:       string | number
  table_id:           number
  reservation_notes?: string
  created_at?:        string
  updated_at?:        string
}