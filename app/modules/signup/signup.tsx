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
  success: '#2E7D32',
  successLight: '#F0FDF4',
}

const API_URL = 'http://10.23.1.14:3000/api'

const staffRoles = [
  { id: 'admin', label: 'Admin' },
  { id: 'manager', label: 'Manager' },
  { id: 'waiter', label: 'Waiter' },
  { id: 'kitchen', label: 'Kitchen Staff' },
]

export default function Signup() {
  const router = useRouter()

  const [fullName, setFullName] = useState('')
  const [emailAddress, setEmailAddress] = useState('')
  const [phoneNum, setPhoneNum] = useState('')
  const [passwordFirst, setPasswordFirst] = useState('')
  const [passwordSecond, setPasswordSecond] = useState('')
  const [pickedRole, setPickedRole] = useState('waiter')
  const [showingPassword1, setShowingPassword1] = useState(false)
  const [showingPassword2, setShowingPassword2] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [isCreatingAccount, setIsCreatingAccount] = useState(false)

  const passwordsMatch = passwordFirst.length > 0 && passwordFirst === passwordSecond
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
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailAddress.trim(),
          password: passwordFirst.trim(),
          name: fullName.trim(),
          restaurantName: `${fullName.trim()}'s Restaurant`,
          phone: `+977 ${phoneNum.trim()}`,
          address: 'Kathmandu, Nepal',
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Could not create account')
      }

      await AsyncStorage.setItem('@auth_token', result.token)
      await AsyncStorage.setItem('@user', JSON.stringify(result.user))

      router.replace('/modules/pos/POS')
      
    } catch (err: any) {
      Alert.alert('Signup Failed', err.message || 'Something went wrong, try again?')
    } finally {
      setIsCreatingAccount(false)
    }
  }

  return (
    <View style={styles.container}>
      {/* Zone 1 — Brand Header */}
      <View style={styles.topZone}>
        <View style={styles.patternOverlay}>
          {Array.from({ length: 30 }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  left: `${(i % 8) * 12.5}%`,
                  top: `${Math.floor(i / 8) * 25}%`,
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

        {/* Wave at bottom */}
        
         
      </View>

      {/* Zone 2 — Signup Card */}
      <View style={styles.signupCard}>
        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.cardContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* heading */}
          <View style={styles.headingArea}>
            <Text style={styles.welcomeText}>Create Account</Text>
            <Text style={styles.welcomeSub}>Fill in your details to get started</Text>
          </View>

          {/* full name */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Full Name</Text>
            <View style={styles.inputWrapper}>
              <User size={18} color={COLORS.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="John Doe"
                placeholderTextColor={COLORS.textMuted}
                value={fullName}
                onChangeText={setFullName}
              />
            </View>
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
                value={emailAddress}
                onChangeText={setEmailAddress}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* phone with country code */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Phone Number</Text>
            <View style={styles.inputWrapper}>
              <Phone size={18} color={COLORS.textMuted} style={styles.inputIcon} />
              <View style={styles.countryCode}>
                <Text style={styles.countryFlag}>🇳🇵</Text>
                <Text style={styles.countryPrefix}>+977</Text>
              </View>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="98 1234 5678"
                placeholderTextColor={COLORS.textMuted}
                value={phoneNum}
                onChangeText={setPhoneNum}
                keyboardType="phone-pad"
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
                value={passwordFirst}
                onChangeText={setPasswordFirst}
                secureTextEntry={!showingPassword1}
              />
              <TouchableOpacity
                onPress={() => setShowingPassword1(!showingPassword1)}
                style={styles.eyeButton}
              >
                {showingPassword1 ? (
                  <EyeOff size={18} color={COLORS.textMuted} />
                ) : (
                  <Eye size={18} color={COLORS.textMuted} />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* confirm password with validation */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Confirm Password</Text>
            <View style={[
              styles.inputWrapper,
              passwordsMatch && styles.inputWrapperMatch,
              passwordsDontMatch && styles.inputWrapperMismatch,
            ]}>
              <Lock size={18} color={COLORS.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor={COLORS.textMuted}
                value={passwordSecond}
                onChangeText={setPasswordSecond}
                secureTextEntry={!showingPassword2}
              />
              {passwordsMatch ? (
                <CheckCircle2 size={18} color={COLORS.success} style={styles.eyeButton} />
              ) : (
                <TouchableOpacity
                  onPress={() => setShowingPassword2(!showingPassword2)}
                  style={styles.eyeButton}
                >
                  {showingPassword2 ? (
                    <EyeOff size={18} color={COLORS.textMuted} />
                  ) : (
                    <Eye size={18} color={COLORS.textMuted} />
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* role selector pills */}
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

          {/* terms checkbox */}
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

          {/* create account button */}
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

          {/* sign in redirect */}
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
  signupCard: {
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
    marginBottom: 24,
  },
  welcomeText: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  welcomeSub: {
    fontSize: 14,
    color: COLORS.textMuted,
    fontWeight: '400',
  },

  // inputs
  inputContainer: {
    marginBottom: 18,
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
    height: 52,
  },
  inputWrapperMatch: {
    borderColor: COLORS.success,
    backgroundColor: COLORS.successLight,
  },
  inputWrapperMismatch: {
    borderColor: COLORS.brand,
    backgroundColor: '#FFF0F0',
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

  // country code
  countryCode: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingRight: 12,
    marginRight: 12,
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
  },
  countryFlag: {
    fontSize: 16,
  },
  countryPrefix: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },

  // role selector
  roleSection: {
    marginBottom: 22,
  },
  rolesScroll: {
    marginTop: 2,
  },
  rolesRow: {
    flexDirection: 'row',
    gap: 10,
  },
  rolePill: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  rolePillActive: {
    backgroundColor: COLORS.brand,
    borderColor: COLORS.brand,
  },
  rolePillText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  rolePillTextActive: {
    color: COLORS.surface,
  },

  // terms checkbox
  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: COLORS.brand,
    borderColor: COLORS.brand,
  },
  checkmark: {
    color: COLORS.surface,
    fontSize: 14,
    fontWeight: '700',
  },
  termsText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    flex: 1,
  },
  termsLink: {
    color: COLORS.brand,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },

  // create button
  createBtn: {
    backgroundColor: COLORS.brand,
    height: 54,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    width: '75%',
    alignSelf: 'center',
    shadowColor: COLORS.brand,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  createText: {
    color: COLORS.surface,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // sign in redirect
  signInRedirect: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  signInText: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  signInLink: {
    color: COLORS.brand,
    fontWeight: '700',
  },

  // version
  versionText: {
    textAlign: 'center',
    fontSize: 11,
    color: COLORS.textMuted,
    paddingVertical: 12,
    fontWeight: '400',
  },
})