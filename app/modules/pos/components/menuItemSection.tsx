import { Search, Star } from 'lucide-react-native'
import { useState } from 'react'
import {
  FlatList,
  ScrollView,
  StyleSheet,
  Text, TextInput, TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native'
import { MenuItemFilters } from '../../menu-items/services/menu-items-services'
import MenuItemCard, { MenuItemDisplay } from './menuItemCard'

const C = {
  background: '#0A0A0A',
  surface: '#1A1A1A',
  surfaceHighlight: '#2C2C2C',
  primary: '#FF6B2C',
  primaryDim: '#3D1C00',
  textMain: '#FFFFFF',
  textMuted: '#9CA3AF',
  border: '#2C2C2C',
  danger: '#EF4444',
  dangerDim: '#450A0A',
  success: '#10B981',
  successDim: '#064E3B',
  warning: '#F59E0B',
  info: '#3B82F6',
}
const radius = { xs: 6, sm: 10, md: 14, pill: 100 }

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

export default function MenuItemsSection({
  items,
  categories,
  filters,
  onItemSelect,
  getCategoryColor,
  symbol = 'NPR',
}: MenuItemsSectionProps) {
  const { width } = useWindowDimensions()
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const numColumns = Math.max(3, Math.floor(width / 100))
  const cardSize   = (width - 28 - (numColumns - 1) * 8) / numColumns

  const filtered = items.filter((item) => {
    const matchesSearch = item.menu_items_name
      .toLowerCase()
      .includes(filters.searchTerm.toLowerCase())
    const matchesCategory =
      selectedCategory === 'all' ||
      String(item.menu_items_category_id) === selectedCategory
    return matchesSearch && matchesCategory
  })

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId)
    filters.onCategoryChange(categoryId)
  }

  return (
    <View style={styles.container}>

      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Star size={15} color={C.primary} />
          <Text style={styles.headerTitle}>Menu</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{filtered.length}</Text>
          </View>
        </View>

        <View style={styles.searchRow}>
          <Search size={13} color={C.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search items..."
            placeholderTextColor={C.textMuted}
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
          style={[styles.tab, selectedCategory === 'all' && styles.tabActive]}
          onPress={() => handleCategorySelect('all')}
        >
          <View style={[styles.tabDot, { backgroundColor: C.textMuted }]} />
          <Text style={[styles.tabText, selectedCategory === 'all' && styles.tabTextActive]}>
            ⭐ All
          </Text>
        </TouchableOpacity>

        {categories.map((cat) => {
          const isActive = selectedCategory === String(cat.category_id)
          const color    = getCategoryColor(cat.category_id)
          return (
            <TouchableOpacity
              key={cat.category_id}
              style={[styles.tab, isActive && styles.tabActive]}
              onPress={() => handleCategorySelect(String(cat.category_id))}
            >
              <View style={[styles.tabDot, { backgroundColor: color }]} />
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                {cat.category_name}
              </Text>
            </TouchableOpacity>
          )
        })}
      </ScrollView>

      {filtered.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No items found</Text>
          <Text style={styles.emptySubtitle}>Try a different category or search term</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          key={numColumns}                         
          keyExtractor={(item) => String(item.menu_items_id)}
          numColumns={numColumns}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={numColumns > 1 ? styles.gridRow : undefined}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={{ width: cardSize, marginBottom: 8 }}>
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
    backgroundColor: C.background,
  },

  header: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    backgroundColor: C.surface,
    gap: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: C.textMain,
  },
  countBadge: {
    backgroundColor: C.primary,
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  countText: {
    fontSize: 11,
    fontWeight: '800',
    color: C.textMain,
  },

  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: C.background,
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: C.textMain,
    padding: 0,
  },

  tabsScroll: {
    flexGrow: 0,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    backgroundColor: C.surface,
  },
  tabsContent: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: C.background,
    borderWidth: 1.5,
    borderColor: C.border,
  },
  tabActive: {
    backgroundColor: C.primaryDim,
    borderColor: C.primary,
  },
  tabDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
    color: C.textMuted,
  },
  tabTextActive: {
    color: C.primary,
  },

  grid:    { padding: 14 },
  gridRow: { gap: 8 },

  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 60,
  },
  emptyTitle:    { fontSize: 15, fontWeight: '800', color: C.textMain },
  emptySubtitle: { fontSize: 12, color: C.textMuted },
})