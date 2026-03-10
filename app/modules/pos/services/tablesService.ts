import AsyncStorage from '@react-native-async-storage/async-storage'

import { Table } from '../types/tables'

export interface CartItem {
  product_id: string
  product_name: string
  quantity: number
  unit_price: number
  total_price: number
}

export interface TableCart {
  table_id: string
  items: CartItem[]
  total_amount: number
}

const STORAGE_KEYS = {
  TABLES: '@tables',
  CARTS: '@carts',
}

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

export const tablesService = {
  getAllTables: async (): Promise<Table[]> => {
    const json = await AsyncStorage.getItem(STORAGE_KEYS.TABLES)
    return json ? JSON.parse(json) : []
  },

   getById: async (id: string): Promise<Table | null> => {
        const tables = await tablesService.getAllTables()
        return tables.find(t => t.id === id) || null
    },
  createTable: async (table: Omit<Table, 'id'>): Promise<Table> => {
    const existing = await tablesService.getAllTables()
    const newTable: Table = {
      ...table,
      id: generateId(),
      created_at: new Date().toISOString(), 
      updated_at: new Date().toISOString(), 
    }
    const updated = [...existing, newTable]
    await AsyncStorage.setItem(STORAGE_KEYS.TABLES, JSON.stringify(updated))
    return newTable
  },

  updateTable: async (id: string, table: Partial<Table>): Promise<Table> => {
    const existing = await tablesService.getAllTables()
    const index = existing.findIndex(t => t.id === id)
    if (index === -1) throw new Error('Table not found')
    
    existing[index] = { ...existing[index], ...table }
    await AsyncStorage.setItem(STORAGE_KEYS.TABLES, JSON.stringify(existing))
    return existing[index]
  },

  deleteTable: async (id: string): Promise<void> => {
    const existing = await tablesService.getAllTables()
    const filtered = existing.filter(t => t.id !== id)
    await AsyncStorage.setItem(STORAGE_KEYS.TABLES, JSON.stringify(filtered))
  },

  getTableCart: async (tableId: string): Promise<TableCart | null> => {
    const json = await AsyncStorage.getItem(STORAGE_KEYS.CARTS)
    const carts: Record<string, TableCart> = json ? JSON.parse(json) : {}
    return carts[tableId] || null
  },

  addItemToCart: async (tableId: string, item: Omit<CartItem, 'total_price'>): Promise<void> => {
    const json = await AsyncStorage.getItem(STORAGE_KEYS.CARTS)
    const carts: Record<string, TableCart> = json ? JSON.parse(json) : {}
    
    if (!carts[tableId]) {
      carts[tableId] = { table_id: tableId, items: [], total_amount: 0 }
    }
    
    const cartItem: CartItem = {
      ...item,
      total_price: item.quantity * item.unit_price,
    }
    
    carts[tableId].items.push(cartItem)
    carts[tableId].total_amount = carts[tableId].items.reduce((sum, i) => sum + i.total_price, 0)
    
    await AsyncStorage.setItem(STORAGE_KEYS.CARTS, JSON.stringify(carts))
  },

  updateCartItem: async (tableId: string, productId: string, update: { quantity: number }): Promise<void> => {
    const json = await AsyncStorage.getItem(STORAGE_KEYS.CARTS)
    const carts: Record<string, TableCart> = json ? JSON.parse(json) : {}
    
    if (!carts[tableId]) throw new Error('Cart not found')
    
    const itemIndex = carts[tableId].items.findIndex(i => i.product_id === productId)
    if (itemIndex === -1) throw new Error('Item not found')
    
    carts[tableId].items[itemIndex].quantity = update.quantity
    carts[tableId].items[itemIndex].total_price = 
      carts[tableId].items[itemIndex].quantity * carts[tableId].items[itemIndex].unit_price
    
    carts[tableId].total_amount = carts[tableId].items.reduce((sum, i) => sum + i.total_price, 0)
    
    await AsyncStorage.setItem(STORAGE_KEYS.CARTS, JSON.stringify(carts))
  },

  removeItemFromCart: async (tableId: string, productId: string): Promise<void> => {
    const json = await AsyncStorage.getItem(STORAGE_KEYS.CARTS)
    const carts: Record<string, TableCart> = json ? JSON.parse(json) : {}
    
    if (!carts[tableId]) return
    
    carts[tableId].items = carts[tableId].items.filter(i => i.product_id !== productId)
    carts[tableId].total_amount = carts[tableId].items.reduce((sum, i) => sum + i.total_price, 0)
    
    await AsyncStorage.setItem(STORAGE_KEYS.CARTS, JSON.stringify(carts))
  },

  clearTableCart: async (tableId: string): Promise<void> => {
    const json = await AsyncStorage.getItem(STORAGE_KEYS.CARTS)
    const carts: Record<string, TableCart> = json ? JSON.parse(json) : {}
    
    delete carts[tableId]
    
    await AsyncStorage.setItem(STORAGE_KEYS.CARTS, JSON.stringify(carts))
  },
}