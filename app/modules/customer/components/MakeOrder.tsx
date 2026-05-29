import { useMutation, useQuery } from '@tanstack/react-query'
import { CheckCircle, ChefHat, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react-native'
import { useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { authService } from '../../auth/services/auth.service'
import { ordersService } from '../../orders/services/orderService'

const BASE_URL = 'http://10.78.34.24:5000/api'

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
  sage:        '#3B6E52',
  sageLight:   '#EBF4EE',
  sageBorder:  '#9FCFB4',
  terracotta:  '#A03020',
  tcLight:     '#FAECEA',
  tcBorder:    '#E8A898',
}
const radius = { xs: 6, sm: 10, md: 14, lg: 18, pill: 100 }

interface MenuItem {
  menu_items_id: number
  menu_items_name: string
  price: number
  menu_items_description?: string
  is_available: boolean
  categories?: { category_name: string }
}

interface CartItem {
  menu_item_id: number
  name: string
  price: number
  quantity: number
  special_request?: string
}

export default function MakeOrder() {
  const [cart, setCart]               = useState<CartItem[]>([])
  const [specialNotes, setSpecialNotes] = useState('')
  const [step, setStep]               = useState<'menu' | 'cart' | 'success'>('menu')
  const [search, setSearch]           = useState('')

  const { data: menuItems = [], isLoading } = useQuery<MenuItem[]>({
    queryKey: ['menu-items-customer'],
    queryFn: async () => {
      const token = await authService.getToken()
      const res = await fetch(`${BASE_URL}/menuItems`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      return data.filter((item: MenuItem) => item.is_available)
    },
  })

  const orderMutation = useMutation({
    mutationFn: async () => {
      const order = {
        order_type: 'dine_in',
        order_status: 'pending',
        special_notes: specialNotes,
        items: cart.map(item => ({
          menu_item_id:    item.menu_item_id,
          quantity:        item.quantity,
          unit_price:      item.price,
          subtotal:        item.price * item.quantity,
          special_request: item.special_request || '',
        })),
        subtotal:     cartTotal,
        tax:          cartTotal * 0.13,
        total_amount: cartTotal + cartTotal * 0.13,
        discount:     0,
      }
      return ordersService.postOrder(order as any)
    },
    onSuccess: () => setStep('success'),
    onError:   (err: any) => Alert.alert('Error', err.message),
  })

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const exists = prev.find(c => c.menu_item_id === item.menu_items_id)
      if (exists) {
        return prev.map(c =>
          c.menu_item_id === item.menu_items_id
            ? { ...c, quantity: c.quantity + 1 }
            : c
        )
      }
      return [...prev, {
        menu_item_id: item.menu_items_id,
        name:         item.menu_items_name,
        price:        Number(item.price),
        quantity:     1,
      }]
    })
  }

  const removeFromCart = (menu_item_id: number) => {
    setCart(prev => {
      const exists = prev.find(c => c.menu_item_id === menu_item_id)
      if (exists && exists.quantity > 1) {
        return prev.map(c =>
          c.menu_item_id === menu_item_id
            ? { ...c, quantity: c.quantity - 1 }
            : c
        )
      }
      return prev.filter(c => c.menu_item_id !== menu_item_id)
    })
  }

  const deleteFromCart = (menu_item_id: number) => {
    setCart(prev => prev.filter(c => c.menu_item_id !== menu_item_id))
  }

  const getQuantity = (id: number) =>
    cart.find(c => c.menu_item_id === id)?.quantity ?? 0

  const cartTotal   = cart.reduce((sum, c) => sum + c.price * c.quantity, 0)
  const cartCount   = cart.reduce((sum, c) => sum + c.quantity, 0)
  const filteredItems = menuItems.filter(item =>
    item.menu_items_name.toLowerCase().includes(search.toLowerCase())
  )

  if (step === 'success') {
    return (
      <View style={styles.centered}>
        <View style={styles.successIcon}>
          <CheckCircle size={52} color={C.sage} />
        </View>
        <Text style={styles.successTitle}>Order Placed!</Text>
        <Text style={styles.successSub}>Your order has been sent to the kitchen.</Text>
        <TouchableOpacity
          style={styles.newOrderBtn}
          onPress={() => { setCart([]); setSpecialNotes(''); setStep('menu') }}
        >
          <Text style={styles.newOrderBtnText}>Place Another Order</Text>
        </TouchableOpacity>
      </View>
    )
  }

  if (step === 'cart') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setStep('menu')}>
            <Text style={styles.backBtn}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Your Order</Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {cart.map(item => (
            <View key={item.menu_item_id} style={styles.cartCard}>
              <View style={styles.cartLeft}>
                <Text style={styles.cartName}>{item.name}</Text>
                <Text style={styles.cartPrice}>NPR {item.price} each</Text>
              </View>
              <View style={styles.cartRight}>
                <View style={styles.qtyRow}>
                  <TouchableOpacity style={styles.qtyBtn} onPress={() => removeFromCart(item.menu_item_id)}>
                    <Minus size={12} color={C.clay} />
                  </TouchableOpacity>
                  <Text style={styles.qtyText}>{item.quantity}</Text>
                  <TouchableOpacity style={styles.qtyBtn} onPress={() => addToCart({ menu_items_id: item.menu_item_id, menu_items_name: item.name, price: item.price, is_available: true })}>
                    <Plus size={12} color={C.clay} />
                  </TouchableOpacity>
                </View>
                <Text style={styles.cartSubtotal}>NPR {(item.price * item.quantity).toFixed(2)}</Text>
                <TouchableOpacity onPress={() => deleteFromCart(item.menu_item_id)}>
                  <Trash2 size={14} color={C.terracotta} />
                </TouchableOpacity>
              </View>
            </View>
          ))}

          <Text style={styles.label}>Special Notes</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Any special requests?"
            placeholderTextColor={C.latte}
            value={specialNotes}
            onChangeText={setSpecialNotes}
            multiline
            numberOfLines={3}
          />

          <View style={styles.summaryBox}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>NPR {cartTotal.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tax (13%)</Text>
              <Text style={styles.summaryValue}>NPR {(cartTotal * 0.13).toFixed(2)}</Text>
            </View>
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>NPR {(cartTotal + cartTotal * 0.13).toFixed(2)}</Text>
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.placeOrderBtn, orderMutation.isPending && { opacity: 0.5 }]}
            onPress={() => orderMutation.mutate()}
            disabled={orderMutation.isPending}
          >
            <ChefHat size={18} color={C.cream} />
            <Text style={styles.placeOrderText}>
              {orderMutation.isPending ? 'Placing Order...' : 'Place Order'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Menu</Text>
        {cartCount > 0 && (
          <TouchableOpacity style={styles.cartBadge} onPress={() => setStep('cart')}>
            <ShoppingBag size={16} color={C.cream} />
            <Text style={styles.cartBadgeText}>{cartCount} · NPR {cartTotal.toFixed(0)}</Text>
          </TouchableOpacity>
        )}
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={C.brass} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.searchBox}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search menu..."
              placeholderTextColor={C.latte}
              value={search}
              onChangeText={setSearch}
            />
          </View>

          {filteredItems.map(item => {
            const qty = getQuantity(item.menu_items_id)
            return (
              <View key={item.menu_items_id} style={styles.menuCard}>
                <View style={styles.menuLeft}>
                  <Text style={styles.menuName}>{item.menu_items_name}</Text>
                  {item.menu_items_description && (
                    <Text style={styles.menuDesc} numberOfLines={2}>{item.menu_items_description}</Text>
                  )}
                  <Text style={styles.menuPrice}>NPR {Number(item.price).toFixed(2)}</Text>
                </View>
                <View style={styles.menuRight}>
                  {qty === 0 ? (
                    <TouchableOpacity style={styles.addBtn} onPress={() => addToCart(item)}>
                      <Plus size={16} color={C.cream} />
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.qtyRow}>
                      <TouchableOpacity style={styles.qtyBtn} onPress={() => removeFromCart(item.menu_items_id)}>
                        <Minus size={12} color={C.clay} />
                      </TouchableOpacity>
                      <Text style={styles.qtyText}>{qty}</Text>
                      <TouchableOpacity style={styles.qtyBtn} onPress={() => addToCart(item)}>
                        <Plus size={12} color={C.clay} />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            )
          })}
        </ScrollView>
      )}

      {cartCount > 0 && (
        <View style={styles.footer}>
          <TouchableOpacity style={styles.placeOrderBtn} onPress={() => setStep('cart')}>
            <ShoppingBag size={18} color={C.cream} />
            <Text style={styles.placeOrderText}>View Order · {cartCount} items</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.cream },
  centered:  { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 32 },
  content:   { padding: 16, paddingBottom: 100 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 52, paddingHorizontal: 16, paddingBottom: 14,
    backgroundColor: C.espresso,
  },
  headerTitle: { fontSize: 18, fontWeight: '900', color: C.cream },
  backBtn:     { fontSize: 14, color: C.latte, fontWeight: '600', width: 60 },

  cartBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: C.brass, borderRadius: 100,
    paddingHorizontal: 12, paddingVertical: 7,
  },
  cartBadgeText: { fontSize: 12, fontWeight: '800', color: C.cream },

  searchBox:   { backgroundColor: C.parchment, borderWidth: 1.5, borderColor: C.vellum, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 16 },
  searchInput: { fontSize: 14, color: C.espresso },

  menuCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: C.parchment, borderRadius: 14, borderWidth: 1.5, borderColor: C.vellum,
    padding: 14, marginBottom: 10,
  },
  menuLeft:  { flex: 1, gap: 4 },
  menuName:  { fontSize: 14, fontWeight: '800', color: C.espresso },
  menuDesc:  { fontSize: 11, color: C.clay, lineHeight: 16 },
  menuPrice: { fontSize: 14, fontWeight: '900', color: C.brass, marginTop: 2 },
  menuRight: { marginLeft: 12 },

  addBtn: {
    width: 34, height: 34, borderRadius: 100,
    backgroundColor: C.brass, alignItems: 'center', justifyContent: 'center',
  },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtyBtn: {
    width: 28, height: 28, borderRadius: 100,
    backgroundColor: C.vellum, alignItems: 'center', justifyContent: 'center',
  },
  qtyText: { fontSize: 14, fontWeight: '800', color: C.espresso, minWidth: 20, textAlign: 'center' },

  cartCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: C.parchment, borderRadius: 14, borderWidth: 1.5, borderColor: C.vellum,
    padding: 14, marginBottom: 10,
  },
  cartLeft:     { flex: 1, gap: 4 },
  cartName:     { fontSize: 14, fontWeight: '700', color: C.espresso },
  cartPrice:    { fontSize: 11, color: C.clay },
  cartRight:    { alignItems: 'flex-end', gap: 8 },
  cartSubtotal: { fontSize: 13, fontWeight: '800', color: C.brass },

  label:    { fontSize: 11, fontWeight: '800', color: C.clay, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 6, marginTop: 16 },
  input:    { borderWidth: 1.5, borderColor: C.vellum, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: C.espresso, backgroundColor: C.cream },
  textArea: { height: 80, textAlignVertical: 'top' },

  summaryBox:   { backgroundColor: C.parchment, borderRadius: 14, borderWidth: 1.5, borderColor: C.vellum, padding: 16, marginTop: 20, gap: 10 },
  summaryRow:   { flexDirection: 'row', justifyContent: 'space-between' },
  summaryLabel: { fontSize: 13, color: C.clay, fontWeight: '600' },
  summaryValue: { fontSize: 13, color: C.espresso, fontWeight: '600' },
  totalRow:     { borderTopWidth: 1, borderTopColor: C.vellum, paddingTop: 10, marginTop: 4 },
  totalLabel:   { fontSize: 15, fontWeight: '900', color: C.espresso },
  totalValue:   { fontSize: 17, fontWeight: '900', color: C.brass },

  footer: { padding: 16, paddingBottom: 32, backgroundColor: C.cream, borderTopWidth: 1, borderTopColor: C.vellum },
  placeOrderBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: C.brass, borderRadius: 100, paddingVertical: 16,
  },
  placeOrderText: { fontSize: 16, fontWeight: '900', color: C.cream },

  successIcon:    { width: 96, height: 96, borderRadius: 48, backgroundColor: C.sageLight, borderWidth: 2, borderColor: C.sageBorder, alignItems: 'center', justifyContent: 'center' },
  successTitle:   { fontSize: 26, fontWeight: '900', color: C.espresso },
  successSub:     { fontSize: 14, color: C.clay, textAlign: 'center' },
  newOrderBtn:    { backgroundColor: C.brassLight, borderWidth: 1.5, borderColor: C.brassBorder, borderRadius: 100, paddingHorizontal: 24, paddingVertical: 12, marginTop: 8 },
  newOrderBtnText:{ fontSize: 14, fontWeight: '700', color: C.brass },
})