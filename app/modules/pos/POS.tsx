import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { StyleSheet, View } from 'react-native'

import { useApp } from '../../../shared/contexts/AppContext'
import { useUserSettings } from '../../../shared/contexts/UserSettingsContext'
import { useActiveTabState } from '../../../shared/hooks/useTabState'
import { useTaxSettings } from '../../../shared/hooks/useTaxSettings'
import { Category, categoryService } from './services/categoriesService'
import { productsService } from './services/productsService'
import { TableCart, tablesService } from './services/tablesService'

import PaymentModal from './components/PaymentModal'

import POSLayout from './components/POSLayout'
import SplitTicketModal from './components/SplitTicketModal'

import { useCart, usePayment, useSplitTicket, useTables } from './hooks'

import { ProductDisplay } from './types/products'
import { TableData } from './types/tables'

export default function POS() {
  const { tabs, activeTabId } = useApp()
  const { settings } = useUserSettings()
  const currentTab = tabs.find(tab => tab.id === activeTabId)

  const [selectedTable, setSelectedTable] = useActiveTabState<TableData | null>(
    'selectedTable',
    currentTab?.params?.selectedTable || null,
    true
  )

  const [customerName, setCustomerName] = useActiveTabState<string>(
    'customerName',
    '',
    true
  )

  const [paymentMethod, setPaymentMethod] = useActiveTabState<string>(
    'paymentMethod',
    'cash',
    true
  )

  const [searchTerm, setSearchTerm] = useActiveTabState<string>(
    'searchTerm',
    '',
    true
  )

  const [selectedCategory, setSelectedCategory] = useActiveTabState<string>(
    'selectedCategory',
    'all',
    true
  )

  const [showSuccessMessage, setShowSuccessMessage] = useState<string | null>(null)
  const [showErrorMessage, setShowErrorMessage] = useState<string | null>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showSplitTicketModal, setShowSplitTicketModal] = useState(false)
  const [shouldGenerateTicket, setShouldGenerateTicket] = useState(false)

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: productsService.getProducts,
  })

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: categoryService.getCategories,
  })

 const { data: tables = [] } = useQuery<TableData[]>({
    queryKey: ['tables'],
    queryFn: async (): Promise<TableData[]> => {
        const result = await tablesService.getAllTables()
        return result as TableData[]   // ← explicit cast
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

  const cartItems = selectedTable ? (tableCart?.items || []) : cartHook.enrichCartItems(cartHook.localCart.items)
  const cartTotal = selectedTable ? (tableCart?.total_amount || 0) : cartHook.localCart.total_amount
  const tablesHook = useTables()
  const paymentHook = usePayment(selectedTable, cartItems, products as any)

  const { calculateTax, getTaxName } = useTaxSettings()

  const getCartTaxBreakdown = () => {
    if (cartItems.length === 0) return []

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

  const getCartTotalWithTax = () => cartTotal + getCartTax()

  const splitTicketHook = useSplitTicket(cartItems, cartTotal, getCartTax)

  const enrichedProducts: ProductDisplay[] = products.map((product: any) => {
    const category = categories.find(c => c.id === product.category_id)
    const taxRate = 0
    const taxAmount = calculateTax(product.price, product.category_id, categories)

    return {
      ...product,
      category_name: category?.name,
      tax_rate: taxRate,
      tax_amount: taxAmount,
      total_with_tax: product.price + taxAmount
    }
  })

  const getCategoryColor = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId)
    return category?.color || '#3B82F6'
  }

  const addToCart = (product: ProductDisplay) => {
    cartHook.addToCart(product)
    setShowSuccessMessage('Product added to cart')
    setTimeout(() => setShowSuccessMessage(null), 2000)
  }

  const removeFromCart = (productId: string) => {
    cartHook.removeFromCart(productId)
    setShowSuccessMessage('Product removed from cart')
    setTimeout(() => setShowSuccessMessage(null), 2000)
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
      const itemsCount = cartItems.reduce((sum: number, item: any) => sum + item.quantity, 0)
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
          setShowSuccessMessage('Payment completed successfully!')
          setTimeout(() => setShowSuccessMessage(null), 3000)
          setShowPaymentModal(false)
        }
      )
    } catch (error) {
      console.error('❌ Payment error:', error)
      setShowErrorMessage(`Payment error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setTimeout(() => setShowErrorMessage(null), 5000)
    }
  }

  const handlePaymentClick = () => {
    setShouldGenerateTicket(true)
    setShowPaymentModal(true)
  }

  useEffect(() => {
    if (shouldGenerateTicket) {
      const timer = setTimeout(() => {
        setShouldGenerateTicket(false)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [shouldGenerateTicket])

  const sendToKitchen = async () => {
    try {
      await paymentHook.sendToKitchen()
      setShowSuccessMessage('Order sent to kitchen successfully!')
      setTimeout(() => setShowSuccessMessage(null), 3000)
    } catch (error) {
      setShowErrorMessage('Error sending to kitchen')
      setTimeout(() => setShowErrorMessage(null), 3000)
    }
  }

  const filteredProducts = enrichedProducts?.filter(product => {
    const matchesCategory = selectedCategory === 'all' || (product as any).category_id === selectedCategory
    const matchesSearch = (product as any).name.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesCategory && matchesSearch
  })

  return (
    <View style={styles.container}>
      <POSLayout
        tables={tables}
        selectedTable={selectedTable}
        onTableSelect={setSelectedTable}
        cartItems={cartItems as any}
        cartTotal={cartTotal}
        customerName={customerName}
        setCustomerName={setCustomerName}
        paymentMethod={paymentMethod}
        setPaymentMethod={setPaymentMethod}
        onRemove={removeFromCart}
        onUpdateQuantity={updateQuantity}
        onPayment={handlePaymentClick}
        onSendToKitchen={sendToKitchen}
        onClearCart={clearCart}
        onSplitTicket={() => setShowSplitTicketModal(true)}
        isSendingToKitchen={paymentHook.isSendingToKitchen}
        showSuccessMessage={showSuccessMessage}
        showErrorMessage={showErrorMessage}
        getCartTax={getCartTax}
        getCartTotalWithTax={getCartTotalWithTax}
        getCartTaxBreakdown={getCartTaxBreakdown}
        getCategoryColor={getCategoryColor}
        products={filteredProducts}
        categories={categories}
        searchTerm={searchTerm}
        selectedCategory={selectedCategory}
        onSearchChange={setSearchTerm}
        onCategoryChange={setSelectedCategory}
        onProductSelect={addToCart}
        leftHandedMode={settings.leftHandedMode}
        currentOrder={{
          id: `ORD-${Date.now()}`,
          total: cartTotal,
          items: cartItems.map(item => ({
            name: item.product_name,
            quantity: item.quantity,
            price: item.unit_price
          }))
        }}
        onPaymentComplete={() => setShowPaymentModal(true)}
        shouldGenerateTicket={shouldGenerateTicket}
      />

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
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
})