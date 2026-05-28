import { AlertCircle, CheckCircle, ChevronLeft, ChevronRight, XCircle } from 'lucide-react-native'
import { useState } from 'react'
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { ReservationStatus, ReservationsCalendarProps } from '../../pos/types/reservation'

const C = {
  black:      '#0A0A0A',
  charcoal:   '#1A1A1A',
  graphite:   '#2C2C2C',
  steel:      '#3D3D3D',
  muted:      '#6B6B6B',
  border:     '#2E2E2E',
  card:       '#1E1E1E',
  orange:     '#FF6B2C',
  orangeTint: '#2A1A10',
  orangeDim:  '#7A3010',
  white:      '#FFFFFF',
  offWhite:   '#F0F0F0',
  dim:        '#A0A0A0',
  success:    '#22C55E',
  successBg:  '#0D2818',
  error:      '#EF4444',
  errorBg:    '#2A0A0A',
}
const radius = { xs: 6, sm: 10, md: 14, lg: 18, pill: 100 }

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
    icon:   <CheckCircle size={14} color={C.orange} />,
    bg:     C.orangeTint,
    border: C.orangeDim,
    text:   C.orange,
    dot:    C.orange,
  },
  cancelled: {
    label:  'Cancelled',
    icon:   <XCircle size={14} color={C.error} />,
    bg:     C.errorBg,
    border: '#7A1010',
    text:   C.error,
    dot:    C.error,
  },
  completed: {
    label:  'Completed',
    icon:   <CheckCircle size={14} color={C.success} />,
    bg:     C.successBg,
    border: '#1A4A2A',
    text:   C.success,
    dot:    C.success,
  },
  no_show: {
    label:  'No Show',
    icon:   <AlertCircle size={14} color={C.dim} />,
    bg:     C.graphite,
    border: C.steel,
    text:   C.dim,
    dot:    C.dim,
  },
  arrived: {
    label:  'Arrived',
    icon:   <CheckCircle size={14} color={C.offWhite} />,
    bg:     C.steel,
    border: C.muted,
    text:   C.offWhite,
    dot:    C.offWhite,
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
            <ChevronLeft size={16} color={C.white} />
          </TouchableOpacity>
          <Text style={styles.dateText}>{formatDate(selectedDate)}</Text>
          <TouchableOpacity style={styles.navBtn} onPress={() => navigateDate('next')} activeOpacity={0.8}>
            <ChevronRight size={16} color={C.white} />
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
                style={[styles.card, index === filteredReservations.length - 1 && { borderBottomWidth: 0 }]}
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
                      style={[styles.actionBtn, { backgroundColor: C.successBg, borderColor: '#1A4A2A' }]}
                      onPress={() => onReservationStatusChange(reservation.id, 'arrived')}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.actionBtnText, { color: C.success }]}>Arrived</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: C.errorBg, borderColor: '#7A1010' }]}
                      onPress={() => onReservationStatusChange(reservation.id, 'cancelled')}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.actionBtnText, { color: C.error }]}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {reservation.status === 'completed' && (
                  <View style={styles.actionsRow}>
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: C.graphite, borderColor: C.steel }]}
                      onPress={() => onReservationStatusChange(reservation.id, 'no_show')}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.actionBtnText, { color: C.dim }]}>No Show</Text>
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
            <View style={[styles.footerDot, { backgroundColor: C.orange }]} />
            <Text style={styles.footerStatText}>
              Confirmed: {reservations.filter(r => r.status === 'confirmed').length}
            </Text>
          </View>
          <View style={styles.footerStat}>
            <View style={[styles.footerDot, { backgroundColor: C.success }]} />
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
    backgroundColor: C.card, borderRadius: radius.lg,
    borderWidth: 1, borderColor: C.border, overflow: 'hidden',
  },

  header: {
    backgroundColor: C.charcoal,
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12, gap: 10,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  navRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  navBtn: {
    width: 30, height: 30, borderRadius: radius.pill,
    backgroundColor: C.graphite, borderWidth: 1, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center',
  },
  dateText:             { fontSize: 13, fontWeight: '700', color: C.offWhite, flex: 1, textAlign: 'center', marginHorizontal: 8 },
  todayBtn:             { alignSelf: 'flex-end', backgroundColor: C.orange, borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 6 },
  todayBtnText:         { fontSize: 11, fontWeight: '800', color: C.white, letterSpacing: 0.3 },
  filterScroll:         { marginTop: 2 },
  filterRow:            { flexDirection: 'row', gap: 6, paddingBottom: 2 },
  filterPill:           { backgroundColor: C.graphite, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: C.border },
  filterPillActive:     { backgroundColor: C.orange, borderColor: C.orange },
  filterPillText:       { fontSize: 11, fontWeight: '600', color: C.dim },
  filterPillTextActive: { color: C.white, fontWeight: '700' },

  list: { maxHeight: 420 },

  card: {
    backgroundColor: C.card, borderBottomWidth: 1,
    borderBottomColor: C.border, padding: 14, gap: 8,
  },
  cardTop:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, flexWrap: 'wrap' },
  statusBadge: { borderRadius: radius.pill, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3 },
  statusText:  { fontSize: 10, fontWeight: '700' },
  timeText:    { fontSize: 13, fontWeight: '700', color: C.offWhite },
  nameText:    { fontSize: 13, fontWeight: '800', color: C.white },

  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginLeft: 2 },
  metaText: { fontSize: 11, color: C.dim },
  metaDot:  { fontSize: 11, color: C.muted },

  actionsRow:    { flexDirection: 'row', gap: 8, marginTop: 4 },
  actionBtn:     { borderRadius: radius.pill, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 6 },
  actionBtnText: { fontSize: 11, fontWeight: '700' },

  emptyState:    { alignItems: 'center', paddingVertical: 48, gap: 8 },
  emptyTitle:    { fontSize: 16, fontWeight: '800', color: C.offWhite },
  emptySubtitle: { fontSize: 13, color: C.muted },

  footer: {
    backgroundColor: C.charcoal, borderTopWidth: 1, borderTopColor: C.border,
    paddingHorizontal: 16, paddingVertical: 12,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  footerCount:    { fontSize: 12, fontWeight: '600', color: C.dim },
  footerStats:    { flexDirection: 'row', gap: 14 },
  footerStat:     { flexDirection: 'row', alignItems: 'center', gap: 5 },
  footerDot:      { width: 7, height: 7, borderRadius: 4 },
  footerStatText: { fontSize: 11, color: C.dim, fontWeight: '500' },
})