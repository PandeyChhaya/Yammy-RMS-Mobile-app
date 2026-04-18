// pos/types/reservation.ts

export type ReservationStatus =
  | 'confirmed'
  | 'arrived'
  | 'completed'
  | 'cancelled'
  | 'no_show'

export interface Reservation {
  reservation_id:    number
  table_id:          number
  customer_name:     string
  customer_phone?:   string
  party_size:        number
  reserved_at:       string        
  duration_minutes:  number
  reservation_notes?: string
  status:            ReservationStatus
  created_at:        string
  updated_at:        string
}

export interface ReservationWithTable extends Reservation {
  // joined from table
  id:               number         // alias for reservation_id (used in calendar)
  table_number:     string
  floor:            string
  capacity:         number
  // split fields for convenience
  reservation_date: string         // YYYY-MM-DD
  reservation_time: string         // HH:MM
}

export interface CreateReservationRequest {
  table_id:          number
  customer_name:     string
  customer_phone?:   string
  party_size:        number
  reservation_date:  string        // YYYY-MM-DD
  reservation_time:  string        // HH:MM
  duration_minutes:  number
  special_requests?: string
}

export interface UpdateReservationRequest {
  customer_name?:    string
  customer_phone?:   string
  party_size?:       number
  reservation_date?: string
  reservation_time?: string
  duration_minutes?: number
  special_requests?: string
}

// Props types for components
export interface ReservationModalProps {
  table: import('./tables').TableData
  isOpen: boolean
  onClose: () => void
  onReservationCreated: (reservation: ReservationWithTable) => void
}

export interface ReservationsCalendarProps {
  selectedDate:               Date
  onDateChange:               (date: Date) => void
  reservations:               ReservationWithTable[]
  onReservationClick:         (reservation: ReservationWithTable) => void
  onReservationStatusChange:  (id: number, status: ReservationStatus) => void
}