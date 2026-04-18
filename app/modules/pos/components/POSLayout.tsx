import AsyncStorage from '@react-native-async-storage/async-storage'
import { useFocusEffect } from 'expo-router'
import { useCallback, useState } from 'react'
import {
    StatusBar,
    StyleSheet,
    Text, TouchableOpacity,
    useWindowDimensions,
    View,
} from 'react-native'
import { MenuItemFilters } from '../../menu-items/services/menu-items-services'
import { Category } from '../services/categoriesService'
import { CartItemDisplay, TableData } from '../types'
import CartSection from './cartSection'
import { MenuItemDisplay } from './menuItemCard'
import MenuItemsSection from './menuItemSection'
import TablesSection from './tablesSection'

const C = {
  espresso:    '#1C1008',
  clay:        '#7A4528',
  latte:       '#C8956A',
  cream:       '#FDF6EC',
  parchment:   '#F5E9D4',
  vellum:      '#EDD9BC',
  brass:       '#B5822A',
  brassLight:  '#F7EDD8',
  sage:        '#3B6E52',
  sageLight:   '#EBF4EE',
  sageBorder:  '#9FCFB4',
  terracotta:  '#A03020',
  tcLight:     '#FAECEA',
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
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={C.parchment} />

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
              <Text style={[styles.topToggleText, showTables && styles.topToggleTextActive]}>
                🏠 Tables
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.topToggle, styles.topToggleHanded]}
              onPress={toggleHanded}
            >
              <Text style={styles.topToggleTextHanded}>
                {handedMode ? '🤚 Left' : '✋ Right'}
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
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={C.parchment} />

      <View style={styles.topBar}>
        <View style={styles.brand}>
          <View style={styles.brandIcon}>
            <Text style={styles.brandIconText}>Z</Text>
          </View>
          <Text style={styles.brandName}>Zikiro POS</Text>
        </View>

        <TouchableOpacity
          style={[styles.topToggle, showTables && styles.topToggleActive]}
          onPress={toggleTables}
        >
          <Text style={[styles.topToggleText, showTables && styles.topToggleTextActive]}>
            🏠
          </Text>
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
          <Text style={[styles.mobileTabText, activePanel === 'menu' && styles.mobileTabTextActive]}>
            🍽 Menu
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.mobileTab, activePanel === 'cart' && styles.mobileTabActive]}
          onPress={() => setActivePanel('cart')}
        >
          <Text style={[styles.mobileTabText, activePanel === 'cart' && styles.mobileTabTextActive]}>
            🛒 Cart{cartItems.length > 0 ? ` (${cartItems.length})` : ''}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.body}>
        {activePanel === 'menu' ? MenuColumn : CartColumn}
      </View>

      <View style={styles.bottomRule} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.cream,
  },


  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: C.parchment,
    borderBottomWidth: 1.5,
    borderBottomColor: C.vellum,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  brandIcon: {
    width: 30,
    height: 30,
    borderRadius: radius.sm,
    backgroundColor: C.sage,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandIconText: {
    fontSize: 14,
    fontWeight: '900',
    color: C.cream,
  },
  brandName: {
    fontSize: 16,
    fontWeight: '800',
    color: C.espresso,
  },

  topBarControls: {
    flexDirection: 'row',
    gap: 8,
  },
  topToggle: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: C.cream,
    borderWidth: 1.5,
    borderColor: C.vellum,
  },
  topToggleActive: {
    backgroundColor: C.sageLight,
    borderColor: C.sageBorder,
  },
  topToggleHanded: {
    backgroundColor: C.brassLight,
    borderColor: C.brass,
  },
  topToggleText: {
    fontSize: 12,
    fontWeight: '700',
    color: C.clay,
  },
  topToggleTextActive: {
    color: C.sage,
  },
  topToggleTextHanded: {
    fontSize: 12,
    fontWeight: '700',
    color: C.brass,
  },

  selectedTableBadge: {
    backgroundColor: C.sage,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  selectedTableText: {
    fontSize: 12,
    fontWeight: '800',
    color: C.cream,
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
    backgroundColor: C.vellum,
  },

  mobileTabs: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: C.parchment,
    borderBottomWidth: 1.5,
    borderBottomColor: C.vellum,
  },
  mobileTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 9,
    borderRadius: radius.pill,
    backgroundColor: C.cream,
    borderWidth: 1.5,
    borderColor: C.vellum,
  },
  mobileTabActive: {
    backgroundColor: C.sageLight,
    borderColor: C.sageBorder,
  },
  mobileTabText: {
    fontSize: 13,
    fontWeight: '700',
    color: C.clay,
  },
  mobileTabTextActive: {
    color: C.sage,
  },

  bottomRule: {
    height: 2,
    backgroundColor: C.espresso,
  },
})
