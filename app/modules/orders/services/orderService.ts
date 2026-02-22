import AsyncStorage from '@react-native-async-storage/async-storage'
import { Order, OrderItem, OrderStatus } from '../../../../shared/types/orders'

// Storage keys
const ORDERS_KEY = 'mock_orders'
const TRASH_ORDERS_KEY = 'mock_trash_orders'
const ORDER_COUNTER_KEY = 'mock_order_counter'


async function generateOrderNumber(): Promise<string> {
  try {
    const stored = await AsyncStorage.getItem(ORDER_COUNTER_KEY)
    const counter = stored ? parseInt(stored) : 1000
    const newCounter = counter + 1
    await AsyncStorage.setItem(ORDER_COUNTER_KEY, newCounter.toString())
    return `ORD-${newCounter}`
  } catch {
    return `ORD-${Date.now()}`
  }
}


const generateId = () => `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

// Helper to get orders from AsyncStorage
async function getStoredOrders(): Promise<Order[]> {
  try {
    const stored = await AsyncStorage.getItem(ORDERS_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

// Helper to save orders to AsyncStorage
async function saveOrders(orders: Order[]): Promise<void> {
  await AsyncStorage.setItem(ORDERS_KEY, JSON.stringify(orders))
}

// Helper to get trash orders from AsyncStorage
async function getStoredTrashOrders(): Promise<Order[]> {
  try {
    const stored = await AsyncStorage.getItem(TRASH_ORDERS_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

// Helper to save trash orders to AsyncStorage
async function saveTrashOrders(orders: Order[]): Promise<void> {
  await AsyncStorage.setItem(TRASH_ORDERS_KEY, JSON.stringify(orders))
}

// Simulate network delay
const delay = (ms: number = 500) => new Promise(resolve => setTimeout(resolve, ms))

export const ordersService = {
  // Create an order from a table's cart
  createOrderFromCart: async (
    tableId: string,
    tableName: string,
    cartItems: Array<{
      product_id: string
      product_name: string
      quantity: number
      unit_price: number
      total_price: number
    }>
  ): Promise<Order> => {
    await delay()

    const orders = await getStoredOrders()
    const orderNumber = await generateOrderNumber()
    
    // Calculate total
    const totalAmount = cartItems.reduce((sum, item) => sum + item.total_price, 0)

    // Create order items with status
    const orderItems: OrderItem[] = cartItems.map(item => ({
      product_id: item.product_id,
      product_name: item.product_name,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.total_price,
      status: 'active' as const,
    }))

    const newOrder: Order = {
      id: generateId(),
      order_number: orderNumber,
      table_id: tableId,
      table_name: tableName,
      items: orderItems,
      total_amount: totalAmount,
      status: 'pending',
      created_at: new Date().toISOString(),
    }

    const updated = [...orders, newOrder]
    await saveOrders(updated)
    
    return newOrder
  },

  // Get all orders
  getAllOrders: async (): Promise<Order[]> => {
    await delay()
    return getStoredOrders()
  },

  // Update order status
  updateOrderStatus: async (orderId: string, status: OrderStatus): Promise<void> => {
    await delay()

    const orders = await getStoredOrders()
    const index = orders.findIndex(o => o.id === orderId)
    
    if (index === -1) {
      throw new Error('Order not found')
    }

    orders[index] = {
      ...orders[index],
      status,
    }
    
    await saveOrders(orders)
  },

  // Delete an order
  deleteOrder: async (orderId: string): Promise<void> => {
    await delay()

    const orders = await getStoredOrders()
    const filtered = orders.filter(o => o.id !== orderId)
    
    await saveOrders(filtered)
  },

  // Get order by table
  getOrderByTable: async (tableId: string): Promise<Order | null> => {
    await delay()

    const orders = await getStoredOrders()
    const order = orders.find(o => o.table_id === tableId && o.status !== 'completed')
    
    return order || null
  },

  // Update order items
  updateOrderItems: async (orderId: string, items: OrderItem[]): Promise<void> => {
    await delay()

    const orders = await getStoredOrders()
    const index = orders.findIndex(o => o.id === orderId)
    
    if (index === -1) {
      throw new Error('Order not found')
    }

    // Recalculate total
    const totalAmount = items.reduce((sum, item) => sum + item.total_price, 0)

    orders[index] = {
      ...orders[index],
      items,
      total_amount: totalAmount,
    }
    
    await saveOrders(orders)
  },

  // Cancel an order item
  cancelOrderItem: async (orderId: string, productId: string): Promise<void> => {
    await delay()

    const orders = await getStoredOrders()
    const index = orders.findIndex(o => o.id === orderId)
    
    if (index === -1) {
      throw new Error('Order not found')
    }

    // Mark item as cancelled instead of removing it
    const updatedItems = orders[index].items.map(item =>
      item.product_id === productId
        ? { ...item, status: 'cancelled' as const }
        : item
    )
    
    // Recalculate total (only active items)
    const totalAmount = updatedItems
      .filter(item => item.status === 'active')
      .reduce((sum, item) => sum + item.total_price, 0)

    orders[index] = {
      ...orders[index],
      items: updatedItems,
      total_amount: totalAmount,
    }
    
    await saveOrders(orders)
  },

  // Get trash orders
  getTrashOrders: async (): Promise<Order[]> => {
    await delay()
    return getStoredTrashOrders()
  },

  // Move order to trash
  moveToTrash: async (orderId: string): Promise<void> => {
    await delay()

    const orders = await getStoredOrders()
    const trashOrders = await getStoredTrashOrders()
    
    const index = orders.findIndex(o => o.id === orderId)
    
    if (index === -1) {
      throw new Error('Order not found')
    }

    // Move to trash
    const orderToTrash = orders[index]
    orders.splice(index, 1)
    
    await saveOrders(orders)
    await saveTrashOrders([...trashOrders, orderToTrash])
  },

  // Restore order from trash
  restoreFromTrash: async (orderId: string): Promise<void> => {
    await delay()

    const orders = await getStoredOrders()
    const trashOrders = await getStoredTrashOrders()
    
    const index = trashOrders.findIndex(o => o.id === orderId)
    
    if (index === -1) {
      throw new Error('Order not found in trash')
    }

    // Restore from trash
    const orderToRestore = trashOrders[index]
    trashOrders.splice(index, 1)
    
    await saveOrders([...orders, orderToRestore])
    await saveTrashOrders(trashOrders)
  },

  // Permanently delete an order
  deletePermanently: async (orderId: string): Promise<void> => {
    await delay()

    const trashOrders = await getStoredTrashOrders()
    const filtered = trashOrders.filter(o => o.id !== orderId)
    
    await saveTrashOrders(filtered)
  },

  // Clear all trash
  clearTrash: async (): Promise<void> => {
    await delay()
    await saveTrashOrders([])
  },
}