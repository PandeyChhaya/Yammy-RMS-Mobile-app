import { Maximize2, Minimize2 } from 'lucide-react-native'
import React, { useEffect, useState } from 'react'
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Category } from '../services/categoriesService'
import { CartItemDisplay, ProductDisplay, TableData } from '../types'
import ModernCartSection from './ModernCartSection'
import ModernProductsSection from './ModernProductsSection'
import ModernSMSChatSection from './ModernSMSChatSection'
import ModernTablesSection from './ModernTablesSection'

const C = {
  espresso:    '#1C1008',
  clay:        '#7A4528',
  cream:       '#FDF6EC',
  parchment:   '#F5E9D4',
  vellum:      '#EDD9BC',
  brass:       '#B5822A',
  brassLight:  '#F7EDD8',
  brassBorder: '#DEC07A',
  sage:        '#3B6E52',
  sageLight:   '#EBF4EE',
  sageBorder:  '#9FCFB4',
  violet:      '#6D3FA0',
  violetLight: '#F3EDFB',
}

const radius = { xs: 6, sm: 10, md: 14, pill: 100 }

interface ModernPOSLayoutProps {
  tables:              TableData[]
  selectedTable:       TableData | null
  onTableSelect:       (table: TableData | null) => void
  cartItems:           CartItemDisplay[]
  cartTotal:           number
  customerName:        string
  setCustomerName:     (name: string) => void
  paymentMethod:       string
  setPaymentMethod:    (method: string) => void
  onRemove:            (productId: string) => void
  onUpdateQuantity:    (productId: string, quantity: number) => void
  onPayment:           () => void
  onSendToKitchen:     () => void
  onClearCart:         () => void
  onSplitTicket:       () => void
  isSendingToKitchen:  boolean
  showSuccessMessage:  string | null
  showErrorMessage:    string | null
  getCartTotalWithTax: () => number
  getCategoryColor:    (categoryId: string) => string
  products:            ProductDisplay[]
  categories:          Category[]
  searchTerm:          string
  selectedCategory:    string
  onSearchChange:      (term: string) => void
  onCategoryChange:    (categoryId: string) => void
  onProductSelect:     (product: ProductDisplay) => void
  leftHandedMode:      boolean
  isFullscreen?:       boolean
  onToggleFullscreen?: () => void
  currentOrder?: {
    id:    string
    total: number
    items: Array<{ name: string; quantity: number; price: number }>
  }
  shouldGenerateTicket?: boolean
}

