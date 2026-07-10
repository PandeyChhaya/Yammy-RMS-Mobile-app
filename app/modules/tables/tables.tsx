import AsyncStorage from '@react-native-async-storage/async-storage'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import {
  AlertCircle,
  CheckCircle,
  CreditCard,
  Edit,
  Plus,
  Settings,
  Trash2
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
import { authService } from '../auth/services/auth.service'
import { ReservationStatus, ReservationWithTable } from '../pos/types/reservation'
import { CreateTableRequest, TableData } from '../pos/types/tables'
import reservationService from '../reservation/services/reservationService'
import ReservationsCalendar from './components/ReservationCalender'
import ReservationModal from './components/ReservationModal'
import tableService from './services/tableService'
const C = {
  black:       '#0A0A0A',
  charcoal:    '#1A1A1A',
  graphite:    '#2C2C2C',
  steel:       '#3D3D3D',
  muted:       '#6B6B6B',
  border:      '#2E2E2E',
  card:        '#1E1E1E',
  orange:      '#FF6B2C',
  orangeTint:  '#2A1A10',
  orangeDim:   '#7A3010',
  white:       '#FFFFFF',
  offWhite:    '#F0F0F0',
  dim:         '#A0A0A0',
  success:     '#22C55E',
  successBg:   '#0D2818',
  error:       '#EF4444',
  errorBg:     '#2A0A0A',
}

const radius = { xs: 6, sm: 10, md: 14, lg: 18, pill: 100 }

const DEFAULT_FORM: CreateTableRequest = {
  table_number: '',
  floor:        'Ground Floor',
  capacity:     4,
}

const STATUS_CONFIG: Record<TableData['table_status'], { label: string; bg: string; border: string; text: string; dot: string }> = {
  Available:   { label: 'Available',   bg: C.successBg,  border: '#1A4A2A',  text: C.success,  dot: C.success  },
  Occupied:    { label: 'Occupied',    bg: '#1A1400',    border: '#5A4500',  text: '#C8A020',  dot: '#C8A020'  },
  Reserved:    { label: 'Reserved',    bg: C.orangeTint, border: C.orangeDim, text: C.orange,  dot: C.orange   },
  Maintenance: { label: 'Maintenance', bg: C.graphite,   border: C.steel,    text: C.dim,      dot: C.dim      },
}

const CAPACITY_OPTIONS = [2, 4, 6, 8, 10, 12]

export default function Tables() {
  const router = useRouter()
  const queryClient = useQueryClient()

  const [canManage,             setCanManage]             = useState(false)
  const [showAddModal,          setShowAddModal]          = useState(false)
  const [showEditModal,         setShowEditModal]         = useState(false)
  const [editingTable,          setEditingTable]          = useState<TableData | null>(null)
  const [selectedTable,         setSelectedTable]         = useState<TableData | null>(null)
  const [addForm,               setAddForm]               = useState<CreateTableRequest>(DEFAULT_FORM)
  const [editForm,              setEditForm]              = useState<CreateTableRequest>(DEFAULT_FORM)
  const [showSuccessMessage,    setShowSuccessMessage]    = useState<string | null>(null)
  const [showErrorMessage,      setShowErrorMessage]      = useState<string | null>(null)
  const [showReservationModal,  setShowReservationModal]  = useState(false)
  const [selectedDate,          setSelectedDate]          = useState(new Date())
  const [reservations,          setReservations]          = useState<ReservationWithTable[]>([])
  const [isLoadingReservations, setIsLoadingReservations] = useState(false)
  const [focusedInput,          setFocusedInput]          = useState<string | null>(null)

  useEffect(() => {
    AsyncStorage.getItem('@userRole').then(role => {
      setCanManage(role === 'Admin')
    })
  }, [])

 const { data: tables = [], isLoading, error } = useQuery<TableData[]>({
    queryKey: ['tables'],
    queryFn:  async () => {
      const restaurant_id = await authService.getRestaurantId()
      return tableService.getTable(restaurant_id ?? undefined)
    },
    retry: 3,
  })

  const createMutation = useMutation({
    mutationFn: (data: CreateTableRequest) => tableService.postTable(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] })
      setShowAddModal(false)
      setAddForm(DEFAULT_FORM)
      showSuccess('Table created successfully!')
    },
    onError: (err) => showError('Error creating table: ' + err),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: CreateTableRequest }) =>
      tableService.putTable(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] })
      setShowEditModal(false)
      setEditingTable(null)
      showSuccess('Table updated successfully!')
    },
    onError: (err) => showError('Error updating table: ' + err),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => tableService.deleteTable(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] })
      showSuccess('Table deleted successfully!')
    },
    onError: (err) => showError('Error deleting table: ' + err),
  })

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: TableData['table_status'] }) =>
      tableService.putTable(id, { table_status: status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] })
      showSuccess('Status updated!')
    },
    onError: (err) => showError('Error updating status: ' + err),
  })

  const showSuccess = (msg: string) => {
    setShowSuccessMessage(msg)
    setTimeout(() => setShowSuccessMessage(null), 3000)
  }

  const showError = (msg: string) => {
    setShowErrorMessage(msg)
    setTimeout(() => setShowErrorMessage(null), 5000)
  }

  const handleAddSubmit = () => {
    if (!addForm.table_number.trim()) { showError('Table number is required'); return }
    createMutation.mutate(addForm)
  }

  const handleEdit = (table: TableData) => {
    setEditingTable(table)
    setEditForm({ table_number: table.table_number, floor: table.floor, capacity: table.capacity })
    setShowEditModal(true)
  }

  const handleEditSubmit = () => {
    if (!editForm.table_number.trim()) { showError('Table number is required'); return }
    if (editingTable) updateMutation.mutate({ id: editingTable.table_id, data: editForm })
  }

  const handleDelete = (id: number, name: string) => {
    Alert.alert('Delete Table', `Delete table "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate(id) },
    ])
  }

  const handleStatusChange = (table: TableData, status: TableData['table_status']) => {
    if (status === 'Reserved') {
      setSelectedTable(table)
      setShowReservationModal(true)
    } else {
      updateStatusMutation.mutate({ id: table.table_id, status })
    }
  }

  const loadReservations = async (date: Date) => {
    setIsLoadingReservations(true)
    try {
      const dateString = date.toISOString().split('T')[0]
      const data = await reservationService.getReservationsWithTableInfo(dateString)
      setReservations(data.filter((r: ReservationWithTable) => r.status !== 'cancelled'))
    } catch {
      showError('Error loading reservations')
    } finally {
      setIsLoadingReservations(false)
    }
  }

  const handleReservationCreated = (_reservation: any) => {
    if (selectedTable) updateStatusMutation.mutate({ id: selectedTable.table_id, status: 'Reserved' })
    showSuccess('Reservation created successfully!')
    loadReservations(selectedDate)
    setShowReservationModal(false)
    setSelectedTable(null)
  }

  const handleReservationStatusChange = async (
    reservationId: number,
    status: ReservationStatus,
  ) => {
    try {
      await reservationService.updateReservationStatus(reservationId, status)
      const reservation = reservations.find(r => r.reservation_id === reservationId)
      if (reservation) {
        const tableStatus: TableData['table_status'] =
          status === 'cancelled' || status === 'no_show' ? 'Available' :
          status === 'arrived'    ? 'Occupied' : 'Reserved'
        updateStatusMutation.mutate({ id: Number(reservation.table_id), status: tableStatus })
      }
      showSuccess('Reservation status updated!')
      loadReservations(selectedDate)
    } catch {
      showError('Error updating reservation status')
    }
  }

  useEffect(() => { loadReservations(selectedDate) }, [selectedDate])

  const inputStyle = (key: string) => [
    styles.input,
    focusedInput === key && styles.inputFocused,
  ]

  const renderForm = (
    form: CreateTableRequest,
    setForm: (f: CreateTableRequest) => void,
    onSubmit: () => void,
    onCancel: () => void,
    isPending: boolean,
    submitLabel: string,
    prefix: string,
  ) => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <Text style={styles.label}>Table Number *</Text>
      <TextInput
        style={inputStyle(`${prefix}_num`)}
        placeholder="e.g. T1"
        placeholderTextColor={C.muted}
        value={form.table_number}
        onChangeText={v => setForm({ ...form, table_number: v })}
        onFocus={() => setFocusedInput(`${prefix}_num`)}
        onBlur={() => setFocusedInput(null)}
      />

      <Text style={styles.label}>Floor</Text>
      <TextInput
        style={inputStyle(`${prefix}_floor`)}
        placeholder="e.g. Ground Floor"
        placeholderTextColor={C.muted}
        value={form.floor}
        onChangeText={v => setForm({ ...form, floor: v })}
        onFocus={() => setFocusedInput(`${prefix}_floor`)}
        onBlur={() => setFocusedInput(null)}
      />

      <Text style={styles.label}>Capacity</Text>
      <View style={styles.pillRow}>
        {CAPACITY_OPTIONS.map(cap => (
          <TouchableOpacity
            key={cap}
            style={[styles.pill, form.capacity === cap && styles.pillActive]}
            onPress={() => setForm({ ...form, capacity: cap })}
            activeOpacity={0.8}
          >
            <Text style={[styles.pillText, form.capacity === cap && styles.pillTextActive]}>
              {cap}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.modalButtons}>
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.submitButton, isPending && styles.submitButtonDisabled]}
          onPress={onSubmit}
          disabled={isPending}
          activeOpacity={0.85}
        >
          {isPending
            ? <ActivityIndicator size="small" color={C.white} />
            : <Text style={styles.submitButtonText}>{submitLabel} →</Text>
          }
        </TouchableOpacity>
      </View>
    </ScrollView>
  )

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={C.orange} />
        <Text style={styles.loadingText}>Loading tables…</Text>
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
      <View style={styles.blob1} />
      <View style={styles.blob2} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Table Management</Text>
            <Text style={styles.subtitle}>Table plan and status</Text>
          </View>
          {canManage && (
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => { setAddForm(DEFAULT_FORM); setShowAddModal(true) }}
              activeOpacity={0.85}
            >
              <Plus size={16} color={C.white} />
              <Text style={styles.addButtonText}>Add Table</Text>
            </TouchableOpacity>
          )}
        </View>

        {showSuccessMessage && (
          <View style={styles.successBanner}>
            <CheckCircle size={16} color={C.success} />
            <Text style={styles.successText}>{showSuccessMessage}</Text>
          </View>
        )}

        {showErrorMessage && (
          <View style={styles.errorBanner}>
            <AlertCircle size={16} color={C.error} />
            <Text style={styles.errorBannerText}>{showErrorMessage}</Text>
          </View>
        )}

        {canManage && (
          <>
            <View style={styles.sectionHeader}>
              
              <Text style={styles.sectionTitle}>Planning</Text>
            </View>

            {isLoadingReservations ? (
              <View style={{ alignItems: 'center', paddingVertical: 24 }}>
                <ActivityIndicator size="small" color={C.orange} />
                <Text style={styles.loadingText}>Loading reservations…</Text>
              </View>
            ) : (
              <ReservationsCalendar
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
                reservations={reservations as any}
                onReservationClick={(r) => console.log('Reservation clicked:', r)}
                onReservationStatusChange={handleReservationStatusChange as any}
              />
            )}
          </>
        )}

        <View style={[styles.sectionHeader, { marginTop: 24 }]}>
          
          <Text style={styles.sectionTitle}>Tables ({tables.length})</Text>
        </View>

        {tables.length === 0 ? (
          <View style={styles.emptyState}>
            <Settings size={40} color={C.steel} />
            <Text style={styles.emptyTitle}>No Tables</Text>
            <Text style={styles.emptySubtitle}>Start by creating your first table</Text>
            {canManage && (
              <TouchableOpacity style={styles.addButton} onPress={() => setShowAddModal(true)} activeOpacity={0.85}>
                <Plus size={16} color={C.white} />
                <Text style={styles.addButtonText}>Create Table</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          tables.map((table) => {
            const cfg = STATUS_CONFIG[table.table_status] ?? STATUS_CONFIG.Available
            const dotCount = Math.min(table.capacity, 8)
            return (
              <View key={table.table_id} style={styles.card}>

                <View style={styles.cardHeader}>
                  <View style={styles.tableVisual}>
                    <View style={[styles.tableCircle, { borderColor: cfg.border, backgroundColor: cfg.bg }]}>
                      <Text style={[styles.tableCircleNumber, { color: cfg.text }]}>{table.table_number}</Text>
                    </View>
                    {Array.from({ length: dotCount }).map((_, i) => {
                      const angle  = (i / dotCount) * 2 * Math.PI - Math.PI / 2
                      const orbit  = 42
                      return (
                        <View
                          key={i}
                          style={[
                            styles.chairDotAbs,
                            {
                              backgroundColor: cfg.dot,
                              transform: [
                                { translateX: orbit * Math.cos(angle) },
                                { translateY: orbit * Math.sin(angle) },
                              ],
                            },
                          ]}
                        />
                      )
                    })}
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>Table {table.table_number}</Text>
                    <Text style={styles.cardSub}>Floor {table.floor} ·  {table.capacity} seats</Text>
                  </View>

                  {canManage && (
                    <View style={styles.cardActions}>
                      <TouchableOpacity style={styles.iconButtonEdit} onPress={() => handleEdit(table)} activeOpacity={0.8}>
                        <Edit size={14} color={C.orange} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.iconButtonDelete}
                        onPress={() => handleDelete(table.table_id, table.table_number)}
                        activeOpacity={0.8}
                      >
                        <Trash2 size={14} color={C.error} />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>

                <View style={[styles.statusBadge, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
                  <View style={[styles.statusBadgeDot, { backgroundColor: cfg.dot }]} />
                  <Text style={[styles.statusText, { color: cfg.text }]}>{cfg.label}</Text>
                </View>

                <Text style={styles.label}>Change Status:</Text>
                <View style={styles.pillRow}>
                  {(Object.keys(STATUS_CONFIG) as TableData['table_status'][]).map((key) => {
                    const config = STATUS_CONFIG[key]
                    const isActive = table.table_status === key
                    return (
                      <TouchableOpacity
                        key={key}
                        style={[
                          styles.pill,
                          isActive && { backgroundColor: config.bg, borderColor: config.border },
                        ]}
                        onPress={() => handleStatusChange(table, key)}
                        disabled={isActive || updateStatusMutation.isPending}
                        activeOpacity={0.8}
                      >
                        <Text style={[
                          styles.pillText,
                          isActive && { color: config.text, fontWeight: '700' },
                        ]}>
                          {config.label}
                        </Text>
                      </TouchableOpacity>
                    )
                  })}
                </View>

                <TouchableOpacity
                  style={styles.orderBtn}
                  activeOpacity={0.85}
                  onPress={() => router.push({ pathname: '/modules/pos/POS', params: { table_id: table.table_id, table_number: table.table_number } })}
                >
                  <CreditCard size={14} color={C.white} />
                  <Text style={styles.orderBtnText}>Take Order</Text>
                </TouchableOpacity>
              </View>
            )
          })
        )}
      </ScrollView>

      {canManage && (
        <>
          <Modal visible={showAddModal} animationType="slide" transparent>
            <View style={styles.modalOverlay}>
              <View style={styles.modalContainer}>
                <Text style={styles.modalTitle}>New Table</Text>
                {renderForm(addForm, setAddForm, handleAddSubmit, () => setShowAddModal(false), createMutation.isPending, 'Create', 'add')}
              </View>
            </View>
          </Modal>

          <Modal visible={showEditModal} animationType="slide" transparent>
            <View style={styles.modalOverlay}>
              <View style={styles.modalContainer}>
                <Text style={styles.modalTitle}>Edit Table</Text>
                {renderForm(editForm, setEditForm, handleEditSubmit, () => { setShowEditModal(false); setEditingTable(null) }, updateMutation.isPending, 'Update', 'edit')}
              </View>
            </View>
          </Modal>
        </>
      )}

      {selectedTable && (
        <ReservationModal
          table={selectedTable}
          isOpen={showReservationModal}
          onClose={() => { setShowReservationModal(false); setSelectedTable(null) }}
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
  loadingText: { fontSize: 14, color: C.muted, marginTop: 8 },
  errorTitle:  { fontSize: 16, fontWeight: '700', color: C.error },
  errorSub:    { fontSize: 13, color: C.dim },

  blob1: { position: 'absolute', top: -80, left: '20%', width: 260, height: 260, borderRadius: 130, backgroundColor: C.orange, opacity: 0.10 },
  blob2: { position: 'absolute', top: -40, left: '45%', width: 180, height: 180, borderRadius: 90,  backgroundColor: C.orange, opacity: 0.16 },

  header:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  title:         { fontSize: 22, fontWeight: '900', color: C.white, letterSpacing: 0.3 },
  subtitle:      { fontSize: 13, color: C.muted, marginTop: 3 },
  addButton:     { flexDirection: 'row', alignItems: 'center', backgroundColor: C.orange, borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 9, gap: 6 },
  addButtonText: { color: C.white, fontWeight: '700', fontSize: 13 },

  successBanner:   { flexDirection: 'row', alignItems: 'center', backgroundColor: C.successBg, borderWidth: 1, borderColor: C.success, borderRadius: 12, padding: 12, marginBottom: 16, gap: 8 },
  successText:     { color: C.success, fontSize: 13, fontWeight: '600' },
  errorBanner:     { flexDirection: 'row', alignItems: 'center', backgroundColor: C.errorBg, borderWidth: 1, borderColor: C.error, borderRadius: 12, padding: 12, marginBottom: 16, gap: 8 },
  errorBannerText: { color: C.error, fontSize: 13, fontWeight: '600' },

  sectionHeader:    { flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 14 },
  sectionIconBadge: { width: 28, height: 28, borderRadius: radius.sm, backgroundColor: C.orangeTint, borderWidth: 1, borderColor: C.orangeDim, alignItems: 'center', justifyContent: 'center' },
  sectionTitle:     { fontSize: 11, fontWeight: '700', color: C.muted, textTransform: 'uppercase', letterSpacing: 1.1 },

  emptyState:    { alignItems: 'center', paddingVertical: 56, gap: 12 },
  emptyTitle:    { fontSize: 17, fontWeight: '800', color: C.offWhite },
  emptySubtitle: { fontSize: 13, color: C.muted },

  card:       { backgroundColor: C.card, borderRadius: radius.lg, borderWidth: 1, borderColor: C.border, padding: 16, marginBottom: 12, gap: 12 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 14 },

  tableVisual: { width: 76, height: 76, alignItems: 'center', justifyContent: 'center' },
  tableCircle: {
    width: 52, height: 52, borderRadius: 26,
    borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
  },
  tableCircleNumber: { fontSize: 16, fontWeight: '900' },
  chairDotAbs: {
    position: 'absolute',
    width: 8, height: 8, borderRadius: 4,
  },

  cardTitle:   { fontSize: 15, fontWeight: '800', color: C.white },
  cardSub:     { fontSize: 11, color: C.muted, marginTop: 2 },
  cardActions: { flexDirection: 'row', gap: 6 },

  iconButtonEdit:   { padding: 8, borderRadius: 10, backgroundColor: C.orangeTint, borderWidth: 1, borderColor: C.orangeDim },
  iconButtonDelete: { padding: 8, borderRadius: 10, backgroundColor: C.errorBg,    borderWidth: 1, borderColor: '#7A1010' },

  statusBadge:    { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', borderRadius: radius.pill, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4 },
  statusBadgeDot: { width: 6, height: 6, borderRadius: 3 },
  statusText:     { fontSize: 10, fontWeight: '700' },

  pillRow:        { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill:           { backgroundColor: C.graphite, borderWidth: 1, borderColor: C.border, borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 8 },
  pillActive:     { backgroundColor: C.orange, borderColor: C.orange },
  pillText:       { fontSize: 12, fontWeight: '600', color: C.dim },
  pillTextActive: { color: C.white, fontWeight: '700' },

  orderBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: C.orange, borderRadius: radius.md, height: 44, marginTop: 4 },
  orderBtnText: { color: C.white, fontSize: 13, fontWeight: '800' },

  label:        { fontSize: 11, fontWeight: '700', color: C.muted, marginBottom: 6, marginTop: 14, textTransform: 'uppercase', letterSpacing: 1.1 },
  input:        { backgroundColor: C.graphite, borderWidth: 1, borderColor: C.border, borderRadius: radius.md, paddingHorizontal: 16, height: 52, fontSize: 15, color: C.white },
  inputFocused: { borderColor: C.orange, backgroundColor: C.steel },

  modalOverlay:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  modalContainer: { backgroundColor: C.charcoal, borderTopLeftRadius: 28, borderTopRightRadius: 28, borderTopWidth: 1, borderColor: C.border, padding: 24, maxHeight: '90%' },
  modalTitle:     { fontSize: 16, fontWeight: '900', color: C.white, letterSpacing: 0.3, marginBottom: 20 },

  modalButtons:         { flexDirection: 'row', gap: 12, marginTop: 24, marginBottom: 8 },
  cancelButton:         { flex: 1, backgroundColor: C.graphite, borderWidth: 1, borderColor: C.border, borderRadius: radius.md, height: 52, alignItems: 'center', justifyContent: 'center' },
  cancelButtonText:     { fontSize: 14, color: C.offWhite, fontWeight: '600' },
  submitButton:         { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.orange, borderRadius: radius.md, height: 54 },
  submitButtonDisabled: { opacity: 0.55 },
  submitButtonText:     { fontSize: 16, color: C.white, fontWeight: '800' },
})