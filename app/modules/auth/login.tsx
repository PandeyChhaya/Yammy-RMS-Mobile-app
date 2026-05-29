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

const C = {
  bg:        '#0A0A0A',
  card:      '#1A1A1A',
  inner:     '#2C2C2C',
  border:    '#2E2E2E',
  accent:    '#FF6B2C',
  success:   '#22C55E',
  white:     '#FFFFFF',
  muted:     '#777777',
  mutedDark: '#444444',
  label:     '#999999',
}

const R = { md: 14, lg: 18, xl: 24 }

export default function Login() {
  const router = useRouter()

  const [emailText,       setEmailText]       = useState('')
  const [passwordText,    setPasswordText]    = useState('')
  const [showingPassword, setShowingPassword] = useState(false)
  const [isProcessing,    setIsProcessing]    = useState(false)
  const [emailFocused,    setEmailFocused]    = useState(false)
  const [passFocused,     setPassFocused]     = useState(false)

  const doLogin = async () => {
  if (!emailText.trim() || !passwordText.trim()) {
    Alert.alert('Oops', 'Fill in your email and password first')
    return
  }
  setIsProcessing(true)
  try {
    const result = await authService.login(emailText.trim(), passwordText.trim())
    await AsyncStorage.setItem('@userName',  result.user_name)
    await AsyncStorage.setItem('@userEmail', result.user_email ?? '')
    await AsyncStorage.setItem('@userRole',  result.user_role)
    await AsyncStorage.setItem('@userId',    String(result.user_id))

    if (result.user_role === 'Customer') {
      router.replace('/modules/customer/customer_Dashboard')
    } else if (result.user_role === 'Super Admin') {
      router.replace('/superAdmin/superAdmin')
    } else {
      router.replace('/modules/Dashboard')
    }
  } catch (err: any) {
    Alert.alert('Could not log in', err.message || 'Wrong email or password maybe?')
  } finally {
    setIsProcessing(false)
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
        {/* ── Top logo zone ── */}
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
            <View style={styles.greenDot} />
            <Text style={styles.statusTxt}>All systems operational</Text>
          </View>
        </View>

        {/* ── Login card ── */}
        <View style={styles.loginCard}>
          <View style={styles.cardContent}>

            <View style={styles.headingArea}>
              <Text style={styles.welcomeText}>Welcome Back</Text>
              <Text style={styles.welcomeSub}>Sign in to your account</Text>
            </View>

            {/* Email */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
              <View style={[styles.inputWrapper, emailFocused && styles.inputFocused]}>
                <View style={styles.iconPrefix}>
                  <Mail size={15} color={emailFocused ? C.accent : C.muted} />
                </View>
                <View style={styles.inputDivider} />
                <TextInput
                  style={styles.input}
                  placeholder="user@restaurant.com"
                  placeholderTextColor={C.mutedDark}
                  value={emailText}
                  onChangeText={setEmailText}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>PASSWORD</Text>
              <View style={[styles.inputWrapper, passFocused && styles.inputFocused]}>
                <View style={styles.iconPrefix}>
                  <Lock size={15} color={passFocused ? C.accent : C.muted} />
                </View>
                <View style={styles.inputDivider} />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor={C.mutedDark}
                  value={passwordText}
                  onChangeText={setPasswordText}
                  secureTextEntry={!showingPassword}
                  autoComplete="password"
                  onFocus={() => setPassFocused(true)}
                  onBlur={() => setPassFocused(false)}
                />
                <TouchableOpacity
                  onPress={() => setShowingPassword(!showingPassword)}
                  style={styles.eyeButton}
                >
                  {showingPassword
                    ? <EyeOff size={15} color={C.muted} />
                    : <Eye    size={15} color={C.muted} />}
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity style={styles.forgotBtn}>
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>

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

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              style={styles.guestBtn}
              onPress={() => router.push('/modules/auth/signup')}
            >
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
  container: { flex: 1, backgroundColor: C.bg },

  blobTR: {
    position: 'absolute', top: -70, right: -70,
    width: 200, height: 200, borderRadius: 100,
    backgroundColor: C.accent, opacity: 0.07,
  },
  blobBL: {
    position: 'absolute', bottom: 100, left: -90,
    width: 240, height: 240, borderRadius: 120,
    backgroundColor: C.accent, opacity: 0.05,
  },

  // ScrollView fills the screen, logo + card sit inside it naturally
  scroll: {
    flexGrow: 1,
    paddingBottom: 24,
  },

  // Fixed height logo zone — not flex, so it doesn't compete with the card
  topZone: {
    height: height * 0.28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBox: {
    width: 72, height: 72, borderRadius: 18,
    backgroundColor: C.card, borderWidth: 1, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  logoImg: { width: 52, height: 52 },
  brand: {
    fontSize: 28, fontWeight: '900', color: C.white,
    letterSpacing: 10, marginBottom: 10,
  },
  statusPill: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.card, borderWidth: 1, borderColor: C.border,
    borderRadius: 100, paddingHorizontal: 12, paddingVertical: 5, gap: 6,
  },
  greenDot:  { width: 6, height: 6, borderRadius: 3, backgroundColor: C.success },
  statusTxt: { fontSize: 11, color: C.muted, letterSpacing: 0.3 },

  // Card sits below logo — no flex:1, sized by its content
  loginCard: {
    marginHorizontal: 20,
    backgroundColor: C.card,
    borderRadius: R.xl,
    borderWidth: 1,
    borderColor: C.border,
  },
  cardContent: {
    padding: 24,
    paddingTop: 30,
    paddingBottom: 32,
  },

  headingArea:  { marginBottom: 26 },
  welcomeText: {
    fontSize: 24, fontWeight: '900', color: C.white,
    marginBottom: 4, letterSpacing: 0.3,
  },
  welcomeSub: { fontSize: 13, color: C.muted },

  inputContainer: { marginBottom: 18 },
  inputLabel: {
    fontSize: 10, fontWeight: '800', color: C.label,
    marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1.5,
  },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.inner, borderRadius: R.md,
    borderWidth: 1, borderColor: C.border, height: 50, overflow: 'hidden',
  },
  inputFocused:  { borderColor: C.accent },
  iconPrefix:    { width: 44, alignItems: 'center', justifyContent: 'center' },
  inputDivider:  { width: 1, height: 20, backgroundColor: C.border, marginRight: 12 },
  input:         { flex: 1, fontSize: 14, color: C.white, paddingRight: 12 },
  eyeButton:     { paddingHorizontal: 14 },

  forgotBtn:  { alignSelf: 'flex-end', marginBottom: 24, marginTop: -6 },
  forgotText: { fontSize: 12, color: C.accent, fontWeight: '700' },

  signInBtn: {
    backgroundColor: C.accent,
    height: 50, borderRadius: R.md,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: C.accent, shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.35, shadowRadius: 10, elevation: 4,
  },
  signInText: { color: '#fff', fontSize: 15, fontWeight: '800', letterSpacing: 0.3 },

  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 22 },
  dividerLine: { flex: 1, height: 1, backgroundColor: C.border },
  dividerText: { marginHorizontal: 14, fontSize: 12, color: C.mutedDark },

  guestBtn: {
    height: 50, borderRadius: R.md,
    borderWidth: 1, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center',
  },
  guestText: { fontSize: 14, color: C.label, fontWeight: '700' },

  versionText: {
    textAlign: 'center', fontSize: 10,
    color: C.mutedDark, letterSpacing: 0.8,
    paddingVertical: 20,
  },
})
