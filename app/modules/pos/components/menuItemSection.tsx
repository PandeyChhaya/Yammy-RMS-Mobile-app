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
          <Star size={15} color={C.brass} />
          <Text style={styles.headerTitle}>Menu</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{filtered.length}</Text>
          </View>
        </View>

        <View style={styles.searchRow}>
          <Search size={13} color={C.latte} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search items..."
            placeholderTextColor={C.latte}
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
          <View style={[styles.tabDot, { backgroundColor: C.latte }]} />
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
    backgroundColor: C.cream,
  },

  header: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: C.vellum,
    backgroundColor: C.parchment,
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
    color: C.espresso,
  },
  countBadge: {
    backgroundColor: C.sage,
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  countText: {
    fontSize: 11,
    fontWeight: '800',
    color: C.cream,
  },

  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: C.cream,
    borderWidth: 1.5,
    borderColor: C.vellum,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: C.espresso,
    padding: 0,
  },

  tabsScroll: {
    flexGrow: 0,
    borderBottomWidth: 1,
    borderBottomColor: C.vellum,
    backgroundColor: C.parchment,
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
    backgroundColor: C.cream,
    borderWidth: 1.5,
    borderColor: C.vellum,
  },
  tabActive: {
    backgroundColor: C.sageLight,
    borderColor: C.sageBorder,
  },
  tabDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
    color: C.clay,
  },
  tabTextActive: {
    color: C.sage,
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
  emptyTitle:    { fontSize: 15, fontWeight: '800', color: C.espresso },
  emptySubtitle: { fontSize: 12, color: C.clay },
})
