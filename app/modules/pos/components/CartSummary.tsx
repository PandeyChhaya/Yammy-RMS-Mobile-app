import { ChefHat, Users, Zap } from 'lucide-react-native'
import {
    ActivityIndicator, StyleSheet,
    Text, TextInput, TouchableOpacity,
    View,
} from 'react-native'

const C = {
  espresso:    '#1C1008',
  clay:        '#7A4528',
  latte:       '#C8956A',
  cream:       '#FDF6EC',
  parchment:   '#F5E9D4',
  vellum:      '#EDD9BC',
  brass:       '#B5822A',
  sage:        '#3B6E52',
  sageLight:   '#EBF4EE',
  sageBorder:  '#9FCFB4',
  terracotta:  '#A03020',
  amber:       '#D97706',
  violet:      '#7C3AED',
}
const radius = { xs: 6, sm: 10, md: 14, pill: 100 }

interface TableData {
  table_id: string
  number: number
  capacity: number
  status: string
}

interface TaxBreakdownItem {
  name: string
  rate: number
  amount: number
}

interface CartSummaryProps {
  cartTotal: number
  cartItems: any[]
  selectedTable: TableData | null
  customerName: string
  setCustomerName: (name: string) => void
  paymentMethod: string
  setPaymentMethod: (method: string) => void
  onPayment: () => void
  onSendToKitchen: () => void
  onClearCart: () => void
  onSplitTicket: () => void
  isSendingToKitchen: boolean
  getCartTotalWithTax: () => number
  getCartTaxBreakdown: () => TaxBreakdownItem[]
  symbol?: string
}

const fmt = (amount: number, symbol = 'NPR') =>
  `${symbol} ${amount.toFixed(2)}`

