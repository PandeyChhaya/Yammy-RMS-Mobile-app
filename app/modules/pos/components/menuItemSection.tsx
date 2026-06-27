// menuItemSection.tsx
import { Search, Star } from 'lucide-react-native'
import { useState } from 'react'
import {
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native'
import { MenuItemFilters } from '../../menu-items/services/menu-items-services'
import MenuItemCard, { MenuItemDisplay } from './menuItemCard'

const palette = {
  bg: '#0A0A0A',
  card: '#1A1A1A',
  brand: '#FF6B2C',
  brandBg: '#3D1C00',
  text: '#FFFFFF',
  textDim: '#9CA3AF',
  border: '#2C2C2C',
}

const corner = { xs: 6, sm: 10, md: 14, pill: 100 }
const MIN_COLUMNS = 3
const CARD_TARGET_WIDTH = 100
const GRID_GAP = 8
const GRID_PADDING = 28

interface Category {
  category_id: number
  category_name: string
}

interface MenuItemsSectionProps {
  items: MenuItemDisplay[]
  categories: Category[]
  filters: MenuItemFilters
  onItemSelect: (item: MenuItemDisplay) => void
  getCategoryColor: (categoryId: number) => string
  symbol?: string
}

export default function MenuItemsSection(props: MenuItemsSectionProps) {
  const { items, categories, filters, onItemSelect, getCategoryColor, symbol = 'NPR' } = props
  const { width } = useWindowDimensions()
  const [activeCategory, setActiveCategory] = useState<string>('all')

  const columns = Math.max(MIN_COLUMNS, Math.floor(width / CARD_TARGET_WIDTH))
  const cardWidth = (width - GRID_PADDING - (columns - 1) * GRID_GAP) / columns

  const visibleItems = items.filter((item) => {
    const term = filters.searchTerm.toLowerCase()
    const matchesSearch = item.menu_items_name.toLowerCase().includes(term)
    const matchesCategory =
      activeCategory === 'all' || String(item.menu_items_category_id) === activeCategory
    return matchesSearch && matchesCategory
  })

  function selectCategory(categoryId: string) {
    setActiveCategory(categoryId)
    filters.onCategoryChange(categoryId)
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Star size={14} color={palette.brand} />
          <Text style={styles.headerTitle}>Menu</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{visibleItems.length}</Text>
          </View>
        </View>

        <View style={styles.searchRow}>
          <Search size={13} color={palette.textDim} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search items..."
            placeholderTextColor={palette.textDim}
            value={filters.searchTerm}
            onChangeText={filters.onSearchChange}
          />
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabsScroll}
        contentContainerStyle={styles.tabsContent}
      >
        <TouchableOpacity
          style={[styles.tab, activeCategory === 'all' && styles.tabActive]}
          onPress={() => selectCategory('all')}
        >
          <View style={[styles.tabDot, { backgroundColor: palette.textDim }]} />
          <Text style={[styles.tabText, activeCategory === 'all' && styles.tabTextActive]}>
            All
          </Text>
        </TouchableOpacity>

        {categories.map((category) => {
          const isActive = activeCategory === String(category.category_id)
          const dotColor = getCategoryColor(category.category_id)
          return (
            <TouchableOpacity
              key={category.category_id}
              style={[styles.tab, isActive && styles.tabActive]}
              onPress={() => selectCategory(String(category.category_id))}
            >
              <View style={[styles.tabDot, { backgroundColor: dotColor }]} />
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                {category.category_name}
              </Text>
            </TouchableOpacity>
          )
        })}
      </ScrollView>

      {visibleItems.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No items found</Text>
          <Text style={styles.emptySubtitle}>Try a different category or search term</Text>
        </View>
      ) : (
        <FlatList
          data={visibleItems}
          key={columns}
          keyExtractor={(item) => String(item.menu_items_id)}
          numColumns={columns}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={columns > 1 ? styles.gridRow : undefined}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={{ width: cardWidth, marginBottom: 6 }}>
              <MenuItemCard
                item={item}
                onSelect={onItemSelect}
                getCategoryColor={getCategoryColor}
                symbol={symbol}
              />
            </View>
          )}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.bg,
  },
  header: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
    backgroundColor: palette.card,
    gap: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: palette.text,
  },
  countBadge: {
    backgroundColor: palette.brand,
    borderRadius: corner.pill,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  countText: {
    fontSize: 10,
    fontWeight: '800',
    color: palette.text,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: palette.bg,
    borderWidth: 1.5,
    borderColor: palette.border,
    borderRadius: corner.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: palette.text,
    padding: 0,
  },
  tabsScroll: {
    flexGrow: 0,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
    backgroundColor: palette.card,
  },
  tabsContent: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingVertical: 7,
    gap: 6,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: corner.pill,
    backgroundColor: palette.bg,
    borderWidth: 1.5,
    borderColor: palette.border,
  },
  tabActive: {
    backgroundColor: palette.brandBg,
    borderColor: palette.brand,
  },
  tabDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  tabText: {
    fontSize: 11,
    fontWeight: '700',
    color: palette.textDim,
  },
  tabTextActive: {
    color: palette.brand,
  },
  grid: {
    padding: 10,
  },
  gridRow: {
    gap: 6,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: palette.text,
  },
  emptySubtitle: {
    fontSize: 12,
    color: palette.textDim,
  },
})