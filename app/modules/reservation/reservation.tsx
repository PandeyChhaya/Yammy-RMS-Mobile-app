
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
import { useState } from 'react'
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
import reservationService from '../tables/services/reservationService'
import tableService from '../tables/services/tableService'

// ─── Theme ───────────────────────────────────────────────────────────────────
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

const STATUS_CONFIG: Record<ReservationStatus, {
  label: string
  bg: string
  border: string
  text: string
  dot: string
}> = {
  confirmed:  { label: 'Confirmed',  bg: C.brassLight, border: C.brassBorder, text: C.brass,      dot: C.brass      },
  arrived:    { label: 'Arrived',    bg: C.vellum,     border: C.latte,       text: C.espresso,   dot: C.roast      },
  completed:  { label: 'Completed',  bg: C.sageLight,  border: C.sageBorder,  text: C.sage,       dot: C.sage       },
  cancelled:  { label: 'Cancelled',  bg: C.tcLight,    border: C.tcBorder,    text: C.terracotta, dot: C.terracotta },
  no_show:    { label: 'No Show',    bg: C.parchment,  border: C.vellum,      text: C.clay,       dot: C.clay       },
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

  const [search,              setSearch]              = useState('')
  const [filterStatus,        setFilterStatus]        = useState<ReservationStatus | 'all'>('all')
  const [showCreateModal,     setShowCreateModal]     = useState(false)
  const [selectedTableId,     setSelectedTableId]     = useState<number | null>(null)
  const [showTablePicker,     setShowTablePicker]     = useState(false)
  const [successMessage,      setSuccessMessage]      = useState<string | null>(null)
  const [errorMessage,        setErrorMessage]        = useState<string | null>(null)

  const { data: reservations = [], isLoading, error } = useQuery<ReservationWithTable[]>({
    queryKey: ['reservations-all'],
    queryFn:  reservationService.getAllReservations,
    retry: 3,
  })

  const { data: tables = [] } = useQuery({
    queryKey: ['tables'],
    queryFn:  tableService.getTable,
  })

  // ── Mutations ─────────────────────────────────────────────────────────────
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

  // ── Helpers ───────────────────────────────────────────────────────────────
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

  // ── Filter + Search ───────────────────────────────────────────────────────
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

  // ── Stats ─────────────────────────────────────────────────────────────────
  const todayStr = new Date().toISOString().split('T')[0]
  const todayCount     = reservations.filter(r => r.reservation_date === todayStr).length
  const confirmedCount = reservations.filter(r => r.status === 'confirmed').length
  const arrivedCount   = reservations.filter(r => r.status === 'arrived').length

  // ── Selected table for modal ──────────────────────────────────────────────
  const selectedTable = tables.find(t => t.table_id === selectedTableId) ?? null

  // ─── Render ────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={C.brass} />
        <Text style={styles.loadingText}>Loading reservations…</Text>
      </View>
    )
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <AlertCircle size={48} color={C.terracotta} />
        <Text style={styles.errorTitle}>Something went wrong</Text>
        <Text style={styles.errorSub}>{String(error)}</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Reservations</Text>
            <Text style={styles.subtitle}>Manage all bookings</Text>
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowTablePicker(true)}
          >
            <Plus size={16} color={C.cream} />
            <Text style={styles.addButtonText}>New</Text>
          </TouchableOpacity>
        </View>

        {/* ── Banners ─────────────────────────────────────────────────────── */}
        {successMessage && (
          <View style={styles.successBanner}>
            <CheckCircle size={16} color={C.sage} />
            <Text style={styles.successText}>{successMessage}</Text>
          </View>
        )}
        {errorMessage && (
          <View style={styles.errorBanner}>
            <AlertCircle size={16} color={C.terracotta} />
            <Text style={styles.errorBannerText}>{errorMessage}</Text>
          </View>
        )}

        {/* ── Stats row ───────────────────────────────────────────────────── */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Calendar size={16} color={C.brass} />
            <Text style={styles.statNumber}>{todayCount}</Text>
            <Text style={styles.statLabel}>Today</Text>
          </View>
          <View style={styles.statCard}>
            <Clock size={16} color={C.brass} />
            <Text style={styles.statNumber}>{confirmedCount}</Text>
            <Text style={styles.statLabel}>Confirmed</Text>
          </View>
          <View style={styles.statCard}>
            <Users size={16} color={C.sage} />
            <Text style={styles.statNumber}>{arrivedCount}</Text>
            <Text style={styles.statLabel}>Arrived</Text>
          </View>
        </View>

        {/* ── Search ──────────────────────────────────────────────────────── */}
        <View style={styles.searchRow}>
          <Search size={16} color={C.latte} style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, phone or table…"
            placeholderTextColor={C.latte}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* ── Filter tabs ─────────────────────────────────────────────────── */}
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

        {/* ── List ────────────────────────────────────────────────────────── */}
        {filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <Calendar size={48} color={C.vellum} />
            <Text style={styles.emptyTitle}>No Reservations</Text>
            <Text style={styles.emptySubtitle}>
              {search ? 'No results for your search' : 'No reservations found'}
            </Text>
          </View>
        ) : (
          filtered.map(reservation => {
            const cfg = STATUS_CONFIG[reservation.status]
            return (
              <View key={reservation.reservation_id} style={[styles.card, { borderColor: cfg.border }]}>

                {/* Card header */}
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
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => handleDelete(reservation.reservation_id, reservation.customer_name)}
                  >
                    <Trash2 size={13} color={C.terracotta} />
                  </TouchableOpacity>
                </View>

                {/* Date / time / phone */}
                <View style={styles.infoRow}>
                  <View style={styles.infoChip}>
                    <Calendar size={11} color={C.clay} />
                    <Text style={styles.infoChipText}>{reservation.reservation_date}</Text>
                  </View>
                  <View style={styles.infoChip}>
                    <Clock size={11} color={C.clay} />
                    <Text style={styles.infoChipText}>{reservation.reservation_time}</Text>
                  </View>
                  {reservation.customer_phone ? (
                    <View style={styles.infoChip}>
                      <Phone size={11} color={C.clay} />
                      <Text style={styles.infoChipText}>{reservation.customer_phone}</Text>
                    </View>
                  ) : null}
                </View>

                {/* Status badge */}
                <View style={[styles.statusBadge, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
                  <Text style={[styles.statusText, { color: cfg.text }]}>{cfg.label}</Text>
                </View>

                {/* Action buttons based on status */}
                {reservation.status === 'confirmed' && (
                  <View style={styles.actionsRow}>
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: C.vellum, borderColor: C.latte }]}
                      onPress={() => handleStatusChange(reservation.reservation_id, 'arrived')}
                      activeOpacity={0.8}
                    >
                      <CheckCircle size={12} color={C.espresso} />
                      <Text style={[styles.actionBtnText, { color: C.espresso }]}>Arrived</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: C.tcLight, borderColor: C.tcBorder }]}
                      onPress={() => handleStatusChange(reservation.reservation_id, 'cancelled')}
                      activeOpacity={0.8}
                    >
                      <XCircle size={12} color={C.terracotta} />
                      <Text style={[styles.actionBtnText, { color: C.terracotta }]}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {reservation.status === 'arrived' && (
                  <View style={styles.actionsRow}>
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: C.sageLight, borderColor: C.sageBorder }]}
                      onPress={() => handleStatusChange(reservation.reservation_id, 'completed')}
                      activeOpacity={0.8}
                    >
                      <CheckCircle size={12} color={C.sage} />
                      <Text style={[styles.actionBtnText, { color: C.sage }]}>Complete</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: C.parchment, borderColor: C.vellum }]}
                      onPress={() => handleStatusChange(reservation.reservation_id, 'no_show')}
                      activeOpacity={0.8}
                    >
                      <AlertCircle size={12} color={C.clay} />
                      <Text style={[styles.actionBtnText, { color: C.clay }]}>No Show</Text>
                    </TouchableOpacity>
                  </View>
                )}

              </View>
            )
          })
        )}

      </ScrollView>

      {/* ── Table Picker Modal ─────────────────────────────────────────────── */}
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
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowTablePicker(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Create Reservation Modal ───────────────────────────────────────── */}
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

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: C.cream },
  content:     { padding: 16, paddingTop: 52, paddingBottom: 32 },
  centered:    { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  loadingText: { fontSize: 14, color: C.clay },
  errorTitle:  { fontSize: 16, fontWeight: '700', color: C.terracotta },
  errorSub:    { fontSize: 13, color: C.clay },

  header:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  title:         { fontSize: 22, fontWeight: '900', color: C.espresso },
  subtitle:      { fontSize: 13, color: C.clay, marginTop: 3 },
  addButton:     { flexDirection: 'row', alignItems: 'center', backgroundColor: C.brass, borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 9, gap: 6 },
  addButtonText: { color: C.cream, fontWeight: '700', fontSize: 13 },

  successBanner:   { flexDirection: 'row', alignItems: 'center', backgroundColor: C.sageLight, borderWidth: 1, borderColor: C.sageBorder, borderRadius: radius.md, padding: 12, marginBottom: 12, gap: 8 },
  successText:     { color: C.sage, fontSize: 13, fontWeight: '600' },
  errorBanner:     { flexDirection: 'row', alignItems: 'center', backgroundColor: C.tcLight, borderWidth: 1, borderColor: C.tcBorder, borderRadius: radius.md, padding: 12, marginBottom: 12, gap: 8 },
  errorBannerText: { color: C.terracotta, fontSize: 13, fontWeight: '600' },

  statsRow:     { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statCard:     { flex: 1, backgroundColor: C.parchment, borderRadius: radius.md, borderWidth: 1.5, borderColor: C.vellum, padding: 12, alignItems: 'center', gap: 4 },
  statNumber:   { fontSize: 22, fontWeight: '900', color: C.espresso },
  statLabel:    { fontSize: 10, fontWeight: '700', color: C.clay, textTransform: 'uppercase', letterSpacing: 0.8 },

  searchRow:    { flexDirection: 'row', alignItems: 'center', backgroundColor: C.parchment, borderWidth: 1.5, borderColor: C.vellum, borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 12 },
  searchInput:  { flex: 1, fontSize: 14, color: C.espresso },

  filterScroll: { marginBottom: 16 },
  filterRow:    { flexDirection: 'row', gap: 8, paddingBottom: 2 },
  filterPill:         { backgroundColor: C.parchment, borderWidth: 1.5, borderColor: C.vellum, borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 7 },
  filterPillActive:   { backgroundColor: C.roast, borderColor: C.roast },
  filterPillText:     { fontSize: 12, fontWeight: '600', color: C.clay },
  filterPillTextActive: { color: C.cream },

  emptyState:    { alignItems: 'center', paddingVertical: 56, gap: 12 },
  emptyTitle:    { fontSize: 17, fontWeight: '800', color: C.espresso },
  emptySubtitle: { fontSize: 13, color: C.clay },

  card:         { backgroundColor: C.parchment, borderRadius: radius.md, borderWidth: 1.5, padding: 14, marginBottom: 12, gap: 10 },
  cardHeader:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  statusDot:    { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
  customerName: { fontSize: 15, fontWeight: '800', color: C.espresso },
  cardMeta:     { fontSize: 11, color: C.clay, marginTop: 2 },
  deleteBtn:    { padding: 7, borderRadius: radius.xs, backgroundColor: C.tcLight, borderWidth: 1, borderColor: C.tcBorder },

  infoRow:      { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  infoChip:     { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.cream, borderRadius: radius.pill, borderWidth: 1, borderColor: C.vellum, paddingHorizontal: 8, paddingVertical: 4 },
  infoChipText: { fontSize: 11, color: C.clay, fontWeight: '500' },

  statusBadge:  { alignSelf: 'flex-start', borderRadius: radius.pill, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4 },
  statusText:   { fontSize: 10, fontWeight: '700' },

  actionsRow:     { flexDirection: 'row', gap: 8 },
  actionBtn:      { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: radius.pill, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 7 },
  actionBtnText:  { fontSize: 11, fontWeight: '700' },

  modalOverlay:    { flex: 1, backgroundColor: 'rgba(28,16,8,0.6)', justifyContent: 'flex-end' },
  modalContainer:  { backgroundColor: C.parchment, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, borderWidth: 1.5, borderColor: C.vellum, padding: 24, maxHeight: '70%' },
  modalTitle:      { fontSize: 16, fontWeight: '900', color: C.espresso, marginBottom: 16 },

  tablePickerRow:  { backgroundColor: C.cream, borderRadius: radius.md, borderWidth: 1, borderColor: C.vellum, padding: 14, marginBottom: 8 },
  tablePickerName: { fontSize: 14, fontWeight: '800', color: C.espresso },
  tablePickerMeta: { fontSize: 12, color: C.clay, marginTop: 2 },

  cancelButton:     { borderWidth: 1.5, borderColor: C.vellum, borderRadius: radius.pill, paddingVertical: 12, alignItems: 'center', backgroundColor: C.cream, marginTop: 8 },
  cancelButtonText: { fontSize: 14, color: C.clay, fontWeight: '700' },
})
