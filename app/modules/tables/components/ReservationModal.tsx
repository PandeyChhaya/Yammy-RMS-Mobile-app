import { AlertCircle, Calendar, CheckCircle, Users, X } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import reservationService from '../services/reservationService'

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

interface TableData {
  table_id: number
  table_number: string
  floor: string
  capacity: number
  table_status: string
}

interface CreateReservationRequest {
  table_id: number
  customer_name: string
  customer_phone: string
  reservation_date: string
  reservation_time: string
  duration_minutes: number
  party_size: number
  special_requests: string
}

interface Reservation {
  [key: string]: any
}

interface ReservationModalProps {
  table: TableData
  isOpen: boolean
  onClose: () => void
  onReservationCreated: (reservation: Reservation) => void
}

const DURATION_OPTIONS = [
  { label: '1h',   value: 60  },
  { label: '1h30', value: 90  },
  { label: '2h',   value: 120 },
  { label: '2h30', value: 150 },
  { label: '3h',   value: 180 },
]

export default function ReservationModal({
  table,
  isOpen,
  onClose,
  onReservationCreated,
}: ReservationModalProps) {

  const [formData,     setFormData]     = useState<CreateReservationRequest>({
    table_id:         table.table_id,
    customer_name:    '',
    customer_phone:   '',
    reservation_date: new Date().toISOString().split('T')[0],
    reservation_time: '19:00',
    duration_minutes: 120,
    party_size:       Math.min(table.capacity, 4),
    special_requests: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors,       setErrors]       = useState<string[]>([])
  const [showSuccess,  setShowSuccess]  = useState(false)

  useEffect(() => {
    if (isOpen) {
      setFormData({
        table_id:         table.table_id,
        customer_name:    '',
        customer_phone:   '',
        reservation_date: new Date().toISOString().split('T')[0],
        reservation_time: '19:00',
        duration_minutes: 120,
        party_size:       Math.min(table.capacity, 4),
        special_requests: '',
      })
      setErrors([])
      setShowSuccess(false)
    }
  }, [isOpen, table])

  const handleChange = (field: keyof CreateReservationRequest, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors.length > 0) setErrors([])
  }

  const handleSubmit = async () => {
    setErrors([])
    setIsSubmitting(true)
    try {
      const reserved_at = `${formData.reservation_date}T${formData.reservation_time}`
      const reservation = await reservationService.postReservation({
        table_id:          formData.table_id,
        party_size:        formData.party_size,
        reserved_at,
        reservation_notes: formData.special_requests,
      })
      setShowSuccess(true)
      setTimeout(() => {
        onReservationCreated(reservation)
        onClose()
      }, 1500)
    } catch (error) {
      setErrors([error instanceof Error ? error.message : 'Failed to create reservation'])
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal visible={isOpen} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.sheet}>

          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>New Reservation</Text>
              <Text style={styles.headerSub}>
                Table {table.table_number} — Floor {table.floor}
              </Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.8}>
              <X size={16} color={C.cream} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.body}
            contentContainerStyle={styles.bodyInner}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {showSuccess ? (

              <View style={styles.emptyState}>
                <View style={styles.successIcon}>
                  <CheckCircle size={32} color={C.sage} />
                </View>
                <Text style={styles.title}>Reservation Created!</Text>
                <Text style={styles.subtitle}>The reservation has been successfully saved.</Text>
              </View>

            ) : (
              <>
                {errors.length > 0 && (
                  <View style={styles.errorBanner}>
                    <AlertCircle size={16} color={C.terracotta} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.errorBannerText}>
                        {errors.map((e, i) => `• ${e}`).join('\n')}
                      </Text>
                    </View>
                  </View>
                )}

                <View style={styles.sectionHeader}>
                  <View style={styles.sectionIconBadge}>
                    <Users size={14} color={C.brass} />
                  </View>
                  <Text style={styles.sectionTitle}>Customer Information</Text>
                </View>

                <Text style={styles.label}>Customer Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Full name"
                  placeholderTextColor={C.latte}
                  value={formData.customer_name}
                  onChangeText={v => handleChange('customer_name', v)}
                />

                <Text style={styles.label}>Phone</Text>
                <TextInput
                  style={styles.input}
                  placeholder="+1 234 567 8900"
                  placeholderTextColor={C.latte}
                  value={formData.customer_phone}
                  onChangeText={v => handleChange('customer_phone', v)}
                  keyboardType="phone-pad"
                />

                <View style={[styles.sectionHeader, { marginTop: 8 }]}>
                  <View style={styles.sectionIconBadge}>
                    <Calendar size={14} color={C.brass} />
                  </View>
                  <Text style={styles.sectionTitle}>Reservation Details</Text>
                </View>

                <View style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Date *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor={C.latte}
                      value={formData.reservation_date}
                      onChangeText={v => handleChange('reservation_date', v)}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Time *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="HH:MM"
                      placeholderTextColor={C.latte}
                      value={formData.reservation_time}
                      onChangeText={v => handleChange('reservation_time', v)}
                    />
                  </View>
                </View>

                <Text style={styles.label}>Party Size *</Text>
                <View style={styles.pillRow}>
                  {Array.from({ length: table.capacity }, (_, i) => i + 1).map(num => (
                    <TouchableOpacity
                      key={num}
                      style={[styles.pill, formData.party_size === num && styles.pillActive]}
                      onPress={() => handleChange('party_size', num)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.pillText, formData.party_size === num && styles.pillTextActive]}>
                        {num}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.label}>Duration</Text>
                <View style={styles.pillRow}>
                  {DURATION_OPTIONS.map(opt => (
                    <TouchableOpacity
                      key={opt.value}
                      style={[styles.pill, formData.duration_minutes === opt.value && styles.pillActive]}
                      onPress={() => handleChange('duration_minutes', opt.value)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.pillText, formData.duration_minutes === opt.value && styles.pillTextActive]}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.label}>Special Requests</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Allergies, birthday, etc."
                  placeholderTextColor={C.latte}
                  value={formData.special_requests}
                  onChangeText={v => handleChange('special_requests', v)}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />

                <View style={styles.modalButtons}>
                  <TouchableOpacity style={styles.cancelButton} onPress={onClose} activeOpacity={0.8}>
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
                    onPress={handleSubmit}
                    disabled={isSubmitting}
                    activeOpacity={0.85}
                  >
                    {isSubmitting && <ActivityIndicator size="small" color={C.cream} />}
                    <Text style={styles.submitButtonText}>
                      {isSubmitting ? 'Creating…' : 'Create Reservation'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(28,16,8,0.65)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: C.cream,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '92%',
    overflow: 'hidden',
    shadowColor: C.espresso,
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 12,
  },

  header: {
    backgroundColor: C.espresso,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  headerTitle: { fontSize: 17, fontWeight: '900', color: C.cream, letterSpacing: 0.4 },
  headerSub:   { fontSize: 12, color: C.latte, marginTop: 3, fontWeight: '500' },
  closeBtn: {
    width: 30, height: 30, borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },

  body:      { flex: 1 },
  bodyInner: { padding: 20, paddingBottom: 40 },

  sectionHeader: {
    flexDirection: 'row', alignItems: 'center',
    gap: 9, marginBottom: 4, marginTop: 8,
  },
  sectionIconBadge: {
    width: 28, height: 28, borderRadius: radius.sm,
    backgroundColor: C.brassLight, borderWidth: 1, borderColor: C.brassBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 11, fontWeight: '800', color: C.clay,
    textTransform: 'uppercase', letterSpacing: 1.4,
  },

  label: {
    fontSize: 11, fontWeight: '800', color: C.clay,
    marginBottom: 6, marginTop: 14,
    textTransform: 'uppercase', letterSpacing: 1.2,
  },
  input: {
    borderWidth: 1.5, borderColor: C.vellum, borderRadius: radius.md,
    paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 14, color: C.espresso, backgroundColor: C.parchment,
  },
  textArea: { height: 80, textAlignVertical: 'top' },
  row:      { flexDirection: 'row', gap: 12 },

  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  pill: {
    backgroundColor: C.parchment, borderWidth: 1.5,
    borderColor: C.vellum, borderRadius: radius.pill,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  pillActive:     { backgroundColor: C.roast, borderColor: C.roast },
  pillText:       { fontSize: 12, fontWeight: '600', color: C.clay },
  pillTextActive: { color: C.cream },

  errorBanner: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: C.tcLight, borderWidth: 1,
    borderColor: C.tcBorder, borderRadius: radius.md,
    padding: 12, marginBottom: 8, gap: 8,
  },
  errorBannerText: { color: C.terracotta, fontSize: 13, fontWeight: '600', lineHeight: 20 },

  emptyState:  { alignItems: 'center', paddingVertical: 56, gap: 12 },
  successIcon: {
    width: 72, height: 72, borderRadius: radius.lg,
    backgroundColor: C.sageLight, borderWidth: 1.5, borderColor: C.sageBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  title:    { fontSize: 18, fontWeight: '800', color: C.espresso },
  subtitle: { fontSize: 13, color: C.clay, textAlign: 'center' },

  modalButtons: { flexDirection: 'row', gap: 12, marginTop: 24, marginBottom: 8 },
  cancelButton: {
    flex: 1, borderWidth: 1.5, borderColor: C.vellum,
    borderRadius: radius.pill, paddingVertical: 12,
    alignItems: 'center', backgroundColor: C.cream,
  },
  cancelButtonText: { fontSize: 14, color: C.clay, fontWeight: '700' },
  submitButton: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8,
    backgroundColor: C.brass, borderRadius: radius.pill,
    paddingVertical: 12,
    shadowColor: C.brass, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 8, elevation: 4,
  },
  submitButtonDisabled: { opacity: 0.5 },
  submitButtonText:     { fontSize: 14, color: C.cream, fontWeight: '800' },
})