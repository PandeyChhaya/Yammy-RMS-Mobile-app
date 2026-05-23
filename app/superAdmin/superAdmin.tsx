import AsyncStorage from '@react-native-async-storage/async-storage'
import { useRouter } from 'expo-router'
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Eye,
  LogOut,
  Shield,
  Trash2,
  TrendingUp,
  Users,
  Video,
  XCircle,
} from 'lucide-react-native'
import { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { authService } from '../modules/auth/services/auth.service'

const BASE_URL = 'http://192.168.1.71:5000/api'

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
  violet:      '#6D28D9',
  violetLight: '#EDE9FE',
  violetBorder:'#C4B5FD',
}
const radius = { xs: 6, sm: 10, md: 14, lg: 18, pill: 100 }

type MiniStatus = 'pending' | 'approved' | 'rejected'

interface Mini {
  mini_id:          number
  user_id:          number
  title:            string
  description:      string
  video_url:        string
  thumbnail_url:    string
  status:           MiniStatus
  rejection_reason: string | null
  view_count:       number
  created_at:       string
  updated_at:       string
  users: {
    user_id:   number
    user_name: string
  }
}

interface Stats {
  total:    number
  pending:  number
  approved: number
  rejected: number
}

export default function SuperAdminDashboard() {
  const router = useRouter()

  const [userName,      setUserName]      = useState('Super Admin')
  const [minis,         setMinis]         = useState<Mini[]>([])
  const [filtered,      setFiltered]      = useState<Mini[]>([])
  const [loading,       setLoading]       = useState(true)
  const [refreshing,    setRefreshing]    = useState(false)
  const [activeFilter,  setActiveFilter]  = useState<MiniStatus | 'all'>('pending')
  const [stats,         setStats]         = useState<Stats>({ total: 0, pending: 0, approved: 0, rejected: 0 })

  const [rejectModal,       setRejectModal]       = useState(false)
  const [selectedMini,      setSelectedMini]      = useState<Mini | null>(null)
  const [rejectionReason,   setRejectionReason]   = useState('')
  const [actionLoading,     setActionLoading]     = useState(false)

  useEffect(() => {
    loadUser()
    fetchMinis()
  }, [])

  useEffect(() => {
    const result = activeFilter === 'all'
      ? minis
      : minis.filter(m => m.status === activeFilter)
    setFiltered(result)
  }, [activeFilter, minis])

  const loadUser = async () => {
    const name = await AsyncStorage.getItem('@userName')
    if (name) setUserName(name)
  }

  const getHeaders = async () => {
    const token = await authService.getToken()
    return {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${token}`,
    }
  }

  const fetchMinis = async () => {
    try {
      const headers = await getHeaders()
      const res = await fetch(`${BASE_URL}/minis/all`, { headers })
      if (!res.ok) throw new Error('Failed to fetch')
      const data: Mini[] = await res.json()
      setMinis(data)
      setStats({
        total:    data.length,
        pending:  data.filter(m => m.status === 'pending').length,
        approved: data.filter(m => m.status === 'approved').length,
        rejected: data.filter(m => m.status === 'rejected').length,
      })
    } catch (err) {
      console.error('Fetch minis error:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleApprove = async (mini: Mini) => {
    setActionLoading(true)
    try {
      const headers = await getHeaders()
      const res = await fetch(`${BASE_URL}/minis/${mini.mini_id}/status`, {
        method:  'PATCH',
        headers,
        body:    JSON.stringify({ status: 'approved' }),
      })
      if (!res.ok) throw new Error('Failed to approve')
      await fetchMinis()
    } catch (err: any) {
      Alert.alert('Error', err.message)
    } finally {
      setActionLoading(false)
    }
  }

  const openRejectModal = (mini: Mini) => {
    setSelectedMini(mini)
    setRejectionReason('')
    setRejectModal(true)
  }

  const handleReject = async () => {
    if (!selectedMini) return
    if (!rejectionReason.trim()) {
      Alert.alert('Required', 'Please provide a rejection reason')
      return
    }
    setActionLoading(true)
    try {
      const headers = await getHeaders()
      const res = await fetch(`${BASE_URL}/minis/${selectedMini.mini_id}/status`, {
        method:  'PATCH',
        headers,
        body:    JSON.stringify({ status: 'rejected', rejection_reason: rejectionReason.trim() }),
      })
      if (!res.ok) throw new Error('Failed to reject')
      setRejectModal(false)
      setSelectedMini(null)
      await fetchMinis()
    } catch (err: any) {
      Alert.alert('Error', err.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = (mini: Mini) => {
    Alert.alert(
      'Delete Mini',
      `Delete "${mini.title}" permanently?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive', onPress: async () => {
            try {
              const headers = await getHeaders()
              await fetch(`${BASE_URL}/minis/${mini.mini_id}`, { method: 'DELETE', headers })
              await fetchMinis()
            } catch (err: any) {
              Alert.alert('Error', err.message)
            }
          }
        },
      ]
    )
  }

  const handleLogout = async () => {
    await authService.logout()
    await AsyncStorage.multiRemove(['@userName', '@userRole', '@userId'])
    router.replace('/modules/auth/login')
  }

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  const STATUS_TABS: { key: MiniStatus | 'all'; label: string; count: number }[] = [
    { key: 'all',      label: 'All',      count: stats.total    },
    { key: 'pending',  label: 'Pending',  count: stats.pending  },
    { key: 'approved', label: 'Approved', count: stats.approved },
    { key: 'rejected', label: 'Rejected', count: stats.rejected },
  ]

  const getStatusConfig = (status: MiniStatus) => {
    switch (status) {
      case 'pending':  return { bg: C.brassLight,   border: C.brassBorder,  text: C.brass,      label: 'Pending'  }
      case 'approved': return { bg: C.sageLight,    border: C.sageBorder,   text: C.sage,       label: 'Approved' }
      case 'rejected': return { bg: C.tcLight,      border: C.tcBorder,     text: C.terracotta, label: 'Rejected' }
    }
  }

  if (loading) {
    return (
      <View style={s.loadingScreen}>
        <Shield size={40} color={C.violet} />
        <ActivityIndicator size="large" color={C.violet} style={{ marginTop: 20 }} />
        <Text style={s.loadingText}>Loading Super Admin Panel…</Text>
      </View>
    )
  }

  return (
    <View style={s.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchMinis() }}
            tintColor={C.brass}
          />
        }
      >
        <View style={s.header}>
          <View style={s.headerTop}>
            <View style={s.brand}>
              <View style={s.shieldBadge}>
                <Shield size={20} color={C.cream} />
              </View>
              <View>
                <Text style={s.brandName}>Super Admin</Text>
                <Text style={s.brandSub}>YAMMY CONTROL PANEL</Text>
              </View>
            </View>
            <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
              <LogOut size={16} color={C.latte} />
            </TouchableOpacity>
          </View>

          <View style={s.userCard}>
            <View style={s.avatarWrap}>
              <Text style={s.avatarText}>{userName.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={s.userInfo}>
              <Text style={s.userName}>{userName}</Text>
              <View style={s.superBadge}>
                <Shield size={10} color={C.violet} />
                <Text style={s.superBadgeText}>Super Admin</Text>
              </View>
            </View>
            <View style={s.onlinePill}>
              <View style={s.onlineDot} />
              <Text style={s.onlineText}>Online</Text>
            </View>
          </View>
        </View>

        <View style={s.body}>

          <View style={s.statsRow}>
            {[
              { label: 'Total',    value: stats.total,    color: C.clay,       bg: C.parchment,    border: C.vellum,      icon: <Video size={16} color={C.clay} />      },
              { label: 'Pending',  value: stats.pending,  color: C.brass,      bg: C.brassLight,   border: C.brassBorder,  icon: <Clock size={16} color={C.brass} />     },
              { label: 'Approved', value: stats.approved, color: C.sage,       bg: C.sageLight,    border: C.sageBorder,   icon: <CheckCircle size={16} color={C.sage} />},
              { label: 'Rejected', value: stats.rejected, color: C.terracotta, bg: C.tcLight,      border: C.tcBorder,     icon: <XCircle size={16} color={C.terracotta} />},
            ].map((stat) => (
              <View key={stat.label} style={[s.statCard, { backgroundColor: stat.bg, borderColor: stat.border }]}>
                {stat.icon}
                <Text style={[s.statValue, { color: stat.color }]}>{stat.value}</Text>
                <Text style={s.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>

          <View style={s.section}>
            <View style={s.sectionHeader}>
              <Video size={16} color={C.clay} />
              <Text style={s.sectionTitle}>Minis Review</Text>
            </View>
            <Text style={s.sectionSub}>Approve or reject restaurant food videos</Text>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.tabsScroll}>
              <View style={s.tabsRow}>
                {STATUS_TABS.map(tab => (
                  <TouchableOpacity
                    key={tab.key}
                    style={[s.tab, activeFilter === tab.key && s.tabActive]}
                    onPress={() => setActiveFilter(tab.key)}
                  >
                    <Text style={[s.tabText, activeFilter === tab.key && s.tabTextActive]}>
                      {tab.label}
                    </Text>
                    <View style={[s.tabBadge, activeFilter === tab.key && s.tabBadgeActive]}>
                      <Text style={[s.tabBadgeText, activeFilter === tab.key && s.tabBadgeTextActive]}>
                        {tab.count}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            {filtered.length === 0 ? (
              <View style={s.emptyState}>
                <Video size={40} color={C.vellum} />
                <Text style={s.emptyTitle}>No minis here</Text>
                <Text style={s.emptySub}>
                  {activeFilter === 'pending' ? 'All caught up! No pending videos.' : `No ${activeFilter} videos yet.`}
                </Text>
              </View>
            ) : (
              filtered.map((mini) => {
                const cfg = getStatusConfig(mini.status)
                return (
                  <View key={mini.mini_id} style={[s.miniCard, { borderColor: cfg.border }]}>

                    <View style={s.miniHeader}>
                      <View style={s.miniTitleBlock}>
                        <Text style={s.miniTitle} numberOfLines={1}>{mini.title}</Text>
                        <View style={s.miniMeta}>
                          <Users size={11} color={C.clay} />
                          <Text style={s.miniMetaText}>{mini.users.user_name}</Text>
                          <Text style={s.miniDot}>·</Text>
                          <Eye size={11} color={C.clay} />
                          <Text style={s.miniMetaText}>{mini.view_count} views</Text>
                        </View>
                      </View>
                      <View style={[s.statusBadge, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
                        <Text style={[s.statusText, { color: cfg.text }]}>{cfg.label}</Text>
                      </View>
                    </View>

                    {mini.description ? (
                      <Text style={s.miniDesc} numberOfLines={2}>{mini.description}</Text>
                    ) : null}


                    {mini.status === 'rejected' && mini.rejection_reason ? (
                      <View style={s.rejectionBlock}>
                        <AlertCircle size={12} color={C.terracotta} />
                        <Text style={s.rejectionText} numberOfLines={2}>{mini.rejection_reason}</Text>
                      </View>
                    ) : null}

                    <Text style={s.miniDate}>Uploaded {formatDate(mini.created_at)}</Text>

                    <View style={s.miniActions}>
                      {mini.status === 'pending' && (
                        <>
                          <TouchableOpacity
                            style={s.approveBtn}
                            onPress={() => handleApprove(mini)}
                            disabled={actionLoading}
                          >
                            <CheckCircle size={14} color={C.cream} />
                            <Text style={s.approveBtnText}>Approve</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={s.rejectBtn}
                            onPress={() => openRejectModal(mini)}
                            disabled={actionLoading}
                          >
                            <XCircle size={14} color={C.terracotta} />
                            <Text style={s.rejectBtnText}>Reject</Text>
                          </TouchableOpacity>
                        </>
                      )}
                      {mini.status === 'approved' && (
                        <TouchableOpacity
                          style={s.rejectBtn}
                          onPress={() => openRejectModal(mini)}
                          disabled={actionLoading}
                        >
                          <XCircle size={14} color={C.terracotta} />
                          <Text style={s.rejectBtnText}>Revoke</Text>
                        </TouchableOpacity>
                      )}
                      {mini.status === 'rejected' && (
                        <TouchableOpacity
                          style={s.approveBtn}
                          onPress={() => handleApprove(mini)}
                          disabled={actionLoading}
                        >
                          <CheckCircle size={14} color={C.cream} />
                          <Text style={s.approveBtnText}>Approve</Text>
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity
                        style={s.deleteBtn}
                        onPress={() => handleDelete(mini)}
                        disabled={actionLoading}
                      >
                        <Trash2 size={14} color={C.clay} />
                      </TouchableOpacity>
                    </View>

                  </View>
                )
              })
            )}
          </View>

          <View style={s.section}>
            <View style={s.sectionHeader}>
              <TrendingUp size={16} color={C.clay} />
              <Text style={s.sectionTitle}>Platform Overview</Text>
            </View>
            <View style={s.overviewCard}>
              <View style={s.overviewRow}>
                <Text style={s.overviewLabel}>Approval Rate</Text>
                <Text style={s.overviewValue}>
                  {stats.total > 0
                    ? `${Math.round((stats.approved / stats.total) * 100)}%`
                    : '—'}
                </Text>
              </View>
              <View style={s.overviewDivider} />
              <View style={s.overviewRow}>
                <Text style={s.overviewLabel}>Rejection Rate</Text>
                <Text style={[s.overviewValue, { color: C.terracotta }]}>
                  {stats.total > 0
                    ? `${Math.round((stats.rejected / stats.total) * 100)}%`
                    : '—'}
                </Text>
              </View>
              <View style={s.overviewDivider} />
              <View style={s.overviewRow}>
                <Text style={s.overviewLabel}>Awaiting Review</Text>
                <Text style={[s.overviewValue, { color: C.brass }]}>{stats.pending}</Text>
              </View>
            </View>
          </View>

        </View>
      </ScrollView>

      <Modal visible={rejectModal} transparent animationType="slide" onRequestClose={() => setRejectModal(false)}>
        <View style={s.modalOverlay}>
          <View style={s.modalSheet}>
            <Text style={s.modalTitle}>Reject Mini</Text>
            <Text style={s.modalSub}>
              {selectedMini?.title}
            </Text>
            <Text style={s.modalLabel}>Reason for rejection</Text>
            <TextInput
              style={s.modalInput}
              placeholder="e.g. Poor video quality, inappropriate content..."
              placeholderTextColor={C.latte}
              value={rejectionReason}
              onChangeText={setRejectionReason}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            <View style={s.modalActions}>
              <TouchableOpacity
                style={s.modalCancelBtn}
                onPress={() => setRejectModal(false)}
              >
                <Text style={s.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.modalRejectBtn, actionLoading && { opacity: 0.6 }]}
                onPress={handleReject}
                disabled={actionLoading}
              >
                {actionLoading
                  ? <ActivityIndicator size="small" color={C.cream} />
                  : <Text style={s.modalRejectText}>Confirm Reject</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const s = StyleSheet.create({
  root:          { flex: 1, backgroundColor: C.cream },
  loadingScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.cream, gap: 12 },
  loadingText:   { fontSize: 14, color: C.clay, marginTop: 8 },

  header:    { backgroundColor: C.espresso, paddingTop: 56, paddingHorizontal: 20, paddingBottom: 24, gap: 20 },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brand:     { flexDirection: 'row', alignItems: 'center', gap: 12 },
  shieldBadge: { width: 44, height: 44, borderRadius: radius.sm, backgroundColor: C.violet, alignItems: 'center', justifyContent: 'center' },
  brandName: { fontSize: 18, fontWeight: '900', color: C.cream },
  brandSub:  { fontSize: 9, color: C.latte, fontWeight: '700', letterSpacing: 1.5, marginTop: 2 },
  logoutBtn: { width: 38, height: 38, borderRadius: radius.sm, backgroundColor: '#2A1A05', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#3D2010' },

  userCard:   { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#2A1A05', borderRadius: radius.md, padding: 14, borderWidth: 1, borderColor: '#3D2010' },
  avatarWrap: { width: 46, height: 46, borderRadius: radius.sm, backgroundColor: C.violet, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 20, fontWeight: '900', color: C.cream },
  userInfo:   { flex: 1, gap: 5 },
  userName:   { fontSize: 15, fontWeight: '800', color: C.cream },
  superBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', backgroundColor: C.violetLight, paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill, borderWidth: 1, borderColor: C.violetBorder },
  superBadgeText: { fontSize: 10, fontWeight: '700', color: C.violet },
  onlinePill: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#0E2218', borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: C.sageBorder },
  onlineDot:  { width: 6, height: 6, borderRadius: 3, backgroundColor: C.sage },
  onlineText: { fontSize: 10, fontWeight: '700', color: C.sage },

  body:     { padding: 20, gap: 24 },

  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: { flex: 1, borderRadius: radius.md, padding: 12, borderWidth: 1.5, alignItems: 'center', gap: 4 },
  statValue:{ fontSize: 22, fontWeight: '900' },
  statLabel:{ fontSize: 9, color: C.clay, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },

  section:       { gap: 12 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle:  { fontSize: 11, fontWeight: '800', color: C.clay, textTransform: 'uppercase', letterSpacing: 1.4 },
  sectionSub:    { fontSize: 12, color: C.latte, marginTop: -4 },

  tabsScroll: { marginBottom: 4 },
  tabsRow:    { flexDirection: 'row', gap: 8, paddingBottom: 2 },
  tab:        { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.pill, backgroundColor: C.parchment, borderWidth: 1.5, borderColor: C.vellum },
  tabActive:  { backgroundColor: C.espresso, borderColor: C.espresso },
  tabText:    { fontSize: 12, fontWeight: '700', color: C.clay },
  tabTextActive: { color: C.cream },
  tabBadge:   { backgroundColor: C.vellum, borderRadius: radius.pill, paddingHorizontal: 6, paddingVertical: 1 },
  tabBadgeActive: { backgroundColor: '#3D2010' },
  tabBadgeText: { fontSize: 10, fontWeight: '800', color: C.clay },
  tabBadgeTextActive: { color: C.latte },

  emptyState: { alignItems: 'center', paddingVertical: 48, gap: 10 },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: C.espresso },
  emptySub:   { fontSize: 12, color: C.clay, textAlign: 'center' },

  miniCard:   { backgroundColor: C.parchment, borderRadius: radius.md, borderWidth: 1.5, padding: 14, marginBottom: 12, gap: 10 },
  miniHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 },
  miniTitleBlock: { flex: 1 },
  miniTitle:  { fontSize: 14, fontWeight: '800', color: C.espresso, marginBottom: 4 },
  miniMeta:   { flexDirection: 'row', alignItems: 'center', gap: 4 },
  miniMetaText: { fontSize: 11, color: C.clay },
  miniDot:    { fontSize: 11, color: C.latte },
  miniDesc:   { fontSize: 12, color: C.clay, lineHeight: 17 },
  miniDate:   { fontSize: 10, color: C.latte, fontWeight: '500' },

  rejectionBlock: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, backgroundColor: C.tcLight, borderRadius: radius.xs, padding: 8, borderWidth: 1, borderColor: C.tcBorder },
  rejectionText:  { fontSize: 11, color: C.terracotta, flex: 1 },

  statusBadge: { borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, alignSelf: 'flex-start' },
  statusText:  { fontSize: 10, fontWeight: '700' },

  miniActions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  approveBtn:  { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: C.sage, borderRadius: radius.pill, paddingVertical: 10 },
  approveBtnText: { fontSize: 12, fontWeight: '800', color: C.cream },
  rejectBtn:   { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: C.tcLight, borderRadius: radius.pill, paddingVertical: 10, borderWidth: 1, borderColor: C.tcBorder },
  rejectBtnText: { fontSize: 12, fontWeight: '800', color: C.terracotta },
  deleteBtn:   { width: 38, height: 38, borderRadius: radius.sm, backgroundColor: C.parchment, borderWidth: 1.5, borderColor: C.vellum, alignItems: 'center', justifyContent: 'center' },

  overviewCard:    { backgroundColor: C.parchment, borderRadius: radius.md, borderWidth: 1.5, borderColor: C.vellum, padding: 4 },
  overviewRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14 },
  overviewLabel:   { fontSize: 13, color: C.clay, fontWeight: '600' },
  overviewValue:   { fontSize: 18, fontWeight: '900', color: C.sage },
  overviewDivider: { height: 1, backgroundColor: C.vellum, marginHorizontal: 14 },

  modalOverlay:  { flex: 1, backgroundColor: 'rgba(28,16,8,0.6)', justifyContent: 'flex-end' },
  modalSheet:    { backgroundColor: C.parchment, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, borderWidth: 1.5, borderColor: C.vellum, padding: 24, gap: 14 },
  modalTitle:    { fontSize: 18, fontWeight: '900', color: C.espresso },
  modalSub:      { fontSize: 13, color: C.clay, marginTop: -6 },
  modalLabel:    { fontSize: 10, fontWeight: '800', color: C.clay, textTransform: 'uppercase', letterSpacing: 1 },
  modalInput:    { borderWidth: 1.5, borderColor: C.vellum, borderRadius: radius.md, padding: 12, fontSize: 13, color: C.espresso, backgroundColor: C.cream, minHeight: 100 },
  modalActions:  { flexDirection: 'row', gap: 10 },
  modalCancelBtn:  { flex: 1, alignItems: 'center', paddingVertical: 13, borderRadius: radius.pill, backgroundColor: C.cream, borderWidth: 1.5, borderColor: C.vellum },
  modalCancelText: { fontSize: 13, fontWeight: '700', color: C.clay },
  modalRejectBtn:  { flex: 1, alignItems: 'center', paddingVertical: 13, borderRadius: radius.pill, backgroundColor: C.terracotta },
  modalRejectText: { fontSize: 13, fontWeight: '800', color: C.cream },
})
