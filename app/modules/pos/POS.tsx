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
// Direction: "Upscale café — aged parchment, dark espresso, burnished brass"
const C = {
  // Core palette
  espresso:    '#1C1008',   // near-black with warmth — primary text, nav bg
  roast:       '#3D2010',   // deep brown — secondary text, icon fills
  clay:        '#7A4528',   // mid-brown — muted text, placeholders
  latte:       '#C8956A',   // warm tan — borders, dividers
  cream:       '#FDF6EC',   // warm off-white — app background
  parchment:   '#F5E9D4',   // slightly deeper cream — card bg, inputs
  vellum:      '#EDD9BC',   // warm tan surface — headers, modals

  // Accent: burnished brass / aged gold
  brass:       '#B5822A',   // primary accent — CTAs, active states
  brassLight:  '#F7EDD8',   // brass tint — badge fills, highlights
  brassBorder: '#DEC07A',   // brass border
  brassGlow:   '#B5822A40', // subtle shadow

  // Status
  sage:        '#3B6E52',   // success green — earthy, not clinical
  sageLight:   '#EBF4EE',
  sageBorder:  '#9FCFB4',

  terracotta:  '#A03020',   // error / occupied — warm red
  tcLight:     '#FAECEA',
  tcBorder:    '#E8A898',

  // Always
  onDark:      '#FDF6EC',   // text on dark/colored bg
}

// ─── Shared token shortcuts ─────────────────────────────────────────────────────
const radius = { xs: 6, sm: 10, md: 14, lg: 18, pill: 100 }

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
  wrap:  { alignItems: 'flex-end' },
  time:  { fontSize: 16, fontWeight: '800', color: C.cream, letterSpacing: 1.5 },
  secs:  { fontSize: 11, fontWeight: '400', color: C.latte },
  date:  { fontSize: 10, color: C.latte, fontWeight: '500', marginTop: 2, letterSpacing: 0.6 },
})

// ─── Status Banner ──────────────────────────────────────────────────────────────
function StatusBanner({ message, type }: { message: string; type: 'success' | 'error' }) {
  const isSuccess = type === 'success'
  return (
    <View style={[
      bannerStyles.wrap,
      isSuccess ? bannerStyles.success : bannerStyles.error,
    ]}>
      <View style={[bannerStyles.dot, { backgroundColor: isSuccess ? C.sage : C.terracotta }]} />
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
    borderBottomWidth: 1,
  },
  success: { backgroundColor: C.sageLight,     borderBottomColor: C.sageBorder },
  error:   { backgroundColor: C.tcLight,        borderBottomColor: C.tcBorder },
  dot:     { width: 7, height: 7, borderRadius: 4 },
  text:    { fontSize: 13, fontWeight: '600', color: C.espresso, flex: 1, textAlign: 'center' },
})

// ─── Divider ────────────────────────────────────────────────────────────────────
function Divider() {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 4 }}>
      <View style={{ flex: 1, height: 1, backgroundColor: C.vellum }} />
      <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: C.latte }} />
      <View style={{ flex: 1, height: 1, backgroundColor: C.vellum }} />
    </View>
  )
}

// ─── Section Header ─────────────────────────────────────────────────────────────
function SectionHeader({ icon, title, count }: { icon: string; title: string; count?: number }) {
  return (
    <View style={shStyles.wrap}>
      <View style={shStyles.iconBadge}>
        <Text style={shStyles.icon}>{icon}</Text>
      </View>
      <Text style={shStyles.title}>{title}</Text>
      {count !== undefined && (
        <View style={shStyles.countBadge}>
          <Text style={shStyles.countText}>{count}</Text>
        </View>
      )}
    </View>
  )
}

