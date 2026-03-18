import { X } from 'lucide-react-native'
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

interface SplitTicketModalProps {
  visible: boolean
  onClose: () => void
  total: number
  onSplit: (amounts: number[]) => void
}

export default function SplitTicketModal({
  visible,
  onClose,
  total,
  onSplit,
}: SplitTicketModalProps) {
  const [splits, setSplits] = useState(2)
  const [customAmounts, setCustomAmounts] = useState<string[]>(['', ''])

  const splitEvenly = () => {
    const amount = (total / splits).toFixed(2)
    const amounts = Array(splits).fill(amount)
    setCustomAmounts(amounts)
  }

  const handleConfirm = () => {
    const amounts = customAmounts.map(a => parseFloat(a) || 0)
    const sum = amounts.reduce((acc, val) => acc + val, 0)

    if (Math.abs(sum - total) > 0.01) {
      Alert.alert('Error', `Split amounts (${sum.toFixed(2)}) don't match total (${total.toFixed(2)})`)
      return
    }

    onSplit(amounts)
    onClose()
  }

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Split Bill</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scroll}>
            <View style={styles.totalSection}>
              <Text style={styles.totalLabel}>Total to Split</Text>
              <Text style={styles.totalValue}>NPR {total.toFixed(2)}</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Number of People</Text>
              <View style={styles.splitButtons}>
                {[2, 3, 4, 5].map(num => (
                  <TouchableOpacity
                    key={num}
                    style={[styles.splitBtn, splits === num && styles.splitBtnActive]}
                    onPress={() => {
                      setSplits(num)
                      setCustomAmounts(Array(num).fill(''))
                    }}
                  >
                    <Text style={[styles.splitBtnText, splits === num && styles.splitBtnTextActive]}>
                      {num}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Split Amounts</Text>
                <TouchableOpacity onPress={splitEvenly} style={styles.evenBtn}>
                  <Text style={styles.evenBtnText}>Split Evenly</Text>
                </TouchableOpacity>
              </View>

              {Array(splits).fill(0).map((_, i) => (
                <View key={i} style={styles.inputRow}>
                  <Text style={styles.inputLabel}>Person {i + 1}</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="0.00"
                    keyboardType="numeric"
                    value={customAmounts[i]}
                    onChangeText={text => {
                      const newAmounts = [...customAmounts]
                      newAmounts[i] = text
                      setCustomAmounts(newAmounts)
                    }}
                  />
                </View>
              ))}
            </View>
          </ScrollView>

          <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
            <Text style={styles.confirmText}>Confirm Split</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  container: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '80%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#E8D88A' },
  title: { fontSize: 20, fontWeight: '700', color: '#1A1A1A' },
  closeBtn: { padding: 4 },
  scroll: { maxHeight: '60%' },
  totalSection: { backgroundColor: '#FEF1A8', padding: 20, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#E8D88A' },
  totalLabel: { fontSize: 13, color: '#5C5436', marginBottom: 4 },
  totalValue: { fontSize: 32, fontWeight: '700', color: '#C41E1E' },
  section: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  label: { fontSize: 14, fontWeight: '600', color: '#1A1A1A', marginBottom: 12 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  evenBtn: { backgroundColor: '#E8D88A', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  evenBtnText: { fontSize: 12, fontWeight: '600', color: '#1A1A1A' },
  splitButtons: { flexDirection: 'row', gap: 12 },
  splitBtn: { flex: 1, padding: 16, borderRadius: 12, borderWidth: 2, borderColor: '#E8D88A', alignItems: 'center', backgroundColor: '#FFF' },
  splitBtnActive: { backgroundColor: '#C41E1E', borderColor: '#C41E1E' },
  splitBtnText: { fontSize: 16, fontWeight: '600', color: '#666' },
  splitBtnTextActive: { color: '#FFF' },
  inputRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  inputLabel: { fontSize: 14, color: '#5C5436', width: 80 },
  input: { flex: 1, borderWidth: 1, borderColor: '#E8D88A', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 15, backgroundColor: '#FFFDF0' },
  confirmBtn: { backgroundColor: '#C41E1E', margin: 20, padding: 16, borderRadius: 12, alignItems: 'center' },
  confirmText: { fontSize: 16, fontWeight: '700', color: '#FFF' },
})