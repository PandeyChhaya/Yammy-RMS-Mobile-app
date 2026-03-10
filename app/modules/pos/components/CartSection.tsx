import { AlertCircle, CheckCircle, ShoppingCart } from 'lucide-react-native'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { CartItemDisplay } from '../types/cart'
import { TableData } from '../types/tables'
import CartItem from './CartItem'
import CartSummary from './CartSummary'


interface CartSectionProps {
    selectedTable: TableData | null
    cartItems: CartItemDisplay[]
    cartTotal: number
    customerName: string
    setCustomerName: (name: string) => void
    paymentMethod: string
    setPaymentMethod: (method: string) => void
    onRemove: (productId: string) => void
    onUpdateQuantity: (productId: string, quantity: number) => void
    onPayment: () => void
    onSendToKitchen: () => void
    onClearCart: () => void
    onSplitTicket: () => void
    isSendingToKitchen: boolean
    showSuccessMessage: string | null
    showErrorMessage: string | null
    getCartTax: () => number
    getCartTotalWithTax: () => number
    getCartTaxBreakdown: () => any[]
    getCategoryColor: (categoryId: string) => string
    compact?: boolean
}

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
    getCartTotalWithTax,
    getCartTaxBreakdown,
    getCategoryColor,
}: CartSectionProps) {
    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.headerContent}>
                    <ShoppingCart size={20} color="#2563EB" />
                    <Text style={styles.headerTitle}>Cart</Text>
                    {selectedTable && (
                        <View style={styles.tableBadge}>
                            <Text style={styles.tableBadgeText}>
                                Table {selectedTable.number}
                            </Text>
                        </View>
                    )}
                </View>
            </View>

            {showSuccessMessage && (
                <View style={styles.successMessage}>
                    <CheckCircle size={16} color="#059669" />
                    <Text style={styles.successText}>{showSuccessMessage}</Text>
                </View>
            )}

            {showErrorMessage && (
                <View style={styles.errorMessage}>
                    <AlertCircle size={16} color="#DC2626" />
                    <Text style={styles.errorText}>{showErrorMessage}</Text>
                </View>
            )}

            <View style={styles.cartItemsContainer}>
                {cartItems.length === 0 ? (
                    <View style={styles.emptyCart}>
                        <ShoppingCart size={64} color="#D1D5DB" />
                        <Text style={styles.emptyCartTitle}>Cart is empty</Text>
                        <Text style={styles.emptyCartSubtitle}>
                            {selectedTable ? `Select products for table ${selectedTable.number}` : 'Select products to get started'}
                        </Text>
                    </View>
                ) : (
                    <ScrollView style={styles.cartItemsList} showsVerticalScrollIndicator={false}>
                        {cartItems.map((item: CartItemDisplay) => (
                            <CartItem
                                key={item.product_id}
                                item={item}
                                onRemove={onRemove}
                                onUpdateQuantity={onUpdateQuantity}
                                getCategoryColor={getCategoryColor}
                                showTaxDetails={true}
                            />
                        ))}
                    </ScrollView>
                )}
            </View>

            <CartSummary
                cartTotal={cartTotal}
                cartItems={cartItems}
                selectedTable={selectedTable}
                customerName={customerName}
                setCustomerName={setCustomerName}
                paymentMethod={paymentMethod}
                setPaymentMethod={setPaymentMethod}
                onPayment={onPayment}
                onSendToKitchen={onSendToKitchen}
                onClearCart={onClearCart}
                onSplitTicket={onSplitTicket}
                isSendingToKitchen={isSendingToKitchen}
                getCartTotalWithTax={getCartTotalWithTax}
                getCartTaxBreakdown={getCartTaxBreakdown}
            />
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        backgroundColor: '#EFF6FF',
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
        marginLeft: 12,
    },
    tableBadge: {
        marginLeft: 12,
        backgroundColor: '#BFDBFE',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 16,
    },
    tableBadgeText: {
        fontSize: 12,
        color: '#1E40AF',
        fontWeight: '500',
    },
    successMessage: {
        marginHorizontal: 8,
        marginTop: 8,
        padding: 8,
        backgroundColor: '#ECFDF5',
        borderWidth: 1,
        borderColor: '#A7F3D0',
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
    },
    successText: {
        color: '#065F46',
        fontWeight: '500',
        fontSize: 12,
        marginLeft: 8,
    },
    errorMessage: {
        marginHorizontal: 8,
        marginTop: 8,
        padding: 8,
        backgroundColor: '#FEF2F2',
        borderWidth: 1,
        borderColor: '#FECACA',
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
    },
    errorText: {
        color: '#991B1B',
        fontWeight: '500',
        fontSize: 12,
        marginLeft: 8,
    },
    cartItemsContainer: {
        flex: 1,
        padding: 8,
    },
    emptyCart: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyCartTitle: {
        fontSize: 18,
        fontWeight: '500',
        color: '#6B7280',
        marginTop: 16,
        marginBottom: 8,
    },
    emptyCartSubtitle: {
        fontSize: 12,
        color: '#9CA3AF',
        textAlign: 'center',
    },
    cartItemsList: {
        flex: 1,
    },
})