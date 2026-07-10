import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useState } from 'react'
import { Alert, StyleSheet, View } from 'react-native'
import menuItemsService from '../menu-items/services/menu-items-services'
import { ordersService } from '../orders/services/orderService'
import PaymentModal from '../payment/payment'
import tableService from '../tables/services/tableService'
import { MenuItemDisplay } from './components/menuItemCard'
import ModernPOSLayout from './components/POSLayout'
import SplitTicketModal from './components/SplitTicketModal'
import categoriesService from './services/categoriesService'
import { CartItemDisplay } from './types/cart'
import { TableData } from './types/tables'

const TAX_RATES = [{ name: 'VAT', rate: 13 }]

const CATEGORY_COLORS = [
  '#14B8A6',
  '#F59E0B',
  '#F43F5E',
  '#0EA5E9',
  '#8B5CF6',
  '#FF6B2C',
  '#10B981',
  '#6366F1',
]

function calcTax(amount: number) {
  return TAX_RATES.reduce((sum, t) => sum + (amount * t.rate) / 100, 0)
}

export default function POS() {
  const queryClient = useQueryClient()

  const { data: rawMenuItems = [] } = useQuery({
  queryKey: ['menu-items'],
  queryFn: () => menuItemsService.getMenuItem(),
})

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesService.getCategory,
  })

 const { data: tables = [] } = useQuery({
  queryKey: ['tables'],
  queryFn: () => tableService.getTable(),
})
  const menuItems: MenuItemDisplay[] = rawMenuItems.map((item) => {
    const category = categories.find((c) => c.category_id === item.menu_items_category_id)
    return {
      menu_items_id: item.menu_items_id,
      menu_items_name: item.menu_items_name,
      slug: item.slug,
      price: Number(item.price),
      menu_items_category_id: item.menu_items_category_id,
      menu_items_description: item.menu_items_description,
      image_url: item.image_url,
      is_available: true,
      category_name: category?.category_name,
    }
  })

  const mappedTables: TableData[] = (tables as any[]).map((t) => ({
    table_id: t.table_id,
    table_number: String(t.table_number),
    floor: t.floor,
    capacity: t.capacity,
    table_status: t.table_status as TableData['table_status'],
    is_active: t.is_active ?? true,
    created_at: t.created_at ?? '',
    updated_at: t.updated_at ?? '',
  }))

  const [cartItems, setCartItems] = useState<CartItemDisplay[]>([])
  const [selectedTable, setSelectedTable] = useState<TableData | null>(null)
  const [customerName, setCustomerName] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cash')

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showSplitModal, setShowSplitModal] = useState(false)
  const [isSendingToKitchen, setIsSendingToKitchen] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const [splitMode, setSplitMode] = useState<'equal' | 'custom' | 'item'>('equal')
  const [splitCount, setSplitCount] = useState(2)
  const [customSplits, setCustomSplits] = useState<{ [key: string]: number }>({})
  const [itemAssignments, setItemAssignments] = useState<{ [key: string]: string[] }>({})

  function flashSuccess(message: string) {
    setSuccessMessage(message)
    setTimeout(() => setSuccessMessage(null), 3000)
  }

  function flashError(message: string) {
    setErrorMessage(message)
    setTimeout(() => setErrorMessage(null), 4000)
  }

  const getCategoryColor = useCallback(
    (categoryId: number) => {
      const index = categories.findIndex((c) => c.category_id === categoryId)
      return CATEGORY_COLORS[index % CATEGORY_COLORS.length] ?? CATEGORY_COLORS[0]
    },
    [categories]
  )

  function addToCart(item: MenuItemDisplay) {
    setCartItems((prev) => {
      const existing = prev.find((c) => c.menu_item_id === String(item.menu_items_id))

      if (existing) {
        const nextQty = existing.quantity + 1
        const nextTotal = existing.unit_price * nextQty
        const nextTax = calcTax(nextTotal)

        return prev.map((c) =>
          c.menu_item_id === existing.menu_item_id
            ? { ...c, quantity: nextQty, total_price: nextTotal, tax_amount: nextTax, total_with_tax: nextTotal + nextTax }
            : c
        )
      }

      const tax = calcTax(item.price)
      const category = categories.find((c) => c.category_id === item.menu_items_category_id)

      return [
        ...prev,
        {
          menu_item_id: String(item.menu_items_id),
          menu_item_name: item.menu_items_name,
          quantity: 1,
          unit_price: item.price,
          total_price: item.price,
          tax_amount: tax,
          total_with_tax: item.price + tax,
          menu_item: {
            id: String(item.menu_items_id),
            name: item.menu_items_name,
            category_id: item.menu_items_category_id,
            category_name: category?.category_name ?? '',
            price: item.price,
          },
        },
      ]
    })
  }

  function removeFromCart(menuItemId: string) {
    setCartItems((prev) => prev.filter((c) => c.menu_item_id !== menuItemId))
  }

  function updateQuantity(menuItemId: string, quantity: number) {
    if (quantity <= 0) {
      removeFromCart(menuItemId)
      return
    }

    setCartItems((prev) =>
      prev.map((c) => {
        if (c.menu_item_id !== menuItemId) return c
        const total = c.unit_price * quantity
        const tax = calcTax(total)
        return { ...c, quantity, total_price: total, tax_amount: tax, total_with_tax: total + tax }
      })
    )
  }

  function clearCart() {
    setCartItems([])
    setCustomerName('')
    setItemAssignments({})
    setCustomSplits({})
  }

  const cartTotal = cartItems.reduce((sum, i) => sum + i.total_price, 0)

  function getCartTax() {
    return cartItems.reduce((sum, i) => sum + i.tax_amount, 0)
  }

  function getCartTotalWithTax() {
    return cartTotal + getCartTax()
  }

  function getCartTaxBreakdown() {
    return TAX_RATES.map((t) => ({
      name: t.name,
      rate: t.rate,
      amount: (cartTotal * t.rate) / 100,
    }))
  }

  async function handleSendToKitchen() {
    if (!selectedTable || cartItems.length === 0) return

    try {
      setIsSendingToKitchen(true)
      await ordersService.postOrder({
        table_id: selectedTable.table_id,
        order_type: 'dine_in',
        special_notes: '',
        subtotal: cartTotal,
        discount: 0,
        tax: getCartTax(),
        total_amount: getCartTotalWithTax(),
        order_status: 'pending',
        items: cartItems.map((i) => ({
          menu_item_id: Number(i.menu_item_id),
          quantity: i.quantity,
          unit_price: i.unit_price,
          total_price: i.total_price,
        })),
      } as any)

      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['tables'] })
      flashSuccess('Order sent to kitchen!')
    
    } catch (err: any) {
      flashError(err.message ?? 'Failed to send to kitchen')
    } finally {
      setIsSendingToKitchen(false)
    }
  }

  function handlePaymentSuccess() {
    queryClient.invalidateQueries({ queryKey: ['orders'] })
    queryClient.invalidateQueries({ queryKey: ['tables'] })
    clearCart()
    setSelectedTable(null)
    flashSuccess('Payment complete!')
  }

  function getSplitBreakdown() {
    const total = getCartTotalWithTax()

    if (splitMode === 'equal') {
      return Array.from({ length: splitCount }, (_, i) => ({
        id: `ticket-${i + 1}`,
        name: `Person ${i + 1}`,
        amount: total / splitCount,
      }))
    }

    if (splitMode === 'custom') {
      return Array.from({ length: splitCount }, (_, i) => {
        const id = `ticket-${i + 1}`
        return { id, name: `Person ${i + 1}`, amount: customSplits[id] ?? 0 }
      })
    }

    // item mode: an item assigned to multiple tickets gets split evenly
    // between just those tickets, not the full table
    const totals: { [key: string]: number } = {}
    cartItems.forEach((item) => {
      const tickets = itemAssignments[item.menu_item_id] ?? []
      if (tickets.length === 0) return
      const share = item.total_with_tax / tickets.length
      tickets.forEach((ticketId) => {
        totals[ticketId] = (totals[ticketId] ?? 0) + share
      })
    })

    return Array.from({ length: splitCount }, (_, i) => {
      const id = `ticket-${i + 1}`
      return { id, name: `Person ${i + 1}`, amount: totals[id] ?? 0 }
    })
  }

  function assignItemToTicket(itemId: string, ticketId: string, assign: boolean) {
    setItemAssignments((prev) => {
      const current = prev[itemId] ?? []
      const next = assign
        ? Array.from(new Set([...current, ticketId]))
        : current.filter((id) => id !== ticketId)
      return { ...prev, [itemId]: next }
    })
  }

  function clearSplit() {
    setCustomSplits({})
    setItemAssignments({})
  }

  function confirmClearCart() {
    Alert.alert('Clear Cart', 'Remove all items?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: clearCart },
    ])
  }

  function openPaymentModal() {
    if (cartItems.length === 0) {
      flashError('Cart is empty')
      return
    }
    setShowPaymentModal(true)
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
        onPayment={openPaymentModal}
        onSendToKitchen={handleSendToKitchen}
        onClearCart={confirmClearCart}
        onSplitTicket={() => setShowSplitModal(true)}
        isSendingToKitchen={isSendingToKitchen}
        showSuccessMessage={successMessage}
        showErrorMessage={errorMessage}
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