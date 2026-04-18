import { Minus, Plus, Trash2 } from 'lucide-react-native'
import React from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
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
  terracotta:  '#A03020',
  tcLight:     '#FAECEA',
  tcBorder:    '#E8A898',
}

const radius = { xs: 6, sm: 10, md: 14, pill: 100 }

interface ModernCartItemProps {
  item:                CartItemDisplay
  onRemove:            (productId: string) => void
  onUpdateQuantity:    (productId: string, quantity: number) => void
  getCategoryColor:    (categoryId: string) => string
}

export default function ModernCartItem({
  item,
  onRemove,
  onUpdateQuantity,
  getCategoryColor,
}: ModernCartItemProps) {
  return (
    <View style={styles.card}>

      {/* Top row — name + delete */}
      <View style={styles.topRow}>
        <View style={styles.nameBlock}>
          <Text style={styles.productName} numberOfLines={1}>
            {item.product_name}
          </Text>
          {item.product && (
            <View style={styles.categoryRow}>
              <View style={[
                styles.categoryDot,
                { backgroundColor: getCategoryColor(item.product.category_id) },
              ]} />
              <Text style={styles.categoryName} numberOfLines={1}>
                {item.product.category_name}
              </Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => onRemove(item.product_id)}
        >
          <Trash2 size={13} color={C.terracotta} />
        </TouchableOpacity>
      </View>

      {/* Bottom row — qty controls + price */}
      <View style={styles.bottomRow}>

        {/* Quantity controls */}
        <View style={styles.qtyRow}>
          <TouchableOpacity
            style={styles.qtyButton}
            onPress={() => onUpdateQuantity(item.product_id, item.quantity - 1)}
          >
            <Minus size={10} color={C.clay} />
          </TouchableOpacity>

          <View style={styles.qtyBadge}>
            <Text style={styles.qtyText}>{item.quantity}</Text>
          </View>

          <TouchableOpacity
            style={styles.qtyButton}
            onPress={() => onUpdateQuantity(item.product_id, item.quantity + 1)}
          >
            <Plus size={10} color={C.clay} />
          </TouchableOpacity>
        </View>

        {/* Price */}
        <View style={styles.priceBlock}>
          <Text style={styles.unitPrice}>
            {item.unit_price} each
          </Text>
          <Text style={styles.totalPrice}>
            {item.total_price}
          </Text>
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
    padding: 10,
    marginBottom: 8,
    shadowColor: C.espresso,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  nameBlock: {
    flex: 1,
    marginRight: 8,
  },
  productName: {
    fontSize: 13,
    fontWeight: '700',
    color: C.espresso,
    marginBottom: 3,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  categoryDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  categoryName: {
    fontSize: 11,
    color: C.clay,
    fontWeight: '500',
  },
  deleteButton: {
    padding: 6,
    borderRadius: radius.xs,
    backgroundColor: C.tcLight,
    borderWidth: 1,
    borderColor: C.tcBorder,
  },

  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  qtyButton: {
    width: 24,
    height: 24,
    borderRadius: radius.xs,
    backgroundColor: C.brassLight,
    borderWidth: 1,
    borderColor: C.brassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBadge: {
    width: 28,
    height: 24,
    borderRadius: radius.xs,
    backgroundColor: C.brass,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: {
    fontSize: 12,
    fontWeight: '800',
    color: C.cream,
  },

  priceBlock: {
    alignItems: 'flex-end',
  },
  unitPrice: {
    fontSize: 11,
    color: C.clay,
    marginBottom: 2,
  },
  totalPrice: {
    fontSize: 13,
    fontWeight: '800',
    color: C.brass,
  },
})