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

<<<<<<< HEAD
const palette = {
  bg: '#0A0A0A',
  card: '#1A1A1A',
  brand: '#FF6B2C',
  text: '#FFFFFF',
  textDim: '#9CA3AF',
  border: '#2C2C2C',
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
<<<<<<< HEAD
          <Table2 size={16} color={palette.textDim} />
          <Text style={styles.headerTitle}>Tables</Text>
          {loadingReservations ? <ActivityIndicator size="small" color={palette.brand} /> : null}
=======
          <Table2 size={16} color={C.textMuted} />
          <Text style={styles.headerTitle}>Tables</Text>
          {loading && <ActivityIndicator size="small" color={C.primary} />}
>>>>>>> fd20a81b224afa5355ca1b5411890875e84fd8e4
        </View>

        <TouchableOpacity
          style={[styles.directSaleButton, isDirectSale && styles.directSaleButtonActive]}
          onPress={() => onTableSelect(null)}
        >
<<<<<<< HEAD
          <Receipt size={13} color={isDirectSale ? palette.text : palette.textDim} />
=======
          <Receipt size={13} color={isDirectSale ? C.textMain : C.textMuted} />
>>>>>>> fd20a81b224afa5355ca1b5411890875e84fd8e4
          <Text style={[styles.directSaleText, isDirectSale && styles.directSaleTextActive]}>
            Direct Sale
          </Text>
        </TouchableOpacity>
      </View>

      {tables.length === 0 ? (
        <View style={styles.emptyState}>
<<<<<<< HEAD
          <Table2 size={24} color={palette.border} />
=======
          <Table2 size={24} color={C.border} />
>>>>>>> fd20a81b224afa5355ca1b5411890875e84fd8e4
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
<<<<<<< HEAD
    backgroundColor: palette.card,
    borderBottomWidth: 1.5,
    borderBottomColor: palette.border,
=======
    backgroundColor: C.surface,
    borderBottomWidth: 1.5,
    borderBottomColor: C.border,
>>>>>>> fd20a81b224afa5355ca1b5411890875e84fd8e4
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
<<<<<<< HEAD
    borderBottomColor: palette.border,
=======
    borderBottomColor: C.border,
>>>>>>> fd20a81b224afa5355ca1b5411890875e84fd8e4
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '800',
<<<<<<< HEAD
    color: palette.text,
=======
    color: C.textMain,
>>>>>>> fd20a81b224afa5355ca1b5411890875e84fd8e4
  },
  directSaleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
<<<<<<< HEAD
    borderRadius: corner.pill,
    backgroundColor: palette.bg,
    borderWidth: 1.5,
    borderColor: palette.border,
  },
  directSaleButtonActive: {
    backgroundColor: palette.brand,
    borderColor: palette.brand,
=======
    borderRadius: radius.pill,
    backgroundColor: C.background,
    borderWidth: 1.5,
    borderColor: C.border,
  },
  directSaleButtonActive: {
    backgroundColor: C.primary,
    borderColor: C.primary,
>>>>>>> fd20a81b224afa5355ca1b5411890875e84fd8e4
  },
  directSaleText: {
    fontSize: 12,
    fontWeight: '700',
<<<<<<< HEAD
    color: palette.textDim,
  },
  directSaleTextActive: {
    color: palette.text,
=======
    color: C.textMuted,
  },
  directSaleTextActive: {
    color: C.textMain,
>>>>>>> fd20a81b224afa5355ca1b5411890875e84fd8e4
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
<<<<<<< HEAD
    color: palette.textDim,
=======
    color: C.textMuted,
>>>>>>> fd20a81b224afa5355ca1b5411890875e84fd8e4
  },
})