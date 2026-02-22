// modules/products/services/productsService.ts

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

// ── In-memory store ───────────────────────────────────────────
// This acts like a tiny fake database. It lives in memory, so
// it resets every time the app restarts — but during a session
// create/update/delete all work correctly and stay in sync.

let mockProducts: Product[] = [
  {
    id: '1',
    name: 'Chicken Momo',
    description: 'Steamed dumplings with chicken filling',
    price: 180,
    cost: 80,
    category_id: '1',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    name: 'Veg Thali',
    description: 'Complete vegetarian meal set',
    price: 250,
    cost: 100,
    category_id: '2',
    is_active: true,
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
  },
  {
    id: '3',
    name: 'Lassi',
    description: 'Fresh yogurt drink',
    price: 120,
    cost: 40,
    category_id: '3',
    is_active: true,
    created_at: '2024-01-03T00:00:00Z',
    updated_at: '2024-01-03T00:00:00Z',
  },
  {
    id: '4',
    name: 'Buff Burger',
    description: 'Grilled buffalo meat burger',
    price: 320,
    cost: 140,
    category_id: '1',
    is_active: true,
    created_at: '2024-01-04T00:00:00Z',
    updated_at: '2024-01-04T00:00:00Z',
  },
  {
    id: '5',
    name: 'Masala Tea',
    description: 'Spiced Nepali milk tea',
    price: 60,
    cost: 20,
    category_id: '3',
    is_active: true,
    created_at: '2024-01-05T00:00:00Z',
    updated_at: '2024-01-05T00:00:00Z',
  },
]

// ── Helpers ───────────────────────────────────────────────────

const generateId = () => Date.now().toString()
const now = () => new Date().toISOString()

// ── Service ───────────────────────────────────────────────────

export const productsService = {
  // Returns all products from the in-memory list
  getProducts: async (): Promise<Product[]> => {
    return [...mockProducts]
  },

  // Adds a new product to the in-memory list
  createProduct: async (request: CreateProductRequest): Promise<Product> => {
    const newProduct: Product = {
      id: generateId(),
      name: request.name,
      description: request.description,
      price: request.price,
      cost: request.cost,
      category_id: request.category_id,
      barcode: request.barcode,
      sku: request.sku,
      stock_quantity: request.stock_quantity,
      min_stock: request.min_stock,
      image_url: request.image_url,
      is_active: request.is_active ?? true,
      created_at: now(),
      updated_at: now(),
    }
    mockProducts.push(newProduct)
    return newProduct
  },

  // Finds the product by id and updates only the fields provided
  updateProduct: async (id: string, request: UpdateProductRequest): Promise<Product> => {
    const index = mockProducts.findIndex(p => p.id === id)
    if (index === -1) throw new Error(`Product with id ${id} not found`)
    mockProducts[index] = {
      ...mockProducts[index],
      ...request,
      updated_at: now(),
    }
    return mockProducts[index]
  },

  // Removes the product from the in-memory list
  deleteProduct: async (id: string): Promise<void> => {
    const index = mockProducts.findIndex(p => p.id === id)
    if (index === -1) throw new Error(`Product with id ${id} not found`)
    mockProducts.splice(index, 1)
  },
}