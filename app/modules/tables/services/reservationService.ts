import { authService } from '../../auth/services/auth.service'
import { ReservationStatus, ReservationWithTable } from '../../pos/types/reservation'

const BASE_URL = 'http://10.24.5.92:5000/api/reservations'

export interface PostReservationPayload {
  table_id:          number
  party_size:        number
  reserved_at:       string
  reservation_notes?: string
}

const auth_headers = async () => {
  const token = await authService.getToken()
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  }
}

const postReservation = async (payload: PostReservationPayload): Promise<ReservationWithTable> => {
  const response = await fetch(BASE_URL, {
    method: 'POST',
    headers: await auth_headers(),
    body: JSON.stringify(payload),
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.message || 'Failed to create reservation')
  return data
}

const getReservationsWithTableInfo = async (date: string): Promise<ReservationWithTable[]> => {
  const response = await fetch(`${BASE_URL}?date=${date}`, {
    method: 'GET',
    headers: await auth_headers(),
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.message || 'Failed to load reservations')
  if (!Array.isArray(data)) throw new Error('Unexpected response format')
  return data
}

const updateReservationStatus = async (
  reservationId: number,
  status: ReservationStatus,
): Promise<ReservationWithTable> => {
  const response = await fetch(`${BASE_URL}/${reservationId}/status`, {
    method: 'PUT',
    headers: await auth_headers(),
    body: JSON.stringify({ reservation_status: status }),
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.message || 'Failed to update reservation status')
  return data
}

const reservationService = { postReservation, getReservationsWithTableInfo, updateReservationStatus }
export default reservationService