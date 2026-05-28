import AsyncStorage from '@react-native-async-storage/async-storage'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  Phone,
  Plus,
  Search,
  Trash2,
  Users,
  XCircle,
} from 'lucide-react-native'
import { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { ReservationStatus, ReservationWithTable } from '../pos/types/reservation'
import ReservationModal from '../tables/components/ReservationModal'
import tableService from '../tables/services/tableService'
import reservationService from './services/reservationService'

const C = {
  black:      '#0A0A0A',
  charcoal:   '#1A1A1A',
  graphite:   '#2C2C2C',
  steel:      '#3D3D3D',
  muted:      '#6B6B6B',
  border:     '#2E2E2E',
  card:       '#1E1E1E',
  orange:     '#FF6B2C',
  orangeTint: '#2A1A10',
  orangeDim:  '#7A3010',
  white:      '#FFFFFF',
  offWhite:   '#F0F0F0',
  dim:        '#A0A0A0',
  success:    '#22C55E',
  successBg:  '#0D2818',
  error:      '#EF4444',
  errorBg:    '#2A0A0A',
}
const radius = { xs: 6, sm: 10, md: 14, lg: 18, pill: 100 }

const STATUS_CONFIG: Record<ReservationStatus, {
  label: string
  bg: string
  border: string
  text: string
  dot: string
}> = {
  confirmed: { label: 'Confirmed', bg: C.orangeTint,  border: C.orangeDim,  text: C.orange,   dot: C.orange   },
  arrived:   { label: 'Arrived',   bg: C.steel,       border: C.muted,      text: C.offWhite, dot: C.offWhite },
  completed: { label: 'Completed', bg: C.successBg,   border: '#1A4A2A',    text: C.success,  dot: C.success  },
  cancelled: { label: 'Cancelled', bg: C.errorBg,     border: '#7A1010',    text: C.error,    dot: C.error    },
  no_show:   { label: 'No Show',   bg: C.graphite,    border: C.steel,      text: C.dim,      dot: C.dim      },
}

const FILTER_TABS: { key: ReservationStatus | 'all'; label: string }[] = [
  { key: 'all',       label: 'All'       },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'arrived',   label: 'Arrived'   },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
  { key: 'no_show',   label: 'No Show'   },
]

