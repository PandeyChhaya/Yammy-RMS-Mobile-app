import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { TableData, TableStatus } from '../types/tables'

interface TableCardProps {
  table: TableData
  isSelected: boolean
  onSelect: (table: TableData) => void
  statusConfig: { [key: string]: TableStatus }
}

export default function TableCard({
  table,
  isSelected,
  onSelect,
  statusConfig
}: TableCardProps) {
  const status = statusConfig[table.status]
  const StatusIcon = status.icon

  return (
    <TouchableOpacity
      onPress={() => onSelect(table)}
      style={[
        styles.container,
        isSelected ? styles.containerSelected : styles.containerDefault
      ]}
    >
      <View style={styles.content}>
        <Text style={styles.number}>{table.number}</Text>
        <View style={styles.statusRow}>
          <StatusIcon size={12} color={status.iconColor || '#4B5563'} />
          <View style={[styles.statusBadge, { backgroundColor: status.bgColor }]}>
            <Text style={[styles.statusText, { color: status.textColor }]}>
              {status.label}
            </Text>
          </View>
        </View>
        <Text style={styles.capacity}>{table.capacity} seats</Text>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
  },
  containerSelected: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
    transform: [{ scale: 1.05 }],
  },
  containerDefault: {
    borderColor: '#D1D5DB',
    backgroundColor: '#F9FAFB',
  },
  content: {
    alignItems: 'center',
  },
  number: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 4,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '500',
  },
  capacity: {
    fontSize: 10,
    color: '#6B7280',
  },
})