import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Stack } from 'expo-router'
import { useEffect, useState } from 'react'
import { ActivityIndicator, View } from 'react-native'
import { AppProvider } from '../shared/contexts/AppContext'
import { TabStateProvider } from '../shared/contexts/TabStateManager'; // ✅ ADD THIS
import { UserSettingsProvider } from '../shared/contexts/UserSettingsContext'
import { seedDatabase } from './modules/pos/utils/seedData'

const queryClient = new QueryClient()

export default function RootLayout() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const initialize = async () => {
      await seedDatabase()
      setReady(true)
    }
    initialize()
  }, [])

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
          <TabStateProvider>  {/* ✅ ADD THIS */}
            <Stack screenOptions={{ headerShown: false }} />
          </TabStateProvider>  {/* ✅ ADD THIS */}
        </UserSettingsProvider>
      </AppProvider>
    </QueryClientProvider>
  )
}