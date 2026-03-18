import AsyncStorage from '@react-native-async-storage/async-storage'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Stack } from 'expo-router'
import { useEffect, useState } from 'react'
import { ActivityIndicator, View } from 'react-native'
import { AppProvider } from '../shared/contexts/AppContext'
import { TabStateProvider } from '../shared/contexts/TabStateManager'
import { UserSettingsProvider } from '../shared/contexts/UserSettingsContext'
import { seedDatabase } from './modules/pos/utils/seedData'

const queryClient = new QueryClient()

export default function RootLayout() {
  const [ready, setReady] = useState(false)
// Replace your useEffect in _layout.tsx:

useEffect(() => {
  const initialize = async () => {
  
    await AsyncStorage.multiRemove(['@products', '@categories', '@tables', '@data_seeded'])
    
    await seedDatabase()
    
    const products = await AsyncStorage.getItem('@products')
    const categories = await AsyncStorage.getItem('@categories')
    const tables = await AsyncStorage.getItem('@tables')
    console.log('🔍 PRODUCTS:', products ? JSON.parse(products).length : 'NONE')
    console.log('🔍 CATEGORIES:', categories ? JSON.parse(categories).length : 'NONE')
    console.log('🔍 TABLES:', tables ? JSON.parse(tables).length : 'NONE')
    
    setReady(true)
  }
  initialize()
}, [])
const checkOrders = async () => {
  const orders = await AsyncStorage.getItem('@orders')
  console.log('🔍 ORDERS:', orders ? JSON.parse(orders).length : 'NONE')
  console.log('🔍 ORDERS DATA:', orders ? JSON.parse(orders) : 'EMPTY')
}
checkOrders()

  if (!ready) {
    return (
      <View style={{flex:1, justifyContent:'center', alignItems:'center', backgroundColor:'#FEF1A8'}}>
        <ActivityIndicator size="large" color="#C41E1E" />
      </View>
    )
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <UserSettingsProvider>
          <TabStateProvider>
            <Stack screenOptions={{ headerShown: false }} />
          </TabStateProvider>
        </UserSettingsProvider>
      </AppProvider>
    </QueryClientProvider>
  )
}