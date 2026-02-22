import { useRouter } from 'expo-router'
import {
    Banknote,
    ChefHat,
    FileText,
    HelpCircle,
    LayoutDashboard,
    Package,
    Receipt,
    Settings,
    ShoppingCart,
    Store,
    Users,
} from 'lucide-react-native'
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native'

interface MenuItem {
  id: string
  label: string
  icon: React.ReactNode
  route: string
}

export default function Dashboard() {
  const router = useRouter()

  const menuItems: MenuItem[] = [
    {
      id: 'order',
      label: 'Order',
      icon: <ShoppingCart size={20} color="#1A1A1A" />,
      route: '/modules/orders/Orders',
    },
    {
      id: 'active-orders',
      label: 'Active Orders',
      icon: <ChefHat size={20} color="#1A1A1A" />,
      route: '/modules/orders/ActiveOrders',
    },
    {
      id: 'table-management',
      label: 'Table Management',
      icon: <LayoutDashboard size={20} color="#1A1A1A" />,
      route: '/modules/tables/Tables',
    },
    {
      id: 'bills',
      label: 'Bills & Receipts',
      icon: <Receipt size={20} color="#1A1A1A" />,
      route: '/modules/reports/Reports',
    },
    {
      id: 'customers',
      label: 'Customer Management',
      icon: <Users size={20} color="#1A1A1A" />,
      route: '/modules/customers/Customers',
    },
    {
      id: 'stock',
      label: 'Stock Management',
      icon: <Package size={20} color="#1A1A1A" />,
      route: '/modules/products/Products',
    },
    {
      id: 'cash-flow',
      label: 'Cash Flow',
      icon: <Banknote size={20} color="#1A1A1A" />,
      route: '/modules/cashflow/CashFlow',
    },
    {
      id: 'summary',
      label: 'Daily Summary',
      icon: <FileText size={20} color="#1A1A1A" />,
      route: '/modules/reports/DailySummary',
    },
    {
      id: 'restaurant',
      label: 'My Restaurant',
      icon: <Store size={20} color="#1A1A1A" />,
      route: '/modules/settings/Restaurant',
    },
    {
      id: 'settings',
      label: 'App Settings',
      icon: <Settings size={20} color="#1A1A1A" />,
      route: '/modules/settings/Settings',
    },
    {
      id: 'help',
      label: 'Need Help?',
      icon: <HelpCircle size={20} color="#1A1A1A" />,
      route: '/modules/help/Help',
    },
  ]

  const handleMenuPress = (route: string) => {
    router.push(route as any)
  }

  return (
    <View style={styles.root}>
      {/* Profile Section */}
      <View style={styles.profileSection}>
        <View style={styles.profileContent}>
          {/* Profile Picture */}
          <View style={styles.profilePicture}>
            <Text style={styles.profileInitial}>Y</Text>
          </View>

          {/* User Info */}
          <View style={styles.userInfo}>
            <Text style={styles.userName}>Yammy Fresh</Text>
            <Text style={styles.userEmail}>yammy@restaurant.com</Text>
          </View>

          {/* Owner Badge */}
          <View style={styles.ownerBadge}>
            <Text style={styles.ownerBadgeText}>Owner</Text>
          </View>
        </View>
      </View>

      {/* Menu Items */}
      <ScrollView style={styles.menuScroll} showsVerticalScrollIndicator={false}>
        <View style={styles.menuList}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.menuItem,
                index === menuItems.length - 1 && styles.menuItemLast,
              ]}
              onPress={() => handleMenuPress(item.route)}
            >
              <View style={styles.menuItemIcon}>{item.icon}</View>
              <Text style={styles.menuItemText}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FEF1A8', // Yammy Fresh yellow
  },

  // Profile Section
  profileSection: {
    backgroundColor: '#2C2C2C', // Dark background like image
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  profileContent: {
    alignItems: 'center',
    gap: 12,
  },
  profilePicture: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#C41E1E', // Yammy Fresh red
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  profileInitial: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Inter-Bold',
  },
  userInfo: {
    alignItems: 'center',
    gap: 4,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Inter-Bold',
  },
  userEmail: {
    fontSize: 14,
    color: '#D1D5DB',
    fontFamily: 'Inter',
  },
  ownerBadge: {
    backgroundColor: '#FEF1A8',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 8,
  },
  ownerBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Inter',
  },

  // Menu Items
  menuScroll: {
    flex: 1,
  },
  menuList: {
    paddingVertical: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E8D88A', // Slightly darker yellow for separator
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuItemIcon: {
    marginRight: 16,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
    fontFamily: 'Inter',
  },
})
