import AsyncStorage from '@react-native-async-storage/async-storage'

const BASE_URL = 'http://192.168.1.71:5000/api/auth'

export const authService = {

  getToken: async (): Promise<string | null> => {
    return await AsyncStorage.getItem('@accessToken')
  },

  getRestaurantId: async (): Promise<number | null> => {
    const val = await AsyncStorage.getItem('@restaurantId')
    return val ? Number(val) : null
  },

  setRestaurantId: async (id: number | null): Promise<void> => {
    if (id === null) {
      await AsyncStorage.removeItem('@restaurantId')
    } else {
      await AsyncStorage.setItem('@restaurantId', String(id))
    }
  },

  login: async (email: string, password: string) => {
    const response = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_email: email, user_password: password }),
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.message)
    await AsyncStorage.setItem('@accessToken', data.accessToken)
    await AsyncStorage.setItem('@refreshToken', data.refreshToken)
    return data
  },

  logout: async (): Promise<void> => {
    const userId = await AsyncStorage.getItem('@userId')
    await fetch(`${BASE_URL}/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId }),
    })
    await AsyncStorage.removeItem('@accessToken')
    await AsyncStorage.removeItem('@refreshToken')
    await AsyncStorage.removeItem('@userId')
    await AsyncStorage.removeItem('@userRole')
    await AsyncStorage.removeItem('@userName')
    await AsyncStorage.removeItem('@userEmail')
    await AsyncStorage.removeItem('@restaurantId')
  },

  register: async (
    user_name: string,
    user_email: string,
    user_password: string,
    user_role: string,
  ) => {
    const response = await fetch(`${BASE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_name, user_email, user_password, user_role }),
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.message)
    return data
  },
}