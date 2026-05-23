import { AlertCircle, CheckCircle, ChefHat, ShoppingCart, Trash2, Users, Zap } from 'lucide-react-native'
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { CartItemDisplay } from '../types/cart'
import { TableData } from '../types/tables'
import CartItem from './cartItem'

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
const radius = { xs: 6, sm: 10, md: 14, pill: 100 }

interface TaxBreakdownItem {
  name: string
  rate: number
  amount: number
}

interface CartSectionProps {
  selectedTable: TableData | null
  cartItems: CartItemDisplay[]
  cartTotal: number
  customerName: string
  setCustomerName: (name: string) => void
  paymentMethod: string
  setPaymentMethod: (method: string) => void
  onRemove: (menuItemId: string) => void
  onUpdateQuantity: (menuItemId: string, quantity: number) => void
  onPayment: () => void
  onSendToKitchen: () => void
  onClearCart: () => void
  onSplitTicket: () => void
  isSendingToKitchen: boolean
  showSuccessMessage: string | null
  showErrorMessage: string | null
  getCartTax: () => number
  getCartTotalWithTax: () => number
  getCartTaxBreakdown: () => TaxBreakdownItem[]
  getCategoryColor: (categoryId: number) => string  
  symbol?: string
}

const fmt = (amount: number, symbol = 'NPR') =>
  `${symbol} ${amount.toFixed(2)}`

const PAYMENT_METHODS = [
  { id: 'cash',     name: 'Cash',     icon: '💵' },
  { id: 'card',     name: 'Card',     icon: '💳' },
  { id: 'transfer', name: 'Transfer', icon: '📱' },
]