const shStyles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 14 },
  iconBadge: {
    width: 28, height: 28, borderRadius: radius.sm,
    backgroundColor: C.brassLight,
    borderWidth: 1, borderColor: C.brassBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  icon:  { fontSize: 13 },
  title: {
    fontSize: 11, fontWeight: '800', color: C.clay,
    textTransform: 'uppercase', letterSpacing: 1.4, flex: 1,
  },
  countBadge: {
    backgroundColor: C.brassLight,
    borderRadius: radius.pill,
    paddingHorizontal: 9, paddingVertical: 3,
    borderWidth: 1, borderColor: C.brassBorder,
  },
  countText: { fontSize: 11, fontWeight: '700', color: C.brass },
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
  const [customerName, setCustomerName]       = useActiveTabState<string>('customerName', '', true)
  const [paymentMethod, setPaymentMethod]     = useActiveTabState<string>('paymentMethod', 'cash', true)
  const [searchTerm, setSearchTerm]           = useActiveTabState<string>('searchTerm', '', true)
  const [selectedCategory, setSelectedCategory] = useActiveTabState<string>('selectedCategory', 'all', true)
  const [showSuccessMessage, setShowSuccessMessage] = useState<string | null>(null)
  const [showErrorMessage, setShowErrorMessage]     = useState<string | null>(null)
  const [showPaymentModal, setShowPaymentModal]     = useState(false)
  const [showSplitTicketModal, setShowSplitTicketModal] = useState(false)
  const [shouldGenerateTicket, setShouldGenerateTicket] = useState(false)
  const [activeTab, setActiveTab] = useState<'tables' | 'products' | 'cart'>('products')

  const { data: products = [],   isLoading: loadingProducts }   = useQuery({ queryKey: ['products'],   queryFn: productsService.getProducts })
  const { data: categories = [], isLoading: loadingCategories } = useQuery<Category[]>({ queryKey: ['categories'], queryFn: categoryService.getCategories })
  const { data: tables = [],     isLoading: loadingTables }     = useQuery<TableData[]>({
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
    queryFn: () => selectedTable ? tablesService.getTableCart(selectedTable.id) : null,
    enabled: !!selectedTable,
    retry: 1,
  })

  const cartHook     = useCart(selectedTable, products as any, categories)
  const tablesHook   = useTables()
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
    const taxGroups = new Map<string, { rate: number; name: string; amount: number }>()
    cartItems.forEach(item => {
      const rate = 0
      const key = `${rate}`
      if (taxGroups.has(key)) taxGroups.get(key)!.amount += item.total_price
      else taxGroups.set(key, { rate, name: `${getTaxName()} ${rate}%`, amount: item.total_price })
    })
    return Array.from(taxGroups.values()).map(group => ({
      tax_rate_id: `rate-${group.rate}`,
      tax_rate_name: group.name,
      rate: group.rate,
      taxable_amount: group.amount,
      tax_amount: calculateTax(group.amount, undefined, categories),
    }))
  }

  const getCartTax          = () => getCartTaxBreakdown().reduce((sum, b) => sum + b.tax_amount, 0)
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
      <View style={s.loading}>
        <View style={s.loadingCard}>
          <View style={s.loadingIcon}>
            <Utensils size={26} color={C.brass} />
          </View>
          <ActivityIndicator size="large" color={C.brass} style={{ marginTop: 20 }} />
          <Text style={s.loadingTitle}>Yammy Fresh</Text>
          <Text style={s.loadingText}>Preparing your workspace…</Text>
        </View>
      </View>
    )
  }

  // ── Helpers ──
  const enrichedProducts: ProductDisplay[] = (products || []).map((product: any) => {
    const category  = categories.find(c => c.id === product.category_id)
    const taxAmount = calculateTax(product.price || 0, product.category_id, categories)
    return {
      ...product,
      category_name:  category?.name,
      tax_rate:       0,
      tax_amount:     taxAmount,
      total_with_tax: (product.price || 0) + taxAmount,
    }
  })

  const getCategoryColor = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId)
    return category?.color || C.brass
  }

  const addToCart = (product: ProductDisplay) => {
    cartHook.addToCart(product)
    setShowSuccessMessage(`${product.name} added`)
    setTimeout(() => setShowSuccessMessage(null), 2000)
  }

  const removeFromCart  = (productId: string) => cartHook.removeFromCart(productId)
  const updateQuantity  = (productId: string, quantity: number) => cartHook.updateQuantity(productId, quantity)

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
    } catch {
      setShowErrorMessage('Payment failed. Please try again.')
      setTimeout(() => setShowErrorMessage(null), 5000)
    }
  }

  const filteredProducts = enrichedProducts?.filter(product => {
    const matchesCategory = selectedCategory === 'all' || (product as any).category_id === selectedCategory
    const matchesSearch   = (product as any).name?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const tabOptions = [
    { id: 'tables',   name: 'Tables',  icon: Grid3x3 },
    { id: 'products', name: 'Menu',    icon: Coffee },
    { id: 'cart',     name: 'Cart',    icon: ShoppingCart },
  ]

  const freeTablesCount     = tables.filter(t => t.status === 'free').length
  const occupiedTablesCount = tables.filter(t => t.status !== 'free').length

  // ── Render ──
  return (
    <View style={s.root}>

      {/* ── Header ── */}
      <View style={s.header}>
        <View style={s.headerTop}>

          {/* Brand */}
          <View style={s.brand}>
            <View style={s.logoBadge}>
              <Utensils size={18} color={C.cream} />
            </View>
            <View>
              <Text style={s.brandName}>Yammy Fresh</Text>
              <Text style={s.brandSub}>Point of Sale</Text>
            </View>
          </View>

          {/* Right: clock + clear */}
          <View style={s.headerRight}>
            <LiveClock />
            {cartItems.length > 0 && (
              <TouchableOpacity style={s.clearBtn} onPress={clearCart} activeOpacity={0.8}>
                <Trash2 size={12} color={C.cream} />
                <Text style={s.clearBtnText}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Context strip */}
        <View style={s.contextStrip}>
          <View style={[s.contextBadge, selectedTable ? s.ctxTable : s.ctxDirect]}>
            <Text style={s.contextEmoji}>{selectedTable ? '🪑' : '🛒'}</Text>
            <Text style={s.contextText}>
              {selectedTable
                ? `Table ${selectedTable.number ?? selectedTable.id} — ${selectedTable.name}`
                : 'Direct Sale'}
            </Text>
          </View>
          <View style={s.onlinePill}>
            <View style={s.onlineDot} />
            <Text style={s.onlineText}>Online</Text>
          </View>
        </View>

        {/* Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.tabsScroll}>
          <View style={s.tabsRow}>
            {tabOptions.map((tab) => {
              const Icon     = tab.icon
              const isActive = activeTab === tab.id
              return (
                <TouchableOpacity
                  key={tab.id}
                  style={[s.tab, isActive && s.tabActive]}
                  onPress={() => setActiveTab(tab.id as any)}
                  activeOpacity={0.75}
                >
                  <Icon size={14} color={isActive ? C.brass : C.latte} />
                  <Text style={[s.tabText, isActive && s.tabTextActive]}>{tab.name}</Text>
                  {tab.id === 'cart' && cartItems.length > 0 && (
                    <View style={s.badge}>
                      <Text style={s.badgeText}>{cartItems.length}</Text>
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
      {showErrorMessage   && <StatusBanner message={showErrorMessage}   type="error"   />}

      {/* ── Content ── */}
      <ScrollView style={s.content} contentContainerStyle={s.contentInner} showsVerticalScrollIndicator={false}>

        {/* ── TABLES TAB ── */}
        {activeTab === 'tables' && (
          <View style={s.tabContent}>

            {/* Stats */}
            <View style={s.statsRow}>
              {[
                { num: freeTablesCount,     label: 'Free',     color: C.sage,       border: C.sageBorder },
                { num: occupiedTablesCount, label: 'Occupied', color: C.terracotta, border: C.tcBorder },
                { num: tables.length,       label: 'Total',    color: C.brass,      border: C.brassBorder },
              ].map(({ num, label, color, border }) => (
                <View key={label} style={[s.statCard, { borderColor: border }]}>
                  <Text style={[s.statNumber, { color }]}>{num}</Text>
                  <Text style={s.statLabel}>{label}</Text>
                </View>
              ))}
            </View>

            {/* Direct sale */}
            <TouchableOpacity
              style={s.directSaleBtn}
              onPress={() => { setSelectedTable(null); setActiveTab('products') }}
              activeOpacity={0.85}
            >
              <ShoppingCart size={16} color={C.cream} />
              <Text style={s.directSaleText}>Direct Sale — No Table</Text>
            </TouchableOpacity>

            <SectionHeader icon="🪑" title="Select Table" count={tables.length} />

            <View style={s.tablesGrid}>
              {tables.map((table) => {
                const isFree     = table.status === 'free'
                const isSelected = selectedTable?.id === table.id
                return (
                  <TouchableOpacity
                    key={table.id}
                    style={[
                      s.tableCard,
                      isSelected        && s.tableCardActive,
                      !isFree           && s.tableCardOccupied,
                    ]}
                    onPress={() => { setSelectedTable(table); setActiveTab('products') }}
                    activeOpacity={0.8}
                  >
                    <Text style={[s.tableNumber, isSelected && { color: C.cream }]}>
                      {table.number}
                    </Text>
                    <Text style={[s.tableName, isSelected && { color: C.onDark }]}>
                      {table.name}
                    </Text>
                    <View style={[
                      s.tableStatusBadge,
                      { backgroundColor: isFree ? C.sageLight : C.tcLight },
                    ]}>
                      <View style={[s.tableStatusDot, { backgroundColor: isFree ? C.sage : C.terracotta }]} />
                      <Text style={[s.tableStatusText, { color: isFree ? C.sage : C.terracotta }]}>
                        {isFree ? 'Free' : 'Occupied'}
                      </Text>
                    </View>
                    <Text style={[s.tableCapacity, isSelected && { color: 'rgba(253,246,236,0.6)' }]}>
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
          <View style={s.tabContent}>

            {/* Search */}
            <View style={s.searchCard}>
              <Text style={{ fontSize: 13, color: C.clay }}>🔍</Text>
              <TextInput
                style={s.searchInput}
                placeholder="Search menu…"
                placeholderTextColor={C.latte}
                value={searchTerm}
                onChangeText={setSearchTerm}
              />
              {searchTerm.length > 0 && (
                <TouchableOpacity onPress={() => setSearchTerm('')}>
                  <Text style={{ fontSize: 13, color: C.latte, padding: 4 }}>✕</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Categories */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={s.categoriesRow}>
                <TouchableOpacity
                  style={[s.categoryBtn, selectedCategory === 'all' && s.categoryBtnActive]}
                  onPress={() => setSelectedCategory('all')}
                >
                  <Text style={[s.categoryBtnText, selectedCategory === 'all' && s.categoryBtnTextActive]}>
                    All Items
                  </Text>
                </TouchableOpacity>
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[s.categoryBtn, selectedCategory === cat.id && s.categoryBtnActive]}
                    onPress={() => setSelectedCategory(cat.id)}
                  >
                    <Text style={[s.categoryBtnText, selectedCategory === cat.id && s.categoryBtnTextActive]}>
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <Text style={s.resultCount}>{filteredProducts.length} items</Text>

            {/* Products grid */}
            <View style={s.productsGrid}>
              {filteredProducts.map((product) => (
                <TouchableOpacity
                  key={product.id}
                  style={s.productCard}
                  onPress={() => addToCart(product)}
                  activeOpacity={0.82}
                >
                  {/* Accent stripe */}
                  <View style={[s.productStripe, { backgroundColor: getCategoryColor(product.category_id) }]} />

                  <View style={[s.productIconWrap, { borderColor: getCategoryColor(product.category_id) + '50' }]}>
                    <Coffee size={20} color={getCategoryColor(product.category_id)} />
                  </View>
                  <Text style={s.productName} numberOfLines={2}>{product.name}</Text>
                  <Text style={s.productCategory}>{product.category_name}</Text>

                  <View style={s.productFooter}>
                    <Text style={s.productPrice}>NPR {product.price}</Text>
                    <View style={[
                      s.productStockBadge,
                      { backgroundColor: (product.stock_quantity || 0) > 5 ? C.sageLight : C.tcLight },
                    ]}>
                      <Text style={[
                        s.productStockText,
                        { color: (product.stock_quantity || 0) > 5 ? C.sage : C.terracotta },
                      ]}>
                        {product.stock_quantity || 0}
                      </Text>
                    </View>
                  </View>

                  {/* Add button */}
                  <View style={s.productAddBtn}>
                    <Text style={s.productAddText}>+</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* ── CART TAB ── */}
        {activeTab === 'cart' && (
          <View style={s.tabContent}>
            {cartItems.length === 0 ? (
              <View style={s.emptyCart}>
                <View style={s.emptyCartIcon}>
                  <ShoppingCart size={32} color={C.latte} />
                </View>
                <Text style={s.emptyCartText}>Your cart is empty</Text>
                <Text style={s.emptyCartSub}>Browse the menu and add items</Text>
                <TouchableOpacity style={s.browseBtn} onPress={() => setActiveTab('products')}>
                  <Text style={s.browseBtnText}>Browse Menu</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <SectionHeader icon="🛒" title="Order Items" count={cartItems.length} />

                {cartItems.map((item) => (
                  <View key={item.product_id} style={s.cartItemCard}>
                    <View style={s.cartItemHeader}>
                      <View style={s.cartItemIconWrap}>
                        <Coffee size={13} color={C.brass} />
                      </View>
                      <Text style={s.cartItemName} numberOfLines={1}>{item.product_name}</Text>
                      <TouchableOpacity style={s.removeBtn} onPress={() => removeFromCart(item.product_id)}>
                        <Trash2 size={13} color={C.terracotta} />
                      </TouchableOpacity>
                    </View>

                    <Text style={s.cartItemMeta}>{item.quantity}× @ NPR {item.unit_price}</Text>

                    <View style={s.cartItemFooter}>
                      <View style={s.qtyControls}>
                        <TouchableOpacity
                          style={s.qtyBtn}
                          onPress={() => updateQuantity(item.product_id, Math.max(1, item.quantity - 1))}
                        >
                          <Minus size={12} color={C.roast} />
                        </TouchableOpacity>
                        <Text style={s.qtyText}>{item.quantity}</Text>
                        <TouchableOpacity
                          style={s.qtyBtn}
                          onPress={() => updateQuantity(item.product_id, item.quantity + 1)}
                        >
                          <Plus size={12} color={C.roast} />
                        </TouchableOpacity>
                      </View>
                      <Text style={s.cartItemPrice}>NPR {item.total_price}</Text>
                    </View>
                  </View>
                ))}

                {/* Summary */}
                <View style={s.summaryCard}>
                  <Text style={s.summaryTitle}>Order Summary</Text>
                  <Divider />
                  <View style={s.summaryRow}>
                    <Text style={s.summaryLabel}>Subtotal</Text>
                    <Text style={s.summaryValue}>NPR {cartTotal.toFixed(2)}</Text>
                  </View>
                  <View style={s.summaryRow}>
                    <Text style={s.summaryLabel}>Tax</Text>
                    <Text style={s.summaryValue}>NPR {getCartTax().toFixed(2)}</Text>
                  </View>
                  <Divider />
                  <View style={s.summaryRowTotal}>
                    <Text style={s.summaryLabelTotal}>Total</Text>
                    <Text style={s.summaryValueTotal}>NPR {getCartTotalWithTax().toFixed(2)}</Text>
                  </View>
                </View>

                {/* Actions */}
                <View style={s.actionsRow}>
                  <TouchableOpacity style={s.payBtn} onPress={() => setShowPaymentModal(true)} activeOpacity={0.85}>
                    <CreditCard size={17} color={C.cream} />
                    <Text style={s.payBtnText}>Pay Now</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.splitBtn} onPress={() => setShowSplitTicketModal(true)} activeOpacity={0.85}>
                    <Text style={s.splitBtnText}>✂️  Split</Text>
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
const s = StyleSheet.create({

  // ── Root / Loading ──
  root:    { flex: 1, backgroundColor: C.cream },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.cream, padding: 24 },
  loadingCard: {
    backgroundColor: C.parchment,
    borderRadius: radius.lg,
    padding: 36,
    alignItems: 'center',
    width: '78%',
    borderWidth: 1.5,
    borderColor: C.vellum,
    shadowColor: C.espresso,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
  loadingIcon: {
    width: 58, height: 58, borderRadius: radius.md,
    backgroundColor: C.brassLight,
    borderWidth: 1.5, borderColor: C.brassBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  loadingTitle: { fontSize: 20, fontWeight: '800', color: C.espresso, marginTop: 14, letterSpacing: 0.4 },
  loadingText:  { fontSize: 13, color: C.clay, marginTop: 4, letterSpacing: 0.2 },

  // ── Header ──
  // Dark espresso header for strong contrast — premium feel
  header: {
    backgroundColor: C.espresso,
    paddingTop: 52,
    paddingHorizontal: 16,
    paddingBottom: 0,
    shadowColor: C.espresso,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  logoBadge: {
    width: 40, height: 40, borderRadius: radius.sm,
    backgroundColor: C.brass,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: C.brass,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 3,
  },
  brandName: { fontSize: 17, fontWeight: '900', color: C.cream, letterSpacing: 0.6 },
  brandSub:  { fontSize: 10, color: C.latte,  fontWeight: '500', letterSpacing: 0.8, marginTop: 1 },

  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  clearBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: C.terracotta,
    paddingHorizontal: 11, paddingVertical: 7,
    borderRadius: radius.pill,
  },
  clearBtnText: { color: C.cream, fontSize: 11, fontWeight: '700', letterSpacing: 0.2 },

  // ── Context Strip ──
  contextStrip: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 12,
  },
  contextBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: radius.sm, borderWidth: 1,
  },
  ctxTable:  { backgroundColor: '#2A1A05', borderColor: C.brassBorder },
  ctxDirect: { backgroundColor: '#200D08', borderColor: C.tcBorder },
  contextEmoji: { fontSize: 12 },
  contextText:  { fontSize: 12, fontWeight: '600', color: C.cream, letterSpacing: 0.1 },
  onlinePill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#0E2218',
    borderRadius: radius.pill,
    paddingHorizontal: 9, paddingVertical: 4,
    borderWidth: 1, borderColor: C.sageBorder,
  },
  onlineDot:  { width: 6, height: 6, borderRadius: 3, backgroundColor: C.sage },
  onlineText: { fontSize: 10, fontWeight: '700', color: C.sage },

  // ── Tabs ──
  tabsScroll: { marginTop: 2 },
  tabsRow:    { flexDirection: 'row', gap: 0, paddingBottom: 0 },
  tab: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 18, paddingVertical: 12,
    borderBottomWidth: 2.5, borderBottomColor: 'transparent',
  },
  tabActive:      { borderBottomColor: C.brass },
  tabText:        { fontSize: 13, fontWeight: '500', color: C.latte },
  tabTextActive:  { color: C.cream, fontWeight: '800' },
  badge: {
    backgroundColor: C.brass,
    borderRadius: radius.pill,
    paddingHorizontal: 6, paddingVertical: 1,
  },
  badgeText: { color: C.cream, fontSize: 9, fontWeight: '900' },

  // ── Content ──
  content:      { flex: 1 },
  contentInner: { padding: 16, paddingBottom: 48 },
  tabContent:   { gap: 14 },

  // ── Stats ──
  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: {
    flex: 1,
    backgroundColor: C.parchment,
    borderRadius: radius.md,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    shadowColor: C.espresso,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statNumber: { fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
  statLabel:  { fontSize: 10, color: C.clay, fontWeight: '600', marginTop: 3, letterSpacing: 0.5 },

  // ── Direct Sale ──
  directSaleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9,
    backgroundColor: C.roast,
    paddingVertical: 15, borderRadius: radius.md,
    borderWidth: 1, borderColor: C.clay,
    shadowColor: C.espresso,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 3,
  },
  directSaleText: { color: C.cream, fontSize: 14, fontWeight: '700', letterSpacing: 0.3 },

  // ── Tables Grid ──
  tablesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  tableCard: {
    backgroundColor: C.parchment,
    borderRadius: radius.md,
    padding: 14,
    width: '47%',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: C.vellum,
    gap: 5,
    shadowColor: C.espresso,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  tableCardActive: {
    backgroundColor: C.roast,
    borderColor: C.brass,
    shadowColor: C.brass,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  tableCardOccupied: { borderColor: C.tcBorder },
  tableNumber: { fontSize: 28, fontWeight: '900', color: C.brass, letterSpacing: -1 },
  tableName:   { fontSize: 12, fontWeight: '600', color: C.roast },
  tableStatusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: radius.pill, marginTop: 2,
  },
  tableStatusDot:  { width: 5, height: 5, borderRadius: 3 },
  tableStatusText: { fontSize: 10, fontWeight: '700' },
  tableCapacity:   { fontSize: 10, color: C.clay, marginTop: 2 },

  // ── Search ──
  searchCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.parchment,
    borderRadius: radius.md,
    paddingHorizontal: 13,
    borderWidth: 1.5, borderColor: C.vellum,
    gap: 8,
    shadowColor: C.espresso,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: C.espresso,
    paddingVertical: 12,
  },

  // ── Categories ──
  categoriesRow: { flexDirection: 'row', gap: 8, paddingVertical: 2 },
  categoryBtn: {
    backgroundColor: C.parchment,
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1.5, borderColor: C.vellum,
  },
  categoryBtnActive:     { backgroundColor: C.roast, borderColor: C.roast },
  categoryBtnText:       { fontSize: 12, fontWeight: '600', color: C.clay },
  categoryBtnTextActive: { color: C.cream },

  // ── Result count ──
  resultCount: { fontSize: 11, color: C.clay, fontWeight: '500', letterSpacing: 0.3 },

  // ── Products Grid ──
  productsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  productCard: {
    backgroundColor: C.parchment,
    borderRadius: radius.md,
    padding: 12,
    width: '47%',
    borderWidth: 1,
    borderColor: C.vellum,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: C.espresso,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  // Thin coloured top stripe per category
  productStripe: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 3,
  },
  productIconWrap: {
    width: 44, height: 44, borderRadius: radius.sm,
    backgroundColor: C.brassLight,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 8, marginTop: 4,
    borderWidth: 1.5,
  },
  productName:     { fontSize: 13, fontWeight: '700', color: C.espresso, marginBottom: 2, lineHeight: 17 },
  productCategory: { fontSize: 10, color: C.clay, marginBottom: 8, letterSpacing: 0.2 },
  productFooter:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  productPrice:    { fontSize: 14, fontWeight: '900', color: C.brass },
  productStockBadge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: radius.xs },
  productStockText:  { fontSize: 10, fontWeight: '700' },
  productAddBtn: {
    position: 'absolute', top: 8, right: 8,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: C.brass,
    alignItems: 'center', justifyContent: 'center',
  },
  productAddText: { color: C.cream, fontSize: 16, fontWeight: '700', lineHeight: 20 },

  // ── Empty Cart ──
  emptyCart:     { alignItems: 'center', paddingVertical: 56, gap: 10 },
  emptyCartIcon: {
    width: 72, height: 72, borderRadius: radius.lg,
    backgroundColor: C.brassLight,
    borderWidth: 1.5, borderColor: C.brassBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  emptyCartText: { fontSize: 17, fontWeight: '800', color: C.espresso },
  emptyCartSub:  { fontSize: 13, color: C.clay },
  browseBtn: {
    marginTop: 8,
    backgroundColor: C.roast,
    paddingHorizontal: 24, paddingVertical: 12,
    borderRadius: radius.pill,
    borderWidth: 1, borderColor: C.latte,
  },
  browseBtnText: { color: C.cream, fontSize: 13, fontWeight: '700', letterSpacing: 0.2 },

  // ── Cart Items ──
  cartItemCard: {
    backgroundColor: C.parchment,
    borderRadius: radius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: C.vellum,
    shadowColor: C.espresso,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  cartItemHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 5 },
  cartItemIconWrap: {
    width: 26, height: 26, borderRadius: radius.xs,
    backgroundColor: C.brassLight,
    borderWidth: 1, borderColor: C.brassBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  cartItemName: { fontSize: 14, fontWeight: '700', color: C.espresso, flex: 1 },
  removeBtn: {
    width: 28, height: 28, borderRadius: radius.xs,
    backgroundColor: C.tcLight,
    borderWidth: 1, borderColor: C.tcBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  cartItemMeta:   { fontSize: 11, color: C.clay, marginBottom: 10, marginLeft: 34, letterSpacing: 0.1 },
  cartItemFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  qtyControls:    { flexDirection: 'row', alignItems: 'center', gap: 10 },
  qtyBtn: {
    backgroundColor: C.cream,
    width: 30, height: 30, borderRadius: radius.xs,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: C.vellum,
  },
  qtyText:       { fontSize: 15, fontWeight: '800', color: C.espresso, minWidth: 22, textAlign: 'center' },
  cartItemPrice: { fontSize: 15, fontWeight: '900', color: C.brass },

  // ── Summary ──
  summaryCard: {
    backgroundColor: C.parchment,
    borderRadius: radius.md,
    padding: 16,
    borderWidth: 1.5,
    borderColor: C.brassBorder,
    shadowColor: C.brass,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  summaryTitle:      { fontSize: 10, fontWeight: '800', color: C.clay, textTransform: 'uppercase', letterSpacing: 1.4, marginBottom: 10 },
  summaryRow:        { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  summaryRowTotal:   { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 },
  summaryLabel:      { fontSize: 13, color: C.clay },
  summaryValue:      { fontSize: 13, fontWeight: '600', color: C.roast },
  summaryLabelTotal: { fontSize: 16, fontWeight: '800', color: C.espresso },
  summaryValueTotal: { fontSize: 19, fontWeight: '900', color: C.brass },

  // ── Actions ──
  actionsRow: { flexDirection: 'row', gap: 12 },
  payBtn: {
    flex: 2,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: C.brass,
    paddingVertical: 15, borderRadius: radius.md,
    shadowColor: C.brass,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  payBtnText: { color: C.cream, fontSize: 15, fontWeight: '800', letterSpacing: 0.3 },
  splitBtn: {
    flex: 1,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.sageLight,
    paddingVertical: 15, borderRadius: radius.md,
    borderWidth: 1.5, borderColor: C.sageBorder,
  },
  splitBtnText: { color: C.sage, fontSize: 13, fontWeight: '700' },
})