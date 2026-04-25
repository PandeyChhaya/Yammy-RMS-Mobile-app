import AsyncStorage from '@react-native-async-storage/async-storage'
import { Bell, CheckCircle, Clock, X } from 'lucide-react-native'
import { useEffect, useRef, useState } from 'react'
import {
    ScrollView,
    StyleSheet,
    Text,
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
const radius = { xs: 6, sm: 10, md: 14, lg: 18, pill: 100 }

interface WaiterCall {
  id:            string
  table_number:  string
  customer_name: string
  note:          string
  timestamp:     string
  accepted:      boolean
  accepted_by?:  string
}

export default function WaiterNotifications() {
  const [calls,      setCalls]      = useState<WaiterCall[]>([])
  const [waiterName, setWaiterName] = useState('Waiter')
  const [waiterId,   setWaiterId]   = useState<string | null>(null)
  const [connected,  setConnected]  = useState(false)
  const socketRef = useRef<any>(null)

  useEffect(() => {
    AsyncStorage.multiGet(['@userName', '@userId']).then(pairs => {
      const name = pairs[0][1]
      const id   = pairs[1][1]
      if (name) setWaiterName(name)
      if (id)   setWaiterId(id)

      socketRef.current = socketIO(SOCKET_URL, { transports: ['websocket'] })

      socketRef.current.on('connect', () => {
        setConnected(true)
        socketRef.current.emit('join_waiter', parseInt(id ?? '0'))
      })

      socketRef.current.on('disconnect', () => setConnected(false))

      socketRef.current.on('waiter_called', (data: Omit<WaiterCall, 'id' | 'accepted'>) => {
        setCalls(prev => [
          {
            ...data,
            id:       Date.now().toString(),
            accepted: false,
          },
          ...prev,
        ])
      })

      socketRef.current.on('call_accepted', (data: { waiter_name: string; table_number: string }) => {
        setCalls(prev =>
          prev.map(c =>
            c.table_number === data.table_number && !c.accepted
              ? { ...c, accepted: true, accepted_by: data.waiter_name }
              : c
          )
        )
      })
    })

    return () => socketRef.current?.disconnect()
  }, [])

  const handleAccept = (call: WaiterCall) => {
    socketRef.current?.emit('accept_call', {
      waiter_name:  waiterName,
      table_number: call.table_number,
    })
    setCalls(prev =>
      prev.map(c =>
        c.id === call.id
          ? { ...c, accepted: true, accepted_by: waiterName }
          : c
      )
    )
  }

  const handleDismiss = (id: string) => {
    setCalls(prev => prev.filter(c => c.id !== id))
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  }

  const pendingCalls  = calls.filter(c => !c.accepted)
  const acceptedCalls = calls.filter(c => c.accepted)

  return (
    <View style={styles.container}>

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Bell size={20} color={C.cream} />
          <View>
            <Text style={styles.headerTitle}>Waiter Calls</Text>
            <Text style={styles.headerSub}>Live customer requests</Text>
          </View>
        </View>
        <View style={[styles.statusPill, connected ? styles.statusOnline : styles.statusOffline]}>
          <View style={[styles.statusDot, { backgroundColor: connected ? C.sage : C.terracotta }]} />
          <Text style={[styles.statusText, { color: connected ? C.sage : C.terracotta }]}>
            {connected ? 'Live' : 'Offline'}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {calls.length === 0 && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Bell size={36} color={C.brass} />
            </View>
            <Text style={styles.emptyTitle}>No calls yet</Text>
            <Text style={styles.emptySub}>Customer requests will appear here in real-time</Text>
          </View>
        )}

        {pendingCalls.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>Pending · {pendingCalls.length}</Text>
            {pendingCalls.map(call => (
              <View key={call.id} style={[styles.card, styles.cardPending]}>
                <View style={styles.cardHeader}>
                  <View style={styles.tableTag}>
                    <Text style={styles.tableTagText}>Table {call.table_number}</Text>
                  </View>
                  <View style={styles.cardHeaderRight}>
                    <Clock size={11} color={C.clay} />
                    <Text style={styles.timeText}>{formatTime(call.timestamp)}</Text>
                    <TouchableOpacity onPress={() => handleDismiss(call.id)}>
                      <X size={14} color={C.clay} />
                    </TouchableOpacity>
                  </View>
                </View>

                <Text style={styles.customerName}>{call.customer_name}</Text>
                {call.note ? (
                  <Text style={styles.noteText}>"{call.note}"</Text>
                ) : null}

                <TouchableOpacity
                  style={styles.acceptBtn}
                  onPress={() => handleAccept(call)}
                >
                  <CheckCircle size={14} color={C.cream} />
                  <Text style={styles.acceptBtnText}>I'll Go</Text>
                </TouchableOpacity>
              </View>
            ))}
          </>
        )}

        {acceptedCalls.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, { marginTop: 20 }]}>Accepted · {acceptedCalls.length}</Text>
            {acceptedCalls.map(call => (
              <View key={call.id} style={[styles.card, styles.cardAccepted]}>
                <View style={styles.cardHeader}>
                  <View style={[styles.tableTag, styles.tableTagAccepted]}>
                    <Text style={[styles.tableTagText, { color: C.sage }]}>Table {call.table_number}</Text>
                  </View>
                  <TouchableOpacity onPress={() => handleDismiss(call.id)}>
                    <X size={14} color={C.clay} />
                  </TouchableOpacity>
                </View>
                <Text style={styles.customerName}>{call.customer_name}</Text>
                <View style={styles.acceptedByRow}>
                  <CheckCircle size={12} color={C.sage} />
                  <Text style={styles.acceptedByText}>
                    {call.accepted_by === waiterName ? 'You accepted this' : `${call.accepted_by} is handling this`}
                  </Text>
                </View>
              </View>
            ))}
          </>
        )}

      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.cream },
  content:   { padding: 16, paddingBottom: 48 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: C.espresso,
    paddingTop: 52, paddingHorizontal: 20, paddingBottom: 20,
  },
  headerLeft:  { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerTitle: { fontSize: 18, fontWeight: '900', color: C.cream },
  headerSub:   { fontSize: 11, color: C.latte, marginTop: 2 },

  statusPill:    { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 100, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1 },
  statusOnline:  { backgroundColor: C.sageLight, borderColor: C.sageBorder },
  statusOffline: { backgroundColor: C.tcLight,   borderColor: C.tcBorder },
  statusDot:     { width: 6, height: 6, borderRadius: 3 },
  statusText:    { fontSize: 10, fontWeight: '700' },

  emptyState: { alignItems: 'center', paddingVertical: 72, gap: 12 },
  emptyIcon:  { width: 80, height: 80, borderRadius: 40, backgroundColor: C.brassLight, borderWidth: 1.5, borderColor: C.brassBorder, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 17, fontWeight: '800', color: C.espresso },
  emptySub:   { fontSize: 13, color: C.clay, textAlign: 'center', lineHeight: 20 },

  sectionLabel: { fontSize: 11, fontWeight: '800', color: C.clay, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 10 },

  card: {
    borderRadius: 14, borderWidth: 1.5, padding: 14, marginBottom: 12, gap: 8,
  },
  cardPending:  { backgroundColor: C.brassLight, borderColor: C.brassBorder },
  cardAccepted: { backgroundColor: C.sageLight,  borderColor: C.sageBorder, opacity: 0.8 },

  cardHeader:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },

  tableTag:         { backgroundColor: C.brass, borderRadius: 100, paddingHorizontal: 10, paddingVertical: 4 },
  tableTagAccepted: { backgroundColor: C.sageLight, borderWidth: 1, borderColor: C.sageBorder },
  tableTagText:     { fontSize: 11, fontWeight: '800', color: C.cream },

  timeText:     { fontSize: 11, color: C.clay },
  customerName: { fontSize: 15, fontWeight: '800', color: C.espresso },
  noteText:     { fontSize: 13, color: C.clay, fontStyle: 'italic' },

  acceptBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: C.sage, borderRadius: 100, paddingVertical: 10, marginTop: 4,
  },
  acceptBtnText: { fontSize: 13, fontWeight: '800', color: C.cream },

  acceptedByRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  acceptedByText:{ fontSize: 12, color: C.sage, fontWeight: '600' },
})