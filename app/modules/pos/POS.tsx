import { useState, useEffect, useCallback } from 'react'
import { View, StyleSheet } from 'react-native'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {  Category } from './services/categoriesService'
import categoriesService from '../categories/services/categoriesService'
import menuItemsService, { MenuItem } from '../menu-items/services/menu-items-services'
import { TableData } from './types/tables'
import { CartItemDisplay } from './types/cart'
import { MenuItemDisplay } from './components/menuItemCard'
import ModernPOSLayout from './components/POSLayout'

const TAX_RATE   = 0.13   
const TAX_SYMBOL = 'NPR'

const calculateTax  = (amount: number) => Math.round(amount * TAX_RATE * 100) / 100
const fmt           = (amount: number)  => `${TAX_SYMBOL} ${amount.toFixed(2)}`

export default function POS() {
  const queryClient = useQueryClient()

  // ── Core state ───────────────────────────────────────────
  const [selectedTable,    setSelectedTable]    = useState<TableData | null>(null)
  const [customerName,     setCustomerName]     = useState('')
  const [paymentMethod,    setPaymentMethod]    = useState('cash')
  const [searchTerm,       setSearchTerm]       = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  // Cart (local — no table selected)
  const [localCartItems, setLocalCartItems] = useState<CartItemDisplay[]>([])

  // UI feedback
  const [showSuccessMessage, setShowSuccessMessage] = useState<string | null>(null)
  const [showErrorMessage,   setShowErrorMessage]   = useState<string | null>(null)
  const [isSendingToKitchen, setIsSendingToKitchen] = useState(false)

  // ── Helpers ───────────────────────────────────────────────
  const showSuccess = (msg: string, ms = 2500) => {
    setShowSuccessMessage(msg)
    setTimeout(() => setShowSuccessMessage(null), ms)
  }

  const showError = (msg: string, ms = 4000) => {
    setShowErrorMessage(msg)
    setTimeout(() => setShowErrorMessage(null), ms)
  }

  // ── Queries ───────────────────────────────────────────────
  const { data: menuItems = [] } = useQuery<MenuItem[]>({
    queryKey: ['menu-items'],
    queryFn:  menuItemsService.getMenuItem,
    retry: 3,
  })

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn:  categoriesService.getAllCategory,
    retry: 3,
  })

  const { data: tables = [] } = useQuery<TableData[]>({
    queryKey: ['tables'],
    queryFn:  async () => {
      // Replace with your tablesService.getTables() when ready
      return [] as TableData[]
    },
    refetchInterval: 5000,
  })

  // ── Category color helper ─────────────────────────────────
  const getCategoryColor = useCallback((categoryId: number): string => {
    const cat = categories.find((c: Category) => Number(c.category_id) === categoryId)
    return (cat as any)?.color ?? C.sage
  }, [categories])

  // ── Enriched menu items ───────────────────────────────────
  const enrichedItems: MenuItemDisplay[] = menuItems.map((item) => {
    const category = categories.find(
      (c: Category) => Number(c.category_id) === item.menu_items_category_id
    )
    const taxAmount = calculateTax(Number(item.price))
    return {
      ...item,
      price:            Number(item.price),
      category_name:    (category as any)?.category_name,
      is_available:     true,
      stock_quantity:   undefined,
      // tax helpers stored for cart calculations
      _tax_amount:      taxAmount,
      _total_with_tax:  Number(item.price) + taxAmount,
    } as MenuItemDisplay
  })

  // ── Filtered items ────────────────────────────────────────
  const filteredItems = enrichedItems.filter((item) => {
    const matchesCategory =
      selectedCategory === 'all' ||
      String(item.menu_items_category_id) === selectedCategory
    const matchesSearch =
      item.menu_items_name.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesCategory && matchesSearch
  })

  // ── Cart items (local only for now; extend for table carts later) ─
  const cartItems: CartItemDisplay[] = localCartItems
  const cartTotal = cartItems.reduce((sum, i) => sum + i.total_price, 0)

  // ── Tax breakdown ─────────────────────────────────────────
  const getCartTax = () => calculateTax(cartTotal)

  const getCartTotalWithTax = () => cartTotal + getCartTax()

  const getCartTaxBreakdown = () => {
    if (cartItems.length === 0) return []
    return [{
      name:   'VAT',
      rate:   13,
      amount: getCartTax(),
    }]
  }

  // ── Add to cart ───────────────────────────────────────────
  const addToCart = (item: MenuItemDisplay) => {
    setLocalCartItems((prev) => {
      const existing = prev.find((i) => i.menu_item_id === String(item.menu_items_id))
      if (existing) {
        return prev.map((i) =>
          i.menu_item_id === String(item.menu_items_id)
            ? {
                ...i,
                quantity:       i.quantity + 1,
                total_price:    i.unit_price * (i.quantity + 1),
                tax_amount:     calculateTax(i.unit_price * (i.quantity + 1)),
                total_with_tax: i.unit_price * (i.quantity + 1) + calculateTax(i.unit_price * (i.quantity + 1)),
              }
            : i
        )
      }
      const unitPrice = Number(item.price)
      const newItem: CartItemDisplay = {
        menu_item_id:   String(item.menu_items_id),
        menu_item_name: item.menu_items_name,
        quantity:        1,
        unit_price:      unitPrice,
        total_price:     unitPrice,
        tax_amount:      calculateTax(unitPrice),
        total_with_tax:  unitPrice + calculateTax(unitPrice),
        menu_item: item.menu_items_category_id ? {
          id:            String(item.menu_items_id),
          name:          item.menu_items_name,
          category_id:   String(item.menu_items_category_id),
          category_name: item.category_name ?? '',
          price:         unitPrice,
        } : undefined,
      }
      return [...prev, newItem]
    })
    showSuccess(`${item.menu_items_name} added`)
  }

  // ── Remove from cart ──────────────────────────────────────
  const removeFromCart = (menuItemId: string) => {
    setLocalCartItems((prev) => prev.filter((i) => i.menu_item_id !== menuItemId))
    showSuccess('Item removed')
  }

  // ── Update quantity ───────────────────────────────────────
  const updateQuantity = (menuItemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(menuItemId)
      return
    }
    setLocalCartItems((prev) =>
      prev.map((i) =>
        i.menu_item_id === menuItemId
          ? {
              ...i,
              quantity,
              total_price:    i.unit_price * quantity,
              tax_amount:     calculateTax(i.unit_price * quantity),
              total_with_tax: i.unit_price * quantity + calculateTax(i.unit_price * quantity),
            }
          : i
      )
    )
  }

  // ── Clear cart ────────────────────────────────────────────
  const clearCart = () => {
    setLocalCartItems([])
    showSuccess('Cart cleared')
  }

  // ── Send to kitchen ───────────────────────────────────────
  const sendToKitchen = async () => {
    if (!selectedTable) {
      showError('Select a table first')
      return
    }
    if (cartItems.length === 0) {
      showError('Cart is empty')
      return
    }
    try {
      setIsSendingToKitchen(true)
      // TODO: call your kitchen API here
      // await kitchenService.sendOrder({ table_id: selectedTable.table_id, items: cartItems })
      await new Promise((r) => setTimeout(r, 800)) // placeholder
      showSuccess('Order sent to kitchen!')
    } catch (err) {
      showError('Failed to send to kitchen')
    } finally {
      setIsSendingToKitchen(false)
    }
  }

  // ── Payment (placeholder — full modal coming later) ───────
  const handlePayment = () => {
    if (cartItems.length === 0) {
      showError('Cart is empty')
      return
    }
    // TODO: open PaymentModal when ready
    showSuccess(`Payment of ${fmt(getCartTotalWithTax())} — coming soon!`)
  }

  // ── Split ticket (placeholder) ────────────────────────────
  const handleSplitTicket = () => {
    if (cartItems.length === 0) {
      showError('Cart is empty')
      return
    }
    // TODO: open SplitTicketModal when ready
    showSuccess('Split ticket — coming soon!')
  }

  // ─── RENDER ──────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <ModernPOSLayout
        // Tables
        tables={tables}
        selectedTable={selectedTable}
        onTableSelect={setSelectedTable}

        // Cart
        cartItems={cartItems}
        cartTotal={cartTotal}
        customerName={customerName}
        setCustomerName={setCustomerName}
        paymentMethod={paymentMethod}
        setPaymentMethod={setPaymentMethod}
        onRemove={removeFromCart}
        onUpdateQuantity={updateQuantity}
        onPayment={handlePayment}
        onSendToKitchen={sendToKitchen}
        onClearCart={clearCart}
        onSplitTicket={handleSplitTicket}
        isSendingToKitchen={isSendingToKitchen}
        showSuccessMessage={showSuccessMessage}
        showErrorMessage={showErrorMessage}
        getCartTax={getCartTax}
        getCartTotalWithTax={getCartTotalWithTax}
        getCartTaxBreakdown={getCartTaxBreakdown}
        getCategoryColor={getCategoryColor}

        // Menu Items
        menuItems={filteredItems}
        categories={categories}
        searchTerm={searchTerm}
        selectedCategory={selectedCategory}
        onSearchChange={setSearchTerm}
        onCategoryChange={setSelectedCategory}
        onMenuItemSelect={addToCart}

        symbol={TAX_SYMBOL}
      />
    </View>
  )
}

// ─── COLORS (for getCategoryColor fallback) ───────────────────
const C = { sage: '#3B6E52' }

// ─── STYLESHEET ──────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})
