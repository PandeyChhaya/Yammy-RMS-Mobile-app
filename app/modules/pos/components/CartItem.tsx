// cartItem.tsx
import { Minus, Plus, Trash2 } from 'lucide-react-native'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

const palette = {
  card: '#1A1A1A',
  cardAlt: '#2C2C2C',
  brand: '#FF6B2C',
  text: '#FFFFFF',
  textDim: '#9CA3AF',
  red: '#EF4444',
  redBg: '#450a0a',
}

const corner = { xs: 6, sm: 10, md: 14, lg: 18, pill: 100 }

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

function money(amount: number, symbol = 'NPR') {
  return `${symbol} ${amount.toFixed(2)}`
}

export default function CartItem(props: CartItemProps) {
  const { item, onRemove, onUpdateQuantity, getCategoryColor, symbol = 'NPR' } = props
  const showTaxDetails = props.showTaxDetails ?? false

  const dotColor = item.menu_item ? getCategoryColor(item.menu_item.category_id) : palette.cardAlt

  function decrement() {
    onUpdateQuantity(item.menu_item_id, item.quantity - 1)
  }

  function increment() {
    onUpdateQuantity(item.menu_item_id, item.quantity + 1)
  }

  return (
    <View style={styles.card}>
      <View style={styles.row1}>
        <View style={styles.nameCol}>
          <Text style={styles.name} numberOfLines={1}>
            {item.menu_item_name}
          </Text>

          {item.menu_item ? (
            <View style={styles.catRow}>
              <View style={[styles.catDot, { backgroundColor: dotColor }]} />
              <Text style={styles.catText} numberOfLines={1}>
                {item.menu_item.category_name}
              </Text>
            </View>
          ) : null}
        </View>

        <TouchableOpacity
          style={styles.removeBtn}
          onPress={() => onRemove(item.menu_item_id)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Trash2 size={14} color={palette.red} />
        </TouchableOpacity>
      </View>

      <View style={styles.row2}>
        <View style={styles.stepper}>
          <TouchableOpacity
            style={styles.stepBtn}
            onPress={decrement}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <Minus size={12} color={palette.text} />
          </TouchableOpacity>

          <View style={styles.qtyPill}>
            <Text style={styles.qtyPillText}>{item.quantity}</Text>
          </View>

          <TouchableOpacity
            style={styles.stepBtn}
            onPress={increment}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <Plus size={12} color={palette.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.priceCol}>
          <Text style={styles.unitPrice}>{money(item.unit_price, symbol)} each</Text>
          <Text style={styles.linePrice}>{money(item.total_price, symbol)}</Text>

          {showTaxDetails ? (
            <View style={styles.taxCol}>
              <Text style={styles.taxLine}>VAT +{money(item.tax_amount, symbol)}</Text>
              <Text style={styles.taxLineTotal}>Total {money(item.total_with_tax, symbol)}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.card,
    borderRadius: corner.md,
    borderWidth: 1.5,
    borderColor: palette.cardAlt,
    padding: 12,
    marginBottom: 10,
  },
  row1: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  nameCol: {
    flex: 1,
    marginRight: 8,
  },
  name: {
    fontSize: 14,
    fontWeight: '700',
    color: palette.text,
    marginBottom: 3,
  },
  catRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  catDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  catText: {
    fontSize: 11,
    color: palette.textDim,
  },
  removeBtn: {
    padding: 6,
    borderRadius: corner.xs,
    backgroundColor: palette.redBg,
    borderWidth: 1,
    borderColor: palette.red,
  },
  row2: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepBtn: {
    width: 26,
    height: 26,
    borderRadius: corner.xs,
    backgroundColor: palette.cardAlt,
    borderWidth: 1,
    borderColor: palette.cardAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyPill: {
    width: 32,
    height: 26,
    borderRadius: corner.xs,
    backgroundColor: palette.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyPillText: {
    fontSize: 13,
    fontWeight: '800',
    color: palette.text,
  },
  priceCol: {
    alignItems: 'flex-end',
  },
  unitPrice: {
    fontSize: 11,
    color: palette.textDim,
    marginBottom: 2,
  },
  linePrice: {
    fontSize: 14,
    fontWeight: '800',
    color: palette.brand,
  },
  taxCol: {
    marginTop: 4,
    alignItems: 'flex-end',
  },
  taxLine: {
    fontSize: 11,
    color: palette.textDim,
  },
  taxLineTotal: {
    fontSize: 12,
    fontWeight: '700',
    color: palette.text,
    marginTop: 2,
  },
})