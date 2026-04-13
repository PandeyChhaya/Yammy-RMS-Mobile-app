import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
    AlertCircle,
    Calendar,
    CheckCircle,
    CreditCard,
    Edit,
    Plus,
    Settings,
    Trash2,
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
import { CreateTableRequest, TableData } from '../pos/types/tables'
import ReservationsCalendar from './components/ReservationCalender'
import ReservationModal from './components/ReservationModal'
import reservationService from './services/reservationService'
import tableService from './services/tableService'

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

const DEFAULT_FORM: CreateTableRequest = {
  table_number: '',
  floor:        'Ground Floor',
  capacity:     4,
}

const STATUS_CONFIG: Record<TableData['table_status'], { label: string; bg: string; border: string; text: string; dot: string }> = {
  Available:   { label: 'Available',   bg: C.sageLight,  border: C.sageBorder,  text: C.sage,       dot: C.sage       },
  Occupied:    { label: 'Occupied',    bg: C.brassLight, border: C.brassBorder, text: C.brass,      dot: C.brass      },
  Reserved:    { label: 'Reserved',    bg: C.tcLight,    border: C.tcBorder,    text: C.terracotta, dot: C.terracotta },
  Maintenance: { label: 'Maintenance', bg: C.parchment,  border: C.vellum,      text: C.clay,       dot: C.clay       },
}

const CAPACITY_OPTIONS = [2, 4, 6, 8, 10, 12]

