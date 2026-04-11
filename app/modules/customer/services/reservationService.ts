import { authService } from "../../auth/services/auth.service";

const BASE_URL = 'http://192.168.18.73:5000/api/reservation';

export interface Reservation {
  reservation_id: number
  customer_id: number
  table_id: number
  party_size: number
  reserved_at: string
  reservation_status: string
  reservation_notes?: string
  created_at: string
}

const auth_headers = async () => {
  const token = await authService.getToken();
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
}

const postReservation = async (
  reservation: Omit<Reservation, 'reservation_id' | 'reservation_status' | 'created_at'>
): Promise<Reservation> => {
  const response = await fetch(BASE_URL, {
    method: 'POST',
    headers: await auth_headers(),
    body: JSON.stringify(reservation),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message);
  return data;
};

const getReservation = async (customer_id: number): Promise<Reservation[]> => {
  const response = await fetch(`${BASE_URL}/customer/${customer_id}`, {
    method: 'GET',
    headers: await auth_headers(),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message);
  return data;
};

const putReservation = async (
  reservation_id: number,
  updates: Partial<Omit<Reservation, 'reservation_id' | 'created_at'>>
): Promise<Reservation> => {
  const response = await fetch(`${BASE_URL}/${reservation_id}`, {
    method: 'PUT',
    headers: await auth_headers(),
    body: JSON.stringify(updates),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message);
  return data;
};

const deleteReservation = async (reservation_id: number): Promise<Reservation> => {
  const response = await fetch(`${BASE_URL}/${reservation_id}`, {
    method: 'DELETE',
    headers: await auth_headers(),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message);
  return data;
};

const reservationService = { postReservation, getReservation, putReservation, deleteReservation };
export default reservationService;