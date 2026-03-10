import { FlatList, StyleSheet, View } from 'react-native'
import { Category } from '../services/categoriesService'
import { ProductDisplay, ProductFilters } from '../types/products'
import ProductCard from './ProductCard'
import ProductSearch from './ProductSearch'

interface ProductsSectionProps {
    products: ProductDisplay[]
    categories: Category[]
    filters: ProductFilters
    onProductSelect: (product: ProductDisplay) => void
    getCategoryColor: (categoryId: string) => string
    compact?: boolean
}

export default function ProductsSection({
    products,
    categories,
    filters,
    onProductSelect,
    getCategoryColor,
}: ProductsSectionProps) {
    const renderProduct = ({ item }: { item: ProductDisplay }) => (
        <View style={styles.productCard}>
            <ProductCard
                product={item}
                onSelect={onProductSelect}
                getCategoryColor={getCategoryColor}
            />
        </View>
    )

    const renderHeader = () => (
        <View style={styles.searchContainer}>
            <ProductSearch
                filters={filters}
                categories={categories}
            />
        </View>
    )

    return (
        <View style={styles.container}>
            <FlatList
                data={products}
                renderItem={renderProduct}
                keyExtractor={(item) => item.id}
                numColumns={3}
                ListHeaderComponent={renderHeader}
                stickyHeaderIndices={[0]}
                columnWrapperStyle={styles.columnWrapper}
                contentContainerStyle={styles.contentContainer}
                showsVerticalScrollIndicator={false}
            />
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        padding: 12,
    },
    searchContainer: {
        backgroundColor: '#FFFFFF',
        paddingBottom: 8,
        marginBottom: 6,
    },
    contentContainer: {
        paddingBottom: 12,
    },
    columnWrapper: {
        gap: 12,
        marginBottom: 12,
    },
    productCard: {
        flex: 1,
    },
})