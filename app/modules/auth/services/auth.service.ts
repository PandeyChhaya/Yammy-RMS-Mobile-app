import AsyncStorage from '@react-native-async-storage/async-storage'

const BASE_URL = 'http:// 192.168.1.71:5000/api/auth'

export  const authService = {

  getToken: async (): Promise<string | null> => {
    const token = await AsyncStorage.getItem('@accessToken')
    return token
  },

  login: async (email: string, password: string) => {
    const response = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_email: email,
        user_password: password,
      }),
    })

    const data = await response.json()
    console.log('LOGIN RESPONSE:', data)

    if (!response.ok) throw new Error(data.message)

    await AsyncStorage.setItem('@accessToken', data.accessToken)
    await AsyncStorage.setItem('@refreshToken', data.refreshToken)

    return data
  },

  logout: async (): Promise<void> => {
    const userId = await AsyncStorage.getItem('user_id')

    await fetch(`${BASE_URL}/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user_id: userId }),
    })

    await AsyncStorage.removeItem('@accessToken')
    await AsyncStorage.removeItem('@refreshToken')
  },

  register: async (
    user_name: string,
    user_email: string,
    user_password: string,
    user_role: string
  ) => {
    const response = await fetch(`${BASE_URL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_name,
        user_email,
        user_password,
        user_role,
      }),
    })

    const data = await response.json()
    return data
  },
}