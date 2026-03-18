import AsyncStorage from '@react-native-async-storage/async-storage'

export interface CreateCategoryRequest {
  name: string
  description?: string
  color?: string
  tax_rate_id?: string
  is_active?: boolean
}

export interface UpdateCategoryRequest {
  name?: string
  description?: string
  color?: string
  tax_rate_id?: string
  is_active?: boolean
}

export interface Category {
  id: string
  name: string
  description?: string
  color: string
  tax_rate_id?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export const categoriesService = {
  getCategories: async (): Promise<Category[]> => {
    const json = await AsyncStorage.getItem('@categories')
    return json ? JSON.parse(json) : []
  },

  createCategory: async (request: CreateCategoryRequest): Promise<Category> => {
    const categories = await categoriesService.getCategories()
    const newCategory: Category = {
      id: `cat-${Date.now()}`,
      name: request.name,
      description: request.description || '',
      color: request.color || '#3B82F6',
      tax_rate_id: request.tax_rate_id || '',
      is_active: request.is_active !== undefined ? request.is_active : true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    categories.push(newCategory)
    await AsyncStorage.setItem('@categories', JSON.stringify(categories))
    return newCategory
  },

  updateCategory: async (id: string, request: UpdateCategoryRequest): Promise<Category> => {
    const categories = await categoriesService.getCategories()
    const index = categories.findIndex(c => c.id === id)
    if (index === -1) throw new Error('Category not found')
    
    const updated = {
      ...categories[index],
      ...request,
      updated_at: new Date().toISOString(),
    }
    categories[index] = updated
    await AsyncStorage.setItem('@categories', JSON.stringify(categories))
    return updated
  },

  deleteCategory: async (id: string): Promise<void> => {
    const categories = await categoriesService.getCategories()
    const filtered = categories.filter(c => c.id !== id)
    await AsyncStorage.setItem('@categories', JSON.stringify(filtered))
  },
}