
import { authService } from '../../auth/services/auth.service'
import {
    ReservationStatus,
    ReservationWithTable,
    UpdateReservationRequest
} from '../../pos/types/reservation'
export const API_BASE_URL = 'http://192.168.1.71:5000/api'

const BASE_URL = `${API_BASE_URL}/reservations`

const auth_headers = async () => {
  const token = await authService.getToken()
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  }
}

// GET /api/reservations?date=YYYY-MM-DD
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

// GET /api/reservations  (all, for reservation module list)
const getAllReservations = async (): Promise<ReservationWithTable[]> => {
  const response = await fetch(BASE_URL, {
    method: 'GET',
    headers: await auth_headers(),
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.message || 'Failed to load reservations')
  if (!Array.isArray(data)) throw new Error('Unexpected response format')
  return data
}

// GET /api/reservations/:id
const getReservationById = async (id: number): Promise<ReservationWithTable> => {
  const response = await fetch(`${BASE_URL}/${id}`, {
    method: 'GET',
    headers: await auth_headers(),
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.message || 'Failed to load reservation')
  return data
}

// POST /api/reservations
export interface PostReservationPayload {
  table_id:           number
  party_size:         number
  reserved_at:        string       // ISO datetime e.g. "2024-12-01T19:00"
  reservation_notes?: string
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

// PUT /api/reservations/:id  (edit details)
const updateReservation = async (
  id: number,
  updates: UpdateReservationRequest,
): Promise<ReservationWithTable> => {
  const response = await fetch(`${BASE_URL}/${id}`, {
    method: 'PUT',
    headers: await auth_headers(),
    body: JSON.stringify(updates),
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.message || 'Failed to update reservation')
  return data
}

// PUT /api/reservations/:id/status
const updateReservationStatus = async (
  reservationId: number,
  status: ReservationStatus,
): Promise<ReservationWithTable> => {
  const response = await fetch(`${BASE_URL}/${reservationId}/status`, {
    method: 'PUT',
    headers: await auth_headers(),
    body: JSON.stringify({  status }),
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.message || 'Failed to update reservation status')
  return data
}

// DELETE /api/reservations/:id
const deleteReservation = async (id: number): Promise<void> => {
  const response = await fetch(`${BASE_URL}/${id}`, {
    method: 'DELETE',
    headers: await auth_headers(),
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.message || 'Failed to delete reservation')
}

const reservationService = {
  getReservationsWithTableInfo,
  getAllReservations,
  getReservationById,
  postReservation,
  updateReservation,
  updateReservationStatus,
  deleteReservation,
}

export default reservationService