export default function ModernPOSLayout({
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
  getCartTotalWithTax,
  getCategoryColor,
  products,
  categories,
  searchTerm,
  selectedCategory,
  onSearchChange,
  onCategoryChange,
  onProductSelect,
  leftHandedMode,
  isFullscreen = false,
  onToggleFullscreen,
  currentOrder,
  shouldGenerateTicket = false,
}: ModernPOSLayoutProps) {
  const [showChat,   setShowChat]   = useState(true)
  const [showTables, setShowTables] = useState(true)
  const [activeTab,  setActiveTab]  = useState<'products' | 'cart' | 'chat'>('products')

  // Persist preferences
  useEffect(() => {
    AsyncStorage.getItem('pos-show-chat').then(v => v !== null && setShowChat(JSON.parse(v)))
    AsyncStorage.getItem('pos-show-tables').then(v => v !== null && setShowTables(JSON.parse(v)))
  }, [])

  useEffect(() => { AsyncStorage.setItem('pos-show-chat',   JSON.stringify(showChat))   }, [showChat])
  useEffect(() => { AsyncStorage.setItem('pos-show-tables', JSON.stringify(showTables)) }, [showTables])

  const productFilters = { searchTerm, selectedCategory, onSearchChange, onCategoryChange }

  const cartSection = (
    <ModernCartSection
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
      getCartTotalWithTax={getCartTotalWithTax}
      getCategoryColor={getCategoryColor}
    />
  )

  const productsSection = (
    <View style={{ flex: 1 }}>
      <ModernProductsSection
        products={products}
        categories={categories}
        filters={productFilters}
        onProductSelect={onProductSelect}
        getCategoryColor={getCategoryColor}
      />
      {showTables && (
        <ModernTablesSection
          tables={tables}
          selectedTable={selectedTable}
          onTableSelect={onTableSelect}
        />
      )}
    </View>
  )

  const chatSection = showChat ? (
    <ModernSMSChatSection
      selectedTable={selectedTable}
      currentOrder={currentOrder}
      shouldGenerateTicket={shouldGenerateTicket}
    />
  ) : null

  return (
    <View style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>Z</Text>
          </View>
          <Text style={styles.appName}>Zikiro POS</Text>
        </View>

        <View style={styles.headerControls}>
          <TouchableOpacity
            style={[styles.toggleBtn, showTables && styles.toggleBtnActive]}
            onPress={() => setShowTables(p => !p)}
          >
            <Text style={styles.toggleBtnIcon}>🏠</Text>
            <Text style={[styles.toggleBtnText, showTables && styles.toggleBtnTextActive]}>
              Tables
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toggleBtn, styles.toggleBtnChat, showChat && styles.toggleBtnChatActive]}
            onPress={() => setShowChat(p => !p)}
          >
            <Text style={styles.toggleBtnIcon}>💬</Text>
            <Text style={[styles.toggleBtnText, showChat && styles.toggleBtnTextActive]}>
              SMS
            </Text>
          </TouchableOpacity>

          {onToggleFullscreen && (
            <TouchableOpacity style={styles.toggleBtn} onPress={onToggleFullscreen}>
              {isFullscreen
                ? <Minimize2 size={14} color={C.clay} />
                : <Maximize2 size={14} color={C.clay} />
              }
            </TouchableOpacity>
          )}
        </View>

        {selectedTable && (
          <View style={styles.tableIndicator}>
            <Text style={styles.tableIndicatorText}>Table {selectedTable.number}</Text>
          </View>
        )}
      </View>

      {/* Tab Bar — mobile-friendly navigation */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'products' && styles.tabActive]}
          onPress={() => setActiveTab('products')}
        >
          <Text style={[styles.tabText, activeTab === 'products' && styles.tabTextActive]}>
            Products
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'cart' && styles.tabActive]}
          onPress={() => setActiveTab('cart')}
        >
          <Text style={[styles.tabText, activeTab === 'cart' && styles.tabTextActive]}>
            Cart {cartItems.length > 0 ? `(${cartItems.length})` : ''}
          </Text>
        </TouchableOpacity>

        {showChat && (
          <TouchableOpacity
            style={[styles.tab, styles.tabChat, activeTab === 'chat' && styles.tabChatActive]}
            onPress={() => setActiveTab('chat')}
          >
            <Text style={[styles.tabText, activeTab === 'chat' && styles.tabTextActive]}>
              SMS
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        {activeTab === 'products' && productsSection}
        {activeTab === 'cart'     && cartSection}
        {activeTab === 'chat'     && chatSection}
      </View>

      {/* Bottom border */}
      <View style={styles.bottomBorder} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.cream,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: C.parchment,
    borderBottomWidth: 1.5,
    borderBottomColor: C.vellum,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logo: {
    width: 32, height: 32,
    borderRadius: radius.sm,
    backgroundColor: C.sage,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    color: C.cream,
    fontWeight: '900',
    fontSize: 16,
  },
  appName: {
    fontSize: 16,
    fontWeight: '800',
    color: C.espresso,
  },
  headerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: C.vellum,
    backgroundColor: C.cream,
  },
  toggleBtnActive: {
    backgroundColor: C.sageLight,
    borderColor: C.sageBorder,
  },
  toggleBtnChat: {},
  toggleBtnChatActive: {
    backgroundColor: C.violetLight,
    borderColor: C.violet,
  },
  toggleBtnIcon: { fontSize: 12 },
  toggleBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: C.clay,
  },
  toggleBtnTextActive: {
    color: C.espresso,
  },
  tableIndicator: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: C.sageLight,
    borderWidth: 1.5,
    borderColor: C.sageBorder,
    borderRadius: radius.pill,
  },
  tableIndicatorText: {
    fontSize: 11,
    fontWeight: '700',
    color: C.sage,
  },

  // Tab Bar
  tabBar: {
    flexDirection: 'row',
    backgroundColor: C.parchment,
    borderBottomWidth: 1.5,
    borderBottomColor: C.vellum,
    paddingHorizontal: 12,
    gap: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: 2.5,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: C.brass,
  },
  tabChat: {},
  tabChatActive: {
    borderBottomColor: C.violet,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
    color: C.clay,
  },
  tabTextActive: {
    color: C.espresso,
  },

  // Content
  content: {
    flex: 1,
  },

  bottomBorder: {
    height: 2,
    backgroundColor: C.espresso,
  },
})