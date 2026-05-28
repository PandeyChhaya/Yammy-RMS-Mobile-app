import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useState } from 'react'
import { Alert, StyleSheet, View } from 'react-native'
import menuItemsService from '../menu-items/services/menu-items-services'
import { ordersService } from '../orders/services/orderService'
import PaymentModal from '../payment/payment'
import tableService from '../tables/services/tableService'
import { MenuItemDisplay } from './components/menuItemCard'
import ModernPOSLayout from './components/POSLayout'
import SplitTicketModal from './components/splitTicketModal'
import categoriesService from './services/categoriesService'
import { CartItemDisplay } from './types/cart'
import { TableData } from './types/tables'

const TAX_RATES = [{ name: 'VAT', rate: 13 }]

// Vibrant, accessible colors tailored for a modern dark-mode interface
const CATEGORY_COLORS = [
  '#14B8A6', // Teal
  '#F59E0B', // Amber
  '#F43F5E', // Rose
  '#0EA5E9', // Sky
  '#8B5CF6', // Violet
  '#FF6B2C', // Primary Orange
  '#10B981', // Emerald
  '#6366F1', // Indigo
]

export default function POS() {
  const queryClient = useQueryClient()

  const { data: rawMenuItems = [] } = useQuery({
    queryKey: ['menu-items'],
    queryFn: menuItemsService.getMenuItem,
  })

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesService.getCategory,
  })

  const { data: tables = [] } = useQuery({
    queryKey: ['tables'],
    queryFn: tableService.getTable,
  })

  const menuItems: MenuItemDisplay[] = rawMenuItems.map((item) => {
    const cat = categories.find((c) => c.category_id === item.menu_items_category_id)
    return {
      menu_items_id:          item.menu_items_id,
      menu_items_name:        item.menu_items_name,
      slug:                   item.slug,
      price:                  item.price,
      menu_items_category_id: item.menu_items_category_id,
      menu_items_description: item.menu_items_description,
      image_url:              item.image_url,
      is_available:           true,
      category_name:          cat?.category_name,
    }
  })

  const mappedTables: TableData[] = (tables as any[]).map((t) => ({
    table_id:     t.table_id,
    table_number: String(t.table_number),
    floor:        t.floor,
    capacity:     t.capacity,
    table_status: t.table_status as TableData['table_status'],
    is_active:    t.is_active ?? true,
    created_at:   t.created_at ?? '',
    updated_at:   t.updated_at ?? '',
  }))

  const [cartItems,    setCartItems]    = useState<CartItemDisplay[]>([])
  const [selectedTable, setSelectedTable] = useState<TableData | null>(null)
  const [customerName,  setCustomerName]  = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cash')

  const [searchTerm,       setSearchTerm]       = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showSplitModal,   setShowSplitModal]   = useState(false)
  const [isSendingToKitchen, setIsSendingToKitchen] = useState(false)
  const [showSuccessMessage, setShowSuccessMessage] = useState<string | null>(null)
  const [showErrorMessage,   setShowErrorMessage]   = useState<string | null>(null)

  const [splitMode,       setSplitMode]       = useState<'equal' | 'custom' | 'item'>('equal')
  const [splitCount,      setSplitCount]      = useState(2)
  const [customSplits,    setCustomSplits]    = useState<{ [key: string]: number }>({})
  const [itemAssignments, setItemAssignments] = useState<{ [key: string]: string[] }>({})

  const flashSuccess = (msg: string) => {
    setShowSuccessMessage(msg)
    setTimeout(() => setShowSuccessMessage(null), 3000)
  }

  const flashError = (msg: string) => {
    setShowErrorMessage(msg)
    setTimeout(() => setShowErrorMessage(null), 4000)
  }

  const getCategoryColor = useCallback((categoryId: number) => {
    const idx = categories.findIndex((c) => c.category_id === categoryId)
    return CATEGORY_COLORS[idx % CATEGORY_COLORS.length] ?? CATEGORY_COLORS[0]
  }, [categories])

  const addToCart = (item: MenuItemDisplay) => {
    setCartItems((prev) => {
      const existing = prev.find((c) => c.menu_item_id === String(item.menu_items_id))
      if (existing) {
        return prev.map((c) =>
          c.menu_item_id === String(item.menu_items_id)
            ? {
                ...c,
                quantity:       c.quantity + 1,
                total_price:    c.unit_price * (c.quantity + 1),
                tax_amount:     calcTax(c.unit_price * (c.quantity + 1)),
                total_with_tax: c.unit_price * (c.quantity + 1) + calcTax(c.unit_price * (c.quantity + 1)),
              }
            : c
        )
      }
      const tax = calcTax(item.price)
      const cat = categories.find((c) => c.category_id === item.menu_items_category_id)
      return [
        ...prev,
        {
          menu_item_id:   String(item.menu_items_id),
          menu_item_name: item.menu_items_name,
          quantity:       1,
          unit_price:     item.price,
          total_price:    item.price,
          tax_amount:     tax,
          total_with_tax: item.price + tax,
          menu_item: {
            id:            String(item.menu_items_id),
            name:          item.menu_items_name,
            category_id:   item.menu_items_category_id,
            category_name: cat?.category_name ?? '',
            price:         item.price,
          },
        },
      ]
    })
  }

  const removeFromCart = (menuItemId: string) => {
    setCartItems((prev) => prev.filter((c) => c.menu_item_id !== menuItemId))
  }

  const updateQuantity = (menuItemId: string, quantity: number) => {
    if (quantity <= 0) { removeFromCart(menuItemId); return }
    setCartItems((prev) =>
      prev.map((c) =>
        c.menu_item_id === menuItemId
          ? {
              ...c,
              quantity,
              total_price:    c.unit_price * quantity,
              tax_amount:     calcTax(c.unit_price * quantity),
              total_with_tax: c.unit_price * quantity + calcTax(c.unit_price * quantity),
            }
          : c
      )
    )
  }

  const clearCart = () => {
    setCartItems([])
    setCustomerName('')
    setItemAssignments({})
    setCustomSplits({})
  }

  const calcTax = (amount: number) =>
    TAX_RATES.reduce((sum, t) => sum + (amount * t.rate) / 100, 0)

  const cartTotal = cartItems.reduce((s, i) => s + i.total_price, 0)

  const getCartTax = () => cartItems.reduce((s, i) => s + i.tax_amount, 0)

  const getCartTotalWithTax = () => cartTotal + getCartTax()

  const getCartTaxBreakdown = () =>
    TAX_RATES.map((t) => ({
      name:   t.name,
      rate:   t.rate,
      amount: (cartTotal * t.rate) / 100,
    }))

  const handleSendToKitchen = async () => {
    if (!selectedTable || cartItems.length === 0) return
    try {
      setIsSendingToKitchen(true)
      await ordersService.postOrder({
        table_id:      selectedTable.table_id,
        order_type:    'dine_in',
        special_notes: '',
        subtotal:      cartTotal,
        discount:      0,
        tax:           getCartTax(),
        total_amount:  getCartTotalWithTax(),
        order_status:  'pending',
        items: cartItems.map((i) => ({
          menu_item_id: Number(i.menu_item_id),
          quantity:     i.quantity,
          unit_price:   i.unit_price,
          total_price:  i.total_price,
        })),
      } as any)
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['tables'] })
      flashSuccess('Order sent to kitchen!')
      clearCart()
    } catch (err: any) {
      flashError(err.message ?? 'Failed to send to kitchen')
    } finally {
      setIsSendingToKitchen(false)
    }
  }

  const handlePaymentSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['orders'] })
    queryClient.invalidateQueries({ queryKey: ['tables'] })
    clearCart()
    setSelectedTable(null)
    flashSuccess('Payment complete!')
  }

  const getSplitBreakdown = () => {
    const total = getCartTotalWithTax()
    if (splitMode === 'equal') {
      return Array.from({ length: splitCount }, (_, i) => ({
        id:     `ticket-${i + 1}`,
        name:   `Person ${i + 1}`,
        amount: total / splitCount,
      }))
    }
    if (splitMode === 'custom') {
      return Array.from({ length: splitCount }, (_, i) => {
        const id = `ticket-${i + 1}`
        return { id, name: `Person ${i + 1}`, amount: customSplits[id] ?? 0 }
      })
    }
    const totals: { [key: string]: number } = {}
    cartItems.forEach((item) => {
      const tickets = itemAssignments[item.menu_item_id] ?? []
      tickets.forEach((tid) => {
        totals[tid] = (totals[tid] ?? 0) + item.total_with_tax / tickets.length
      })
    })
    return Array.from({ length: splitCount }, (_, i) => {
      const id = `ticket-${i + 1}`
      return { id, name: `Person ${i + 1}`, amount: totals[id] ?? 0 }
    })
  }

  const assignItemToTicket = (itemId: string, ticketId: string, assign: boolean) => {
    setItemAssignments((prev) => ({
      ...prev,
      [itemId]: assign ? [ticketId] : [],
    }))
  }

  const clearSplit = () => {
    setCustomSplits({})
    setItemAssignments({})
  }

  return (
    <View style={styles.container}>
      <ModernPOSLayout
        tables={mappedTables}
        selectedTable={selectedTable}
        onTableSelect={setSelectedTable}

        cartItems={cartItems}
        cartTotal={cartTotal}
        customerName={customerName}
        setCustomerName={setCustomerName}
        paymentMethod={paymentMethod}
        setPaymentMethod={setPaymentMethod}
        onRemove={removeFromCart}
        onUpdateQuantity={updateQuantity}
        onPayment={() => {
          if (cartItems.length === 0) { flashError('Cart is empty'); return }
          setShowPaymentModal(true)
        }}
        onSendToKitchen={handleSendToKitchen}
        onClearCart={() =>
          Alert.alert('Clear Cart', 'Remove all items?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Clear', style: 'destructive', onPress: clearCart },
          ])
        }
        onSplitTicket={() => setShowSplitModal(true)}
        isSendingToKitchen={isSendingToKitchen}
        showSuccessMessage={showSuccessMessage}
        showErrorMessage={showErrorMessage}
        getCartTax={getCartTax}
        getCartTotalWithTax={getCartTotalWithTax}
        getCartTaxBreakdown={getCartTaxBreakdown}
        getCategoryColor={getCategoryColor}

        menuItems={menuItems}
        categories={categories}
        searchTerm={searchTerm}
        selectedCategory={selectedCategory}
        onSearchChange={setSearchTerm}
        onCategoryChange={setSelectedCategory}
        onMenuItemSelect={addToCart}

        symbol="NPR"
      />

      <PaymentModal
        visible={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSuccess={handlePaymentSuccess}
        cartItems={cartItems}
        cartTotal={cartTotal}
        taxAmount={getCartTax()}
        totalWithTax={getCartTotalWithTax()}
        selectedTable={selectedTable}
        customerName={customerName}
        symbol="NPR"
      />

      <SplitTicketModal
        visible={showSplitModal}
        onClose={() => setShowSplitModal(false)}
        splitMode={splitMode}
        setSplitMode={setSplitMode}
        splitCount={splitCount}
        setSplitCount={setSplitCount}
        customSplits={customSplits}
        setCustomSplits={setCustomSplits}
        itemAssignments={itemAssignments}
        getSplitBreakdown={getSplitBreakdown}
        handlePartialPayment={() => {}}
        assignItemToTicket={assignItemToTicket}
        clearSplit={clearSplit}
        cartItems={cartItems}
        cartTotal={cartTotal}
        getCartTax={getCartTax}
        getCartTotalWithTax={getCartTotalWithTax}
        symbol="NPR"
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
})