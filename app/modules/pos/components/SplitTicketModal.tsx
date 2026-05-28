import { X } from 'lucide-react-native'
import {
  Modal, ScrollView, StyleSheet,
  Text, TextInput, TouchableOpacity,
  View,
} from 'react-native'
import { CartItemDisplay } from '../types/cart'

const C = {
  background: '#0A0A0A',
  surface: '#1A1A1A',
  surfaceHighlight: '#2C2C2C',
  primary: '#FF6B2C',
  primaryDim: '#3D1C00',
  textMain: '#FFFFFF',
  textMuted: '#9CA3AF',
  border: '#2C2C2C',
  danger: '#EF4444',
  dangerDim: '#450A0A',
  success: '#10B981',
  successDim: '#064E3B',
  warning: '#F59E0B',
  info: '#3B82F6',
}
const radius = { xs: 6, sm: 10, md: 14, lg: 20, pill: 100 }

interface SplitBreakdown {
  id:     string
  name:   string
  amount: number
}

interface SplitTicketModalProps {
  visible: boolean
  onClose: () => void
  splitMode: 'equal' | 'custom' | 'item'
  setSplitMode: (mode: 'equal' | 'custom' | 'item') => void
  splitCount: number
  setSplitCount: (count: number) => void
  customSplits: { [key: string]: number }
  setCustomSplits: (splits: { [key: string]: number }) => void
  itemAssignments: { [key: string]: string[] }
  getSplitBreakdown: () => SplitBreakdown[]
  handlePartialPayment: (ticketId: string, amount: number) => void
  assignItemToTicket: (itemId: string, ticketId: string, assign: boolean) => void
  clearSplit: () => void
  cartItems: CartItemDisplay[]
  cartTotal: number
  getCartTax: () => number
  getCartTotalWithTax: () => number
  symbol?: string
}

const fmt = (amount: number, symbol = 'NPR') =>
  `${symbol} ${Number(amount).toFixed(2)}`

const SPLIT_MODES: Array<{ id: 'equal' | 'custom' | 'item'; label: string }> = [
  { id: 'equal',  label: 'Equal'  },
  { id: 'custom', label: 'Custom' },
  { id: 'item',   label: 'Items'  },
]

const PEOPLE_OPTIONS = [2, 3, 4, 5, 6, 7, 8, 9, 10]

