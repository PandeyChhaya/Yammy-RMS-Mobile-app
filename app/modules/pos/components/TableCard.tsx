import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { TableData } from '../types/tables'

const C = {
  background: '#0A0A0A',
  surface: '#1A1A1A',
  surfaceHighlight: '#2C2C2C',
  primary: '#FF6B2C',
  primaryDim: '#3D1C00',
  textMain: '#FFFFFF',
  textMuted: '#9CA3AF',
  border: '#2C2C2C',
  danger: '#EF4444',
  dangerDim: '#450A0A',
  success: '#10B981',
  successDim: '#064E3B',
  warning: '#F59E0B',
  warningDim: '#3A2500',
  info: '#3B82F6',
  infoDim: '#1E1B4B',
}
const radius = { xs: 6, sm: 10, md: 14, pill: 100 }

const STATUS_CONFIG: Record<
  TableData['table_status'],
  { label: string; bg: string; text: string; border: string }
> = {
  Available:   { label: 'Available',   bg: C.successDim,   text: C.success,   border: C.success },
  Occupied:    { label: 'Occupied',    bg: C.warningDim,   text: C.warning,   border: C.warning },
  Reserved:    { label: 'Reserved',    bg: C.infoDim,      text: C.info,      border: C.info    },
  Maintenance: { label: 'Maintenance', bg: C.dangerDim,    text: C.danger,    border: C.danger  },
}

interface TableCardProps {
  table: TableData
  isSelected: boolean
  onSelect: (table: TableData | null) => void
  reservationTime?: string
}

export default function TableCard({
  table,
  isSelected,
  onSelect,
  reservationTime,
}: TableCardProps) {
  const cfg = STATUS_CONFIG[table.table_status] ?? STATUS_CONFIG.Available

  return (
    <TouchableOpacity
      style={[
        styles.card,
        isSelected && styles.cardSelected,
        !table.is_active && styles.cardInactive,
      ]}
      onPress={() => onSelect(isSelected ? null : table)}
      activeOpacity={0.75}
    >
      <View style={styles.topRow}>
        <View />
        {table.capacity > 0 && (
          <Text style={[styles.capacity, isSelected && styles.capacitySelected]}>
            {table.capacity}p
          </Text>
        )}
      </View>

      <Text style={[styles.tableNumber, isSelected && styles.tableNumberSelected]}>
        {table.table_number}
      </Text>

      <View style={styles.bottomBlock}>
        <View style={[
          styles.statusBadge,
          isSelected
            ? styles.statusBadgeSelected
            : { backgroundColor: cfg.bg, borderColor: cfg.border },
        ]}>
          <Text style={[
            styles.statusText,
            isSelected ? styles.statusTextSelected : { color: cfg.text },
          ]}>
            {cfg.label}
          </Text>
        </View>

        {table.table_status === 'Reserved' && reservationTime && (
          <Text style={[styles.reservationTime, isSelected && styles.reservationTimeSelected]}>
            {reservationTime}
          </Text>
        )}
      </View>

      {isSelected && (
        <View style={styles.selectionDot} />
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    width: 88,
    height: 88,
    backgroundColor: C.surface,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: C.border,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardSelected: {
    backgroundColor: C.primaryDim,
    borderColor: C.primary,
    borderWidth: 2,
  },
  cardInactive: {
    opacity: 0.45,
  },

  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  capacity: {
    fontSize: 10,
    fontWeight: '700',
    color: C.textMuted,
  },
  capacitySelected: {
    color: C.primary,
  },

  tableNumber: {
    fontSize: 20,
    fontWeight: '900',
    color: C.textMain,
  },
  tableNumberSelected: {
    color: C.primary,
  },

  bottomBlock: {
    alignItems: 'center',
    gap: 3,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  statusBadgeSelected: {
    backgroundColor: C.primary,
    borderColor: C.primary,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '800',
  },
  statusTextSelected: {
    color: C.textMain,
  },
  reservationTime: {
    fontSize: 9,
    fontWeight: '700',
    color: C.info,
  },
  reservationTimeSelected: {
    color: C.primary,
  },

  selectionDot: {
    position: 'absolute',
    top: 5,
    left: 5,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.primary,
  },
})