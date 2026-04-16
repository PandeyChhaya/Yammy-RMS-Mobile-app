import { TableData } from "./tables"

export type ReservationStatus = 'confirmed' | 'cancelled' | 'completed' | 'no_show' | 'arrived'

export interface ReservationWithTable {
  id: number
  status: ReservationStatus
  reservation_time: string
  customer_name: string
  customer_phone?: string
  party_size: number
  table_number: string | number
}

export interface ReservationsCalendarProps {
  selectedDate: Date
  onDateChange: (date: Date) => void
  reservations: ReservationWithTable[]
  onReservationClick: (reservation: ReservationWithTable) => void
  onReservationStatusChange: (reservationId: string, status: ReservationStatus) => void
}

export interface ReservationModalProps {
  table: TableData
  isOpen: boolean
  onClose: () => void
  onReservationCreated: (reservation: Reservation) => void
}

export interface CreateReservationRequest {
  table_id: number
  customer_name: string
  customer_phone: string
  reservation_date: string
  reservation_time: string
  duration_minutes: number
  party_size: number
  special_requests: string
}
export interface Reservation {
  [key: string]: any
}


