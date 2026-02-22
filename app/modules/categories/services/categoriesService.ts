// services/categoriesService.ts

export interface CreateCategoryRequest {
  name: string
  description?: string
  color?: string
  is_active?: boolean
}

export interface UpdateCategoryRequest {
  name?: string
  description?: string
  color?: string
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
    return []
  },

  createCategory: async (request: CreateCategoryRequest): Promise<Category> => {
    throw new Error('Not implemented')
  },

  updateCategory: async (id: string, request: UpdateCategoryRequest): Promise<Category> => {
    throw new Error('Not implemented')
  },

  deleteCategory: async (id: string): Promise<void> => {
    throw new Error('Not implemented')
  },
}