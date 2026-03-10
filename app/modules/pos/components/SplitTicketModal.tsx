import { X } from 'lucide-react-native'
import { Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { useTaxSettings } from '../../../../shared/hooks/useTaxSettings'
import { CartItem } from '../types/cart'
import { SplitBreakdown } from '../types/payment'

interface SplitTicketModalProps {
  isOpen: boolean
  onClose: () => void
  splitMode: 'equal' | 'custom' | 'item'
  setSplitMode: (mode: 'equal' | 'custom' | 'item') => void
  splitCount: number
  setSplitCount: (count: number) => void
  customSplits: { [key: string]: number }
  setCustomSplits: (splits: { [key: string]: number }) => void
  itemAssignments: { [key: string]: string[] }
  paidAmounts: { [key: string]: number }
  currentPayer: string
  setCurrentPayer: (payer: string) => void
  getSplitBreakdown: () => SplitBreakdown[]
  getTotalRemaining: () => number
  getTotalPaid: () => number
  handlePartialPayment: (ticketId: string, amount: number) => void
  assignItemToTicket: (itemId: string, ticketId: string, assign: boolean) => void
  clearSplit: () => void
  isNoteFullyPaid: () => boolean
  cartItems: CartItem[]
  cartTotal: number
  getCartTax: () => number
  getCartTotalWithTax: () => number
}

export default function SplitTicketModal({
  isOpen,
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
  getCartTotalWithTax
}: SplitTicketModalProps) {
  const { formatAmount } = useTaxSettings()

  const customSplitsTotal = Object.values(customSplits).reduce((sum, val) => sum + val, 0)
  const customSplitsRemaining = Math.max(0, getCartTotalWithTax() - customSplitsTotal)
  const isCustomCorrect = Math.abs(customSplitsTotal - getCartTotalWithTax()) <= 0.01

  return (
    <Modal
      visible={isOpen}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Split the bill</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.content}>
              
              {/* Configuration Section */}
              <View style={styles.section}>
                <View style={styles.sectionBox}>
                  <Text style={styles.sectionTitle}>Configuration</Text>

                  <View style={styles.modeButtons}>
                    <TouchableOpacity
                      onPress={() => setSplitMode('equal')}
                      style={[styles.modeButton, splitMode === 'equal' && styles.modeButtonActive]}
                    >
                      <Text style={[styles.modeButtonText, splitMode === 'equal' && styles.modeButtonTextActive]}>
                        Equal
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setSplitMode('custom')}
                      style={[styles.modeButton, splitMode === 'custom' && styles.modeButtonActive]}
                    >
                      <Text style={[styles.modeButtonText, splitMode === 'custom' && styles.modeButtonTextActive]}>
                        Custom
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setSplitMode('item')}
                      style={[styles.modeButton, splitMode === 'item' && styles.modeButtonActive]}
                    >
                      <Text style={[styles.modeButtonText, splitMode === 'item' && styles.modeButtonTextActive]}>
                        Items
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.countSection}>
                    <Text style={styles.countLabel}>Number of people</Text>
                    <View style={styles.countGrid}>
                      {[2, 3, 4, 5, 6, 7, 8, 9, 10].map((count) => (
                        <TouchableOpacity
                          key={count}
                          onPress={() => setSplitCount(count)}
                          style={[styles.countButton, splitCount === count && styles.countButtonActive]}
                        >
                          <Text style={[styles.countButtonText, splitCount === count && styles.countButtonTextActive]}>
                            {count}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <TouchableOpacity
                    onPress={() => {
                      setSplitCount(2)
                      setSplitMode('equal')
                      clearSplit()
                    }}
                    style={styles.resetButton}
                  >
                    <Text style={styles.resetButtonText}>Reset</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Bill Preview Section */}
              <View style={styles.section}>
                <View style={styles.sectionBox}>
                  <Text style={styles.sectionTitle}>Bill</Text>
                  <View style={styles.billRow}>
                    <Text style={styles.billLabel}>Subtotal:</Text>
                    <Text style={styles.billValue}>{formatAmount(cartTotal)}</Text>
                  </View>
                  <View style={styles.billRow}>
                    <Text style={styles.billLabel}>VAT:</Text>
                    <Text style={styles.billValue}>{formatAmount(getCartTax())}</Text>
                  </View>
                  <View style={styles.billDivider} />
                  <View style={styles.billRow}>
                    <Text style={styles.billLabelBold}>Total:</Text>
                    <Text style={styles.billValueBold}>{formatAmount(getCartTotalWithTax())}</Text>
                  </View>
                </View>

                <View style={[styles.sectionBox, styles.distributionBox]}>
                  <Text style={styles.distributionTitle}>Distribution</Text>
                  <ScrollView style={styles.distributionScroll} showsVerticalScrollIndicator={false}>
                    {getSplitBreakdown().map((person) => (
                      <View key={person.id} style={styles.distributionRow}>
                        <Text style={styles.distributionName} numberOfLines={1}>{person.name}:</Text>
                        <Text style={styles.distributionAmount}>{formatAmount(person.amount)}</Text>
                      </View>
                    ))}
                  </ScrollView>
                </View>
              </View>

              {/* Mode-specific Content */}
              {splitMode === 'custom' && (
                <View style={styles.section}>
                  <View style={[styles.sectionBox, styles.customBox]}>
                    <Text style={styles.customTitle}>Custom amounts</Text>
                    <ScrollView style={styles.customScroll} showsVerticalScrollIndicator={false}>
                      {Array.from({ length: splitCount }, (_, i) => {
                        const ticketId = `ticket-${i + 1}`
                        return (
                          <View key={ticketId} style={styles.customRow}>
                            <Text style={styles.customIndex}>{i + 1}:</Text>
                            <TextInput
                              value={customSplits[ticketId]?.toString() || ''}
                              onChangeText={(text) => {
                                const newValue = Number(text) || 0
                                setCustomSplits({
                                  ...customSplits,
                                  [ticketId]: newValue
                                })
                              }}
                              placeholder="0.00"
                              placeholderTextColor="#9CA3AF"
                              keyboardType="decimal-pad"
                              style={styles.customInput}
                            />
                            <Text style={styles.customCurrency}>€</Text>
                          </View>
                        )
                      })}
                    </ScrollView>
                    <View style={styles.customSummary}>
                      <View style={styles.customSummaryRow}>
                        <Text style={styles.customSummaryLabel}>Entered:</Text>
                        <Text style={styles.customSummaryValue}>{customSplitsTotal.toFixed(2)}€</Text>
                      </View>
                      <View style={styles.customSummaryRow}>
                        <Text style={styles.customSummaryLabel}>Remaining:</Text>
                        <Text style={styles.customSummaryValue}>{customSplitsRemaining.toFixed(2)}€</Text>
                      </View>
                      <Text style={[styles.customStatus, isCustomCorrect ? styles.customStatusCorrect : styles.customStatusIncorrect]}>
                        {isCustomCorrect ? '✅ Correct' : '❌ Incorrect'}
                      </Text>
                    </View>
                  </View>
                </View>
              )}

              {splitMode === 'item' && (
                <View style={styles.section}>
                  <View style={[styles.sectionBox, styles.itemBox]}>
                    <Text style={styles.itemTitle}>Item assignment</Text>
                    <ScrollView style={styles.itemScroll} showsVerticalScrollIndicator={false}>
                      {cartItems.map((item) => {
                        const assignedTicket = itemAssignments[item.product_id]?.[0]
                        return (
                          <View key={item.product_id} style={styles.itemCard}>
                            <Text style={styles.itemName} numberOfLines={1}>{item.product_name}</Text>
                            <Text style={styles.itemPrice}>{formatAmount(item.total_price)}</Text>
                            <View style={styles.itemButtons}>
                              {Array.from({ length: splitCount }, (_, i) => {
                                const ticketId = `ticket-${i + 1}`
                                const isAssigned = assignedTicket === ticketId
                                return (
                                  <TouchableOpacity
                                    key={ticketId}
                                    onPress={() => {
                                      assignItemToTicket(item.product_id, ticketId, !isAssigned)
                                    }}
                                    style={[styles.itemButton, isAssigned && styles.itemButtonActive]}
                                  >
                                    <Text style={[styles.itemButtonText, isAssigned && styles.itemButtonTextActive]}>
                                      {i + 1}
                                    </Text>
                                  </TouchableOpacity>
                                )
                              })}
                            </View>
                            {assignedTicket && (
                              <Text style={styles.itemAssigned}>
                                → Person {assignedTicket.replace('ticket-', '')}
                              </Text>
                            )}
                          </View>
                        )
                      })}
                    </ScrollView>
                  </View>
                </View>
              )}

              {/* Overview Section */}
              <View style={styles.section}>
                <View style={[styles.sectionBox, styles.overviewBox]}>
                  <Text style={styles.overviewTitle}>Overview</Text>
                  <View style={styles.overviewRow}>
                    <Text style={styles.overviewLabel}>Mode:</Text>
                    <Text style={styles.overviewValue}>{splitMode}</Text>
                  </View>
                  <View style={styles.overviewRow}>
                    <Text style={styles.overviewLabel}>People:</Text>
                    <Text style={styles.overviewValue}>{splitCount}</Text>
                  </View>
                  <View style={styles.overviewRow}>
                    <Text style={styles.overviewLabel}>Total:</Text>
                    <Text style={styles.overviewValue}>{formatAmount(getCartTotalWithTax())}</Text>
                  </View>
                  <View style={styles.overviewRow}>
                    <Text style={styles.overviewLabel}>Per person:</Text>
                    <Text style={styles.overviewValue}>{formatAmount(getCartTotalWithTax() / splitCount)}</Text>
                  </View>
                </View>

                <View style={[styles.sectionBox, styles.actionsBox]}>
                  <Text style={styles.actionsTitle}>Actions</Text>
                  <TouchableOpacity onPress={onClose} style={styles.confirmButton}>
                    <Text style={styles.confirmButtonText}>Confirm split</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={clearSplit} style={styles.clearButton}>
                    <Text style={styles.clearButtonText}>Clear</Text>
                  </TouchableOpacity>
                </View>
              </View>

            </View>
          </ScrollView>
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
    padding: 16,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '100%',
    maxWidth: 900,
    maxHeight: '95%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  closeButton: {
    padding: 8,
  },
  scrollContent: {
    flex: 1,
  },
  content: {
    padding: 24,
    gap: 16,
  },
  section: {
    marginBottom: 16,
  },
  sectionBox: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  modeButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  modeButtonActive: {
    borderColor: '#9333EA',
    backgroundColor: '#F3E8FF',
  },
  modeButtonText: {
    fontSize: 10,
    color: '#374151',
  },
  modeButtonTextActive: {
    color: '#7C3AED',
  },
  countSection: {
    marginBottom: 16,
  },
  countLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  countGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  countButton: {
    width: '30%',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  countButtonActive: {
    borderColor: '#9333EA',
    backgroundColor: '#F3E8FF',
  },
  countButtonText: {
    fontSize: 10,
    color: '#374151',
  },
  countButtonTextActive: {
    color: '#7C3AED',
    fontWeight: '700',
  },
  resetButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#DBEAFE',
    borderRadius: 8,
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: 10,
    color: '#1E40AF',
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  billLabel: {
    fontSize: 12,
    color: '#374151',
  },
  billValue: {
    fontSize: 12,
    color: '#374151',
  },
  billDivider: {
    height: 1,
    backgroundColor: '#D1D5DB',
    marginVertical: 4,
  },
  billLabelBold: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111827',
  },
  billValueBold: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111827',
  },
  distributionBox: {
    backgroundColor: '#F3E8FF',
    borderWidth: 1,
    borderColor: '#E9D5FF',
    marginTop: 16,
  },
  distributionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7C3AED',
    marginBottom: 12,
  },
  distributionScroll: {
    maxHeight: 128,
  },
  distributionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  distributionName: {
    fontSize: 10,
    color: '#374151',
    flex: 1,
  },
  distributionAmount: {
    fontSize: 10,
    fontWeight: '500',
    color: '#374151',
  },
  customBox: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  customTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 12,
  },
  customScroll: {
    maxHeight: 192,
  },
  customRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  customIndex: {
    fontSize: 10,
    fontWeight: '500',
    color: '#374151',
    width: 24,
  },
  customInput: {
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 10,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  customCurrency: {
    fontSize: 10,
    color: '#6B7280',
  },
  customSummary: {
    marginTop: 12,
    padding: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
  },
  customSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  customSummaryLabel: {
    fontSize: 10,
    color: '#374151',
  },
  customSummaryValue: {
    fontSize: 10,
    fontWeight: '500',
    color: '#374151',
  },
  customStatus: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 4,
  },
  customStatusCorrect: {
    color: '#059669',
  },
  customStatusIncorrect: {
    color: '#DC2626',
  },
  itemBox: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#065F46',
    marginBottom: 12,
  },
  itemScroll: {
    maxHeight: 192,
  },
  itemCard: {
    backgroundColor: '#FFFFFF',
    padding: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    marginBottom: 8,
  },
  itemName: {
    fontSize: 10,
    fontWeight: '500',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 10,
    color: '#4B5563',
    marginBottom: 8,
  },
  itemButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  itemButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  itemButtonActive: {
    backgroundColor: '#D1FAE5',
    borderColor: '#6EE7B7',
  },
  itemButtonText: {
    fontSize: 10,
    color: '#4B5563',
  },
  itemButtonTextActive: {
    color: '#065F46',
  },
  itemAssigned: {
    fontSize: 10,
    color: '#059669',
    marginTop: 4,
  },
  overviewBox: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  overviewTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 12,
  },
  overviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  overviewLabel: {
    fontSize: 12,
    color: '#374151',
  },
  overviewValue: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
    textTransform: 'capitalize',
  },
  actionsBox: {
    backgroundColor: '#F3E8FF',
    borderWidth: 1,
    borderColor: '#E9D5FF',
    marginTop: 16,
  },
  actionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7C3AED',
    marginBottom: 12,
  },
  confirmButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#9333EA',
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  confirmButtonText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  clearButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 12,
    color: '#374151',
  },
})