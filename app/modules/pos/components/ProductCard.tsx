import React from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useTaxSettings } from '../../../shared/hooks/useTaxSettings'
import { ProductDisplay } from '../types'

interface ModernProductCardProps {
    product: ProductDisplay
    onSelect: (product: ProductDisplay) => void
    getCategoryColor: (categoryId: string) => string
}

export default function ModernProductCard({
    product,
    onSelect,
    getCategoryColor
}: ModernProductCardProps) {
    const { formatAmount } = useTaxSettings()

    const isLowStock = product.stock_quantity <= 5
    const isOutOfStock = product.stock_quantity === 0

    const detectScriptType = (text: string): 'latin' | 'chinese' | 'hindi' | 'arabic' | 'mixed' => {
        const chineseRegex = /[\u4e00-\u9fff\u3400-\u4dbf\u20000-\u2a6df\u2a700-\u2b73f\u2b740-\u2b81f\u2b820-\u2ceaf\uf900-\ufaff\u3300-\u33ff\u2e80-\u2eff\u2f00-\u2fdf\u31c0-\u31ef\u3200-\u32ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\u3300-\u33ff]/
        const hindiRegex = /[\u0900-\u097f\u1cd0-\u1cff\u200c\u200d\u20f0]/
        const arabicRegex = /[\u0600-\u06ff\u0750-\u077f\u08a0-\u08ff\ufb50-\ufdff\ufe70-\ufeff]/

        const hasChinese = chineseRegex.test(text)
        const hasHindi = hindiRegex.test(text)
        const hasArabic = arabicRegex.test(text)

        if (hasChinese && !hasHindi && !hasArabic) return 'chinese'
        if (hasHindi && !hasChinese && !hasArabic) return 'hindi'
        if (hasArabic && !hasChinese && !hasHindi) return 'arabic'
        if (hasChinese || hasHindi || hasArabic) return 'mixed'
        return 'latin'
    }

    const getAdaptiveFontSize = (text: string): number => {
        const length = text.length
        const scriptType = detectScriptType(text)

        if (scriptType === 'chinese') {
            if (length <= 2) return 18
            if (length <= 4) return 16
            if (length <= 6) return 14
            return 12
        }

        if (scriptType === 'hindi') {
            if (length <= 3) return 18
            if (length <= 5) return 16
            if (length <= 7) return 14
            return 12
        }

        if (scriptType === 'arabic') {
            if (length <= 5) return 18
            if (length <= 8) return 16
            if (length <= 12) return 14
            return 12
        }

        if (scriptType === 'mixed') {
            if (length <= 4) return 16
            if (length <= 6) return 14
            return 12
        }

        if (length <= 4) return 18
        if (length <= 6) return 16
        if (length <= 8) return 14
        return 12
    }

    const getAdaptiveLineClamp = (text: string): number => {
        const length = text.length
        const scriptType = detectScriptType(text)

        if (scriptType === 'chinese' || scriptType === 'hindi') {
            if (length <= 4) return 1
            if (length <= 8) return 2
            return 3
        }

        if (scriptType === 'arabic') {
            if (length <= 6) return 1
            if (length <= 12) return 2
            return 3
        }

        if (scriptType === 'mixed') {
            if (length <= 4) return 1
            if (length <= 12) return 2
            return 3
        }

        if (length <= 6) return 1
        if (length <= 20) return 2
        return 3
    }

    return (
        <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => onSelect(product)}
            style={[
                styles.card,
                { opacity: isOutOfStock ? 0.7 : 1 }
            ]}
        >
            {/* Price Tag */}
            <View style={styles.priceTag}>
                <Text style={styles.priceText}>{formatAmount(product.price)}</Text>
            </View>

            {/* Stock Indicator */}
            <View style={styles.stockBadgeContainer}>
                <View style={[
                    styles.stockBadge,
                    {
                        backgroundColor: isOutOfStock
                            ? '#ef4444'
                            : isLowStock
                                ? '#f97316'
                                : '#10b981'
                    }
                ]}>
                    <Text style={styles.stockText}>{product.stock_quantity}</Text>
                </View>
            </View>

            {/* Main Content */}
            <View style={styles.content}>
                <View style={styles.nameContainer}>
                    <Text
                        numberOfLines={getAdaptiveLineClamp(product.name)}
                        style={[
                            styles.productName,
                            { fontSize: getAdaptiveFontSize(product.name) }
                        ]}
                    >
                        {product.name}
                    </Text>
                </View>

                {/* Category Indicator */}
                <View style={styles.footer}>
                    <View
                        style={[
                            styles.categoryDot,
                            { backgroundColor: getCategoryColor(product.category_id) }
                        ]}
                    />
                </View>
            </View>
        </TouchableOpacity>
    )
}

const styles = StyleSheet.create({
    card: {
        aspectRatio: 1,
        minHeight: 90,
        backgroundColor: '#334155', // slate-700
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#475569', // slate-600
        position: 'relative',
        shadowColor: '#10b981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    priceTag: {
        position: 'absolute',
        top: -4,
        right: -4,
        zIndex: 10,
        backgroundColor: '#10b981',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 100,
        borderWidth: 2,
        borderColor: '#1e293b', // slate-800
    },
    priceText: {
        color: '#ffffff',
        fontSize: 10,
        fontWeight: '600',
    },
    stockBadgeContainer: {
        position: 'absolute',
        top: 4,
        left: 4,
        zIndex: 10,
    },
    stockBadge: {
        width: 14,
        height: 14,
        borderRadius: 7,
        alignItems: 'center',
        justifyContent: 'center',
    },
    stockText: {
        color: '#ffffff',
        fontSize: 8,
        fontWeight: 'bold',
    },
    content: {
        flex: 1,
        padding: 6,
        paddingTop: 12,
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    nameContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 2,
    },
    productName: {
        color: '#ffffff',
        fontWeight: 'bold',
        textAlign: 'center',
        lineHeight: 18,
    },
    footer: {
        marginTop: 4,
        alignItems: 'center',
    },
    categoryDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    }
})