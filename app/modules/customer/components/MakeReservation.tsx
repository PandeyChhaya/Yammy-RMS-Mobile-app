import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
    Calendar,
    CheckCircle,
    ChevronRight,
    Clock,
    Users,
    Warehouse,
} from 'lucide-react-native'
import { useState } from 'react'
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native'
import ReservationModal from '../../tables/components/ReservationModal'
import tableService from '../../tables/services/tableService'

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
const radius = { xs: 6, sm: 10, md: 14, lg: 18, xl: 24, pill: 100 }

const capacityLabel = (n: number) => {
  if (n <= 2)  return 'Couple'
  if (n <= 4)  return 'Small group'
  if (n <= 6)  return 'Medium group'
  return 'Large group'
}

function StepDots({ step }: { step: 1 | 2 | 3 }) {
  return (
    <View style={dot.row}>
      {([1, 2, 3] as const).map(s => (
        <View key={s} style={[dot.base, step >= s ? dot.active : dot.inactive]} />
      ))}
    </View>
  )
}
const dot = StyleSheet.create({
  row:      { flexDirection: 'row', gap: 6, alignItems: 'center' },
  base:     { height: 6, borderRadius: radius.pill },
  active:   { width: 20, backgroundColor: C.brass },
  inactive: { width: 6,  backgroundColor: C.vellum },
})

