import { Minus, Plus, Trash2 } from 'lucide-react-native'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useTaxSettings } from '../../../../shared/hooks/useTaxSettings'
import { CartItemDisplay } from '../types/cart'

interface CartItemProps {
    item: CartItemDisplay
    onRemove: (productId: string) => void
    onUpdateQuantity: (productId: string, quantity: number) => void
    getCategoryColor: (categoryId: string) => string
    showTaxDetails?: boolean
    compact?: boolean
}

export default function CartItem({
    item,
    onRemove,
    onUpdateQuantity,
    getCategoryColor,
    showTaxDetails = false,
    compact = false
}: CartItemProps) {
    const { formatAmount } = useTaxSettings()

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Text style={styles.productName}>
                        {item.product_name}
                    </Text>
                    {item.product && (
                        <View style={styles.categoryRow}>
                            <View
                                style={[
                                    styles.categoryDot,
                                    { backgroundColor: getCategoryColor(item.product.category_id) }
                                ]}
                            />
                            <Text style={styles.categoryName}>
                                {item.product.category_name}
                            </Text>
                        </View>
                    )}
                </View>
                <TouchableOpacity
                    onPress={() => onRemove(item.product_id)}
                    style={styles.deleteButton}
                >
                    <Trash2 size={12} color="#F87171" />
                </TouchableOpacity>
            </View>

            <View style={styles.footer}>
                <View style={styles.quantityControls}>
                    <TouchableOpacity
                        onPress={() => onUpdateQuantity(item.product_id, item.quantity - 1)}
                        style={styles.quantityButton}
                    >
                        <Minus size={12} color="#4B5563" />
                    </TouchableOpacity>
                    <Text style={[styles.quantityText, compact && styles.quantityTextCompact]}>
                        {item.quantity}
                    </Text>
                    <TouchableOpacity
                        onPress={() => onUpdateQuantity(item.product_id, item.quantity + 1)}
                        style={styles.quantityButton}
                    >
                        <Plus size={12} color="#4B5563" />
                    </TouchableOpacity>
                </View>

                <View style={styles.priceSection}>
                    <Text style={styles.unitPrice}>
                        {formatAmount(item.unit_price)}
                    </Text>
                    <Text style={[styles.totalPrice, compact && styles.totalPriceCompact]}>
                        {formatAmount(item.total_price)}
                    </Text>

                    {showTaxDetails && item.product && (
                        <View style={styles.taxDetails}>
                            <Text style={styles.taxText}>
                                TVA: +{formatAmount(item.tax_amount)}
                            </Text>
                            <Text style={styles.totalWithTax}>
                                Total: {formatAmount(item.total_with_tax)}
                            </Text>
                        </View>
                    )}
                </View>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#F9FAFB',
        borderRadius: 8,
        padding: 8,
        marginBottom: 8,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    headerLeft: {
        flex: 1,
    },
    productName: {
        fontSize: 12,
        fontWeight: '600',
        color: '#111827',
    },
    categoryRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2,
    },
    categoryDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginRight: 6,
    },
    categoryName: {
        fontSize: 10,
        color: '#4B5563',
    },
    deleteButton: {
        padding: 2,
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    quantityControls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    quantityButton: {
        padding: 4,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 8,
    },
    quantityText: {
        width: 32,
        textAlign: 'center',
        fontWeight: '700',
        fontSize: 18,
        color: '#111827',
    },
    quantityTextCompact: {
        fontSize: 16,
    },
    priceSection: {
        alignItems: 'flex-end',
    },
    unitPrice: {
        fontSize: 12,
        color: '#4B5563',
    },
    totalPrice: {
        fontSize: 18,
        fontWeight: '700',
        color: '#2563EB',
    },
    totalPriceCompact: {
        fontSize: 16,
    },
    taxDetails: {
        marginTop: 4,
    },
    taxText: {
        fontSize: 10,
        color: '#6B7280',
    },
    totalWithTax: {
        fontSize: 10,
        fontWeight: '500',
        color: '#374151',
    },
})