export default function Reservations() {
  const queryClient = useQueryClient()
  const [role, setRole] = useState('')
  useEffect(() => {
    AsyncStorage.getItem('@userRole').then(r => setRole(r ?? ''))
  }, [])

  const canCreate = role === 'Admin' || role === 'Cashier'
  const canDelete = role === 'Admin'

  const [search,          setSearch]          = useState('')
  const [filterStatus,    setFilterStatus]    = useState<ReservationStatus | 'all'>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedTableId, setSelectedTableId] = useState<number | null>(null)
  const [showTablePicker, setShowTablePicker] = useState(false)
  const [successMessage,  setSuccessMessage]  = useState<string | null>(null)
  const [errorMessage,    setErrorMessage]    = useState<string | null>(null)

  const { data: reservations = [], isLoading, error } = useQuery<ReservationWithTable[]>({
    queryKey: ['reservations-all'],
    queryFn:  reservationService.getAllReservations,
    retry: 3,
  })

  const { data: tables = [] } = useQuery({
    queryKey: ['tables'],
    queryFn:  tableService.getTable,
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: ReservationStatus }) =>
      reservationService.updateReservationStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations-all'] })
      queryClient.invalidateQueries({ queryKey: ['tables'] })
      showSuccess('Status updated!')
    },
    onError: (err) => showError('Failed to update status: ' + err),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => reservationService.deleteReservation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations-all'] })
      queryClient.invalidateQueries({ queryKey: ['tables'] })
      showSuccess('Reservation deleted.')
    },
    onError: (err) => showError('Failed to delete: ' + err),
  })

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg)
    setTimeout(() => setSuccessMessage(null), 3000)
  }

  const showError = (msg: string) => {
    setErrorMessage(msg)
    setTimeout(() => setErrorMessage(null), 5000)
  }

  const handleDelete = (id: number, name: string) => {
    Alert.alert(
      'Delete Reservation',
      `Delete reservation for "${name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate(id) },
      ],
    )
  }

  const handleStatusChange = (id: number, status: ReservationStatus) => {
    statusMutation.mutate({ id, status })
  }

  const handleReservationCreated = () => {
    queryClient.invalidateQueries({ queryKey: ['reservations-all'] })
    queryClient.invalidateQueries({ queryKey: ['tables'] })
    setShowCreateModal(false)
    setSelectedTableId(null)
    showSuccess('Reservation created!')
  }

  const filtered = reservations.filter(r => {
    const matchesStatus = filterStatus === 'all' || r.status === filterStatus
    const q = search.toLowerCase()
    const matchesSearch =
      !q ||
      r.customer_name.toLowerCase().includes(q) ||
      (r.customer_phone ?? '').includes(q) ||
      r.table_number.toLowerCase().includes(q)
    return matchesStatus && matchesSearch
  })

  const todayStr       = new Date().toISOString().split('T')[0]
  const todayCount     = reservations.filter(r => r.reservation_date === todayStr).length
  const confirmedCount = reservations.filter(r => r.status === 'confirmed').length
  const arrivedCount   = reservations.filter(r => r.status === 'arrived').length

  const selectedTable = tables.find(t => t.table_id === selectedTableId) ?? null

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={C.orange} />
        <Text style={styles.loadingText}>Loading reservations…</Text>
      </View>
    )
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <AlertCircle size={48} color={C.error} />
        <Text style={styles.errorTitle}>Something went wrong</Text>
        <Text style={styles.errorSub}>{String(error)}</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Background blobs */}
      <View style={styles.blob1} />
      <View style={styles.blob2} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Reservations</Text>
            <Text style={styles.subtitle}>Manage all bookings</Text>
          </View>
          {canCreate && (
            <TouchableOpacity style={styles.addButton} onPress={() => setShowTablePicker(true)} activeOpacity={0.85}>
              <Plus size={16} color={C.white} />
              <Text style={styles.addButtonText}>New</Text>
            </TouchableOpacity>
          )}
        </View>

        {successMessage && (
          <View style={styles.successBanner}>
            <CheckCircle size={16} color={C.success} />
            <Text style={styles.successText}>{successMessage}</Text>
          </View>
        )}
        {errorMessage && (
          <View style={styles.errorBanner}>
            <AlertCircle size={16} color={C.error} />
            <Text style={styles.errorBannerText}>{errorMessage}</Text>
          </View>
        )}

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Calendar size={16} color={C.orange} />
            <Text style={styles.statNumber}>{todayCount}</Text>
            <Text style={styles.statLabel}>Today</Text>
          </View>
          <View style={styles.statCard}>
            <Clock size={16} color={C.orange} />
            <Text style={styles.statNumber}>{confirmedCount}</Text>
            <Text style={styles.statLabel}>Confirmed</Text>
          </View>
          <View style={styles.statCard}>
            <Users size={16} color={C.success} />
            <Text style={styles.statNumber}>{arrivedCount}</Text>
            <Text style={styles.statLabel}>Arrived</Text>
          </View>
        </View>

        <View style={styles.searchRow}>
          <Search size={16} color={C.orange} style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, phone or table…"
            placeholderTextColor={C.muted}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          <View style={styles.filterRow}>
            {FILTER_TABS.map(tab => (
              <TouchableOpacity
                key={tab.key}
                style={[styles.filterPill, filterStatus === tab.key && styles.filterPillActive]}
                onPress={() => setFilterStatus(tab.key)}
                activeOpacity={0.8}
              >
                <Text style={[styles.filterPillText, filterStatus === tab.key && styles.filterPillTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <Calendar size={48} color={C.steel} />
            <Text style={styles.emptyTitle}>No Reservations</Text>
            <Text style={styles.emptySubtitle}>
              {search ? 'No results for your search' : 'No reservations found'}
            </Text>
          </View>
        ) : (
          filtered.map(reservation => {
            const cfg = STATUS_CONFIG[reservation.status]
            return (
              <View key={reservation.reservation_id} style={styles.card}>

                <View style={styles.cardHeader}>
                  <View style={styles.cardHeaderLeft}>
                    <View style={[styles.statusDot, { backgroundColor: cfg.dot }]} />
                    <View>
                      <Text style={styles.customerName}>{reservation.customer_name}</Text>
                      <Text style={styles.cardMeta}>
                        🪑 Table {reservation.table_number} · 👥 {reservation.party_size}p · {reservation.floor}
                      </Text>
                    </View>
                  </View>
                  {canDelete && (
                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => handleDelete(reservation.reservation_id, reservation.customer_name)}
                      activeOpacity={0.8}
                    >
                      <Trash2 size={13} color={C.error} />
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.infoRow}>
                  <View style={styles.infoChip}>
                    <Calendar size={11} color={C.dim} />
                    <Text style={styles.infoChipText}>{reservation.reservation_date}</Text>
                  </View>
                  <View style={styles.infoChip}>
                    <Clock size={11} color={C.dim} />
                    <Text style={styles.infoChipText}>{reservation.reservation_time}</Text>
                  </View>
                  {reservation.customer_phone ? (
                    <View style={styles.infoChip}>
                      <Phone size={11} color={C.dim} />
                      <Text style={styles.infoChipText}>{reservation.customer_phone}</Text>
                    </View>
                  ) : null}
                </View>

                <View style={[styles.statusBadge, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
                  <Text style={[styles.statusText, { color: cfg.text }]}>{cfg.label}</Text>
                </View>

                {reservation.status === 'confirmed' && (
                  <View style={styles.actionsRow}>
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: C.steel, borderColor: C.muted }]}
                      onPress={() => handleStatusChange(reservation.reservation_id, 'arrived')}
                      activeOpacity={0.8}
                    >
                      <CheckCircle size={12} color={C.offWhite} />
                      <Text style={[styles.actionBtnText, { color: C.offWhite }]}>Arrived</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: C.errorBg, borderColor: '#7A1010' }]}
                      onPress={() => handleStatusChange(reservation.reservation_id, 'cancelled')}
                      activeOpacity={0.8}
                    >
                      <XCircle size={12} color={C.error} />
                      <Text style={[styles.actionBtnText, { color: C.error }]}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {reservation.status === 'arrived' && (
                  <View style={styles.actionsRow}>
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: C.successBg, borderColor: '#1A4A2A' }]}
                      onPress={() => handleStatusChange(reservation.reservation_id, 'completed')}
                      activeOpacity={0.8}
                    >
                      <CheckCircle size={12} color={C.success} />
                      <Text style={[styles.actionBtnText, { color: C.success }]}>Complete</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: C.graphite, borderColor: C.steel }]}
                      onPress={() => handleStatusChange(reservation.reservation_id, 'no_show')}
                      activeOpacity={0.8}
                    >
                      <AlertCircle size={12} color={C.dim} />
                      <Text style={[styles.actionBtnText, { color: C.dim }]}>No Show</Text>
                    </TouchableOpacity>
                  </View>
                )}

              </View>
            )
          })
        )}

      </ScrollView>

      {canCreate && (
        <Modal visible={showTablePicker} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Select a Table</Text>
              <ScrollView showsVerticalScrollIndicator={false}>
                {tables.map(table => (
                  <TouchableOpacity
                    key={table.table_id}
                    style={styles.tablePickerRow}
                    onPress={() => {
                      setSelectedTableId(table.table_id)
                      setShowTablePicker(false)
                      setShowCreateModal(true)
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.tablePickerName}>Table {table.table_number}</Text>
                    <Text style={styles.tablePickerMeta}>
                      {table.floor} · 👥 {table.capacity} seats · {table.table_status}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setShowTablePicker(false)} activeOpacity={0.8}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {selectedTable && (
        <ReservationModal
          table={selectedTable}
          isOpen={showCreateModal}
          onClose={() => { setShowCreateModal(false); setSelectedTableId(null) }}
          onReservationCreated={handleReservationCreated}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: C.black },
  content:     { padding: 20, paddingTop: 56, paddingBottom: 32 },
  centered:    { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24, backgroundColor: C.black },
  loadingText: { fontSize: 14, color: C.muted },
  errorTitle:  { fontSize: 16, fontWeight: '700', color: C.error },
  errorSub:    { fontSize: 13, color: C.dim },

  blob1: { position: 'absolute', top: -80, left: '20%', width: 260, height: 260, borderRadius: 130, backgroundColor: C.orange, opacity: 0.10 },
  blob2: { position: 'absolute', top: -40, left: '45%', width: 180, height: 180, borderRadius: 90,  backgroundColor: C.orange, opacity: 0.16 },

  header:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  title:         { fontSize: 22, fontWeight: '900', color: C.white, letterSpacing: 0.3 },
  subtitle:      { fontSize: 13, color: C.muted, marginTop: 3 },
  addButton:     { flexDirection: 'row', alignItems: 'center', backgroundColor: C.orange, borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 9, gap: 6 },
  addButtonText: { color: C.white, fontWeight: '700', fontSize: 13 },

  successBanner:   { flexDirection: 'row', alignItems: 'center', backgroundColor: C.successBg, borderWidth: 1, borderColor: C.success, borderRadius: radius.md, padding: 12, marginBottom: 12, gap: 8 },
  successText:     { color: C.success, fontSize: 13, fontWeight: '600' },
  errorBanner:     { flexDirection: 'row', alignItems: 'center', backgroundColor: C.errorBg, borderWidth: 1, borderColor: C.error, borderRadius: radius.md, padding: 12, marginBottom: 12, gap: 8 },
  errorBannerText: { color: C.error, fontSize: 13, fontWeight: '600' },

  statsRow:   { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statCard:   { flex: 1, backgroundColor: C.card, borderRadius: radius.md, borderWidth: 1, borderColor: C.border, padding: 12, alignItems: 'center', gap: 4 },
  statNumber: { fontSize: 22, fontWeight: '900', color: C.white },
  statLabel:  { fontSize: 10, fontWeight: '700', color: C.muted, textTransform: 'uppercase', letterSpacing: 0.8 },

  searchRow:   { flexDirection: 'row', alignItems: 'center', backgroundColor: C.graphite, borderWidth: 1, borderColor: C.border, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 12 },
  searchInput: { flex: 1, fontSize: 14, color: C.white },

  filterScroll:         { marginBottom: 16 },
  filterRow:            { flexDirection: 'row', gap: 8, paddingBottom: 2 },
  filterPill:           { backgroundColor: C.graphite, borderWidth: 1, borderColor: C.border, borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 7 },
  filterPillActive:     { backgroundColor: C.orange, borderColor: C.orange },
  filterPillText:       { fontSize: 12, fontWeight: '600', color: C.dim },
  filterPillTextActive: { color: C.white, fontWeight: '700' },

  emptyState:    { alignItems: 'center', paddingVertical: 56, gap: 12 },
  emptyTitle:    { fontSize: 17, fontWeight: '800', color: C.offWhite },
  emptySubtitle: { fontSize: 13, color: C.muted },

  card:           { backgroundColor: C.card, borderRadius: radius.lg, borderWidth: 1, borderColor: C.border, padding: 14, marginBottom: 12, gap: 10 },
  cardHeader:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  statusDot:      { width: 7, height: 7, borderRadius: 4, flexShrink: 0 },
  customerName:   { fontSize: 15, fontWeight: '800', color: C.white },
  cardMeta:       { fontSize: 11, color: C.muted, marginTop: 2 },
  deleteBtn:      { padding: 8, borderRadius: 10, backgroundColor: C.errorBg, borderWidth: 1, borderColor: '#7A1010' },

  infoRow:      { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  infoChip:     { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.graphite, borderRadius: radius.pill, borderWidth: 1, borderColor: C.border, paddingHorizontal: 8, paddingVertical: 4 },
  infoChipText: { fontSize: 11, color: C.dim, fontWeight: '500' },

  statusBadge: { alignSelf: 'flex-start', borderRadius: radius.pill, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4 },
  statusText:  { fontSize: 10, fontWeight: '700' },

  actionsRow:    { flexDirection: 'row', gap: 8 },
  actionBtn:     { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: radius.pill, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 7 },
  actionBtnText: { fontSize: 11, fontWeight: '700' },

  modalOverlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  modalContainer:  { backgroundColor: C.charcoal, borderTopLeftRadius: 28, borderTopRightRadius: 28, borderTopWidth: 1, borderColor: C.border, padding: 24, maxHeight: '70%' },
  modalTitle:      { fontSize: 16, fontWeight: '900', color: C.white, letterSpacing: 0.3, marginBottom: 16 },

  tablePickerRow:  { backgroundColor: C.graphite, borderRadius: radius.md, borderWidth: 1, borderColor: C.border, padding: 14, marginBottom: 8 },
  tablePickerName: { fontSize: 14, fontWeight: '800', color: C.white },
  tablePickerMeta: { fontSize: 12, color: C.muted, marginTop: 2 },

  cancelButton:     { backgroundColor: C.graphite, borderWidth: 1, borderColor: C.border, borderRadius: radius.md, height: 52, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  cancelButtonText: { fontSize: 14, color: C.offWhite, fontWeight: '600' },
})