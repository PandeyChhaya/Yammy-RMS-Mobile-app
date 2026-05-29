import { authService } from "../../auth/services/auth.service";

const BASE_URL = 'http://10.78.34.24:5000/api/menuItems';

export interface MenuItem {
  menu_items_id: number,
  menu_items_name: string,
  slug: string,
  price: number,
  menu_items_category_id: number,
  menu_items_description?: string,
  image_url: string
}

export interface MenuItemFilters {
  searchTerm: string
  selectedCategory: string
  onSearchChange: (term: string) => void
  onCategoryChange: (categoryId: string) => void
}

const auth_headers = async () => {
  const token = await authService.getToken()
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  }
}

const postMenuItem = async (menuItem: Omit<MenuItem, 'menu_items_id'>): Promise<MenuItem> => {
  const response = await fetch(BASE_URL, {
    method: 'POST',
    headers: await auth_headers(),
    body: JSON.stringify(menuItem),
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.message)
  return data
}

const getMenuItem = async (): Promise<MenuItem[]> => {
  const response = await fetch(BASE_URL, {
    method: 'GET',
    headers: await auth_headers(),
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.message)
  return data
}

const putMenuItem = async (menu_items_id: string, updates: Partial<Omit<MenuItem, 'menu_items_id' | 'menu_items_category_id'>>): Promise<MenuItem> => {
  const response = await fetch(`${BASE_URL}/${menu_items_id}`, {
    method: 'PUT',
    headers: await auth_headers(),
    body: JSON.stringify(updates),
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.message)
  return data
}

const deleteMenuItem = async (menu_items_id: number): Promise<MenuItem> => {
  const response = await fetch(`${BASE_URL}/${menu_items_id}`, {
    method: 'DELETE',
    headers: await auth_headers(),
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.message)
  return data
}

const menuItemsService = { postMenuItem, getMenuItem, putMenuItem, deleteMenuItem }
export default menuItemsService