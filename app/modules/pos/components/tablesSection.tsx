// tablesSection.tsx
import { Receipt, Table2 } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import reservationService from '../../reservation/services/reservationService'
import { TableData } from '../types/tables'
import TableCard from './tableCard'

const palette = {
  bg: '#0A0A0A',
  card: '#1A1A1A',
  brand: '#FF6B2C',
  text: '#FFFFFF',
  textDim: '#9CA3AF',
  border: '#2C2C2C',
}

const corner = { sm: 10, pill: 100 }

interface TablesSectionProps {
  tables: TableData[]
  selectedTable: TableData | null
  onTableSelect: (table: TableData | null) => void
}

export default function TablesSection(props: TablesSectionProps) {
  const { tables, selectedTable, onTableSelect } = props

  const [reservationTimes, setReservationTimes] = useState<Map<number, string>>(new Map())
  const [loadingReservations, setLoadingReservations] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function loadReservations() {
      setLoadingReservations(true)
      try {
        const today = new Date().toISOString().split('T')[0]
        const todays = await reservationService.getReservationsWithTableInfo(today)

        const times = new Map<number, string>()
        todays
          .filter((r: any) => r.status === 'confirmed' && r.table_id)
          .forEach((r: any) => {
            times.set(r.table_id, String(r.reservation_time).substring(0, 5))
          })

        if (!cancelled) setReservationTimes(times)
      } catch (err) {
        console.error('could not load reservations for table view:', err)
      } finally {
        if (!cancelled) setLoadingReservations(false)
      }
    }

    loadReservations()
    return () => {
      cancelled = true
    }
  }, [])

  const isDirectSale = selectedTable === null

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Table2 size={16} color={palette.textDim} />
          <Text style={styles.headerTitle}>Tables</Text>
          {loadingReservations ? <ActivityIndicator size="small" color={palette.brand} /> : null}
        </View>

        <TouchableOpacity
          style={[styles.directSaleButton, isDirectSale && styles.directSaleButtonActive]}
          onPress={() => onTableSelect(null)}
        >
          <Receipt size={13} color={isDirectSale ? palette.text : palette.textDim} />
          <Text style={[styles.directSaleText, isDirectSale && styles.directSaleTextActive]}>
            Direct Sale
          </Text>
        </TouchableOpacity>
      </View>

      {tables.length === 0 ? (
        <View style={styles.emptyState}>
          <Table2 size={24} color={palette.border} />
          <Text style={styles.emptyText}>No tables configured</Text>
        </View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {tables.map((table) => (
            <TableCard
              key={table.table_id}
              table={table}
              isSelected={selectedTable?.table_id === table.table_id}
              onSelect={onTableSelect}
              reservationTime={reservationTimes.get(table.table_id)}
            />
          ))}
        </ScrollView>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: palette.card,
    borderBottomWidth: 1.5,
    borderBottomColor: palette.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: palette.text,
  },
  directSaleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: corner.pill,
    backgroundColor: palette.bg,
    borderWidth: 1.5,
    borderColor: palette.border,
  },
  directSaleButtonActive: {
    backgroundColor: palette.brand,
    borderColor: palette.brand,
  },
  directSaleText: {
    fontSize: 12,
    fontWeight: '700',
    color: palette.textDim,
  },
  directSaleTextActive: {
    color: palette.text,
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
    color: palette.textDim,
  },
})