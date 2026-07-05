import { useRouter } from 'expo-router'
import { ArrowRight, CheckCircle2, Eye, EyeOff, Lock, Mail, Phone, User } from 'lucide-react-native'
import { useState } from 'react'
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { authService } from './services/auth.service'

const C = {
  bg:        '#0A0A0A',
  card:      '#1A1A1A',
  inner:     '#2C2C2C',
  border:    '#2E2E2E',
  accent:    '#FF6B2C',
  success:   '#22C55E',
  error:     '#EF4444',
  white:     '#FFFFFF',
  muted:     '#777777',
  mutedDark: '#444444',
  label:     '#999999',
}

const R = { md: 14, xl: 24 }

const ROLES = [
  'Admin',
  'Customer',
  
  'Cashier',
  'Waiter',
  'Kitchen Staff',
] as const

type Role = typeof ROLES[number]

const PASSWORD_RULES = [
  { id: 'length',    label: 'At least 8 characters',        test: (p: string) => p.length >= 8 },
  { id: 'uppercase', label: 'One uppercase letter',          test: (p: string) => /[A-Z]/.test(p) },
  { id: 'lowercase', label: 'One lowercase letter',          test: (p: string) => /[a-z]/.test(p) },
  { id: 'number',    label: 'One number',                    test: (p: string) => /[0-9]/.test(p) },
  { id: 'special',   label: 'One special character (!@#$)',  test: (p: string) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p) },
]

