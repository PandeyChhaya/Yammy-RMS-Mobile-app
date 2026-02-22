import { Link } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useEffect, useRef, useState } from 'react'
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

export default function Index() {
  const [showMenu, setShowMenu] = useState(false)
  const scaleAnim = useRef(new Animated.Value(1)).current
  const fadeAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    // Scale up logo
    Animated.timing(scaleAnim, {
      toValue: 1.7,
      duration: 1300,
      useNativeDriver: true,
    }).start()

    // After 3 seconds, fade in menu
    const timer = setTimeout(() => {
      setShowMenu(true)
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start()
    }, 6000)

    return () => clearTimeout(timer)
  }, [])

  if (!showMenu) {
    // Splash screen
    return (
      <View style={styles.splashContainer}>
        <StatusBar style="light" />
        <Animated.Image
          source={require('../assets/images/Yammy.png')}
          style={[
            styles.logo,
            { transform: [{ scale: scaleAnim }] }
          ]}
          resizeMode="contain"
        />
      </View>
    )
  }

  // Main menu
  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <Text style={styles.title}>Yammy Fresh</Text>
        <Text style={styles.subtitle}>Restaurant Management</Text>
        
        <View style={styles.menu}>
          <Link href="/modules/tiktok/tiktok" asChild>
            <TouchableOpacity style={styles.button}>
              <Text style={styles.buttonText}>Tiktok</Text>
            </TouchableOpacity>
          
          
        </Link>
       
            
       
      
            
            
        
          
          
       
        </View>
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: '#FEF1A8',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 80,
  },
  logo: {
    width: 350,
    height: 310,
  },
  container: {
    flex: 1,
    backgroundColor: '#FEF1A8',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  content: {
    width: '100%',
    alignItems: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: '#C41E1E',
    marginBottom: 8,
    fontFamily: 'Inter-Bold',
  },
  subtitle: {
    fontSize: 16,
    color: '#5C5436',
    marginBottom: 40,
    fontFamily: 'Inter',
  },
  menu: {
    width: '100%',
    gap: 12,
  },
  button: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8D88A',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Inter',
  },
})