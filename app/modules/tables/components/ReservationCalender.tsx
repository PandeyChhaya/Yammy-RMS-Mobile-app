import { AlertCircle, CheckCircle, ChevronLeft, ChevronRight, XCircle } from 'lucide-react-native'
import { useState } from 'react'
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'

const C = {
  espresso:    '#1C1008',
  roast:       '#3D2010',
  clay:        '#7A4528',
  latte:       '#C8956A',
  cream:       '#FDF6EC',
  parchment:   '#F5E9D4',
  vellum:      '#EDD9BC',
  brass:       '#B5822A',
  brassLight:  '#F7EDD8',
  brassBorder: '#DEC07A',
  sage:        '#3B6E52',
  sageLight:   '#EBF4EE',
  sageBorder:  '#9FCFB4',
  terracotta:  '#A03020',
  tcLight:     '#FAECEA',
  tcBorder:    '#E8A898',
  onDark:      '#FDF6EC',
}
const radius = { xs: 6, sm: 10, md: 14, lg: 18, pill: 100 }

type ReservationStatus = 'confirmed' | 'cancelled' | 'completed' | 'no_show' | 'arrived'

interface ReservationWithTable {
  id: string
  status: ReservationStatus
  reservation_time: string
  customer_name: string
  customer_phone?: string
  party_size: number
  table_number: string | number
}

interface ReservationsCalendarProps {
  selectedDate: Date
  onDateChange: (date: Date) => void
  reservations: ReservationWithTable[]
  onReservationClick: (reservation: ReservationWithTable) => void
  onReservationStatusChange: (reservationId: string, status: ReservationStatus) => void
}

const STATUS_CONFIG: Record<ReservationStatus, {
  label: string
  icon: React.ReactNode
  bg: string
  border: string
  text: string
  dot: string
}> = {
  confirmed: {
    label:  'Confirmed',
    icon:   <CheckCircle  size={14} color="#B5822A" />,
    bg:     '#F7EDD8',
    border: '#DEC07A',
    text:   '#B5822A',
    dot:    '#B5822A',
  },
  cancelled: {
    label:  'Cancelled',
    icon:   <XCircle      size={14} color="#A03020" />,
    bg:     '#FAECEA',
    border: '#E8A898',
    text:   '#A03020',
    dot:    '#A03020',
  },
  completed: {
    label:  'Completed',
    icon:   <CheckCircle  size={14} color="#3B6E52" />,
    bg:     '#EBF4EE',
    border: '#9FCFB4',
    text:   '#3B6E52',
    dot:    '#3B6E52',
  },
  no_show: {
    label:  'No Show',
    icon:   <AlertCircle  size={14} color="#7A4528" />,
    bg:     '#F5E9D4',
    border: '#EDD9BC',
    text:   '#7A4528',
    dot:    '#7A4528',
  },
  arrived: {
    label:  'Arrived',
    icon:   <CheckCircle  size={14} color="#1C1008" />,
    bg:     '#EDD9BC',
    border: '#C8956A',
    text:   '#1C1008',
    dot:    '#3D2010',
  },
}

const FILTER_OPTIONS = ['all', 'confirmed', 'completed', 'no_show', 'arrived'] as const
type FilterOption = typeof FILTER_OPTIONS[number]

