import AsyncStorage from '@react-native-async-storage/async-storage'
import { useFocusEffect } from 'expo-router'
import { Hand, LayoutGrid, ShoppingCart, Table2 } from 'lucide-react-native'
import { useCallback, useState } from 'react'
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text, TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native'
import { MenuItemFilters } from '../../menu-items/services/menu-items-services'
import { Category } from '../services/categoriesService'
import { CartItemDisplay, TableData } from '../types'
import CartSection from './CartSection'
import { MenuItemDisplay } from './menuItemCard'
import MenuItemsSection from './menuItemSection'
import ReservationWidget from './reservationWidget'
import TablesSection from './tablesSection'

const C = {
  background:       '#0A0A0A',
  surface:          '#1A1A1A',
  surfaceHighlight: '#2C2C2C',
  primary:          '#FF6B2C',
  primaryDim:       '#3D1C00',
  textMain:         '#FFFFFF',
  textMuted:        '#9CA3AF',
  border:           '#2C2C2C',
}

const radius = { xs: 6, sm: 10, md: 14, pill: 100 }
const SK = {
  showTables: 'modern-pos-show-tables',
  handedMode: 'modern-pos-left-handed',
}

interface ModernPOSLayoutProps {
  tables: TableData[]
  selectedTable: TableData | null
  onTableSelect: (table: TableData | null) => void

  cartItems: CartItemDisplay[]
  cartTotal: number
  customerName: string
  setCustomerName: (name: string) => void
  paymentMethod: string
  setPaymentMethod: (method: string) => void
  onRemove: (menuItemId: string) => void
  onUpdateQuantity: (menuItemId: string, quantity: number) => void
  onPayment: () => void
  onSendToKitchen: () => void
  onClearCart: () => void
  onSplitTicket: () => void
  isSendingToKitchen: boolean
  showSuccessMessage: string | null
  showErrorMessage: string | null
  getCartTax: () => number
  getCartTotalWithTax: () => number
  getCartTaxBreakdown: () => any[]
  getCategoryColor: (categoryId: number) => string

  menuItems: MenuItemDisplay[]
  categories: Category[]
  searchTerm: string
  selectedCategory: string
  onSearchChange: (term: string) => void
  onCategoryChange: (categoryId: string) => void
  onMenuItemSelect: (item: MenuItemDisplay) => void

  leftHandedMode?: boolean
  symbol?: string
}