export default function MakeReservation() {
  const queryClient = useQueryClient()

  const [step,            setStep]            = useState<1 | 2 | 3>(1)
  const [selectedTableId, setSelectedTableId] = useState<number | null>(null)
  const [filterSize,      setFilterSize]      = useState<number | 'all'>('all')

  const { data: tables = [], isLoading } = useQuery({
    queryKey: ['tables'],
    queryFn:  tableService.getTable,
  })

  const availableTables = tables.filter(t => t.table_status === 'Available')

  const filteredTables = availableTables.filter(t =>
    filterSize === 'all' || t.capacity >= filterSize
  )

  const selectedTable = tables.find(t => t.table_id === selectedTableId) ?? null

  const handleTablePick = (tableId: number) => {
    setSelectedTableId(tableId)
    setStep(2)
  }

  const handleReservationCreated = () => {
    queryClient.invalidateQueries({ queryKey: ['tables'] })
    setStep(3)
  }

  const handleReset = () => {
    setSelectedTableId(null)
    setStep(1)
  }

  if (step === 3) {
    return (
      <View style={styles.container}>
        <View style={styles.successContainer}>
          <View style={styles.successIconRing}>
            <CheckCircle size={48} color={C.sage} />
          </View>
          <Text style={styles.successTitle}>You're all set!</Text>
          <Text style={styles.successSubtitle}>
            Your reservation has been confirmed. We look forward to seeing you.
          </Text>
          <View style={styles.successDivider} />
          <TouchableOpacity style={styles.newReservationBtn} onPress={handleReset}>
            <Text style={styles.newReservationBtnText}>Make another reservation</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={C.brass} />
        <Text style={styles.loadingText}>Finding available tables…</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Warehouse size={22} color={C.cream} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Reserve a Table</Text>
            <Text style={styles.headerSubtitle}>Choose your spot and book instantly</Text>
          </View>
          <StepDots step={step === 2 ? 2 : 1} />
        </View>

        <View style={styles.summaryRow}>
          <View style={styles.summaryChip}>
            <Calendar size={13} color={C.brass} />
            <Text style={styles.summaryChipText}>Today</Text>
          </View>
          <View style={styles.summaryChip}>
            <CheckCircle size={13} color={C.sage} />
            <Text style={styles.summaryChipText}>{availableTables.length} tables available</Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>Party size</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
          <View style={styles.filterRow}>
            {(['all', 2, 4, 6, 8] as const).map(size => (
              <TouchableOpacity
                key={size}
                style={[styles.filterPill, filterSize === size && styles.filterPillActive]}
                onPress={() => setFilterSize(size)}
                activeOpacity={0.8}
              >
                <Users size={11} color={filterSize === size ? C.cream : C.clay} />
                <Text style={[styles.filterPillText, filterSize === size && styles.filterPillTextActive]}>
                  {size === 'all' ? 'Any' : `${size}+`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <Text style={styles.sectionLabel}>Available tables</Text>

        {filteredTables.length === 0 ? (
          <View style={styles.emptyState}>
            <Clock size={40} color={C.vellum} />
            <Text style={styles.emptyTitle}>No tables available</Text>
            <Text style={styles.emptySubtitle}>Try a different party size or check back later</Text>
          </View>
        ) : (
          <View style={styles.tableGrid}>
            {filteredTables.map(table => (
              <TouchableOpacity
                key={table.table_id}
                style={styles.tableCard}
                onPress={() => handleTablePick(table.table_id)}
                activeOpacity={0.85}
              >

                <View style={styles.tableVisual}>
                  <View style={styles.tableCircle}>
                    <Text style={styles.tableNumber}>{table.table_number}</Text>
                  </View>
                  <View style={styles.chairsRow}>
                    {Array.from({ length: Math.min(table.capacity, 8) }).map((_, i) => (
                      <View key={i} style={styles.chairDot} />
                    ))}
                  </View>
                </View>

                <View style={styles.tableInfo}>
                  <Text style={styles.tableName}>Table {table.table_number}</Text>
                  <Text style={styles.tableFloor}>{table.floor}</Text>
                  <View style={styles.tableCapacityRow}>
                    <Users size={11} color={C.clay} />
                    <Text style={styles.tableCapacity}>Up to {table.capacity} · {capacityLabel(table.capacity)}</Text>
                  </View>
                </View>

                <ChevronRight size={16} color={C.latte} />
              </TouchableOpacity>
            ))}
          </View>
        )}

      </ScrollView>

      {selectedTable && (
        <ReservationModal
          table={selectedTable}
          isOpen={step === 2}
          onClose={() => { setStep(1); setSelectedTableId(null) }}
          onReservationCreated={handleReservationCreated}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.cream },
  content:   { padding: 16, paddingTop: 52, paddingBottom: 40 },
  centered:  { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },

  loadingText: { fontSize: 14, color: C.clay },

  header:          { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  headerIcon:      { width: 46, height: 46, borderRadius: radius.md, backgroundColor: C.brass, alignItems: 'center', justifyContent: 'center' },
  headerTitle:     { fontSize: 20, fontWeight: '900', color: C.espresso },
  headerSubtitle:  { fontSize: 12, color: C.clay, marginTop: 2 },

  summaryRow:      { flexDirection: 'row', gap: 8, marginBottom: 24 },
  summaryChip:     { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: C.parchment, borderWidth: 1.5, borderColor: C.vellum, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 6 },
  summaryChipText: { fontSize: 12, fontWeight: '600', color: C.clay },

  sectionLabel: { fontSize: 11, fontWeight: '800', color: C.clay, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 10 },

  filterRow:             { flexDirection: 'row', gap: 8, paddingBottom: 2 },
  filterPill:            { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: C.parchment, borderWidth: 1.5, borderColor: C.vellum, borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 8 },
  filterPillActive:      { backgroundColor: C.roast, borderColor: C.roast },
  filterPillText:        { fontSize: 12, fontWeight: '600', color: C.clay },
  filterPillTextActive:  { color: C.cream },

  emptyState:    { alignItems: 'center', paddingVertical: 48, gap: 10 },
  emptyTitle:    { fontSize: 16, fontWeight: '800', color: C.espresso },
  emptySubtitle: { fontSize: 13, color: C.clay, textAlign: 'center' },

  tableGrid: { gap: 10 },
  tableCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.parchment,
    borderWidth: 1.5,
    borderColor: C.vellum,
    borderRadius: radius.md,
    padding: 14,
    gap: 14,
  },

  tableVisual:  { alignItems: 'center', gap: 6 },
  tableCircle:  { width: 44, height: 44, borderRadius: 22, backgroundColor: C.brassLight, borderWidth: 1.5, borderColor: C.brassBorder, alignItems: 'center', justifyContent: 'center' },
  tableNumber:  { fontSize: 15, fontWeight: '900', color: C.brass },
  chairsRow:    { flexDirection: 'row', gap: 3 },
  chairDot:     { width: 5, height: 5, borderRadius: 3, backgroundColor: C.vellum },

  tableInfo:          { flex: 1, gap: 3 },
  tableName:          { fontSize: 15, fontWeight: '800', color: C.espresso },
  tableFloor:         { fontSize: 12, color: C.clay },
  tableCapacityRow:   { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  tableCapacity:      { fontSize: 11, color: C.clay, fontWeight: '500' },

  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 16,
  },
  successIconRing: {
    width: 96, height: 96,
    borderRadius: 48,
    backgroundColor: C.sageLight,
    borderWidth: 2, borderColor: C.sageBorder,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 8,
  },
  successTitle:    { fontSize: 26, fontWeight: '900', color: C.espresso, textAlign: 'center' },
  successSubtitle: { fontSize: 14, color: C.clay, textAlign: 'center', lineHeight: 22 },
  successDivider:  { width: 40, height: 2, backgroundColor: C.vellum, borderRadius: radius.pill, marginVertical: 8 },
  newReservationBtn: {
    borderWidth: 1.5, borderColor: C.brassBorder,
    borderRadius: radius.pill,
    paddingHorizontal: 24, paddingVertical: 12,
    backgroundColor: C.brassLight,
    marginTop: 8,
  },
  newReservationBtnText: { fontSize: 14, fontWeight: '700', color: C.brass },
})
