import AsyncStorage from '@react-native-async-storage/async-storage'
import { useRouter } from 'expo-router'
import { CheckCircle2, Eye, EyeOff, Lock, Mail, Phone, User } from 'lucide-react-native'
import { useState } from 'react'
import {
  Alert, Dimensions, KeyboardAvoidingView, Platform, ScrollView, StatusBar,
  StyleSheet, Text, TextInput, TouchableOpacity, View
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
  error:      '#EF4444' 
}

const staffRoles = [
  { id: 'Admin', label: 'Admin' },
  { id: 'Waiter', label: 'Waiter' },
  { id: 'Cashier', label: 'Cashier' },
  { id: 'Kitchen Staff', label: 'Kitchen Staff' },
  { id: 'Customer', label: 'Customer' },
  { id: 'Super Admin', label: 'Super Admin' },
]

export default function Signup() {
  const router = useRouter()
  const [fullName, setFullName]             = useState('')
  const [emailAddress, setEmailAddress]     = useState('')
  const [phoneNum, setPhoneNum]             = useState('')
  const [passwordFirst, setPasswordFirst]   = useState('')
  const [passwordSecond, setPasswordSecond] = useState('')
  const [pickedRole, setPickedRole]         = useState('Customer')
  const [showingPassword1, setShowingPassword1] = useState(false)
  const [showingPassword2, setShowingPassword2] = useState(false)
  const [agreedToTerms, setAgreedToTerms]   = useState(false)
  const [isCreatingAccount, setIsCreatingAccount] = useState(false)

  const passwordsMatch     = passwordFirst.length > 0 && passwordFirst === passwordSecond
  const passwordsDontMatch = passwordSecond.length > 0 && passwordFirst !== passwordSecond

  const createTheAccount = async () => {
    if (!fullName.trim() || !emailAddress.trim() || !phoneNum.trim() || !passwordFirst.trim()) {
      return Alert.alert('Missing Info', 'Please fill in all the fields')
    }

    if (!emailAddress.trim().toLowerCase().endsWith('@yammy.com')) {
      return Alert.alert('Invalid Email', 'You must use a @yammy.com email address.')
    }

    const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
    if (!strongRegex.test(passwordFirst)) {
      return Alert.alert('Weak Password', 'Password must be 8+ chars, with an uppercase, lowercase, number, and special character.')
    }

    if (!passwordsMatch) return Alert.alert('Password Mismatch', 'Your passwords do not match')
    if (!agreedToTerms) return Alert.alert('Terms Required', 'You need to agree to the terms first')

    setIsCreatingAccount(true)

    try {
      const result = await authService.register(fullName.trim(), emailAddress.trim(), passwordFirst.trim(), pickedRole)
      if (result.message === 'Email already exists') throw new Error('This email is already registered')

      await authService.login(emailAddress.trim(), passwordFirst.trim())
      await AsyncStorage.setItem('@userName', result.user_name)
      await AsyncStorage.setItem('@userRole', result.user_role)
      await AsyncStorage.setItem('@userId', String(result.user_id))

      router.replace('/modules/auth/login')
    } catch (err: any) {
      Alert.alert('Signup Failed', err.message || 'Something went wrong, try again?')
    } finally {
      setIsCreatingAccount(false)
    }
  }

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="light-content" backgroundColor={C.black} />
      <View style={styles.blobOuter} />
      <View style={styles.blobInner} />

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subTitle}>Register as a user or a customer</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.field}>
            <Text style={styles.label}>Full Name</Text>
            <View style={styles.inputBox}>
              <User size={18} color={C.muted} style={styles.inputIcon} />
              <TextInput style={styles.input} placeholder="User Name" placeholderTextColor={C.steel} value={fullName} onChangeText={setFullName} />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Email (@yammy.com only)</Text>
            <View style={styles.inputBox}>
              <Mail size={18} color={C.muted} style={styles.inputIcon} />
              <TextInput style={styles.input} placeholder="user@yammy.com" placeholderTextColor={C.steel} value={emailAddress} onChangeText={setEmailAddress} keyboardType="email-address" autoCapitalize="none" />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Phone Number</Text>
            <View style={styles.inputBox}>
              <Phone size={18} color={C.muted} style={styles.inputIcon} />
              <Text style={styles.prefix}>+977</Text>
              <TextInput style={styles.input} placeholder="981234567" placeholderTextColor={C.steel} value={phoneNum} onChangeText={setPhoneNum} keyboardType="phone-pad" />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputBox}>
              <Lock size={18} color={C.muted} style={styles.inputIcon} />
              <TextInput style={styles.input} placeholder="••••••••" placeholderTextColor={C.steel} value={passwordFirst} onChangeText={setPasswordFirst} secureTextEntry={!showingPassword1} />
              <TouchableOpacity onPress={() => setShowingPassword1(!showingPassword1)}>{showingPassword1 ? <EyeOff size={18} color={C.muted} /> : <Eye size={18} color={C.muted} />}</TouchableOpacity>
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Confirm Password</Text>
            <View style={[styles.inputBox, passwordsMatch && styles.inputMatch, passwordsDontMatch && styles.inputMismatch]}>
              <Lock size={18} color={C.muted} style={styles.inputIcon} />
              <TextInput style={styles.input} placeholder="••••••••" placeholderTextColor={C.steel} value={passwordSecond} onChangeText={setPasswordSecond} secureTextEntry={!showingPassword2} />
              {passwordsMatch ? <CheckCircle2 size={18} color={C.success} /> : <TouchableOpacity onPress={() => setShowingPassword2(!showingPassword2)}>{showingPassword2 ? <EyeOff size={18} color={C.muted} /> : <Eye size={18} color={C.muted} />}</TouchableOpacity>}
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Your Role</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.rolesRow}>
                {staffRoles.map(role => (
                  <TouchableOpacity key={role.id} style={[styles.pill, pickedRole === role.id && styles.pillActive]} onPress={() => setPickedRole(role.id)}>
                    <Text style={[styles.pillText, pickedRole === role.id && styles.pillTextActive]}>{role.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          <TouchableOpacity style={styles.termsRow} onPress={() => setAgreedToTerms(!agreedToTerms)}>
            <View style={[styles.checkbox, agreedToTerms && styles.checkboxActive]}>
              {agreedToTerms && <Text style={{color: C.white, fontSize: 12}}>✓</Text>}
            </View>
            <Text style={styles.termsText}>I agree to the <Text style={styles.orangeText}>Terms & Conditions</Text></Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.ctaBtn, isCreatingAccount && { opacity: 0.55 }]} onPress={createTheAccount} disabled={isCreatingAccount}>
            <Text style={styles.ctaText}>{isCreatingAccount ? 'Creating Account...' : 'Create Account'}</Text>
            {!isCreatingAccount && <Text style={styles.ctaArrow}>→</Text>}
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.divLine} /><Text style={styles.divLabel}>or</Text><View style={styles.divLine} />
          </View>
          
          <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.back()}>
            <Text style={styles.secondaryText}>Already have an account? Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.black },
  blobOuter: { position: 'absolute', top: -80, left: width / 2 - 130, width: 260, height: 260, borderRadius: 130, backgroundColor: C.orange, opacity: 0.10 },
  blobInner: { position: 'absolute', top: -30, left: width / 2 - 65, width: 130, height: 130, borderRadius: 65, backgroundColor: C.orange, opacity: 0.16 },
  scroll: { flexGrow: 1, paddingHorizontal: 22, paddingTop: height * 0.08, paddingBottom: 40 },
  header: { alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 28, fontWeight: '900', color: C.white, letterSpacing: 1, marginBottom: 6 },
  subTitle: { fontSize: 13, color: C.muted },
  card: { backgroundColor: C.card, borderRadius: 24, padding: 24, borderWidth: 1, borderColor: C.border },
  field: { marginBottom: 16 },
  label: { fontSize: 11, fontWeight: '700', color: C.muted, letterSpacing: 1.1, textTransform: 'uppercase', marginBottom: 8 },
  inputBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.graphite, borderRadius: 14, borderWidth: 1, borderColor: C.border, paddingHorizontal: 16, height: 52 },
  inputMatch: { borderColor: C.success },
  inputMismatch: { borderColor: C.error },
  inputIcon: { marginRight: 10 },
  prefix: { fontSize: 15, color: C.orange, marginRight: 10, fontWeight: '700', borderRightWidth: 1, borderRightColor: C.border, paddingRight: 10 },
  input: { flex: 1, fontSize: 15, color: C.white },
  rolesRow: { flexDirection: 'row', gap: 8 },
  pill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 100, backgroundColor: C.graphite, borderWidth: 1, borderColor: C.border },
  pillActive: { backgroundColor: C.orangeTint, borderColor: C.orange },
  pillText: { fontSize: 12, color: C.dim, fontWeight: '600' },
  pillTextActive: { color: C.orange },
  termsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  checkbox: { width: 20, height: 20, borderRadius: 6, borderWidth: 1, borderColor: C.border, backgroundColor: C.graphite, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  checkboxActive: { backgroundColor: C.orange, borderColor: C.orange },
  termsText: { fontSize: 12, color: C.muted },
  orangeText: { color: C.orange, fontWeight: '600' },
  ctaBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: C.orange, borderRadius: 14, height: 54, gap: 8 },
  ctaText: { fontSize: 16, fontWeight: '800', color: C.white, letterSpacing: 0.3 },
  ctaArrow: { fontSize: 18, color: C.white, fontWeight: '700' },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  divLine: { flex: 1, height: 1, backgroundColor: C.border },
  divLabel: { marginHorizontal: 12, fontSize: 12, color: C.steel },
  secondaryBtn: { height: 52, borderRadius: 14, borderWidth: 1, borderColor: C.border, backgroundColor: C.graphite, alignItems: 'center', justifyContent: 'center' },
  secondaryText: { fontSize: 14, color: C.offWhite, fontWeight: '600' },
})