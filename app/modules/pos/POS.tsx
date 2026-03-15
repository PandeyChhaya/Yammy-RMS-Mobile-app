import { useQuery } from '@tanstack/react-query'
import {
  Coffee,
  CreditCard,
  Grid3x3,
  Minus,
  Plus,
  ShoppingCart,
  Trash2,
  Utensils,
} from 'lucide-react-native'
import { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'

import { useApp } from '../../../shared/contexts/AppContext'
import { useUserSettings } from '../../../shared/contexts/UserSettingsContext'
import { useActiveTabState } from '../../../shared/hooks/useTabState'
import { useTaxSettings } from '../../../shared/hooks/useTaxSettings'
import { Category, categoryService } from './services/categoriesService'
import { productsService } from './services/productsService'
import { TableCart, tablesService } from './services/tablesService'

import PaymentModal from './components/PaymentModal'
import SplitTicketModal from './components/SplitTicketModal'

import { useCart, usePayment, useSplitTicket, useTables } from './hooks'
import { ProductDisplay } from './types/products'
import { TableData } from './types/tables'

const Colors = {
  background: '#FEF1A8',
  headerBg: '#FFF1C1',
  card: '#FFFFFF',
  brand: '#C41E1E',
  buttonYellow: '#D4A843',
  textPrimary: '#1A1A1A',
  textSecondary: '#5C5436',
  border: '#E8D88A',
  activeTab: '#C41E1E',
  inactiveTab: '#9E8E50',
  success: '#2E7D32',
  cardBorder: '#F0E88A',
  inputBg: '#FFFDE7',
}

export default function POS() {
  // ==================== ALL HOOKS FIRST ====================

  const { tabs, activeTabId } = useApp()
  const { settings } = useUserSettings()
  const currentTab = tabs.find(tab => tab.id === activeTabId)

  const [selectedTable, setSelectedTable] = useActiveTabState<TableData | null>(
    'selectedTable',
    currentTab?.params?.selectedTable || null,
    true
  )
  const [customerName, setCustomerName] = useActiveTabState<string>('customerName', '', true)
  const [paymentMethod, setPaymentMethod] = useActiveTabState<string>('paymentMethod', 'cash', true)
  const [searchTerm, setSearchTerm] = useActiveTabState<string>('searchTerm', '', true)
  const [selectedCategory, setSelectedCategory] = useActiveTabState<string>('selectedCategory', 'all', true)
  const [showSuccessMessage, setShowSuccessMessage] = useState<string | null>(null)
  const [showErrorMessage, setShowErrorMessage] = useState<string | null>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showSplitTicketModal, setShowSplitTicketModal] = useState(false)
  const [shouldGenerateTicket, setShouldGenerateTicket] = useState(false)
  const [activeTab, setActiveTab] = useState<'tables' | 'products' | 'cart'>('products')

  const { data: products = [], isLoading: loadingProducts } = useQuery({
    queryKey: ['products'],
    queryFn: productsService.getProducts,
  })

  const { data: categories = [], isLoading: loadingCategories } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: categoryService.getCategories,
  })

  const { data: tables = [], isLoading: loadingTables } = useQuery<TableData[]>({
    queryKey: ['tables'],
    queryFn: async (): Promise<TableData[]> => {
      const result = await tablesService.getAllTables()
      return result as TableData[]
    },
    refetchInterval: 2000,
    refetchOnWindowFocus: true,
    staleTime: 0,
  })

  const { data: tableCart } = useQuery<TableCart | null>({
    queryKey: ['table-cart', selectedTable?.id],
    queryFn: () => {
      if (!selectedTable) return null
      return tablesService.getTableCart(selectedTable.id)
    },
    enabled: !!selectedTable,
    retry: 1,
  })

  const cartHook = useCart(selectedTable, products as any, categories)
  const tablesHook = useTables()
  const { calculateTax, getTaxName } = useTaxSettings()

  const cartItems = selectedTable
    ? (tableCart?.items || [])
    : cartHook.enrichCartItems(cartHook.localCart?.items || [])

  const cartTotal = selectedTable
    ? (tableCart?.total_amount || 0)
    : (cartHook.localCart?.total_amount || 0)

  const paymentHook = usePayment(selectedTable, cartItems, products as any)

  const getCartTaxBreakdown = () => {
    if (!cartItems || cartItems.length === 0) return []
    const taxGroups = new Map<string, { rate: number, name: string, amount: number }>()
    cartItems.forEach(item => {
      const rate = 0
      const key = `${rate}`
      if (taxGroups.has(key)) {
        taxGroups.get(key)!.amount += item.total_price
      } else {
        taxGroups.set(key, {
          rate,
          name: `${getTaxName()} ${rate}%`,
          amount: item.total_price
        })
      }
    })
    return Array.from(taxGroups.values()).map(group => ({
      tax_rate_id: `rate-${group.rate}`,
      tax_rate_name: group.name,
      rate: group.rate,
      taxable_amount: group.amount,
      tax_amount: calculateTax(group.amount, undefined, categories)
    }))
  }

  const getCartTax = () => {
    const breakdowns = getCartTaxBreakdown()
    return breakdowns.reduce((sum, breakdown) => sum + breakdown.tax_amount, 0)
  }

  const getCartTotalWithTax = () => (cartTotal || 0) + getCartTax()

  const splitTicketHook = useSplitTicket(cartItems, cartTotal, getCartTax)

  useEffect(() => {
    if (shouldGenerateTicket) {
      const timer = setTimeout(() => setShouldGenerateTicket(false), 1000)
      return () => clearTimeout(timer)
    }
  }, [shouldGenerateTicket])

  // ==================== LOADING CHECK ====================

  const isLoading = loadingProducts || loadingCategories || loadingTables

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={Colors.brand} />
        <Text style={styles.loadingText}>Loading POS...</Text>
      </View>
    )
  }

  // ==================== FUNCTIONS ====================

  const enrichedProducts: ProductDisplay[] = (products || []).map((product: any) => {
    const category = categories.find(c => c.id === product.category_id)
    const taxRate = 0
    const taxAmount = calculateTax(product.price || 0, product.category_id, categories)
    return {
      ...product,
      category_name: category?.name,
      tax_rate: taxRate,
      tax_amount: taxAmount,
      total_with_tax: (product.price || 0) + taxAmount
    }
  })

  const getCategoryColor = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId)
    return category?.color || '#3B82F6'
  }

  const addToCart = (product: ProductDisplay) => {
    cartHook.addToCart(product)
    setShowSuccessMessage('Added to cart')
    setTimeout(() => setShowSuccessMessage(null), 2000)
  }

  const removeFromCart = (productId: string) => {
    cartHook.removeFromCart(productId)
  }

  const updateQuantity = (productId: string, quantity: number) => {
    cartHook.updateQuantity(productId, quantity)
  }

  const clearCart = async () => {
    await cartHook.clearCart()
    setShowSuccessMessage('Cart cleared')
    setTimeout(() => setShowSuccessMessage(null), 2000)
  }

  const handlePayment = async () => {
    if (!cartItems || cartItems.length === 0) {
      setShowErrorMessage('Cart is empty')
      setTimeout(() => setShowErrorMessage(null), 3000)
      return
    }

    try {
      const totalAmount = getCartTotalWithTax()
      const taxAmount = getCartTax()
      const itemsCount = cartItems.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0)
      const paymentMethods = [
        { id: 'cash', name: 'Cash' },
        { id: 'card', name: 'Card' },
        { id: 'transfer', name: 'Transfer' },
      ]
      const paymentMethodName = paymentMethods.find(m => m.id === paymentMethod)?.name || 'Unknown'

      await paymentHook.processPayment(
        totalAmount,
        taxAmount,
        itemsCount,
        paymentMethodName,
        customerName,
        () => {
          clearCart()
          if (selectedTable) {
            tablesHook.setTableCleaning(selectedTable.id)
          }
          setShowSuccessMessage('Payment completed!')
          setTimeout(() => setShowSuccessMessage(null), 3000)
          setShowPaymentModal(false)
        }
      )
    } catch (error) {
      console.error('Payment error:', error)
      setShowErrorMessage(`Payment failed`)
      setTimeout(() => setShowErrorMessage(null), 5000)
    }
  }

  const filteredProducts = enrichedProducts?.filter(product => {
    const matchesCategory = selectedCategory === 'all' || (product as any).category_id === selectedCategory
    const matchesSearch = (product as any).name?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const tabOptions = [
    { id: 'tables', name: 'Tables', icon: Grid3x3 },
    { id: 'products', name: 'Products', icon: Coffee },
    { id: 'cart', name: 'Cart', icon: ShoppingCart },
  ]

  // ==================== RENDER ====================

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerTitle}>
            <View style={styles.logoBadge}>
              <Utensils size={20} color={Colors.card} />
            </View>
            <View>
              <Text style={styles.headerTitleText}>Yammy Fresh POS</Text>
              <Text style={styles.headerSubtitle}>Point of Sale System</Text>
            </View>
          </View>

          {cartItems.length > 0 && (
            <TouchableOpacity style={styles.clearBtn} onPress={clearCart}>
              <Trash2 size={14} color={Colors.card} />
              <Text style={styles.clearBtnText}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll}>
          <View style={styles.tabsRow}>
            {tabOptions.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <TouchableOpacity
                  key={tab.id}
                  style={[styles.tab, isActive && styles.tabActive]}
                  onPress={() => setActiveTab(tab.id as any)}
                >
                  <Icon size={15} color={isActive ? Colors.activeTab : Colors.inactiveTab} />
                  <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                    {tab.name}
                  </Text>
                  {tab.id === 'cart' && cartItems.length > 0 && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{cartItems.length}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              )
            })}
          </View>
        </ScrollView>
      </View>

      {/* Success/Error Messages */}
      {showSuccessMessage && (
        <View style={styles.successBanner}>
          <Text style={styles.successText}>{showSuccessMessage}</Text>
        </View>
      )}
      {showErrorMessage && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{showErrorMessage}</Text>
        </View>
      )}

      {/* Content */}
      <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
        
        {/* TABLES TAB */}
        {activeTab === 'tables' && (
          <View style={styles.tabContent}>
            <TouchableOpacity
              style={styles.directSaleBtn}
              onPress={() => setSelectedTable(null)}
            >
              <ShoppingCart size={18} color={Colors.card} />
              <Text style={styles.directSaleText}>Direct Sale</Text>
            </TouchableOpacity>

            <View style={styles.tablesGrid}>
              {tables.map((table) => (
                <TouchableOpacity
                  key={table.id}
                  style={[
                    styles.tableCard,
                    selectedTable?.id === table.id && styles.tableCardActive
                  ]}
                  onPress={() => setSelectedTable(table)}
                >
                  <Text style={styles.tableNumber}>{table.number}</Text>
                  <Text style={styles.tableName}>{table.name}</Text>
                  <View style={[
                    styles.tableStatusBadge,
                    { backgroundColor: table.status === 'free' ? Colors.success : Colors.brand }
                  ]}>
                    <Text style={styles.tableStatusText}>
                      {table.status === 'free' ? 'Free' : 'Occupied'}
                    </Text>
                  </View>
                  <Text style={styles.tableCapacity}>{table.capacity} seats</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* PRODUCTS TAB */}
        {activeTab === 'products' && (
          <View style={styles.tabContent}>
            <View style={styles.searchCard}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search products..."
                placeholderTextColor={Colors.inactiveTab}
                value={searchTerm}
                onChangeText={setSearchTerm}
              />
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
              <View style={styles.categoriesRow}>
                <TouchableOpacity
                  style={[
                    styles.categoryBtn,
                    selectedCategory === 'all' && styles.categoryBtnActive
                  ]}
                  onPress={() => setSelectedCategory('all')}
                >
                  <Text style={[
                    styles.categoryBtnText,
                    selectedCategory === 'all' && styles.categoryBtnTextActive
                  ]}>All</Text>
                </TouchableOpacity>
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.categoryBtn,
                      selectedCategory === cat.id && styles.categoryBtnActive
                    ]}
                    onPress={() => setSelectedCategory(cat.id)}
                  >
                    <Text style={[
                      styles.categoryBtnText,
                      selectedCategory === cat.id && styles.categoryBtnTextActive
                    ]}>{cat.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <View style={styles.productsGrid}>
              {filteredProducts.map((product) => (
                <TouchableOpacity
                  key={product.id}
                  style={styles.productCard}
                  onPress={() => addToCart(product)}
                >
                  <View style={styles.productIcon}>
                    <Coffee size={24} color={getCategoryColor(product.category_id)} />
                  </View>
                  <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
                  <Text style={styles.productCategory}>{product.category_name}</Text>
                  <Text style={styles.productPrice}>NPR {product.price}</Text>
                  <View style={styles.productStockBadge}>
                    <Text style={styles.productStockText}>Stock: {product.stock_quantity || 0}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* CART TAB */}
        {activeTab === 'cart' && (
          <View style={styles.tabContent}>
            {cartItems.length === 0 ? (
              <View style={styles.emptyCart}>
                <ShoppingCart size={48} color={Colors.inactiveTab} />
                <Text style={styles.emptyCartText}>Cart is empty</Text>
                <Text style={styles.emptyCartSub}>Add products to get started</Text>
              </View>
            ) : (
              <>
                {cartItems.map((item) => (
                  <View key={item.product_id} style={styles.cartItemCard}>
                    <View style={styles.cartItemHeader}>
                      <Text style={styles.cartItemName}>{item.product_name}</Text>
                      <TouchableOpacity onPress={() => removeFromCart(item.product_id)}>
                        <Trash2 size={16} color={Colors.brand} />
                      </TouchableOpacity>
                    </View>
                 <Text style={styles.cartItemCategory}>
  {item.quantity}x @ NPR {item.unit_price}
</Text>
                    
                    <View style={styles.cartItemFooter}>
                      <View style={styles.qtyControls}>
                        <TouchableOpacity
                          style={styles.qtyBtn}
                          onPress={() => updateQuantity(item.product_id, Math.max(1, item.quantity - 1))}
                        >
                          <Minus size={14} color={Colors.textPrimary} />
                        </TouchableOpacity>
                        <Text style={styles.qtyText}>{item.quantity}</Text>
                        <TouchableOpacity
                          style={styles.qtyBtn}
                          onPress={() => updateQuantity(item.product_id, item.quantity + 1)}
                        >
                          <Plus size={14} color={Colors.textPrimary} />
                        </TouchableOpacity>
                      </View>
                      <Text style={styles.cartItemPrice}>NPR {item.total_price}</Text>
                    </View>
                  </View>
                ))}

                {/* Summary */}
                <View style={styles.summaryCard}>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Subtotal</Text>
                    <Text style={styles.summaryValue}>NPR {cartTotal.toFixed(2)}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Tax</Text>
                    <Text style={styles.summaryValue}>NPR {getCartTax().toFixed(2)}</Text>
                  </View>
                  <View style={styles.divider} />
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabelTotal}>Total</Text>
                    <Text style={styles.summaryValueTotal}>NPR {getCartTotalWithTax().toFixed(2)}</Text>
                  </View>
                </View>

                {/* Actions */}
                <View style={styles.actionsRow}>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => setShowPaymentModal(true)}
                  >
                    <CreditCard size={18} color={Colors.card} />
                    <Text style={styles.actionBtnText}>Pay</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: Colors.success }]}
                    onPress={() => setShowSplitTicketModal(true)}
                  >
                    <Text style={styles.actionBtnText}>Split</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        )}
      </ScrollView>

      {/* Modals */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onConfirm={handlePayment}
        totalAmount={getCartTotalWithTax()}
        paymentMethod={paymentMethod}
        customerName={customerName}
        isProcessing={paymentHook.isProcessingPayment}
      />

      <SplitTicketModal
        isOpen={showSplitTicketModal}
        onClose={() => setShowSplitTicketModal(false)}
        splitMode={splitTicketHook.splitMode}
        setSplitMode={splitTicketHook.setSplitMode}
        splitCount={splitTicketHook.splitCount}
        setSplitCount={splitTicketHook.setSplitCount}
        customSplits={splitTicketHook.customSplits}
        setCustomSplits={splitTicketHook.setCustomSplits}
        itemAssignments={splitTicketHook.itemAssignments}
        paidAmounts={splitTicketHook.paidAmounts}
        currentPayer={splitTicketHook.currentPayer}
        setCurrentPayer={splitTicketHook.setCurrentPayer}
        getSplitBreakdown={splitTicketHook.getSplitBreakdown}
        getTotalRemaining={splitTicketHook.getTotalRemaining}
        getTotalPaid={splitTicketHook.getTotalPaid}
        handlePartialPayment={splitTicketHook.handlePartialPayment}
        assignItemToTicket={splitTicketHook.assignItemToTicket}
        clearSplit={splitTicketHook.clearSplit}
        isNoteFullyPaid={splitTicketHook.isNoteFullyPaid}
        cartItems={cartItems}
        cartTotal={cartTotal}
        getCartTax={getCartTax}
        getCartTotalWithTax={getCartTotalWithTax}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  loadingText: { marginTop: 16, fontSize: 16, fontWeight: '600', color: Colors.textPrimary },

  // Header
  header: {
    backgroundColor: Colors.headerBg,
    paddingTop: 52,
    paddingHorizontal: 16,
    paddingBottom: 0,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  headerTitle: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleText: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  headerSubtitle: { fontSize: 12, color: Colors.textSecondary },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.brand,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },
  clearBtnText: { color: Colors.card, fontSize: 12, fontWeight: '600' },

  // Tabs
  tabsScroll: { marginTop: 4 },
  tabsRow: { flexDirection: 'row', gap: 4, paddingBottom: 0 },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: Colors.activeTab },
  tabText: { fontSize: 13, fontWeight: '500', color: Colors.inactiveTab },
  tabTextActive: { color: Colors.activeTab, fontWeight: '600' },
  badge: {
    backgroundColor: Colors.brand,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 2,
  },
  badgeText: { color: Colors.card, fontSize: 10, fontWeight: '700' },

  // Banners
  successBanner: {
    backgroundColor: Colors.success,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  successText: { color: Colors.card, fontSize: 13, fontWeight: '600', textAlign: 'center' },
  errorBanner: {
    backgroundColor: Colors.brand,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  errorText: { color: Colors.card, fontSize: 13, fontWeight: '600', textAlign: 'center' },

  // Content
  content: { flex: 1 },
  contentInner: { padding: 16, paddingBottom: 32 },
  tabContent: { gap: 14 },

  // Direct Sale
  directSaleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.brand,
    paddingVertical: 14,
    borderRadius: 12,
  },
  directSaleText: { color: Colors.card, fontSize: 15, fontWeight: '600' },

  // Tables
  tablesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  tableCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 14,
    width: '47%',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.cardBorder,
  },
  tableCardActive: { borderColor: Colors.brand },
  tableNumber: { fontSize: 24, fontWeight: '800', color: Colors.brand },
  tableName: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary, marginTop: 2 },
  tableStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 6,
  },
  tableStatusText: { color: Colors.card, fontSize: 11, fontWeight: '600' },
  tableCapacity: { fontSize: 11, color: Colors.textSecondary, marginTop: 4 },

  // Search
  searchCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  searchInput: {
    fontSize: 14,
    color: Colors.textPrimary,
    paddingVertical: 8,
  },

  // Categories
  categoriesScroll: { marginTop: 4 },
  categoriesRow: { flexDirection: 'row', gap: 8 },
  categoryBtn: {
    backgroundColor: Colors.card,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  categoryBtnActive: {
    backgroundColor: Colors.brand,
    borderColor: Colors.brand,
  },
  categoryBtnText: { fontSize: 13, fontWeight: '500', color: Colors.textPrimary },
  categoryBtnTextActive: { color: Colors.card },

  // Products
  productsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  productCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 12,
    width: '47%',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  productIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  productName: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary, marginBottom: 2 },
  productCategory: { fontSize: 11, color: Colors.textSecondary, marginBottom: 6 },
  productPrice: { fontSize: 15, fontWeight: '700', color: Colors.brand },
  productStockBadge: {
    backgroundColor: Colors.background,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 6,
  },
  productStockText: { fontSize: 10, color: Colors.textSecondary, fontWeight: '500' },

  // Cart
  emptyCart: { alignItems: 'center', paddingVertical: 64, gap: 8 },
  emptyCartText: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary },
  emptyCartSub: { fontSize: 13, color: Colors.textSecondary },

  cartItemCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  cartItemHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  cartItemName: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary, flex: 1 },
  cartItemCategory: { fontSize: 11, color: Colors.textSecondary, marginBottom: 10 },
  cartItemFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  qtyControls: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  qtyBtn: {
    backgroundColor: Colors.background,
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary, minWidth: 24, textAlign: 'center' },
  cartItemPrice: { fontSize: 15, fontWeight: '700', color: Colors.brand },

  // Summary
  summaryCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  summaryLabel: { fontSize: 13, color: Colors.textSecondary },
  summaryValue: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
  summaryLabelTotal: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  summaryValueTotal: { fontSize: 17, fontWeight: '800', color: Colors.brand },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 8 },

  // Actions
  actionsRow: { flexDirection: 'row', gap: 12 },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.brand,
    paddingVertical: 14,
    borderRadius: 12,
  },
  actionBtnText: { color: Colors.card, fontSize: 15, fontWeight: '600' },
})