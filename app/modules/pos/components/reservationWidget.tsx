// reservationWidget.tsx
import { Calendar } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import reservationService from '../../reservation/services/reservationService'
import { TableData } from '../types/tables'

const palette = {
  amber: '#F59E0B',
  amberBg: '#3A2500',
}

const corner = { pill: 100 }

interface ReservationWidgetProps {
  selectedTable: TableData | null
}

export default function ReservationWidget(props: ReservationWidgetProps) {
  const { selectedTable } = props
  const [reservation, setReservation] = useState<any | null>(null)

  useEffect(() => {
    if (!selectedTable) {
      setReservation(null)
      return
    }

    const today = new Date().toISOString().split('T')[0]

    reservationService
      .getReservationsWithTableInfo(today)
      .then((data) => {
        const match = data.find((r) => r.table_id === selectedTable.table_id && r.status === 'confirmed')
        setReservation(match ?? null)
      })
      .catch(() => setReservation(null))
  }, [selectedTable])

  if (!selectedTable || !reservation) return null

  return (
    <View style={styles.container}>
      <Calendar size={13} color={palette.amber} />
      <Text style={styles.text}>
        Reserved · {reservation.customer_name} · {String(reservation.reservation_time).slice(0, 5)}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: palette.amberBg,
    borderRadius: corner.pill,
    borderWidth: 1,
    borderColor: palette.amber,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginHorizontal: 14,
    marginTop: 8,
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
    color: palette.amber,
  },
})