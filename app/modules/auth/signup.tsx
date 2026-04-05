import AsyncStorage from '@react-native-async-storage/async-storage'
import { useRouter } from 'expo-router'
import { CheckCircle2, Eye, EyeOff, Lock, Mail, Phone, User } from 'lucide-react-native'
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
  View
} from 'react-native'
import { authService } from './services/auth.service'

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

const staffRoles = [
 { id: 'Admin', label: 'Admin' },
{ id: 'Waiter', label: 'Waiter' },
{ id: 'Cashier', label: 'Cashier' },
{ id: 'Kitchen', label: 'Kitchen Staff' },
{ id: 'Customer', label: 'Customer' },
]

export default function Signup() {
  const router = useRouter()

  const [fullName,        setFullName]        = useState('')
  const [emailAddress,    setEmailAddress]    = useState('')
  const [phoneNum,        setPhoneNum]        = useState('')
  const [passwordFirst,   setPasswordFirst]   = useState('')
  const [passwordSecond,  setPasswordSecond]  = useState('')
  const [pickedRole,      setPickedRole]      = useState('waiter')
  const [showingPassword1, setShowingPassword1] = useState(false)
  const [showingPassword2, setShowingPassword2] = useState(false)
  const [agreedToTerms,   setAgreedToTerms]  = useState(false)
  const [isCreatingAccount, setIsCreatingAccount] = useState(false)

  const passwordsMatch     = passwordFirst.length > 0 && passwordFirst === passwordSecond
  const passwordsDontMatch = passwordSecond.length > 0 && passwordFirst !== passwordSecond

  const createTheAccount = async () => {
    if (!fullName.trim() || !emailAddress.trim() || !phoneNum.trim() || !passwordFirst.trim()) {
      Alert.alert('Missing Info', 'Please fill in all the fields')
      return
    }

    if (passwordFirst !== passwordSecond) {
      Alert.alert('Password Mismatch', 'Your passwords dont match')
      return
    }

    if (!agreedToTerms) {
      Alert.alert('Terms Required', 'You need to agree to the terms first')
      return
    }

    setIsCreatingAccount(true)

    try {
  const result = await authService.register(
    fullName.trim(),
    emailAddress.trim(),
    passwordFirst.trim(),
    pickedRole,
  )
  

  if (result.message === 'Email already exists') {
    throw new Error('This email is already registered')
  }

  await authService.login(
    emailAddress.trim(),
    passwordFirst.trim(),
  )

  await AsyncStorage.setItem('@userName', result.user_name)
  await AsyncStorage.setItem('@userRole', result.user_role)
  await AsyncStorage.setItem('@userId', String(result.user_id))

  router.replace('/modules/auth/login')

} catch (err: any) {
  Alert.alert('Signup Failed', err.message || 'Something went wrong, try again?')
} finally {
  setIsCreatingAccount(false)
}}

  return (
    <View style={styles.container}>

      {/* Top Zone */}
      <View style={styles.topZone}>
        <View style={styles.patternOverlay}>
          {Array.from({ length: 30 }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  left: `${(i % 8) * 12.5}%`,
                  top:  `${Math.floor(i / 8) * 25}%`,
                },
              ]}
            />
          ))}
        </View>

        <View>
        <Image source={require('../../../assets/images/yammy.png')} style={{ width: 200, height: 70 }} />
        </View>

        
        <Text style={styles.appSub}>Register as a user or a customer</Text>
      </View>

      {/* Signup Card */}
      <View style={styles.signupCard}>
        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.cardContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >

          {/* Heading */}
          <View style={styles.headingArea}>
            <Text style={styles.welcomeText}>Create Account</Text>
            <Text style={styles.welcomeSub}>Fill in your details to get started</Text>
          </View>

          {/* Full Name */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Full Name</Text>
            <View style={styles.inputWrapper}>
              <User size={18} color={C.latte} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="User Name"
                placeholderTextColor={C.latte}
                value={fullName}
                onChangeText={setFullName}
              />
            </View>
          </View>

          {/* Email */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Email</Text>
            <View style={styles.inputWrapper}>
              <Mail size={18} color={C.latte} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="user@restaurant.com"
                placeholderTextColor={C.latte}
                value={emailAddress}
                onChangeText={setEmailAddress}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Phone */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Phone Number</Text>
            <View style={styles.inputWrapper}>
              <Phone size={18} color={C.latte} style={styles.inputIcon} />
              <View style={styles.countryCode}>
                <Text style={styles.countryFlag}>🇳🇵</Text>
                <Text style={styles.countryPrefix}>+977</Text>
              </View>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="981234567"
                placeholderTextColor={C.latte}
                value={phoneNum}
                onChangeText={setPhoneNum}
                keyboardType="phone-pad"
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
                value={passwordFirst}
                onChangeText={setPasswordFirst}
                secureTextEntry={!showingPassword1}
              />
              <TouchableOpacity
                onPress={() => setShowingPassword1(!showingPassword1)}
                style={styles.eyeButton}
              >
                {showingPassword1
                  ? <EyeOff size={18} color={C.latte} />
                  : <Eye    size={18} color={C.latte} />}
              </TouchableOpacity>
            </View>
          </View>

          {/* Confirm Password */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Confirm Password</Text>
            <View style={[
              styles.inputWrapper,
              passwordsMatch     && styles.inputWrapperMatch,
              passwordsDontMatch && styles.inputWrapperMismatch,
            ]}>
              <Lock size={18} color={C.latte} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor={C.latte}
                value={passwordSecond}
                onChangeText={setPasswordSecond}
                secureTextEntry={!showingPassword2}
              />
              {passwordsMatch ? (
                <CheckCircle2 size={18} color={C.sage} style={styles.eyeButton} />
              ) : (
                <TouchableOpacity
                  onPress={() => setShowingPassword2(!showingPassword2)}
                  style={styles.eyeButton}
                >
                  {showingPassword2
                    ? <EyeOff size={18} color={C.latte} />
                    : <Eye    size={18} color={C.latte} />}
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Role Selector */}
          <View style={styles.roleSection}>
            <Text style={styles.inputLabel}>Your Role</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.rolesScroll}
            >
              <View style={styles.rolesRow}>
                {staffRoles.map((role) => {
                  const isActive = pickedRole === role.id
                  return (
                    <TouchableOpacity
                      key={role.id}
                      style={[styles.rolePill, isActive && styles.rolePillActive]}
                      onPress={() => setPickedRole(role.id)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.rolePillText, isActive && styles.rolePillTextActive]}>
                        {role.label}
                      </Text>
                    </TouchableOpacity>
                  )
                })}
              </View>
            </ScrollView>
          </View>

          {/* Terms Checkbox */}
          <TouchableOpacity
            style={styles.termsRow}
            onPress={() => setAgreedToTerms(!agreedToTerms)}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, agreedToTerms && styles.checkboxChecked]}>
              {agreedToTerms && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.termsText}>
              I agree to the{' '}
              <Text style={styles.termsLink}>Terms & Conditions</Text>
            </Text>
          </TouchableOpacity>

          {/* Create Account Button */}
          <TouchableOpacity
            style={[styles.createBtn, isCreatingAccount && { opacity: 0.6 }]}
            onPress={createTheAccount}
            disabled={isCreatingAccount}
            activeOpacity={0.85}
          >
            <Text style={styles.createText}>
              {isCreatingAccount ? 'Creating Account...' : 'Create Account'}
            </Text>
          </TouchableOpacity>

          {/* Sign In Redirect */}
          <TouchableOpacity
            style={styles.signInRedirect}
            onPress={() => router.back()}
          >
            <Text style={styles.signInText}>
              Already have an account?{' '}
              <Text style={styles.signInLink}>Sign In</Text>
            </Text>
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

  // Top Zone
  topZone: {
    height: height * 0.26,
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
    width: 64, height: 64,
    borderRadius: radius.md,
    backgroundColor: C.brass,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: C.brassBorder,
    shadowColor: C.brass,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  appTitle: {
    fontSize: 22,
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

  // Signup Card
  signupCard: {
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
    paddingTop: 32,
    paddingBottom: 40,
  },

  // Heading
  headingArea: {
    marginBottom: 22,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '900',
    color: C.espresso,
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  welcomeSub: {
    fontSize: 13,
    color: C.clay,
    fontWeight: '500',
    letterSpacing: 0.2,
  },

  // Inputs
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: C.clay,
    marginBottom: 7,
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
  inputWrapperMatch: {
    borderColor: C.sageBorder,
    backgroundColor: C.sageLight,
  },
  inputWrapperMismatch: {
    borderColor: C.tcBorder,
    backgroundColor: C.tcLight,
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

  // Country Code
  countryCode: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingRight: 12,
    marginRight: 12,
    borderRightWidth: 1,
    borderRightColor: C.vellum,
  },
  countryFlag: {
    fontSize: 16,
  },
  countryPrefix: {
    fontSize: 15,
    fontWeight: '600',
    color: C.roast,
  },

  // Role Selector
  roleSection: {
    marginBottom: 20,
  },
  rolesScroll: {
    marginTop: 2,
  },
  rolesRow: {
    flexDirection: 'row',
    gap: 10,
  },
  rolePill: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: C.vellum,
    backgroundColor: C.cream,
  },
  rolePillActive: {
    backgroundColor: C.roast,
    borderColor: C.roast,
  },
  rolePillText: {
    fontSize: 12,
    fontWeight: '600',
    color: C.clay,
  },
  rolePillTextActive: {
    color: C.cream,
  },

  // Terms Checkbox
  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 22,
    gap: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: radius.xs,
    borderWidth: 1.5,
    borderColor: C.vellum,
    backgroundColor: C.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: C.brass,
    borderColor: C.brassBorder,
  },
  checkmark: {
    color: C.cream,
    fontSize: 13,
    fontWeight: '700',
  },
  termsText: {
    fontSize: 13,
    color: C.clay,
    flex: 1,
  },
  termsLink: {
    color: C.brass,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },

  // Create Button
  createBtn: {
    backgroundColor: C.brass,
    height: 52,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    width: '75%',
    alignSelf: 'center',
    shadowColor: C.brass,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  createText: {
    color: C.cream,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  // Sign In Redirect
  signInRedirect: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  signInText: {
    fontSize: 13,
    color: C.clay,
  },
  signInLink: {
    color: C.brass,
    fontWeight: '700',
  },

  // Version
  versionText: {
    textAlign: 'center',
    fontSize: 11,
    color: C.latte,
    paddingVertical: 12,
  },
})