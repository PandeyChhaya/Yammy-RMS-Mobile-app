// modules/products/types/product.ts

export interface Product {
  id: string
  name: string
  description?: string
  price: number
  cost: number
  category_id: string
  barcode?: string
  sku?: string
  stock_quantity: number
  min_stock: number
  image_url?: string
  is_active: boolean
  created_at: string
  updated_at: string
}
export interface ProductDisplay extends Product {
    category_name?: string
    tax_rate: number
    tax_amount: number
    total_with_tax: number
}

export interface CreateProductRequest {
  name: string
  description?: string
  price: number
  cost?: number
  category_id: string
  barcode?: string
  sku?: string
  stock_quantity?: number
  min_stock?: number
  image_url?: string
  is_active?: boolean
}

export interface UpdateProductRequest {
  name?: string
  description?: string
  price?: number
  cost?: number
  category_id?: string
  barcode?: string
  sku?: string
  stock_quantity?: number
  min_stock?: number
  image_url?: string
  is_active?: boolean
}