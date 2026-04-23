import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import categoriesService from '../categories/services/categoriesService'
import menuItemsService, { MenuItem } from '../menu-items/services/menu-items-services'
import { MenuItemDisplay } from './components/menuItemCard'
import ModernPOSLayout from './components/POSLayout'
import { Category } from './services/categoriesService'
import { CartItemDisplay } from './types/cart'
import { TableData } from './types/tables'

const TAX_RATE   = 0.13   
const TAX_SYMBOL = 'NPR'

const calculateTax  = (amount: number) => Math.round(amount * TAX_RATE * 100) / 100
const fmt           = (amount: number)  => `${TAX_SYMBOL} ${amount.toFixed(2)}`

export default function POS() {
  const queryClient = useQueryClient()

  const [selectedTable,    setSelectedTable]    = useState<TableData | null>(null)
  const [customerName,     setCustomerName]     = useState('')
  const [paymentMethod,    setPaymentMethod]    = useState('cash')
  const [searchTerm,       setSearchTerm]       = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  const [localCartItems, setLocalCartItems] = useState<CartItemDisplay[]>([])

  const [showSuccessMessage, setShowSuccessMessage] = useState<string | null>(null)
  const [showErrorMessage,   setShowErrorMessage]   = useState<string | null>(null)
  const [isSendingToKitchen, setIsSendingToKitchen] = useState(false)

  const showSuccess = (msg: string, ms = 2500) => {
    setShowSuccessMessage(msg)
    setTimeout(() => setShowSuccessMessage(null), ms)
  }

  const showError = (msg: string, ms = 4000) => {
    setShowErrorMessage(msg)
    setTimeout(() => setShowErrorMessage(null), ms)
  }

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
      return [] as TableData[]
    },
    refetchInterval: 5000,
  })

  const getCategoryColor = useCallback((categoryId: number): string => {
    const cat = categories.find((c: Category) => Number(c.category_id) === categoryId)
    return (cat as any)?.color ?? C.sage
  }, [categories])

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
      _tax_amount:      taxAmount,
      _total_with_tax:  Number(item.price) + taxAmount,
    } as MenuItemDisplay
  })

  const filteredItems = enrichedItems.filter((item) => {
    const matchesCategory =
      selectedCategory === 'all' ||
      String(item.menu_items_category_id) === selectedCategory
    const matchesSearch =
      item.menu_items_name.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const cartItems: CartItemDisplay[] = localCartItems
  const cartTotal = cartItems.reduce((sum, i) => sum + i.total_price, 0)

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

  const removeFromCart = (menuItemId: string) => {
    setLocalCartItems((prev) => prev.filter((i) => i.menu_item_id !== menuItemId))
    showSuccess('Item removed')
  }

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
      await new Promise((r) => setTimeout(r, 800)) 
      showSuccess('Order sent to kitchen!')
    } catch (err) {
      showError('Failed to send to kitchen')
    } finally {
      setIsSendingToKitchen(false)
    }
  }

  const handlePayment = () => {
    if (cartItems.length === 0) {
      showError('Cart is empty')
      return
    }
    showSuccess(`Payment of ${fmt(getCartTotalWithTax())} — coming soon!`)
  }

  const handleSplitTicket = () => {
    if (cartItems.length === 0) {
      showError('Cart is empty')
      return
    }
    showSuccess('Split ticket — coming soon!')
  }

  return (
    <View style={styles.container}>
      <ModernPOSLayout
        tables={tables}
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

const C = { sage: '#3B6E52' }

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})