export default function CartSection({
  selectedTable,
  cartItems,
  cartTotal,
  customerName,
  setCustomerName,
  paymentMethod,
  setPaymentMethod,
  onRemove,
  onUpdateQuantity,
  onPayment,
  onSendToKitchen,
  onClearCart,
  onSplitTicket,
  isSendingToKitchen,
  showSuccessMessage,
  showErrorMessage,
  getCartTax,
  getCartTotalWithTax,
  getCartTaxBreakdown,
  getCategoryColor,
  symbol = 'NPR',
}: CartSectionProps) {

  const totalWithTax = getCartTotalWithTax()
  const taxBreakdown = getCartTaxBreakdown()
  const hasItems     = cartItems.length > 0

  return (
    <View style={styles.container}>

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <ShoppingCart size={18} color={C.textMuted} />
          <Text style={styles.headerTitle}>Cart</Text>
          {selectedTable && (
            <View style={styles.tableBadge}>
              <Text style={styles.tableBadgeText}>
                Table {selectedTable.table_number}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.headerTotal}>{fmt(totalWithTax, symbol)}</Text>
          <Text style={styles.headerCount}>
            {cartItems.length} item{cartItems.length !== 1 ? 's' : ''}
          </Text>
        </View>
      </View>

      {showSuccessMessage && (
        <View style={styles.successBanner}>
          <CheckCircle size={14} color={C.success} />
          <Text style={styles.successText}>{showSuccessMessage}</Text>
        </View>
      )}
      {showErrorMessage && (
        <View style={styles.errorBanner}>
          <AlertCircle size={14} color={C.danger} />
          <Text style={styles.errorText}>{showErrorMessage}</Text>
        </View>
      )}

      <ScrollView
        style={styles.itemsList}
        contentContainerStyle={styles.itemsContent}
        showsVerticalScrollIndicator={false}
      >
        {!hasItems ? (
          <View style={styles.emptyState}>
            <ShoppingCart size={28} color={C.surfaceHighlight} />
            <Text style={styles.emptyText}>
              {selectedTable
                ? `Select items for Table ${selectedTable.table_number}`
                : 'Select items to get started'}
            </Text>
          </View>
        ) : (
          cartItems.map((item) => (
            <CartItem
              key={item.menu_item_id}
              item={item}
              onRemove={onRemove}
              onUpdateQuantity={onUpdateQuantity}
              getCategoryColor={getCategoryColor}
              showTaxDetails
              symbol={symbol}
            />
          ))
        )}
      </ScrollView>

      <View style={styles.footer}>

        {hasItems && (
          <View style={styles.taxBlock}>
            <View style={styles.taxRow}>
              <Text style={styles.taxLabel}>Subtotal</Text>
              <Text style={styles.taxValue}>{fmt(cartTotal, symbol)}</Text>
            </View>
            {taxBreakdown.map((t) => (
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
        )}

        <View style={styles.fieldBlock}>
          <Text style={styles.fieldLabel}>Customer Name</Text>
          <TextInput
            style={styles.input}
            value={customerName}
            onChangeText={setCustomerName}
            placeholder="Customer name (optional)"
            placeholderTextColor={C.textMuted}
          />
        </View>

        <View style={styles.fieldBlock}>
          <Text style={styles.fieldLabel}>Payment Method</Text>
          <View style={styles.paymentGrid}>
            {PAYMENT_METHODS.map((m) => (
              <TouchableOpacity
                key={m.id}
                style={[styles.paymentButton, paymentMethod === m.id && styles.paymentButtonActive]}
                onPress={() => setPaymentMethod(m.id)}
              >
                <Text style={styles.paymentIcon}>{m.icon}</Text>
                <Text style={[styles.paymentLabel, paymentMethod === m.id && styles.paymentLabelActive]}>
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
          <Zap size={14} color={C.textMain} />
          <Text style={styles.payButtonText}>Pay {fmt(totalWithTax, symbol)}</Text>
        </TouchableOpacity>

        <View style={styles.secondaryRow}>
          <TouchableOpacity
            style={[styles.secondaryButton, styles.kitchenButton,
              (!selectedTable || !hasItems || isSendingToKitchen) && styles.disabled]}
            onPress={onSendToKitchen}
            disabled={!selectedTable || !hasItems || isSendingToKitchen}
          >
            {isSendingToKitchen
              ? <ActivityIndicator size="small" color={C.textMain} />
              : <ChefHat size={13} color={C.textMain} />}
            <Text style={styles.secondaryButtonText}>
              {isSendingToKitchen ? 'Sending…' : 'Kitchen'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryButton, styles.splitButton, !hasItems && styles.disabled]}
            onPress={onSplitTicket}
            disabled={!hasItems}
          >
            <Users size={13} color={C.textMain} />
            <Text style={styles.secondaryButtonText}>Split</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.clearButton, !hasItems && styles.disabled]}
          onPress={onClearCart}
          disabled={!hasItems}
        >
          <Trash2 size={13} color={C.danger} />
          <Text style={styles.clearButtonText}>Clear Cart</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: C.background, borderLeftWidth: 1.5, borderLeftColor: C.border },

  header:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border, backgroundColor: C.surface },
  headerLeft:      { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle:     { fontSize: 15, fontWeight: '800', color: C.textMain },
  tableBadge:      { backgroundColor: C.primaryDim, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 2, borderWidth: 1, borderColor: C.primary },
  tableBadgeText:  { fontSize: 11, fontWeight: '700', color: C.primary },
  headerRight:     { alignItems: 'flex-end' },
  headerTotal:     { fontSize: 17, fontWeight: '900', color: C.textMain },
  headerCount:     { fontSize: 11, color: C.textMuted, marginTop: 1 },

  successBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 12, marginTop: 8, backgroundColor: C.successDim, borderRadius: radius.sm, borderWidth: 1, borderColor: C.success, padding: 10 },
  successText:   { fontSize: 12, fontWeight: '600', color: C.success },
  errorBanner:   { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 12, marginTop: 8, backgroundColor: C.dangerDim, borderRadius: radius.sm, borderWidth: 1, borderColor: C.danger, padding: 10 },
  errorText:     { fontSize: 12, fontWeight: '600', color: C.danger },

  itemsList:    { flex: 1 },
  itemsContent: { padding: 12, paddingBottom: 4 },
  emptyState:   { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 48, gap: 10 },
  emptyText:    { fontSize: 12, color: C.textMuted, textAlign: 'center' },

  footer:        { borderTopWidth: 1.5, borderTopColor: C.border, backgroundColor: C.surface, padding: 12, gap: 10 },
  taxBlock:      { backgroundColor: C.background, borderRadius: radius.sm, borderWidth: 1, borderColor: C.border, padding: 10, gap: 4 },
  taxRow:        { flexDirection: 'row', justifyContent: 'space-between' },
  taxLabel:      { fontSize: 11, color: C.textMuted },
  taxValue:      { fontSize: 11, fontWeight: '600', color: C.textMain },
  taxTotalRow:   { borderTopWidth: 1, borderTopColor: C.border, marginTop: 4, paddingTop: 4 },
  taxTotalLabel: { fontSize: 13, fontWeight: '800', color: C.textMain },
  taxTotalValue: { fontSize: 13, fontWeight: '900', color: C.primary },

  fieldBlock: { gap: 5 },
  fieldLabel: { fontSize: 10, fontWeight: '800', color: C.textMuted, textTransform: 'uppercase', letterSpacing: 1 },
  input:      { borderWidth: 1.5, borderColor: C.border, borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 9, fontSize: 13, color: C.textMain, backgroundColor: C.background },

  paymentGrid:         { flexDirection: 'row', gap: 8 },
  paymentButton:       { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: radius.md, borderWidth: 1.5, borderColor: C.border, backgroundColor: C.background, gap: 2 },
  paymentButtonActive: { backgroundColor: C.primaryDim, borderColor: C.primary },
  paymentIcon:         { fontSize: 14 },
  paymentLabel:        { fontSize: 11, fontWeight: '700', color: C.textMuted },
  paymentLabelActive:  { color: C.primary },

  payButton:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: C.primary, borderRadius: radius.pill, paddingVertical: 13 },
  payButtonText: { fontSize: 14, fontWeight: '800', color: C.textMain },

  secondaryRow:        { flexDirection: 'row', gap: 8 },
  secondaryButton:     { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 10, borderRadius: radius.md },
  kitchenButton:       { backgroundColor: C.warning },
  splitButton:         { backgroundColor: C.info },
  secondaryButtonText: { fontSize: 12, fontWeight: '700', color: C.textMain },

  clearButton:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: C.background, borderRadius: radius.pill, paddingVertical: 10, borderWidth: 1.5, borderColor: C.border },
  clearButtonText: { fontSize: 12, fontWeight: '700', color: C.danger },

  disabled: { opacity: 0.45 },
})