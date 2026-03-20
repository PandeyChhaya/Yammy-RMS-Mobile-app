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
import { ordersService } from '../orders/services/orderService'
import PaymentModal from './components/PaymentModal'
import SplitTicketModal from './components/SplitTicketModal'
import { Category, categoryService } from './services/categoriesService'
import { productsService } from './services/productsService'
import { TableCart, tablesService } from './services/tablesService'

import { useCart, usePayment, useSplitTicket, useTables } from './hooks'
import { ProductDisplay } from './types/products'
import { TableData } from './types/tables'

// ─── Design Tokens ─────────────────────────────────────────────────────────────
const COLORS = {
  // Brand
  brand: '#C41E1E',
  brandLight: '#FFF0F0',
  brandBorder: '#FECACA',

  // Backgrounds
  background: '#FDFAF3',
  headerBg: '#FFFBEE',
  surface: '#FFFFFF',

  // Text
  textPrimary: '#1A1208',
  textSecondary: '#6B5E3A',
  textMuted: '#A89870',

  // Accents
  gold: '#C4933E',
  goldLight: '#FEF3DC',
  goldBorder: '#F5D98A',

  // Status
  success: '#2E7D32',
  successLight: '#F0FDF4',
  successBorder: '#BBF7D0',

  // UI
  border: '#EDE0B8',
  cardBorder: '#F5EBD0',
  inputBg: '#FFFDF7',
  divider: '#F0E6C8',

  // Always white text on colored bg
  onBrand: '#FFFFFF',
}

// ─── Live Clock ─────────────────────────────────────────────────────────────────
function LiveClock() {
  const [time, setTime] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const pad = (n: number) => n.toString().padStart(2, '0')
  const hh = pad(time.getHours())
  const mm = pad(time.getMinutes())
  const ss = pad(time.getSeconds())
  const date = time.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })

  return (
    <View style={clockStyles.wrap}>
      <Text style={clockStyles.time}>
        {hh}:{mm}<Text style={clockStyles.secs}>:{ss}</Text>
      </Text>
      <Text style={clockStyles.date}>{date}</Text>
    </View>
  )
}

const clockStyles = StyleSheet.create({
  wrap: { alignItems: 'flex-end' },
  time: { fontSize: 17, fontWeight: '800', color: COLORS.textPrimary, letterSpacing: 1 },
  secs: { fontSize: 13, fontWeight: '400', color: COLORS.textMuted },
  date: { fontSize: 10, color: COLORS.textMuted, fontWeight: '500', marginTop: 1, letterSpacing: 0.4 },
})

// ─── Status Banner ──────────────────────────────────────────────────────────────
function StatusBanner({ message, type }: { message: string; type: 'success' | 'error' }) {
  const isSuccess = type === 'success'
  return (
    <View style={[bannerStyles.wrap, isSuccess ? bannerStyles.success : bannerStyles.error]}>
      <View style={bannerStyles.dot} />
      <Text style={bannerStyles.text}>{message}</Text>
    </View>
  )
}

const bannerStyles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  success: { backgroundColor: COLORS.success },
  error: { backgroundColor: COLORS.brand },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.6)' },
  text: { color: COLORS.onBrand, fontSize: 13, fontWeight: '600', flex: 1, textAlign: 'center' },
})

// ─── Section Header ─────────────────────────────────────────────────────────────
function SectionHeader({ icon, title, count }: { icon: string; title: string; count?: number }) {
  return (
    <View style={sectionHeaderStyles.wrap}>
      <View style={sectionHeaderStyles.iconBadge}>
        <Text style={sectionHeaderStyles.icon}>{icon}</Text>
      </View>
      <Text style={sectionHeaderStyles.title}>{title}</Text>
      {count !== undefined && (
        <View style={sectionHeaderStyles.countBadge}>
          <Text style={sectionHeaderStyles.countText}>{count}</Text>
        </View>
      )}
    </View>
  )
}

const sectionHeaderStyles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  iconBadge: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: COLORS.brandLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.brandBorder,
  },
  icon: { fontSize: 14 },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    flex: 1,
  },
  countBadge: {
    backgroundColor: COLORS.goldLight,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: COLORS.goldBorder,
  },
  countText: { fontSize: 11, fontWeight: '700', color: COLORS.gold },
})

