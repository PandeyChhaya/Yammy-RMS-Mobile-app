import AsyncStorage from '@react-native-async-storage/async-storage'
import { useRouter } from 'expo-router'
import { Eye, EyeOff, Lock, Mail, Utensils } from 'lucide-react-native'
import { useState } from 'react'
import {
  Alert,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'

const { height } = Dimensions.get('window')

const C = {
  espresso:    '#1C1008',
  roast:       '#3D2010',
  clay:        '#7A4528',
  latte:       '#C8956A',
  cream:       '#FDF6EC',
  parchment:   '#F5E9D4',
  vellum:      '#EDD9BC',
  brass:       '#B5822A',
  brassLight:  '#F7EDD8',
  brassBorder: '#DEC07A',
  sage:        '#3B6E52',
  sageLight:   '#EBF4EE',
  sageBorder:  '#9FCFB4',
  terracotta:  '#A03020',
  tcLight:     '#FAECEA',
  tcBorder:    '#E8A898',
  onDark:      '#FDF6EC',
}

const radius = { xs: 6, sm: 10, md: 14, lg: 18, pill: 100 }

const API_URL = 'http://192.168.1.71:5000/api'

export default function Login() {
  const router = useRouter()

  const [emailText, setEmailText]           = useState('')
  const [passwordText, setPasswordText]     = useState('')
  const [showingPassword, setShowingPassword] = useState(false)
  const [isProcessing, setIsProcessing]     = useState(false)

  const doLogin = async () => {
    if (!emailText.trim() || !passwordText.trim()) {
      Alert.alert('Oops', 'Fill in your email and password first')
      return
    }

    setIsProcessing(true)

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_email:    emailText.trim(),
          user_password: passwordText.trim(),
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Login didnt work')
      }

      await AsyncStorage.setItem('@accessToken',  result.accessToken)
      await AsyncStorage.setItem('@refreshToken', result.refreshToken)

      router.replace('/modules/Dashboard')

    } catch (err: any) {
      Alert.alert('Could not log in', err.message || 'Wrong email or password maybe?')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <View style={styles.container}>

      {/* Top Zone */}
      <View style={styles.topZone}>
        <View style={styles.patternOverlay}>
          {Array.from({ length: 40 }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  left: `${(i % 8) * 12.5}%`,
                  top:  `${Math.floor(i / 8) * 20}%`,
                },
              ]}
            />
          ))}
        </View>

        <View style={styles.logoBadge}>
          <Utensils size={36} color={C.cream} />
        </View>

        <Text style={styles.appTitle}>Yammy</Text>
        <Text style={styles.appSub}>POS</Text>
      </View>

      {/* Login Card */}
      <View style={styles.loginCard}>
        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.cardContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

          <View style={styles.headingArea}>
            <Text style={styles.welcomeText}>Welcome Back</Text>
            <Text style={styles.welcomeSub}>Sign in to your account</Text>
          </View>

          {/* Email */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Email</Text>
            <View style={styles.inputWrapper}>
              <Mail size={18} color={C.latte} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="you@restaurant.com"
                placeholderTextColor={C.latte}
                value={emailText}
                onChangeText={setEmailText}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
            </View>
          </View>

          {/* Password */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Password</Text>
            <View style={styles.inputWrapper}>
              <Lock size={18} color={C.latte} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor={C.latte}
                value={passwordText}
                onChangeText={setPasswordText}
                secureTextEntry={!showingPassword}
                autoComplete="password"
              />
              <TouchableOpacity
                onPress={() => setShowingPassword(!showingPassword)}
                style={styles.eyeButton}
              >
                {showingPassword
                  ? <EyeOff size={18} color={C.latte} />
                  : <Eye    size={18} color={C.latte} />}
              </TouchableOpacity>
            </View>
          </View>

          {/* Forgot */}
          <TouchableOpacity style={styles.forgotBtn}>
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>

          {/* Sign In */}
          <TouchableOpacity
            style={[styles.signInBtn, isProcessing && { opacity: 0.6 }]}
            onPress={doLogin}
            disabled={isProcessing}
            activeOpacity={0.85}
          >
            <Text style={styles.signInText}>
              {isProcessing ? 'Signing In...' : 'Sign In'}
            </Text>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Create Account */}
          <TouchableOpacity
            style={styles.guestBtn}
            onPress={() => router.push('/modules/auth/signup')}
          >
            <Text style={styles.guestText}>Create New Account</Text>
          </TouchableOpacity>

        </ScrollView>
      </View>

      <Text style={styles.versionText} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.cream,
  },

  // Top zone
  topZone: {
    height: height * 0.30,
    backgroundColor: C.espresso,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    shadowColor: C.espresso,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  patternOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    opacity: 0.06,
  },
  dot: {
    position: 'absolute',
    width: 3, height: 3,
    borderRadius: 2,
    backgroundColor: C.cream,
  },
  logoBadge: {
    width: 72, height: 72,
    borderRadius: radius.md,
    backgroundColor: C.brass,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: C.brassBorder,
    shadowColor: C.brass,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  appTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: C.cream,
    letterSpacing: 0.6,
  },
  appSub: {
    fontSize: 11,
    color: C.latte,
    fontWeight: '500',
    letterSpacing: 0.8,
    marginTop: 3,
  },

  // Login card
  loginCard: {
    flex: 1,
    backgroundColor: C.parchment,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    marginTop: -20,
    marginHorizontal: 12,
    borderWidth: 1.5,
    borderColor: C.vellum,
    shadowColor: C.espresso,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
  },
  scrollArea: {
    flex: 1,
  },
  cardContent: {
    padding: 24,
    paddingTop: 36,
    paddingBottom: 40,
  },

  
  headingArea: {
    marginBottom: 28,
  },
  welcomeText: {
    fontSize: 26,
    fontWeight: '900',
    color: C.espresso,
    marginBottom: 5,
    letterSpacing: 0.3,
  },
  welcomeSub: {
    fontSize: 14,
    color: C.clay,
    fontWeight: '500',
    letterSpacing: 0.2,
  },

 

  inputContainer: {
    marginBottom: 18,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: C.clay,
    marginBottom: 8,
    marginLeft: 2,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.cream,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: C.vellum,
    paddingHorizontal: 14,
    height: 52,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: C.espresso,
  },
  eyeButton: {
    padding: 4,
  },

  
  forgotBtn: {
    alignSelf: 'flex-end',
    marginBottom: 24,
    marginTop: -6,
  },
  forgotText: {
    fontSize: 12,
    color: C.brass,
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  
  signInBtn: {
    backgroundColor: C.brass,
    height: 52,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    width: '75%',
    alignSelf: 'center',
    shadowColor: C.brass,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  signInText: {
    color: C.cream,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 22,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: C.vellum,
  },
  dividerText: {
    marginHorizontal: 14,
    fontSize: 12,
    color: C.latte,
    fontWeight: '500',
  },

  
  guestBtn: {
    height: 52,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: C.brassBorder,
    backgroundColor: C.brassLight,
    alignItems: 'center',
    justifyContent: 'center',
    width: '75%',
    alignSelf: 'center',
  },
  guestText: {
    fontSize: 14,
    color: C.roast,
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  versionText: {
    textAlign: 'center',
    fontSize: 11,
    color: C.latte,
    paddingVertical: 14,
  },
})