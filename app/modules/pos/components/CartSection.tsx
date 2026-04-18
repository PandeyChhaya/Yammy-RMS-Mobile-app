import { AlertCircle, CheckCircle, ChefHat, ShoppingCart, Trash2, Users, Zap } from 'lucide-react-native'
import React, { useState } from 'react'
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { CartItemDisplay, TableData } from '../types'
import ModernCartItem from './ModernCartItem'

const C = {
  espresso:    '#1C1008',
  roast:       '#3D2010',
  clay:        '#7A4528',
  latte:       '#C8956A',
  cream:       '#FDF6EC',
  parchment:   '#F5E9D4',
  vellum:      '#EDD9BC',
  brass:       '#B5822A',
  brassLight:  '#F7EDD8',
  brassBorder: '#DEC07A',
  sage:        '#3B6E52',
  sageLight:   '#EBF4EE',
  sageBorder:  '#9FCFB4',
  terracotta:  '#A03020',
  tcLight:     '#FAECEA',
  tcBorder:    '#E8A898',
  amber:       '#C47A1E',
  amberLight:  '#FEF3E2',
  violet:      '#6D3FA0',
  violetLight: '#F3EDFB',
}

const radius = { xs: 6, sm: 10, md: 14, lg: 18, pill: 100 }

interface PaymentMethod {
  id:   string
  name: string
  icon: string
}

const PAYMENT_METHODS: PaymentMethod[] = [
  { id: 'cash',     name: 'Cash',     icon: '💵' },
  { id: 'card',     name: 'Card',     icon: '💳' },
  { id: 'transfer', name: 'Transfer', icon: '📱' },
]

interface ModernCartSectionProps {
  selectedTable:       TableData | null
  cartItems:           CartItemDisplay[]
  cartTotal:           number
  customerName:        string
  setCustomerName:     (name: string) => void
  paymentMethod:       string
  setPaymentMethod:    (method: string) => void
  onRemove:            (productId: string) => void
  onUpdateQuantity:    (productId: string, quantity: number) => void
  onPayment:           () => void
  onSendToKitchen:     () => void
  onClearCart:         () => void
  onSplitTicket:       () => void
  isSendingToKitchen:  boolean
  showSuccessMessage:  string | null
  showErrorMessage:    string | null
  getCartTotalWithTax: () => number
  getCategoryColor:    (categoryId: string) => string
}

