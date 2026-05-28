import AsyncStorage from '@react-native-async-storage/async-storage'
import { useRouter } from 'expo-router'
import { ShieldCheck } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import {
    ActivityIndicator, Alert, Image, StyleSheet,
    Text, TextInput, TouchableOpacity, View,
} from 'react-native'

const C = {
  bg: '#0A0A0A', card: '#1A1A1A', inner: '#2C2C2C',
  border: '#2E2E2E', accent: '#FF6B2C', success: '#22C55E',
  white: '#FFFFFF', muted: '#777777', mutedDark: '#444444', label: '#999999',
}
const R = { md: 14, xl: 24 }
const BASE_URL = 'http://192.168.1.71:5000/api/auth'

export default function TwoFactorSetup() {
  const router = useRouter()
  const [qrUrl,   setQrUrl]   = useState<string | null>(null)
  const [secret,  setSecret]  = useState('')
  const [token,   setToken]   = useState('')
  const [loading, setLoading] = useState(true)
  const [verifying, setVerifying] = useState(false)
  const [focused, setFocused] = useState(false)

  useEffect(() => { fetchQr() }, [])

  const fetchQr = async () => {
    try {
      const userId = await AsyncStorage.getItem('@userId')
      const res = await fetch(`${BASE_URL}/2fa/setup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      setQrUrl(data.qrDataUrl)
      setSecret(data.secret)
    } catch (err: any) {
      Alert.alert('Error', err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async () => {
    if (token.length !== 6) return Alert.alert('Invalid', 'Enter the 6-digit code')
    setVerifying(true)
    try {
      const userId = await AsyncStorage.getItem('@userId')
      const res = await fetch(`${BASE_URL}/2fa/enable`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, token }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)

      await AsyncStorage.removeItem('@needs2faSetup')
      await AsyncStorage.setItem('@2faEnabled', 'true')
      router.replace('/modules/Dashboard')
    } catch (err: any) {
      Alert.alert('Wrong Code', err.message)
    } finally {
      setVerifying(false)
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.blobTR} />

      {/* Header */}
      <View style={styles.topZone}>
        <View style={styles.iconBox}>
          <ShieldCheck size={28} color={C.accent} />
        </View>
        <Text style={styles.brand}>YAMMY</Text>
        <Text style={styles.tagline}>Two-Factor Authentication</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Set Up Authenticator</Text>
        <Text style={styles.sub}>
          Scan this QR code with Google Authenticator or Authy, then enter the 6-digit code below.
        </Text>

        {/* Steps */}
        {['Install Google Authenticator or Authy', 'Scan the QR code below', 'Enter the 6-digit code'].map((step, i) => (
          <View key={i} style={styles.stepRow}>
            <View style={styles.stepNum}><Text style={styles.stepNumTxt}>{i + 1}</Text></View>
            <Text style={styles.stepTxt}>{step}</Text>
          </View>
        ))}

        {/* QR Code */}
        <View style={styles.qrBox}>
          {loading ? (
            <ActivityIndicator size="large" color={C.accent} />
          ) : qrUrl ? (
            <Image source={{ uri: qrUrl }} style={styles.qrImg} />
          ) : null}
        </View>

        {/* Manual secret */}
        {secret ? (
          <View style={styles.secretBox}>
            <Text style={styles.secretLabel}>MANUAL ENTRY CODE</Text>
            <Text style={styles.secretValue}>{secret}</Text>
          </View>
        ) : null}

        {/* Token input */}
        <Text style={[styles.label, { marginTop: 20 }]}>VERIFICATION CODE</Text>
        <View style={[styles.inputRow, focused && styles.focused]}>
          <TextInput
            style={styles.codeInput}
            placeholder="000 000"
            placeholderTextColor={C.mutedDark}
            value={token.replace(/(\d{3})(\d{1,3})/, '$1 $2')}
            onChangeText={t => setToken(t.replace(/\s/g, '').slice(0, 6))}
            keyboardType="number-pad"
            maxLength={7}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
          />
        </View>

        <TouchableOpacity
          style={[styles.cta, (verifying || token.length < 6) && { opacity: 0.55 }]}
          onPress={handleVerify}
          disabled={verifying || token.length < 6}
          activeOpacity={0.85}
        >
          <Text style={styles.ctaTxt}>{verifying ? 'Verifying...' : 'Enable 2FA & Continue'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg, paddingHorizontal: 20, paddingTop: 60 },
  blobTR:    { position: 'absolute', top: -70, right: -70, width: 200, height: 200, borderRadius: 100, backgroundColor: C.accent, opacity: 0.07 },

  topZone: { alignItems: 'center', marginBottom: 28 },
  iconBox: { width: 64, height: 64, borderRadius: 18, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  brand:   { fontSize: 24, fontWeight: '900', color: C.white, letterSpacing: 9, marginBottom: 6 },
  tagline: { fontSize: 12, color: C.muted },

  card:  { backgroundColor: C.card, borderRadius: R.xl, borderWidth: 1, borderColor: C.border, padding: 22 },
  title: { fontSize: 20, fontWeight: '900', color: C.white, marginBottom: 6 },
  sub:   { fontSize: 13, color: C.muted, marginBottom: 20, lineHeight: 20 },

  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  stepNum: { width: 22, height: 22, borderRadius: 11, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center' },
  stepNumTxt: { color: '#fff', fontSize: 11, fontWeight: '800' },
  stepTxt: { fontSize: 13, color: C.muted, flex: 1 },

  qrBox: { alignSelf: 'center', width: 160, height: 160, backgroundColor: '#fff', borderRadius: R.md, marginVertical: 20, alignItems: 'center', justifyContent: 'center', padding: 8 },
  qrImg: { width: 144, height: 144 },

  secretBox:   { backgroundColor: C.inner, borderRadius: R.md, borderWidth: 1, borderColor: C.border, padding: 12, alignItems: 'center' },
  secretLabel: { fontSize: 9, fontWeight: '800', color: C.label, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 },
  secretValue: { fontSize: 13, fontWeight: '700', color: C.accent, letterSpacing: 2 },

  label: { fontSize: 10, fontWeight: '800', color: C.label, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 },
  inputRow: { backgroundColor: C.inner, borderRadius: R.md, borderWidth: 1, borderColor: C.border, height: 56, alignItems: 'center', justifyContent: 'center' },
  focused:  { borderColor: C.accent },
  codeInput: { fontSize: 24, fontWeight: '800', color: C.white, letterSpacing: 8, textAlign: 'center', width: '100%' },

  cta:   { backgroundColor: C.accent, height: 50, borderRadius: R.md, alignItems: 'center', justifyContent: 'center', marginTop: 20, shadowColor: C.accent, shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
  ctaTxt: { color: '#fff', fontSize: 15, fontWeight: '800', letterSpacing: 0.3 },
})
