import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  CheckCircle,
  Minus,
  Plus,
  ShoppingBag,
  Ticket,
  Users,
} from 'lucide-react-native'
import { useState } from 'react'
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { useRestaurant } from '../../shared/context/RestaurantContext'

// this file lives at modules/customer/components/KioskOrder.tsx,
// next to MakeOrder.tsx and MakeReservation.tsx - same import depth they use
import categoriesService, { Category } from '../../categories/services/categoriesService'
import menuItemsService, { MenuItem } from '../../menu-items/services/menu-items-services'
import { ordersService } from '../../orders/services/orderService'
import tableService from '../../tables/services/tableService'

// same dark theme as login.tsx / dashboard.tsx
const colors = {
  bg: '#0A0A0A',
  card: '#1A1A1A',
  inner: '#2C2C2C',
  border: '#2E2E2E',
  accent: '#FF6B2C',
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  white: '#FFFFFF',
  muted: '#777777',
  mutedDark: '#444444',
  label: '#999999',
}

const radius = { xs: 6, sm: 10, md: 14, lg: 18, xl: 24, pill: 100 }

interface CartLine {
  menu_items_id: number
  name: string
  price: number
  quantity: number
}

type Step = 'categories' | 'menu' | 'cart' | 'party' | 'confirm'

const PARTY_SIZES = [1, 2, 3, 4, 5, 6]

