import AsyncStorage from '@react-native-async-storage/async-storage'
import { Bell, CheckCircle, Loader } from 'lucide-react-native'
import { useEffect, useRef, useState } from 'react'
import {
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native'
import { io as socketIO } from 'socket.io-client'

const SOCKET_URL = 'http://192.168.1.4:5000'

const C = {
  espresso:    '#1C1008',
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
}

type CallState = 'idle' | 'calling' | 'accepted'

export default function CallWaiter() {
  const [callState,    setCallState]    = useState<CallState>('idle')
  const [note,         setNote]         = useState('')
  const [tableNumber,  setTableNumber]  = useState('')
  const [acceptedBy,   setAcceptedBy]   = useState('')
  const [userName,     setUserName]     = useState('Guest')
  const socketRef = useRef<any>(null)

  useEffect(() => {
    AsyncStorage.getItem('@userName').then(name => {
      if (name) setUserName(name)
    })

    socketRef.current = socketIO(SOCKET_URL, { transports: ['websocket'] })

    socketRef.current.on('connect', () => {
      console.log('Socket connected')
    })

    socketRef.current.on('call_accepted', (data: { waiter_name: string; table_number: string }) => {
      if (data.table_number === tableNumber) {
        setAcceptedBy(data.waiter_name)
        setCallState('accepted')
      }
    })

    return () => {
      socketRef.current?.disconnect()
    }
  }, [tableNumber])

  const handleCallWaiter = () => {
    if (!tableNumber.trim()) return
    setCallState('calling')
    socketRef.current?.emit('call_waiter', {
      table_number:  tableNumber,
      customer_name: userName,
      note:          note,
    })
  }

  const handleReset = () => {
    setCallState('idle')
    setNote('')
    setAcceptedBy('')
  }

  if (callState === 'accepted') {
    return (
      <View style={styles.centered}>
        <View style={styles.successIcon}>
          <CheckCircle size={52} color={C.sage} />
        </View>
        <Text style={styles.successTitle}>Waiter is Coming!</Text>
        <Text style={styles.successSub}>{acceptedBy} is on their way to Table {tableNumber}.</Text>
        <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
          <Text style={styles.resetBtnText}>Done</Text>
        </TouchableOpacity>
      </View>
    )
  }

  if (callState === 'calling') {
    return (
      <View style={styles.centered}>
        <View style={styles.callingIcon}>
          <Loader size={40} color={C.brass} />
        </View>
        <Text style={styles.callingTitle}>Calling Waiter…</Text>
        <Text style={styles.callingSub}>Please wait, a waiter will be with you shortly.</Text>
        <TouchableOpacity style={styles.cancelBtn} onPress={handleReset}>
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <Bell size={36} color={C.brass} />
      </View>
      <Text style={styles.title}>Call a Waiter</Text>
      <Text style={styles.subtitle}>Enter your table number and we'll send someone right away.</Text>

      <Text style={styles.label}>Table Number *</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. T1, T2..."
        placeholderTextColor={C.latte}
        value={tableNumber}
        onChangeText={setTableNumber}
      />

      <Text style={styles.label}>Note (optional)</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="e.g. Need extra napkins, bill please..."
        placeholderTextColor={C.latte}
        value={note}
        onChangeText={setNote}
        multiline
        numberOfLines={3}
      />

      <TouchableOpacity
        style={[styles.callBtn, !tableNumber.trim() && { opacity: 0.5 }]}
        onPress={handleCallWaiter}
        disabled={!tableNumber.trim()}
      >
        <Bell size={18} color={C.cream} />
        <Text style={styles.callBtnText}>Call Waiter</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.cream, padding: 24, paddingTop: 60, alignItems: 'center' },
  centered:  { flex: 1, backgroundColor: C.cream, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16 },

  iconWrap: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: C.brassLight, borderWidth: 2, borderColor: C.brassBorder,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  title:    { fontSize: 22, fontWeight: '900', color: C.espresso, textAlign: 'center' },
  subtitle: { fontSize: 13, color: C.clay, textAlign: 'center', lineHeight: 20, marginBottom: 24 },

  label: { alignSelf: 'flex-start', fontSize: 11, fontWeight: '800', color: C.clay, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 6, marginTop: 14 },
  input: { width: '100%', borderWidth: 1.5, borderColor: C.vellum, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: C.espresso, backgroundColor: C.parchment },
  textArea: { height: 80, textAlignVertical: 'top' },

  callBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: C.brass, borderRadius: 100, paddingVertical: 16,
    width: '100%', marginTop: 32,
  },
  callBtnText: { fontSize: 16, fontWeight: '900', color: C.cream },

  callingIcon:  { width: 96, height: 96, borderRadius: 48, backgroundColor: C.brassLight, borderWidth: 2, borderColor: C.brassBorder, alignItems: 'center', justifyContent: 'center' },
  callingTitle: { fontSize: 22, fontWeight: '900', color: C.espresso },
  callingSub:   { fontSize: 13, color: C.clay, textAlign: 'center', lineHeight: 20 },
  cancelBtn:    { borderWidth: 1.5, borderColor: C.vellum, borderRadius: 100, paddingHorizontal: 24, paddingVertical: 12, marginTop: 8 },
  cancelBtnText:{ fontSize: 14, fontWeight: '700', color: C.clay },

  successIcon:  { width: 96, height: 96, borderRadius: 48, backgroundColor: C.sageLight, borderWidth: 2, borderColor: C.sageBorder, alignItems: 'center', justifyContent: 'center' },
  successTitle: { fontSize: 24, fontWeight: '900', color: C.espresso },
  successSub:   { fontSize: 13, color: C.clay, textAlign: 'center', lineHeight: 20 },
  resetBtn:     { backgroundColor: C.brassLight, borderWidth: 1.5, borderColor: C.brassBorder, borderRadius: 100, paddingHorizontal: 24, paddingVertical: 12, marginTop: 8 },
  resetBtnText: { fontSize: 14, fontWeight: '700', color: C.brass },
})