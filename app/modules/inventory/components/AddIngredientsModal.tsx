import { X } from 'lucide-react-native'
import { useState } from 'react'
import {
  Alert, Modal, ScrollView, StyleSheet,
  Text, TextInput, TouchableOpacity, View,
} from 'react-native'
import inventoryService from '../services/inventory'

const C = {
  black:      '#0A0A0A',
  charcoal:   '#1A1A1A',
  graphite:   '#2C2C2C',
  muted:      '#6B6B6B',
  border:     '#2E2E2E',
  orange:     '#FF6B2C',
  orangeTint: '#2A1A10',
  orangeDim:  '#7A3010',
  white:      '#FFFFFF',
  error:      '#EF4444',
  success:    '#22C55E',
}
const radius = { xs: 6, sm: 10, md: 14, lg: 18, pill: 100 }

interface Props {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

const CATEGORIES = ['Vegetables', 'Meat', 'Dairy', 'Grains', 'Spices', 'Beverages', 'Other']
const UNITS      = ['kg', 'g', 'L', 'ml', 'pcs', 'dozen', 'box']

const DEFAULT = {
  name: '', category: 'Vegetables', unit: 'kg',
  current_stock: '', min_stock: '', max_stock: '',
  cost_per_unit: '', expiration_date: '',
}

export default function AddIngredientModal({ isOpen, onClose, onSuccess }: Props) {
  const [form,    setForm]    = useState(DEFAULT)
  const [errors,  setErrors]  = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [focused, setFocused] = useState<string | null>(null)

  const set = (key: string, val: string) => {
    setForm(f => ({ ...f, [key]: val }))
    setErrors(e => ({ ...e, [key]: '' }))
  }

  const validate = () => {
  const e: Record<string, string> = {}
  if (!form.name.trim())       e.name         = 'Name is required'
  if (!form.current_stock)     e.current_stock = 'Current stock is required'
  if (!form.min_stock)         e.min_stock     = 'Min stock is required'
  if (!form.max_stock)         e.max_stock     = 'Max stock is required'
  if (!form.cost_per_unit)     e.cost_per_unit = 'Cost per unit is required'
  if (parseFloat(form.min_stock) >= parseFloat(form.max_stock))
    e.max_stock = 'Max must be greater than min'
  if (form.expiration_date.trim()) {
    const isValidFormat = /^\d{4}-\d{2}-\d{2}$/.test(form.expiration_date.trim())
    const parsed = new Date(form.expiration_date.trim())
    if (!isValidFormat || isNaN(parsed.getTime())) {
      e.expiration_date = 'Use format YYYY-MM-DD, e.g. 2026-12-31'
    }
  }
  return e
}

  const handleSubmit = async () => {
  const e = validate()
  if (Object.keys(e).length > 0) { setErrors(e); return }
  setLoading(true)
  try {
    console.log('SUBMITTING INGREDIENT...')
    const result = await inventoryService.postIngredient({
      name:           form.name.trim(),
      category:       form.category,
      unit:           form.unit,
      min_stock:      parseFloat(form.min_stock),
      max_stock:      parseFloat(form.max_stock),
      cost_per_unit:  parseFloat(form.cost_per_unit),
      expiration_date: form.expiration_date || undefined,
      current_stock:   parseFloat(form.current_stock),
    })
    console.log('SUCCESS:', result)
    setForm(DEFAULT)
    setErrors({})
    onSuccess()
    onClose()
  } catch (err: any) {
    console.log('SUBMIT FAILED:', err.message, err)
    Alert.alert('Error', err.message || 'Failed to add ingredient')
  } finally {
    setLoading(false)
  }
}

  const handleClose = () => { setForm(DEFAULT); setErrors({}); onClose() }

  const inputStyle = (key: string) => [
    s.input,
    focused === key && s.inputFocused,
    errors[key]     && s.inputError,
  ]

  return (
    <Modal visible={isOpen} animationType="slide" transparent>
      <View style={s.overlay}>
        <View style={s.container}>
          <View style={s.handle} />

          <View style={s.header}>
            <Text style={s.title}>Add Ingredient</Text>
            <TouchableOpacity style={s.closeBtn} onPress={handleClose}>
              <X size={16} color={C.muted} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>

            {/* Name */}
<Text style={s.label}>NAME *</Text>
<TextInput
  style={inputStyle('name')}
  placeholder="e.g. Tomatoes"
  placeholderTextColor={C.muted}
  value={form.name}
  onChangeText={t => set('name', t)}
  onFocus={() => setFocused('name')}
  onBlur={() => setFocused(null)}
/>
{errors.name && <Text style={s.fieldError}>{errors.name}</Text>}

            {/* Category */}
            <Text style={s.label}>CATEGORY *</Text>
            <View style={s.chipRow}>
              {CATEGORIES.map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={[s.chip, form.category === cat && s.chipActive]}
                  onPress={() => set('category', cat)}
                >
                  <Text style={[s.chipText, form.category === cat && s.chipTextActive]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Unit */}
            <Text style={s.label}>UNIT *</Text>
            <View style={s.chipRow}>
              {UNITS.map(unit => (
                <TouchableOpacity
                  key={unit}
                  style={[s.chip, form.unit === unit && s.chipActive]}
                  onPress={() => set('unit', unit)}
                >
                  <Text style={[s.chipText, form.unit === unit && s.chipTextActive]}>{unit}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Stock fields */}
            <View style={s.row}>
              <View style={s.half}>
                <Text style={s.label}>CURRENT STOCK *</Text>
                <TextInput
                  style={inputStyle('current_stock')}
                  placeholder="0"
                  placeholderTextColor={C.muted}
                  keyboardType="numeric"
                  value={form.current_stock}
                  onChangeText={t => set('current_stock', t)}
                  onFocus={() => setFocused('current_stock')}
                  onBlur={() => setFocused(null)}
                />
                {errors.current_stock && <Text style={s.fieldError}>{errors.current_stock}</Text>}
              </View>
              <View style={s.half}>
                <Text style={s.label}>COST PER UNIT *</Text>
                <TextInput
                  style={inputStyle('cost_per_unit')}
                  placeholder="0.00"
                  placeholderTextColor={C.muted}
                  keyboardType="numeric"
                  value={form.cost_per_unit}
                  onChangeText={t => set('cost_per_unit', t)}
                  onFocus={() => setFocused('cost_per_unit')}
                  onBlur={() => setFocused(null)}
                />
                {errors.cost_per_unit && <Text style={s.fieldError}>{errors.cost_per_unit}</Text>}
              </View>
            </View>

            <View style={s.row}>
              <View style={s.half}>
                <Text style={s.label}>MIN STOCK *</Text>
                <TextInput
                  style={inputStyle('min_stock')}
                  placeholder="0"
                  placeholderTextColor={C.muted}
                  keyboardType="numeric"
                  value={form.min_stock}
                  onChangeText={t => set('min_stock', t)}
                  onFocus={() => setFocused('min_stock')}
                  onBlur={() => setFocused(null)}
                />
                {errors.min_stock && <Text style={s.fieldError}>{errors.min_stock}</Text>}
              </View>
              <View style={s.half}>
                <Text style={s.label}>MAX STOCK *</Text>
                <TextInput
                  style={inputStyle('max_stock')}
                  placeholder="100"
                  placeholderTextColor={C.muted}
                  keyboardType="numeric"
                  value={form.max_stock}
                  onChangeText={t => set('max_stock', t)}
                  onFocus={() => setFocused('max_stock')}
                  onBlur={() => setFocused(null)}
                />
                {errors.max_stock && <Text style={s.fieldError}>{errors.max_stock}</Text>}
              </View>
            </View>

            {/* Expiry */}
            <Text style={s.label}>EXPIRY DATE (optional)</Text>
            <TextInput
              style={inputStyle('expiration_date')}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={C.muted}
              value={form.expiration_date}
              onChangeText={t => set('expiration_date', t)}
              onFocus={() => setFocused('expiration_date')}
              onBlur={() => setFocused(null)}
            />

            {/* Buttons */}
            <View style={s.buttons}>
              <TouchableOpacity style={s.cancelBtn} onPress={handleClose}>
                <Text style={s.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.submitBtn, loading && { opacity: 0.55 }]}
                onPress={handleSubmit}
                disabled={loading}
                activeOpacity={0.85}
              >
                <Text style={s.submitText}>{loading ? 'Adding...' : 'Add Ingredient'}</Text>
              </TouchableOpacity>
            </View>

          </ScrollView>
        </View>
      </View>
    </Modal>
  )
}

const s = StyleSheet.create({
  overlay:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  container: { backgroundColor: C.charcoal, borderTopLeftRadius: 28, borderTopRightRadius: 28, borderTopWidth: 1, borderColor: C.border, padding: 24, maxHeight: '92%' },
  handle:    { width: 36, height: 4, borderRadius: radius.pill, backgroundColor: C.graphite, alignSelf: 'center', marginBottom: 20 },

  header:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  title:    { fontSize: 18, fontWeight: '900', color: C.white, letterSpacing: 0.4 },
  closeBtn: { width: 32, height: 32, borderRadius: radius.sm, backgroundColor: C.graphite, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },

  label:      { fontSize: 10, fontWeight: '800', color: C.muted, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8, marginTop: 16 },
  input:      { borderWidth: 1.5, borderColor: C.border, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: C.white, backgroundColor: C.black },
  inputFocused:{ borderColor: C.orange },
  inputError: { borderColor: C.error },
  fieldError: { fontSize: 11, color: C.error, marginTop: 4, fontWeight: '600' },

  chipRow:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip:         { paddingHorizontal: 12, paddingVertical: 7, borderRadius: radius.pill, borderWidth: 1, borderColor: C.border, backgroundColor: C.graphite },
  chipActive:   { borderColor: C.orange, backgroundColor: C.orangeTint },
  chipText:     { fontSize: 12, fontWeight: '600', color: C.muted },
  chipTextActive:{ color: C.orange },

  row:  { flexDirection: 'row', gap: 12 },
  half: { flex: 1 },

  buttons:    { flexDirection: 'row', gap: 12, marginTop: 24, marginBottom: 8 },
  cancelBtn:  { flex: 1, borderWidth: 1.5, borderColor: C.border, borderRadius: radius.pill, paddingVertical: 13, alignItems: 'center', backgroundColor: C.graphite },
  cancelText: { fontSize: 14, color: C.muted, fontWeight: '700' },
  submitBtn:  { flex: 2, backgroundColor: C.orange, borderRadius: radius.pill, paddingVertical: 13, alignItems: 'center' },
  submitText: { fontSize: 14, color: C.white, fontWeight: '800', letterSpacing: 0.3 },
})