import { CheckCircle, Clock, MessageSquare, Phone, RefreshCw, Send, XCircle } from 'lucide-react-native'
import React, { useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { useBusinessSettings } from '../../../shared/hooks/useBusinessSettings'
import { smsTicketService } from '../../smsticket/services/smsTicketService'
import { normalizePhoneNumber } from '../../smsticket/utils/phoneNormalization'
import { reservationService } from '../../tables/services/reservationService'
import { ReservationStatus } from '../../tables/types/reservation'
import { timelineService } from '../services/timelineService'
import { ReservationEvent, TimelineEvent, TimelineFilters } from '../types/timeline'
import ReservationWidget from './ReservationWidget'

const C = {
  espresso:    '#1C1008',
  clay:        '#7A4528',
  latte:       '#C8956A',
  cream:       '#FDF6EC',
  parchment:   '#F5E9D4',
  vellum:      '#EDD9BC',
  brass:       '#B5822A',
  sage:        '#3B6E52',
  violet:      '#6D3FA0',
  violetLight: '#F3EDFB',
}

const radius = { xs: 6, sm: 10, md: 14, pill: 100 }

interface SMSMessage {
  id: string
  message: string
  phone_number: string
  status: string
  provider: string
  created_at: string
  customer_name?: string
}

interface ModernSMSChatSectionProps {
  selectedTable: any
  currentOrder?: {
    id: string
    total: number
    items: Array<{
      name: string
      quantity: number
      price: number
    }>
  }
  shouldGenerateTicket?: boolean
}

export default function ModernSMSChatSection({
  selectedTable,
  currentOrder,
  shouldGenerateTicket = false,
}: ModernSMSChatSectionProps) {
  const [phoneNumber, setPhoneNumber] = useState('')
  const [customer, setCustomer] = useState('')
  const [message, setMessage] = useState('')
  const [isExpanded, setIsExpanded] = useState(true)
  const [messages, setMessages] = useState<SMSMessage[]>([])
  const [isSendingSMS, setIsSendingSMS] = useState(false)
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const scrollViewRef = useRef<ScrollView>(null)

  const { businessInfo } = useBusinessSettings()

  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([])
  const [isLoadingTimeline, setIsLoadingTimeline] = useState(false)
  const [timelineFilters, setTimelineFilters] = useState<TimelineFilters>({
    timeFilter: 'all',
    eventType: 'all',
    priority: 'all',
  })

  useEffect(() => {
    if (shouldGenerateTicket && currentOrder?.id && currentOrder?.total && currentOrder?.items.length > 0) {
      generateTicketMessage()
    }
  }, [shouldGenerateTicket, currentOrder])

  const loadMessages = async () => {
    setIsLoadingMessages(true)
    try {
      const allMessages = await smsTicketService.getSMSMessages(20)
      setMessages(allMessages)
    } catch (error) {
      console.error('Error loading messages:', error)
    } finally {
      setIsLoadingMessages(false)
    }
  }

  const loadTimelineEvents = async () => {
    setIsLoadingTimeline(true)
    try {
      const events = await timelineService.getFilteredTimelineEvents(timelineFilters)
      setTimelineEvents(events)
    } catch (error) {
      console.error('Error loading timeline events:', error)
    } finally {
      setIsLoadingTimeline(false)
    }
  }

  useEffect(() => {
    loadMessages()
    loadTimelineEvents()
  }, [timelineFilters])

  const generateTicketMessage = () => {
    const businessName = businessInfo?.business_name || 'Zikiro'
    let ticketMessage = `${businessName}\n\n`
    if (currentOrder?.id) ticketMessage += `Order #${currentOrder.id}\n`
    if (selectedTable) ticketMessage += `Table #${selectedTable.id}\n`
    ticketMessage += `\nOrder Details:\n`
    currentOrder?.items?.forEach(item => {
      ticketMessage += `• ${item.name} x${item.quantity} - ${item.price.toFixed(2)}€\n`
    })
    if (currentOrder?.total) ticketMessage += `\nTotal: ${currentOrder.total.toFixed(2)}€\n`
    ticketMessage += `\nThank you for your visit!`
    setMessage(ticketMessage)
  }

  const handleSendSMS = async () => {
    if (!phoneNumber || !message) return
    setIsSendingSMS(true)
    try {
      if (customer) await smsTicketService.ensureContactExists(phoneNumber, customer)
      const normalizedPhone = normalizePhoneNumber(phoneNumber)
      await smsTicketService.sendSMS({
        phone_number: normalizedPhone,
        message,
        customer_name: customer || undefined,
        order_id: currentOrder?.id,
        table_id: selectedTable?.id,
      })
      setMessage('')
      await loadMessages()
      await loadTimelineEvents()
    } catch (error) {
      console.error('Error sending SMS:', error)
    } finally {
      setIsSendingSMS(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
      case 'delivered': return <CheckCircle size={12} color="#10b981" />
      case 'failed': return <XCircle size={12} color="#ef4444" />
      default: return <Clock size={12} color="#f97316" />
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <MessageSquare size={16} color={C.cream} />
          <Text style={styles.headerTitle}>SMS Ticket</Text>
          {selectedTable && <Text style={styles.tableTag}>Table {selectedTable.number}</Text>}
        </View>
        <TouchableOpacity onPress={() => setIsExpanded(!isExpanded)} style={styles.expandBtn}>
          <Text style={styles.expandBtnText}>{isExpanded ? '−' : '+'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filterRow}>
        <View style={styles.pickerWrapper}>
          <Text style={styles.filterLabel}>Type</Text>
          <View style={styles.fakePicker}><Text style={styles.fakePickerText}>{timelineFilters.eventType}</Text></View>
        </View>
        <View style={styles.pickerWrapper}>
          <Text style={styles.filterLabel}>Time</Text>
          <View style={styles.fakePicker}><Text style={styles.fakePickerText}>{timelineFilters.timeFilter}</Text></View>
        </View>
      </View>

      {isExpanded && (
        <>
          <ScrollView 
            ref={scrollViewRef}
            style={styles.scroll} 
            contentContainerStyle={styles.scrollContent}
            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
          >
            {(isLoadingMessages || isLoadingTimeline) ? (
              <ActivityIndicator color={C.violet} style={styles.loader} />
            ) : (
              timelineEvents.map((event) => {
                if (event.type === 'sms') {
                  const msg = event.data as SMSMessage
                  return (
                    <View key={event.id} style={styles.smsBubble}>
                      <View style={styles.bubbleHeader}>
                        <Phone size={10} color={C.latte} />
                        <Text style={styles.phoneText}>{msg.phone_number}</Text>
                        {msg.customer_name && <Text style={styles.nameText}>({msg.customer_name})</Text>}
                        <Text style={styles.timeText}>{timelineService.formatEventTime(event.timestamp)}</Text>
                      </View>
                      <Text style={styles.messageText}>{msg.message}</Text>
                      <View style={styles.bubbleFooter}>
                        {getStatusIcon(msg.status)}
                        <Text style={styles.providerText}>{msg.provider}</Text>
                      </View>
                    </View>
                  )
                }
                if (event.type === 'reservation') {
                  return <ReservationWidget key={event.id} reservation={event.data as ReservationEvent} compact={true} />
                }
                return null
              })
            )}
          </ScrollView>

          <View style={styles.form}>
            <View style={styles.inputGrid}>
              <View style={styles.inputCol}>
                <Text style={styles.fieldLabel}>Phone</Text>
                <TextInput style={styles.input} value={phoneNumber} onChangeText={setPhoneNumber} placeholder="+33..." placeholderTextColor={C.latte} />
              </View>
              <View style={styles.inputCol}>
                <Text style={styles.fieldLabel}>Name</Text>
                <TextInput style={styles.input} value={customer} onChangeText={setCustomer} placeholder="Optional" placeholderTextColor={C.latte} />
              </View>
            </View>

            <View style={styles.messageBox}>
              <Text style={styles.fieldLabel}>Message ({message.length}/160)</Text>
              <TextInput 
                style={[styles.input, styles.textArea]} 
                value={message} 
                onChangeText={setMessage} 
                multiline 
                numberOfLines={3} 
                placeholder="Message details..." 
                placeholderTextColor={C.latte}
              />
            </View>

            <View style={styles.actions}>
              <TouchableOpacity onPress={() => { loadMessages(); loadTimelineEvents(); }} style={styles.refreshBtn}>
                <RefreshCw size={16} color={C.clay} />
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={handleSendSMS} 
                disabled={!phoneNumber || !message || isSendingSMS} 
                style={[styles.sendBtn, (!phoneNumber || !message) && styles.disabled]}
              >
                <Send size={16} color={C.cream} />
                <Text style={styles.sendBtnText}>{isSendingSMS ? 'Sending...' : 'Send SMS'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.parchment },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    backgroundColor: C.violet, 
    paddingHorizontal: 12, 
    paddingVertical: 10 
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { color: C.cream, fontWeight: '800', fontSize: 13 },
  tableTag: { color: C.parchment, fontSize: 11, fontWeight: '600', opacity: 0.8 },
  expandBtn: { padding: 4 },
  expandBtnText: { color: C.cream, fontSize: 18, fontWeight: 'bold' },
  filterRow: { flexDirection: 'row', padding: 8, gap: 8, backgroundColor: C.vellum },
  pickerWrapper: { flex: 1, gap: 2 },
  filterLabel: { fontSize: 9, fontWeight: '800', color: C.clay, textTransform: 'uppercase' },
  fakePicker: { backgroundColor: C.cream, borderRadius: radius.xs, padding: 6, borderWidth: 1, borderColor: C.latte },
  fakePickerText: { fontSize: 11, color: C.espresso, textTransform: 'capitalize' },
  scroll: { flex: 1 },
  scrollContent: { padding: 12, gap: 10 },
  loader: { marginTop: 20 },
  smsBubble: { backgroundColor: C.cream, padding: 12, borderRadius: radius.md, borderWidth: 1, borderColor: C.vellum },
  bubbleHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  phoneText: { fontSize: 11, fontWeight: '700', color: C.violet },
  nameText: { fontSize: 11, color: C.sage, fontWeight: '600' },
  timeText: { fontSize: 10, color: C.latte, marginLeft: 'auto' },
  messageText: { fontSize: 13, color: C.espresso, lineHeight: 18 },
  bubbleFooter: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  providerText: { fontSize: 10, color: C.latte, textTransform: 'uppercase' },
  form: { padding: 12, backgroundColor: C.parchment, borderTopWidth: 1.5, borderTopColor: C.vellum, gap: 10 },
  inputGrid: { flexDirection: 'row', gap: 8 },
  inputCol: { flex: 1, gap: 4 },
  fieldLabel: { fontSize: 10, fontWeight: '800', color: C.clay, textTransform: 'uppercase' },
  input: { backgroundColor: C.cream, borderWidth: 1.5, borderColor: C.vellum, borderRadius: radius.sm, padding: 8, fontSize: 13, color: C.espresso },
  textArea: { height: 60, textAlignVertical: 'top' },
  messageBox: { gap: 4 },
  actions: { flexDirection: 'row', gap: 8 },
  refreshBtn: { width: 44, height: 44, borderRadius: radius.sm, borderSize: 1.5, borderColor: C.vellum, backgroundColor: C.cream, alignItems: 'center', justifyContent: 'center' },
  sendBtn: { flex: 1, backgroundColor: C.violet, borderRadius: radius.sm, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  sendBtnText: { color: C.cream, fontWeight: '700', fontSize: 13 },
  disabled: { opacity: 0.5 }
})