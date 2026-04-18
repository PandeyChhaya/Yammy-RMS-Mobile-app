import { ChefHat, Users, Zap } from 'lucide-react-native'
import React from 'react'
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { TableData } from '../types'

const C = {
  espresso:    '#1C1008',
  clay:        '#7A4528',
  latte:       '#C8956A',
  cream:       '#FDF6EC',
  parchment:   '#F5E9D4',
  vellum:      '#EDD9BC',
  brass:       '#B5822A',
  brassLight:  '#F7EDD8',
  brassBorder: '#DEC07A',
  sage:        '#3B6E52',
  amber:       '#C47A1E',
  amberLight:  '#FEF3E2',
  violet:      '#6D3FA0',
  violetLight: '#F3EDFB',
  terracotta:  '#A03020',
  tcLight:     '#FAECEA',
  tcBorder:    '#E8A898',
}

const radius = { xs: 6, sm: 10, md: 14, pill: 100 }

const PAYMENT_METHODS = [
  { id: 'cash',     name: 'Cash',     icon: '💵' },
  { id: 'card',     name: 'Card',     icon: '💳' },
  { id: 'transfer', name: 'Transfer', icon: '📱' },
]

interface CartSummaryProps {
  cartTotal:           number
  cartItems:           any[]
  selectedTable:       TableData | null
  customerName:        string
  setCustomerName:     (name: string) => void
  paymentMethod:       string
  setPaymentMethod:    (method: string) => void
  onPayment:           () => void
  onSendToKitchen:     () => void
  onClearCart:         () => void
  onSplitTicket:       () => void
  isSendingToKitchen:  boolean
  getCartTotalWithTax: () => number
}

export default function CartSummary({
  cartTotal,
  cartItems,
  selectedTable,
  customerName,
  setCustomerName,
  paymentMethod,
  setPaymentMethod,
  onPayment,
  onSendToKitchen,
  onClearCart,
  onSplitTicket,
  isSendingToKitchen,
  getCartTotalWithTax,
}: CartSummaryProps) {
  const isEmpty = cartItems.length === 0

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Summary */}
      <View style={styles.summaryBlock}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Subtotal</Text>
          <Text style={styles.summaryValue}>{cartTotal.toFixed(2)} €</Text>
        </View>
        <View style={[styles.summaryRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{getCartTotalWithTax()}</Text>
        </View>
      </View>

      {/* Customer Name */}
      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Customer Name</Text>
        <TextInput
          style={styles.input}
          value={customerName}
          onChangeText={setCustomerName}
          placeholder="Customer name (optional)"
          placeholderTextColor={C.latte}
        />
      </View>

      {/* Payment Method */}
      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Payment Method</Text>
        <View style={styles.paymentGrid}>
          {PAYMENT_METHODS.map(method => {
            const active = paymentMethod === method.id
            return (
              <TouchableOpacity
                key={method.id}
                style={[styles.paymentButton, active && styles.paymentButtonActive]}
                onPress={() => setPaymentMethod(method.id)}
              >
                <Text style={styles.paymentIcon}>{method.icon}</Text>
                <Text style={[styles.paymentLabel, active && styles.paymentLabelActive]}>
                  {method.name}
                </Text>
              </TouchableOpacity>
            )
          })}
        </View>
      </View>

      {/* Buttons */}
      <View style={styles.buttons}>
        <TouchableOpacity
          style={[styles.payButton, isEmpty && styles.disabled]}
          onPress={onPayment}
          disabled={isEmpty}
        >
          <Zap size={15} color={C.cream} />
          <Text style={styles.payButtonText}>Pay {getCartTotalWithTax()}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.kitchenButton,
            (!selectedTable || isEmpty || isSendingToKitchen) && styles.disabled,
          ]}
          onPress={onSendToKitchen}
          disabled={!selectedTable || isEmpty || isSendingToKitchen}
        >
          <ChefHat size={15} color={C.cream} />
          <Text style={styles.kitchenButtonText}>
            {isSendingToKitchen ? 'Sending...' : 'Send to Kitchen'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.splitButton, isEmpty && styles.disabled]}
          onPress={onSplitTicket}
          disabled={isEmpty}
        >
          <Users size={15} color={C.cream} />
          <Text style={styles.splitButtonText}>Split the Bill</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.clearButton, isEmpty && styles.disabled]}
          onPress={onClearCart}
          disabled={isEmpty}
        >
          <Text style={styles.clearButtonText}>Clear Cart</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: C.parchment,
    borderTopWidth: 1.5,
    borderTopColor: C.vellum,
  },
  content: {
    padding: 14,
    gap: 14,
  },

  // Summary
  summaryBlock: {
    gap: 6,
    paddingBottom: 10,
    borderBottomWidth: 1.5,
    borderBottomColor: C.vellum,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: C.clay,
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '700',
    color: C.espresso,
  },
  totalRow: {
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: C.vellum,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: C.espresso,
  },
  totalValue: {
    fontSize: 15,
    fontWeight: '900',
    color: C.brass,
  },

  // Fields
  field: { gap: 6 },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: C.clay,
    textTransform: 'uppercase',
    letterSpacing: 1.1,
  },
  input: {
    borderWidth: 1.5,
    borderColor: C.vellum,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: C.espresso,
    backgroundColor: C.cream,
  },

  // Payment
  paymentGrid: {
    flexDirection: 'row',
    gap: 6,
  },
  paymentButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: C.vellum,
    backgroundColor: C.cream,
    gap: 3,
  },
  paymentButtonActive: {
    backgroundColor: C.brassLight,
    borderColor: C.brassBorder,
  },
  paymentIcon: { fontSize: 14 },
  paymentLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: C.clay,
  },
  paymentLabelActive: {
    color: C.brass,
  },

  // Buttons
  buttons: { gap: 8 },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: C.sage,
    borderRadius: radius.pill,
    paddingVertical: 13,
    shadowColor: C.sage,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.28,
    shadowRadius: 6,
    elevation: 3,
  },
  payButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: C.cream,
    letterSpacing: 0.2,
  },
  kitchenButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: C.amber,
    borderRadius: radius.pill,
    paddingVertical: 12,
  },
  kitchenButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: C.cream,
  },
  splitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: C.violet,
    borderRadius: radius.pill,
    paddingVertical: 12,
  },
  splitButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: C.cream,
  },
  clearButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: C.vellum,
    backgroundColor: C.cream,
  },
  clearButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: C.clay,
  },
  disabled: {
    opacity: 0.45,
  },
})