import { Search } from 'lucide-react-native'
import {
    ScrollView, StyleSheet,
    Text, TextInput, TouchableOpacity,
    View,
} from 'react-native'
import { MenuItemFilters } from '../../menu-items/services/menu-items-services'

const C = {
  espresso:    '#1C1008',
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
}
const radius = { xs: 6, sm: 10, md: 14, pill: 100 }

interface Category {
  category_id: number
  category_name: string
}

interface MenuItemSearchProps {
  filters: MenuItemFilters
  categories: Category[]
}

export default function MenuItemSearch({
  filters,
  categories,
}: MenuItemSearchProps) {

  return (
    <View style={styles.container}>

      <View style={styles.searchRow}>
        <Search size={14} color={C.latte} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search..."
          placeholderTextColor={C.latte}
          value={filters.searchTerm}
          onChangeText={filters.onSearchChange}
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryScroll}
      >
        <TouchableOpacity
          style={[
            styles.pill,
            filters.selectedCategory === 'all' && styles.pillActive,
          ]}
          onPress={() => filters.onCategoryChange('all')}
        >
          <Text style={[
            styles.pillText,
            filters.selectedCategory === 'all' && styles.pillTextActive,
          ]}>
            All
          </Text>
        </TouchableOpacity>

        {categories.map((cat) => {
          const isActive = filters.selectedCategory === String(cat.category_id)
          return (
            <TouchableOpacity
              key={cat.category_id}
              style={[styles.pill, isActive && styles.pillActive]}
              onPress={() => filters.onCategoryChange(String(cat.category_id))}
            >
              <Text style={[styles.pillText, isActive && styles.pillTextActive]}>
                {cat.category_name}
              </Text>
            </TouchableOpacity>
          )
        })}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: C.parchment,
    borderBottomWidth: 1,
    borderBottomColor: C.vellum,
  },

  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.cream,
    borderWidth: 1.5,
    borderColor: C.vellum,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  searchIcon:  {},
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: C.espresso,
    padding: 0,
  },

  categoryScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 4,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: C.cream,
    borderWidth: 1.5,
    borderColor: C.vellum,
  },
  pillActive: {
    backgroundColor: C.sageLight,
    borderColor: C.sageBorder,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '700',
    color: C.clay,
  },
  pillTextActive: {
    color: C.sage,
  },
})