const PAYMENT_METHODS = [
  { id: 'cash',     name: 'Cash',     icon: '💵' },
  { id: 'card',     name: 'Card',     icon: '💳' },
  { id: 'transfer', name: 'Transfer', icon: '📱' },
]

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
  getCartTaxBreakdown,
  symbol = 'NPR',
}: CartSummaryProps) {
  const hasItems     = cartItems.length > 0
  const totalWithTax = getCartTotalWithTax()
  const breakdown    = getCartTaxBreakdown()

  return (
    <View style={styles.container}>

      <View style={styles.taxBlock}>
        <View style={styles.taxRow}>
          <Text style={styles.taxLabel}>Subtotal</Text>
          <Text style={styles.taxValue}>{fmt(cartTotal, symbol)}</Text>
        </View>

        {breakdown.map((t) => (
          <View key={t.name} style={styles.taxRow}>
            <Text style={styles.taxLabel}>{t.name} ({t.rate}%)</Text>
            <Text style={styles.taxValue}>+{fmt(t.amount, symbol)}</Text>
          </View>
        ))}

        <View style={[styles.taxRow, styles.taxTotalRow]}>
          <Text style={styles.taxTotalLabel}>Total</Text>
          <Text style={styles.taxTotalValue}>{fmt(totalWithTax, symbol)}</Text>
        </View>
      </View>

      <View style={styles.fieldBlock}>
        <Text style={styles.fieldLabel}>Customer Name</Text>
        <TextInput
          style={styles.input}
          value={customerName}
          onChangeText={setCustomerName}
          placeholder="Customer name (optional)"
          placeholderTextColor={C.latte}
        />
      </View>

      <View style={styles.fieldBlock}>
        <Text style={styles.fieldLabel}>Payment Method</Text>
        <View style={styles.paymentGrid}>
          {PAYMENT_METHODS.map((m) => (
            <TouchableOpacity
              key={m.id}
              style={[
                styles.paymentButton,
                paymentMethod === m.id && styles.paymentButtonActive,
              ]}
              onPress={() => setPaymentMethod(m.id)}
            >
              <Text style={styles.paymentIcon}>{m.icon}</Text>
              <Text style={[
                styles.paymentLabel,
                paymentMethod === m.id && styles.paymentLabelActive,
              ]}>
                {m.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TouchableOpacity
        style={[styles.payButton, !hasItems && styles.disabled]}
        onPress={onPayment}
        disabled={!hasItems}
      >
        <Zap size={15} color={C.cream} />
        <Text style={styles.payButtonText}>Pay {fmt(totalWithTax, symbol)}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.kitchenButton,
          (!selectedTable || !hasItems || isSendingToKitchen) && styles.disabled,
        ]}
        onPress={onSendToKitchen}
        disabled={!selectedTable || !hasItems || isSendingToKitchen}
      >
        {isSendingToKitchen
          ? <ActivityIndicator size="small" color={C.cream} />
          : <ChefHat size={15} color={C.cream} />
        }
        <Text style={styles.kitchenButtonText}>
          {isSendingToKitchen ? 'Sending…' : 'Send to Kitchen'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.splitButton, !hasItems && styles.disabled]}
        onPress={onSplitTicket}
        disabled={!hasItems}
      >
        <Users size={15} color={C.cream} />
        <Text style={styles.splitButtonText}>Split the Bill</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.clearButton, !hasItems && styles.disabled]}
        onPress={onClearCart}
        disabled={!hasItems}
      >
        <Text style={styles.clearButtonText}>Clear Cart</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1.5,
    borderTopColor: C.vellum,
    backgroundColor: C.parchment,
    padding: 14,
    gap: 10,
  },

  taxBlock: {
    backgroundColor: C.cream, borderRadius: radius.sm,
    borderWidth: 1, borderColor: C.vellum, padding: 10, gap: 5,
  },
  taxRow:        { flexDirection: 'row', justifyContent: 'space-between' },
  taxLabel:      { fontSize: 12, color: C.clay },
  taxValue:      { fontSize: 12, fontWeight: '600', color: C.espresso },
  taxTotalRow:   { borderTopWidth: 1, borderTopColor: C.vellum, marginTop: 4, paddingTop: 6 },
  taxTotalLabel: { fontSize: 14, fontWeight: '800', color: C.espresso },
  taxTotalValue: { fontSize: 14, fontWeight: '900', color: C.brass },

  fieldBlock: { gap: 6 },
  fieldLabel: {
    fontSize: 10, fontWeight: '800', color: C.clay,
    textTransform: 'uppercase', letterSpacing: 1,
  },
  input: {
    borderWidth: 1.5, borderColor: C.vellum, borderRadius: radius.md,
    paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 13, color: C.espresso, backgroundColor: C.cream,
  },

  paymentGrid:         { flexDirection: 'row', gap: 8 },
  paymentButton: {
    flex: 1, alignItems: 'center', paddingVertical: 9,
    borderRadius: radius.md, borderWidth: 1.5, borderColor: C.vellum,
    backgroundColor: C.cream, gap: 3,
  },
  paymentButtonActive: { backgroundColor: C.sageLight, borderColor: C.sageBorder },
  paymentIcon:         { fontSize: 14 },
  paymentLabel:        { fontSize: 11, fontWeight: '700', color: C.clay },
  paymentLabelActive:  { color: C.sage },

  payButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 7, backgroundColor: C.sage, borderRadius: radius.pill, paddingVertical: 14,
  },
  payButtonText: { fontSize: 14, fontWeight: '800', color: C.cream },

  kitchenButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 7, backgroundColor: C.amber, borderRadius: radius.pill, paddingVertical: 12,
  },
  kitchenButtonText: { fontSize: 13, fontWeight: '700', color: C.cream },

  splitButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 7, backgroundColor: C.violet, borderRadius: radius.pill, paddingVertical: 12,
  },
  splitButtonText: { fontSize: 13, fontWeight: '700', color: C.cream },

  clearButton: {
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.cream, borderRadius: radius.pill,
    paddingVertical: 11, borderWidth: 1.5, borderColor: C.vellum,
  },
  clearButtonText: { fontSize: 13, fontWeight: '700', color: C.clay },

  disabled: { opacity: 0.45 },
})
