import { X } from 'lucide-react-native'
import { useState } from 'react'
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native'

interface SplitTicketModalProps {
  isOpen: boolean
  onClose: () => void
  cartTotal: number
  onSplit: (amounts: number[]) => void
}

export default function SplitTicketModal({
  isOpen,
  onClose,
  cartTotal = 0,
  onSplit,
}: SplitTicketModalProps) {
  const [splits, setSplits] = useState(2)
  const [amounts, setAmounts] = useState<string[]>(['', ''])

  const splitEvenly = () => {
    const amount = (cartTotal / splits).toFixed(2)
    setAmounts(Array(splits).fill(amount))
  }

  return (
    <Modal visible={isOpen} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Split Bill</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={20} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scroll}>
            <View style={styles.totalSection}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>NPR {cartTotal.toFixed(2)}</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Split Into</Text>
              <View style={styles.splitButtons}>
                {[2, 3, 4].map(num => (
                  <TouchableOpacity
                    key={num}
                    style={[styles.splitBtn, splits === num && styles.splitBtnActive]}
                    onPress={() => {
                      setSplits(num)
                      setAmounts(Array(num).fill(''))
                    }}
                  >
                    <Text style={styles.splitBtnText}>{num}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity style={styles.evenBtn} onPress={splitEvenly}>
              <Text style={styles.evenBtnText}>Split Evenly</Text>
            </TouchableOpacity>
          </ScrollView>

          <TouchableOpacity style={styles.confirmBtn} onPress={() => {
            Alert.alert('Success', 'Bill split!')
            onClose()
          }}>
            <Text style={styles.confirmText}>Confirm</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  container: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '70%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: '#E8D88A' },
  title: { fontSize: 20, fontWeight: '700', color: '#1A1A1A' },
  scroll: { maxHeight: '50%' },
  totalSection: { backgroundColor: '#FEF1A8', padding: 20, alignItems: 'center' },
  totalLabel: { fontSize: 13, color: '#5C5436' },
  totalValue: { fontSize: 32, fontWeight: '700', color: '#C41E1E', marginTop: 4 },
  section: { padding: 20 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 12 },
  splitButtons: { flexDirection: 'row', gap: 12 },
  splitBtn: { flex: 1, padding: 16, borderRadius: 12, borderWidth: 2, borderColor: '#E8D88A', alignItems: 'center' },
  splitBtnActive: { backgroundColor: '#C41E1E', borderColor: '#C41E1E' },
  splitBtnText: { fontSize: 16, fontWeight: '600' },
  evenBtn: { backgroundColor: '#E8D88A', margin: 20, padding: 14, borderRadius: 12, alignItems: 'center' },
  evenBtnText: { fontSize: 14, fontWeight: '600' },
  confirmBtn: { backgroundColor: '#C41E1E', margin: 20, padding: 18, borderRadius: 12, alignItems: 'center' },
  confirmText: { fontSize: 16, fontWeight: '700', color: '#FFF' },
})