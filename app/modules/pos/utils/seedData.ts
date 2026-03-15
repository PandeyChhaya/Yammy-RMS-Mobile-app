import AsyncStorage from '@react-native-async-storage/async-storage'

const SEED_PRODUCTS = [
  {
    id: 'prod-1',
    name: 'Chicken Momo',
    price: 150,
    category_id: 'cat-1',
    category_name: 'Appetizers',
    stock_quantity: 50,
    cost: 80,
    min_stock: 10,
  },
  {
    id: 'prod-2',
    name: 'Veg Momo',
    price: 120,
    category_id: 'cat-1',
    category_name: 'Appetizers',
    stock_quantity: 60,
    cost: 60,
    min_stock: 10,
  },
  {
    id: 'prod-3',
    name: 'Dal Bhat',
    price: 250,
    category_id: 'cat-2',
    category_name: 'Main Course',
    stock_quantity: 30,
    cost: 120,
    min_stock: 5,
  },
  {
    id: 'prod-4',
    name: 'Chicken Chowmein',
    price: 180,
    category_id: 'cat-2',
    category_name: 'Main Course',
    stock_quantity: 40,
    cost: 90,
    min_stock: 8,
  },
  {
    id: 'prod-5',
    name: 'Coke',
    price: 80,
    category_id: 'cat-3',
    category_name: 'Drinks',
    stock_quantity: 100,
    cost: 40,
    min_stock: 20,
  },
  {
    id: 'prod-6',
    name: 'Lassi',
    price: 100,
    category_id: 'cat-3',
    category_name: 'Drinks',
    stock_quantity: 50,
    cost: 50,
    min_stock: 10,
  },
]

const SEED_CATEGORIES = [
  { id: 'cat-1', name: 'Appetizers', color: '#3B82F6' },
  { id: 'cat-2', name: 'Main Course', color: '#10B981' },
  { id: 'cat-3', name: 'Drinks', color: '#F59E0B' },
  { id: 'cat-4', name: 'Desserts', color: '#EC4899' },
]

const SEED_TABLES = [
  {
    id: 'table-1',
    name: 'Table 1',
    number: '1',
    status: 'free',
    capacity: 4,
    position_x: 0,
    position_y: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'table-2',
    name: 'Table 2',
    number: '2',
    status: 'free',
    capacity: 2,
    position_x: 0,
    position_y: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'table-3',
    name: 'Table 3',
    number: '3',
    status: 'free',
    capacity: 6,
    position_x: 0,
    position_y: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'table-4',
    name: 'Table 4',
    number: '4',
    status: 'free',
    capacity: 4,
    position_x: 0,
    position_y: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

export const seedDatabase = async () => {
  try {
    // Check if already seeded
    const hasData = await AsyncStorage.getItem('@data_seeded')
    if (hasData) {
      console.log('✅ Data already seeded')
      return
    }

    console.log('🌱 Seeding database...')

    // Seed products
    await AsyncStorage.setItem('@products', JSON.stringify(SEED_PRODUCTS))
    console.log('✅ Products seeded:', SEED_PRODUCTS.length)
    
    // Seed categories
    await AsyncStorage.setItem('@categories', JSON.stringify(SEED_CATEGORIES))
    console.log('✅ Categories seeded:', SEED_CATEGORIES.length)
    
    // Seed tables
    await AsyncStorage.setItem('@tables', JSON.stringify(SEED_TABLES))
    console.log('✅ Tables seeded:', SEED_TABLES.length)
    
    // Initialize empty carts
    await AsyncStorage.setItem('@carts', JSON.stringify({}))
    console.log('✅ Carts initialized')
    
    // Mark as seeded
    await AsyncStorage.setItem('@data_seeded', 'true')
    
    console.log('🎉 Database seeded successfully!')
  } catch (error) {
    console.error('❌ Seed error:', error)
  }
}

// Function to reset database (useful for testing)
export const resetDatabase = async () => {
  try {
    await AsyncStorage.multiRemove([
      '@products',
      '@categories',
      '@tables',
      '@carts',
      '@data_seeded',
    ])
    console.log('🔄 Database reset complete')
  } catch (error) {
    console.error('❌ Reset error:', error)
  }
}