import AsyncStorage from '@react-native-async-storage/async-storage'
import { useEffect, useState } from 'react'
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { Category } from '../services/categoriesService'
import { CartItemDisplay } from '../types/cart'
import { ProductDisplay } from '../types/products'
import { TableData } from '../types/tables'
import CartSection from './CartSection'
import ProductsSection from './ProductsSection'
import SMSChatSection from './SMSChatSection'
import TablesSection from './TableSection'

interface POSLayoutProps {
    tables: TableData[]
    selectedTable: TableData | null
    onTableSelect: (table: TableData | null) => void
    cartItems: CartItemDisplay[]
    cartTotal: number
    customerName: string
    setCustomerName: (name: string) => void
    paymentMethod: string
    setPaymentMethod: (method: string) => void
    onRemove: (productId: string) => void
    onUpdateQuantity: (productId: string, quantity: number) => void
    onPayment: () => void
    onSendToKitchen: () => void
    onClearCart: () => void
    onSplitTicket: () => void
    isSendingToKitchen: boolean
    showSuccessMessage: string | null
    showErrorMessage: string | null
    getCartTax: () => number
    getCartTotalWithTax: () => number
    getCartTaxBreakdown: () => any[]
    getCategoryColor: (categoryId: string) => string
    products: ProductDisplay[]
    categories: Category[]
    searchTerm: string
    selectedCategory: string
    onSearchChange: (term: string) => void
    onCategoryChange: (categoryId: string) => void
    onProductSelect: (product: ProductDisplay) => void
    leftHandedMode: boolean
    currentOrder?: {
        id: string
        total: number
        items: Array<{
            name: string
            quantity: number
            price: number
        }>
    }
    onPaymentComplete?: () => void
    shouldGenerateTicket?: boolean
}

