import { useTaxSettings } from '@/shared/hooks/useTaxSettings'
import { Minus, Plus, Trash2 } from 'lucide-react-native'
import React from 'react'
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native'
import { CartItemDisplay } from '../types'

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
  onDark:      '#FDF6EC',
}
const radius = { xs: 6, sm: 10, md: 14, lg: 18, pill: 100 }

interface ModernCartItemProps {
  item: CartItemDisplay
  onRemove: (itemId: string) => void
  onUpdateQuantity: (itemId: string, quantity: number) => void
  getCategoryColor: (categoryId: string) => string
  showTaxDetails?: boolean
}

export default function CartItem({
  item,
  onRemove,
  onUpdateQuantity,
  getCategoryColor,
  showTaxDetails = false
}: ModernCartItemProps) {
  
  const { formatAmount } = useTaxSettings()

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.titleContainer}>
          <Text style={styles.itemName} numberOfLines={1}>
            {item.menu_item_name}
          </Text>
          
          {item.menu_item && (
            <View style={styles.categoryBadge}>
              <View 
                style={[
                  styles.categoryDot, 
                  { backgroundColor: getCategoryColor(item.menu_item.category_id) }
                ]} 
              />
              <Text style={styles.categoryText} numberOfLines={1}>
                {item.menu_item.category_name}
              </Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => onRemove(item.menu_item_id)}
        >
          <Trash2 size={16} color={C.terracotta} />
        </TouchableOpacity>
      </View>

      <View style={styles.footerRow}>
        
        <View style={styles.quantityContainer}>
          <TouchableOpacity
            style={styles.qtyButton}
            onPress={() => onUpdateQuantity(item.menu_item_id, item.quantity - 1)}
          >
            <Minus size={14} color={C.espresso} />
          </TouchableOpacity>
          
          <View style={styles.qtyDisplay}>
            <Text style={styles.qtyText}>{item.quantity}</Text>
          </View>
          
          <TouchableOpacity
            style={styles.qtyButton}
            onPress={() => onUpdateQuantity(item.menu_item_id, item.quantity + 1)}
          >
            <Plus size={14} color={C.espresso} />
          </TouchableOpacity>
        </View>

        <View style={styles.priceContainer}>
          <Text style={styles.unitPrice}>
            {formatAmount(item.unit_price)} each
          </Text>
          <Text style={styles.totalPrice}>
            {formatAmount(item.total_price)}
          </Text>

          {showTaxDetails && item.menu_item && (
            <View style={styles.taxContainer}>
              <Text style={styles.taxText}>TVA: +{formatAmount(item.tax_amount)}</Text>
              <Text style={styles.totalWithTaxText}>
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
  card: {
    backgroundColor: C.parchment,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: C.vellum,
    padding: 12,
    marginBottom: 10,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleContainer: {
    flex: 1,
    marginRight: 12,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '700',
    color: C.espresso,
    marginBottom: 4,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  categoryDot: {
    width: 6,
    height: 6,
    borderRadius: radius.pill,
  },
  categoryText: {
    fontSize: 12,
    color: C.clay,
  },
  deleteButton: {
    padding: 6,
    backgroundColor: C.tcLight,
    borderWidth: 1,
    borderColor: C.tcBorder,
    borderRadius: radius.sm,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  qtyButton: {
    width: 28,
    height: 28,
    backgroundColor: C.brassLight,
    borderWidth: 1,
    borderColor: C.brassBorder,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyDisplay: {
    width: 32,
    height: 28,
    backgroundColor: C.sage,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: {
    fontWeight: '700',
    color: C.cream,
    fontSize: 14,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  unitPrice: {
    fontSize: 12,
    color: C.clay,
    marginBottom: 2,
  },
  totalPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: C.sage,
  },
  taxContainer: {
    marginTop: 4,
    alignItems: 'flex-end',
  },
  taxText: {
    fontSize: 11,
    color: C.clay,
  },
  totalWithTaxText: {
    fontSize: 12,
    fontWeight: '600',
    color: C.espresso,
    marginTop: 2,
  },
})