export default function KioskOrder() {
  const queryClient = useQueryClient()
  const { selectedRestaurantId } = useRestaurant()
  const [step, setStep] = useState<Step>('categories')
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [cart, setCart] = useState<CartLine[]>([])
  const [partySize, setPartySize] = useState<number | null>(null)
  const [assignError, setAssignError] = useState<string | null>(null)
  const [confirmedOrderId, setConfirmedOrderId] = useState<number | null>(null)
  const [confirmedTable, setConfirmedTable] = useState<{ table_number: string | number } | null>(null)

 const { data: categories = [], isLoading: loadingCategories } = useQuery({
    queryKey: ['kiosk-categories', selectedRestaurantId],
    queryFn: () => categoriesService.getAllCategory(selectedRestaurantId ?? undefined),
  })

   const { data: menuItems = [], isLoading: loadingMenuItems } = useQuery({
    queryKey: ['kiosk-menu-items', selectedRestaurantId],
    queryFn: () => menuItemsService.getMenuItem(selectedRestaurantId ?? undefined),
  })

  const { data: tables = [], refetch: refetchTables } = useQuery({
    queryKey: ['kiosk-tables', selectedRestaurantId],
    queryFn: () => tableService.getTable(selectedRestaurantId ?? undefined),
  })

  const activeCategories = categories.filter(c => c.is_active)
  const itemsForCategory = selectedCategory
    ? menuItems.filter(
        item => item.menu_items_category_id === selectedCategory.category_id && item.is_available
      )
    : []

  const cartCount = cart.reduce((sum, c) => sum + c.quantity, 0)
  const cartTotal = cart.reduce((sum, c) => sum + c.price * c.quantity, 0)

  function addToCart(item: MenuItem) {
    setCart(prev => {
      const existing = prev.find(c => c.menu_items_id === item.menu_items_id)
      if (existing) {
        return prev.map(c =>
          c.menu_items_id === item.menu_items_id ? { ...c, quantity: c.quantity + 1 } : c
        )
      }
      return [...prev, { menu_items_id: item.menu_items_id, name: item.menu_items_name, price: Number(item.price), quantity: 1 }]
    })
  }

  function removeFromCart(id: number) {
    setCart(prev => {
      const existing = prev.find(c => c.menu_items_id === id)
      if (existing && existing.quantity > 1) {
        return prev.map(c => (c.menu_items_id === id ? { ...c, quantity: c.quantity - 1 } : c))
      }
      return prev.filter(c => c.menu_items_id !== id)
    })
  }

  function getQuantity(id: number) {
    return cart.find(c => c.menu_items_id === id)?.quantity ?? 0
  }

  // pick the smallest available table that fits the party, or the
  // largest available one if nothing fits exactly
  function findTable(size: number) {
    const available = tables.filter(t => t.table_status === 'Available')
    if (available.length === 0) return null
    const fitting = available.filter(t => t.capacity >= size).sort((a, b) => a.capacity - b.capacity)
    if (fitting.length > 0) return fitting[0]
    return [...available].sort((a, b) => b.capacity - a.capacity)[0]
  }

  const checkoutMutation = useMutation({
    mutationFn: async (size: number) => {
      const table = findTable(size)
      if (!table) {
        throw new Error('No tables are free right now. Please wait a moment and try again.')
      }

      const order = {
        order_type: 'dine_in',
        order_status: 'pending',
        table_id: table.table_id,
        special_notes: '',
        items: cart.map(item => ({
          menu_item_id: item.menu_items_id,
          quantity: item.quantity,
          unit_price: item.price,
          subtotal: item.price * item.quantity,
        })),
        subtotal: cartTotal,
        tax: cartTotal * 0.13,
        total_amount: cartTotal + cartTotal * 0.13,
        discount: 0,
      }

      const createdOrder = await ordersService.postOrder(order as any)
      await tableService.putTable(table.table_id, { table_status: 'Occupied' } as any)

      return { createdOrder, table }
    },
    onSuccess: ({ createdOrder, table }) => {
      queryClient.invalidateQueries({ queryKey: ['kiosk-tables'] })
      setConfirmedOrderId(createdOrder.order_id ?? createdOrder.order_id ?? null)
      setConfirmedTable({ table_number: table.table_number })
      setAssignError(null)
      setStep('confirm')
    },
    onError: (err: any) => {
      setAssignError(err.message || 'Something went wrong assigning a table.')
    },
  })

  function startOver() {
    setCart([])
    setSelectedCategory(null)
    setPartySize(null)
    setAssignError(null)
    setConfirmedOrderId(null)
    setConfirmedTable(null)
    setStep('categories')
  }

  // ---------- confirm screen ----------
  if (step === 'confirm') {
    return (
      <View style={styles.container}>
        <View style={styles.confirmWrap}>
          <View style={styles.confirmIcon}>
            <CheckCircle size={44} color={colors.success} />
          </View>
          <Text style={styles.confirmTitle}>You're all set</Text>
          <Text style={styles.confirmSub}>Please take a seat, we'll bring your order shortly</Text>

          <View style={styles.confirmCard}>
            <View style={styles.confirmRow}>
              <Text style={styles.confirmLabel}>Order</Text>
              <Text style={styles.confirmValue}>#{confirmedOrderId ?? '—'}</Text>
            </View>
            <View style={styles.confirmDivider} />
            <View style={styles.confirmRow}>
              <Text style={styles.confirmLabel}>Table</Text>
              <Text style={styles.confirmValue}>{confirmedTable?.table_number ?? '—'}</Text>
            </View>
            <View style={styles.confirmDivider} />
            <View style={styles.confirmRow}>
              <Text style={styles.confirmLabel}>Items</Text>
              <Text style={styles.confirmValue}>{cartCount}</Text>
            </View>
            <View style={styles.confirmDivider} />
            <View style={styles.confirmRow}>
              <Text style={styles.confirmLabel}>Total</Text>
              <Text style={styles.confirmValue}>NPR {cartTotal.toFixed(0)}</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.primaryBtn} onPress={startOver}>
            <Text style={styles.primaryBtnText}>Start a new order</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  // ---------- party size / table assignment screen ----------
  if (step === 'party') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setStep('cart')} style={styles.backBtn}>
            <ArrowLeft size={18} color={colors.muted} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>How many people?</Text>
          <View style={{ width: 34 }} />
        </View>

        <View style={styles.content}>
          <View style={styles.partyGrid}>
            {PARTY_SIZES.map(size => (
              <TouchableOpacity
                key={size}
                style={[styles.partyPill, partySize === size && styles.partyPillActive]}
                onPress={() => setPartySize(size)}
              >
                <Users size={14} color={partySize === size ? colors.white : colors.muted} />
                <Text style={[styles.partyPillText, partySize === size && styles.partyPillTextActive]}>
                  {size}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {assignError && <Text style={styles.errorText}>{assignError}</Text>}

          <TouchableOpacity
            style={[styles.primaryBtn, (!partySize || checkoutMutation.isPending) && { opacity: 0.5 }]}
            disabled={!partySize || checkoutMutation.isPending}
            onPress={() => partySize && checkoutMutation.mutate(partySize)}
          >
            {checkoutMutation.isPending ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <>
                <Ticket size={18} color={colors.white} />
                <Text style={styles.primaryBtnText}>Find a table</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => refetchTables()} style={{ marginTop: 12 }}>
            <Text style={styles.linkText}>Refresh table availability</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  // ---------- cart screen ----------
  if (step === 'cart') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setStep('menu')} style={styles.backBtn}>
            <ArrowLeft size={18} color={colors.muted} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Your order</Text>
          <View style={{ width: 34 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {cart.length === 0 ? (
            <Text style={styles.emptyText}>Your order is empty.</Text>
          ) : (
            cart.map(item => (
              <View key={item.menu_items_id} style={styles.cartRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cartName}>{item.name}</Text>
                  <Text style={styles.cartPrice}>NPR {item.price} each</Text>
                </View>
                <View style={styles.qtyRow}>
                  <TouchableOpacity style={styles.qtyBtn} onPress={() => removeFromCart(item.menu_items_id)}>
                    <Minus size={13} color={colors.white} />
                  </TouchableOpacity>
                  <Text style={styles.qtyText}>{item.quantity}</Text>
                  <TouchableOpacity
                    style={styles.qtyBtn}
                    onPress={() => addToCart({ menu_items_id: item.menu_items_id, menu_items_name: item.name, price: item.price } as MenuItem)}
                  >
                    <Plus size={13} color={colors.white} />
                  </TouchableOpacity>
                </View>
                <Text style={styles.cartSubtotal}>NPR {(item.price * item.quantity).toFixed(0)}</Text>
              </View>
            ))
          )}
        </ScrollView>

        {cart.length > 0 && (
          <View style={styles.footer}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>NPR {cartTotal.toFixed(0)}</Text>
            </View>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => setStep('party')}>
              <Text style={styles.primaryBtnText}>Checkout</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    )
  }

  // ---------- menu items screen ----------
  if (step === 'menu' && selectedCategory) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setStep('categories')} style={styles.backBtn}>
            <ArrowLeft size={18} color={colors.muted} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{selectedCategory.category_name}</Text>
          <View style={{ width: 34 }} />
        </View>

        {loadingMenuItems ? (
          <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} />
        ) : (
          <ScrollView contentContainerStyle={styles.content}>
            {itemsForCategory.length === 0 ? (
              <Text style={styles.emptyText}>No items available in this category right now.</Text>
            ) : (
              itemsForCategory.map(item => {
                const qty = getQuantity(item.menu_items_id)
                return (
                  <View key={item.menu_items_id} style={styles.menuRow}>
                    {item.image_url ? (
                      <Image source={{ uri: item.image_url }} style={styles.menuThumb} />
                    ) : (
                      <View style={styles.menuThumbFallback} />
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cartName}>{item.menu_items_name}</Text>
                      {item.menu_items_description && (
                        <Text style={styles.menuDesc} numberOfLines={2}>{item.menu_items_description}</Text>
                      )}
                      <Text style={styles.cartPrice}>NPR {Number(item.price).toFixed(0)}</Text>
                    </View>
                    {qty === 0 ? (
                      <TouchableOpacity style={styles.addBtn} onPress={() => addToCart(item)}>
                        <Plus size={16} color={colors.white} />
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.qtyRow}>
                        <TouchableOpacity style={styles.qtyBtn} onPress={() => removeFromCart(item.menu_items_id)}>
                          <Minus size={13} color={colors.white} />
                        </TouchableOpacity>
                        <Text style={styles.qtyText}>{qty}</Text>
                        <TouchableOpacity style={styles.qtyBtn} onPress={() => addToCart(item)}>
                          <Plus size={13} color={colors.white} />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                )
              })
            )}
          </ScrollView>
        )}

        {cartCount > 0 && (
          <TouchableOpacity style={styles.cartBar} onPress={() => setStep('cart')}>
            <ShoppingBag size={16} color={colors.white} />
            <Text style={styles.cartBarText}>{cartCount} items - NPR {cartTotal.toFixed(0)}</Text>
          </TouchableOpacity>
        )}
      </View>
    )
  }

  // ---------- categories screen (default / start) ----------
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>What would you like today?</Text>
      </View>

      {loadingCategories ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.categoryGrid}>
            {activeCategories.map(cat => (
              <TouchableOpacity
                key={cat.category_id}
                style={styles.categoryCard}
                onPress={() => { setSelectedCategory(cat); setStep('menu') }}
              >
                {cat.image_url ? (
                  <Image source={{ uri: cat.image_url }} style={styles.categoryImage} />
                ) : (
                  <View style={styles.categoryImageFallback}>
                    <Text style={styles.categoryImageFallbackText}>{cat.category_name.charAt(0)}</Text>
                  </View>
                )}
                <Text style={styles.categoryName}>{cat.category_name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}

      {cartCount > 0 && (
        <TouchableOpacity style={styles.cartBar} onPress={() => setStep('cart')}>
          <ShoppingBag size={16} color={colors.white} />
          <Text style={styles.cartBarText}>{cartCount} items - NPR {cartTotal.toFixed(0)}</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 20, paddingBottom: 40 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: colors.white, flex: 1, textAlign: 'center' },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  categoryCard: {
    width: '47%',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    alignItems: 'center',
    gap: 10,
  },
  categoryImage: { width: 56, height: 56, borderRadius: radius.sm },
  categoryImageFallback: {
    width: 56,
    height: 56,
    borderRadius: radius.sm,
    backgroundColor: colors.accent + '22',
    borderWidth: 1,
    borderColor: colors.accent + '55',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryImageFallbackText: { fontSize: 20, fontWeight: '800', color: colors.accent },
  categoryName: { fontSize: 13, fontWeight: '700', color: colors.white, textAlign: 'center' },

  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    marginBottom: 10,
  },
  menuThumb: { width: 48, height: 48, borderRadius: radius.sm },
  menuThumbFallback: { width: 48, height: 48, borderRadius: radius.sm, backgroundColor: colors.inner },
  menuDesc: { fontSize: 11, color: colors.muted, marginTop: 2, marginBottom: 2 },

  cartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    marginBottom: 10,
  },
  cartName: { fontSize: 14, fontWeight: '700', color: colors.white },
  cartPrice: { fontSize: 11, color: colors.muted, marginTop: 2 },
  cartSubtotal: { fontSize: 13, fontWeight: '800', color: colors.accent, minWidth: 60, textAlign: 'right' },

  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    backgroundColor: colors.inner,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: { fontSize: 14, fontWeight: '700', color: colors.white, minWidth: 18, textAlign: 'center' },

  addBtn: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyText: { fontSize: 14, color: colors.muted, textAlign: 'center', marginTop: 40 },

  cartBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.accent,
    paddingVertical: 16,
    margin: 20,
    borderRadius: radius.md,
  },
  cartBarText: { fontSize: 14, fontWeight: '800', color: colors.white },

  footer: { padding: 20, borderTopWidth: 1, borderTopColor: colors.border },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  totalLabel: { fontSize: 14, color: colors.muted },
  totalValue: { fontSize: 20, fontWeight: '800', color: colors.white },

  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingVertical: 15,
  },
  primaryBtnText: { fontSize: 15, fontWeight: '800', color: colors.white },

  partyGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  partyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    borderRadius: radius.pill,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  partyPillActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  partyPillText: { fontSize: 14, fontWeight: '700', color: colors.muted },
  partyPillTextActive: { color: colors.white },

  errorText: { fontSize: 13, color: colors.error, marginBottom: 16, textAlign: 'center' },
  linkText: { fontSize: 13, color: colors.accent, textAlign: 'center', fontWeight: '600' },

  confirmWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  confirmIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.success + '18',
    borderWidth: 1.5,
    borderColor: colors.success + '44',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  confirmTitle: { fontSize: 22, fontWeight: '800', color: colors.white, marginBottom: 6 },
  confirmSub: { fontSize: 13, color: colors.muted, textAlign: 'center', marginBottom: 24 },
  confirmCard: {
    width: '100%',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    marginBottom: 24,
  },
  confirmRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10 },
  confirmDivider: { height: 1, backgroundColor: colors.border },
  confirmLabel: { fontSize: 13, color: colors.muted },
  confirmValue: { fontSize: 14, fontWeight: '700', color: colors.white },
})