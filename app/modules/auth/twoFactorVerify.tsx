import AsyncStorage from '@react-native-async-storage/async-storage'
import { useRouter } from 'expo-router'
import { ShieldCheck } from 'lucide-react-native'
import { useRef, useState } from 'react'
import {
    Alert, StyleSheet, Text, TextInput,
    TouchableOpacity, View,
} from 'react-native'

const C = {
  bg: '#0A0A0A', card: '#1A1A1A', inner: '#2C2C2C',
  border: '#2E2E2E', accent: '#FF6B2C', success: '#22C55E',
  white: '#FFFFFF', muted: '#777777', mutedDark: '#444444', label: '#999999',
}
const R = { md: 14, xl: 24 }
const BASE_URL = 'http://192.168.1.71:5000/api/auth'

export default function TwoFactorVerify() {
  const router = useRouter()
  const [digits, setDigits]     = useState(['', '', '', '', '', ''])
  const [loading, setLoading]   = useState(false)
  const refs = useRef<(TextInput | null)[]>([])

  const token = digits.join('')

  const handleChange = (val: string, idx: number) => {
    const d = [...digits]
    d[idx] = val.replace(/[^0-9]/g, '').slice(-1)
    setDigits(d)
    if (val && idx < 5) refs.current[idx + 1]?.focus()
  }

  const handleKeyPress = (e: any, idx: number) => {
    if (e.nativeEvent.key === 'Backspace' && !digits[idx] && idx > 0) {
      refs.current[idx - 1]?.focus()
    }
  }

  const handleVerify = async () => {
    if (token.length !== 6) return Alert.alert('Incomplete', 'Enter all 6 digits')
    setLoading(true)
    try {
      const userId = await AsyncStorage.getItem('@userId')
      const res = await fetch(`${BASE_URL}/2fa/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, token }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)

      // Navigate based on role
      const role = await AsyncStorage.getItem('@userRole')
      if (role === 'Customer') {
        router.replace('/modules/customer/customer_Dashboard')
      } else if (role === 'Super Admin') {
        router.replace('/superAdmin/superAdmin')
      } else {
        router.replace('/modules/Dashboard')
      }
    } catch (err: any) {
      Alert.alert('Wrong Code', 'The code is incorrect or expired. Try again.')
      setDigits(['', '', '', '', '', ''])
      refs.current[0]?.focus()
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.blobTR} />

      <View style={styles.topZone}>
        <View style={styles.iconBox}>
          <ShieldCheck size={28} color={C.accent} />
        </View>
        <Text style={styles.brand}>YAMMY</Text>
        <Text style={styles.tagline}>Two-Factor Authentication</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Enter Your Code</Text>
        <Text style={styles.sub}>
          Open Google Authenticator or Authy and enter the 6-digit code for YAMMY.
        </Text>

        {/* 6 digit boxes */}
        <View style={styles.digitsRow}>
          {digits.map((d, i) => (
            <TextInput
              key={i}
              ref={r => { refs.current[i] = r }}
              style={[styles.digitBox, d && styles.digitBoxFilled]}
              value={d}
              onChangeText={v => handleChange(v, i)}
              onKeyPress={e => handleKeyPress(e, i)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
            />
          ))}
        </View>

        <Text style={styles.hint}>Code refreshes every 30 seconds</Text>

        <TouchableOpacity
          style={[styles.cta, (loading || token.length < 6) && { opacity: 0.55 }]}
          onPress={handleVerify}
          disabled={loading || token.length < 6}
          activeOpacity={0.85}
        >
          <Text style={styles.ctaTxt}>{loading ? 'Verifying...' : 'Verify & Sign In'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.backBtn} onPress={() => router.replace('/modules/auth/login')}>
          <Text style={styles.backTxt}>← Back to Login</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg, paddingHorizontal: 20, paddingTop: 60 },
  blobTR:    { position: 'absolute', top: -70, right: -70, width: 200, height: 200, borderRadius: 100, backgroundColor: C.accent, opacity: 0.07 },

  topZone: { alignItems: 'center', marginBottom: 32 },
  iconBox: { width: 64, height: 64, borderRadius: 18, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  brand:   { fontSize: 24, fontWeight: '900', color: C.white, letterSpacing: 9, marginBottom: 6 },
  tagline: { fontSize: 12, color: C.muted },

  card:  { backgroundColor: C.card, borderRadius: R.xl, borderWidth: 1, borderColor: C.border, padding: 22 },
  title: { fontSize: 20, fontWeight: '900', color: C.white, marginBottom: 6 },
  sub:   { fontSize: 13, color: C.muted, marginBottom: 28, lineHeight: 20 },

  digitsRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginBottom: 12 },
  digitBox: {
    flex: 1, height: 56, borderRadius: R.md,
    backgroundColor: C.inner, borderWidth: 1, borderColor: C.border,
    fontSize: 22, fontWeight: '800', color: C.white, textAlign: 'center',
  },
  digitBoxFilled: { borderColor: C.accent },

  hint: { fontSize: 11, color: C.mutedDark, textAlign: 'center', marginBottom: 24 },

  cta:    { backgroundColor: C.accent, height: 50, borderRadius: R.md, alignItems: 'center', justifyContent: 'center', shadowColor: C.accent, shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
  ctaTxt: { color: '#fff', fontSize: 15, fontWeight: '800', letterSpacing: 0.3 },

  backBtn: { alignItems: 'center', marginTop: 18 },
  backTxt: { fontSize: 13, color: C.muted, fontWeight: '600' },
})
