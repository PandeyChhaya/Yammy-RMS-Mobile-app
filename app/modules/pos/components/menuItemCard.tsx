import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'


const C = {
  espresso:    '#1C1008',
  clay:        '#7A4528',
  latte:       '#C8956A',
  cream:       '#FDF6EC',
  parchment:   '#F5E9D4',
  vellum:      '#EDD9BC',
  brass:       '#B5822A',
  sage:        '#3B6E52',
  sageLight:   '#EBF4EE',
  sageBorder:  '#9FCFB4',
  terracotta:  '#A03020',
  tcLight:     '#FAECEA',
  amber:       '#D97706',
  amberLight:  '#FEF3C7',
}
const radius = { xs: 6, sm: 10, md: 14, lg: 18, pill: 100 }

export interface MenuItemDisplay {
  menu_items_id:           number
  menu_items_name:         string
  slug:                    string
  price:                   number
  menu_items_category_id:  number
  menu_items_description?: string
  image_url?:              string   
  is_available?:           boolean
  stock_quantity?:         number
  category_name?:          string
}

interface MenuItemCardProps {
  item: MenuItemDisplay
  onSelect: (item: MenuItemDisplay) => void
  getCategoryColor: (categoryId: number) => string  
  symbol?: string
}

const fmt = (amount: number, symbol = 'NPR') =>
  `${symbol} ${Number(amount).toFixed(2)}`

const getAdaptiveFontSize = (text: string): number => {
  const len = text.length
  if (/[\u0900-\u097f]/.test(text)) {         
    if (len <= 3) return 16; if (len <= 5) return 14
    if (len <= 7) return 12; return 11
  }
  if (/[\u4e00-\u9fff]/.test(text)) {          
    if (len <= 2) return 16; if (len <= 4) return 14
    if (len <= 6) return 12; return 11
  }

  if (len <= 4) return 16; if (len <= 6) return 14
  if (len <= 9) return 12; return 11
}

export default function MenuItemCard({
  item,
  onSelect,
  getCategoryColor,
  symbol = 'NPR',
}: MenuItemCardProps) {
  const stock        = item.stock_quantity ?? null
  const isOutOfStock = stock !== null && stock === 0
  const isLowStock   = stock !== null && stock > 0 && stock <= 5
  const isAvailable  = item.is_available !== false
  const categoryColor = getCategoryColor(item.menu_items_category_id)
  const fontSize      = getAdaptiveFontSize(item.menu_items_name)

  return (
    <TouchableOpacity
      style={[
        styles.card,
        (!isAvailable || isOutOfStock) && styles.cardDisabled,
      ]}
      onPress={() => onSelect(item)}
      disabled={!isAvailable || isOutOfStock}
      activeOpacity={0.75}
    >
      <View style={styles.priceBadge}>
        <Text style={styles.priceText}>{fmt(item.price, symbol)}</Text>
      </View>

      {stock !== null && (
        <View style={[
          styles.stockDot,
          isOutOfStock ? styles.stockOut : isLowStock ? styles.stockLow : styles.stockOk,
        ]}>
          <Text style={styles.stockText}>{stock}</Text>
        </View>
      )}

      {!isAvailable && (
        <View style={styles.unavailableBadge}>
          <Text style={styles.unavailableText}>Unavailable</Text>
        </View>
      )}

      <View style={styles.nameContainer}>
        <Text
          style={[styles.itemName, { fontSize }]}
          numberOfLines={3}
          adjustsFontSizeToFit
          minimumFontScale={0.7}
        >
          {item.menu_items_name}
        </Text>
      </View>

      <View style={styles.categoryDotWrapper}>
        <View style={[styles.categoryDot, { backgroundColor: categoryColor }]} />
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    aspectRatio: 1, backgroundColor: C.parchment,
    borderRadius: radius.md, borderWidth: 1.5, borderColor: C.vellum,
    padding: 10, paddingTop: 18,
    justifyContent: 'space-between', alignItems: 'center', overflow: 'hidden',
  },
  cardDisabled: { opacity: 0.5 },

  priceBadge: {
    position: 'absolute', top: -1, right: -1,
    backgroundColor: C.sage,
    borderBottomLeftRadius: radius.sm, borderTopRightRadius: radius.md,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  priceText: { fontSize: 10, fontWeight: '800', color: C.cream },

  stockDot: {
    position: 'absolute', top: 4, left: 4,
    minWidth: 18, height: 18, borderRadius: radius.pill,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4,
  },
  stockOk:   { backgroundColor: C.sage },
  stockLow:  { backgroundColor: C.amber },
  stockOut:  { backgroundColor: C.terracotta },
  stockText: { fontSize: 9, fontWeight: '900', color: C.cream },

  unavailableBadge: {
    position: 'absolute', bottom: 6, left: 6, right: 6,
    backgroundColor: C.tcLight, borderRadius: radius.xs,
    borderWidth: 1, borderColor: C.terracotta,
    paddingVertical: 2, alignItems: 'center',
  },
  unavailableText: { fontSize: 9, fontWeight: '800', color: C.terracotta, textTransform: 'uppercase', letterSpacing: 0.8 },

  nameContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  itemName:      { fontWeight: '800', color: C.espresso, textAlign: 'center', lineHeight: 18 },

  categoryDotWrapper: { alignItems: 'center', marginTop: 6 },
  categoryDot:        { width: 8, height: 8, borderRadius: 4 },
})