export default function POSLayout({
    tables,
    selectedTable,
    onTableSelect,
    cartItems,
    cartTotal,
    customerName,
    setCustomerName,
    paymentMethod,
    setPaymentMethod,
    onRemove,
    onUpdateQuantity,
    onPayment,
    onSendToKitchen,
    onClearCart,
    onSplitTicket,
    isSendingToKitchen,
    showSuccessMessage,
    showErrorMessage,
    getCartTax,
    getCartTotalWithTax,
    getCartTaxBreakdown,
    getCategoryColor,
    products,
    categories,
    searchTerm,
    selectedCategory,
    onSearchChange,
    onCategoryChange,
    onProductSelect,
    leftHandedMode,
    currentOrder,
    onPaymentComplete,
    shouldGenerateTicket = false
}: POSLayoutProps) {
    const productFilters = {
        searchTerm,
        selectedCategory,
        onSearchChange,
        onCategoryChange
    }

    const [showChat, setShowChat] = useState(true)
    const [showTables, setShowTables] = useState(true)

    useEffect(() => {
        const loadPreferences = async () => {
            const chatPref = await AsyncStorage.getItem('pos-show-chat')
            const tablesPref = await AsyncStorage.getItem('pos-show-tables')
            if (chatPref) setShowChat(JSON.parse(chatPref))
            if (tablesPref) setShowTables(JSON.parse(tablesPref))
        }
        loadPreferences()
    }, [])

    useEffect(() => {
        AsyncStorage.setItem('pos-show-chat', JSON.stringify(showChat))
    }, [showChat])

    useEffect(() => {
        AsyncStorage.setItem('pos-show-tables', JSON.stringify(showTables))
    }, [showTables])

    return (
        <View style={styles.container}>
            <View style={styles.toolbar}>
                <View style={styles.toolbarLeft}>
                    <Text style={styles.toolbarLabel}>Display:</Text>

                    <TouchableOpacity
                        onPress={() => setShowTables(!showTables)}
                        style={[
                            styles.toggleButton,
                            showTables ? styles.toggleButtonActive : styles.toggleButtonInactive
                        ]}
                    >
                        <Text style={[
                            styles.toggleButtonText,
                            showTables ? styles.toggleButtonTextActive : styles.toggleButtonTextInactive
                        ]}>
                            🏠 Tables
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => setShowChat(!showChat)}
                        style={[
                            styles.toggleButton,
                            showChat ? styles.toggleButtonActiveChat : styles.toggleButtonInactive
                        ]}
                    >
                        <Text style={[
                            styles.toggleButtonText,
                            showChat ? styles.toggleButtonTextActiveChat : styles.toggleButtonTextInactive
                        ]}>
                            💬 Chat
                        </Text>
                    </TouchableOpacity>
                </View>

                <Text style={styles.toolbarMode}>
                    Mode: {leftHandedMode ? 'Left-handed' : 'Right-handed'}
                </Text>
            </View>

            <View style={styles.mainContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.layoutContainer}>
                        {leftHandedMode ? (
                            <>
                                {showChat && (
                                    <View style={styles.section}>
                                        <SMSChatSection
                                            compact={false}
                                            selectedTable={selectedTable || undefined}
                                            currentOrder={currentOrder}
                                            onPaymentComplete={onPaymentComplete}
                                            shouldGenerateTicket={shouldGenerateTicket}
                                        />
                                    </View>
                                )}

                                <View style={styles.centerSection}>
                                    <View style={styles.productsSection}>
                                        <ProductsSection
                                            products={products}
                                            categories={categories}
                                            filters={productFilters}
                                            onProductSelect={onProductSelect}
                                            getCategoryColor={getCategoryColor}
                                            compact={false}
                                        />
                                    </View>

                                    {showTables && (
                                        <View style={styles.tablesSection}>
                                            <TablesSection
                                                tables={tables}
                                                selectedTable={selectedTable}
                                                onTableSelect={onTableSelect}
                                                compact={false}
                                            />
                                        </View>
                                    )}
                                </View>

                                <View style={styles.section}>
                                    <CartSection
                                        selectedTable={selectedTable}
                                        cartItems={cartItems}
                                        cartTotal={cartTotal}
                                        customerName={customerName}
                                        setCustomerName={setCustomerName}
                                        paymentMethod={paymentMethod}
                                        setPaymentMethod={setPaymentMethod}
                                        onRemove={onRemove}
                                        onUpdateQuantity={onUpdateQuantity}
                                        onPayment={onPayment}
                                        onSendToKitchen={onSendToKitchen}
                                        onClearCart={onClearCart}
                                        onSplitTicket={onSplitTicket}
                                        isSendingToKitchen={isSendingToKitchen}
                                        showSuccessMessage={showSuccessMessage}
                                        showErrorMessage={showErrorMessage}
                                        getCartTax={getCartTax}
                                        getCartTotalWithTax={getCartTotalWithTax}
                                        getCartTaxBreakdown={getCartTaxBreakdown}
                                        getCategoryColor={getCategoryColor}
                                        compact={false}
                                    />
                                </View>
                            </>
                        ) : (
                            <>
                                <View style={styles.section}>
                                    <CartSection
                                        selectedTable={selectedTable}
                                        cartItems={cartItems}
                                        cartTotal={cartTotal}
                                        customerName={customerName}
                                        setCustomerName={setCustomerName}
                                        paymentMethod={paymentMethod}
                                        setPaymentMethod={setPaymentMethod}
                                        onRemove={onRemove}
                                        onUpdateQuantity={onUpdateQuantity}
                                        onPayment={onPayment}
                                        onSendToKitchen={onSendToKitchen}
                                        onClearCart={onClearCart}
                                        onSplitTicket={onSplitTicket}
                                        isSendingToKitchen={isSendingToKitchen}
                                        showSuccessMessage={showSuccessMessage}
                                        showErrorMessage={showErrorMessage}
                                        getCartTax={getCartTax}
                                        getCartTotalWithTax={getCartTotalWithTax}
                                        getCartTaxBreakdown={getCartTaxBreakdown}
                                        getCategoryColor={getCategoryColor}
                                        compact={false}
                                    />
                                </View>

                                <View style={styles.centerSection}>
                                    <View style={styles.productsSection}>
                                        <ProductsSection
                                            products={products}
                                            categories={categories}
                                            filters={productFilters}
                                            onProductSelect={onProductSelect}
                                            getCategoryColor={getCategoryColor}
                                            compact={false}
                                        />
                                    </View>

                                    {showTables && (
                                        <View style={styles.tablesSection}>
                                            <TablesSection
                                                tables={tables}
                                                selectedTable={selectedTable}
                                                onTableSelect={onTableSelect}
                                                compact={false}
                                            />
                                        </View>
                                    )}
                                </View>

                                {showChat && (
                                    <View style={styles.section}>
                                        <SMSChatSection
                                            compact={false}
                                            selectedTable={selectedTable || undefined}
                                            currentOrder={currentOrder}
                                            onPaymentComplete={onPaymentComplete}
                                            shouldGenerateTicket={shouldGenerateTicket}
                                        />
                                    </View>
                                )}
                            </>
                        )}
                    </View>
                </ScrollView>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
        padding: 16,
    },
    toolbar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 12,
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 8,
        borderTopRightRadius: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    toolbarLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    toolbarLabel: {
        fontSize: 12,
        fontWeight: '500',
        color: '#374151',
    },
    toggleButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
        borderWidth: 1,
    },
    toggleButtonActive: {
        backgroundColor: '#DBEAFE',
        borderColor: '#BFDBFE',
    },
    toggleButtonActiveChat: {
        backgroundColor: '#F3E8FF',
        borderColor: '#E9D5FF',
    },
    toggleButtonInactive: {
        backgroundColor: '#F3F4F6',
        borderColor: '#E5E7EB',
    },
    toggleButtonText: {
        fontSize: 10,
        fontWeight: '500',
    },
    toggleButtonTextActive: {
        color: '#1E40AF',
    },
    toggleButtonTextActiveChat: {
        color: '#7C3AED',
    },
    toggleButtonTextInactive: {
        color: '#6B7280',
    },
    toolbarMode: {
        fontSize: 10,
        color: '#6B7280',
    },
    mainContainer: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderBottomLeftRadius: 8,
        borderBottomRightRadius: 8,
        borderWidth: 1,
        borderTopWidth: 0,
        borderColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 3,
        overflow: 'hidden',
    },
    layoutContainer: {
        flex: 1,
        flexDirection: 'row',
        minWidth: '100%',
    },
    section: {
        width: 300,
        borderRightWidth: 1,
        borderRightColor: '#E5E7EB',
    },
    centerSection: {
        flex: 1,
        minWidth: 400,
    },
    productsSection: {
        flex: 3,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    tablesSection: {
        flex: 1,
    },
})