export default function ModernPOSLayout({
  tables,
  selectedTable,
  onTableSelect,
  cartItems,
  cartTotal,
  customerName,
  setCustomerName,
  paymentMethod,
  setPaymentMethod,
  onRemove,
  onUpdateQuantity,
  onPayment,
  onSendToKitchen,
  onClearCart,
  onSplitTicket,
  isSendingToKitchen,
  showSuccessMessage,
  showErrorMessage,
  getCartTax,
  getCartTotalWithTax,
  getCartTaxBreakdown,
  getCategoryColor,
  menuItems,
  categories,
  searchTerm,
  selectedCategory,
  onSearchChange,
  onCategoryChange,
  onMenuItemSelect,
  leftHandedMode = false,
  symbol = 'NPR',
}: ModernPOSLayoutProps) {
  const { width } = useWindowDimensions()
  const isTablet  = width >= 768

  const [showTables,  setShowTables]  = useState(true)
  const [handedMode,  setHandedMode]  = useState(leftHandedMode)
  const [activePanel, setActivePanel] = useState<'menu' | 'cart'>('menu')

  useFocusEffect(
    useCallback(() => {
      AsyncStorage.multiGet([SK.showTables, SK.handedMode]).then((pairs) => {
        const map = Object.fromEntries(pairs.map(([k, v]) => [k, v]))
        if (map[SK.showTables] !== null)
          setShowTables(JSON.parse(map[SK.showTables]!))
        if (map[SK.handedMode] !== null)
          setHandedMode(JSON.parse(map[SK.handedMode]!))
      })
    }, [])
  )

  const toggleTables = () => {
    const next = !showTables
    setShowTables(next)
    AsyncStorage.setItem(SK.showTables, JSON.stringify(next))
  }

  const toggleHanded = () => {
    const next = !handedMode
    setHandedMode(next)
    AsyncStorage.setItem(SK.handedMode, JSON.stringify(next))
  }

  const menuFilters: MenuItemFilters = {
    searchTerm,
    selectedCategory,
    onSearchChange,
    onCategoryChange,
  }

  const MenuColumn = (
    <View style={styles.menuColumn}>
      <MenuItemsSection
        items={menuItems}
        categories={categories}
        filters={menuFilters}
        onItemSelect={onMenuItemSelect}
        getCategoryColor={getCategoryColor}
        symbol={symbol}
      />
      {showTables && (
        <TablesSection
          tables={tables}
          selectedTable={selectedTable}
          onTableSelect={onTableSelect}
        />
      )}
      <ReservationWidget selectedTable={selectedTable} />
    </View>
  )

  const CartColumn = (
    <View style={styles.cartColumn}>
      <CartSection
        selectedTable={selectedTable}
        cartItems={cartItems}
        cartTotal={cartTotal}
        customerName={customerName}
        setCustomerName={setCustomerName}
        paymentMethod={paymentMethod}
        setPaymentMethod={setPaymentMethod}
        onRemove={onRemove}
        onUpdateQuantity={onUpdateQuantity}
        onPayment={onPayment}
        onSendToKitchen={onSendToKitchen}
        onClearCart={onClearCart}
        onSplitTicket={onSplitTicket}
        isSendingToKitchen={isSendingToKitchen}
        showSuccessMessage={showSuccessMessage}
        showErrorMessage={showErrorMessage}
        getCartTax={getCartTax}
        getCartTotalWithTax={getCartTotalWithTax}
        getCartTaxBreakdown={getCartTaxBreakdown}
        getCategoryColor={getCategoryColor}
        symbol={symbol}
      />
    </View>
  )

  if (isTablet) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor={C.surface} />

        <View style={styles.topBar}>
          <View style={styles.brand}>
            <View style={styles.brandIcon}>
              <Text style={styles.brandIconText}>Z</Text>
            </View>
            <Text style={styles.brandName}>Yammy POS</Text>
          </View>

          <View style={styles.topBarControls}>
            <TouchableOpacity
              style={[styles.topToggle, showTables && styles.topToggleActive]}
              onPress={toggleTables}
            >
              <Table2 size={13} color={showTables ? C.primary : C.textMuted} />
              <Text style={[styles.topToggleText, showTables && styles.topToggleTextActive]}>
                Tables
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.topToggle, styles.topToggleHanded]}
              onPress={toggleHanded}
            >
              <Hand size={13} color={C.textMain} />
              <Text style={styles.topToggleTextHanded}>
                {handedMode ? 'Left' : 'Right'}
              </Text>
            </TouchableOpacity>
          </View>

          {selectedTable && (
            <View style={styles.selectedTableBadge}>
              <Text style={styles.selectedTableText}>
                Table {selectedTable.table_number}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.body}>
          {handedMode ? (
            <>
              {CartColumn}
              <View style={styles.divider} />
              {MenuColumn}
            </>
          ) : (
            <>
              {MenuColumn}
              <View style={styles.divider} />
              {CartColumn}
            </>
          )}
        </View>

        <View style={styles.bottomRule} />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={C.surface} />

      <View style={styles.topBar}>
        <View style={styles.brand}>
          <View style={styles.brandIcon}>
            <Text style={styles.brandIconText}>Z</Text>
          </View>
          <Text style={styles.brandName}>Yammy POS</Text>
        </View>

        <TouchableOpacity
          style={[styles.topToggle, showTables && styles.topToggleActive]}
          onPress={toggleTables}
        >
          <Table2 size={13} color={showTables ? C.primary : C.textMuted} />
        </TouchableOpacity>

        {selectedTable && (
          <View style={styles.selectedTableBadge}>
            <Text style={styles.selectedTableText}>
              T{selectedTable.table_number}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.mobileTabs}>
        <TouchableOpacity
          style={[styles.mobileTab, activePanel === 'menu' && styles.mobileTabActive]}
          onPress={() => setActivePanel('menu')}
        >
          <LayoutGrid size={14} color={activePanel === 'menu' ? C.primary : C.textMuted} />
          <Text style={[styles.mobileTabText, activePanel === 'menu' && styles.mobileTabTextActive]}>
            Menu
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.mobileTab, activePanel === 'cart' && styles.mobileTabActive]}
          onPress={() => setActivePanel('cart')}
        >
          <ShoppingCart size={14} color={activePanel === 'cart' ? C.primary : C.textMuted} />
          <Text style={[styles.mobileTabText, activePanel === 'cart' && styles.mobileTabTextActive]}>
            Cart{cartItems.length > 0 ? ` (${cartItems.length})` : ''}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.body}>
        {activePanel === 'menu' ? MenuColumn : CartColumn}
      </View>

      <View style={styles.bottomRule} />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea:  { flex: 1, backgroundColor: C.background },
  container: { flex: 1, backgroundColor: C.background },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: C.surface,
    borderBottomWidth: 1.5,
    borderBottomColor: C.border,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    flex: 1,
  },
  brandIcon: {
    width: 26,
    height: 26,
    borderRadius: radius.sm,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandIconText: {
    fontSize: 13,
    fontWeight: '900',
    color: C.textMain,
  },
  brandName: {
    fontSize: 15,
    fontWeight: '800',
    color: C.textMain,
  },

  topBarControls: {
    flexDirection: 'row',
    gap: 6,
  },
  topToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: C.surfaceHighlight,
    borderWidth: 1.5,
    borderColor: C.border,
  },
  topToggleActive: {
    backgroundColor: C.primaryDim,
    borderColor: C.primary,
  },
  topToggleHanded: {
    backgroundColor: C.surfaceHighlight,
    borderColor: C.border,
  },
  topToggleText: {
    fontSize: 11,
    fontWeight: '700',
    color: C.textMuted,
  },
  topToggleTextActive: {
    color: C.primary,
  },
  topToggleTextHanded: {
    fontSize: 11,
    fontWeight: '700',
    color: C.textMain,
  },

  selectedTableBadge: {
    backgroundColor: C.primary,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  selectedTableText: {
    fontSize: 11,
    fontWeight: '800',
    color: C.textMain,
  },

  body: {
    flex: 1,
    flexDirection: 'row',
  },
  menuColumn: {
    flex: 1,
    flexDirection: 'column',
  },
  cartColumn: {
    width: 320,
  },
  divider: {
    width: 1.5,
    backgroundColor: C.border,
  },

  mobileTabs: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: C.surface,
    borderBottomWidth: 1.5,
    borderBottomColor: C.border,
  },
  mobileTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 7,
    borderRadius: radius.pill,
    backgroundColor: C.surfaceHighlight,
    borderWidth: 1.5,
    borderColor: C.border,
  },
  mobileTabActive: {
    backgroundColor: C.primaryDim,
    borderColor: C.primary,
  },
  mobileTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: C.textMuted,
  },
  mobileTabTextActive: {
    color: C.primary,
  },

  bottomRule: {
    height: 2,
    backgroundColor: C.primary,
  },
})
