import { useMutation, useQueryClient } from '@tanstack/react-query'
import { AlertCircle, CheckCircle, X, Zap } from 'lucide-react-native'
import { useState } from 'react'
import {
  ActivityIndicator, Alert,
  Modal, ScrollView, StyleSheet,
  Text, TextInput, TouchableOpacity,
  View,
} from 'react-native'
import { CartItemDisplay } from '../types/cart'
import { TableData } from '../types/tables'

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
  tcLight:     '#FAECEA',
  tcBorder:    '#E8A898',
  amber:       '#D97706',
}
const radius = { xs: 6, sm: 10, md: 14, lg: 20, pill: 100 }

interface CreateOrderPayload {
  table_id?:     number
  user_id?:      number
  customer_id?:  number
  order_type:    string              
  special_notes?: string
  subtotal:      number
  discount:      number
  tax:           number
  total_amount:  number
  items: Array<{
    menu_item_id: number
    quantity:     number
    unit_price:   number
    total_price:  number
  }>
}

interface CreatePaymentPayload {
  order_id:       number
  payment_method: string
  amount_paid:    number
  change_given:   number
  transaction_ref?: string
}

interface PaymentModalProps {
  visible: boolean
  onClose: () => void
  onSuccess: () => void

  cartItems:    CartItemDisplay[]
  cartTotal:    number              
  taxAmount:    number
  totalWithTax: number
  selectedTable: TableData | null
  customerName:  string
  paymentMethod: string
  symbol?:       string
}

const BASE = 'http://192.168.1.71:5000/api'

const createOrder = async (payload: CreateOrderPayload): Promise<{ order_id: number }> => {
  const res = await fetch(`${BASE}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.message ?? 'Failed to create order')
  return data
}

const createPayment = async (payload: CreatePaymentPayload): Promise<void> => {
  const res = await fetch(`${BASE}/payments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.message ?? 'Failed to process payment')
}

const fmt = (amount: number, symbol = 'NPR') =>
  `${symbol} ${Number(amount).toFixed(2)}`

const PAYMENT_METHODS = [
  { id: 'cash',     label: 'Cash',     icon: '💵' },
  { id: 'card',     label: 'Card',     icon: '💳' },
  { id: 'transfer', label: 'Transfer', icon: '📱' },
]

