import { Coffee, Utensils, Wine } from 'lucide-react-native'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useTaxSettings } from '../../../../shared/hooks/useTaxSettings'
import { ProductDisplay } from '../types/products'

interface ProductCardProps {
  product: ProductDisplay
  onSelect: (product: ProductDisplay) => void
  getCategoryColor: (categoryId: string) => string
}

export default function ProductCard({
  product,
  onSelect,
  getCategoryColor
}: ProductCardProps) {
  const { formatAmount, calculateTax } = useTaxSettings()

 
  if (!product) return null

  const getCategoryIcon = (categoryName: string) => {
    const name = categoryName?.toLowerCase() || ''
    if (name.includes('boisson') || name.includes('drink')) return Wine
    if (name.includes('plat') || name.includes('main')) return Utensils
    return Coffee
  }

  const CategoryIcon = getCategoryIcon(product.category_name || '')
  const productTaxAmount = product.tax_amount || calculateTax(product.price || 0, product.category_id)

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onSelect(product)}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <CategoryIcon size={20} color="#2563EB" />
        </View>

        <Text style={styles.productName} numberOfLines={2}>
          {product.name || 'Unknown Product'}
        </Text>

        <View style={styles.categoryContainer}>
          <View style={styles.categoryRow}>
            <View
              style={[
                styles.categoryDot,
                { backgroundColor: getCategoryColor(product.category_id || '') }
              ]}
            />
            <Text style={styles.categoryText}>
              {product.category_name || 'Uncategorized'}
            </Text>
          </View>
        </View>

        <View style={styles.priceContainer}>
          <Text style={styles.price}>
            {formatAmount(product.price || 0)}
          </Text>
          {product.tax_rate && (
            <Text style={styles.taxText}>
              +{formatAmount(productTaxAmount || 0)} TVA
            </Text>
          )}
        </View>

        <View style={styles.stockBadge}>
          <Text style={styles.stockText}>
            Stock: {product.stock_quantity || 0}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  content: {
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 8,
  },
  productName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
    lineHeight: 16,
  },
  categoryContainer: {
    marginBottom: 8,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  categoryText: {
    fontSize: 10,
    color: '#4B5563',
  },
  priceContainer: {
    marginBottom: 8,
    alignItems: 'center',
  },
  price: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
  },
  taxText: {
    fontSize: 10,
    color: '#6B7280',
  },
  stockBadge: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  stockText: {
    fontSize: 10,
    color: '#6B7280',
  },
})