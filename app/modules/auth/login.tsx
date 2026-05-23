import AsyncStorage from '@react-native-async-storage/async-storage'
import { useRouter } from 'expo-router'
import { Eye, EyeOff } from 'lucide-react-native'
import { useState } from 'react'
import {
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { authService } from './services/auth.service'

const { width, height } = Dimensions.get('window')

const C = {
  black:      '#0A0A0A',
  charcoal:   '#1A1A1A',
  graphite:   '#2C2C2C',
  steel:      '#3D3D3D',
  muted:      '#6B6B6B',
  border:     '#2E2E2E',
  card:       '#1E1E1E',
  orange:     '#FF6B2C',
  orangeTint: '#2A1A10',
  white:      '#FFFFFF',
  offWhite:   '#F0F0F0',
  dim:        '#A0A0A0',
  success:    '#22C55E',
}

export default function Login() {
  const router = useRouter()
  const [emailText, setEmailText]             = useState('')
  const [passwordText, setPasswordText]       = useState('')
  const [showingPassword, setShowingPassword] = useState(false)
  const [isProcessing, setIsProcessing]       = useState(false)
  const [focusedField, setFocusedField]       = useState<string | null>(null)

  const doLogin = async () => {
    if (!emailText.trim() || !passwordText.trim()) {
      Alert.alert('Missing fields', 'Please enter your email and password.')
      return
    }
    setIsProcessing(true)
    try {
      const result = await authService.login(emailText.trim(), passwordText.trim())
      await AsyncStorage.setItem('@userName', result.user_name)
      await AsyncStorage.setItem('@userRole', result.user_role)
      if (result.user_role === 'Customer') {
        router.replace('/modules/customer/customer_Dashboard')
      } else if (result.user_role === 'Super Admin') {
        router.replace('/superAdmin/superAdmin')
      } else {
        router.replace('/modules/Dashboard')
      }
    } catch (err: any) {
      Alert.alert('Login failed', err.message || 'Wrong email or password.')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="light-content" backgroundColor={C.black} />

      <View style={styles.blobOuter} />
      <View style={styles.blobInner} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logoArea}>
          <View style={styles.iconRing}>
            <View style={styles.iconDot} />
            <Text style={styles.iconEmoji}>🍽</Text>
          </View>
          <Text style={styles.brand}>YAMMY</Text>
          <View style={styles.pill}>
            <View style={styles.pillDot} />
            <Text style={styles.pillText}>Restaurant Management</Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Welcome back</Text>
            <Text style={styles.cardSub}>Sign in to your workspace</Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <View style={[styles.inputBox, focusedField === 'email' && styles.inputFocused]}>
              <Text style={styles.prefix}>@</Text>
              <TextInput
                style={styles.input}
                placeholder="you@restaurant.com"
                placeholderTextColor={C.steel}
                value={emailText}
                onChangeText={setEmailText}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
              />
            </View>
          </View>

         <View style={styles.field}>
            <Text style={styles.label}>Password</Text>
            <View style={[styles.inputBox, focusedField === 'password' && styles.inputFocused]}>
              <Text style={styles.prefix}>••</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor={C.steel}
                value={passwordText}
                onChangeText={setPasswordText}
                secureTextEntry={!showingPassword}
                autoComplete="password"
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
              />
              <TouchableOpacity onPress={() => setShowingPassword(p => !p)} style={styles.eye}>
                {showingPassword
                  ? <EyeOff size={17} color={C.muted} />
                  : <Eye    size={17} color={C.muted} />}
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity style={styles.forgotRow}>
            <Text style={styles.forgotText}>Forgot password?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.ctaBtn, isProcessing && { opacity: 0.55 }]}
            onPress={doLogin}
            disabled={isProcessing}
            activeOpacity={0.8}
          >
            <Text style={styles.ctaText}>{isProcessing ? 'Signing in...' : 'Sign In'}</Text>
            {!isProcessing && <Text style={styles.ctaArrow}>→</Text>}
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.divLine} />
            <Text style={styles.divLabel}>or</Text>
            <View style={styles.divLine} />
          </View>

          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => router.push('/modules/auth/signup')}
            activeOpacity={0.75}
          >
            <Text style={styles.secondaryText}>Create new account</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <View style={styles.footerDot} />
          <Text style={styles.footerText}>Secure · Encrypted · Private</Text>
          <View style={styles.footerDot} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.black },

  blobOuter: {
    position: 'absolute', top: -80,
    left: width / 2 - 130,
    width: 260, height: 260, borderRadius: 130,
    backgroundColor: C.orange, opacity: 0.10,
  },
  blobInner: {
    position: 'absolute', top: -30,
    left: width / 2 - 65,
    width: 130, height: 130, borderRadius: 65,
    backgroundColor: C.orange, opacity: 0.16,
  },

  scroll: {
    flexGrow: 1,
    paddingHorizontal: 22,
    paddingTop: height * 0.10,
    paddingBottom: 40,
  },

  logoArea: { alignItems: 'center', marginBottom: 38 },
  iconRing: {
    width: 72, height: 72, borderRadius: 22,
    backgroundColor: C.orangeTint,
    borderWidth: 1.5, borderColor: C.orange,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 14,
  },
  iconDot: {
    position: 'absolute', top: 8, right: 8,
    width: 7, height: 7, borderRadius: 4,
    backgroundColor: C.orange,
  },
  iconEmoji: { fontSize: 30 },
  brand: {
    fontSize: 28, fontWeight: '900', color: C.white,
    letterSpacing: 7, marginBottom: 10,
  },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: C.graphite, borderRadius: 100,
    paddingHorizontal: 14, paddingVertical: 5,
    borderWidth: 1, borderColor: C.border,
  },
  pillDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.success },
  pillText: { fontSize: 11, color: C.dim, letterSpacing: 0.4 },

  card: {
    backgroundColor: C.card, borderRadius: 24,
    padding: 24, borderWidth: 1, borderColor: C.border,
  },
  cardHeader: { marginBottom: 26 },
  cardTitle: { fontSize: 24, fontWeight: '800', color: C.white, marginBottom: 4 },
  cardSub: { fontSize: 13, color: C.muted },

  field: { marginBottom: 16 },
  label: {
    fontSize: 11, fontWeight: '700', color: C.muted,
    letterSpacing: 1.1, textTransform: 'uppercase', marginBottom: 8,
  },
  inputBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.graphite, borderRadius: 14,
    borderWidth: 1, borderColor: C.border,
    paddingHorizontal: 16, height: 52,
  },
  inputFocused: { borderColor: C.orange, backgroundColor: C.steel },
  prefix: { fontSize: 15, color: C.orange, marginRight: 10, fontWeight: '700' },
  input: { flex: 1, fontSize: 15, color: C.white },
  eye: { padding: 4 },

  forgotRow: { alignSelf: 'flex-end', marginTop: -4, marginBottom: 22 },
  forgotText: { fontSize: 12, color: C.orange, fontWeight: '600' },

  ctaBtn: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', backgroundColor: C.orange,
    borderRadius: 14, height: 54, gap: 8,
  },
  ctaText: { fontSize: 16, fontWeight: '800', color: C.white, letterSpacing: 0.3 },
  ctaArrow: { fontSize: 18, color: C.white, fontWeight: '700' },

  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  divLine: { flex: 1, height: 1, backgroundColor: C.border },
  divLabel: { marginHorizontal: 12, fontSize: 12, color: C.steel },

  secondaryBtn: {
    height: 52, borderRadius: 14, borderWidth: 1,
    borderColor: C.border, backgroundColor: C.graphite,
    alignItems: 'center', justifyContent: 'center',
  },
  secondaryText: { fontSize: 14, color: C.offWhite, fontWeight: '600' },

  footer: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8, marginTop: 28,
  },
  footerDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: C.steel },
  footerText: { fontSize: 11, color: C.steel, letterSpacing: 1 },
})