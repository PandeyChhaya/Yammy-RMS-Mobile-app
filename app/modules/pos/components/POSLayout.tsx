// POSLayout.tsx
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useFocusEffect } from 'expo-router'
import { Hand, LayoutGrid, ShoppingCart, Table2 } from 'lucide-react-native'
import { useCallback, useState } from 'react'
import { StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native'
import { MenuItemFilters } from '../../menu-items/services/menu-items-services'
import { Category } from '../services/categoriesService'
import { CartItemDisplay, TableData } from '../types'
import CartSection from './CartSection'
import { MenuItemDisplay } from './menuItemCard'
import MenuItemsSection from './menuItemSection'
import ReservationWidget from './reservationWidget'
import TablesSection from './tablesSection'

const palette = {
  bg: '#0A0A0A',
  card: '#1A1A1A',
  cardAlt: '#2C2C2C',
  brand: '#FF6B2C',
  brandBg: '#3D1C00',
  text: '#FFFFFF',
  textDim: '#9CA3AF',
  border: '#2C2C2C',
}

const corner = { xs: 6, sm: 10, md: 14, pill: 100 }

// AsyncStorage keys for layout preferences that should persist across visits
const STORAGE_KEYS = {
  showTables: 'pos-show-tables',
  leftHanded: 'pos-left-handed',
}

const TABLET_BREAKPOINT = 768
const CART_COLUMN_WIDTH = 320

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

export default function ModernPOSLayout(props: ModernPOSLayoutProps) {
  const {
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
  } = props

  const { width } = useWindowDimensions()
  const isTablet = width >= TABLET_BREAKPOINT

  const [showTables, setShowTables] = useState(true)
  const [isLeftHanded, setIsLeftHanded] = useState(leftHandedMode)
  const [mobilePanel, setMobilePanel] = useState<'menu' | 'cart'>('menu')

  useFocusEffect(
    useCallback(() => {
      AsyncStorage.multiGet([STORAGE_KEYS.showTables, STORAGE_KEYS.leftHanded]).then((pairs) => {
        const stored = Object.fromEntries(pairs)

        if (stored[STORAGE_KEYS.showTables] !== null) {
          setShowTables(JSON.parse(stored[STORAGE_KEYS.showTables]!))
        }
        if (stored[STORAGE_KEYS.leftHanded] !== null) {
          setIsLeftHanded(JSON.parse(stored[STORAGE_KEYS.leftHanded]!))
        }
      })
    }, [])
  )

  function toggleTablesVisible() {
    const next = !showTables
    setShowTables(next)
    AsyncStorage.setItem(STORAGE_KEYS.showTables, JSON.stringify(next))
  }

  function toggleHandedness() {
    const next = !isLeftHanded
    setIsLeftHanded(next)
    AsyncStorage.setItem(STORAGE_KEYS.leftHanded, JSON.stringify(next))
  }

  const menuFilters: MenuItemFilters = {
    searchTerm,
    selectedCategory,
    onSearchChange,
    onCategoryChange,
  }

  const menuColumn = (
    <View style={styles.menuColumn}>
      {showTables ? (
        <TablesSection tables={tables} selectedTable={selectedTable} onTableSelect={onTableSelect} />
      ) : null}
      <ReservationWidget selectedTable={selectedTable} />
      <View style={{ flex: 1 }}>
        <MenuItemsSection
          items={menuItems}
          categories={categories}
          filters={menuFilters}
          onItemSelect={onMenuItemSelect}
          getCategoryColor={getCategoryColor}
          symbol={symbol}
        />
      </View>
    </View>
  )

  const cartColumn = (
    <View style={[styles.cartColumn, isTablet && styles.cartColumnTablet]}>
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
      <View style={styles.safeArea}>
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
              onPress={toggleTablesVisible}
            >
              <Table2 size={13} color={showTables ? palette.brand : palette.textDim} />
              <Text style={[styles.topToggleText, showTables && styles.topToggleTextActive]}>Tables</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.topToggle, styles.topToggleHanded]} onPress={toggleHandedness}>
              <Hand size={13} color={palette.text} />
              <Text style={styles.topToggleTextHanded}>{isLeftHanded ? 'Left' : 'Right'}</Text>
            </TouchableOpacity>
          </View>

          {selectedTable ? (
            <View style={styles.selectedTableBadge}>
              <Text style={styles.selectedTableText}>Table {selectedTable.table_number}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.body}>
          {isLeftHanded ? (
            <>
              {cartColumn}
              <View style={styles.divider} />
              {menuColumn}
            </>
          ) : (
            <>
              {menuColumn}
              <View style={styles.divider} />
              {cartColumn}
            </>
          )}
        </View>

        <View style={styles.bottomRule} />
      </View>
    )
  }

  return (
    <View style={styles.safeArea}>
      <View style={styles.topBar}>
        <View style={styles.brand}>
          <View style={styles.brandIcon}>
            <Text style={styles.brandIconText}>Y</Text>
          </View>
          <Text style={styles.brandName}>Yammy POS</Text>
        </View>

        <TouchableOpacity style={[styles.topToggle, showTables && styles.topToggleActive]} onPress={toggleTablesVisible}>
          <Table2 size={13} color={showTables ? palette.brand : palette.textDim} />
        </TouchableOpacity>

        {selectedTable ? (
          <View style={styles.selectedTableBadge}>
            <Text style={styles.selectedTableText}>T{selectedTable.table_number}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.mobileTabs}>
        <TouchableOpacity
          style={[styles.mobileTab, mobilePanel === 'menu' && styles.mobileTabActive]}
          onPress={() => setMobilePanel('menu')}
        >
          <LayoutGrid size={14} color={mobilePanel === 'menu' ? palette.brand : palette.textDim} />
          <Text style={[styles.mobileTabText, mobilePanel === 'menu' && styles.mobileTabTextActive]}>Menu</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.mobileTab, mobilePanel === 'cart' && styles.mobileTabActive]}
          onPress={() => setMobilePanel('cart')}
        >
          <ShoppingCart size={14} color={mobilePanel === 'cart' ? palette.brand : palette.textDim} />
          <Text style={[styles.mobileTabText, mobilePanel === 'cart' && styles.mobileTabTextActive]}>
            Cart{cartItems.length > 0 ? ` (${cartItems.length})` : ''}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.body}>{mobilePanel === 'menu' ? menuColumn : cartColumn}</View>

      <View style={styles.bottomRule} />
    </View>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: palette.bg,
    paddingBottom: 34,
  },
  container: {
    flex: 1,
    backgroundColor: palette.bg,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    paddingTop: 56,
    backgroundColor: palette.card,
    borderBottomWidth: 1.5,
    borderBottomColor: palette.border,
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
    borderRadius: corner.sm,
    backgroundColor: palette.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandIconText: {
    fontSize: 13,
    fontWeight: '900',
    color: palette.text,
  },
  brandName: {
    fontSize: 15,
    fontWeight: '800',
    color: palette.text,
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
    borderRadius: corner.pill,
    backgroundColor: palette.cardAlt,
    borderWidth: 1.5,
    borderColor: palette.border,
  },
  topToggleActive: {
    backgroundColor: palette.brandBg,
    borderColor: palette.brand,
  },
  topToggleHanded: {
    backgroundColor: palette.cardAlt,
    borderColor: palette.border,
  },
  topToggleText: {
    fontSize: 11,
    fontWeight: '700',
    color: palette.textDim,
  },
  topToggleTextActive: {
    color: palette.brand,
  },
  topToggleTextHanded: {
    fontSize: 11,
    fontWeight: '700',
    color: palette.text,
  },
  selectedTableBadge: {
    backgroundColor: palette.brand,
    borderRadius: corner.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  selectedTableText: {
    fontSize: 11,
    fontWeight: '800',
    color: palette.text,
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
    flex: 1,
  },
  cartColumnTablet: {
    width: CART_COLUMN_WIDTH,
  },
  divider: {
    width: 1.5,
    backgroundColor: palette.border,
  },
  mobileTabs: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: palette.card,
    borderBottomWidth: 1.5,
    borderBottomColor: palette.border,
  },
  mobileTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 7,
    borderRadius: corner.pill,
    backgroundColor: palette.cardAlt,
    borderWidth: 1.5,
    borderColor: palette.border,
  },
  mobileTabActive: {
    backgroundColor: palette.brandBg,
    borderColor: palette.brand,
  },
  mobileTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: palette.textDim,
  },
  mobileTabTextActive: {
    color: palette.brand,
  },
  bottomRule: {
    height: 2,
    backgroundColor: palette.brand,
  },
})