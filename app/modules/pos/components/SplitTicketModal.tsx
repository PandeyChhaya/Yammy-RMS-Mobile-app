// splitTicketModal.tsx
import { X } from 'lucide-react-native'
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { CartItemDisplay } from '../types/cart'

const palette = {
  bg: '#0A0A0A',
  card: '#1A1A1A',
  cardAlt: '#2C2C2C',
  brand: '#FF6B2C',
  brandBg: '#3D1C00',
  text: '#FFFFFF',
  textDim: '#9CA3AF',
  border: '#2C2C2C',
  red: '#EF4444',
  redBg: '#450A0A',
  green: '#10B981',
  greenBg: '#064E3B',
  amber: '#F59E0B',
  blue: '#3B82F6',
}

const corner = { xs: 6, sm: 10, md: 14, lg: 20, pill: 100 }

interface SplitBreakdown {
  id: string
  name: string
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

function money(amount: number, symbol = 'NPR') {
  return `${symbol} ${Number(amount).toFixed(2)}`
}

const splitModes: Array<{ id: 'equal' | 'custom' | 'item'; label: string }> = [
  { id: 'equal', label: 'Equal' },
  { id: 'custom', label: 'Custom' },
  { id: 'item', label: 'Items' },
]

const peopleChoices = [2, 3, 4, 5, 6, 7, 8, 9, 10]

export default function SplitTicketModal(props: SplitTicketModalProps) {
  const {
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
  } = props

  const total = getCartTotalWithTax()
  const customEntered = Object.values(customSplits).reduce((sum, v) => sum + v, 0)
  const customRemaining = Math.max(0, total - customEntered)
  const customIsBalanced = Math.abs(customEntered - total) <= 0.01

  function resetAndClose() {
    setSplitCount(2)
    setSplitMode('equal')
    clearSplit()
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Split the Bill</Text>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <X size={18} color={palette.textDim} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
            <Text style={styles.sectionLabel}>Split Mode</Text>
            <View style={styles.modeRow}>
              {splitModes.map((mode) => (
                <TouchableOpacity
                  key={mode.id}
                  style={[styles.modeBtn, splitMode === mode.id && styles.modeBtnActive]}
                  onPress={() => setSplitMode(mode.id)}
                >
                  <Text style={[styles.modeBtnText, splitMode === mode.id && styles.modeBtnTextActive]}>
                    {mode.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.sectionLabel}>Number of People</Text>
            <View style={styles.peopleGrid}>
              {peopleChoices.map((n) => (
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
                <Text style={styles.rowValue}>{money(cartTotal, symbol)}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>VAT</Text>
                <Text style={styles.rowValue}>{money(getCartTax(), symbol)}</Text>
              </View>
              <View style={[styles.row, styles.rowTotal]}>
                <Text style={styles.rowTotalLabel}>Total</Text>
                <Text style={styles.rowTotalValue}>{money(total, symbol)}</Text>
              </View>
            </View>

            <Text style={styles.sectionLabel}>Distribution</Text>
            <View style={[styles.card, styles.cardBlue]}>
              {getSplitBreakdown().map((person) => (
                <View key={person.id} style={styles.row}>
                  <Text style={styles.rowLabel}>{person.name}</Text>
                  <Text style={[styles.rowValue, { color: palette.blue }]}>
                    {money(person.amount, symbol)}
                  </Text>
                </View>
              ))}
            </View>

            <Text style={styles.sectionLabel}>Overview</Text>
            <View style={[styles.card, styles.cardNeutral]}>
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
                <Text style={[styles.rowValue, { color: palette.blue }]}>
                  {money(total / splitCount, symbol)}
                </Text>
              </View>
            </View>

            {splitMode === 'custom' ? (
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
                          onChangeText={(value) =>
                            setCustomSplits({ ...customSplits, [ticketId]: parseFloat(value) || 0 })
                          }
                          placeholder="0.00"
                          placeholderTextColor={palette.textDim}
                          keyboardType="decimal-pad"
                        />
                        <Text style={styles.customRowSymbol}>{symbol}</Text>
                      </View>
                    )
                  })}

                  <View style={[styles.row, { marginTop: 8 }]}>
                    <Text style={styles.rowLabel}>Entered</Text>
                    <Text style={styles.rowValue}>{money(customEntered, symbol)}</Text>
                  </View>
                  <View style={styles.row}>
                    <Text style={styles.rowLabel}>Remaining</Text>
                    <Text style={styles.rowValue}>{money(customRemaining, symbol)}</Text>
                  </View>
                  <Text style={[styles.balanceStatus, customIsBalanced ? styles.balanceOk : styles.balanceBad]}>
                    {customIsBalanced ? 'Balanced' : "Amounts don't match total"}
                  </Text>
                </View>
              </>
            ) : null}

            {splitMode === 'item' ? (
              <>
                <Text style={styles.sectionLabel}>Assign Items</Text>
                {cartItems.map((item) => {
                  // an item can now be shared by more than one ticket - the
                  // per-person amount is divided across however many people
                  // it's assigned to, so check membership rather than index 0
                  const assignedTickets = itemAssignments[item.menu_item_id] ?? []

                  return (
                    <View key={item.menu_item_id} style={[styles.card, styles.cardGreen, { marginBottom: 8 }]}>
                      <Text style={styles.itemName} numberOfLines={1}>
                        {item.menu_item_name}
                      </Text>
                      <Text style={styles.itemPrice}>{money(item.total_price, symbol)}</Text>

                      <View style={styles.assignGrid}>
                        {Array.from({ length: splitCount }, (_, i) => {
                          const ticketId = `ticket-${i + 1}`
                          const isAssigned = assignedTickets.includes(ticketId)
                          return (
                            <TouchableOpacity
                              key={ticketId}
                              style={[styles.assignBtn, isAssigned && styles.assignBtnActive]}
                              onPress={() => assignItemToTicket(item.menu_item_id, ticketId, !isAssigned)}
                            >
                              <Text style={[styles.assignBtnText, isAssigned && styles.assignBtnTextActive]}>
                                {i + 1}
                              </Text>
                            </TouchableOpacity>
                          )
                        })}
                      </View>

                      {assignedTickets.length > 0 ? (
                        <Text style={styles.assignedTo}>
                          Shared by {assignedTickets.map((t) => t.replace('ticket-', '')).join(', ')}
                        </Text>
                      ) : null}
                    </View>
                  )
                })}
              </>
            ) : null}

            <TouchableOpacity style={styles.confirmBtn} onPress={onClose}>
              <Text style={styles.confirmBtnText}>Confirm Split</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.clearBtn} onPress={resetAndClose}>
              <Text style={styles.clearBtnText}>Reset</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: palette.card,
    borderTopLeftRadius: corner.lg,
    borderTopRightRadius: corner.lg,
    borderWidth: 1.5,
    borderColor: palette.border,
    maxHeight: '94%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: palette.text,
  },
  closeBtn: {
    padding: 6,
    borderRadius: corner.xs,
    backgroundColor: palette.bg,
    borderWidth: 1,
    borderColor: palette.border,
  },
  body: {
    padding: 18,
    paddingBottom: 32,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: palette.textDim,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 16,
  },
  modeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  modeBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: corner.pill,
    backgroundColor: palette.bg,
    borderWidth: 1.5,
    borderColor: palette.border,
  },
  modeBtnActive: {
    backgroundColor: palette.brandBg,
    borderColor: palette.brand,
  },
  modeBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: palette.textDim,
  },
  modeBtnTextActive: {
    color: palette.brand,
  },
  peopleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  peopleBtn: {
    width: 42,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: corner.sm,
    backgroundColor: palette.bg,
    borderWidth: 1.5,
    borderColor: palette.border,
  },
  peopleBtnActive: {
    backgroundColor: palette.brandBg,
    borderColor: palette.brand,
  },
  peopleBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: palette.textDim,
  },
  peopleBtnTextActive: {
    color: palette.brand,
  },
  card: {
    backgroundColor: palette.bg,
    borderRadius: corner.md,
    borderWidth: 1,
    borderColor: palette.border,
    padding: 12,
    gap: 5,
  },
  cardBlue: {
    backgroundColor: palette.cardAlt,
    borderColor: palette.blue,
  },
  cardNeutral: {
    backgroundColor: palette.cardAlt,
    borderColor: palette.border,
  },
  cardAmber: {
    backgroundColor: palette.cardAlt,
    borderColor: palette.amber,
  },
  cardGreen: {
    backgroundColor: palette.cardAlt,
    borderColor: palette.green,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rowLabel: {
    fontSize: 12,
    color: palette.textDim,
  },
  rowValue: {
    fontSize: 12,
    fontWeight: '600',
    color: palette.text,
  },
  rowTotal: {
    borderTopWidth: 1,
    borderTopColor: palette.border,
    marginTop: 4,
    paddingTop: 6,
  },
  rowTotalLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: palette.text,
  },
  rowTotalValue: {
    fontSize: 14,
    fontWeight: '900',
    color: palette.brand,
  },
  customRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  customRowLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: palette.textDim,
    width: 64,
  },
  customInput: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: palette.border,
    borderRadius: corner.sm,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 13,
    color: palette.text,
    backgroundColor: palette.bg,
  },
  customRowSymbol: {
    fontSize: 11,
    color: palette.textDim,
    width: 28,
  },
  balanceStatus: {
    fontSize: 12,
    fontWeight: '800',
    marginTop: 6,
    textAlign: 'center',
  },
  balanceOk: {
    color: palette.green,
  },
  balanceBad: {
    color: palette.red,
  },
  itemName: {
    fontSize: 13,
    fontWeight: '700',
    color: palette.text,
    marginBottom: 2,
  },
  itemPrice: {
    fontSize: 11,
    color: palette.textDim,
    marginBottom: 8,
  },
  assignGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  assignBtn: {
    width: 34,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: corner.xs,
    backgroundColor: palette.bg,
    borderWidth: 1,
    borderColor: palette.border,
  },
  assignBtnActive: {
    backgroundColor: palette.greenBg,
    borderColor: palette.green,
  },
  assignBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: palette.textDim,
  },
  assignBtnTextActive: {
    color: palette.text,
  },
  assignedTo: {
    fontSize: 10,
    color: palette.green,
    marginTop: 4,
    fontWeight: '700',
  },
  confirmBtn: {
    backgroundColor: palette.brand,
    borderRadius: corner.pill,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  confirmBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: palette.text,
  },
  clearBtn: {
    backgroundColor: palette.bg,
    borderRadius: corner.pill,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
    borderWidth: 1.5,
    borderColor: palette.border,
  },
  clearBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: palette.red,
  },
})