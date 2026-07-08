import AsyncStorage from '@react-native-async-storage/async-storage'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Stack } from 'expo-router'
import { useEffect, useState } from 'react'
import { ActivityIndicator, View } from 'react-native'
import { AppProvider } from '../shared/contexts/AppContext'
import { TabStateProvider } from '../shared/contexts/TabStateManager'
import { UserSettingsProvider } from '../shared/contexts/UserSettingsContext'
import { seedDatabase } from './modules/pos/utils/seedData'
import { RestaurantProvider } from './modules/shared/context/RestaurantContext'

const queryClient = new QueryClient()

export default function RootLayout() {
  const [ready, setReady] = useState(false)
useEffect(() => {
  const initialize = async () => {
    try {
      await AsyncStorage.multiRemove(['@products', '@categories', '@tables', '@data_seeded'])
      await seedDatabase()
    } catch (err) {
      console.error('APP INIT FAILED:', err)
    } finally {
      setReady(true)
    }
  }
  initialize()
}, [])
  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FEF1A8' }}>
        <ActivityIndicator size="large" color="#C41E1E" />
      </View>
    )
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <UserSettingsProvider>
          <TabStateProvider>
            <RestaurantProvider>
              <Stack screenOptions={{ headerShown: false }} />
            </RestaurantProvider>
          </TabStateProvider>
        </UserSettingsProvider>
      </AppProvider>
    </QueryClientProvider>
  )
}