export default function SplitTicketModal({
  visible,
  onClose,
  splitMode,
  setSplitMode,
  splitCount,
  setSplitCount,
  customSplits,
  setCustomSplits,
  itemAssignments,
  getSplitBreakdown,
  assignItemToTicket,
  clearSplit,
  cartItems,
  cartTotal,
  getCartTax,
  getCartTotalWithTax,
  symbol = 'NPR',
}: SplitTicketModalProps) {
  const total          = getCartTotalWithTax()
  const customEntered  = Object.values(customSplits).reduce((s, v) => s + v, 0)
  const customRemaining = Math.max(0, total - customEntered)
  const customBalanced  = Math.abs(customEntered - total) <= 0.01

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>

          <View style={styles.header}>
            <Text style={styles.headerTitle}>Split the Bill</Text>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <X size={18} color={C.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>

            <Text style={styles.sectionLabel}>Split Mode</Text>
            <View style={styles.modeRow}>
              {SPLIT_MODES.map((m) => (
                <TouchableOpacity
                  key={m.id}
                  style={[styles.modeBtn, splitMode === m.id && styles.modeBtnActive]}
                  onPress={() => setSplitMode(m.id)}
                >
                  <Text style={[styles.modeBtnText, splitMode === m.id && styles.modeBtnTextActive]}>
                    {m.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.sectionLabel}>Number of People</Text>
            <View style={styles.peopleGrid}>
              {PEOPLE_OPTIONS.map((n) => (
                <TouchableOpacity
                  key={n}
                  style={[styles.peopleBtn, splitCount === n && styles.peopleBtnActive]}
                  onPress={() => setSplitCount(n)}
                >
                  <Text style={[styles.peopleBtnText, splitCount === n && styles.peopleBtnTextActive]}>
                    {n}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.sectionLabel}>Bill</Text>
            <View style={styles.card}>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Subtotal</Text>
                <Text style={styles.rowValue}>{fmt(cartTotal, symbol)}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>VAT</Text>
                <Text style={styles.rowValue}>{fmt(getCartTax(), symbol)}</Text>
              </View>
              <View style={[styles.row, styles.rowTotal]}>
                <Text style={styles.rowTotalLabel}>Total</Text>
                <Text style={styles.rowTotalValue}>{fmt(total, symbol)}</Text>
              </View>
            </View>

            <Text style={styles.sectionLabel}>Distribution</Text>
            <View style={[styles.card, styles.cardViolet]}>
              {getSplitBreakdown().map((p) => (
                <View key={p.id} style={styles.row}>
                  <Text style={styles.rowLabel}>{p.name}</Text>
                  <Text style={[styles.rowValue, { color: C.info }]}>{fmt(p.amount, symbol)}</Text>
                </View>
              ))}
            </View>

            <Text style={styles.sectionLabel}>Overview</Text>
            <View style={[styles.card, styles.cardSky]}>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Mode</Text>
                <Text style={styles.rowValue}>{splitMode}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>People</Text>
                <Text style={styles.rowValue}>{splitCount}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Per person</Text>
                <Text style={[styles.rowValue, { color: C.info }]}>{fmt(total / splitCount, symbol)}</Text>
              </View>
            </View>

            {splitMode === 'custom' && (
              <>
                <Text style={styles.sectionLabel}>Custom Amounts</Text>
                <View style={[styles.card, styles.cardAmber]}>
                  {Array.from({ length: splitCount }, (_, i) => {
                    const ticketId = `ticket-${i + 1}`
                    return (
                      <View key={ticketId} style={styles.customRow}>
                        <Text style={styles.customRowLabel}>Person {i + 1}</Text>
                        <TextInput
                          style={styles.customInput}
                          value={customSplits[ticketId] ? String(customSplits[ticketId]) : ''}
                          onChangeText={(v) =>
                            setCustomSplits({ ...customSplits, [ticketId]: parseFloat(v) || 0 })
                          }
                          placeholder="0.00"
                          placeholderTextColor={C.textMuted}
                          keyboardType="decimal-pad"
                        />
                        <Text style={styles.customRowSymbol}>{symbol}</Text>
                      </View>
                    )
                  })}
                  <View style={[styles.row, { marginTop: 8 }]}>
                    <Text style={styles.rowLabel}>Entered</Text>
                    <Text style={styles.rowValue}>{fmt(customEntered, symbol)}</Text>
                  </View>
                  <View style={styles.row}>
                    <Text style={styles.rowLabel}>Remaining</Text>
                    <Text style={styles.rowValue}>{fmt(customRemaining, symbol)}</Text>
                  </View>
                  <Text style={[styles.balanceStatus, customBalanced ? styles.balanceOk : styles.balanceBad]}>
                    {customBalanced ? '✅ Balanced' : "❌ Amounts don't match total"}
                  </Text>
                </View>
              </>
            )}

            {splitMode === 'item' && (
              <>
                <Text style={styles.sectionLabel}>Assign Items</Text>
                {cartItems.map((item) => {
                  const assignedTicket = itemAssignments[item.menu_item_id]?.[0]
                  return (
                    <View key={item.menu_item_id} style={[styles.card, styles.cardSage, { marginBottom: 8 }]}>
                      <Text style={styles.itemName} numberOfLines={1}>{item.menu_item_name}</Text>
                      <Text style={styles.itemPrice}>{fmt(item.total_price, symbol)}</Text>
                      <View style={styles.assignGrid}>
                        {Array.from({ length: splitCount }, (_, i) => {
                          const ticketId  = `ticket-${i + 1}`
                          const isAssigned = assignedTicket === ticketId
                          return (
                            <TouchableOpacity
                              key={ticketId}
                              style={[styles.assignBtn, isAssigned && styles.assignBtnActive]}
                              onPress={() =>
                                assignItemToTicket(item.menu_item_id, ticketId, !isAssigned)
                              }
                            >
                              <Text style={[styles.assignBtnText, isAssigned && styles.assignBtnTextActive]}>
                                {i + 1}
                              </Text>
                            </TouchableOpacity>
                          )
                        })}
                      </View>
                      {assignedTicket && (
                        <Text style={styles.assignedTo}>
                          → Person {assignedTicket.replace('ticket-', '')}
                        </Text>
                      )}
                    </View>
                  )
                })}
              </>
            )}

            <TouchableOpacity style={styles.confirmBtn} onPress={onClose}>
              <Text style={styles.confirmBtnText}>Confirm Split</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.clearBtn}
              onPress={() => { setSplitCount(2); setSplitMode('equal'); clearSplit() }}
            >
              <Text style={styles.clearBtnText}>Reset</Text>
            </TouchableOpacity>

          </ScrollView>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  sheet:   { backgroundColor: C.surface, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, borderWidth: 1.5, borderColor: C.border, maxHeight: '94%' },

  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: C.border },
  headerTitle: { fontSize: 18, fontWeight: '900', color: C.textMain },
  closeBtn:    { padding: 6, borderRadius: radius.xs, backgroundColor: C.background, borderWidth: 1, borderColor: C.border },

  body: { padding: 18, paddingBottom: 32 },

  sectionLabel: { fontSize: 10, fontWeight: '800', color: C.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, marginTop: 16 },

  modeRow:          { flexDirection: 'row', gap: 8 },
  modeBtn:          { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: radius.pill, backgroundColor: C.background, borderWidth: 1.5, borderColor: C.border },
  modeBtnActive:    { backgroundColor: C.primaryDim, borderColor: C.primary },
  modeBtnText:      { fontSize: 12, fontWeight: '700', color: C.textMuted },
  modeBtnTextActive:{ color: C.primary },

  peopleGrid:          { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  peopleBtn:           { width: 42, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: radius.sm, backgroundColor: C.background, borderWidth: 1.5, borderColor: C.border },
  peopleBtnActive:     { backgroundColor: C.primaryDim, borderColor: C.primary },
  peopleBtnText:       { fontSize: 13, fontWeight: '700', color: C.textMuted },
  peopleBtnTextActive: { color: C.primary },

  card:       { backgroundColor: C.background, borderRadius: radius.md, borderWidth: 1, borderColor: C.border, padding: 12, gap: 5 },
  cardViolet: { backgroundColor: C.surfaceHighlight, borderColor: C.info },
  cardSky:    { backgroundColor: C.surfaceHighlight, borderColor: C.border },
  cardAmber:  { backgroundColor: C.surfaceHighlight, borderColor: C.warning },
  cardSage:   { backgroundColor: C.surfaceHighlight, borderColor: C.success },

  row:           { flexDirection: 'row', justifyContent: 'space-between' },
  rowLabel:      { fontSize: 12, color: C.textMuted },
  rowValue:      { fontSize: 12, fontWeight: '600', color: C.textMain },
  rowTotal:      { borderTopWidth: 1, borderTopColor: C.border, marginTop: 4, paddingTop: 6 },
  rowTotalLabel: { fontSize: 14, fontWeight: '800', color: C.textMain },
  rowTotalValue: { fontSize: 14, fontWeight: '900', color: C.primary },

  customRow:       { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  customRowLabel:  { fontSize: 12, fontWeight: '700', color: C.textMuted, width: 64 },
  customInput:     { flex: 1, borderWidth: 1.5, borderColor: C.border, borderRadius: radius.sm, paddingHorizontal: 10, paddingVertical: 6, fontSize: 13, color: C.textMain, backgroundColor: C.background },
  customRowSymbol: { fontSize: 11, color: C.textMuted, width: 28 },
  balanceStatus:   { fontSize: 12, fontWeight: '800', marginTop: 6, textAlign: 'center' },
  balanceOk:       { color: C.success },
  balanceBad:      { color: C.danger },

  itemName:            { fontSize: 13, fontWeight: '700', color: C.textMain, marginBottom: 2 },
  itemPrice:           { fontSize: 11, color: C.textMuted, marginBottom: 8 },
  assignGrid:          { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  assignBtn:           { width: 34, height: 28, alignItems: 'center', justifyContent: 'center', borderRadius: radius.xs, backgroundColor: C.background, borderWidth: 1, borderColor: C.border },
  assignBtnActive:     { backgroundColor: C.successDim, borderColor: C.success },
  assignBtnText:       { fontSize: 11, fontWeight: '700', color: C.textMuted },
  assignBtnTextActive: { color: C.textMain },
  assignedTo:          { fontSize: 10, color: C.success, marginTop: 4, fontWeight: '700' },

  confirmBtn:     { backgroundColor: C.primary, borderRadius: radius.pill, paddingVertical: 14, alignItems: 'center', marginTop: 20 },
  confirmBtnText: { fontSize: 15, fontWeight: '800', color: C.textMain },
  clearBtn:       { backgroundColor: C.background, borderRadius: radius.pill, paddingVertical: 12, alignItems: 'center', marginTop: 8, borderWidth: 1.5, borderColor: C.border },
  clearBtnText:   { fontSize: 14, fontWeight: '700', color: C.danger },
})