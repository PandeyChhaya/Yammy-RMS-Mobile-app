import { Search } from 'lucide-react-native'
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { Category } from '../services/categoriesService'
import { ProductFilters } from '../types/products'

interface ProductSearchProps {
  filters: ProductFilters
  categories: Category[]
}

export default function ProductSearch({
  filters,
  categories
}: ProductSearchProps) {
  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrapper}>
          <Search size={16} color="#9CA3AF" style={styles.searchIcon} />
          <TextInput
            placeholder="Search..."
            placeholderTextColor="#9CA3AF"
            value={filters.searchTerm}
            onChangeText={filters.onSearchChange}
            style={styles.searchInput}
          />
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesScroll}
      >
        <TouchableOpacity
          onPress={() => filters.onCategoryChange('all')}
          style={[
            styles.categoryButton,
            filters.selectedCategory === 'all' && styles.categoryButtonSelected
          ]}
        >
          <Text style={[
            styles.categoryButtonText,
            filters.selectedCategory === 'all' && styles.categoryButtonTextSelected
          ]}>
            All categories
          </Text>
        </TouchableOpacity>

        {categories.map(category => (
          <TouchableOpacity
            key={category.id}
            onPress={() => filters.onCategoryChange(category.id)}
            style={[
              styles.categoryButton,
              filters.selectedCategory === category.id && styles.categoryButtonSelected
            ]}
          >
            <Text style={[
              styles.categoryButtonText,
              filters.selectedCategory === category.id && styles.categoryButtonTextSelected
            ]}>
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  searchContainer: {
    flex: 1,
  },
  searchInputWrapper: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchIcon: {
    position: 'absolute',
    left: 8,
    zIndex: 1,
  },
  searchInput: {
    flex: 1,
    paddingLeft: 32,
    paddingRight: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    fontSize: 12,
    backgroundColor: '#FFFFFF',
  },
  categoriesScroll: {
    gap: 8,
    paddingRight: 8,
  },
  categoryButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  categoryButtonSelected: {
    backgroundColor: '#DBEAFE',
    borderColor: '#2563EB',
  },
  categoryButtonText: {
    fontSize: 12,
    color: '#374151',
  },
  categoryButtonTextSelected: {
    color: '#2563EB',
    fontWeight: '600',
  },
})