export default function Signup() {
  const router = useRouter()

  const [role,      setRole]      = useState<Role>('Customer')
  const [fullName,  setFullName]  = useState('')
  const [email,     setEmail]     = useState('')
  const [phone,     setPhone]     = useState('')
  const [pass1,     setPass1]     = useState('')
  const [pass2,     setPass2]     = useState('')
  const [showPass1, setShowPass1] = useState(false)
  const [showPass2, setShowPass2] = useState(false)
  const [agreed,    setAgreed]    = useState(false)
  const [loading,   setLoading]   = useState(false)
  const [pass1Touched, setPass1Touched] = useState(false)

  const [nameFocused,  setNameFocused]  = useState(false)
  const [emailFocused, setEmailFocused] = useState(false)
  const [phoneFocused, setPhoneFocused] = useState(false)
  const [pass1Focused, setPass1Focused] = useState(false)
  const [pass2Focused, setPass2Focused] = useState(false)

  const passMatch    = pass1.length > 0 && pass1 === pass2
  const passMismatch = pass2.length > 0 && pass1 !== pass2
  const passValid    = PASSWORD_RULES.every(r => r.test(pass1))

  const createAccount = async () => {
    if (!fullName.trim() || !email.trim() || !phone.trim() || !pass1.trim()) {
      Alert.alert('Missing Info', 'Please fill in all the fields')
      return
    }
    if (!passValid) {
      Alert.alert('Weak Password', 'Your password does not meet the requirements')
      return
    }
    if (pass1 !== pass2) {
      Alert.alert('Password Mismatch', 'Your passwords do not match')
      return
    }
    if (!agreed) {
      Alert.alert('Terms Required', 'You need to agree to the terms first')
      return
    }

    setLoading(true)
    try {
      // register() now also stores tokens + user info in AsyncStorage
      const result = await authService.register(
        fullName.trim(),
        email.trim(),
        pass1.trim(),
        role,
      )
      console.log('RESULT:', JSON.stringify(result))

      // Route based on the role they signed up with
      switch (result.user_role) {
        case 'Customer':
          router.replace('/modules/customer/customer_Dashboard')
          break
        case 'Super Admin':
          router.replace('/superAdmin/superAdmin')
          break
        case 'Admin':
        case 'Cashier':
        case 'Waiter':
        case 'Kitchen Staff':
          router.replace('/modules/Dashboard')
          break
        default:
          router.replace('/modules/auth/login')
      }
    } catch (err: any) {
      Alert.alert('Signup Failed', err.message || 'Something went wrong, try again?')
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.blobTR} />
      <View style={styles.blobBL} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Logo ── */}
        <View style={styles.logoZone}>
          <View style={styles.iconBox}>
            <Image
              source={require('../../../assets/images/yammy.png')}
              style={styles.logoImg}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.brand}>YAMMY</Text>
          <Text style={styles.logoSub}>Create your account to get started</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Create Account</Text>
          <Text style={styles.cardSub}>Fill in your details below</Text>

          {/* ── Role Selector ── */}
          <Text style={styles.label}>I AM A</Text>
          <View style={styles.roleGrid}>
            {ROLES.map(r => (
              <TouchableOpacity
                key={r}
                onPress={() => setRole(r)}
                activeOpacity={0.75}
                style={[styles.roleChip, role === r && styles.roleChipActive]}
              >
                <Text style={[styles.roleChipTxt, role === r && styles.roleChipTxtActive]}>
                  {r}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ── Full Name ── */}
          <Text style={[styles.label, { marginTop: 16 }]}>FULL NAME</Text>
          <View style={[styles.inputRow, nameFocused && styles.focused]}>
            <View style={styles.prefix}>
              <User size={15} color={nameFocused ? C.accent : C.muted} />
            </View>
            <View style={styles.sep} />
            <TextInput
              style={styles.input}
              placeholder="Your name"
              placeholderTextColor={C.mutedDark}
              value={fullName}
              onChangeText={setFullName}
              onFocus={() => setNameFocused(true)}
              onBlur={() => setNameFocused(false)}
            />
          </View>

          {/* ── Email ── */}
          <Text style={[styles.label, { marginTop: 16 }]}>EMAIL ADDRESS</Text>
          <View style={[styles.inputRow, emailFocused && styles.focused]}>
            <View style={styles.prefix}>
              <Mail size={15} color={emailFocused ? C.accent : C.muted} />
            </View>
            <View style={styles.sep} />
            <TextInput
              style={styles.input}
              placeholder="user@yammy.com"
              placeholderTextColor={C.mutedDark}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              onFocus={() => setEmailFocused(true)}
              onBlur={() => setEmailFocused(false)}
            />
          </View>

          {/* ── Phone ── */}
          <Text style={[styles.label, { marginTop: 16 }]}>PHONE NUMBER</Text>
          <View style={[styles.inputRow, phoneFocused && styles.focused]}>
            <View style={styles.prefix}>
              <Phone size={15} color={phoneFocused ? C.accent : C.muted} />
            </View>
            <View style={styles.sep} />
            <View style={styles.countryCode}>
              <Text style={styles.countryTxt}>+977</Text>
              <View style={styles.codeSep} />
            </View>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="98XXXXXXXX"
              placeholderTextColor={C.mutedDark}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              onFocus={() => setPhoneFocused(true)}
              onBlur={() => setPhoneFocused(false)}
            />
          </View>

          {/* ── Password ── */}
          <Text style={[styles.label, { marginTop: 16 }]}>PASSWORD</Text>
          <View style={[
            styles.inputRow,
            pass1Focused && styles.focused,
            pass1Touched && !pass1Focused && (passValid ? styles.matchBorder : styles.errorBorder),
          ]}>
            <View style={styles.prefix}>
              <Lock size={15} color={pass1Focused ? C.accent : C.muted} />
            </View>
            <View style={styles.sep} />
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor={C.mutedDark}
              value={pass1}
              onChangeText={setPass1}
              secureTextEntry={!showPass1}
              onFocus={() => setPass1Focused(true)}
              onBlur={() => { setPass1Focused(false); setPass1Touched(true) }}
            />
            <TouchableOpacity onPress={() => setShowPass1(!showPass1)} style={styles.eyeBtn}>
              {showPass1
                ? <EyeOff size={15} color={C.muted} />
                : <Eye    size={15} color={C.muted} />}
            </TouchableOpacity>
          </View>

          {(pass1Focused || pass1Touched) && pass1.length > 0 && (
            <View style={styles.rulesBox}>
              {PASSWORD_RULES.map(r => {
                const ok = r.test(pass1)
                return (
                  <View key={r.id} style={styles.ruleRow}>
                    <View style={[styles.ruleDot, ok ? styles.ruleDotOk : styles.ruleDotFail]} />
                    <Text style={[styles.ruleTxt, ok ? styles.ruleTxtOk : styles.ruleTxtFail]}>
                      {r.label}
                    </Text>
                  </View>
                )
              })}
            </View>
          )}

          {/* ── Confirm Password ── */}
          <Text style={[styles.label, { marginTop: 16 }]}>CONFIRM PASSWORD</Text>
          <View style={[
            styles.inputRow,
            pass2Focused && styles.focused,
            passMatch    && styles.matchBorder,
            passMismatch && styles.errorBorder,
          ]}>
            <View style={styles.prefix}>
              <Lock size={15} color={pass2Focused ? C.accent : C.muted} />
            </View>
            <View style={styles.sep} />
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor={C.mutedDark}
              value={pass2}
              onChangeText={setPass2}
              secureTextEntry={!showPass2}
              onFocus={() => setPass2Focused(true)}
              onBlur={() => setPass2Focused(false)}
            />
            {passMatch
              ? <CheckCircle2 size={15} color={C.success} style={{ marginRight: 14 }} />
              : (
                <TouchableOpacity onPress={() => setShowPass2(!showPass2)} style={styles.eyeBtn}>
                  {showPass2
                    ? <EyeOff size={15} color={C.muted} />
                    : <Eye    size={15} color={C.muted} />}
                </TouchableOpacity>
              )
            }
          </View>
          {passMismatch && <Text style={styles.errorTxt}>Passwords do not match</Text>}

          {/* ── Terms ── */}
          <TouchableOpacity
            style={styles.termsRow}
            onPress={() => setAgreed(!agreed)}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
              {agreed && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.termsTxt}>
              I agree to the <Text style={styles.termsLink}>Terms & Conditions</Text>
            </Text>
          </TouchableOpacity>

          {/* ── CTA ── */}
          <TouchableOpacity
            style={[styles.cta, loading && { opacity: 0.55 }]}
            onPress={createAccount}
            disabled={loading}
            activeOpacity={0.82}
          >
            <Text style={styles.ctaTxt}>
              {loading ? 'Creating Account...' : 'Create Account'}
            </Text>
            {!loading && <ArrowRight size={16} color="#fff" style={{ marginLeft: 8 }} />}
          </TouchableOpacity>

          <TouchableOpacity style={styles.signInRow} onPress={() => router.back()}>
            <Text style={styles.signInTxt}>
              Already have an account? <Text style={styles.signInLink}>Sign In</Text>
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>Powered by YAMMY · Restaurant OS</Text>
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

  scroll: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 40 },

  logoZone:  { alignItems: 'center', marginBottom: 28 },
  iconBox: {
    width: 68, height: 68, borderRadius: 18,
    backgroundColor: C.card, borderWidth: 1, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  logoImg: { width: 48, height: 48 },
  brand:   { fontSize: 24, fontWeight: '900', color: C.white, letterSpacing: 9, marginBottom: 6 },
  logoSub: { fontSize: 12, color: C.muted },

  card: {
    backgroundColor: C.card, borderRadius: R.xl,
    borderWidth: 1, borderColor: C.border,
    padding: 22, paddingTop: 26, marginBottom: 20,
  },
  cardTitle: { fontSize: 22, fontWeight: '900', color: C.white, marginBottom: 3 },
  cardSub:   { fontSize: 13, color: C.muted, marginBottom: 22 },

  label: {
    fontSize: 10, fontWeight: '800', color: C.label,
    letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8,
  },

  // ── Role chips ──
  roleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  roleChip: {
    paddingHorizontal: 14, paddingVertical: 9,
    borderRadius: 10, borderWidth: 1,
    borderColor: C.border, backgroundColor: C.inner,
  },
  roleChipActive:   { borderColor: C.accent, backgroundColor: '#2A1500' },
  roleChipTxt:      { fontSize: 12, fontWeight: '700', color: C.muted },
  roleChipTxtActive: { color: C.accent },

  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.inner, borderRadius: R.md,
    borderWidth: 1, borderColor: C.border, height: 48, overflow: 'hidden',
  },
  focused:     { borderColor: C.accent },
  matchBorder: { borderColor: C.success },
  errorBorder: { borderColor: C.error },

  prefix: { width: 44, alignItems: 'center', justifyContent: 'center' },
  sep:    { width: 1, height: 20, backgroundColor: C.border, marginRight: 12 },
  input:  { flex: 1, fontSize: 14, color: C.white, paddingRight: 12 },
  eyeBtn: { paddingHorizontal: 14 },

  countryCode: { flexDirection: 'row', alignItems: 'center' },
  countryTxt:  { fontSize: 13, fontWeight: '600', color: C.label },
  codeSep:     { width: 1, height: 20, backgroundColor: C.border, marginLeft: 8, marginRight: 12 },

  errorTxt: { fontSize: 11, color: C.error, marginTop: 5, marginLeft: 2 },

  rulesBox: {
    backgroundColor: C.inner, borderRadius: R.md,
    borderWidth: 1, borderColor: C.border,
    padding: 12, marginTop: 8, gap: 6,
  },
  ruleRow:     { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ruleDot:     { width: 6, height: 6, borderRadius: 3 },
  ruleDotOk:   { backgroundColor: C.success },
  ruleDotFail: { backgroundColor: C.mutedDark },
  ruleTxt:     { fontSize: 11 },
  ruleTxtOk:   { color: C.success },
  ruleTxtFail: { color: C.muted },

  termsRow: {
    flexDirection: 'row', alignItems: 'center',
    marginTop: 18, marginBottom: 20, gap: 10,
  },
  checkbox: {
    width: 20, height: 20, borderRadius: 6,
    borderWidth: 1, borderColor: C.border,
    backgroundColor: C.inner, alignItems: 'center', justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: C.accent, borderColor: C.accent },
  checkmark: { color: C.white, fontSize: 12, fontWeight: '700' },
  termsTxt:  { fontSize: 13, color: C.muted, flex: 1 },
  termsLink: { color: C.accent, fontWeight: '700' },

  cta: {
    backgroundColor: C.accent, height: 50, borderRadius: R.md,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    shadowColor: C.accent, shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3, shadowRadius: 10, elevation: 5,
  },
  ctaTxt: { color: '#fff', fontSize: 15, fontWeight: '800', letterSpacing: 0.3 },

  signInRow:  { alignItems: 'center', paddingTop: 16 },
  signInTxt:  { fontSize: 13, color: C.muted },
  signInLink: { color: C.accent, fontWeight: '700' },

  footer: { textAlign: 'center', fontSize: 10, color: C.mutedDark, letterSpacing: 0.8 },
})