export default function Tables() {
  const queryClient = useQueryClient()

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

  const { data: tables = [], isLoading, error } = useQuery<TableData[]>({
    queryKey: ['tables'],
    queryFn:  () => tableService.getTable(),
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
      setReservations(data.filter((r: ReservationWithTable) => r.reservation_status !== 'cancelled'))
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
          status === 'seated'    ? 'Occupied' : 'Reserved'
        updateStatusMutation.mutate({ id: Number(reservation.table_id), status: tableStatus })
      }
      showSuccess('Reservation status updated!')
      loadReservations(selectedDate)
    } catch {
      showError('Error updating reservation status')
    }
  }

  useEffect(() => { loadReservations(selectedDate) }, [selectedDate])

  const renderForm = (
    form: CreateTableRequest,
    setForm: (f: CreateTableRequest) => void,
    onSubmit: () => void,
    onCancel: () => void,
    isPending: boolean,
    submitLabel: string,
  ) => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <Text style={styles.label}>Table Number *</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. T1"
        placeholderTextColor={C.latte}
        value={form.table_number}
        onChangeText={v => setForm({ ...form, table_number: v })}
      />

      <Text style={styles.label}>Floor</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Ground Floor"
        placeholderTextColor={C.latte}
        value={form.floor}
        onChangeText={v => setForm({ ...form, floor: v })}
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
          {isPending && <ActivityIndicator size="small" color={C.cream} />}
          <Text style={styles.submitButtonText}>
            {isPending ? 'Saving…' : submitLabel}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={C.brass} />
        <Text style={styles.loadingText}>Loading tables…</Text>
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

        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Table Management</Text>
            <Text style={styles.subtitle}>Table plan and status</Text>
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => { setAddForm(DEFAULT_FORM); setShowAddModal(true) }}
          >
            <Plus size={16} color={C.cream} />
            <Text style={styles.addButtonText}>Add Table</Text>
          </TouchableOpacity>
        </View>

        {showSuccessMessage && (
          <View style={styles.successBanner}>
            <CheckCircle size={16} color={C.sage} />
            <Text style={styles.successText}>{showSuccessMessage}</Text>
          </View>
        )}

        {showErrorMessage && (
          <View style={styles.errorBanner}>
            <AlertCircle size={16} color={C.terracotta} />
            <Text style={styles.errorBannerText}>{showErrorMessage}</Text>
          </View>
        )}

        <View style={styles.sectionHeader}>
          <View style={styles.sectionIconBadge}>
            <Calendar size={14} color={C.brass} />
          </View>
          <Text style={styles.sectionTitle}>Planning</Text>
        </View>

        {isLoadingReservations ? (
          <View style={{ alignItems: 'center', paddingVertical: 24 }}>
            <ActivityIndicator size="small" color={C.brass} />
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

        <View style={[styles.sectionHeader, { marginTop: 24 }]}>
          <View style={styles.sectionIconBadge}>
            <Settings size={14} color={C.brass} />
          </View>
          <Text style={styles.sectionTitle}>Tables ({tables.length})</Text>
        </View>

        {tables.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No Tables</Text>
            <Text style={styles.emptySubtitle}>Start by creating your first table</Text>
            <TouchableOpacity style={styles.addButton} onPress={() => setShowAddModal(true)}>
              <Plus size={16} color={C.cream} />
              <Text style={styles.addButtonText}>Create Table</Text>
            </TouchableOpacity>
          </View>
        ) : (
          tables.map((table) => {
            const cfg = STATUS_CONFIG[table.table_status] ?? STATUS_CONFIG.Available
            return (
              <View key={table.table_id} style={[styles.card, { borderColor: cfg.border }]}>

                <View style={styles.cardHeader}>
                  <View style={styles.cardTitleRow}>
                    <View style={[styles.statusDot, { backgroundColor: cfg.dot }]} />
                    <View>
                      <Text style={styles.cardTitle}>Table {table.table_number}</Text>
                      <Text style={styles.cardSub}>Floor {table.floor} · 👥 {table.capacity} seats</Text>
                    </View>
                  </View>
                  <View style={styles.cardActions}>
                    <TouchableOpacity style={styles.iconButton} onPress={() => handleEdit(table)}>
                      <Edit size={14} color={C.brass} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.iconButton, styles.iconButtonDelete]}
                      onPress={() => handleDelete(table.table_id, table.table_number)}
                    >
                      <Trash2 size={14} color={C.terracotta} />
                    </TouchableOpacity>
                  </View>
                </View>


                <View style={[styles.statusBadge, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
                  <Text style={[styles.statusText, { color: cfg.text }]}>{cfg.label}</Text>
                </View>

                <Text style={styles.label}>Change Status:</Text>
                <View style={styles.pillRow}>
                  {(Object.keys(STATUS_CONFIG) as TableData['table_status'][]).map((key) => {
                    const config = STATUS_CONFIG[key]
                    return (
                      <TouchableOpacity
                        key={key}
                        style={[
                          styles.pill,
                          table.table_status === key && { backgroundColor: config.bg, borderColor: config.border },
                        ]}
                        onPress={() => handleStatusChange(table, key)}
                        disabled={table.table_status === key || updateStatusMutation.isPending}
                        activeOpacity={0.8}
                      >
                        <Text style={[
                          styles.pillText,
                          table.table_status === key && { color: config.text },
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
                  onPress={() => console.log('Take order for table:', table.table_id)}
                >
                  <CreditCard size={14} color={C.cream} />
                  <Text style={styles.orderBtnText}>Take Order</Text>
                </TouchableOpacity>
              </View>
            )
          })
        )}
      </ScrollView>

      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>New Table</Text>
            {renderForm(addForm, setAddForm, handleAddSubmit, () => setShowAddModal(false), createMutation.isPending, 'Create')}
          </View>
        </View>
      </Modal>

      <Modal visible={showEditModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Edit Table</Text>
            {renderForm(editForm, setEditForm, handleEditSubmit, () => { setShowEditModal(false); setEditingTable(null) }, updateMutation.isPending, 'Update')}
          </View>
        </View>
      </Modal>

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
  container:   { flex: 1, backgroundColor: C.cream },
  content:     { padding: 16, paddingTop: 52, paddingBottom: 32 },
  centered:    { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  loadingText: { fontSize: 14, color: C.clay },
  errorTitle:  { fontSize: 16, fontWeight: '700', color: C.terracotta },
  errorSub:    { fontSize: 13, color: C.clay },

  header:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  title:         { fontSize: 22, fontWeight: '900', color: C.espresso },
  subtitle:      { fontSize: 13, color: C.clay, marginTop: 3 },

  addButton:     { flexDirection: 'row', alignItems: 'center', backgroundColor: C.brass, borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 9, gap: 6 },
  addButtonText: { color: C.cream, fontWeight: '700', fontSize: 13 },

  successBanner:   { flexDirection: 'row', alignItems: 'center', backgroundColor: C.sageLight, borderWidth: 1, borderColor: C.sageBorder, borderRadius: radius.md, padding: 12, marginBottom: 16, gap: 8 },
  successText:     { color: C.sage, fontSize: 13, fontWeight: '600' },
  errorBanner:     { flexDirection: 'row', alignItems: 'center', backgroundColor: C.tcLight, borderWidth: 1, borderColor: C.tcBorder, borderRadius: radius.md, padding: 12, marginBottom: 16, gap: 8 },
  errorBannerText: { color: C.terracotta, fontSize: 13, fontWeight: '600' },

  sectionHeader:    { flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 14 },
  sectionIconBadge: { width: 28, height: 28, borderRadius: radius.sm, backgroundColor: C.brassLight, borderWidth: 1, borderColor: C.brassBorder, alignItems: 'center', justifyContent: 'center' },
  sectionTitle:     { fontSize: 11, fontWeight: '800', color: C.clay, textTransform: 'uppercase', letterSpacing: 1.4 },

  emptyState:    { alignItems: 'center', paddingVertical: 56, gap: 12 },
  emptyTitle:    { fontSize: 17, fontWeight: '800', color: C.espresso },
  emptySubtitle: { fontSize: 13, color: C.clay },

  card:         { backgroundColor: C.parchment, borderRadius: radius.md, borderWidth: 1.5, padding: 14, marginBottom: 12, gap: 10 },
  cardHeader:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  statusDot:    { width: 10, height: 10, borderRadius: 5 },
  cardTitle:    { fontSize: 15, fontWeight: '800', color: C.espresso },
  cardSub:      { fontSize: 11, color: C.clay, marginTop: 2 },
  cardActions:  { flexDirection: 'row', gap: 6 },

  iconButton:       { padding: 7, borderRadius: radius.xs, backgroundColor: C.brassLight, borderWidth: 1, borderColor: C.brassBorder },
  iconButtonDelete: { backgroundColor: C.tcLight, borderColor: C.tcBorder },

  statusBadge: { alignSelf: 'flex-start', borderRadius: radius.pill, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4 },
  statusText:  { fontSize: 10, fontWeight: '700' },

  pillRow:        { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill:           { backgroundColor: C.cream, borderWidth: 1.5, borderColor: C.vellum, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 6 },
  pillActive:     { backgroundColor: C.roast, borderColor: C.roast },
  pillText:       { fontSize: 12, fontWeight: '600', color: C.clay },
  pillTextActive: { color: C.cream },

  orderBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: C.roast, borderRadius: radius.md, paddingVertical: 10, marginTop: 4 },
  orderBtnText: { color: C.cream, fontSize: 13, fontWeight: '700' },

  label: { fontSize: 11, fontWeight: '800', color: C.clay, marginBottom: 6, marginTop: 14, textTransform: 'uppercase', letterSpacing: 1.2 },
  input: { borderWidth: 1.5, borderColor: C.vellum, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: C.espresso, backgroundColor: C.cream },

  modalOverlay:   { flex: 1, backgroundColor: 'rgba(28,16,8,0.6)', justifyContent: 'flex-end' },
  modalContainer: { backgroundColor: C.parchment, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, borderWidth: 1.5, borderColor: C.vellum, padding: 24, maxHeight: '90%' },
  modalTitle:     { fontSize: 16, fontWeight: '900', color: C.espresso, letterSpacing: 0.3, marginBottom: 20 },

  modalButtons:         { flexDirection: 'row', gap: 12, marginTop: 24, marginBottom: 8 },
  cancelButton:         { flex: 1, borderWidth: 1.5, borderColor: C.vellum, borderRadius: radius.pill, paddingVertical: 12, alignItems: 'center', backgroundColor: C.cream },
  cancelButtonText:     { fontSize: 14, color: C.clay, fontWeight: '700' },
  submitButton:         { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.brass, borderRadius: radius.pill, paddingVertical: 12 },
  submitButtonDisabled: { opacity: 0.5 },
  submitButtonText:     { fontSize: 14, color: C.cream, fontWeight: '800' },
})
