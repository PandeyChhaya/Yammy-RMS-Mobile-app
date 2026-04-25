import AsyncStorage from '@react-native-async-storage/async-storage'
import { useRouter } from 'expo-router'
import {
  Bell,
  Calendar,
  ChevronRight,
  Clock,
  Coffee,
  Gift,
  LogOut,
  MapPin,
  Phone,
  Play,
  ShoppingBag,
  Star,
  Utensils,
} from 'lucide-react-native'
import { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { authService } from '../auth/services/auth.service'

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
}
const radius = { xs: 6, sm: 10, md: 14, lg: 18, pill: 100 }

const BASE_URL = 'http://192.168.1.4:5000/api'

interface Reservation {
  reservation_id: number
  table_id: number
  party_size: number
  reserved_at: string
  reservation_status: 'pending' | 'confirmed' | 'cancelled'
  reservation_notes?: string
}

interface MenuItem {
  menu_items_id: number
  menu_items_name: string
  price: number
  menu_items_description?: string
}

interface Order {
  order_id: number
  order_status: string
  total_amount: number
  created_at: string
}

export default function CustomerDashboard() {
  const router = useRouter()

  const [userName,      setUserName]      = useState('Guest')
  const [customerId,    setCustomerId]    = useState<number | null>(null)
  const [loyaltyPoints, setLoyaltyPoints] = useState<number>(0)
  const [reservations,  setReservations]  = useState<Reservation[]>([])
  const [menuItems,     setMenuItems]     = useState<MenuItem[]>([])
  const [recentOrders,  setRecentOrders]  = useState<Order[]>([])
  const [loading,       setLoading]       = useState(true)

  useEffect(() => { loadData() }, [])

  const getHeaders = async () => {
    const token = await authService.getToken()
    return {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${token}`,
    }
  }

  const loadData = async () => {
    try {
      const name = await AsyncStorage.getItem('@userName')
      const id   = await AsyncStorage.getItem('@userId')
      if (name) setUserName(name)

      if (id) {
        const cId = parseInt(id)
        setCustomerId(cId)
        const headers = await getHeaders()

        const [loyaltyRes, reservationsRes, menuRes, ordersRes] = await Promise.all([
          fetch(`${BASE_URL}/loyalty/${cId}`,                    { headers }),
          fetch(`${BASE_URL}/reservation/customer/${cId}`,       { headers }),
          fetch(`${BASE_URL}/menuItems`,                         { headers }),
          fetch(`${BASE_URL}/orders`,                            { headers }),
        ])

        if (loyaltyRes.ok)       setLoyaltyPoints((await loyaltyRes.json()).loyalty_points || 0)
        if (reservationsRes.ok)  setReservations((await reservationsRes.json()).slice(0, 3))
        if (menuRes.ok)          setMenuItems((await menuRes.json()).slice(0, 6))
        if (ordersRes.ok)        setRecentOrders((await ordersRes.json()).slice(0, 3))
      }
    } catch (err) {
      console.error('Error loading customer dashboard:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await authService.logout()
    await AsyncStorage.multiRemove(['@userName', '@userRole', '@userId'])
    router.replace('/modules/auth/login')
  }

  const handleCall     = () => Linking.openURL('tel:+97798XXXXXXXX')
  const handleLocation = () => Linking.openURL('https://maps.google.com/?q=Yammy+Fresh+Kathmandu+Nepal')

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return { bg: C.sageLight, text: C.sage,       border: C.sageBorder }
      case 'pending':   return { bg: C.brassLight, text: C.brass,      border: C.brassBorder }
      case 'cancelled': return { bg: C.tcLight,    text: C.terracotta, border: C.tcBorder }
      default:          return { bg: C.parchment,  text: C.clay,       border: C.vellum }
    }
  }

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  const formatTime = (d: string) => new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })

  if (loading) {
    return (
      <View style={s.loading}>
        <View style={s.loadingCard}>
          <View style={s.loadingIcon}><Utensils size={26} color={C.brass} /></View>
          <ActivityIndicator size="large" color={C.brass} style={{ marginTop: 20 }} />
          <Text style={s.loadingTitle}>Yammy Fresh</Text>
          <Text style={s.loadingText}>Loading your dashboard…</Text>
        </View>
      </View>
    )
  }

  return (
    <View style={s.root}>
      <ScrollView showsVerticalScrollIndicator={false}>

        <View style={s.header}>
          <View style={s.headerTop}>
            <View style={s.brand}>
              <View style={s.logoBadge}><Utensils size={20} color={C.cream} /></View>
              <View>
                <Text style={s.brandName}>Yammy Fresh</Text>
                <Text style={s.brandSub}>Welcome back</Text>
              </View>
            </View>
            <TouchableOpacity style={s.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
              <LogOut size={16} color={C.latte} />
            </TouchableOpacity>
          </View>

          <View style={s.welcomeCard}>
            <View style={s.avatarWrap}>
              <Text style={s.avatarText}>{userName.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={s.welcomeInfo}>
              <Text style={s.welcomeText}>Hello, {userName}! 👋</Text>
              <Text style={s.welcomeSub}>Good to see you again</Text>
            </View>
          </View>

          <View style={s.loyaltyBanner}>
            <View style={s.loyaltyLeft}>
              <Gift size={20} color={C.brass} />
              <View>
                <Text style={s.loyaltyLabel}>Loyalty Points</Text>
                <Text style={s.loyaltyPoints}>{loyaltyPoints} pts</Text>
              </View>
            </View>
            <View style={s.loyaltyRight}>
              <Star size={14} color={C.brass} />
              <Text style={s.loyaltyEquiv}>≈ NPR {loyaltyPoints * 2}</Text>
            </View>
          </View>
        </View>

        <View style={s.body}>

          <View style={s.section}>
            <Text style={s.sectionTitle}>Quick Actions</Text>
            <View style={s.actionsGrid}>

              <TouchableOpacity
                style={[s.actionCard, { backgroundColor: C.brassLight, borderColor: C.brassBorder }]}
                onPress={() => router.push('/modules/customer/components/MakeReservation' as any)}
                activeOpacity={0.8}
              >
                <View style={s.actionIconWrap}><Calendar size={22} color={C.brass} /></View>
                <Text style={s.actionLabel}>Reserve Table</Text>
                <Text style={s.actionSub}>Book a spot</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[s.actionCard, { backgroundColor: C.sageLight, borderColor: C.sageBorder }]}
                onPress={() => router.push('/modules/customer/components/MakeOrder' as any)}
                activeOpacity={0.8}
              >
                <View style={s.actionIconWrap}><Coffee size={22} color={C.sage} /></View>
                <Text style={s.actionLabel}>Order Food</Text>
                <Text style={s.actionSub}>Browse & order</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[s.actionCard, { backgroundColor: C.tcLight, borderColor: C.tcBorder }]}
                onPress={() => router.push('/modules/customer/components/CallWaiter' as any)}
                activeOpacity={0.8}
              >
                <View style={s.actionIconWrap}><Bell size={22} color={C.terracotta} /></View>
                <Text style={s.actionLabel}>Call Waiter</Text>
                <Text style={s.actionSub}>Get assistance</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[s.actionCard, { backgroundColor: C.parchment, borderColor: C.vellum }]}
                onPress={handleCall}
                activeOpacity={0.8}
              >
                <View style={s.actionIconWrap}><Phone size={22} color={C.clay} /></View>
                <Text style={s.actionLabel}>Call Us</Text>
                <Text style={s.actionSub}>+977 98...</Text>
              </TouchableOpacity>

            </View>
          </View>

          <View style={s.section}>
            <Text style={s.sectionTitle}>Minis</Text>
            <TouchableOpacity
              style={s.videoCard}
              onPress={() => router.push('/modules/customer/components/ViewMinis' as any)}
              activeOpacity={0.85}
            >
              <View style={s.videoIconWrap}>
                <Play size={32} color={C.brass} />
              </View>
              <View style={s.videoInfo}>
                <Text style={s.videoTitle}>Watch Food Videos</Text>
                <Text style={s.videoSub}>See what's cooking at Yammy Fresh</Text>
              </View>
              <ChevronRight size={18} color={C.latte} />
            </TouchableOpacity>
          </View>

          <View style={s.section}>
            <View style={s.sectionRow}>
              <Text style={s.sectionTitle}>My Reservations</Text>
              <TouchableOpacity onPress={() => router.push('/modules/customer/components/MakeReservation' as any)}>
                <Text style={s.sectionLink}>See all</Text>
              </TouchableOpacity>
            </View>

            {reservations.length === 0 ? (
              <View style={s.emptyCard}>
                <Calendar size={28} color={C.latte} />
                <Text style={s.emptyText}>No reservations yet</Text>
                <TouchableOpacity
                  style={s.emptyBtn}
                  onPress={() => router.push('/modules/customer/components/MakeReservation' as any)}
                >
                  <Text style={s.emptyBtnText}>Book a Table</Text>
                </TouchableOpacity>
              </View>
            ) : (
              reservations.map((res) => {
                const sc = getStatusColor(res.reservation_status)
                return (
                  <View key={res.reservation_id} style={s.reservationCard}>
                    <View style={s.reservationLeft}>
                      <Text style={s.reservationDate}>{formatDate(res.reserved_at)}</Text>
                      <View style={s.reservationMeta}>
                        <Clock size={11} color={C.clay} />
                        <Text style={s.reservationTime}>{formatTime(res.reserved_at)}</Text>
                        <Text style={s.reservationDot}>·</Text>
                        <Text style={s.reservationParty}>👥 {res.party_size} guests</Text>
                      </View>
                      {res.reservation_notes && (
                        <Text style={s.reservationNotes} numberOfLines={1}>{res.reservation_notes}</Text>
                      )}
                    </View>
                    <View style={[s.statusBadge, { backgroundColor: sc.bg, borderColor: sc.border }]}>
                      <Text style={[s.statusText, { color: sc.text }]}>
                        {res.reservation_status.charAt(0).toUpperCase() + res.reservation_status.slice(1)}
                      </Text>
                    </View>
                  </View>
                )
              })
            )}
          </View>

          <View style={s.section}>
            <View style={s.sectionRow}>
              <Text style={s.sectionTitle}>Our Menu</Text>
              <TouchableOpacity onPress={() => router.push('/modules/customer/components/MakeOrder' as any)}>
                <Text style={s.sectionLink}>Order now</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={s.menuRow}>
                {menuItems.map((item) => (
                  <TouchableOpacity
                    key={item.menu_items_id}
                    style={s.menuCard}
                    onPress={() => router.push('/modules/customer/components/MakeOrder' as any)}
                    activeOpacity={0.8}
                  >
                    <View style={s.menuIconWrap}>
                      <Coffee size={22} color={C.brass} />
                    </View>
                    <Text style={s.menuName} numberOfLines={2}>{item.menu_items_name}</Text>
                    <Text style={s.menuPrice}>NPR {item.price}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          <View style={s.section}>
            <Text style={s.sectionTitle}>Recent Orders</Text>
            {recentOrders.length === 0 ? (
              <View style={s.emptyCard}>
                <ShoppingBag size={28} color={C.latte} />
                <Text style={s.emptyText}>No orders yet</Text>
              </View>
            ) : (
              recentOrders.map((order) => {
                const sc = getStatusColor(order.order_status)
                return (
                  <View key={order.order_id} style={s.orderCard}>
                    <View style={s.orderLeft}>
                      <Text style={s.orderId}>Order #{order.order_id}</Text>
                      <Text style={s.orderDate}>{formatDate(order.created_at)}</Text>
                    </View>
                    <View style={s.orderRight}>
                      <Text style={s.orderAmount}>NPR {order.total_amount}</Text>
                      <View style={[s.statusBadge, { backgroundColor: sc.bg, borderColor: sc.border }]}>
                        <Text style={[s.statusText, { color: sc.text }]}>{order.order_status}</Text>
                      </View>
                    </View>
                  </View>
                )
              })
            )}
          </View>

          <View style={s.section}>
            <Text style={s.sectionTitle}>Find Us</Text>
            <View style={s.infoCard}>
              <TouchableOpacity style={s.infoRow} onPress={handleLocation} activeOpacity={0.8}>
                <View style={s.infoIconWrap}><MapPin size={16} color={C.brass} /></View>
                <View style={s.infoContent}>
                  <Text style={s.infoLabel}>Address</Text>
                  <Text style={s.infoValue}>Kathmandu, Nepal</Text>
                </View>
                <ChevronRight size={16} color={C.latte} />
              </TouchableOpacity>
              <View style={s.infoDivider} />
              <TouchableOpacity style={s.infoRow} onPress={handleCall} activeOpacity={0.8}>
                <View style={s.infoIconWrap}><Phone size={16} color={C.brass} /></View>
                <View style={s.infoContent}>
                  <Text style={s.infoLabel}>Phone</Text>
                  <Text style={s.infoValue}>+977 98XXXXXXXX</Text>
                </View>
                <ChevronRight size={16} color={C.latte} />
              </TouchableOpacity>
              <View style={s.infoDivider} />
              <View style={s.infoRow}>
                <View style={s.infoIconWrap}><Clock size={16} color={C.brass} /></View>
                <View style={s.infoContent}>
                  <Text style={s.infoLabel}>Hours</Text>
                  <Text style={s.infoValue}>10:00 AM — 10:00 PM</Text>
                </View>
              </View>
            </View>
          </View>

        </View>
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: C.cream },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.cream },
  loadingCard:  { backgroundColor: C.parchment, borderRadius: radius.lg, padding: 36, alignItems: 'center', width: '78%', borderWidth: 1.5, borderColor: C.vellum },
  loadingIcon:  { width: 58, height: 58, borderRadius: radius.md, backgroundColor: C.brassLight, borderWidth: 1.5, borderColor: C.brassBorder, alignItems: 'center', justifyContent: 'center' },
  loadingTitle: { fontSize: 20, fontWeight: '800', color: C.espresso, marginTop: 14 },
  loadingText:  { fontSize: 13, color: C.clay, marginTop: 4 },

  header:    { backgroundColor: C.espresso, paddingTop: 56, paddingHorizontal: 20, paddingBottom: 24, gap: 16, shadowColor: C.espresso, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 10 },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brand:     { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logoBadge: { width: 44, height: 44, borderRadius: radius.sm, backgroundColor: C.brass, alignItems: 'center', justifyContent: 'center' },
  brandName: { fontSize: 18, fontWeight: '900', color: C.cream, letterSpacing: 0.4 },
  brandSub:  { fontSize: 10, color: C.latte, fontWeight: '500', letterSpacing: 1, marginTop: 1 },
  logoutBtn: { width: 38, height: 38, borderRadius: radius.sm, backgroundColor: '#2A1A05', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#3D2010' },

  welcomeCard: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatarWrap:  { width: 46, height: 46, borderRadius: radius.sm, backgroundColor: C.brass, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: C.brassBorder },
  avatarText:  { fontSize: 20, fontWeight: '900', color: C.cream },
  welcomeInfo: { flex: 1 },
  welcomeText: { fontSize: 16, fontWeight: '800', color: C.cream },
  welcomeSub:  { fontSize: 11, color: C.latte, marginTop: 2 },

  loyaltyBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#2A1A05', borderRadius: radius.md, padding: 14, borderWidth: 1, borderColor: C.brassBorder },
  loyaltyLeft:   { flexDirection: 'row', alignItems: 'center', gap: 12 },
  loyaltyLabel:  { fontSize: 10, color: C.latte, fontWeight: '500', letterSpacing: 0.5 },
  loyaltyPoints: { fontSize: 20, fontWeight: '900', color: C.brass, marginTop: 1 },
  loyaltyRight:  { flexDirection: 'row', alignItems: 'center', gap: 5 },
  loyaltyEquiv:  { fontSize: 13, fontWeight: '700', color: C.brass },

  body:       { padding: 20, gap: 28 },
  section:    { gap: 14 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle:{ fontSize: 11, fontWeight: '800', color: C.clay, textTransform: 'uppercase', letterSpacing: 1.4 },
  sectionLink: { fontSize: 12, fontWeight: '700', color: C.brass },

  actionsGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  actionCard:     { width: '47%', borderRadius: radius.md, padding: 16, borderWidth: 1.5, gap: 6, shadowColor: C.espresso, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  actionIconWrap: { width: 44, height: 44, borderRadius: radius.sm, backgroundColor: C.cream, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  actionLabel:    { fontSize: 13, fontWeight: '800', color: C.espresso },
  actionSub:      { fontSize: 10, color: C.clay, fontWeight: '500' },

  videoCard:     { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: C.parchment, borderRadius: radius.md, padding: 16, borderWidth: 1.5, borderColor: C.vellum },
  videoIconWrap: { width: 56, height: 56, borderRadius: radius.sm, backgroundColor: C.brassLight, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.brassBorder },
  videoInfo:     { flex: 1 },
  videoTitle:    { fontSize: 14, fontWeight: '800', color: C.espresso },
  videoSub:      { fontSize: 11, color: C.clay, marginTop: 3 },

  reservationCard:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: C.parchment, borderRadius: radius.md, padding: 14, borderWidth: 1, borderColor: C.vellum },
  reservationLeft:  { flex: 1, gap: 4 },
  reservationDate:  { fontSize: 14, fontWeight: '700', color: C.espresso },
  reservationMeta:  { flexDirection: 'row', alignItems: 'center', gap: 5 },
  reservationTime:  { fontSize: 11, color: C.clay },
  reservationDot:   { fontSize: 11, color: C.latte },
  reservationParty: { fontSize: 11, color: C.clay },
  reservationNotes: { fontSize: 11, color: C.latte, fontStyle: 'italic' },

  statusBadge: { borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1 },
  statusText:  { fontSize: 10, fontWeight: '700' },

  menuRow:     { flexDirection: 'row', gap: 12, paddingVertical: 2 },
  menuCard:    { backgroundColor: C.parchment, borderRadius: radius.md, padding: 14, width: 130, borderWidth: 1, borderColor: C.vellum, gap: 6 },
  menuIconWrap:{ width: 42, height: 42, borderRadius: radius.sm, backgroundColor: C.brassLight, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.brassBorder },
  menuName:    { fontSize: 12, fontWeight: '700', color: C.espresso, lineHeight: 16 },
  menuPrice:   { fontSize: 13, fontWeight: '900', color: C.brass },

  orderCard:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: C.parchment, borderRadius: radius.md, padding: 14, borderWidth: 1, borderColor: C.vellum },
  orderLeft:   { gap: 3 },
  orderId:     { fontSize: 14, fontWeight: '700', color: C.espresso },
  orderDate:   { fontSize: 11, color: C.clay },
  orderRight:  { alignItems: 'flex-end', gap: 6 },
  orderAmount: { fontSize: 14, fontWeight: '900', color: C.brass },

  emptyCard:    { backgroundColor: C.parchment, borderRadius: radius.md, padding: 28, alignItems: 'center', gap: 10, borderWidth: 1, borderColor: C.vellum },
  emptyText:    { fontSize: 14, fontWeight: '600', color: C.clay },
  emptyBtn:     { backgroundColor: C.brass, paddingHorizontal: 20, paddingVertical: 10, borderRadius: radius.pill, marginTop: 4 },
  emptyBtnText: { fontSize: 13, fontWeight: '700', color: C.cream },

  infoCard:    { backgroundColor: C.parchment, borderRadius: radius.md, padding: 4, borderWidth: 1.5, borderColor: C.vellum },
  infoRow:     { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  infoIconWrap:{ width: 32, height: 32, borderRadius: radius.xs, backgroundColor: C.brassLight, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.brassBorder },
  infoContent: { flex: 1 },
  infoLabel:   { fontSize: 10, color: C.latte, fontWeight: '600', letterSpacing: 0.5 },
  infoValue:   { fontSize: 13, fontWeight: '700', color: C.espresso, marginTop: 1 },
  infoDivider: { height: 1, backgroundColor: C.vellum, marginHorizontal: 14 },
})