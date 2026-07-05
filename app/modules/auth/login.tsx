import AsyncStorage from '@react-native-async-storage/async-storage'
import { useRouter } from 'expo-router'
import { Eye, EyeOff, Lock, Mail } from 'lucide-react-native'
import { useState } from 'react'
import {
  Alert,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native'
import { authService } from './services/auth.service'

const { height } = Dimensions.get('window')

const colors = {
  bg: '#0A0A0A',
  card: '#1A1A1A',
  inner: '#2C2C2C',
  border: '#2E2E2E',
  accent: '#FF6B2C',
  success: '#22C55E',
  white: '#FFFFFF',
  muted: '#777777',
  mutedDark: '#444444',
  label: '#999999',
}

const radius = { md: 14, lg: 18, xl: 24 }

export default function Login() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [emailFocused, setEmailFocused] = useState(false)
  const [passFocused, setPassFocused] = useState(false)

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Oops', 'Fill in your email and password first')
      return
    }

    setLoading(true)

    try {
      const result = await authService.login(email.trim(), password.trim())

      await AsyncStorage.setItem('@userName', result.user_name)
      await AsyncStorage.setItem('@userEmail', result.user_email ?? '')
      await AsyncStorage.setItem('@userRole', result.user_role)
      await AsyncStorage.setItem('@userId', String(result.user_id))
      await AsyncStorage.setItem('@restaurantId', result.restaurant_id != null ? String(result.restaurant_id) : '')

      if (result.user_role === 'Customer') {
        router.replace('/modules/customer/components/browseRestaurant')
      } else if (result.user_role === 'Super Admin') {
        router.replace('/superAdmin/superAdmin')
      } else if (result.user_role === 'Admin' && !result.restaurant_id) {
        router.replace('/modules/restaurant/createRestaurant')
      } else {
        router.replace('/modules/Dashboard')
      }
    } catch (err: any) {
      Alert.alert('Could not log in', err.message || 'Wrong email or password maybe?')
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.blobTR} />
      <View style={styles.blobBL} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topZone}>
          <View style={styles.iconBox}>
            <Image
              source={require('../../../assets/images/yammy.png')}
              style={styles.logoImg}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.brand}>YAMMY</Text>
          <View style={styles.statusPill}>
            
            <Text style={styles.statusTxt}>Your restaurant buddy</Text>
          </View>
        </View>

        <View style={styles.loginCard}>
          <View style={styles.cardContent}>
            <View style={styles.headingArea}>
              <Text style={styles.welcomeText}>Welcome Back</Text>
              <Text style={styles.welcomeSub}>Sign in to your account</Text>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
              <View style={[styles.inputWrapper, emailFocused && styles.inputFocused]}>
                <View style={styles.iconPrefix}>
                  <Mail size={15} color={emailFocused ? colors.accent : colors.muted} />
                </View>
                <View style={styles.inputDivider} />
                <TextInput
                  style={styles.input}
                  placeholder="user@yammy.com"
                  placeholderTextColor={colors.mutedDark}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>PASSWORD</Text>
              <View style={[styles.inputWrapper, passFocused && styles.inputFocused]}>
                <View style={styles.iconPrefix}>
                  <Lock size={15} color={passFocused ? colors.accent : colors.muted} />
                </View>
                <View style={styles.inputDivider} />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor={colors.mutedDark}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoComplete="password"
                  onFocus={() => setPassFocused(true)}
                  onBlur={() => setPassFocused(false)}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                  {showPassword ? (
                    <EyeOff size={15} color={colors.muted} />
                  ) : (
                    <Eye size={15} color={colors.muted} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity style={styles.forgotBtn}>
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.signInBtn, loading && { opacity: 0.6 }]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              <Text style={styles.signInText}>{loading ? 'Signing In...' : 'Sign In'}</Text>
            </TouchableOpacity>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity style={styles.guestBtn} onPress={() => router.push('/modules/auth/signup')}>
              <Text style={styles.guestText}>Create New Account</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.versionText}>Powered by YAMMY · Restaurant OS</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  blobTR: {
    position: 'absolute',
    top: -70,
    right: -70,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: colors.accent,
    opacity: 0.07,
  },
  blobBL: {
    position: 'absolute',
    bottom: 100,
    left: -90,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: colors.accent,
    opacity: 0.05,
  },
  scroll: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  topZone: {
    height: height * 0.28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBox: {
    width: 72,
    height: 72,
    borderRadius: 18,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  logoImg: {
    width: 52,
    height: 52,
  },
  brand: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.white,
    letterSpacing: 10,
    marginBottom: 10,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 100,
    paddingHorizontal: 12,
    paddingVertical: 5,
    gap: 6,
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.success,
  },
  statusTxt: {
    fontSize: 11,
    color: colors.muted,
    letterSpacing: 0.3,
  },
  loginCard: {
    marginHorizontal: 20,
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardContent: {
    padding: 24,
    paddingTop: 30,
    paddingBottom: 32,
  },
  headingArea: {
    marginBottom: 26,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.white,
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  welcomeSub: {
    fontSize: 13,
    color: colors.muted,
  },
  inputContainer: {
    marginBottom: 18,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.label,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inner,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    height: 50,
    overflow: 'hidden',
  },
  inputFocused: {
    borderColor: colors.accent,
  },
  iconPrefix: {
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputDivider: {
    width: 1,
    height: 20,
    backgroundColor: colors.border,
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: colors.white,
    paddingRight: 12,
  },
  eyeButton: {
    paddingHorizontal: 14,
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginBottom: 24,
    marginTop: -6,
  },
  forgotText: {
    fontSize: 12,
    color: colors.accent,
    fontWeight: '700',
  },
  signInBtn: {
    backgroundColor: colors.accent,
    height: 50,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  signInText: {
    color: '#fff',
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
    backgroundColor: colors.border,
  },
  dividerText: {
    marginHorizontal: 14,
    fontSize: 12,
    color: colors.mutedDark,
  },
  guestBtn: {
    height: 50,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestText: {
    fontSize: 14,
    color: colors.label,
    fontWeight: '700',
  },
  versionText: {
    textAlign: 'center',
    fontSize: 10,
    color: colors.mutedDark,
    letterSpacing: 0.8,
    paddingVertical: 20,
  },
})