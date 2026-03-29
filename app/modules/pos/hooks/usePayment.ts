import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { useTaxSettings } from '../../../../shared/hooks/useTaxSettings'
import { logsService } from '../../../../shared/services/logsService'
import { ordersService } from '../../orders/services/orderService'
import { Product } from '../../products/types/menu-items'
import { CartItem } from '../types/cart'
import { TableData } from '../types/tables'

export const usePayment = (selectedTable: TableData | null, cartItems: CartItem[], products: Product[]) => {
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [isSendingToKitchen, setIsSendingToKitchen] = useState(false)
  const { formatAmount } = useTaxSettings()

  const sendToKitchenMutation = useMutation({
    mutationFn: async () => {
      if (!selectedTable || cartItems.length === 0) {
        throw new Error('No table selected or cart is empty.')
      }

    
      const existingOrder = await ordersService.getOrderByTable(selectedTable.id)

   
      const orderItems = cartItems.map(item => {
        const product = products.find(p => p.id === item.product_id)
        return {
          product_id: item.product_id,
          product_name: product?.name || item.product_name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price,
          status: 'active' as const
        }
      })

      if (existingOrder) {
    
      
        await ordersService.updateOrderItems(existingOrder.id, orderItems)
        return 'Order successfully updated in the kitchen.'
      } else {
  
        await ordersService.createOrderFromCart(
          selectedTable.id,
          selectedTable.name,
          orderItems
        )
        return 'New order successfully sent to the kitchen.'
      }
    }
  })

  const sendToKitchen = async () => {
    setIsSendingToKitchen(true)
    try {
      await sendToKitchenMutation.mutateAsync()
    } catch (error) {
      console.error('Error during the\'sending to the kitchen:', error)
      throw error
    } finally {
      setIsSendingToKitchen(false)
    }
  }

  const processPayment = async (
    totalAmount: number,
    taxAmount: number,
    itemsCount: number,
    paymentMethodName: string,
    customerName: string,
    onSuccess: () => void
  ) => {
    setIsProcessingPayment(true)

    try {
    
      await new Promise(resolve => setTimeout(resolve, 1500))

      
      await logsService.logSaleEvent(
        selectedTable?.id,
        selectedTable?.name,
        totalAmount,
        itemsCount,
        paymentMethodName,
        customerName,
        cartItems.map((item: any) => ({
          product_name: item.product_name,
          quantity: item.quantity,
          unit_price: item.unit_price
        }))
      )

     
      try {
        await logsService.logFinancialEvent(
          `Sales – VAT collected`,
          `Sale with VAT of ${formatAmount(taxAmount)}`,
          taxAmount,
          {
            tax_amount: taxAmount,
            subtotal: totalAmount - taxAmount,
            total: totalAmount,
            items_count: itemsCount,
            payment_method: paymentMethodName,
            customer_name: customerName,
            table_id: selectedTable?.id,
            table_name: selectedTable?.name
          }
        )
      } catch (taxError) {
        console.error('❌ Error while …\'saving VAT details:', taxError)
  
      }

      onSuccess()
    } catch (error) {
      console.error('❌ Error during payment:', error)
      throw error
    } finally {
      setIsProcessingPayment(false)
    }
  }

  return {
    sendToKitchen,
    processPayment,
    isProcessingPayment,
    isSendingToKitchen,
    sendToKitchenMutation
  }
}
