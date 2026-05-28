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
import { CreateReservationRequest, ReservationModalProps } from '../../pos/types/reservation'
import reservationService from '../../reservation/services/reservationService'

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
  const [focusedInput, setFocusedInput] = useState<string | null>(null)

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

  const inputStyle = (key: string) => [
    styles.input,
    focusedInput === key && styles.inputFocused,
  ]

  return (
    <Modal visible={isOpen} transparent animationType="slide" onRequestClose={onClose}>
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
              <X size={16} color={C.white} />
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
                  <CheckCircle size={32} color={C.success} />
                </View>
                <Text style={styles.title}>Reservation Created!</Text>
                <Text style={styles.subtitle}>The reservation has been successfully saved.</Text>
              </View>
            ) : (
              <>
                {errors.length > 0 && (
                  <View style={styles.errorBanner}>
                    <AlertCircle size={16} color={C.error} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.errorBannerText}>
                        {errors.map((e) => `• ${e}`).join('\n')}
                      </Text>
                    </View>
                  </View>
                )}

                <View style={styles.sectionHeader}>
                  <View style={styles.sectionIconBadge}>
                    <Users size={14} color={C.orange} />
                  </View>
                  <Text style={styles.sectionTitle}>Customer Information</Text>
                </View>

                <Text style={styles.label}>Customer Name *</Text>
                <TextInput
                  style={inputStyle('name')}
                  placeholder="Full name"
                  placeholderTextColor={C.muted}
                  value={formData.customer_name}
                  onChangeText={v => handleChange('customer_name', v)}
                  onFocus={() => setFocusedInput('name')}
                  onBlur={() => setFocusedInput(null)}
                />

                <Text style={styles.label}>Phone</Text>
                <TextInput
                  style={inputStyle('phone')}
                  placeholder="+1 234 567 8900"
                  placeholderTextColor={C.muted}
                  value={formData.customer_phone}
                  onChangeText={v => handleChange('customer_phone', v)}
                  keyboardType="phone-pad"
                  onFocus={() => setFocusedInput('phone')}
                  onBlur={() => setFocusedInput(null)}
                />

                <View style={[styles.sectionHeader, { marginTop: 8 }]}>
                  <View style={styles.sectionIconBadge}>
                    <Calendar size={14} color={C.orange} />
                  </View>
                  <Text style={styles.sectionTitle}>Reservation Details</Text>
                </View>

                <View style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Date *</Text>
                    <TextInput
                      style={inputStyle('date')}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor={C.muted}
                      value={formData.reservation_date}
                      onChangeText={v => handleChange('reservation_date', v)}
                      onFocus={() => setFocusedInput('date')}
                      onBlur={() => setFocusedInput(null)}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Time *</Text>
                    <TextInput
                      style={inputStyle('time')}
                      placeholder="HH:MM"
                      placeholderTextColor={C.muted}
                      value={formData.reservation_time}
                      onChangeText={v => handleChange('reservation_time', v)}
                      onFocus={() => setFocusedInput('time')}
                      onBlur={() => setFocusedInput(null)}
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
                  style={[inputStyle('notes'), styles.textArea]}
                  placeholder="Allergies, birthday, etc."
                  placeholderTextColor={C.muted}
                  value={formData.special_requests}
                  onChangeText={v => handleChange('special_requests', v)}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  onFocus={() => setFocusedInput('notes')}
                  onBlur={() => setFocusedInput(null)}
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
                    {isSubmitting
                      ? <ActivityIndicator size="small" color={C.white} />
                      : <Text style={styles.submitButtonText}>Create Reservation →</Text>
                    }
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
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: C.charcoal,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderColor: C.border,
    maxHeight: '92%',
    overflow: 'hidden',
  },

  header: {
    backgroundColor: C.charcoal,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  headerTitle: { fontSize: 17, fontWeight: '900', color: C.white, letterSpacing: 0.4 },
  headerSub:   { fontSize: 12, color: C.muted, marginTop: 3, fontWeight: '500' },
  closeBtn: {
    width: 30, height: 30, borderRadius: radius.pill,
    backgroundColor: C.graphite, borderWidth: 1, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center',
  },

  body:      { flex: 1, backgroundColor: C.charcoal },
  bodyInner: { padding: 24, paddingBottom: 40 },

  sectionHeader: {
    flexDirection: 'row', alignItems: 'center',
    gap: 9, marginBottom: 4, marginTop: 8,
  },
  sectionIconBadge: {
    width: 28, height: 28, borderRadius: radius.sm,
    backgroundColor: C.orangeTint, borderWidth: 1, borderColor: C.orangeDim,
    alignItems: 'center', justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 11, fontWeight: '700', color: C.muted,
    textTransform: 'uppercase', letterSpacing: 1.1,
  },

  label: {
    fontSize: 11, fontWeight: '700', color: C.muted,
    marginBottom: 6, marginTop: 14,
    textTransform: 'uppercase', letterSpacing: 1.1,
  },
  input: {
    backgroundColor: C.graphite, borderWidth: 1, borderColor: C.border,
    borderRadius: radius.md, paddingHorizontal: 16, height: 52,
    fontSize: 15, color: C.white,
  },
  inputFocused: { borderColor: C.orange, backgroundColor: C.steel },
  textArea:     { height: 80, paddingTop: 14, textAlignVertical: 'top' },
  row:          { flexDirection: 'row', gap: 12 },

  pillRow:        { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  pill:           { backgroundColor: C.graphite, borderWidth: 1, borderColor: C.border, borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 8 },
  pillActive:     { backgroundColor: C.orange, borderColor: C.orange },
  pillText:       { fontSize: 12, fontWeight: '600', color: C.dim },
  pillTextActive: { color: C.white, fontWeight: '700' },

  errorBanner: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: C.errorBg, borderWidth: 1,
    borderColor: '#7A1010', borderRadius: radius.md,
    padding: 12, marginBottom: 8, gap: 8,
  },
  errorBannerText: { color: C.error, fontSize: 13, fontWeight: '600', lineHeight: 20 },

  emptyState:  { alignItems: 'center', paddingVertical: 56, gap: 12 },
  successIcon: {
    width: 72, height: 72, borderRadius: radius.lg,
    backgroundColor: C.successBg, borderWidth: 1, borderColor: '#1A4A2A',
    alignItems: 'center', justifyContent: 'center',
  },
  title:    { fontSize: 18, fontWeight: '800', color: C.offWhite },
  subtitle: { fontSize: 13, color: C.muted, textAlign: 'center' },

  modalButtons:         { flexDirection: 'row', gap: 12, marginTop: 24, marginBottom: 8 },
  cancelButton:         { flex: 1, backgroundColor: C.graphite, borderWidth: 1, borderColor: C.border, borderRadius: radius.md, height: 52, alignItems: 'center', justifyContent: 'center' },
  cancelButtonText:     { fontSize: 14, color: C.offWhite, fontWeight: '600' },
  submitButton:         { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.orange, borderRadius: radius.md, height: 54 },
  submitButtonDisabled: { opacity: 0.55 },
  submitButtonText:     { fontSize: 16, color: C.white, fontWeight: '800' },
})