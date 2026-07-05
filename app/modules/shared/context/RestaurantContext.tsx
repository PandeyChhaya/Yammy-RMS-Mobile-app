import AsyncStorage from '@react-native-async-storage/async-storage'
import { createContext, ReactNode, useContext, useEffect, useState } from 'react'

interface RestaurantContextType {
  selectedRestaurantId: number | null
  setSelectedRestaurantId: (id: number | null) => void
}

const RestaurantContext = createContext<RestaurantContextType | undefined>(undefined)

export function RestaurantProvider({ children }: { children: ReactNode }) {
  const [selectedRestaurantId, setSelectedRestaurantIdState] = useState<number | null>(null)

  useEffect(() => {
    AsyncStorage.getItem('@selectedRestaurantId').then((val) => {
      if (val) setSelectedRestaurantIdState(Number(val))
    })
  }, [])

  const setSelectedRestaurantId = (id: number | null) => {
    setSelectedRestaurantIdState(id)
    if (id === null) {
      AsyncStorage.removeItem('@selectedRestaurantId')
    } else {
      AsyncStorage.setItem('@selectedRestaurantId', String(id))
    }
  }

  return (
    <RestaurantContext.Provider value={{ selectedRestaurantId, setSelectedRestaurantId }}>
      {children}
    </RestaurantContext.Provider>
  )
}

export function useRestaurant() {
  const context = useContext(RestaurantContext)
  if (context === undefined) {
    throw new Error('useRestaurant must be used within a RestaurantProvider')
  }
  return context
}