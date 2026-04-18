import { Minus, Plus, Trash2 } from 'lucide-react-native'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

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


interface CartItemDisplayProps {
  menu_item_id: string
  menu_item_name: string
  quantity: number
  unit_price: number
  total_price: number
  menu_item?: {
    id: string
    name: string
    category_id: number
    category_name: string
    price: number
  }
  tax_amount: number
  total_with_tax: number
}

interface CartItemProps {
  item: CartItemDisplayProps
  onRemove: (menuItemId: string) => void
  onUpdateQuantity: (menuItemId: string, quantity: number) => void
  getCategoryColor: (categoryId: number) => string
  showTaxDetails?: boolean
  symbol?: string   
}

const fmt = (amount: number, symbol = 'NPR') =>
  `${symbol} ${amount.toFixed(2)}`

export default function CartItem({
  item,
  onRemove,
  onUpdateQuantity,
  getCategoryColor,
  showTaxDetails = false,
  symbol = 'NPR',
}: CartItemProps) {

  const categoryColor = item.menu_item
    ? getCategoryColor(item.menu_item.category_id)
    : C.latte

  return (
    <View style={styles.card}>

      <View style={styles.topRow}>
        <View style={styles.nameBlock}>
          <Text style={styles.itemName} numberOfLines={1}>
            {item.menu_item_name}
          </Text>

          {item.menu_item && (
            <View style={styles.categoryRow}>
              <View style={[styles.categoryDot, { backgroundColor: categoryColor }]} />
              <Text style={styles.categoryText} numberOfLines={1}>
                {item.menu_item.category_name}
              </Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => onRemove(item.menu_item_id)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Trash2 size={13} color={C.terracotta} />
        </TouchableOpacity>
      </View>

      <View style={styles.bottomRow}>

        <View style={styles.qtyRow}>
          <TouchableOpacity
            style={styles.qtyButton}
            onPress={() => onUpdateQuantity(item.menu_item_id, item.quantity - 1)}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <Minus size={10} color={C.clay} />
          </TouchableOpacity>

          <View style={styles.qtyBadge}>
            <Text style={styles.qtyText}>{item.quantity}</Text>
          </View>

          <TouchableOpacity
            style={styles.qtyButton}
            onPress={() => onUpdateQuantity(item.menu_item_id, item.quantity + 1)}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <Plus size={10} color={C.clay} />
          </TouchableOpacity>
        </View>

        <View style={styles.priceBlock}>
          <Text style={styles.unitPrice}>
            {fmt(item.unit_price, symbol)} each
          </Text>
          <Text style={styles.totalPrice}>
            {fmt(item.total_price, symbol)}
          </Text>

          {showTaxDetails && (
            <View style={styles.taxBlock}>
              <Text style={styles.taxLine}>
                VAT: +{fmt(item.tax_amount, symbol)}
              </Text>
              <Text style={styles.taxTotal}>
                Total: {fmt(item.total_with_tax, symbol)}
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

  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  nameBlock: {
    flex: 1,
    marginRight: 8,
  },
  itemName: {
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
  categoryText: {
    fontSize: 11,
    color: C.clay,
  },
  deleteButton: {
    padding: 5,
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
    backgroundColor: C.cream,
    borderWidth: 1,
    borderColor: C.vellum,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBadge: {
    width: 28,
    height: 24,
    borderRadius: radius.xs,
    backgroundColor: C.sage,
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
    fontSize: 10,
    color: C.clay,
    marginBottom: 2,
  },
  totalPrice: {
    fontSize: 13,
    fontWeight: '800',
    color: C.brass,
  },

  taxBlock: {
    marginTop: 4,
    alignItems: 'flex-end',
  },
  taxLine: {
    fontSize: 10,
    color: C.clay,
  },
  taxTotal: {
    fontSize: 11,
    fontWeight: '700',
    color: C.espresso,
    marginTop: 1,
  },
})
