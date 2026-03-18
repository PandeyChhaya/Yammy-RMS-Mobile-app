import { MessageSquare, Phone, Send, X } from 'lucide-react-native'
import { useState } from 'react'
import {
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native'

interface SimpleSMSChatProps {
  tableId?: string
  tableName?: string
  visible: boolean
  onClose: () => void
}

interface Message {
  id: string
  text: string
  phone: string
  timestamp: string
  status: 'sent' | 'pending' | 'failed'
}

export default function SimpleSMSChat({
  tableId,
  tableName,
  visible,
  onClose,
}: SimpleSMSChatProps) {
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [sending, setSending] = useState(false)

  const handleSend = async () => {
    if (!phone.trim() || !message.trim()) {
      Alert.alert('Error', 'Please enter phone and message')
      return
    }

    setSending(true)

    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      text: message,
      phone,
      timestamp: new Date().toISOString(),
      status: 'sent',
    }

    setMessages(prev => [...prev, newMessage])
    setMessage('')
    setSending(false)

    Alert.alert('Success', 'SMS sent!')
  }

  const generateTicket = () => {
    const ticket = `Yammy Fresh POS\n\n${tableName ? `Table: ${tableName}\n` : ''}Order Summary\n\nThank you for dining with us!`
    setMessage(ticket)
  }

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <MessageSquare size={20} color="#C41E1E" />
              <Text style={styles.title}>SMS Chat</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Messages */}
          <ScrollView style={styles.messages} contentContainerStyle={styles.messagesContent}>
            {messages.length === 0 ? (
              <View style={styles.empty}>
                <MessageSquare size={48} color="#CCC" />
                <Text style={styles.emptyText}>No messages yet</Text>
              </View>
            ) : (
              messages.map(msg => (
                <View key={msg.id} style={styles.messageCard}>
                  <View style={styles.messageHeader}>
                    <View style={styles.messageHeaderLeft}>
                      <Phone size={12} color="#666" />
                      <Text style={styles.messagePhone}>{msg.phone}</Text>
                    </View>
                    <Text style={styles.messageTime}>
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </Text>
                  </View>
                  <Text style={styles.messageText}>{msg.text}</Text>
                  <View style={styles.messageFooter}>
                    <View style={[
                      styles.statusBadge,
                      { backgroundColor: msg.status === 'sent' ? '#22C55E' : '#EAB308' }
                    ]}>
                      <Text style={styles.statusText}>{msg.status}</Text>
                    </View>
                  </View>
                </View>
              ))
            )}
          </ScrollView>

          {/* Input */}
          <View style={styles.inputSection}>
            <View style={styles.inputRow}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Phone Number</Text>
                <TextInput
                  style={styles.input}
                  placeholder="+977 98..."
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Message</Text>
              <TextInput
                style={styles.textarea}
                placeholder="Type your message..."
                value={message}
                onChangeText={setMessage}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
              <Text style={styles.charCount}>{message.length}/160</Text>
            </View>

            <View style={styles.actions}>
              <TouchableOpacity style={styles.ticketBtn} onPress={generateTicket}>
                <Text style={styles.ticketBtnText}>Generate Ticket</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sendBtn, sending && styles.sendBtnDisabled]}
                onPress={handleSend}
                disabled={sending}
              >
                <Send size={16} color="#FFF" />
                <Text style={styles.sendBtnText}>
                  {sending ? 'Sending...' : 'Send'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  container: { backgroundColor: '#FEF1A8', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#E8D88A' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 18, fontWeight: '700', color: '#1A1A1A' },
  closeBtn: { padding: 4 },
  messages: { maxHeight: '40%', backgroundColor: '#FFF' },
  messagesContent: { padding: 16 },
  empty: { alignItems: 'center', paddingVertical: 40, gap: 8 },
  emptyText: { fontSize: 14, color: '#999' },
  messageCard: { backgroundColor: '#FFFDF0', borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#E8D88A' },
  messageHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  messageHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  messagePhone: { fontSize: 12, fontWeight: '600', color: '#666' },
  messageTime: { fontSize: 11, color: '#999' },
  messageText: { fontSize: 13, color: '#1A1A1A', marginBottom: 8 },
  messageFooter: { flexDirection: 'row', justifyContent: 'flex-end' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusText: { fontSize: 10, fontWeight: '600', color: '#FFF' },
  inputSection: { padding: 20, borderTopWidth: 1, borderTopColor: '#E8D88A', backgroundColor: '#FEF1A8' },
  inputRow: { marginBottom: 12 },
  inputGroup: { marginBottom: 12 },
  label: { fontSize: 13, fontWeight: '600', color: '#1A1A1A', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#E8D88A', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, backgroundColor: '#FFFDF0' },
  textarea: { borderWidth: 1, borderColor: '#E8D88A', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, backgroundColor: '#FFFDF0', minHeight: 80 },
  charCount: { fontSize: 11, color: '#999', marginTop: 4, textAlign: 'right' },
  actions: { flexDirection: 'row', gap: 12 },
  ticketBtn: { flex: 1, backgroundColor: '#E8D88A', paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  ticketBtnText: { fontSize: 14, fontWeight: '600', color: '#1A1A1A' },
  sendBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#C41E1E', paddingVertical: 12, borderRadius: 12 },
  sendBtnDisabled: { opacity: 0.5 },
  sendBtnText: { fontSize: 14, fontWeight: '600', color: '#FFF' },
})