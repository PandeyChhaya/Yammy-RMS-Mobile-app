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

const SOCKET_URL = 'http://192.168.1.71:5000'

const C = {
  bg:          '#0F172A',
  surface:     '#1E293B',
  card:        '#1E293B',
  cardBorder:  '#334155',
  elevated:    '#334155',
  accent:      '#6366F1',
  accentDim:   '#6366F122',
  accentBorder:'#6366F155',
  success:     '#22C55E',
  successDim:  '#22C55E18',
  successBdr:  '#22C55E44',
  danger:      '#EF4444',
  dangerDim:   '#EF444418',
  dangerBdr:   '#EF444444',
  warning:     '#F59E0B',
  warningDim:  '#F59E0B18',
  warningBdr:  '#F59E0B44',
  textPrimary: '#F1F5F9',
  textSub:     '#94A3B8',
  textMuted:   '#475569',
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
          <Bell size={20} color={C.textPrimary} />
          <View>
            <Text style={styles.headerTitle}>Waiter Calls</Text>
            <Text style={styles.headerSub}>Live customer requests</Text>
          </View>
        </View>
        <View style={[styles.statusPill, connected ? styles.statusOnline : styles.statusOffline]}>
          <View style={[styles.statusDot, { backgroundColor: connected ? C.success : C.danger }]} />
          <Text style={[styles.statusText, { color: connected ? C.success : C.danger }]}>
            {connected ? 'Live' : 'Offline'}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {calls.length === 0 && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Bell size={36} color={C.accent} />
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
                    <Clock size={11} color={C.textMuted} />
                    <Text style={styles.timeText}>{formatTime(call.timestamp)}</Text>
                    <TouchableOpacity onPress={() => handleDismiss(call.id)}>
                      <X size={14} color={C.textMuted} />
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
                  <CheckCircle size={14} color={C.textPrimary} />
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
                    <Text style={[styles.tableTagText, { color: C.success }]}>Table {call.table_number}</Text>
                  </View>
                  <TouchableOpacity onPress={() => handleDismiss(call.id)}>
                    <X size={14} color={C.textMuted} />
                  </TouchableOpacity>
                </View>
                <Text style={styles.customerName}>{call.customer_name}</Text>
                <View style={styles.acceptedByRow}>
                  <CheckCircle size={12} color={C.success} />
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
  container: { flex: 1, backgroundColor: C.bg },
  content:   { padding: 16, paddingBottom: 48 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: C.surface,
    borderBottomWidth: 1, borderBottomColor: C.cardBorder,
    paddingTop: 52, paddingHorizontal: 20, paddingBottom: 20,
  },
  headerLeft:  { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerTitle: { fontSize: 18, fontWeight: '900', color: C.textPrimary },
  headerSub:   { fontSize: 11, color: C.textSub, marginTop: 2 },

  statusPill:    { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 100, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1 },
  statusOnline:  { backgroundColor: C.successDim, borderColor: C.successBdr },
  statusOffline: { backgroundColor: C.dangerDim,  borderColor: C.dangerBdr },
  statusDot:     { width: 6, height: 6, borderRadius: 3 },
  statusText:    { fontSize: 10, fontWeight: '700' },

  emptyState: { alignItems: 'center', paddingVertical: 72, gap: 12 },
  emptyIcon:  { width: 80, height: 80, borderRadius: 40, backgroundColor: C.accentDim, borderWidth: 1.5, borderColor: C.accentBorder, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 17, fontWeight: '800', color: C.textPrimary },
  emptySub:   { fontSize: 13, color: C.textSub, textAlign: 'center', lineHeight: 20 },

  sectionLabel: { fontSize: 11, fontWeight: '800', color: C.textMuted, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 10 },

  card: {
    borderRadius: 14, borderWidth: 1.5, padding: 14, marginBottom: 12, gap: 8,
  },
  cardPending:  { backgroundColor: C.accentDim,  borderColor: C.accentBorder },
  cardAccepted: { backgroundColor: C.successDim, borderColor: C.successBdr, opacity: 0.8 },

  cardHeader:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },

  tableTag:         { backgroundColor: C.accent, borderRadius: 100, paddingHorizontal: 10, paddingVertical: 4 },
  tableTagAccepted: { backgroundColor: C.successDim, borderWidth: 1, borderColor: C.successBdr },
  tableTagText:     { fontSize: 11, fontWeight: '800', color: C.textPrimary },

  timeText:     { fontSize: 11, color: C.textMuted },
  customerName: { fontSize: 15, fontWeight: '800', color: C.textPrimary },
  noteText:     { fontSize: 13, color: C.textSub, fontStyle: 'italic' },

  acceptBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: C.success, borderRadius: 100, paddingVertical: 10, marginTop: 4,
    shadowColor: C.success,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3, shadowRadius: 6, elevation: 3,
  },
  acceptBtnText: { fontSize: 13, fontWeight: '800', color: C.textPrimary },

  acceptedByRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  acceptedByText:{ fontSize: 12, color: C.success, fontWeight: '600' },
})