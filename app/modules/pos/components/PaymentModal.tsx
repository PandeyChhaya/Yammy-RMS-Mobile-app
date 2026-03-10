import { CreditCard, X } from 'lucide-react-native'
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useTaxSettings } from '../../../../shared/hooks/useTaxSettings'

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  totalAmount: number
  paymentMethod: string
  customerName: string
  isProcessing: boolean
}

export default function PaymentModal({
  isOpen,
  onClose,
  onConfirm,
  totalAmount,
  paymentMethod,
  customerName,
  isProcessing
}: PaymentModalProps) {
  const { formatAmount } = useTaxSettings()

  const paymentMethods = [
    { id: 'cash', name: 'Cash' },
    { id: 'card', name: 'Card' },
    { id: 'transfer', name: 'Transfer' },
  ]

  return (
    <Modal
      visible={isOpen}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>Payment Confirmation</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <View style={styles.centerContent}>
              <CreditCard size={64} color="#2563EB" style={styles.icon} />
              <Text style={styles.totalText}>
                Total to pay: {formatAmount(totalAmount)}
              </Text>
              <Text style={styles.methodText}>
                Mode: {paymentMethods.find(m => m.id === paymentMethod)?.name}
              </Text>
            </View>

            {customerName && (
              <View style={styles.customerBox}>
                <Text style={styles.customerLabel}>Customer:</Text>
                <Text style={styles.customerName}>{customerName}</Text>
              </View>
            )}
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.button, styles.cancelButton]}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onConfirm}
              disabled={isProcessing}
              style={[
                styles.button,
                styles.confirmButton,
                isProcessing && styles.buttonDisabled
              ]}
            >
              <Text style={styles.confirmButtonText}>
                {isProcessing ? 'Processing...' : 'Confirm'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    maxWidth: 448,
    width: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  closeButton: {
    padding: 8,
  },
  content: {
    marginBottom: 24,
  },
  centerContent: {
    alignItems: 'center',
  },
  icon: {
    marginBottom: 16,
  },
  totalText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  methodText: {
    fontSize: 14,
    color: '#4B5563',
    marginTop: 8,
  },
  customerBox: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
  },
  customerLabel: {
    fontSize: 12,
    color: '#4B5563',
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  confirmButton: {
    backgroundColor: '#2563EB',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
})