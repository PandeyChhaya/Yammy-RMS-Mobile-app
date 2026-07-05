import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

const palette = {
  bg: '#0A0A0A',
  card: '#1A1A1A',
  brand: '#FF6B2C',
  text: '#FFFFFF',
  textDim: '#9CA3AF',
  border: '#2C2C2C',
  red: '#EF4444',
  redBg: '#450A0A',
  green: '#10B981',
  amber: '#F59E0B',
}

const corner = { xs: 6, sm: 10, md: 14, lg: 18, pill: 100 }

export interface MenuItemDisplay {
  menu_items_id: number
  menu_items_name: string
  slug: string
  price: number
  menu_items_category_id: number
  menu_items_description?: string
  image_url?: string
  is_available?: boolean
  stock_quantity?: number
  category_name?: string
}

interface MenuItemCardProps {
  item: MenuItemDisplay
  onSelect: (item: MenuItemDisplay) => void
  getCategoryColor: (categoryId: number) => string
  symbol?: string
}

function money(amount: number, symbol = 'NPR') {
  return `${symbol} ${Number(amount).toFixed(2)}`
}

function fontSizeFor(label: string): number {
  const length = label.length
  const isDevanagari = /[\u0900-\u097f]/.test(label)
  const isCjk = /[\u4e00-\u9fff]/.test(label)

  if (isDevanagari) {
    if (length <= 3) return 16
    if (length <= 5) return 14
    if (length <= 7) return 12
    return 11
  }

  if (isCjk) {
    if (length <= 2) return 16
    if (length <= 4) return 14
    if (length <= 6) return 12
    return 11
  }

  if (length <= 4) return 16
  if (length <= 6) return 14
  if (length <= 9) return 12
  return 11
}

export default function MenuItemCard(props: MenuItemCardProps) {
  const { item, onSelect, getCategoryColor, symbol = 'NPR' } = props

  const stock = item.stock_quantity ?? null
  const outOfStock = stock !== null && stock === 0
  const lowStock = stock !== null && stock > 0 && stock <= 5
  const available = item.is_available !== false
  const dotColor = getCategoryColor(item.menu_items_category_id)
  const nameSize = fontSizeFor(item.menu_items_name)
  const hasImage = !!item.image_url

  const disabled = !available || outOfStock

  return (
    <TouchableOpacity
      style={[
        styles.card,
        { borderColor: hasImage ? 'transparent' : palette.border },
        disabled && styles.cardDisabled,
      ]}
      onPress={() => onSelect(item)}
      disabled={disabled}
      activeOpacity={0.75}
    >
      {hasImage ? (
        <Image source={{ uri: item.image_url }} style={styles.bgImage} />
      ) : null}

      {hasImage ? <View style={styles.bgOverlay} /> : null}

      <View style={styles.priceTag}>
        <Text style={styles.priceTagText}>{money(item.price, symbol)}</Text>
      </View>

      {stock !== null ? (
        <View
          style={[
            styles.stockBadge,
            outOfStock ? styles.stockOut : lowStock ? styles.stockLow : styles.stockOk,
          ]}
        >
          <Text style={styles.stockBadgeText}>{stock}</Text>
        </View>
      ) : null}

      {!available ? (
        <View style={styles.unavailableTag}>
          <Text style={styles.unavailableTagText}>Unavailable</Text>
        </View>
      ) : null}

      <View style={styles.nameWrap}>
        <Text
          style={[styles.name, { fontSize: nameSize }]}
          numberOfLines={3}
          adjustsFontSizeToFit
          minimumFontScale={0.7}
        >
          {item.menu_items_name}
        </Text>
      </View>

      <View style={styles.dotWrap}>
        <View style={[styles.categoryDot, { backgroundColor: dotColor }]} />
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    aspectRatio: 1,
    backgroundColor: palette.card,
    borderRadius: corner.md,
    borderWidth: 1.5,
    padding: 10,
    paddingTop: 18,
    justifyContent: 'space-between',
    alignItems: 'center',
    overflow: 'hidden',
  },
  cardDisabled: {
    opacity: 0.5,
  },
  bgImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  bgOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.48)',
  },
  priceTag: {
    position: 'absolute',
    top: -1,
    right: -1,
    backgroundColor: palette.brand,
    borderBottomLeftRadius: corner.sm,
    borderTopRightRadius: corner.md,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  priceTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: palette.text,
  },
  stockBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    minWidth: 18,
    height: 18,
    borderRadius: corner.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  stockOk: { backgroundColor: palette.green },
  stockLow: { backgroundColor: palette.amber },
  stockOut: { backgroundColor: palette.red },
  stockBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: palette.text,
  },
  unavailableTag: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    right: 6,
    backgroundColor: palette.redBg,
    borderRadius: corner.xs,
    borderWidth: 1,
    borderColor: palette.red,
    paddingVertical: 2,
    alignItems: 'center',
  },
  unavailableTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: palette.red,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  nameWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  name: {
    fontWeight: '800',
    color: palette.text,
    textAlign: 'center',
    lineHeight: 18,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  dotWrap: {
    alignItems: 'center',
    marginTop: 6,
  },
  categoryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
  },
})