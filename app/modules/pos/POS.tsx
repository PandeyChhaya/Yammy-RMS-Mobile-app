import AsyncStorage from '@react-native-async-storage/async-storage'
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
  View
} from 'react-native'

import { authService } from '../auth/services/auth.service'
import { ordersService } from '../orders/services/orderService'
import categoriesService from './services/categoriesService'
import menuItemsService from './services/menuItemService'
import tableService from './services/tablesService'




interface Category {
  category_id: number
  category_name: string
  category_description: string
}

interface MenuItem {
  menu_items_id: number
  menu_items_name: string
  slug: string
  price: number
  menu_items_category_id: number
  menu_items_description: string
  image_url: string
}

interface Table {
  table_id: number
  table_number: string
  floor: string
  capacity: number
  table_status: string
}

interface CartItem {
  menu_item_id: number
  name: string
  price: number
  quantity: number
  subtotal: number
}



const C = {
  espresso:    '#1C1008',
  roast:       '#3D2010',
  clay:        '#7A4528',
  latte:       '#C8956A',
  cream:       '#FDF6EC',
  parchment:   '#F5E9D4',
  vellum:      '#EDD9BC',
  brass:       '#B5822A',
  brassLight:  '#F7EDD8',
  brassBorder: '#DEC07A',
  brassGlow:   '#B5822A40',
  sage:        '#3B6E52',
  sageLight:   '#EBF4EE',
  sageBorder:  '#9FCFB4',
  terracotta:  '#A03020',
  tcLight:     '#FAECEA',
  tcBorder:    '#E8A898',
  onDark:      '#FDF6EC',
}

const radius = { xs: 6, sm: 10, md: 14, lg: 18, pill: 100 }



function LiveClock() {
  const [time, setTime] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])
  const pad = (n: number) => n.toString().padStart(2, '0')
  const hh   = pad(time.getHours())
  const mm   = pad(time.getMinutes())
  const ss   = pad(time.getSeconds())
  const date = time.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  return (
    <View style={clockStyles.wrap}>
      <Text style={clockStyles.time}>{hh}:{mm}<Text style={clockStyles.secs}>:{ss}</Text></Text>
      <Text style={clockStyles.date}>{date}</Text>
    </View>
  )
}

const clockStyles = StyleSheet.create({
  wrap: { alignItems: 'flex-end' },
  time: { fontSize: 16, fontWeight: '800', color: C.cream, letterSpacing: 1.5 },
  secs: { fontSize: 11, fontWeight: '400', color: C.latte },
  date: { fontSize: 10, color: C.latte, fontWeight: '500', marginTop: 2, letterSpacing: 0.6 },
})

function StatusBanner({ message, type }: { message: string; type: 'success' | 'error' }) {
  const isSuccess = type === 'success'
  return (
    <View style={[bannerStyles.wrap, isSuccess ? bannerStyles.success : bannerStyles.error]}>
      <View style={[bannerStyles.dot, { backgroundColor: isSuccess ? C.sage : C.terracotta }]} />
      <Text style={bannerStyles.text}>{message}</Text>
    </View>
  )
}

const bannerStyles = StyleSheet.create({
  wrap:    { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, paddingHorizontal: 20, borderBottomWidth: 1 },
  success: { backgroundColor: C.sageLight, borderBottomColor: C.sageBorder },
  error:   { backgroundColor: C.tcLight,   borderBottomColor: C.tcBorder },
  dot:     { width: 7, height: 7, borderRadius: 4 },
  text:    { fontSize: 13, fontWeight: '600', color: C.espresso, flex: 1, textAlign: 'center' },
})