export default function PaymentModal({
  visible,
  onClose,
  onSuccess,
  cartItems,
  cartTotal,
  taxAmount,
  totalWithTax,
  selectedTable,
  customerName,
  paymentMethod: initialMethod,
  symbol = 'NPR',
}: PaymentModalProps) {
  const queryClient = useQueryClient()

  const [method,       setMethod]       = useState(initialMethod || 'cash')
  const [amountPaid,   setAmountPaid]   = useState('')
  const [txRef,        setTxRef]        = useState('')
  const [specialNotes, setSpecialNotes] = useState('')
  const [done,         setDone]         = useState(false)

  const changeDue = Math.max(0, (parseFloat(amountPaid) || 0) - totalWithTax)

  const payMutation = useMutation({
    mutationFn: async () => {
      const { order_id } = await createOrder({
        table_id:      selectedTable?.table_id,
        order_type:    selectedTable ? 'dine_in' : 'direct',
        special_notes: specialNotes || undefined,
        subtotal:      cartTotal,
        discount:      0,
        tax:           taxAmount,
        total_amount:  totalWithTax,
        items: cartItems.map((i) => ({
          menu_item_id: Number(i.menu_item_id),
          quantity:     i.quantity,
          unit_price:   i.unit_price,
          total_price:  i.total_price,
        })),
      })


      await createPayment({
        order_id,
        payment_method: method,
        amount_paid:    parseFloat(amountPaid) || totalWithTax,
        change_given:   changeDue,
        transaction_ref: txRef || undefined,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['tables'] })
      setDone(true)
      setTimeout(() => {
        setDone(false)
        resetForm()
        onSuccess()
        onClose()
      }, 1800)
    },
    onError: (err: Error) => {
      Alert.alert('Payment Failed', err.message)
    },
  })

  const resetForm = () => {
    setAmountPaid('')
    setTxRef('')
    setSpecialNotes('')
    setMethod('cash')
  }

  const handleClose = () => {
    if (payMutation.isPending) return
    resetForm()
    onClose()
  }

  const canPay = cartItems.length > 0 && !payMutation.isPending

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>

          {done ? (
            <View style={styles.successState}>
              <CheckCircle size={52} color={C.sage} />
              <Text style={styles.successTitle}>Payment Complete!</Text>
              <Text style={styles.successSub}>{fmt(totalWithTax, symbol)} received</Text>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>

              <View style={styles.header}>
                <Text style={styles.headerTitle}>Payment</Text>
                <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
                  <X size={18} color={C.clay} />
                </TouchableOpacity>
              </View>

              <View style={styles.summary}>
                {selectedTable && (
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Table</Text>
                    <Text style={styles.summaryValue}>{selectedTable.table_number}</Text>
                  </View>
                )}
                {customerName ? (
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Customer</Text>
                    <Text style={styles.summaryValue}>{customerName}</Text>
                  </View>
                ) : null}
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Items</Text>
                  <Text style={styles.summaryValue}>{cartItems.length}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Subtotal</Text>
                  <Text style={styles.summaryValue}>{fmt(cartTotal, symbol)}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>VAT (13%)</Text>
                  <Text style={styles.summaryValue}>+{fmt(taxAmount, symbol)}</Text>
                </View>
                <View style={[styles.summaryRow, styles.summaryTotalRow]}>
                  <Text style={styles.summaryTotalLabel}>Total</Text>
                  <Text style={styles.summaryTotalValue}>{fmt(totalWithTax, symbol)}</Text>
                </View>
              </View>

              <Text style={styles.sectionLabel}>Payment Method</Text>
              <View style={styles.methodGrid}>
                {PAYMENT_METHODS.map((m) => (
                  <TouchableOpacity
                    key={m.id}
                    style={[styles.methodBtn, method === m.id && styles.methodBtnActive]}
                    onPress={() => setMethod(m.id)}
                  >
                    <Text style={styles.methodIcon}>{m.icon}</Text>
                    <Text style={[styles.methodLabel, method === m.id && styles.methodLabelActive]}>
                      {m.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {method === 'cash' && (
                <>
                  <Text style={styles.sectionLabel}>Amount Received</Text>
                  <TextInput
                    style={styles.input}
                    value={amountPaid}
                    onChangeText={setAmountPaid}
                    placeholder={fmt(totalWithTax, symbol)}
                    placeholderTextColor={C.latte}
                    keyboardType="decimal-pad"
                  />
                  {parseFloat(amountPaid) > 0 && (
                    <View style={styles.changeRow}>
                      <Text style={styles.changeLabel}>Change Due</Text>
                      <Text style={[styles.changeValue, changeDue < 0 && styles.changeNeg]}>
                        {fmt(changeDue, symbol)}
                      </Text>
                    </View>
                  )}
                </>
              )}

              {method !== 'cash' && (
                <>
                  <Text style={styles.sectionLabel}>Transaction Ref (optional)</Text>
                  <TextInput
                    style={styles.input}
                    value={txRef}
                    onChangeText={setTxRef}
                    placeholder="e.g. TXN-12345"
                    placeholderTextColor={C.latte}
                  />
                </>
              )}

              <Text style={styles.sectionLabel}>Special Notes (optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={specialNotes}
                onChangeText={setSpecialNotes}
                placeholder="Any notes for this order..."
                placeholderTextColor={C.latte}
                multiline
                numberOfLines={2}
              />

             {payMutation.isError && (
                <View style={styles.errorBanner}>
                  <AlertCircle size={14} color={C.terracotta} />
                  <Text style={styles.errorText}>
                    {(payMutation.error as Error).message}
                  </Text>
                </View>
              )}

              <TouchableOpacity
                style={[styles.confirmBtn, !canPay && styles.disabled]}
                onPress={() => payMutation.mutate()}
                disabled={!canPay}
              >
                {payMutation.isPending
                  ? <ActivityIndicator color={C.cream} />
                  : <>
                      <Zap size={16} color={C.cream} />
                      <Text style={styles.confirmBtnText}>
                        Confirm Payment · {fmt(totalWithTax, symbol)}
                      </Text>
                    </>
                }
              </TouchableOpacity>

              <TouchableOpacity style={styles.cancelBtn} onPress={handleClose}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(28,16,8,0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: C.parchment,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: C.vellum,
    padding: 22,
    maxHeight: '92%',
  },

  successState: { alignItems: 'center', paddingVertical: 48, gap: 12 },
  successTitle: { fontSize: 22, fontWeight: '900', color: C.espresso },
  successSub:   { fontSize: 14, color: C.clay },

  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  headerTitle: { fontSize: 18, fontWeight: '900', color: C.espresso },
  closeBtn:    { padding: 6, borderRadius: radius.xs, backgroundColor: C.cream, borderWidth: 1, borderColor: C.vellum },

  summary:          { backgroundColor: C.cream, borderRadius: radius.md, borderWidth: 1, borderColor: C.vellum, padding: 14, marginBottom: 18, gap: 6 },
  summaryRow:       { flexDirection: 'row', justifyContent: 'space-between' },
  summaryLabel:     { fontSize: 12, color: C.clay },
  summaryValue:     { fontSize: 12, fontWeight: '600', color: C.espresso },
  summaryTotalRow:  { borderTopWidth: 1, borderTopColor: C.vellum, marginTop: 6, paddingTop: 8 },
  summaryTotalLabel:{ fontSize: 15, fontWeight: '800', color: C.espresso },
  summaryTotalValue:{ fontSize: 15, fontWeight: '900', color: C.brass },

  sectionLabel: { fontSize: 10, fontWeight: '800', color: C.clay, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, marginTop: 14 },

  methodGrid:        { flexDirection: 'row', gap: 8 },
  methodBtn:         { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: radius.md, borderWidth: 1.5, borderColor: C.vellum, backgroundColor: C.cream, gap: 4 },
  methodBtnActive:   { backgroundColor: C.sageLight, borderColor: C.sageBorder },
  methodIcon:        { fontSize: 18 },
  methodLabel:       { fontSize: 11, fontWeight: '700', color: C.clay },
  methodLabelActive: { color: C.sage },

  input:    { borderWidth: 1.5, borderColor: C.vellum, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: C.espresso, backgroundColor: C.cream },
  textArea: { height: 64, textAlignVertical: 'top', marginBottom: 4 },

  changeRow:  { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, paddingHorizontal: 4 },
  changeLabel:{ fontSize: 12, color: C.clay },
  changeValue:{ fontSize: 14, fontWeight: '800', color: C.sage },
  changeNeg:  { color: C.terracotta },

  errorBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.tcLight, borderRadius: radius.sm, borderWidth: 1, borderColor: C.tcBorder, padding: 10, marginTop: 12 },
  errorText:   { fontSize: 12, color: C.terracotta, fontWeight: '600' },

  confirmBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.sage, borderRadius: radius.pill, paddingVertical: 15, marginTop: 20 },
  confirmBtnText: { fontSize: 15, fontWeight: '800', color: C.cream },
  cancelBtn:      { alignItems: 'center', paddingVertical: 14, marginTop: 8 },
  cancelBtnText:  { fontSize: 14, fontWeight: '700', color: C.clay },
  disabled:       { opacity: 0.45 },
})
