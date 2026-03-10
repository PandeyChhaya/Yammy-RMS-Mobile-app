import { ChefHat, Users, Zap } from 'lucide-react-native'
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { useTaxSettings } from '../../../../shared/hooks/useTaxSettings'
import { TableData } from '../types/tables'
import TaxBreakdown from './TaxBreakDown'

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
  getCartTaxBreakdown: () => any[]
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
  getCartTaxBreakdown
}: CartSummaryProps) {
  const { formatAmount } = useTaxSettings()

  const paymentMethods = [
    { id: 'cash', name: 'Cash' },
    { id: 'card', name: 'Card' },
    { id: 'transfer', name: 'Transfer' },
  ]

  return (
    <View style={styles.container}>
      <View style={styles.summarySection}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Subtotal:</Text>
          <Text style={styles.summaryValue}>{cartTotal.toFixed(2)} €</Text>
        </View>

        <TaxBreakdown
          breakdowns={getCartTaxBreakdown()}
          showDetails={getCartTaxBreakdown().length > 1}
          className="text-xs text-gray-600"
        />

        <View style={[styles.summaryRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total:</Text>
          <Text style={styles.totalValue}>{formatAmount(getCartTotalWithTax())}</Text>
        </View>
      </View>

      <View style={styles.inputSection}>
        <Text style={styles.inputLabel}>Customer name</Text>
        <TextInput
          value={customerName}
          onChangeText={setCustomerName}
          placeholder="Customer name (optional)"
          placeholderTextColor="#9CA3AF"
          style={styles.textInput}
        />
      </View>

      <View style={styles.inputSection}>
        <Text style={styles.inputLabel}>Payment method</Text>
        <View style={styles.pickerContainer}>
          {paymentMethods.map(method => (
            <TouchableOpacity
              key={method.id}
              onPress={() => setPaymentMethod(method.id)}
              style={[
                styles.paymentOption,
                paymentMethod === method.id && styles.paymentOptionSelected
              ]}
            >
              <Text style={[
                styles.paymentOptionText,
                paymentMethod === method.id && styles.paymentOptionTextSelected
              ]}>
                {method.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.buttonSection}>
        <TouchableOpacity
          onPress={onPayment}
          disabled={cartItems.length === 0}
          style={[
            styles.button,
            styles.payButton,
            cartItems.length === 0 && styles.buttonDisabled
          ]}
        >
          <Zap size={16} color="#FFFFFF" />
          <Text style={styles.payButtonText}>
            Pay {formatAmount(getCartTotalWithTax())}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onSendToKitchen}
          disabled={!selectedTable || cartItems.length === 0 || isSendingToKitchen}
          style={[
            styles.button,
            styles.kitchenButton,
            (!selectedTable || cartItems.length === 0 || isSendingToKitchen) && styles.buttonDisabled
          ]}
        >
          <ChefHat size={16} color="#FFFFFF" />
          <Text style={styles.kitchenButtonText}>
            {isSendingToKitchen ? 'Sending...' : 'Send to kitchen'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onClearCart}
          disabled={cartItems.length === 0}
          style={[
            styles.button,
            styles.clearButton,
            cartItems.length === 0 && styles.buttonDisabled
          ]}
        >
          <Text style={styles.clearButtonText}>Clear cart</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onSplitTicket}
          disabled={cartItems.length === 0}
          style={[
            styles.button,
            styles.splitButton,
            cartItems.length === 0 && styles.buttonDisabled
          ]}
        >
          <Users size={16} color="#FFFFFF" />
          <Text style={styles.splitButtonText}>Split the bill</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    padding: 12,
    backgroundColor: '#F9FAFB',
  },
  summarySection: {
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#D1D5DB',
    paddingTop: 8,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2563EB',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2563EB',
  },
  inputSection: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    width: '100%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    fontSize: 14,
    backgroundColor: '#FFFFFF',
  },
  pickerContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  paymentOption: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  paymentOptionSelected: {
    backgroundColor: '#DBEAFE',
    borderColor: '#2563EB',
  },
  paymentOptionText: {
    fontSize: 14,
    color: '#374151',
  },
  paymentOptionTextSelected: {
    color: '#2563EB',
    fontWeight: '600',
  },
  buttonSection: {
    gap: 8,
  },
  button: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  payButton: {
    backgroundColor: '#2563EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  payButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  kitchenButton: {
    backgroundColor: '#EA580C',
  },
  kitchenButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  clearButton: {
    backgroundColor: '#E5E7EB',
  },
  clearButtonText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '500',
  },
  splitButton: {
    backgroundColor: '#9333EA',
  },
  splitButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
})