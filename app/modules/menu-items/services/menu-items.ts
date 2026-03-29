import AsyncStorage from '@react-native-async-storage/async-storage'

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

export interface Product {
  id: string
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
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  name: string
  description?: string
  color: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export const productsService = {
  getProducts: async (): Promise<Product[]> => {
    const json = await AsyncStorage.getItem('@products')
    return json ? JSON.parse(json) : []
  },

  createProduct: async (request: CreateProductRequest): Promise<Product> => {
    const products = await productsService.getProducts()
    const newProduct: Product = {
      id: `prod-${Date.now()}`,
      name: request.name,
      description: request.description || '',
      price: request.price,
      cost: request.cost || 0,
      category_id: request.category_id,
      barcode: request.barcode || '',
      sku: request.sku || '',
      stock_quantity: request.stock_quantity || 0,
      min_stock: request.min_stock || 0,
      image_url: request.image_url || '',
      is_active: request.is_active !== undefined ? request.is_active : true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    products.push(newProduct)
    await AsyncStorage.setItem('@products', JSON.stringify(products))
    return newProduct
  },

  updateProduct: async (id: string, request: UpdateProductRequest): Promise<Product> => {
    const products = await productsService.getProducts()
    const index = products.findIndex(p => p.id === id)
    if (index === -1) throw new Error(`Product with id ${id} not found`)
    
    products[index] = {
      ...products[index],
      ...request,
      updated_at: new Date().toISOString(),
    }
    await AsyncStorage.setItem('@products', JSON.stringify(products))
    return products[index]
  },

  deleteProduct: async (id: string): Promise<void> => {
    const products = await productsService.getProducts()
    const filtered = products.filter(p => p.id !== id)
    await AsyncStorage.setItem('@products', JSON.stringify(filtered))
  },
}