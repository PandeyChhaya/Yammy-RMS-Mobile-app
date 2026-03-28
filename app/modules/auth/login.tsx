import AsyncStorage from '@react-native-async-storage/async-storage'
import { useRouter } from 'expo-router'
import { Eye, EyeOff, Lock, Mail } from 'lucide-react-native'
import { useState } from 'react'
import {
  Alert,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'

const { height } = Dimensions.get('window')

const COLORS = {
  brand: '#C41E1E',
  gold: '#C4933E',
  background: '#FDFAF3',
  surface: '#FFFFFF',
  textPrimary: '#1A1A1A',
  textSecondary: '#6B5E3A',
  textMuted: '#A89870',
  border: '#EDE0B8',
  inputBg: '#FFFDF7',
}

const API_URL = 'http://10.23.1.14:3000/api'

export default function Login() {
  const router = useRouter()
  
  const [emailText, setEmailText] = useState('')
  const [passwordText, setPasswordText] = useState('')
  const [showingPassword, setShowingPassword] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

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
          email: emailText.trim(),
          password: passwordText.trim(),
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Login didnt work')
      }

      await AsyncStorage.setItem('@auth_token', result.token)
      await AsyncStorage.setItem('@user', JSON.stringify(result.user))

      router.replace('./index')
      
    } catch (err: any) {
      Alert.alert('Could not log in', err.message || 'Wrong email or password maybe?')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <View style={styles.container}>
      {/* Zone 1 — Brand Header */}
      <View style={styles.topZone}>
        <View style={styles.patternOverlay}>
          {Array.from({ length: 40 }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  left: `${(i % 8) * 12.5}%`,
                  top: `${Math.floor(i / 8) * 20}%`,
                },
              ]}
            />
          ))}
        </View>

        <View style={styles.logoBadge}>
          <Image
            source={require('../../../assets/images/Yammy.png')}
            style={{ width: 162, height: 88, borderRadius: 44 }}
            resizeMode="cover"
          />
        </View>

        <Text style={styles.appTitle}>Yammy</Text>

       
      </View>

      {/* Zone 2 — Login Card */}
      <View style={styles.loginCard}>
        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.cardContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* heading */}
          <View style={styles.headingArea}>
            <Text style={styles.welcomeText}>Welcome Back</Text>
            <Text style={styles.welcomeSub}>Sign in to your account</Text>
          </View>

          {/* email */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Email</Text>
            <View style={styles.inputWrapper}>
              <Mail size={18} color={COLORS.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="you@restaurant.com"
                placeholderTextColor={COLORS.textMuted}
                value={emailText}
                onChangeText={setEmailText}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
            </View>
          </View>

          {/* password */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Password</Text>
            <View style={styles.inputWrapper}>
              <Lock size={18} color={COLORS.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor={COLORS.textMuted}
                value={passwordText}
                onChangeText={setPasswordText}
                secureTextEntry={!showingPassword}
                autoComplete="password"
              />
              <TouchableOpacity
                onPress={() => setShowingPassword(!showingPassword)}
                style={styles.eyeButton}
              >
                {showingPassword ? (
                  <EyeOff size={18} color={COLORS.textMuted} />
                ) : (
                  <Eye size={18} color={COLORS.textMuted} />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* forgot password */}
          <TouchableOpacity style={styles.forgotBtn}>
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>

          {/* sign in button */}
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

          {/* divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* create account button */}
          <TouchableOpacity
            style={styles.guestBtn}
            onPress={() => router.push('/modules/signup/signup')}
          >
            <Text style={styles.guestText}>Create New Account</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* version */}
      <Text style={styles.versionText}></Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // zone 1
  topZone: {
    height: height * 0.28,
    backgroundColor: COLORS.brand,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'visible',
  },
  patternOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.08,
  },
  dot: {
    position: 'absolute',
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#000',
  },
  logoBadge: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: COLORS.gold,
    marginBottom: 16,
  },
  appTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.surface,
    letterSpacing: 0.5,
  },
  wave: {
    position: 'absolute',
    bottom: -1,
    left: 0,
    right: 0,
  },

  // zone 2
  loginCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -30,
    marginHorizontal: 20,
    shadowColor: '#000',
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
    paddingTop: 48,
    paddingBottom: 40,
  },

  // heading
  headingArea: {
    marginBottom: 32,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  welcomeSub: {
    fontSize: 15,
    color: COLORS.textMuted,
    fontWeight: '400',
  },

  // inputs
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 8,
    marginLeft: 2,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBg,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
    height: 54,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  eyeButton: {
    padding: 4,
  },

  // forgot password
  forgotBtn: {
    alignSelf: 'flex-end',
    marginBottom: 28,
    marginTop: -8,
  },
  forgotText: {
    fontSize: 13,
    color: COLORS.brand,
    fontWeight: '600',
  },

  // sign in button
  signInBtn: {
    backgroundColor: COLORS.brand,
    height: 54,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    width: '75%',
    alignSelf: 'center',
    shadowColor: COLORS.brand,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  signInText: {
    color: COLORS.surface,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // divider
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: '500',
  },

  // create account button
  guestBtn: {
    height: 54,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    width: '75%',
    alignSelf: 'center',
  },
  guestText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },

  // version
  versionText: {
    textAlign: 'center',
    fontSize: 11,
    color: COLORS.textMuted,
    paddingVertical: 16,
    fontWeight: '400',
  },
})