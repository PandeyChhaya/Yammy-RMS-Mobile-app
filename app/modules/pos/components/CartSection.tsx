// CartSection.tsx
import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  AlertCircle,
  CheckCircle,
  ChefHat,
  CreditCard,
  DollarSign,
  ShoppingCart,
  Smartphone,
  Trash2,
  Users,
  Zap,
} from 'lucide-react-native'
import { useEffect, useState } from 'react'
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

const corner = { xs: 6, sm: 10, md: 14, pill: 100 }

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

function money(amount: number, symbol = 'NPR') {
  return `${symbol} ${amount.toFixed(2)}`
}

const paymentOptions = [
  { id: 'cash', name: 'Cash', icon: DollarSign },
  { id: 'card', name: 'Card', icon: CreditCard },
  { id: 'transfer', name: 'Transfer', icon: Smartphone },
]

// roles allowed to take payment / split a bill from the POS cart
const PAYMENT_ROLES = ['Cashier', 'Admin', 'Super Admin']

export default function CartSection(props: CartSectionProps) {
  const {
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
    getCartTotalWithTax,
    getCartTaxBreakdown,
    getCategoryColor,
    symbol = 'NPR',
  } = props

  const [canTakePayment, setCanTakePayment] = useState(false)

  useEffect(() => {
    AsyncStorage.getItem('@userRole').then((role) => {
      setCanTakePayment(role ? PAYMENT_ROLES.includes(role) : false)
    })
  }, [])

  const totalWithTax = getCartTotalWithTax()
  const taxBreakdown = getCartTaxBreakdown()
  const hasItems = cartItems.length > 0

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <ShoppingCart size={18} color={palette.textDim} />
          <Text style={styles.headerTitle}>Cart</Text>
          {selectedTable ? (
            <View style={styles.tableBadge}>
              <Text style={styles.tableBadgeText}>Table {selectedTable.table_number}</Text>
            </View>
          ) : null}
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.headerTotal}>{money(totalWithTax, symbol)}</Text>
          <Text style={styles.headerCount}>
            {cartItems.length} item{cartItems.length !== 1 ? 's' : ''}
          </Text>
        </View>
      </View>

      {showSuccessMessage ? (
        <View style={styles.successBanner}>
          <CheckCircle size={14} color={palette.green} />
          <Text style={styles.successText}>{showSuccessMessage}</Text>
        </View>
      ) : null}

      {showErrorMessage ? (
        <View style={styles.errorBanner}>
          <AlertCircle size={14} color={palette.red} />
          <Text style={styles.errorText}>{showErrorMessage}</Text>
        </View>
      ) : null}

      <ScrollView
        style={styles.itemsList}
        contentContainerStyle={styles.itemsContent}
        showsVerticalScrollIndicator={false}
      >
        {!hasItems ? (
          <View style={styles.emptyState}>
            <ShoppingCart size={28} color={palette.cardAlt} />
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
        {hasItems ? (
          <View style={styles.taxBlock}>
            <View style={styles.taxRow}>
              <Text style={styles.taxLabel}>Subtotal</Text>
              <Text style={styles.taxValue}>{money(cartTotal, symbol)}</Text>
            </View>
            {taxBreakdown.map((t) => (
              <View key={t.name} style={styles.taxRow}>
                <Text style={styles.taxLabel}>
                  {t.name} ({t.rate}%)
                </Text>
                <Text style={styles.taxValue}>+{money(t.amount, symbol)}</Text>
              </View>
            ))}
            <View style={[styles.taxRow, styles.taxTotalRow]}>
              <Text style={styles.taxTotalLabel}>Total</Text>
              <Text style={styles.taxTotalValue}>{money(totalWithTax, symbol)}</Text>
            </View>
          </View>
        ) : null}

        <View style={styles.fieldBlock}>
          <Text style={styles.fieldLabel}>Customer Name</Text>
          <TextInput
            style={styles.input}
            value={customerName}
            onChangeText={setCustomerName}
            placeholder="Customer name (optional)"
            placeholderTextColor={palette.textDim}
          />
        </View>

        <View style={styles.fieldBlock}>
          <Text style={styles.fieldLabel}>Payment Method</Text>
          <View style={styles.paymentGrid}>
            {paymentOptions.map((method) => {
              const Icon = method.icon
              const active = paymentMethod === method.id
              return (
                <TouchableOpacity
                  key={method.id}
                  style={[styles.paymentButton, active && styles.paymentButtonActive]}
                  onPress={() => setPaymentMethod(method.id)}
                >
                  <Icon size={14} color={active ? palette.brand : palette.textDim} />
                  <Text style={[styles.paymentLabel, active && styles.paymentLabelActive]}>
                    {method.name}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </View>
        </View>

        {canTakePayment ? (
          <TouchableOpacity
            style={[styles.payButton, !hasItems && styles.disabled]}
            onPress={onPayment}
            disabled={!hasItems}
          >
            <Zap size={14} color={palette.text} />
            <Text style={styles.payButtonText}>Pay {money(totalWithTax, symbol)}</Text>
          </TouchableOpacity>
        ) : null}

        <View style={styles.secondaryRow}>
          <TouchableOpacity
            style={[
              styles.secondaryButton,
              styles.kitchenButton,
              (!selectedTable || !hasItems || isSendingToKitchen) && styles.disabled,
            ]}
            onPress={onSendToKitchen}
            disabled={!selectedTable || !hasItems || isSendingToKitchen}
          >
            {isSendingToKitchen ? (
              <ActivityIndicator size="small" color={palette.text} />
            ) : (
              <ChefHat size={13} color={palette.text} />
            )}
            <Text style={styles.secondaryButtonText}>
              {isSendingToKitchen ? 'Sending…' : 'Kitchen'}
            </Text>
          </TouchableOpacity>

          {canTakePayment ? (
            <TouchableOpacity
              style={[styles.secondaryButton, styles.splitButton, !hasItems && styles.disabled]}
              onPress={onSplitTicket}
              disabled={!hasItems}
            >
              <Users size={13} color={palette.text} />
              <Text style={styles.secondaryButtonText}>Split</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <TouchableOpacity
          style={[styles.clearButton, !hasItems && styles.disabled]}
          onPress={onClearCart}
          disabled={!hasItems}
        >
          <Trash2 size={13} color={palette.red} />
          <Text style={styles.clearButtonText}>Clear Cart</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.bg,
    borderLeftWidth: 1.5,
    borderLeftColor: palette.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
    backgroundColor: palette.card,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: palette.text,
  },
  tableBadge: {
    backgroundColor: palette.brandBg,
    borderRadius: corner.pill,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: palette.brand,
  },
  tableBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: palette.brand,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  headerTotal: {
    fontSize: 17,
    fontWeight: '900',
    color: palette.text,
  },
  headerCount: {
    fontSize: 11,
    color: palette.textDim,
    marginTop: 1,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 12,
    marginTop: 8,
    backgroundColor: palette.greenBg,
    borderRadius: corner.sm,
    borderWidth: 1,
    borderColor: palette.green,
    padding: 10,
  },
  successText: {
    fontSize: 12,
    fontWeight: '600',
    color: palette.green,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 12,
    marginTop: 8,
    backgroundColor: palette.redBg,
    borderRadius: corner.sm,
    borderWidth: 1,
    borderColor: palette.red,
    padding: 10,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '600',
    color: palette.red,
  },
  itemsList: {
    flex: 1,
  },
  itemsContent: {
    padding: 12,
    paddingBottom: 4,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 10,
  },
  emptyText: {
    fontSize: 12,
    color: palette.textDim,
    textAlign: 'center',
  },
  footer: {
    borderTopWidth: 1.5,
    borderTopColor: palette.border,
    backgroundColor: palette.card,
    padding: 12,
    gap: 10,
  },
  taxBlock: {
    backgroundColor: palette.bg,
    borderRadius: corner.sm,
    borderWidth: 1,
    borderColor: palette.border,
    padding: 10,
    gap: 4,
  },
  taxRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  taxLabel: {
    fontSize: 11,
    color: palette.textDim,
  },
  taxValue: {
    fontSize: 11,
    fontWeight: '600',
    color: palette.text,
  },
  taxTotalRow: {
    borderTopWidth: 1,
    borderTopColor: palette.border,
    marginTop: 4,
    paddingTop: 4,
  },
  taxTotalLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: palette.text,
  },
  taxTotalValue: {
    fontSize: 13,
    fontWeight: '900',
    color: palette.brand,
  },
  fieldBlock: {
    gap: 5,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: palette.textDim,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  input: {
    borderWidth: 1.5,
    borderColor: palette.border,
    borderRadius: corner.md,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: palette.text,
    backgroundColor: palette.bg,
  },
  paymentGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  paymentButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: corner.md,
    borderWidth: 1.5,
    borderColor: palette.border,
    backgroundColor: palette.bg,
    gap: 4,
  },
  paymentButtonActive: {
    backgroundColor: palette.brandBg,
    borderColor: palette.brand,
  },
  paymentLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: palette.textDim,
  },
  paymentLabelActive: {
    color: palette.brand,
  },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: palette.brand,
    borderRadius: corner.pill,
    paddingVertical: 13,
  },
  payButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: palette.text,
  },
  secondaryRow: {
    flexDirection: 'row',
    gap: 8,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 10,
    borderRadius: corner.md,
  },
  kitchenButton: {
    backgroundColor: palette.amber,
  },
  splitButton: {
    backgroundColor: palette.blue,
  },
  secondaryButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: palette.text,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: palette.bg,
    borderRadius: corner.pill,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: palette.border,
  },
  clearButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: palette.red,
  },
  disabled: {
    opacity: 0.45,
  },
})