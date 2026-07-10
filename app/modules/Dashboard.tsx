import AsyncStorage from '@react-native-async-storage/async-storage'
import { useRouter } from 'expo-router'
import {
  Bell,
  BookOpen,
  ChefHat,
  ClipboardList,
  Coffee,
  Grid,
  LogOut,
  Package,
  ShoppingCart,
  Table2,
  Users,
} from 'lucide-react-native'
import { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { authService } from './auth/services/auth.service'
import { ordersService } from './orders/services/orderService'
import tableService from './pos/services/tablesService'

const colors = {
  bg: '#0A0A0A',
  card: '#1A1A1A',
  inner: '#2C2C2C',
  border: '#2E2E2E',
  accent: '#FF6B2C',
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  white: '#FFFFFF',
  muted: '#777777',
  mutedDark: '#444444',
  label: '#999999',
}

const radius = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  pill: 100,
}

interface DashboardStats {
  todayOrders: number
  activeTables: number
  totalRevenue: number
  pendingOrders: number
}

interface ModuleItem {
  id: string
  label: string
  sub: string
  icon: React.ReactNode
  route: string
  roles: string[]
  accent: string
}

const ALL_MODULES: ModuleItem[] = [
  {
    id: 'pos',
    label: 'POS',
    sub: 'Point of sale',
    icon: <ShoppingCart size={22} color={colors.accent} />,
    route: '/modules/pos/POS',
    roles: ['Admin', 'Cashier'],
    accent: colors.accent,
  },
  {
    id: 'orders',
    label: 'Orders',
    sub: 'Manage orders',
    icon: <ClipboardList size={22} color={colors.warning} />,
    route: '/modules/orders/Orders',
    roles: ['Admin', 'Cashier', 'Kitchen Staff'],
    accent: colors.warning,
  },
  {
    id: 'tables',
    label: 'Tables',
    sub: 'Manage tables',
    icon: <Table2 size={22} color={colors.success} />,
    route: '/modules/tables/tables',
    roles: ['Admin', 'Cashier', 'Waiter'],
    accent: colors.success,
  },
  {
    id: 'reservation',
    label: 'Reservation',
    sub: 'Manage bookings',
    icon: <BookOpen size={22} color={colors.success} />,
    route: '/modules/reservation/reservation',
    roles: ['Admin', 'Cashier', 'Waiter'],
    accent: colors.success,
  },
  {
    id: 'inventory',
    label: 'Inventory',
    sub: 'Stock management',
    icon: <Package size={22} color={colors.warning} />,
    route: '/modules/inventory/inventory',
    roles: ['Admin'],
    accent: colors.warning,
  },
  {
    id: 'categories',
    label: 'Categories',
    sub: 'Menu categories',
    icon: <Grid size={22} color={colors.accent} />,
    route: '/modules/categories/Categories',
    roles: ['Admin'],
    accent: colors.accent,
  },
  {
    id: 'menu-items',
    label: 'Menu Items',
    sub: 'Manage menu',
    icon: <Coffee size={22} color={colors.accent} />,
    route: '/modules/menu-items/menu-items',
    roles: ['Admin'],
    accent: colors.accent,
  },
  {
    id: 'users',
    label: 'Users',
    sub: 'Manage staff',
    icon: <Users size={22} color={colors.accent} />,
    route: '/modules/users/userManagement',
    roles: ['Admin'],
    accent: colors.accent,
  },
  {
    id: 'waiter',
    label: 'Waiter Calls',
    sub: 'Customer requests',
    icon: <Bell size={22} color={colors.success} />,
    route: '/modules/waiter/WaiterNotifications',
    roles: ['Waiter'],
    accent: colors.success,
  },
  {
    id: 'kitchen',
    label: 'Kitchen',
    sub: 'Order queue',
    icon: <ChefHat size={22} color={colors.warning} />,
    route: '/modules/orders/Orders',
    roles: ['Kitchen Staff'],
    accent: colors.warning,
  },
  {
    id: 'minis',
    label: 'Minis',
    sub: 'Short Videos',
    icon: <ClipboardList size={22} color={colors.success} />,
    route: '/modules/minis/minis',
    roles: ['Super Admin', 'Admin'],
    accent: colors.warning,
  },
  {
    id: 'settings',
    label: 'Settings',
    sub: 'Settings',
    icon: <ClipboardList size={22} color={colors.success} />,
    route: '/modules/settings/settings',
    roles: ['Super Admin', 'Admin', 'Cashier', 'Kitchen Staff', 'Waiter'],
    accent: colors.warning,
  },
]

