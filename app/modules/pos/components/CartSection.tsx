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
  amber:       '#D97706',
  violet:      '#7C3AED',
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
          <ShoppingCart size={18} color={C.clay} />
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
          <CheckCircle size={14} color={C.sage} />
          <Text style={styles.successText}>{showSuccessMessage}</Text>
        </View>
      )}
      {showErrorMessage && (
        <View style={styles.errorBanner}>
          <AlertCircle size={14} color={C.terracotta} />
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
            <ShoppingCart size={28} color={C.vellum} />
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
            placeholderTextColor={C.latte}
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
          <Zap size={14} color={C.cream} />
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
              ? <ActivityIndicator size="small" color={C.cream} />
              : <ChefHat size={13} color={C.cream} />}
            <Text style={styles.secondaryButtonText}>
              {isSendingToKitchen ? 'Sending…' : 'Kitchen'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryButton, styles.splitButton, !hasItems && styles.disabled]}
            onPress={onSplitTicket}
            disabled={!hasItems}
          >
            <Users size={13} color={C.cream} />
            <Text style={styles.secondaryButtonText}>Split</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.clearButton, !hasItems && styles.disabled]}
          onPress={onClearCart}
          disabled={!hasItems}
        >
          <Trash2 size={13} color={C.clay} />
          <Text style={styles.clearButtonText}>Clear Cart</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: C.cream, borderLeftWidth: 1.5, borderLeftColor: C.vellum },

  header:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.vellum, backgroundColor: C.parchment },
  headerLeft:      { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle:     { fontSize: 15, fontWeight: '800', color: C.espresso },
  tableBadge:      { backgroundColor: C.sageLight, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 2, borderWidth: 1, borderColor: C.sageBorder },
  tableBadgeText:  { fontSize: 11, fontWeight: '700', color: C.sage },
  headerRight:     { alignItems: 'flex-end' },
  headerTotal:     { fontSize: 17, fontWeight: '900', color: C.espresso },
  headerCount:     { fontSize: 11, color: C.clay, marginTop: 1 },

  successBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 12, marginTop: 8, backgroundColor: C.sageLight, borderRadius: radius.sm, borderWidth: 1, borderColor: C.sageBorder, padding: 10 },
  successText:   { fontSize: 12, fontWeight: '600', color: C.sage },
  errorBanner:   { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 12, marginTop: 8, backgroundColor: C.tcLight, borderRadius: radius.sm, borderWidth: 1, borderColor: C.terracotta, padding: 10 },
  errorText:     { fontSize: 12, fontWeight: '600', color: C.terracotta },

  itemsList:    { flex: 1 },
  itemsContent: { padding: 12, paddingBottom: 4 },
  emptyState:   { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 48, gap: 10 },
  emptyText:    { fontSize: 12, color: C.latte, textAlign: 'center' },

  footer:        { borderTopWidth: 1.5, borderTopColor: C.vellum, backgroundColor: C.parchment, padding: 12, gap: 10 },
  taxBlock:      { backgroundColor: C.cream, borderRadius: radius.sm, borderWidth: 1, borderColor: C.vellum, padding: 10, gap: 4 },
  taxRow:        { flexDirection: 'row', justifyContent: 'space-between' },
  taxLabel:      { fontSize: 11, color: C.clay },
  taxValue:      { fontSize: 11, fontWeight: '600', color: C.espresso },
  taxTotalRow:   { borderTopWidth: 1, borderTopColor: C.vellum, marginTop: 4, paddingTop: 4 },
  taxTotalLabel: { fontSize: 13, fontWeight: '800', color: C.espresso },
  taxTotalValue: { fontSize: 13, fontWeight: '900', color: C.brass },

  fieldBlock: { gap: 5 },
  fieldLabel: { fontSize: 10, fontWeight: '800', color: C.clay, textTransform: 'uppercase', letterSpacing: 1 },
  input:      { borderWidth: 1.5, borderColor: C.vellum, borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 9, fontSize: 13, color: C.espresso, backgroundColor: C.cream },

  paymentGrid:         { flexDirection: 'row', gap: 8 },
  paymentButton:       { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: radius.md, borderWidth: 1.5, borderColor: C.vellum, backgroundColor: C.cream, gap: 2 },
  paymentButtonActive: { backgroundColor: C.sageLight, borderColor: C.sageBorder },
  paymentIcon:         { fontSize: 14 },
  paymentLabel:        { fontSize: 11, fontWeight: '700', color: C.clay },
  paymentLabelActive:  { color: C.sage },

  payButton:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: C.sage, borderRadius: radius.pill, paddingVertical: 13 },
  payButtonText: { fontSize: 14, fontWeight: '800', color: C.cream },

  secondaryRow:        { flexDirection: 'row', gap: 8 },
  secondaryButton:     { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 10, borderRadius: radius.md },
  kitchenButton:       { backgroundColor: C.amber },
  splitButton:         { backgroundColor: C.violet },
  secondaryButtonText: { fontSize: 12, fontWeight: '700', color: C.cream },

  clearButton:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: C.cream, borderRadius: radius.pill, paddingVertical: 10, borderWidth: 1.5, borderColor: C.vellum },
  clearButtonText: { fontSize: 12, fontWeight: '700', color: C.clay },

  disabled: { opacity: 0.45 },
})
