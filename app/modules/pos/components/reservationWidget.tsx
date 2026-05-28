import { Calendar } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import reservationService from '../../reservation/services/reservationService'
import { TableData } from '../types/tables'

const C = {
  background: '#0A0A0A', surface: '#1A1A1A', primary: '#FF6B2C',
  primaryDim: '#3D1C00', textMain: '#FFFFFF', textMuted: '#9CA3AF',
  border: '#2C2C2C', success: '#10B981', successDim: '#064E3B',
  warning: '#F59E0B', warningDim: '#3A2500',
}
const radius = { md: 14, pill: 100 }

interface Props {
  selectedTable: TableData | null
}

export default function ReservationWidget({ selectedTable }: Props) {
  const [reservation, setReservation] = useState<any | null>(null)

  useEffect(() => {
    if (!selectedTable) { setReservation(null); return }
    const today = new Date().toISOString().split('T')[0]
    reservationService.getReservationsWithTableInfo(today).then(data => {
      const match = data.find(
        r => r.table_id === selectedTable.table_id && r.status === 'confirmed'
      )
      setReservation(match ?? null)
    }).catch(() => setReservation(null))
  }, [selectedTable])

  if (!selectedTable || !reservation) return null

  return (
    <View style={styles.container}>
      <Calendar size={13} color={C.warning} />
      <Text style={styles.text}>
        Reserved · {reservation.customer_name} · {String(reservation.reservation_time).slice(0, 5)}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: C.warningDim, borderRadius: radius.pill,
    borderWidth: 1, borderColor: C.warning,
    paddingHorizontal: 10, paddingVertical: 5,
    marginHorizontal: 14, marginTop: 8,
  },
  text: { fontSize: 11, fontWeight: '700', color: C.warning },
})