export default function Dashboard() {
  const router = useRouter()
  const [userName, setUserName] = useState('...')
  const [userRole, setUserRole] = useState('')
  const [stats, setStats] = useState<DashboardStats>({
    todayOrders: 0,
    activeTables: 0,
    totalRevenue: 0,
    pendingOrders: 0,
  })
  const [loadingStats, setLoadingStats] = useState(true)
  const [statsError, setStatsError] = useState(false)

  useEffect(() => {
    loadUser()
    loadStats()
  }, [])

  async function loadUser() {
    try {
      const name = await AsyncStorage.getItem('@userName')
      const role = await AsyncStorage.getItem('@userRole')

      if (name) {
        setUserName(name)
      }

      if (role) {
        setUserRole(role)
      } else {
        setUserRole('')
      }
    } catch (err) {
      console.log('failed to load user from storage', err)
    }
  }

 async function loadStats() {
  setStatsError(false)
  try {
    const token = await AsyncStorage.getItem('@accessToken')
    if (!token) return

    const role = await AsyncStorage.getItem('@userRole')
    if (role !== 'Admin') {
      setLoadingStats(false)
      return  // skip stats for non-admin roles
    }

    const restaurantId = await AsyncStorage.getItem('@restaurantId')
    if (!restaurantId) return

    const [orders, tables] = await Promise.all([
      ordersService.getOrder(Number(restaurantId)),
      tableService.getTable(Number(restaurantId)),
    ])
    console.log('orders:', JSON.stringify(orders))
console.log('tables:', JSON.stringify(tables))

    const todayStr = new Date().toISOString().split('T')[0]
    const todaysOrders = orders.filter((o: any) => o.created_at?.startsWith(todayStr))
    const revenueToday = todaysOrders.reduce((sum: number, o: any) => sum + (Number(o.total_amount) || 0), 0)
    const pending = orders.filter((o: any) => o.order_status === 'pending')
    const occupiedTables = tables.filter((t: any) => t.table_status !== 'available' && t.table_status !== 'free')

    setStats({
      todayOrders: todaysOrders.length,
      activeTables: occupiedTables.length,
      totalRevenue: revenueToday,
      pendingOrders: pending.length,
    })
  } catch (err) {
    console.log('dashboard stats failed:', err)
    setStatsError(true)
  } finally {
    setLoadingStats(false)
  }
}
  async function handleLogout() {
    await authService.logout()
    router.replace('/modules/auth/login')
  }

  const visibleModules = ALL_MODULES.filter((mod) => mod.roles.includes(userRole))

  const statCards = [
    { label: "Today's Orders", value: stats.todayOrders, prefix: '', color: colors.accent },
    { label: 'Active Tables', value: stats.activeTables, prefix: '', color: colors.success },
    { label: 'Revenue', value: stats.totalRevenue, prefix: 'NPR ', color: colors.accent },
    { label: 'Pending', value: stats.pendingOrders, prefix: '', color: colors.error },
  ]

  return (
    <View style={styles.container}>
      <View style={styles.blobTopRight} />
      <View style={styles.blobBottomLeft} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Image
            source={require('../../assets/images/yammy.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
            <LogOut size={16} color={colors.muted} />
          </TouchableOpacity>
        </View>

        <View style={styles.userCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{userName.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.userName}>{userName}</Text>
            <View style={styles.rolePill}>
              <View style={styles.roleDot} />
              <Text style={styles.roleText}>{userRole || 'Staff'}</Text>
            </View>
          </View>
          <View style={styles.onlinePill}>
            <View style={styles.onlineDot} />
            <Text style={styles.onlineText}>Online</Text>
          </View>
        </View>
{userRole === 'Admin' && (
  <>
    <Text style={styles.sectionTitle}>TODAY'S OVERVIEW</Text>
    <View style={styles.statsGrid}>
      {statCards.map((card) => (
        <View key={card.label} style={styles.statCard}>
          {loadingStats ? (
            <ActivityIndicator size="small" color={card.color} />
          ) : statsError ? (
            <Text style={[styles.statValue, { color: colors.muted, fontSize: 14 }]}>--</Text>
          ) : (
            <Text style={[styles.statValue, { color: card.color }]}>
              {card.prefix}
              {card.label === 'Revenue' ? Number(card.value).toLocaleString() : card.value}
            </Text>
          )}
          <Text style={styles.statLabel}>{card.label}</Text>
        </View>
      ))}
    </View>
  </>
)}
        <Text style={styles.sectionTitle}>MODULES</Text>
        <View style={styles.modulesGrid}>
          {visibleModules.map((mod) => (
            <TouchableOpacity
              key={mod.id}
              style={styles.moduleCard}
              onPress={() => router.push(mod.route as any)}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.moduleIconBox,
                  { backgroundColor: mod.accent + '18', borderColor: mod.accent + '44' },
                ]}
              >
                {mod.icon}
              </View>
              <Text style={styles.moduleLabel}>{mod.label}</Text>
              <Text style={styles.moduleSub}>{mod.sub}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  blobTopRight: {
    position: 'absolute',
    top: -70,
    right: -70,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: colors.accent,
    opacity: 0.07,
  },
  blobBottomLeft: {
    position: 'absolute',
    bottom: 100,
    left: -90,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: colors.accent,
    opacity: 0.05,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  logo: {
    width: 120,
    height: 28,
  },
  logoutBtn: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 28,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: radius.sm,
    backgroundColor: colors.accent + '22',
    borderWidth: 1.5,
    borderColor: colors.accent + '55',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.accent,
  },
  userName: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.white,
    marginBottom: 5,
  },
  rolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    backgroundColor: colors.inner,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  roleDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.accent,
  },
  roleText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.accent,
    letterSpacing: 0.5,
  },
  onlinePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.success + '18',
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.success + '44',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.success,
  },
  onlineText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.success,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.label,
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 28,
  },
  statCard: {
    width: '47%',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 4,
  },
  statValue: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 11,
    color: colors.muted,
    fontWeight: '600',
  },
  modulesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  moduleCard: {
    width: '47%',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 6,
  },
  moduleIconBox: {
    width: 46,
    height: 46,
    borderRadius: radius.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  moduleLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.white,
  },
  moduleSub: {
    fontSize: 10,
    color: colors.muted,
    fontWeight: '500',
  },
})