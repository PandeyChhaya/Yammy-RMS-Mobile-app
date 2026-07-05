import { authService } from '../../auth/services/auth.service'

const BASE_URL = 'http://192.168.1.71:5000/api/restaurants'

export interface Restaurant {
  restaurant_id: number
  restaurant_name: string
  slug?: string
  description?: string
  logo_url?: string
  cover_image_url?: string
  address?: string
  phone?: string
  is_active: boolean
}

const auth_headers = async () => {
  const token = await authService.getToken()
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  }
}

const postRestaurant = async (restaurant: {
  restaurant_name: string
  description?: string
  logo_url?: string
  cover_image_url?: string
  address?: string
  phone?: string
}) => {
  const response = await fetch(BASE_URL, {
    method: 'POST',
    headers: await auth_headers(),
    body: JSON.stringify(restaurant),
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.message)
  return data
}

const getActiveRestaurants = async (): Promise<Restaurant[]> => {
  const response = await fetch(`${BASE_URL}/active`, {
    method: 'GET',
    headers: await auth_headers(),
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.message || 'Failed to load restaurants')
  if (!Array.isArray(data)) throw new Error('Unexpected response format')
  return data
}

const restaurantService = { postRestaurant, getActiveRestaurants }
export default restaurantService