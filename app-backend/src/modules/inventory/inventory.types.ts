export interface CreateIngredientRequest {
  name: string
  description?: string
  category: string
  unit: string
  current_stock?: number
  min_stock: number
  max_stock: number
  cost_per_unit: number
  supplier_id?: string
  barcode?: string
  image_url?: string
  expiration_date?: string
}
export interface UpdateIngredientRequest {
  name?: string
  description?: string
  category?: string
  unit?: string
  current_stock?: number
  min_stock?: number
  max_stock?: number
  cost_per_unit?: number
  supplier_id?: string
  barcode?: string
  image_url?: string
  expiration_date?: string
  is_active?: boolean
}

export interface CreateSupplierRequest {
  name: string
  contact_person?: string
  email?: string
  phone?: string
  address?: string
  payment_terms?: string
}

export interface UpdateSupplierRequest {
  name?: string
  contact_person?: string
  email?: string
  phone?: string
  address?: string
  payment_terms?: string
  is_active?: boolean
}