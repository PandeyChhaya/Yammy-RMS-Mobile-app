// tableCard.tsx
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { TableData } from '../types/tables'

<<<<<<< HEAD
const palette = {
  bg: '#0A0A0A',
  card: '#1A1A1A',
  brand: '#FF6B2C',
  brandBg: '#3D1C00',
  text: '#FFFFFF',
  textDim: '#9CA3AF',
  border: '#2C2C2C',
  red: '#EF4444',
  redBg: '#450A0A',
  green: '#10B981',
  greenBg: '#064E3B',
  amber: '#F59E0B',
  amberBg: '#3A2500',
  blue: '#3B82F6',
  blueBg: '#1E1B4B',
=======
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
>>>>>>> fd20a81b224afa5355ca1b5411890875e84fd8e4
}

<<<<<<< HEAD
const corner = { xs: 6, sm: 10, md: 14, pill: 100 }

function statusStyle(status: TableData['table_status']) {
  switch (status) {
    case 'Occupied':
      return { label: 'Occupied', bg: palette.amberBg, text: palette.amber, border: palette.amber }
    case 'Reserved':
      return { label: 'Reserved', bg: palette.blueBg, text: palette.blue, border: palette.blue }
    case 'Maintenance':
      return { label: 'Maintenance', bg: palette.redBg, text: palette.red, border: palette.red }
    case 'Available':
    default:
      return { label: 'Available', bg: palette.greenBg, text: palette.green, border: palette.green }
  }
=======
const STATUS_CONFIG: Record<
  TableData['table_status'],
  { label: string; bg: string; text: string; border: string }
> = {
  Available:   { label: 'Available',   bg: C.successDim,   text: C.success,   border: C.success },
  Occupied:    { label: 'Occupied',    bg: C.warningDim,   text: C.warning,   border: C.warning },
  Reserved:    { label: 'Reserved',    bg: C.infoDim,      text: C.info,      border: C.info    },
  Maintenance: { label: 'Maintenance', bg: C.dangerDim,    text: C.danger,    border: C.danger  },
>>>>>>> fd20a81b224afa5355ca1b5411890875e84fd8e4
}

interface TableCardProps {
  table: TableData
  isSelected: boolean
  onSelect: (table: TableData | null) => void
  reservationTime?: string
}

<<<<<<< HEAD
export default function TableCard(props: TableCardProps) {
  const { table, isSelected, onSelect, reservationTime } = props
  const status = statusStyle(table.table_status)

  function handlePress() {
    onSelect(isSelected ? null : table)
  }
=======
export default function TableCard({
  table,
  isSelected,
  onSelect,
  reservationTime,
}: TableCardProps) {
  const cfg = STATUS_CONFIG[table.table_status] ?? STATUS_CONFIG.Available
>>>>>>> fd20a81b224afa5355ca1b5411890875e84fd8e4

  return (
    <TouchableOpacity
      style={[styles.card, isSelected && styles.cardSelected, !table.is_active && styles.cardInactive]}
      onPress={handlePress}
      activeOpacity={0.75}
    >
      <View style={styles.topRow}>
        <View />
        {table.capacity > 0 ? (
          <Text style={[styles.capacity, isSelected && styles.capacitySelected]}>
            {table.capacity}p
          </Text>
        ) : null}
      </View>

      <Text style={[styles.tableNumber, isSelected && styles.tableNumberSelected]}>
        {table.table_number}
      </Text>

      <View style={styles.bottomBlock}>
        <View
          style={[
            styles.statusBadge,
            isSelected ? styles.statusBadgeSelected : { backgroundColor: status.bg, borderColor: status.border },
          ]}
        >
          <Text style={[styles.statusText, isSelected ? styles.statusTextSelected : { color: status.text }]}>
            {status.label}
          </Text>
        </View>

        {table.table_status === 'Reserved' && reservationTime ? (
          <Text style={[styles.reservationTime, isSelected && styles.reservationTimeSelected]}>
            {reservationTime}
          </Text>
        ) : null}
      </View>

      {isSelected ? <View style={styles.selectionDot} /> : null}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    width: 88,
    height: 88,
<<<<<<< HEAD
    backgroundColor: palette.card,
    borderRadius: corner.md,
    borderWidth: 1.5,
    borderColor: palette.border,
=======
    backgroundColor: C.surface,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: C.border,
>>>>>>> fd20a81b224afa5355ca1b5411890875e84fd8e4
    padding: 8,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardSelected: {
<<<<<<< HEAD
    backgroundColor: palette.brandBg,
    borderColor: palette.brand,
=======
    backgroundColor: C.primaryDim,
    borderColor: C.primary,
>>>>>>> fd20a81b224afa5355ca1b5411890875e84fd8e4
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
<<<<<<< HEAD
    color: palette.textDim,
  },
  capacitySelected: {
    color: palette.brand,
=======
    color: C.textMuted,
  },
  capacitySelected: {
    color: C.primary,
>>>>>>> fd20a81b224afa5355ca1b5411890875e84fd8e4
  },
  tableNumber: {
    fontSize: 20,
    fontWeight: '900',
<<<<<<< HEAD
    color: palette.text,
  },
  tableNumberSelected: {
    color: palette.brand,
=======
    color: C.textMain,
  },
  tableNumberSelected: {
    color: C.primary,
>>>>>>> fd20a81b224afa5355ca1b5411890875e84fd8e4
  },
  bottomBlock: {
    alignItems: 'center',
    gap: 3,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: corner.pill,
    borderWidth: 1,
  },
  statusBadgeSelected: {
<<<<<<< HEAD
    backgroundColor: palette.brand,
    borderColor: palette.brand,
=======
    backgroundColor: C.primary,
    borderColor: C.primary,
>>>>>>> fd20a81b224afa5355ca1b5411890875e84fd8e4
  },
  statusText: {
    fontSize: 9,
    fontWeight: '800',
  },
  statusTextSelected: {
<<<<<<< HEAD
    color: palette.text,
=======
    color: C.textMain,
>>>>>>> fd20a81b224afa5355ca1b5411890875e84fd8e4
  },
  reservationTime: {
    fontSize: 9,
    fontWeight: '700',
<<<<<<< HEAD
    color: palette.blue,
  },
  reservationTimeSelected: {
    color: palette.brand,
=======
    color: C.info,
  },
  reservationTimeSelected: {
    color: C.primary,
>>>>>>> fd20a81b224afa5355ca1b5411890875e84fd8e4
  },
  selectionDot: {
    position: 'absolute',
    top: 5,
    left: 5,
    width: 8,
    height: 8,
    borderRadius: 4,
<<<<<<< HEAD
    backgroundColor: palette.brand,
=======
    backgroundColor: C.primary,
>>>>>>> fd20a81b224afa5355ca1b5411890875e84fd8e4
  },
})