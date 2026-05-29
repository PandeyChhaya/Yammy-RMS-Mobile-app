import AsyncStorage from '@react-native-async-storage/async-storage'
import { useRouter } from 'expo-router'
import {
  Bell, BookOpen, ChefHat, ClipboardList,
  Coffee, Grid, LogOut, Package,
  ShoppingCart, Table2, Users
} from 'lucide-react-native'
import { useEffect, useState } from 'react'
import {
  ActivityIndicator, Image, ScrollView,
  StyleSheet, Text, TouchableOpacity, View,
} from 'react-native'
import { authService } from './auth/services/auth.service'
import { ordersService } from './orders/services/orderService'
import tablesService from './pos/services/tablesService'

const C = {
  bg:        '#0A0A0A',
  card:      '#1A1A1A',
  inner:     '#2C2C2C',
  border:    '#2E2E2E',
  accent:    '#FF6B2C',
  success:   '#22C55E',
  warning:   '#F59E0B',
  error:     '#EF4444',
  white:     '#FFFFFF',
  muted:     '#777777',
  mutedDark: '#444444',
  label:     '#999999',
}
const R = { xs: 6, sm: 10, md: 14, lg: 18, xl: 24, pill: 100 }

interface Stats {
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

export default function Dashboard() {
  const router = useRouter()
  const [userName, setUserName]         = useState('...')
  const [userRole, setUserRole]         = useState('')
  const [stats, setStats]               = useState<Stats>({ todayOrders: 0, activeTables: 0, totalRevenue: 0, pendingOrders: 0 })
  const [loadingStats, setLoadingStats] = useState(true)

  useEffect(() => { loadUser(); loadStats() }, [])

  const loadUser = async () => {
    const name = await AsyncStorage.getItem('@userName')
    const role = await AsyncStorage.getItem('@userRole')
    if (name) setUserName(name)
    setUserRole(role ?? 'Admin')
  }

  const loadStats = async () => {
    try {
      const token = await AsyncStorage.getItem('@accessToken')
      if (!token) return
      const [orders, tables] = await Promise.all([
        ordersService.getOrder(),
        tablesService.getTable(),
      ])
      const today = new Date().toISOString().split('T')[0]
      const todayOrders    = orders.filter((o: any) => o.created_at?.startsWith(today)).length
      const pendingOrders  = orders.filter((o: any) => o.order_status === 'pending').length
      const activeTables   = tables.filter((t: any) => t.table_status !== 'available' && t.table_status !== 'free').length
      const totalRevenue   = orders
        .filter((o: any) => o.created_at?.startsWith(today))
        .reduce((sum: number, o: any) => sum + (Number(o.total_amount) || 0), 0)
      setStats({ todayOrders, activeTables, totalRevenue, pendingOrders })
    } catch (e) {
      console.log('DASHBOARD ERROR:', e)
    } finally {
      setLoadingStats(false)
    }
  }

  const handleLogout = async () => {
    await authService.logout()
    router.replace('/modules/auth/login')
  }

  const allModules: ModuleItem[] = [
    { id: 'pos',        label: 'POS',          sub: 'Point of sale',      icon: <ShoppingCart size={22} color={C.accent}  />, route: '/modules/pos/POS',                          roles: ['Admin', 'Cashier'],                    accent: C.accent  },
    { id: 'orders',     label: 'Orders',        sub: 'Manage orders',      icon: <ClipboardList size={22} color={C.warning} />, route: '/modules/orders/Orders',                   roles: ['Admin', 'Cashier', 'Kitchen Staff'],   accent: C.warning },
    { id: 'tables',     label: 'Tables',        sub: 'Manage tables',      icon: <Table2 size={22} color={C.success}        />, route: '/modules/tables/tables',                   roles: ['Admin', 'Cashier', 'Waiter'],          accent: C.success },
    { id: 'reservation',label: 'Reservation',   sub: 'Manage bookings',    icon: <BookOpen size={22} color={C.success}      />, route: '/modules/reservation/reservation',         roles: ['Admin', 'Cashier', 'Waiter'],          accent: C.success },
    { id: 'inventory',  label: 'Inventory',     sub: 'Stock management',   icon: <Package size={22} color={C.warning}       />, route: '/modules/inventory/inventory',             roles: ['Admin'],                               accent: C.warning },
    { id: 'categories', label: 'Categories',    sub: 'Menu categories',    icon: <Grid size={22} color={C.accent}           />, route: '/modules/categories/Categories',           roles: ['Admin'],                               accent: C.accent  },
    { id: 'menu-items', label: 'Menu Items',    sub: 'Manage menu',        icon: <Coffee size={22} color={C.accent}         />, route: '/modules/menu-items/menu-items',           roles: ['Admin'],                               accent: C.accent  },
    { id: 'users',      label: 'Users',         sub: 'Manage staff',       icon: <Users size={22} color={C.accent}          />, route: '/modules/users/userManagement',                     roles: ['Admin'],                               accent: C.accent  },
    { id: 'waiter',     label: 'Waiter Calls',  sub: 'Customer requests',  icon: <Bell size={22} color={C.success}          />, route: '/modules/waiter/WaiterNotifications',      roles: ['Waiter'],                              accent: C.success },
    { id: 'kitchen',    label: 'Kitchen',       sub: 'Order queue',        icon: <ChefHat size={22} color={C.warning}       />, route: '/modules/orders/Orders',                   roles: ['Kitchen Staff'],                       accent: C.warning },
      { id: 'minis',    label: 'Minis',       sub: 'Order queue',        icon: <ClipboardList size={22} color={C.success}       />, route: '/modules/minis/minis',                   roles: ['Kitchen Staff','Admin'],                       accent: C.warning },

  ]

  const visibleModules = allModules.filter(m => m.roles.includes(userRole))

  const statCards = [
    { label: "Today's Orders", value: stats.todayOrders,   prefix: '',     color: C.accent  },
    { label: 'Active Tables',  value: stats.activeTables,  prefix: '',     color: C.success },
    { label: 'Revenue',        value: stats.totalRevenue,  prefix: 'NPR ', color: C.accent  },
    { label: 'Pending',        value: stats.pendingOrders, prefix: '',     color: C.error   },
  ]

  return (
    <View style={s.container}>
      {/* Blobs */}
      <View style={s.blobTR} />
      <View style={s.blobBL} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

        {/* ── Header ── */}
        <View style={s.header}>
          <Image source={require('../../assets/images/yammy.png')} style={s.logo} resizeMode="contain" />
          <TouchableOpacity style={s.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
            <LogOut size={16} color={C.muted} />
          </TouchableOpacity>
        </View>

        {/* ── User Card ── */}
        <View style={s.userCard}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{userName.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.userName}>{userName}</Text>
            <View style={s.rolePill}>
              <View style={s.roleDot} />
              <Text style={s.roleText}>{userRole || 'Staff'}</Text>
            </View>
          </View>
          <View style={s.onlinePill}>
            <View style={s.onlineDot} />
            <Text style={s.onlineText}>Online</Text>
          </View>
        </View>

        {/* ── Stats ── */}
        <Text style={s.sectionTitle}>TODAY'S OVERVIEW</Text>
        <View style={s.statsGrid}>
          {statCards.map(card => (
            <View key={card.label} style={s.statCard}>
              {loadingStats
                ? <ActivityIndicator size="small" color={card.color} />
                : <Text style={[s.statValue, { color: card.color }]}>
                    {card.prefix}{card.label === 'Revenue' ? Number(card.value).toLocaleString() : card.value}
                  </Text>
              }
              <Text style={s.statLabel}>{card.label}</Text>
            </View>
          ))}
        </View>

        {/* ── Modules ── */}
        <Text style={s.sectionTitle}>MODULES</Text>
        <View style={s.modulesGrid}>
          {visibleModules.map(mod => (
            <TouchableOpacity
              key={mod.id}
              style={s.moduleCard}
              onPress={() => router.push(mod.route as any)}
              activeOpacity={0.8}
            >
              <View style={[s.moduleIconBox, { backgroundColor: mod.accent + '18', borderColor: mod.accent + '44' }]}>
                {mod.icon}
              </View>
              <Text style={s.moduleLabel}>{mod.label}</Text>
              <Text style={s.moduleSub}>{mod.sub}</Text>
            </TouchableOpacity>
          ))}
        </View>

      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },

  blobTR: {
    position: 'absolute', top: -70, right: -70,
    width: 200, height: 200, borderRadius: 100,
    backgroundColor: C.accent, opacity: 0.07,
  },
  blobBL: {
    position: 'absolute', bottom: 100, left: -90,
    width: 240, height: 240, borderRadius: 120,
    backgroundColor: C.accent, opacity: 0.05,
  },

  scroll: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 40 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  logo: { width: 120, height: 28 },
  logoutBtn: {
    width: 38, height: 38, borderRadius: R.sm,
    backgroundColor: C.card,
    borderWidth: 1, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center',
  },

  userCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: C.card,
    borderRadius: R.xl, borderWidth: 1, borderColor: C.border,
    padding: 16, marginBottom: 28,
  },
  avatar: {
    width: 46, height: 46, borderRadius: R.sm,
    backgroundColor: C.accent + '22',
    borderWidth: 1.5, borderColor: C.accent + '55',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 20, fontWeight: '900', color: C.accent },
  userName:   { fontSize: 15, fontWeight: '800', color: C.white, marginBottom: 5 },
  rolePill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    alignSelf: 'flex-start',
    backgroundColor: C.inner,
    borderRadius: R.pill, borderWidth: 1, borderColor: C.border,
    paddingHorizontal: 9, paddingVertical: 3,
  },
  roleDot:  { width: 5, height: 5, borderRadius: 3, backgroundColor: C.accent },
  roleText: { fontSize: 10, fontWeight: '700', color: C.accent, letterSpacing: 0.5 },
  onlinePill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: C.success + '18',
    borderRadius: R.pill, borderWidth: 1, borderColor: C.success + '44',
    paddingHorizontal: 10, paddingVertical: 5,
  },
  onlineDot:  { width: 6, height: 6, borderRadius: 3, backgroundColor: C.success },
  onlineText: { fontSize: 10, fontWeight: '700', color: C.success },

  sectionTitle: {
    fontSize: 10, fontWeight: '800', color: C.label,
    letterSpacing: 1.5, marginBottom: 12,
  },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 28 },
  statCard: {
    width: '47%',
    backgroundColor: C.card, borderRadius: R.md,
    borderWidth: 1, borderColor: C.border,
    padding: 16, gap: 4,
  },
  statValue: { fontSize: 26, fontWeight: '900', letterSpacing: -0.5 },
  statLabel: { fontSize: 11, color: C.muted, fontWeight: '600' },

  modulesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  moduleCard: {
    width: '47%',
    backgroundColor: C.card, borderRadius: R.md,
    borderWidth: 1, borderColor: C.border,
    padding: 16, gap: 6,
  },
  moduleIconBox: {
    width: 46, height: 46, borderRadius: R.sm,
    borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
  },
  moduleLabel: { fontSize: 13, fontWeight: '800', color: C.white },
  moduleSub:   { fontSize: 10, color: C.muted, fontWeight: '500' },
})