export default function ReservationsCalendar({
  selectedDate,
  onDateChange,
  reservations,
  onReservationClick,
  onReservationStatusChange,
}: ReservationsCalendarProps) {

  const [filterStatus, setFilterStatus] = useState<FilterOption>('all')

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1))
    onDateChange(newDate)
  }

  const formatDate = (date: Date) =>
    date.toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    })

  const filteredReservations = reservations.filter(r =>
    filterStatus === 'all' || r.status === filterStatus
  )

  return (
    <View style={styles.container}>

      <View style={styles.header}>
        <View style={styles.navRow}>
          <TouchableOpacity style={styles.navBtn} onPress={() => navigateDate('prev')} activeOpacity={0.8}>
            <ChevronLeft size={16} color={C.cream} />
          </TouchableOpacity>
          <Text style={styles.dateText}>{formatDate(selectedDate)}</Text>
          <TouchableOpacity style={styles.navBtn} onPress={() => navigateDate('next')} activeOpacity={0.8}>
            <ChevronRight size={16} color={C.cream} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.todayBtn} onPress={() => onDateChange(new Date())} activeOpacity={0.8}>
          <Text style={styles.todayBtnText}>Today</Text>
        </TouchableOpacity>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          <View style={styles.filterRow}>
            {FILTER_OPTIONS.map(status => (
              <TouchableOpacity
                key={status}
                style={[styles.filterPill, filterStatus === status && styles.filterPillActive]}
                onPress={() => setFilterStatus(status)}
                activeOpacity={0.8}
              >
                <Text style={[styles.filterPillText, filterStatus === status && styles.filterPillTextActive]}>
                  {status === 'all' ? 'All' : STATUS_CONFIG[status as ReservationStatus].label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        {filteredReservations.length === 0 ? (

          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No Reservations</Text>
            <Text style={styles.emptySubtitle}>
              {filterStatus === 'all'
                ? 'No reservations for this date'
                : `No ${STATUS_CONFIG[filterStatus as ReservationStatus]?.label.toLowerCase()} reservations`}
            </Text>
          </View>

        ) : (
          filteredReservations.map((reservation, index) => {
            const cfg = STATUS_CONFIG[reservation.status]
            return (
              <TouchableOpacity
                key={reservation.id}
                style={[styles.card, index === filteredReservations.length - 1 && { marginBottom: 0 }]}
                onPress={() => onReservationClick(reservation)}
                activeOpacity={0.8}
              >
                <View style={styles.cardTop}>
                  <View style={styles.cardLeft}>
                    {cfg.icon}
                    <View style={[styles.statusBadge, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
                      <Text style={[styles.statusText, { color: cfg.text }]}>{cfg.label}</Text>
                    </View>
                    <Text style={styles.timeText}>{reservation.reservation_time}</Text>
                    <Text style={styles.nameText}>{reservation.customer_name}</Text>
                  </View>
                </View>

                <View style={styles.cardMeta}>
                  <Text style={styles.metaText}>👥 {reservation.party_size}p</Text>
                  <Text style={styles.metaDot}>·</Text>
                  <Text style={styles.metaText}>🪑 T{reservation.table_number}</Text>
                  {reservation.customer_phone && (
                    <>
                      <Text style={styles.metaDot}>·</Text>
                      <Text style={styles.metaText}>📞 {reservation.customer_phone}</Text>
                    </>
                  )}
                </View>

                {reservation.status === 'confirmed' && (
                  <View style={styles.actionsRow}>
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: C.sageLight, borderColor: C.sageBorder }]}
                      onPress={() => onReservationStatusChange(reservation.id, 'arrived')}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.actionBtnText, { color: C.sage }]}>Arrived</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: C.tcLight, borderColor: C.tcBorder }]}
                      onPress={() => onReservationStatusChange(reservation.id, 'cancelled')}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.actionBtnText, { color: C.terracotta }]}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {reservation.status === 'completed' && (
                  <View style={styles.actionsRow}>
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: C.brassLight, borderColor: C.brassBorder }]}
                      onPress={() => onReservationStatusChange(reservation.id, 'no_show')}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.actionBtnText, { color: C.clay }]}>No Show</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </TouchableOpacity>
            )
          })
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Text style={styles.footerCount}>
          {filteredReservations.length} reservation{filteredReservations.length !== 1 ? 's' : ''}
        </Text>
        <View style={styles.footerStats}>
          <View style={styles.footerStat}>
            <View style={[styles.footerDot, { backgroundColor: C.brass }]} />
            <Text style={styles.footerStatText}>
              Confirmed: {reservations.filter(r => r.status === 'confirmed').length}
            </Text>
          </View>
          <View style={styles.footerStat}>
            <View style={[styles.footerDot, { backgroundColor: C.sage }]} />
            <Text style={styles.footerStatText}>
              Completed: {reservations.filter(r => r.status === 'completed').length}
            </Text>
          </View>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: C.cream, borderRadius: radius.lg,
    borderWidth: 1.5, borderColor: C.vellum, overflow: 'hidden',
    shadowColor: C.espresso, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1, shadowRadius: 12, elevation: 4,
  },

  header: {
    backgroundColor: C.espresso,
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12, gap: 10,
  },
  navRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  navBtn: {
    width: 30, height: 30, borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  dateText: { fontSize: 13, fontWeight: '700', color: C.cream, flex: 1, textAlign: 'center', marginHorizontal: 8 },
  todayBtn: {
    alignSelf: 'flex-end', backgroundColor: C.brass,
    borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 6,
  },
  todayBtnText:  { fontSize: 11, fontWeight: '800', color: C.cream, letterSpacing: 0.3 },
  filterScroll:  { marginTop: 2 },
  filterRow:     { flexDirection: 'row', gap: 6, paddingBottom: 2 },
  filterPill: {
    backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: radius.pill,
    paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  filterPillActive:     { backgroundColor: C.brass, borderColor: C.brass },
  filterPillText:       { fontSize: 11, fontWeight: '600', color: C.latte },
  filterPillTextActive: { color: C.cream },

  list: { maxHeight: 420 },

  card: {
    backgroundColor: C.parchment, borderBottomWidth: 1,
    borderBottomColor: C.vellum, padding: 14, gap: 8,
  },
  cardTop:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, flexWrap: 'wrap' },
  statusBadge: {
    borderRadius: radius.pill, borderWidth: 1,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  statusText: { fontSize: 10, fontWeight: '700' },
  timeText:   { fontSize: 13, fontWeight: '700', color: C.espresso },
  nameText:   { fontSize: 13, fontWeight: '800', color: C.espresso },

  cardMeta:   { flexDirection: 'row', alignItems: 'center', gap: 6, marginLeft: 2 },
  metaText:   { fontSize: 11, color: C.clay },
  metaDot:    { fontSize: 11, color: C.latte },

  actionsRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  actionBtn: {
    borderRadius: radius.pill, borderWidth: 1,
    paddingHorizontal: 14, paddingVertical: 6,
  },
  actionBtnText: { fontSize: 11, fontWeight: '700' },

  emptyState:    { alignItems: 'center', paddingVertical: 48, gap: 8 },
  emptyTitle:    { fontSize: 16, fontWeight: '800', color: C.espresso },
  emptySubtitle: { fontSize: 13, color: C.clay },

  footer: {
    backgroundColor: C.parchment, borderTopWidth: 1.5,
    borderTopColor: C.vellum, paddingHorizontal: 16, paddingVertical: 12,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  footerCount:    { fontSize: 12, fontWeight: '600', color: C.clay },
  footerStats:    { flexDirection: 'row', gap: 14 },
  footerStat:     { flexDirection: 'row', alignItems: 'center', gap: 5 },
  footerDot:      { width: 7, height: 7, borderRadius: 4 },
  footerStatText: { fontSize: 11, color: C.clay, fontWeight: '500' },
})