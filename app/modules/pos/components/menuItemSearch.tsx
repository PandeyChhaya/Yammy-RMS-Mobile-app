import { Search } from 'lucide-react-native'
import {
  ScrollView, StyleSheet,
  Text, TextInput, TouchableOpacity,
  View,
} from 'react-native'
import { MenuItemFilters } from '../../menu-items/services/menu-items-services'

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
        <Search size={14} color={C.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search..."
          placeholderTextColor={C.textMuted}
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
    backgroundColor: C.surface,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },

  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.background,
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  searchIcon:  {},
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: C.textMain,
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
    backgroundColor: C.background,
    borderWidth: 1.5,
    borderColor: C.border,
  },
  pillActive: {
    backgroundColor: C.primaryDim,
    borderColor: C.primary,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '700',
    color: C.textMuted,
  },
  pillTextActive: {
    color: C.primary,
  },
})