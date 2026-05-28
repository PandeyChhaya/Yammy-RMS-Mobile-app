import { Receipt, Table2 } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  ScrollView, StyleSheet,
  Text, TouchableOpacity,
  View,
} from 'react-native'
import reservationService from '../../reservation/services/reservationService'
import { TableData } from '../types/tables'
import TableCard from './tableCard'

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

interface TablesSectionProps {
  tables: TableData[]
  selectedTable: TableData | null
  onTableSelect: (table: TableData | null) => void
}

export default function TablesSection({
  tables,
  selectedTable,
  onTableSelect,
}: TablesSectionProps) {
  const [reservations, setReservations] = useState<Map<number, string>>(new Map())
  const [loading, setLoading]           = useState(false)

  useEffect(() => {
    const fetchReservations = async () => {
      try {
        setLoading(true)
        const today = new Date().toISOString().split('T')[0]
        const todayReservations = await reservationService.getReservationsWithTableInfo(today)

        const map = new Map<number, string>()
        todayReservations
          .filter((r: any) => r.status === 'confirmed' && r.table_id)
          .forEach((r: any) => {
            const time = String(r.reservation_time).substring(0, 5)
            map.set(r.table_id, time)
          })

        setReservations(map)
      } catch (err) {
        console.error('Error fetching reservations:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchReservations()
  }, [])

  const isDirectSale = selectedTable === null

  return (
    <View style={styles.container}>

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Table2 size={16} color={C.textMuted} />
          <Text style={styles.headerTitle}>Tables</Text>
          {loading && <ActivityIndicator size="small" color={C.primary} />}
        </View>

        <TouchableOpacity
          style={[styles.directSaleButton, isDirectSale && styles.directSaleButtonActive]}
          onPress={() => onTableSelect(null)}
        >
          <Receipt size={13} color={isDirectSale ? C.textMain : C.textMuted} />
          <Text style={[styles.directSaleText, isDirectSale && styles.directSaleTextActive]}>
            Direct Sale
          </Text>
        </TouchableOpacity>
      </View>

      {tables.length === 0 ? (
        <View style={styles.emptyState}>
          <Table2 size={24} color={C.border} />
          <Text style={styles.emptyText}>No tables configured</Text>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {tables.map((table) => (
            <TableCard
              key={table.table_id}
              table={table}
              isSelected={selectedTable?.table_id === table.table_id}
              onSelect={onTableSelect}
              reservationTime={reservations.get(table.table_id)}
            />
          ))}
        </ScrollView>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: C.surface,
    borderBottomWidth: 1.5,
    borderBottomColor: C.border,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: C.textMain,
  },

  directSaleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: C.background,
    borderWidth: 1.5,
    borderColor: C.border,
  },
  directSaleButtonActive: {
    backgroundColor: C.primary,
    borderColor: C.primary,
  },
  directSaleText: {
    fontSize: 12,
    fontWeight: '700',
    color: C.textMuted,
  },
  directSaleTextActive: {
    color: C.textMain,
  },

  scrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },

  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  emptyText: {
    fontSize: 12,
    color: C.textMuted,
  },
})