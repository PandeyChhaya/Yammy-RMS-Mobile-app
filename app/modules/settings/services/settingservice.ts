import { authService } from '../../auth/services/auth.service'

const BASE_URL = 'http://192.168.1.71:5000/api/settings'

const auth_headers = async () => {
  const token = await authService.getToken()
  return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
}

export interface RestaurantSettings {
  restaurant_id: number
  restaurant_name: string
  phone: string | null
  address: string | null
  logo_url: string | null
  cover_image_url: string | null
}

const getSettings = async (): Promise<RestaurantSettings> => {
  const response = await fetch(BASE_URL, { method: 'GET', headers: await auth_headers() })
  const data = await response.json()
  if (!response.ok) throw new Error(data.message)
  return data
}

const updateSettings = async (updates: Partial<RestaurantSettings>) => {
  const response = await fetch(BASE_URL, {
    method: 'PUT',
    headers: await auth_headers(),
    body: JSON.stringify(updates),
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.message)
  return data
}

export const settingsService = { getSettings, updateSettings }