export default function ModernCartSection({
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
  getCategoryColor,
}: ModernCartSectionProps) {
  const isEmpty = cartItems.length === 0

  return (
    <View style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <ShoppingCart size={18} color={C.espresso} />
          <Text style={styles.headerTitle}>Cart</Text>
          {selectedTable && (
            <View style={styles.tableBadge}>
              <Text style={styles.tableBadgeText}>Table {selectedTable.number}</Text>
            </View>
          )}
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.headerTotal}>{getCartTotalWithTax()}</Text>
          <Text style={styles.headerCount}>
            {cartItems.length} item{cartItems.length !== 1 ? 's' : ''}
          </Text>
        </View>
      </View>

      {/* Banners */}
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

      {/* Cart Items */}
      <ScrollView
        style={styles.itemsScroll}
        contentContainerStyle={isEmpty ? styles.emptyContainer : styles.itemsContent}
        showsVerticalScrollIndicator={false}
      >
        {isEmpty ? (
          <View style={styles.emptyState}>
            <ShoppingCart size={28} color={C.latte} />
            <Text style={styles.emptyText}>
              {selectedTable
                ? `Select products for table ${selectedTable.number}`
                : 'Select products to get started'}
            </Text>
          </View>
        ) : (
          cartItems.map((item: CartItemDisplay) => (
            <ModernCartItem
              key={item.product_id}
              item={item}
              onRemove={onRemove}
              onUpdateQuantity={onUpdateQuantity}
              getCategoryColor={getCategoryColor}
            />
          ))
        )}
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>

        {/* Summary */}
        {!isEmpty && (
          <View style={styles.summary}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>{cartTotal}</Text>
            </View>
            <View style={[styles.summaryRow, styles.summaryTotalRow]}>
              <Text style={styles.summaryTotalLabel}>Total</Text>
              <Text style={styles.summaryTotalValue}>{getCartTotalWithTax()}</Text>
            </View>
          </View>
        )}

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

        {/* Pay Button */}
        <TouchableOpacity
          style={[styles.payButton, isEmpty && styles.buttonDisabled]}
          onPress={onPayment}
          disabled={isEmpty}
        >
          <Zap size={14} color={C.cream} />
          <Text style={styles.payButtonText}>Pay {getCartTotalWithTax()}</Text>
        </TouchableOpacity>

        {/* Secondary Buttons */}
        <View style={styles.secondaryRow}>
          <TouchableOpacity
            style={[
              styles.secondaryButton,
              styles.kitchenButton,
              (!selectedTable || isEmpty || isSendingToKitchen) && styles.buttonDisabled,
            ]}
            onPress={onSendToKitchen}
            disabled={!selectedTable || isEmpty || isSendingToKitchen}
          >
            <ChefHat size={13} color={C.cream} />
            <Text style={styles.secondaryButtonText}>
              {isSendingToKitchen ? 'Sending...' : 'Kitchen'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryButton, styles.splitButton, isEmpty && styles.buttonDisabled]}
            onPress={onSplitTicket}
            disabled={isEmpty}
          >
            <Users size={13} color={C.cream} />
            <Text style={styles.secondaryButtonText}>Split</Text>
          </TouchableOpacity>
        </View>

        {/* Clear Cart */}
        <TouchableOpacity
          style={[styles.clearButton, isEmpty && styles.buttonDisabled]}
          onPress={onClearCart}
          disabled={isEmpty}
        >
          <Trash2 size={13} color={C.clay} />
          <Text style={styles.clearButtonText}>Clear Cart</Text>
        </TouchableOpacity>

      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.cream,
    borderLeftWidth: 1.5,
    borderLeftColor: C.vellum,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1.5,
    borderBottomColor: C.vellum,
    backgroundColor: C.parchment,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: C.espresso,
  },
  tableBadge: {
    backgroundColor: C.sageLight,
    borderWidth: 1,
    borderColor: C.sageBorder,
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  tableBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: C.sage,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  headerTotal: {
    fontSize: 17,
    fontWeight: '900',
    color: C.espresso,
  },
  headerCount: {
    fontSize: 10,
    color: C.clay,
    fontWeight: '500',
  },

  // Banners
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    margin: 10,
    padding: 10,
    backgroundColor: C.sageLight,
    borderWidth: 1,
    borderColor: C.sageBorder,
    borderRadius: radius.md,
  },
  successText: {
    fontSize: 12,
    fontWeight: '600',
    color: C.sage,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    margin: 10,
    padding: 10,
    backgroundColor: C.tcLight,
    borderWidth: 1,
    borderColor: C.tcBorder,
    borderRadius: radius.md,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '600',
    color: C.terracotta,
  },

  // Items
  itemsScroll: {
    flex: 1,
  },
  itemsContent: {
    padding: 10,
    gap: 8,
  },
  emptyContainer: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 12,
    color: C.latte,
    textAlign: 'center',
    paddingHorizontal: 20,
  },

  // Footer
  footer: {
    borderTopWidth: 1.5,
    borderTopColor: C.vellum,
    backgroundColor: C.parchment,
    padding: 12,
    gap: 10,
  },
  summary: {
    gap: 4,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: C.vellum,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    fontSize: 12,
    color: C.clay,
  },
  summaryValue: {
    fontSize: 12,
    fontWeight: '600',
    color: C.espresso,
  },
  summaryTotalRow: {
    marginTop: 4,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: C.vellum,
  },
  summaryTotalLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: C.espresso,
  },
  summaryTotalValue: {
    fontSize: 13,
    fontWeight: '900',
    color: C.brass,
  },

  // Fields
  field: { gap: 5 },
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
    paddingVertical: 8,
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
  paymentIcon: {
    fontSize: 13,
  },
  paymentLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: C.clay,
  },
  paymentLabelActive: {
    color: C.brass,
  },

  // Buttons
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: C.sage,
    borderRadius: radius.pill,
    paddingVertical: 12,
    shadowColor: C.sage,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  payButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: C.cream,
    letterSpacing: 0.2,
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
    borderRadius: radius.md,
  },
  kitchenButton: {
    backgroundColor: C.amber,
  },
  splitButton: {
    backgroundColor: C.violet,
  },
  secondaryButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: C.cream,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: C.vellum,
    backgroundColor: C.cream,
  },
  clearButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: C.clay,
  },
  buttonDisabled: {
    opacity: 0.45,
  },
})