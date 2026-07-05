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
import { corner, palette } from '../../shared/theme'
import ReservationModal from '../../tables/components/ReservationModal'
import tableService from '../../tables/services/tableService'

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
  base:     { height: 6, borderRadius: corner.pill },
  active:   { width: 20, backgroundColor: palette.orange },
  inactive: { width: 6,  backgroundColor: palette.graphite },
})

export default function MakeReservation() {
  const queryClient = useQueryClient()

  const [step,            setStep]            = useState<1 | 2 | 3>(1)
  const [selectedTableId, setSelectedTableId] = useState<number | null>(null)
  const [filterSize,      setFilterSize]      = useState<number | 'all'>('all')

 const { data: tables = [], isLoading } = useQuery({
  queryKey: ['tables'],
  queryFn:  () => tableService.getTable(),
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
            <CheckCircle size={48} color={palette.success} />
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
        <ActivityIndicator size="large" color={palette.orange} />
        <Text style={styles.loadingText}>Finding available tables…</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Warehouse size={22} color={palette.white} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Reserve a Table</Text>
            <Text style={styles.headerSubtitle}>Choose your spot and book instantly</Text>
          </View>
          <StepDots step={step === 2 ? 2 : 1} />
        </View>

        <View style={styles.summaryRow}>
          <View style={styles.summaryChip}>
            <Calendar size={13} color={palette.orange} />
            <Text style={styles.summaryChipText}>Today</Text>
          </View>
          <View style={styles.summaryChip}>
            <CheckCircle size={13} color={palette.success} />
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
                <Users size={11} color={filterSize === size ? palette.white : palette.muted} />
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
            <Clock size={40} color={palette.graphite} />
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
                    <Users size={11} color={palette.muted} />
                    <Text style={styles.tableCapacity}>Up to {table.capacity} · {capacityLabel(table.capacity)}</Text>
                  </View>
                </View>

                <ChevronRight size={16} color={palette.dim} />
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
  container: { flex: 1, backgroundColor: palette.black },
  content:   { padding: 16, paddingTop: 52, paddingBottom: 40 },
  centered:  { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: palette.black },

  loadingText: { fontSize: 14, color: palette.muted },

  header:          { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  headerIcon:      { width: 46, height: 46, borderRadius: corner.md, backgroundColor: palette.orange, alignItems: 'center', justifyContent: 'center' },
  headerTitle:     { fontSize: 20, fontWeight: '900', color: palette.white },
  headerSubtitle:  { fontSize: 12, color: palette.muted, marginTop: 2 },

  summaryRow:      { flexDirection: 'row', gap: 8, marginBottom: 24 },
  summaryChip:     { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: palette.card, borderWidth: 1.5, borderColor: palette.border, borderRadius: corner.pill, paddingHorizontal: 12, paddingVertical: 6 },
  summaryChipText: { fontSize: 12, fontWeight: '600', color: palette.muted },

  sectionLabel: { fontSize: 11, fontWeight: '800', color: palette.muted, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 10 },

  filterRow:             { flexDirection: 'row', gap: 8, paddingBottom: 2 },
  filterPill:            { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: palette.card, borderWidth: 1.5, borderColor: palette.border, borderRadius: corner.pill, paddingHorizontal: 14, paddingVertical: 8 },
  filterPillActive:      { backgroundColor: palette.orange, borderColor: palette.orange },
  filterPillText:        { fontSize: 12, fontWeight: '600', color: palette.muted },
  filterPillTextActive:  { color: palette.white },

  emptyState:    { alignItems: 'center', paddingVertical: 48, gap: 10 },
  emptyTitle:    { fontSize: 16, fontWeight: '800', color: palette.white },
  emptySubtitle: { fontSize: 13, color: palette.muted, textAlign: 'center' },

  tableGrid: { gap: 10 },
  tableCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.card,
    borderWidth: 1.5,
    borderColor: palette.border,
    borderRadius: corner.md,
    padding: 14,
    gap: 14,
  },

  tableVisual:  { alignItems: 'center', gap: 6 },
  tableCircle:  { width: 44, height: 44, borderRadius: 22, backgroundColor: palette.orangeTint, borderWidth: 1.5, borderColor: palette.orangeDim, alignItems: 'center', justifyContent: 'center' },
  tableNumber:  { fontSize: 15, fontWeight: '900', color: palette.orange },
  chairsRow:    { flexDirection: 'row', gap: 3 },
  chairDot:     { width: 5, height: 5, borderRadius: 3, backgroundColor: palette.border },

  tableInfo:          { flex: 1, gap: 3 },
  tableName:          { fontSize: 15, fontWeight: '800', color: palette.white },
  tableFloor:         { fontSize: 12, color: palette.muted },
  tableCapacityRow:   { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  tableCapacity:      { fontSize: 11, color: palette.muted, fontWeight: '500' },

  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 16,
    backgroundColor: palette.black,
  },
  successIconRing: {
    width: 96, height: 96,
    borderRadius: 48,
    backgroundColor: palette.successBg,
    borderWidth: 2, borderColor: palette.success,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 8,
  },
  successTitle:    { fontSize: 26, fontWeight: '900', color: palette.white, textAlign: 'center' },
  successSubtitle: { fontSize: 14, color: palette.muted, textAlign: 'center', lineHeight: 22 },
  successDivider:  { width: 40, height: 2, backgroundColor: palette.border, borderRadius: corner.pill, marginVertical: 8 },
  newReservationBtn: {
    borderWidth: 1.5, borderColor: palette.orangeDim,
    borderRadius: corner.pill,
    paddingHorizontal: 24, paddingVertical: 12,
    backgroundColor: palette.orangeTint,
    marginTop: 8,
  },
  newReservationBtnText: { fontSize: 14, fontWeight: '700', color: palette.orange },
})