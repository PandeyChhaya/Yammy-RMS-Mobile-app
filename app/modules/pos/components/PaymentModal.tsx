import { CreditCard, DollarSign, Wallet, X } from 'lucide-react-native'
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

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
  totalAmount: number
  paymentMethod: string
  customerName: string
  isProcessing: boolean
}

const PAYMENT_METHODS = [
  { id: 'cash', label: 'Cash', icon: DollarSign, color: '#22C55E' },
  { id: 'card', label: 'Card', icon: CreditCard, color: '#3B82F6' },
  { id: 'mobile', label: 'Mobile', icon: Wallet, color: '#8B5CF6' },
]

export default function PaymentModal({
  isOpen,
  onClose,
  onConfirm,
  totalAmount,
  isProcessing,
}: PaymentModalProps) {
  const [localName, setLocalName] = useState('')
  const [localMethod, setLocalMethod] = useState('cash')
  const [processing, setProcessing] = useState(false)

  const handleConfirm = async () => {
  if (!localName.trim()) {
    Alert.alert('Error', 'Please enter customer name')
    return
  }

  console.log('🔵 PaymentModal: Confirming payment with name:', localName)

  setProcessing(true)
  try {
    await onConfirm()  // This calls POS handlePayment
    setLocalName('')
    setLocalMethod('cash')
  } catch (error) {
    console.error('❌ PaymentModal error:', error)
  } finally {
    setProcessing(false)
  }
}

  return (
    <Modal visible={isOpen} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Payment</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scroll}>
            <View style={styles.totalSection}>
              <Text style={styles.totalLabel}>Total Amount</Text>
              <Text style={styles.totalValue}>NPR {totalAmount.toFixed(2)}</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Customer Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter customer name"
                value={localName}
                onChangeText={setLocalName}
                autoFocus
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Payment Method</Text>
              <View style={styles.methods}>
                {PAYMENT_METHODS.map(method => {
                  const Icon = method.icon
                  const isSelected = localMethod === method.id

                  return (
                    <TouchableOpacity
                      key={method.id}
                      style={[
                        styles.methodCard,
                        isSelected && { backgroundColor: method.color, borderColor: method.color }
                      ]}
                      onPress={() => setLocalMethod(method.id)}
                    >
                      <Icon size={24} color={isSelected ? '#FFF' : method.color} />
                      <Text style={[styles.methodText, isSelected && styles.methodTextActive]}>
                        {method.label}
                      </Text>
                    </TouchableOpacity>
                  )
                })}
              </View>
            </View>
          </ScrollView>

          <TouchableOpacity
            style={[styles.confirmBtn, processing && styles.confirmBtnDisabled]}
            onPress={handleConfirm}
            disabled={processing}
          >
            <Text style={styles.confirmText}>
              {processing ? 'Processing...' : `Pay NPR ${totalAmount.toFixed(2)}`}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  container: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '85%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#E8D88A' },
  title: { fontSize: 20, fontWeight: '700', color: '#1A1A1A' },
  closeBtn: { padding: 4 },
  scroll: { maxHeight: '65%' },
  totalSection: { backgroundColor: '#FEF1A8', padding: 24, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#E8D88A' },
  totalLabel: { fontSize: 13, color: '#5C5436', marginBottom: 6 },
  totalValue: { fontSize: 36, fontWeight: '700', color: '#C41E1E' },
  section: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  label: { fontSize: 14, fontWeight: '600', color: '#1A1A1A', marginBottom: 12 },
  input: { borderWidth: 1, borderColor: '#E8D88A', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, backgroundColor: '#FFFDF0' },
  methods: { flexDirection: 'row', gap: 12 },
  methodCard: { flex: 1, alignItems: 'center', padding: 18, borderRadius: 12, borderWidth: 2, borderColor: '#E8D88A', backgroundColor: '#FFF', gap: 8 },
  methodText: { fontSize: 12, fontWeight: '600', color: '#666' },
  methodTextActive: { color: '#FFF' },
  confirmBtn: { backgroundColor: '#C41E1E', margin: 20, padding: 18, borderRadius: 12, alignItems: 'center' },
  confirmBtnDisabled: { opacity: 0.5 },
  confirmText: { fontSize: 16, fontWeight: '700', color: '#FFF' },
})