function Divider() {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 4 }}>
      <View style={{ flex: 1, height: 1, backgroundColor: C.vellum }} />
      <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: C.latte }} />
      <View style={{ flex: 1, height: 1, backgroundColor: C.vellum }} />
    </View>
  )
}

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
  wrap:       { flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 14 },
  iconBadge:  { width: 28, height: 28, borderRadius: radius.sm, backgroundColor: C.brassLight, borderWidth: 1, borderColor: C.brassBorder, alignItems: 'center', justifyContent: 'center' },
  icon:       { fontSize: 13 },
  title:      { fontSize: 11, fontWeight: '800', color: C.clay, textTransform: 'uppercase', letterSpacing: 1.4, flex: 1 },
  countBadge: { backgroundColor: C.brassLight, borderRadius: radius.pill, paddingHorizontal: 9, paddingVertical: 3, borderWidth: 1, borderColor: C.brassBorder },
  countText:  { fontSize: 11, fontWeight: '700', color: C.brass },
})



export default function POS() {

  const [categories,  setCategories]  = useState<Category[]>([])
  const [menuItems,   setMenuItems]   = useState<MenuItem[]>([])
  const [tables,      setTables]      = useState<Table[]>([])
  const [loading,     setLoading]     = useState(true)

 
  const [selectedTable,    setSelectedTable]    = useState<Table | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchTerm,       setSearchTerm]       = useState('')
  const [activeTab,        setActiveTab]        = useState<'tables' | 'products' | 'cart'>('products')
  const [cart,             setCart]             = useState<CartItem[]>([])
  const [isPlacingOrder,   setIsPlacingOrder]   = useState(false)
  const [successMessage,   setSuccessMessage]   = useState<string | null>(null)
  const [errorMessage,     setErrorMessage]     = useState<string | null>(null)


  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [cats, items, tbls] = await Promise.all([
        categoriesService.getCategory(),
        menuItemsService.getMenuItem(),
        tableService.getTable(),
      ])
      setCategories(cats)
      setMenuItems(items)
      setTables(tbls)
    } catch (err) {
      showError('Failed to load data. Check your connection.')
    } finally {
      setLoading(false)
    }
  }

 
  const showSuccess = (msg: string) => {
    setSuccessMessage(msg)
    setTimeout(() => setSuccessMessage(null), 2500)
  }

  const showError = (msg: string) => {
    setErrorMessage(msg)
    setTimeout(() => setErrorMessage(null), 3500)
  }

  
  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(c => c.menu_item_id === item.menu_items_id)
      if (existing) {
        return prev.map(c =>
          c.menu_item_id === item.menu_items_id
            ? { ...c, quantity: c.quantity + 1, subtotal: (c.quantity + 1) * c.price }
            : c
        )
      }
      return [...prev, {
        menu_item_id: item.menu_items_id,
        name:         item.menu_items_name,
        price:        item.price,
        quantity:     1,
        subtotal:     item.price,
      }]
    })
    showSuccess(`${item.menu_items_name} added to cart`)
  }

  const removeFromCart = (menu_item_id: number) => {
    setCart(prev => prev.filter(c => c.menu_item_id !== menu_item_id))
  }

  const updateQuantity = (menu_item_id: number, qty: number) => {
    if (qty < 1) return
    setCart(prev =>
      prev.map(c =>
        c.menu_item_id === menu_item_id
          ? { ...c, quantity: qty, subtotal: qty * c.price }
          : c
      )
    )
  }

  const clearCart = () => {
    setCart([])
    showSuccess('Cart cleared')
  }

  const cartTotal = cart.reduce((sum, item) => sum + item.subtotal, 0)

  
  const handlePlaceOrder = async () => {
    if (cart.length === 0) {
      showError('Cart is empty')
      return
    }

    try {
      setIsPlacingOrder(true)

      const userId = await AsyncStorage.getItem('@userId')

     
      const orderPayload = {
        table_id:      selectedTable ? selectedTable.table_id : null,
        user_id:       userId ? parseInt(userId) : 1,
        order_type:    selectedTable ? 'dine-in' : 'direct',
        order_status:  'pending',
        special_notes: '',
        total_amount:  cartTotal,
      }

      const newOrder = await ordersService.postOrder(orderPayload)

      
      const BASE_URL  = 'http://192.168.1.71:5000/api/order-items'
      const token     = await authService.getToken()
      const headers   = {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${token}`,
      }

      await Promise.all(
        cart.map(item =>
          fetch(BASE_URL, {
            method:  'POST',
            headers,
            body: JSON.stringify({
              order_id:          newOrder.order_id,
              menu_item_id:      item.menu_item_id,
              quantity:          item.quantity,
              unit_price:        item.price,
              subtotal:          item.subtotal,
              special_request:   '',
              order_item_status: 'pending',
            }),
          })
        )
      )

      setCart([])
      setSelectedTable(null)
      setActiveTab('products')
      showSuccess(`Order #${newOrder.order_id} placed successfully!`)

    } catch (err: any) {
      showError(err?.message || 'Failed to place order. Try again.')
    } finally {
      setIsPlacingOrder(false)
    }
  }

  
  const filteredItems = menuItems.filter(item => {
    const matchCat    = selectedCategory === 'all' || item.menu_items_category_id === parseInt(selectedCategory)
    const matchSearch = item.menu_items_name.toLowerCase().includes(searchTerm.toLowerCase())
    return matchCat && matchSearch
  })

  
  const freeTables     = tables.filter(t => t.table_status === 'available' || t.table_status === 'free').length
  const occupiedTables = tables.filter(t => t.table_status !== 'available' && t.table_status !== 'free').length

  
  const tabOptions = [
    { id: 'tables',   name: 'Tables',  icon: Grid3x3 },
    { id: 'products', name: 'Menu',    icon: Coffee },
    { id: 'cart',     name: 'Cart',    icon: ShoppingCart },
  ]

 
  if (loading) {
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

 
  return (
    <View style={s.root}>

  
      <View style={s.header}>
        <View style={s.headerTop}>
          <View style={s.brand}>
            <View style={s.logoBadge}>
              <Utensils size={18} color={C.cream} />
            </View>
            <View>
              <Text style={s.brandName}>Yammy Fresh</Text>
              <Text style={s.brandSub}>Point of Sale</Text>
            </View>
          </View>
          <View style={s.headerRight}>
            <LiveClock />
            {cart.length > 0 && (
              <TouchableOpacity style={s.clearBtn} onPress={clearCart} activeOpacity={0.8}>
                <Trash2 size={12} color={C.cream} />
                <Text style={s.clearBtnText}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

       
        <View style={s.contextStrip}>
          <View style={[s.contextBadge, selectedTable ? s.ctxTable : s.ctxDirect]}>
            <Text style={s.contextEmoji}>{selectedTable ? '🪑' : '🛒'}</Text>
            <Text style={s.contextText}>
              {selectedTable
                ? `Table ${selectedTable.table_number} — Floor ${selectedTable.floor}`
                : 'Direct Sale'}
            </Text>
          </View>
          <View style={s.onlinePill}>
            <View style={s.onlineDot} />
            <Text style={s.onlineText}>Online</Text>
          </View>
        </View>

        
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
                  {tab.id === 'cart' && cart.length > 0 && (
                    <View style={s.badge}>
                      <Text style={s.badgeText}>{cart.length}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              )
            })}
          </View>
        </ScrollView>
      </View>

      
      {successMessage && <StatusBanner message={successMessage} type="success" />}
      {errorMessage   && <StatusBanner message={errorMessage}   type="error"   />}

     
      <ScrollView style={s.content} contentContainerStyle={s.contentInner} showsVerticalScrollIndicator={false}>

        
        {activeTab === 'tables' && (
          <View style={s.tabContent}>

            
            <View style={s.statsRow}>
              {[
                { num: freeTables,     label: 'Free',     color: C.sage,       border: C.sageBorder },
                { num: occupiedTables, label: 'Occupied', color: C.terracotta, border: C.tcBorder },
                { num: tables.length,  label: 'Total',    color: C.brass,      border: C.brassBorder },
              ].map(({ num, label, color, border }) => (
                <View key={label} style={[s.statCard, { borderColor: border }]}>
                  <Text style={[s.statNumber, { color }]}>{num}</Text>
                  <Text style={s.statLabel}>{label}</Text>
                </View>
              ))}
            </View>

            
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
                const isFree     = table.table_status === 'available' || table.table_status === 'free'
                const isSelected = selectedTable?.table_id === table.table_id
                return (
                  <TouchableOpacity
                    key={table.table_id}
                    style={[s.tableCard, isSelected && s.tableCardActive, !isFree && s.tableCardOccupied]}
                    onPress={() => { setSelectedTable(table); setActiveTab('products') }}
                    activeOpacity={0.8}
                  >
                    <Text style={[s.tableNumber, isSelected && { color: C.cream }]}>
                      {table.table_number}
                    </Text>
                    <Text style={[s.tableName, isSelected && { color: C.onDark }]}>
                      Floor {table.floor}
                    </Text>
                    <View style={[s.tableStatusBadge, { backgroundColor: isFree ? C.sageLight : C.tcLight }]}>
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

      
        {activeTab === 'products' && (
          <View style={s.tabContent}>

           
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
                    key={cat.category_id}
                    style={[s.categoryBtn, selectedCategory === String(cat.category_id) && s.categoryBtnActive]}
                    onPress={() => setSelectedCategory(String(cat.category_id))}
                  >
                    <Text style={[s.categoryBtnText, selectedCategory === String(cat.category_id) && s.categoryBtnTextActive]}>
                      {cat.category_name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <Text style={s.resultCount}>{filteredItems.length} items</Text>

            <View style={s.productsGrid}>
              {filteredItems.map((item) => (
                <TouchableOpacity
                  key={item.menu_items_id}
                  style={s.productCard}
                  onPress={() => addToCart(item)}
                  activeOpacity={0.82}
                >
                  <View style={[s.productStripe, { backgroundColor: C.brass }]} />
                  <View style={s.productIconWrap}>
                    <Coffee size={20} color={C.brass} />
                  </View>
                  <Text style={s.productName} numberOfLines={2}>{item.menu_items_name}</Text>
                  <Text style={s.productCategory}>
                    {categories.find(c => c.category_id === item.menu_items_category_id)?.category_name || '—'}
                  </Text>
                  <View style={s.productFooter}>
                    <Text style={s.productPrice}>NPR {item.price}</Text>
                  </View>
                  <View style={s.productAddBtn}>
                    <Text style={s.productAddText}>+</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        
        {activeTab === 'cart' && (
          <View style={s.tabContent}>
            {cart.length === 0 ? (
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
                <SectionHeader icon="🛒" title="Order Items" count={cart.length} />

                {cart.map((item) => (
                  <View key={item.menu_item_id} style={s.cartItemCard}>
                    <View style={s.cartItemHeader}>
                      <View style={s.cartItemIconWrap}>
                        <Coffee size={13} color={C.brass} />
                      </View>
                      <Text style={s.cartItemName} numberOfLines={1}>{item.name}</Text>
                      <TouchableOpacity style={s.removeBtn} onPress={() => removeFromCart(item.menu_item_id)}>
                        <Trash2 size={13} color={C.terracotta} />
                      </TouchableOpacity>
                    </View>

                    <Text style={s.cartItemMeta}>{item.quantity}× @ NPR {item.price}</Text>

                    <View style={s.cartItemFooter}>
                      <View style={s.qtyControls}>
                        <TouchableOpacity
                          style={s.qtyBtn}
                          onPress={() => updateQuantity(item.menu_item_id, item.quantity - 1)}
                        >
                          <Minus size={12} color={C.roast} />
                        </TouchableOpacity>
                        <Text style={s.qtyText}>{item.quantity}</Text>
                        <TouchableOpacity
                          style={s.qtyBtn}
                          onPress={() => updateQuantity(item.menu_item_id, item.quantity + 1)}
                        >
                          <Plus size={12} color={C.roast} />
                        </TouchableOpacity>
                      </View>
                      <Text style={s.cartItemPrice}>NPR {item.subtotal}</Text>
                    </View>
                  </View>
                ))}

                
                <View style={s.summaryCard}>
                  <Text style={s.summaryTitle}>Order Summary</Text>
                  <Divider />
                  <View style={s.summaryRow}>
                    <Text style={s.summaryLabel}>Items</Text>
                    <Text style={s.summaryValue}>{cart.length}</Text>
                  </View>
                  <Divider />
                  <View style={s.summaryRowTotal}>
                    <Text style={s.summaryLabelTotal}>Total</Text>
                    <Text style={s.summaryValueTotal}>NPR {cartTotal.toFixed(2)}</Text>
                  </View>
                </View>

                
                <TouchableOpacity
                  style={[s.payBtn, isPlacingOrder && { opacity: 0.7 }]}
                  onPress={handlePlaceOrder}
                  activeOpacity={0.85}
                  disabled={isPlacingOrder}
                >
                  {isPlacingOrder
                    ? <ActivityIndicator size="small" color={C.cream} />
                    : <CreditCard size={17} color={C.cream} />
                  }
                  <Text style={s.payBtnText}>
                    {isPlacingOrder ? 'Placing Order…' : 'Place Order'}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  )
}



const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: C.cream },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.cream, padding: 24 },
  loadingCard: {
    backgroundColor: C.parchment, borderRadius: radius.lg, padding: 36,
    alignItems: 'center', width: '78%', borderWidth: 1.5, borderColor: C.vellum,
    shadowColor: C.espresso, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.12, shadowRadius: 24, elevation: 8,
  },
  loadingIcon: {
    width: 58, height: 58, borderRadius: radius.md, backgroundColor: C.brassLight,
    borderWidth: 1.5, borderColor: C.brassBorder, alignItems: 'center', justifyContent: 'center',
  },
  loadingTitle: { fontSize: 20, fontWeight: '800', color: C.espresso, marginTop: 14, letterSpacing: 0.4 },
  loadingText:  { fontSize: 13, color: C.clay, marginTop: 4, letterSpacing: 0.2 },

  header: {
    backgroundColor: C.espresso, paddingTop: 52, paddingHorizontal: 16, paddingBottom: 0,
    shadowColor: C.espresso, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 8,
  },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  brand:     { flexDirection: 'row', alignItems: 'center', gap: 11 },
  logoBadge: {
    width: 40, height: 40, borderRadius: radius.sm, backgroundColor: C.brass,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: C.brass, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.4, shadowRadius: 6, elevation: 3,
  },
  brandName: { fontSize: 17, fontWeight: '900', color: C.cream, letterSpacing: 0.6 },
  brandSub:  { fontSize: 10, color: C.latte, fontWeight: '500', letterSpacing: 0.8, marginTop: 1 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  clearBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: C.terracotta, paddingHorizontal: 11, paddingVertical: 7, borderRadius: radius.pill,
  },
  clearBtnText: { color: C.cream, fontSize: 11, fontWeight: '700', letterSpacing: 0.2 },

  contextStrip: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  contextBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.sm, borderWidth: 1 },
  ctxTable:     { backgroundColor: '#2A1A05', borderColor: C.brassBorder },
  ctxDirect:    { backgroundColor: '#200D08', borderColor: C.tcBorder },
  contextEmoji: { fontSize: 12 },
  contextText:  { fontSize: 12, fontWeight: '600', color: C.cream, letterSpacing: 0.1 },
  onlinePill: {
    flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#0E2218',
    borderRadius: radius.pill, paddingHorizontal: 9, paddingVertical: 4, borderWidth: 1, borderColor: C.sageBorder,
  },
  onlineDot:  { width: 6, height: 6, borderRadius: 3, backgroundColor: C.sage },
  onlineText: { fontSize: 10, fontWeight: '700', color: C.sage },

  tabsScroll: { marginTop: 2 },
  tabsRow:    { flexDirection: 'row', gap: 0, paddingBottom: 0 },
  tab: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 18, paddingVertical: 12,
    borderBottomWidth: 2.5, borderBottomColor: 'transparent',
  },
  tabActive:     { borderBottomColor: C.brass },
  tabText:       { fontSize: 13, fontWeight: '500', color: C.latte },
  tabTextActive: { color: C.cream, fontWeight: '800' },
  badge:         { backgroundColor: C.brass, borderRadius: radius.pill, paddingHorizontal: 6, paddingVertical: 1 },
  badgeText:     { color: C.cream, fontSize: 9, fontWeight: '900' },

  content:      { flex: 1 },
  contentInner: { padding: 16, paddingBottom: 48 },
  tabContent:   { gap: 14 },

  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: {
    flex: 1, backgroundColor: C.parchment, borderRadius: radius.md, padding: 14,
    alignItems: 'center', borderWidth: 1.5,
    shadowColor: C.espresso, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  statNumber: { fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
  statLabel:  { fontSize: 10, color: C.clay, fontWeight: '600', marginTop: 3, letterSpacing: 0.5 },

  directSaleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9,
    backgroundColor: C.roast, paddingVertical: 15, borderRadius: radius.md,
    borderWidth: 1, borderColor: C.clay,
    shadowColor: C.espresso, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.18, shadowRadius: 8, elevation: 3,
  },
  directSaleText: { color: C.cream, fontSize: 14, fontWeight: '700', letterSpacing: 0.3 },

  tablesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  tableCard: {
    backgroundColor: C.parchment, borderRadius: radius.md, padding: 14,
    width: '47%', alignItems: 'center', borderWidth: 1.5, borderColor: C.vellum, gap: 5,
    shadowColor: C.espresso, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  tableCardActive: {
    backgroundColor: C.roast, borderColor: C.brass,
    shadowColor: C.brass, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 8, elevation: 4,
  },
  tableCardOccupied: { borderColor: C.tcBorder },
  tableNumber:       { fontSize: 28, fontWeight: '900', color: C.brass, letterSpacing: -1 },
  tableName:         { fontSize: 12, fontWeight: '600', color: C.roast },
  tableStatusBadge:  { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill, marginTop: 2 },
  tableStatusDot:    { width: 5, height: 5, borderRadius: 3 },
  tableStatusText:   { fontSize: 10, fontWeight: '700' },
  tableCapacity:     { fontSize: 10, color: C.clay, marginTop: 2 },

  searchCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: C.parchment,
    borderRadius: radius.md, paddingHorizontal: 13, borderWidth: 1.5, borderColor: C.vellum, gap: 8,
    shadowColor: C.espresso, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
  },
  searchInput: { flex: 1, fontSize: 14, color: C.espresso, paddingVertical: 12 },

  categoriesRow:         { flexDirection: 'row', gap: 8, paddingVertical: 2 },
  categoryBtn:           { backgroundColor: C.parchment, paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.pill, borderWidth: 1.5, borderColor: C.vellum },
  categoryBtnActive:     { backgroundColor: C.roast, borderColor: C.roast },
  categoryBtnText:       { fontSize: 12, fontWeight: '600', color: C.clay },
  categoryBtnTextActive: { color: C.cream },

  resultCount: { fontSize: 11, color: C.clay, fontWeight: '500', letterSpacing: 0.3 },

  productsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  productCard: {
    backgroundColor: C.parchment, borderRadius: radius.md, padding: 12,
    width: '47%', borderWidth: 1, borderColor: C.vellum, position: 'relative', overflow: 'hidden',
    shadowColor: C.espresso, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  productStripe:   { position: 'absolute', top: 0, left: 0, right: 0, height: 3 },
  productIconWrap: {
    width: 44, height: 44, borderRadius: radius.sm, backgroundColor: C.brassLight,
    alignItems: 'center', justifyContent: 'center', marginBottom: 8, marginTop: 4,
    borderWidth: 1.5, borderColor: C.brassBorder,
  },
  productName:      { fontSize: 13, fontWeight: '700', color: C.espresso, marginBottom: 2, lineHeight: 17 },
  productCategory:  { fontSize: 10, color: C.clay, marginBottom: 8, letterSpacing: 0.2 },
  productFooter:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  productPrice:     { fontSize: 14, fontWeight: '900', color: C.brass },
  productAddBtn:    { position: 'absolute', top: 8, right: 8, width: 22, height: 22, borderRadius: 11, backgroundColor: C.brass, alignItems: 'center', justifyContent: 'center' },
  productAddText:   { color: C.cream, fontSize: 16, fontWeight: '700', lineHeight: 20 },

  emptyCart:     { alignItems: 'center', paddingVertical: 56, gap: 10 },
  emptyCartIcon: {
    width: 72, height: 72, borderRadius: radius.lg, backgroundColor: C.brassLight,
    borderWidth: 1.5, borderColor: C.brassBorder, alignItems: 'center', justifyContent: 'center',
  },
  emptyCartText: { fontSize: 17, fontWeight: '800', color: C.espresso },
  emptyCartSub:  { fontSize: 13, color: C.clay },
  browseBtn: {
    marginTop: 8, backgroundColor: C.roast, paddingHorizontal: 24, paddingVertical: 12,
    borderRadius: radius.pill, borderWidth: 1, borderColor: C.latte,
  },
  browseBtnText: { color: C.cream, fontSize: 13, fontWeight: '700', letterSpacing: 0.2 },

  cartItemCard: {
    backgroundColor: C.parchment, borderRadius: radius.md, padding: 14, borderWidth: 1, borderColor: C.vellum,
    shadowColor: C.espresso, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
  },
  cartItemHeader:  { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 5 },
  cartItemIconWrap: {
    width: 26, height: 26, borderRadius: radius.xs, backgroundColor: C.brassLight,
    borderWidth: 1, borderColor: C.brassBorder, alignItems: 'center', justifyContent: 'center',
  },
  cartItemName:   { fontSize: 14, fontWeight: '700', color: C.espresso, flex: 1 },
  removeBtn:      { width: 28, height: 28, borderRadius: radius.xs, backgroundColor: C.tcLight, borderWidth: 1, borderColor: C.tcBorder, alignItems: 'center', justifyContent: 'center' },
  cartItemMeta:   { fontSize: 11, color: C.clay, marginBottom: 10, marginLeft: 34, letterSpacing: 0.1 },
  cartItemFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  qtyControls:    { flexDirection: 'row', alignItems: 'center', gap: 10 },
  qtyBtn:         { backgroundColor: C.cream, width: 30, height: 30, borderRadius: radius.xs, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: C.vellum },
  qtyText:        { fontSize: 15, fontWeight: '800', color: C.espresso, minWidth: 22, textAlign: 'center' },
  cartItemPrice:  { fontSize: 15, fontWeight: '900', color: C.brass },

  summaryCard: {
    backgroundColor: C.parchment, borderRadius: radius.md, padding: 16, borderWidth: 1.5, borderColor: C.brassBorder,
    shadowColor: C.brass, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 2,
  },
  summaryTitle:      { fontSize: 10, fontWeight: '800', color: C.clay, textTransform: 'uppercase', letterSpacing: 1.4, marginBottom: 10 },
  summaryRow:        { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  summaryRowTotal:   { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 },
  summaryLabel:      { fontSize: 13, color: C.clay },
  summaryValue:      { fontSize: 13, fontWeight: '600', color: C.roast },
  summaryLabelTotal: { fontSize: 16, fontWeight: '800', color: C.espresso },
  summaryValueTotal: { fontSize: 19, fontWeight: '900', color: C.brass },

  payBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: C.brass, paddingVertical: 15, borderRadius: radius.md,
    shadowColor: C.brass, shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.35, shadowRadius: 10, elevation: 4,
  },
  payBtnText: { color: C.cream, fontSize: 15, fontWeight: '800', letterSpacing: 0.3 },
})
