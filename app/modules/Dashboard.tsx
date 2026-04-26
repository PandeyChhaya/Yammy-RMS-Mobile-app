import AsyncStorage from '@react-native-async-storage/async-storage'
import { useRouter } from 'expo-router'
import {
  Bell,
  LogOut,
  ShoppingCart
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
import tablesService from './pos/services/tablesService'

const C = {
  espresso:    '#1C1008',
  roast:       '#3D2010',
  clay:        '#7A4528',
  latte:       '#C8956A',
  cream:       '#FDF6EC',
  parchment:   '#F5E9D4',
  vellum:      '#EDD9BC',
  brass:       '#B5822A',
  brassLight:  '#F7EDD8',
  brassBorder: '#DEC07A',
  sage:        '#3B6E52',
  sageLight:   '#EBF4EE',
  sageBorder:  '#9FCFB4',
  terracotta:  '#A03020',
  tcLight:     '#FAECEA',
  tcBorder:    '#E8A898',
  onDark:      '#FDF6EC',
}
const radius = { xs: 6, sm: 10, md: 14, lg: 18, pill: 100 }

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
  badge?: string
  color: string
  borderColor: string
  roles: string[]
}

export default function Dashboard() {
  const router = useRouter()

  const [userName, setUserName]         = useState('...')
  const [userRole, setUserRole]         = useState('')
  const [stats, setStats]               = useState<Stats>({ todayOrders: 0, activeTables: 0, totalRevenue: 0, pendingOrders: 0 })
  const [loadingStats, setLoadingStats] = useState(true)

  useEffect(() => {
    loadUser()
    loadStats()
  }, [])

  const loadUser = async () => {
    const name = await AsyncStorage.getItem('@userName')
    const role = await AsyncStorage.getItem('@userRole')
    console.log('USER NAME:', name)   
  console.log('USER ROLE:', role)
    if (name) setUserName(name)
    setUserRole(role ?? 'Admin')
  }

  const loadStats = async () => {
  try {
    const token = await AsyncStorage.getItem('@accessToken')

    if (!token) {
      console.log('No token yet, skipping stats')
      return
    }

    const [orders, tables] = await Promise.all([
      ordersService.getOrder(),
      tablesService.getTable(),
    ])

    console.log('ORDERS:', orders)
    console.log('TABLES:', tables)

    const today = new Date().toISOString().split('T')[0]

    const todayOrders = orders.filter((o: any) =>
      o.created_at?.startsWith(today)
    ).length

    const pendingOrders = orders.filter((o: any) =>
      o.order_status === 'pending'
    ).length

    const activeTables = tables.filter((t: any) =>
      t.table_status !== 'available' && t.table_status !== 'free'
    ).length

    const totalRevenue = orders
      .filter((o: any) => o.created_at?.startsWith(today))
      .reduce((sum: number, o: any) => sum + (Number(o.total_amount) || 0), 0)

    setStats({ todayOrders, activeTables, totalRevenue, pendingOrders })

  } catch (error) {
    console.log('DASHBOARD ERROR:', error)
  } finally {
    setLoadingStats(false)
  }
}

  const handleLogout = async () => {
    await authService.logout()
    router.replace('/modules/auth/login')
  }

  const allModules: ModuleItem[] = [
    {
      id: 'categories',
      label: 'Categories',
      sub: 'Take orders',
      icon: <ShoppingCart size={24} color={C.brass} />,
      route: '/modules/categories/Categories',
      color: C.brassLight,
      borderColor: C.brassBorder,
      roles: ['Admin', 'Waiter', 'Cashier'],
    },
     {
      id: 'menu-items',
      label: 'Menu-items',
      sub: 'Take orders',
      icon: <ShoppingCart size={24} color={C.brass} />,
      route: '/modules/menu-items/menu-items',
      color: C.brassLight,
      borderColor: C.brassBorder,
      roles: ['Admin', 'Waiter', 'Cashier'],
    },
       {
      id: 'reservation',
      label: 'reservation',
      sub: 'Take orders',
      icon: <ShoppingCart size={24} color={C.brass} />,
      route: '/modules/reservation/reservation',
      color: C.brassLight,
      borderColor: C.brassBorder,
      roles: ['Admin', 'Waiter', 'Cashier'],
    },
     {
      id: 'order',
      label: 'order',
      sub: 'Take orders',
      icon: <ShoppingCart size={24} color={C.brass} />,
      route: '/modules/orders/Orders',
      color: C.brassLight,
      borderColor: C.brassBorder,
      roles: ['Admin', 'Waiter', 'Cashier'],
    },
    {
  id: 'waiter-notifications',
  label: 'Waiter Calls',
  sub: 'Customer requests',
  icon: <Bell size={24} color={C.sage} />,
  route: '/modules/waiter/WaiterNotifications',
  color: C.sageLight,
  borderColor: C.sageBorder,
  roles: ['Waiter'],
},
      {
      id: 'inventory',
      label: 'inventory',
      sub: 'Take orders',
      icon: <ShoppingCart size={24} color={C.brass} />,
      route: '/modules/inventory/inventory',
      color: C.brassLight,
      borderColor: C.brassBorder,
      roles: ['Admin', 'Waiter', 'Cashier'],
    },
     {
      id: 'customer',
      label: 'customer',
      sub: 'Take orders',
      icon: <ShoppingCart size={24} color={C.brass} />,
      route: '/modules/customer/customer_Dashboard',
      color: C.brassLight,
      borderColor: C.brassBorder,
      roles: ['Admin', 'Waiter', 'Cashier'],
    },
    {
      id: 'payment',
      label: 'payment',
      sub: 'Take orders',
      icon: <ShoppingCart size={24} color={C.brass} />,
      route: '/modules/test/test',
      color: C.brassLight,
      borderColor: C.brassBorder,
      roles: ['Admin', 'Waiter', 'Cashier'],
    },


      
   
  ]

  const visibleModules = allModules.filter(m =>
    m.roles.includes(userRole || 'Admin')
  )

  const statCards = [
    {
      label: "Today's Orders",
      value: stats.todayOrders,
      prefix: '',
      color: C.brass,
      bg: C.brassLight,
      border: C.brassBorder,
    },
    {
      label: 'Active Tables',
      value: stats.activeTables,
      prefix: '',
      color: C.sage,
      bg: C.sageLight,
      border: C.sageBorder,
    },
    {
      label: 'Revenue',
      value: stats.totalRevenue,
      prefix: 'NPR ',
      color: C.brass,
      bg: C.brassLight,
      border: C.brassBorder,
    },
    {
      label: 'Pending',
      value: stats.pendingOrders,
      prefix: '',
      color: C.terracotta,
      bg: C.tcLight,
      border: C.tcBorder,
    },
  ]

  return (
    <View style={s.root}>
      <ScrollView showsVerticalScrollIndicator={false}>

       
        <View style={s.header}>
          <View style={s.headerTop}>
            <View>
                  <Image source={require('../../assets/images/yammy.png')}
                   style={{ width: 140, height: 30 }} />
          </View>
            <TouchableOpacity style={s.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
              <LogOut size={16} color={C.latte} />
            </TouchableOpacity>
          </View>

          <View style={s.userCard}>
            <View style={s.avatarWrap}>
              <Text style={s.avatarText}>{userName.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={s.userInfo}>
              <Text style={s.userName}>{userName}</Text>
              <View style={s.rolePill}>
                <Text style={s.roleText}>{userRole || 'Admin'}</Text>
              </View>
            </View>
            <View style={s.onlinePill}>
              <View style={s.onlineDot} />
              <Text style={s.onlineText}>Online</Text>
            </View>
          </View>
        </View>

        <View style={s.body}>

          
          <View style={s.section}>
            <Text style={s.sectionTitle}>Today's Overview</Text>
            <View style={s.statsGrid}>
              {statCards.map((card) => (
                <View key={card.label} style={[s.statCard, { backgroundColor: card.bg, borderColor: card.border }]}>
                  {loadingStats
                    ? <ActivityIndicator size="small" color={card.color} />
                    : <Text style={[s.statValue, { color: card.color }]}>
                        {card.prefix}{card.label === 'Revenue'
                          ? Number(card.value).toLocaleString()
                          : card.value}
                      </Text>
                  }
                  <Text style={s.statLabel}>{card.label}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={s.section}>
            <Text style={s.sectionTitle}>Modules</Text>
            <View style={s.modulesGrid}>
              {visibleModules.map((mod) => (
                <TouchableOpacity
                  key={mod.id}
                  style={[s.moduleCard, { backgroundColor: mod.color, borderColor: mod.borderColor }]}
                  onPress={() => router.push(mod.route as any)}
                  activeOpacity={0.8}
                >
                  <View style={s.moduleIconWrap}>
                    {mod.icon}
                  </View>
                  <Text style={s.moduleLabel}>{mod.label}</Text>
                  <Text style={s.moduleSub}>{mod.sub}</Text>
                  {mod.badge && (
                    <View style={s.moduleBadge}>
                      <Text style={s.moduleBadgeText}>{mod.badge}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

        </View>
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.cream },

  header: {
    backgroundColor: C.espresso,
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 20,
    shadowColor: C.espresso,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand:    { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logoBadge: {
    width: 44, height: 44, borderRadius: radius.sm,
    backgroundColor: C.brass,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: C.brass,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  brandName: { fontSize: 18, fontWeight: '900', color: C.cream, letterSpacing: 0.4 },
  brandSub:  { fontSize: 10, color: C.latte, fontWeight: '500', letterSpacing: 1, marginTop: 1 },
  logoutBtn: {
    width: 38, height: 38, borderRadius: radius.sm,
    backgroundColor: '#2A1A05',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#3D2010',
  },

  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#2A1A05',
    borderRadius: radius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: '#3D2010',
  },
  avatarWrap: {
    width: 46, height: 46, borderRadius: radius.sm,
    backgroundColor: C.brass,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: C.brassBorder,
  },
  avatarText: { fontSize: 20, fontWeight: '900', color: C.cream },
  userInfo:   { flex: 1, gap: 5 },
  userName:   { fontSize: 15, fontWeight: '800', color: C.cream, letterSpacing: 0.2 },
  rolePill: {
    alignSelf: 'flex-start',
    backgroundColor: C.brassLight,
    paddingHorizontal: 10, paddingVertical: 3,
    borderRadius: radius.pill,
    borderWidth: 1, borderColor: C.brassBorder,
  },
  roleText: { fontSize: 10, fontWeight: '700', color: C.brass, letterSpacing: 0.5 },
  onlinePill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#0E2218',
    borderRadius: radius.pill,
    paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: C.sageBorder,
  },
  onlineDot:  { width: 6, height: 6, borderRadius: 3, backgroundColor: C.sage },
  onlineText: { fontSize: 10, fontWeight: '700', color: C.sage },

  body: { padding: 20, gap: 28 },

  section:      { gap: 14 },
  sectionTitle: {
    fontSize: 11, fontWeight: '800', color: C.clay,
    textTransform: 'uppercase', letterSpacing: 1.4,
  },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statCard: {
    width: '47%',
    borderRadius: radius.md,
    padding: 16,
    borderWidth: 1.5,
    gap: 4,
    shadowColor: C.espresso,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: { fontSize: 26, fontWeight: '900', letterSpacing: -0.5 },
  statLabel: { fontSize: 11, color: C.clay, fontWeight: '600', letterSpacing: 0.3 },

  modulesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  moduleCard: {
    width: '47%',
    borderRadius: radius.md,
    padding: 16,
    borderWidth: 1.5,
    gap: 6,
    shadowColor: C.espresso,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    position: 'relative',
  },
  moduleIconWrap: {
    width: 46, height: 46,
    borderRadius: radius.sm,
    backgroundColor: C.cream,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
    shadowColor: C.espresso,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  moduleLabel:     { fontSize: 13, fontWeight: '800', color: C.espresso },
  moduleSub:       { fontSize: 10, color: C.clay, fontWeight: '500', letterSpacing: 0.2 },
  moduleBadge: {
    position: 'absolute', top: 10, right: 10,
    backgroundColor: C.brass,
    borderRadius: radius.pill,
    paddingHorizontal: 7, paddingVertical: 2,
  },
  moduleBadgeText: { fontSize: 9, fontWeight: '800', color: C.cream },
})