// ─── Main Component ─────────────────────────────────────────────────────────────
export default function POS() {

  // ── Hooks ──
  const { tabs, activeTabId } = useApp()
  const { settings } = useUserSettings()
  const currentTab = tabs.find(tab => tab.id === activeTabId)

  const [selectedTable, setSelectedTable] = useActiveTabState<TableData | null>(
    'selectedTable', currentTab?.params?.selectedTable || null, true
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
        taxGroups.set(key, { rate, name: `${getTaxName()} ${rate}%`, amount: item.total_price })
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

  const getCartTax = () => getCartTaxBreakdown().reduce((sum, b) => sum + b.tax_amount, 0)
  const getCartTotalWithTax = () => (cartTotal || 0) + getCartTax()

  const splitTicketHook = useSplitTicket(cartItems, cartTotal, getCartTax)

  useEffect(() => {
    if (shouldGenerateTicket) {
      const timer = setTimeout(() => setShouldGenerateTicket(false), 1000)
      return () => clearTimeout(timer)
    }
  }, [shouldGenerateTicket])

  // ── Loading ──
  if (loadingProducts || loadingCategories || loadingTables) {
    return (
      <View style={styles.loading}>
        <View style={styles.loadingCard}>
          <View style={styles.loadingIconWrap}>
            <Utensils size={28} color={COLORS.brand} />
          </View>
          <ActivityIndicator size="large" color={COLORS.brand} style={{ marginTop: 16 }} />
          <Text style={styles.loadingTitle}>Yammy Fresh POS</Text>
          <Text style={styles.loadingText}>Setting up your workspace...</Text>
        </View>
      </View>
    )
  }

  // ── Helpers ──
  const enrichedProducts: ProductDisplay[] = (products || []).map((product: any) => {
    const category = categories.find(c => c.id === product.category_id)
    const taxAmount = calculateTax(product.price || 0, product.category_id, categories)
    return {
      ...product,
      category_name: category?.name,
      tax_rate: 0,
      tax_amount: taxAmount,
      total_with_tax: (product.price || 0) + taxAmount
    }
  })

  const getCategoryColor = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId)
    return category?.color || '#C4933E'
  }

  const addToCart = (product: ProductDisplay) => {
    cartHook.addToCart(product)
    setShowSuccessMessage(`${product.name} added to cart`)
    setTimeout(() => setShowSuccessMessage(null), 2000)
  }

  const removeFromCart = (productId: string) => cartHook.removeFromCart(productId)
  const updateQuantity = (productId: string, quantity: number) => cartHook.updateQuantity(productId, quantity)

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
      const order = await ordersService.createOrderFromCart(
        selectedTable?.id || 'direct-sale',
        selectedTable?.name || 'Direct Sale',
        cartItems
      )
      await clearCart()
      if (selectedTable) tablesHook.setTableCleaning(selectedTable.id)
      setShowSuccessMessage(`Order ${order.order_number} created!`)
      setTimeout(() => setShowSuccessMessage(null), 3000)
      setShowPaymentModal(false)
      setActiveTab('products')
    } catch (error) {
      setShowErrorMessage('Payment failed. Please try again.')
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
    { id: 'products', name: 'Menu', icon: Coffee },
    { id: 'cart', name: 'Cart', icon: ShoppingCart },
  ]

  const freeTablesCount = tables.filter(t => t.status === 'free').length
  const occupiedTablesCount = tables.filter(t => t.status !== 'free').length

  // ── Render ──
  return (
    <View style={styles.root}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerTop}>

          {/* Brand */}
          <View style={styles.brand}>
            <View style={styles.logoBadge}>
              <Utensils size={20} color={COLORS.onBrand} />
            </View>
            <View>
              <Text style={styles.brandName}>Yammy Fresh POS</Text>
              <Text style={styles.brandSub}>Point of Sale System</Text>
            </View>
          </View>

          {/* Right side: Clock + Clear */}
          <View style={styles.headerRight}>
            <LiveClock />
            {cartItems.length > 0 && (
              <TouchableOpacity style={styles.clearBtn} onPress={clearCart} activeOpacity={0.8}>
                <Trash2 size={13} color={COLORS.onBrand} />
                <Text style={styles.clearBtnText}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Context strip: selected table or direct sale indicator */}
        <View style={styles.contextStrip}>
          <View style={[
            styles.contextBadge,
            selectedTable ? styles.contextBadgeTable : styles.contextBadgeDirect
          ]}>
            <Text style={styles.contextDot}>{selectedTable ? '🪑' : '🛒'}</Text>
            <Text style={styles.contextText}>
              {selectedTable ? `Table ${selectedTable.number ?? selectedTable.id} — ${selectedTable.name}` : 'Direct Sale'}
            </Text>
          </View>
          <View style={styles.statusPill}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>Online</Text>
          </View>
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
                  activeOpacity={0.75}
                >
                  <Icon size={15} color={isActive ? COLORS.brand : COLORS.textMuted} />
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

      {/* ── Banners ── */}
      {showSuccessMessage && <StatusBanner message={showSuccessMessage} type="success" />}
      {showErrorMessage && <StatusBanner message={showErrorMessage} type="error" />}

      {/* ── Content ── */}
      <ScrollView style={styles.content} contentContainerStyle={styles.contentInner} showsVerticalScrollIndicator={false}>

        {/* ── TABLES TAB ── */}
        {activeTab === 'tables' && (
          <View style={styles.tabContent}>

            {/* Stats row */}
            <View style={styles.statsRow}>
              <View style={[styles.statCard, { borderColor: COLORS.successBorder }]}>
                <Text style={[styles.statNumber, { color: COLORS.success }]}>{freeTablesCount}</Text>
                <Text style={styles.statLabel}>Free</Text>
              </View>
              <View style={[styles.statCard, { borderColor: COLORS.brandBorder }]}>
                <Text style={[styles.statNumber, { color: COLORS.brand }]}>{occupiedTablesCount}</Text>
                <Text style={styles.statLabel}>Occupied</Text>
              </View>
              <View style={[styles.statCard, { borderColor: COLORS.goldBorder }]}>
                <Text style={[styles.statNumber, { color: COLORS.gold }]}>{tables.length}</Text>
                <Text style={styles.statLabel}>Total</Text>
              </View>
            </View>

            {/* Direct Sale */}
            <TouchableOpacity
              style={styles.directSaleBtn}
              onPress={() => { setSelectedTable(null); setActiveTab('products') }}
              activeOpacity={0.85}
            >
              <ShoppingCart size={18} color={COLORS.onBrand} />
              <Text style={styles.directSaleText}>Direct Sale (No Table)</Text>
            </TouchableOpacity>

            <SectionHeader icon="🪑" title="Select Table" count={tables.length} />

            <View style={styles.tablesGrid}>
              {tables.map((table) => {
                const isFree = table.status === 'free'
                const isSelected = selectedTable?.id === table.id
                return (
                  <TouchableOpacity
                    key={table.id}
                    style={[
                      styles.tableCard,
                      isSelected && styles.tableCardActive,
                      !isFree && styles.tableCardOccupied,
                    ]}
                    onPress={() => { setSelectedTable(table); setActiveTab('products') }}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.tableNumber, isSelected && { color: COLORS.onBrand }]}>
                      {table.number}
                    </Text>
                    <Text style={[styles.tableName, isSelected && { color: COLORS.onBrand }]}>
                      {table.name}
                    </Text>
                    <View style={[
                      styles.tableStatusBadge,
                      { backgroundColor: isFree ? COLORS.successLight : COLORS.brandLight },
                    ]}>
                      <View style={[
                        styles.tableStatusDot,
                        { backgroundColor: isFree ? COLORS.success : COLORS.brand }
                      ]} />
                      <Text style={[
                        styles.tableStatusText,
                        { color: isFree ? COLORS.success : COLORS.brand }
                      ]}>
                        {isFree ? 'Free' : 'Occupied'}
                      </Text>
                    </View>
                    <Text style={[styles.tableCapacity, isSelected && { color: 'rgba(255,255,255,0.7)' }]}>
                      👥 {table.capacity} seats
                    </Text>
                  </TouchableOpacity>
                )
              })}
            </View>
          </View>
        )}

        {/* ── PRODUCTS TAB ── */}
        {activeTab === 'products' && (
          <View style={styles.tabContent}>

            {/* Search */}
            <View style={styles.searchCard}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Search menu items..."
                placeholderTextColor={COLORS.textMuted}
                value={searchTerm}
                onChangeText={setSearchTerm}
              />
              {searchTerm.length > 0 && (
                <TouchableOpacity onPress={() => setSearchTerm('')}>
                  <Text style={styles.searchClear}>✕</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Categories */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.categoriesRow}>
                <TouchableOpacity
                  style={[styles.categoryBtn, selectedCategory === 'all' && styles.categoryBtnActive]}
                  onPress={() => setSelectedCategory('all')}
                >
                  <Text style={[styles.categoryBtnText, selectedCategory === 'all' && styles.categoryBtnTextActive]}>
                    All Items
                  </Text>
                </TouchableOpacity>
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[styles.categoryBtn, selectedCategory === cat.id && styles.categoryBtnActive]}
                    onPress={() => setSelectedCategory(cat.id)}
                  >
                    <Text style={[styles.categoryBtnText, selectedCategory === cat.id && styles.categoryBtnTextActive]}>
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            {/* Result count */}
            <Text style={styles.resultCount}>{filteredProducts.length} items</Text>

            {/* Products Grid */}
            <View style={styles.productsGrid}>
              {filteredProducts.map((product) => (
                <TouchableOpacity
                  key={product.id}
                  style={styles.productCard}
                  onPress={() => addToCart(product)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.productIconWrap, { borderColor: getCategoryColor(product.category_id) + '40' }]}>
                    <Coffee size={22} color={getCategoryColor(product.category_id)} />
                  </View>
                  <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
                  <Text style={styles.productCategory}>{product.category_name}</Text>
                  <View style={styles.productFooter}>
                    <Text style={styles.productPrice}>NPR {product.price}</Text>
                    <View style={[
                      styles.productStockBadge,
                      { backgroundColor: (product.stock_quantity || 0) > 5 ? COLORS.successLight : COLORS.brandLight }
                    ]}>
                      <Text style={[
                        styles.productStockText,
                        { color: (product.stock_quantity || 0) > 5 ? COLORS.success : COLORS.brand }
                      ]}>
                        {product.stock_quantity || 0}
                      </Text>
                    </View>
                  </View>
                  {/* Add indicator */}
                  <View style={styles.productAddBtn}>
                    <Text style={styles.productAddText}>+</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* ── CART TAB ── */}
        {activeTab === 'cart' && (
          <View style={styles.tabContent}>
            {cartItems.length === 0 ? (
              <View style={styles.emptyCart}>
                <View style={styles.emptyCartIcon}>
                  <ShoppingCart size={36} color={COLORS.textMuted} />
                </View>
                <Text style={styles.emptyCartText}>Your cart is empty</Text>
                <Text style={styles.emptyCartSub}>Browse the menu and add items</Text>
                <TouchableOpacity
                  style={styles.browseBtn}
                  onPress={() => setActiveTab('products')}
                >
                  <Text style={styles.browseBtnText}>Browse Menu</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <SectionHeader icon="🛒" title="Order Items" count={cartItems.length} />

                {cartItems.map((item) => (
                  <View key={item.product_id} style={styles.cartItemCard}>
                    <View style={styles.cartItemHeader}>
                      <View style={styles.cartItemIconWrap}>
                        <Coffee size={14} color={COLORS.gold} />
                      </View>
                      <Text style={styles.cartItemName} numberOfLines={1}>{item.product_name}</Text>
                      <TouchableOpacity
                        style={styles.removeBtn}
                        onPress={() => removeFromCart(item.product_id)}
                      >
                        <Trash2 size={14} color={COLORS.brand} />
                      </TouchableOpacity>
                    </View>

                    <Text style={styles.cartItemMeta}>{item.quantity}x @ NPR {item.unit_price}</Text>

                    <View style={styles.cartItemFooter}>
                      <View style={styles.qtyControls}>
                        <TouchableOpacity
                          style={styles.qtyBtn}
                          onPress={() => updateQuantity(item.product_id, Math.max(1, item.quantity - 1))}
                        >
                          <Minus size={13} color={COLORS.textPrimary} />
                        </TouchableOpacity>
                        <Text style={styles.qtyText}>{item.quantity}</Text>
                        <TouchableOpacity
                          style={styles.qtyBtn}
                          onPress={() => updateQuantity(item.product_id, item.quantity + 1)}
                        >
                          <Plus size={13} color={COLORS.textPrimary} />
                        </TouchableOpacity>
                      </View>
                      <Text style={styles.cartItemPrice}>NPR {item.total_price}</Text>
                    </View>
                  </View>
                ))}

                {/* Summary */}
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryTitle}>Order Summary</Text>
                  <View style={styles.summaryDivider} />
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Subtotal</Text>
                    <Text style={styles.summaryValue}>NPR {cartTotal.toFixed(2)}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Tax</Text>
                    <Text style={styles.summaryValue}>NPR {getCartTax().toFixed(2)}</Text>
                  </View>
                  <View style={styles.summaryDivider} />
                  <View style={styles.summaryRowTotal}>
                    <Text style={styles.summaryLabelTotal}>Total</Text>
                    <Text style={styles.summaryValueTotal}>NPR {getCartTotalWithTax().toFixed(2)}</Text>
                  </View>
                </View>

                {/* Actions */}
                <View style={styles.actionsRow}>
                  <TouchableOpacity
                    style={styles.payBtn}
                    onPress={() => setShowPaymentModal(true)}
                    activeOpacity={0.85}
                  >
                    <CreditCard size={18} color={COLORS.onBrand} />
                    <Text style={styles.payBtnText}>Pay Now</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.splitBtn}
                    onPress={() => setShowSplitTicketModal(true)}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.splitBtnText}>✂️  Split</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        )}
      </ScrollView>

      {/* ── Modals ── */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onConfirm={handlePayment}
        totalAmount={getCartTotalWithTax()}
        paymentMethod={paymentMethod}
        customerName={customerName}
        isProcessing={false}
      />

      <SplitTicketModal
        isOpen={showSplitTicketModal}
        onClose={() => setShowSplitTicketModal(false)}
        cartTotal={cartTotal}
        onSplit={(amounts) => console.log('Split:', amounts)}
      />
    </View>
  )
}

// ─── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({

  // ── Root / Loading ──
  root: { flex: 1, backgroundColor: COLORS.background },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background, padding: 24 },
  loadingCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    width: '80%',
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.brand,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 6,
  },
  loadingIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: COLORS.brandLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.brandBorder,
  },
  loadingTitle: { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary, marginTop: 12 },
  loadingText: { fontSize: 13, color: COLORS.textMuted, marginTop: 4 },

  // ── Header ──
  header: {
    backgroundColor: COLORS.headerBg,
    paddingTop: 52,
    paddingHorizontal: 16,
    paddingBottom: 0,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 4,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoBadge: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: COLORS.brand,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.brand,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  brandName: { fontSize: 17, fontWeight: '800', color: COLORS.textPrimary, letterSpacing: 0.2 },
  brandSub: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '500' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.brand,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    shadowColor: COLORS.brand,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  clearBtnText: { color: COLORS.onBrand, fontSize: 12, fontWeight: '700' },

  // ── Context Strip ──
  contextStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  contextBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
  },
  contextBadgeTable: {
    backgroundColor: COLORS.goldLight,
    borderColor: COLORS.goldBorder,
  },
  contextBadgeDirect: {
    backgroundColor: COLORS.brandLight,
    borderColor: COLORS.brandBorder,
  },
  contextDot: { fontSize: 12 },
  contextText: { fontSize: 12, fontWeight: '600', color: COLORS.textPrimary },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.successLight,
    borderRadius: 10,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: COLORS.successBorder,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.success },
  statusText: { fontSize: 10, fontWeight: '700', color: COLORS.success },

  // ── Tabs ──
  tabsScroll: { marginTop: 2 },
  tabsRow: { flexDirection: 'row', gap: 2, paddingBottom: 0 },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderBottomWidth: 2.5,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: COLORS.brand },
  tabText: { fontSize: 13, fontWeight: '500', color: COLORS.textMuted },
  tabTextActive: { color: COLORS.brand, fontWeight: '700' },
  badge: {
    backgroundColor: COLORS.brand,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: { color: COLORS.onBrand, fontSize: 10, fontWeight: '800' },

  // ── Content ──
  content: { flex: 1 },
  contentInner: { padding: 16, paddingBottom: 40 },
  tabContent: { gap: 14 },

  // ── Stats Row ──
  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1.5,
  },
  statNumber: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 11, color: COLORS.textMuted, fontWeight: '500', marginTop: 2 },

  // ── Direct Sale ──
  directSaleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.brand,
    paddingVertical: 14,
    borderRadius: 14,
    shadowColor: COLORS.brand,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  directSaleText: { color: COLORS.onBrand, fontSize: 15, fontWeight: '700' },

  // ── Tables Grid ──
  tablesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  tableCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 14,
    width: '47%',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.cardBorder,
    gap: 4,
  },
  tableCardActive: {
    backgroundColor: COLORS.brand,
    borderColor: COLORS.brand,
    shadowColor: COLORS.brand,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  tableCardOccupied: { borderColor: COLORS.brandBorder },
  tableNumber: { fontSize: 26, fontWeight: '900', color: COLORS.brand },
  tableName: { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary },
  tableStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 10,
    marginTop: 4,
  },
  tableStatusDot: { width: 5, height: 5, borderRadius: 3 },
  tableStatusText: { fontSize: 11, fontWeight: '700' },
  tableCapacity: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },

  // ── Search ──
  searchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    gap: 8,
  },
  searchIcon: { fontSize: 14 },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textPrimary,
    paddingVertical: 12,
  },
  searchClear: { fontSize: 14, color: COLORS.textMuted, padding: 4 },

  // ── Categories ──
  categoriesRow: { flexDirection: 'row', gap: 8, paddingVertical: 2 },
  categoryBtn: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: COLORS.cardBorder,
  },
  categoryBtnActive: { backgroundColor: COLORS.brand, borderColor: COLORS.brand },
  categoryBtnText: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary },
  categoryBtnTextActive: { color: COLORS.onBrand },

  // ── Result count ──
  resultCount: { fontSize: 11, color: COLORS.textMuted, fontWeight: '500' },

  // ── Products Grid ──
  productsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  productCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 12,
    width: '47%',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    position: 'relative',
    overflow: 'hidden',
  },
  productIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: COLORS.goldLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 1.5,
  },
  productName: { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 2 },
  productCategory: { fontSize: 11, color: COLORS.textMuted, marginBottom: 8 },
  productFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  productPrice: { fontSize: 14, fontWeight: '800', color: COLORS.brand },
  productStockBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  productStockText: { fontSize: 10, fontWeight: '700' },
  productAddBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productAddText: { color: COLORS.onBrand, fontSize: 16, fontWeight: '700', lineHeight: 20 },

  // ── Empty Cart ──
  emptyCart: { alignItems: 'center', paddingVertical: 56, gap: 10 },
  emptyCartIcon: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: COLORS.goldLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.goldBorder,
  },
  emptyCartText: { fontSize: 17, fontWeight: '800', color: COLORS.textPrimary },
  emptyCartSub: { fontSize: 13, color: COLORS.textMuted },
  browseBtn: {
    marginTop: 8,
    backgroundColor: COLORS.brand,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  browseBtnText: { color: COLORS.onBrand, fontSize: 13, fontWeight: '700' },

  // ── Cart Items ──
  cartItemCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  cartItemHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  cartItemIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: COLORS.goldLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartItemName: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary, flex: 1 },
  removeBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: COLORS.brandLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartItemMeta: { fontSize: 12, color: COLORS.textMuted, marginBottom: 10, marginLeft: 34 },
  cartItemFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  qtyControls: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  qtyBtn: {
    backgroundColor: COLORS.background,
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  qtyText: { fontSize: 16, fontWeight: '800', color: COLORS.textPrimary, minWidth: 24, textAlign: 'center' },
  cartItemPrice: { fontSize: 15, fontWeight: '800', color: COLORS.brand },

  // ── Summary ──
  summaryCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1.5,
    borderColor: COLORS.goldBorder,
  },
  summaryTitle: { fontSize: 12, fontWeight: '700', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10 },
  summaryDivider: { height: 1, backgroundColor: COLORS.divider, marginVertical: 8 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  summaryRowTotal: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  summaryLabel: { fontSize: 13, color: COLORS.textSecondary },
  summaryValue: { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary },
  summaryLabelTotal: { fontSize: 16, fontWeight: '800', color: COLORS.textPrimary },
  summaryValueTotal: { fontSize: 18, fontWeight: '900', color: COLORS.brand },

  // ── Actions ──
  actionsRow: { flexDirection: 'row', gap: 12 },
  payBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.brand,
    paddingVertical: 15,
    borderRadius: 14,
    shadowColor: COLORS.brand,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  payBtnText: { color: COLORS.onBrand, fontSize: 15, fontWeight: '800' },
  splitBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.successLight,
    paddingVertical: 15,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORS.successBorder,
  },
  splitBtnText: { color: COLORS.success, fontSize: 14, fontWeight: '700' },
})