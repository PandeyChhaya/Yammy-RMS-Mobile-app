import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, Package, TrendingDown } from 'lucide-react-native'
import { useState } from 'react'
import {
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native'
import { productsService } from '../products/services/productService'

const Colors = {
  bg: '#FEF1A8',
  card: '#FFFFFF',
  brand: '#C41E1E',
  text: '#1A1A1A',
  textSub: '#5C5436',
  border: '#E8D88A',
  success: '#22C55E',
  warning: '#EAB308',
  danger: '#EF4444',
}

export default function Inventory() {
  const [showAdjustModal, setShowAdjustModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [adjustmentQty, setAdjustmentQty] = useState('')
  const [adjustmentReason, setAdjustmentReason] = useState('')

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: productsService.getProducts,
  })

  const getStockStatus = (product: any) => {
    const stock = product.stock_quantity || 0
    const minStock = product.min_stock || 0

    if (stock === 0) return { label: 'Out of Stock', color: Colors.danger }
    if (stock <= minStock) return { label: 'Low Stock', color: Colors.warning }
    return { label: 'In Stock', color: Colors.success }
  }

  const lowStockProducts = products.filter((p: any) => 
    (p.stock_quantity || 0) <= (p.min_stock || 0)
  )

  const outOfStockProducts = products.filter((p: any) => 
    (p.stock_quantity || 0) === 0
  )

  const handleAdjustStock = (product: any) => {
    setSelectedProduct(product)
    setAdjustmentQty('')
    setAdjustmentReason('')
    setShowAdjustModal(true)
  }

  const saveAdjustment = async () => {
    if (!adjustmentQty || !adjustmentReason) {
      Alert.alert('Error', 'Please enter quantity and reason')
      return
    }

    const qty = parseInt(adjustmentQty)
    if (isNaN(qty)) {
      Alert.alert('Error', 'Invalid quantity')
      return
    }

    try {
      const newStock = (selectedProduct.stock_quantity || 0) + qty

      await productsService.updateProduct(selectedProduct.id, {
        stock_quantity: newStock
      })

      Alert.alert('Success', `Stock adjusted: ${qty > 0 ? '+' : ''}${qty}`)
      setShowAdjustModal(false)
    } catch (error) {
      Alert.alert('Error', 'Failed to adjust stock')
    }
  }

  if (isLoading) {
    return (
      <View style={styles.center}>
        <Text>Loading inventory...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Inventory</Text>
          <Text style={styles.headerSubtitle}>Stock Management</Text>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.stats}>
        <View style={[styles.statCard, { borderLeftColor: Colors.success }]}>
          <Package size={20} color={Colors.success} />
          <Text style={styles.statValue}>{products.length}</Text>
          <Text style={styles.statLabel}>Total Items</Text>
        </View>

        <View style={[styles.statCard, { borderLeftColor: Colors.warning }]}>
          <AlertTriangle size={20} color={Colors.warning} />
          <Text style={styles.statValue}>{lowStockProducts.length}</Text>
          <Text style={styles.statLabel}>Low Stock</Text>
        </View>

        <View style={[styles.statCard, { borderLeftColor: Colors.danger }]}>
          <TrendingDown size={20} color={Colors.danger} />
          <Text style={styles.statValue}>{outOfStockProducts.length}</Text>
          <Text style={styles.statLabel}>Out of Stock</Text>
        </View>
      </View>

      {/* Alerts */}
      {lowStockProducts.length > 0 && (
        <View style={styles.alertBanner}>
          <AlertTriangle size={18} color={Colors.warning} />
          <Text style={styles.alertText}>
            {lowStockProducts.length} items need restocking
          </Text>
        </View>
      )}

      {/* Inventory List */}
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {products.map((product: any) => {
          const status = getStockStatus(product)
          const stock = product.stock_quantity || 0
          const minStock = product.min_stock || 0

          return (
            <View key={product.id} style={styles.productCard}>
              <View style={styles.productHeader}>
                <View style={styles.productInfo}>
                  <Text style={styles.productName}>{product.name}</Text>
                  <Text style={styles.productCategory}>{product.category_name}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: status.color }]}>
                  <Text style={styles.statusText}>{status.label}</Text>
                </View>
              </View>

              <View style={styles.productBody}>
                <View style={styles.stockRow}>
                  <View style={styles.stockInfo}>
                    <Text style={styles.stockLabel}>Current Stock</Text>
                    <Text style={[styles.stockValue, { color: status.color }]}>
                      {stock} units
                    </Text>
                  </View>

                  <View style={styles.stockInfo}>
                    <Text style={styles.stockLabel}>Min Stock</Text>
                    <Text style={styles.stockValue}>{minStock} units</Text>
                  </View>

                  <View style={styles.stockInfo}>
                    <Text style={styles.stockLabel}>Value</Text>
                    <Text style={styles.stockValue}>
                      NPR {((product.cost || 0) * stock).toFixed(0)}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.adjustBtn}
                  onPress={() => handleAdjustStock(product)}
                >
                  <Text style={styles.adjustBtnText}>Adjust Stock</Text>
                </TouchableOpacity>
              </View>
            </View>
          )
        })}
      </ScrollView>

      {/* Adjustment Modal */}
      <Modal visible={showAdjustModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Adjust Stock</Text>
              <TouchableOpacity onPress={() => setShowAdjustModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            {selectedProduct && (
              <View style={styles.modalBody}>
                <Text style={styles.modalProductName}>{selectedProduct.name}</Text>
                <Text style={styles.modalCurrentStock}>
                  Current: {selectedProduct.stock_quantity || 0} units
                </Text>

                <View style={styles.quickButtons}>
                  <TouchableOpacity
                    style={styles.quickBtn}
                    onPress={() => setAdjustmentQty('-10')}
                  >
                    <Text style={styles.quickBtnText}>-10</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.quickBtn}
                    onPress={() => setAdjustmentQty('-5')}
                  >
                    <Text style={styles.quickBtnText}>-5</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.quickBtn, styles.quickBtnPositive]}
                    onPress={() => setAdjustmentQty('+5')}
                  >
                    <Text style={styles.quickBtnText}>+5</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.quickBtn, styles.quickBtnPositive]}
                    onPress={() => setAdjustmentQty('+10')}
                  >
                    <Text style={styles.quickBtnText}>+10</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Adjustment (+/-)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="+10 or -5"
                    value={adjustmentQty}
                    onChangeText={setAdjustmentQty}
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Reason</Text>
                  <TextInput
                    style={[styles.input, styles.textarea]}
                    placeholder="Restock, waste, damage, etc."
                    value={adjustmentReason}
                    onChangeText={setAdjustmentReason}
                    multiline
                    numberOfLines={3}
                  />
                </View>

                <TouchableOpacity style={styles.saveBtn} onPress={saveAdjustment}>
                  <Text style={styles.saveBtnText}>Save Adjustment</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { backgroundColor: Colors.brand, paddingTop: 52, paddingHorizontal: 20, paddingBottom: 20 },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#FFF' },
  headerSubtitle: { fontSize: 13, color: '#FFF', opacity: 0.9, marginTop: 4 },
  
  stats: { flexDirection: 'row', padding: 16, gap: 12 },
  statCard: { flex: 1, backgroundColor: Colors.card, borderRadius: 12, padding: 14, borderLeftWidth: 4, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  statValue: { fontSize: 24, fontWeight: '700', color: Colors.text, marginTop: 8 },
  statLabel: { fontSize: 11, color: Colors.textSub, marginTop: 4 },
  
  alertBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FEF3C7', padding: 12, marginHorizontal: 16, borderRadius: 8, marginBottom: 16 },
  alertText: { fontSize: 13, color: '#92400E', fontWeight: '600' },
  
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingTop: 0 },
  
  productCard: { backgroundColor: Colors.card, borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: Colors.border },
  productHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  productInfo: { flex: 1 },
  productName: { fontSize: 15, fontWeight: '600', color: Colors.text },
  productCategory: { fontSize: 12, color: Colors.textSub, marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 11, fontWeight: '600', color: '#FFF' },
  
  productBody: { gap: 12 },
  stockRow: { flexDirection: 'row', gap: 16 },
  stockInfo: { flex: 1 },
  stockLabel: { fontSize: 11, color: Colors.textSub, marginBottom: 4 },
  stockValue: { fontSize: 16, fontWeight: '700', color: Colors.text },
  
  adjustBtn: { backgroundColor: Colors.brand, padding: 10, borderRadius: 8, alignItems: 'center' },
  adjustBtnText: { fontSize: 13, fontWeight: '600', color: '#FFF' },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContainer: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: Colors.border },
  modalTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
  modalClose: { fontSize: 24, color: '#999' },
  modalBody: { padding: 20 },
  modalProductName: { fontSize: 16, fontWeight: '600', color: Colors.text, marginBottom: 4 },
  modalCurrentStock: { fontSize: 13, color: Colors.textSub, marginBottom: 16 },
  
  quickButtons: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  quickBtn: { flex: 1, backgroundColor: '#FEE2E2', padding: 12, borderRadius: 8, alignItems: 'center' },
  quickBtnPositive: { backgroundColor: '#D1FAE5' },
  quickBtnText: { fontSize: 14, fontWeight: '600', color: Colors.text },
  
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: Colors.text, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: Colors.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, backgroundColor: '#FFFDF0' },
  textarea: { minHeight: 80, textAlignVertical: 'top' },
  
  saveBtn: { backgroundColor: Colors.brand, padding: 16, borderRadius: 12, alignItems: 'center' },
  saveBtnText: { fontSize: 15, fontWeight: '600', color: '#FFF' },
})