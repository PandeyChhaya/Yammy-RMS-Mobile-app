import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { TableData } from '../types/tables'

const C = {
  espresso:    '#1C1008',
  clay:        '#7A4528',
  latte:       '#C8956A',
  cream:       '#FDF6EC',
  parchment:   '#F5E9D4',
  vellum:      '#EDD9BC',
  brass:       '#B5822A',
  sage:        '#3B6E52',
  sageLight:   '#EBF4EE',
  sageBorder:  '#9FCFB4',
  terracotta:  '#A03020',
  tcLight:     '#FAECEA',
  amber:       '#D97706',
  amberLight:  '#FEF3C7',
  violet:      '#7C3AED',
  violetLight: '#EDE9FE',
  sky:         '#0284C7',
  skyLight:    '#E0F2FE',
}
const radius = { xs: 6, sm: 10, md: 14, pill: 100 }

const STATUS_CONFIG: Record<
  TableData['table_status'],
  { label: string; bg: string; text: string; border: string }
> = {
  Available:   { label: 'Available',   bg: C.sageLight,   text: C.sage,       border: C.sageBorder },
  Occupied:    { label: 'Occupied',    bg: C.amberLight,  text: C.amber,      border: C.amber      },
  Reserved:    { label: 'Reserved',    bg: C.violetLight, text: C.violet,     border: C.violet     },
  Maintenance: { label: 'Maintenance', bg: C.skyLight,    text: C.sky,        border: C.sky        },
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
    backgroundColor: C.parchment,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: C.vellum,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardSelected: {
    backgroundColor: C.sageLight,
    borderColor: C.sage,
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
    color: C.clay,
  },
  capacitySelected: {
    color: C.sage,
  },

  tableNumber: {
    fontSize: 20,
    fontWeight: '900',
    color: C.espresso,
  },
  tableNumberSelected: {
    color: C.sage,
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
    backgroundColor: C.sage,
    borderColor: C.sage,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '800',
  },
  statusTextSelected: {
    color: C.cream,
  },
  reservationTime: {
    fontSize: 9,
    fontWeight: '700',
    color: C.violet,
  },
  reservationTimeSelected: {
    color: C.sage,
  },

  selectionDot: {
    position: 'absolute',
    top: 5,
    left: 5,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.sage,
  },
})
