import { useRouter } from 'expo-router'
import { useEffect } from 'react'
import { Image, StyleSheet, View } from 'react-native'


export default function Splash() {
  const router = useRouter()

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace('/modules/auth/login')
    }, 4000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <View style={s.root}>
      <Image
        source={require('../../assets/images/yammy.png')}
        style={s.logo}
        resizeMode="contain"
      />
    </View>
  )
}


const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#1C1008',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 250,
    height: 250,
  },
})