import { Package, Save, X } from 'lucide-react-native'
import { useState } from 'react'
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import inventoryService from '../services/inventory'
import { CreateIngredientRequest } from '../types/inventory'

const C = {
  espresso:    '#1C1008',
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
}

const radius = { xs: 6, sm: 10, md: 14, lg: 18, pill: 100 }

interface AddIngredientModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

const UNITS = ['kg', 'g', 'L', 'ml', 'piece', 'box', 'bag', 'bottle']

const DEFAULT_FORM: CreateIngredientRequest = {
  name: '',
  category: 'Imported',
  unit: 'kg',
  min_stock: 0,
  max_stock: 100,
  cost_per_unit: 0,
  description: '',
  supplier_id: undefined,
  expiration_date: undefined,
}

export default function AddIngredientModal({ isOpen, onClose, onSuccess }: AddIngredientModalProps) {
  const [formData, setFormData]     = useState<CreateIngredientRequest>(DEFAULT_FORM)
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState<string | null>(null)
  const [unitOpen, setUnitOpen]     = useState(false)

  const handleInputChange = (field: keyof CreateIngredientRequest, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)
    try {
      if (!formData.name.trim())                    throw new Error('Name is required')
      if (formData.min_stock < 0 || formData.max_stock < 0) throw new Error('Stock values must be positive')
      if (formData.min_stock >= formData.max_stock) throw new Error('Min stock must be less than max stock')
      if (formData.cost_per_unit < 0)               throw new Error('Cost must be positive')

      await inventoryService.postIngredient(formData)
      onSuccess()
      onClose()
      setFormData(DEFAULT_FORM)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error creating ingredient')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal visible={isOpen} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>

          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.headerIcon}>
                <Package size={20} color={C.cream} />
              </View>
              <View>
                <Text style={styles.headerTitle}>Add New Ingredient</Text>
                <Text style={styles.headerSubtitle}>Create a new ingredient manually</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={20} color={C.clay} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {error && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerText}>{error}</Text>
              </View>
            )}

            <Text style={styles.label}>Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter ingredient name"
              placeholderTextColor={C.latte}
              value={formData.name}
              onChangeText={t => handleInputChange('name', t)}
            />

            <Text style={styles.label}>Unit</Text>
            <TouchableOpacity style={styles.picker} onPress={() => setUnitOpen(true)}>
              <Text style={styles.pickerText}>{formData.unit}</Text>
            </TouchableOpacity>

            <View style={styles.row}>
              <View style={styles.half}>
                <Text style={styles.label}>Min Stock</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={String(formData.min_stock)}
                  onChangeText={t => handleInputChange('min_stock', parseFloat(t) || 0)}
                  placeholderTextColor={C.latte}
                />
              </View>
              <View style={styles.half}>
                <Text style={styles.label}>Max Stock</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={String(formData.max_stock)}
                  onChangeText={t => handleInputChange('max_stock', parseFloat(t) || 0)}
                  placeholderTextColor={C.latte}
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.half}>
                <Text style={styles.label}>Cost per Unit ($)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={String(formData.cost_per_unit)}
                  onChangeText={t => handleInputChange('cost_per_unit', parseFloat(t) || 0)}
                  placeholderTextColor={C.latte}
                />
              </View>
              <View style={styles.half}>
                <Text style={styles.label}>Initial Stock</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={String(formData.min_stock)}
                  onChangeText={t => handleInputChange('min_stock', parseFloat(t) || 0)}
                  placeholderTextColor={C.latte}
                />
              </View>
            </View>


            <Text style={styles.label}>Description (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Enter description..."
              placeholderTextColor={C.latte}
              value={formData.description || ''}
              onChangeText={t => handleInputChange('description', t)}
              multiline
              numberOfLines={3}
            />

            <Text style={styles.label}>Expiration Date (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={C.latte}
              value={
                formData.expiration_date
                  ? new Date(formData.expiration_date).toISOString().split('T')[0]
                  : ''
              }
              onChangeText={t =>
                handleInputChange('expiration_date', t ? new Date(t).toISOString() : undefined)
              }
            />

            <View style={styles.actions}>
              <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={C.cream} />
                ) : (
                  <>
                    <Save size={15} color={C.cream} />
                    <Text style={styles.submitButtonText}>Create Ingredient</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>

        <Modal visible={unitOpen} transparent animationType="slide">
          <View style={styles.overlay}>
            <View style={styles.pickerModal}>
              <Text style={styles.pickerModalTitle}>Select Unit</Text>
              {UNITS.map(unit => (
                <TouchableOpacity
                  key={unit}
                  style={[styles.pickerOption, formData.unit === unit && styles.pickerOptionActive]}
                  onPress={() => { handleInputChange('unit', unit); setUnitOpen(false) }}
                >
                  <Text style={[styles.pickerOptionText, formData.unit === unit && styles.pickerOptionTextActive]}>
                    {unit}
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity style={styles.cancelButton} onPress={() => setUnitOpen(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(28,16,8,0.6)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: C.parchment,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    borderWidth: 1.5, borderColor: C.vellum,
    maxHeight: '92%',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1.5, borderBottomColor: C.vellum,
  },
  headerLeft: {
    flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1,
  },
  headerIcon: {
    width: 40, height: 40,
    borderRadius: radius.md,
    backgroundColor: C.brass,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: C.brass,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3, shadowRadius: 6, elevation: 3,
  },
  headerTitle: {
    fontSize: 15, fontWeight: '900',
    color: C.espresso, letterSpacing: 0.2,
  },
  headerSubtitle: {
    fontSize: 11, color: C.clay, fontWeight: '500', marginTop: 2,
  },
  closeButton: {
    padding: 8, borderRadius: radius.xs,
    backgroundColor: C.vellum,
  },

  scroll: { flexGrow: 0 },
  scrollContent: { padding: 20, paddingBottom: 32 },

  errorBanner: {
    backgroundColor: C.tcLight,
    borderWidth: 1, borderColor: C.tcBorder,
    borderRadius: radius.md,
    padding: 12, marginBottom: 16,
  },
  errorBannerText: {
    color: C.terracotta, fontSize: 13, fontWeight: '600',
  },

  label: {
    fontSize: 11, fontWeight: '800',
    color: C.clay, marginBottom: 6, marginTop: 14,
    textTransform: 'uppercase', letterSpacing: 1.2,
  },
  input: {
    borderWidth: 1.5, borderColor: C.vellum,
    borderRadius: radius.md,
    paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 14, color: C.espresso,
    backgroundColor: C.cream,
  },
  textArea: {
    height: 80, textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row', gap: 12,
  },
  half: { flex: 1 },

  picker: {
    borderWidth: 1.5, borderColor: C.vellum,
    borderRadius: radius.md,
    paddingHorizontal: 14, paddingVertical: 11,
    backgroundColor: C.cream,
  },
  pickerText: {
    fontSize: 14, color: C.espresso, fontWeight: '600',
  },
  pickerModal: {
    backgroundColor: C.parchment,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    borderWidth: 1.5, borderColor: C.vellum,
    padding: 24,
  },
  pickerModalTitle: {
    fontSize: 15, fontWeight: '900',
    color: C.espresso, marginBottom: 12,
  },
  pickerOption: {
    paddingVertical: 13, paddingHorizontal: 12,
    borderRadius: radius.md, marginBottom: 4,
  },
  pickerOptionActive: {
    backgroundColor: C.brassLight,
    borderWidth: 1, borderColor: C.brassBorder,
  },
  pickerOptionText: {
    fontSize: 14, color: C.clay, fontWeight: '600',
  },
  pickerOptionTextActive: {
    color: C.brass, fontWeight: '800',
  },

  actions: {
    flexDirection: 'row', gap: 12, marginTop: 24,
  },
  cancelButton: {
    flex: 1,
    borderWidth: 1.5, borderColor: C.vellum,
    borderRadius: radius.pill,
    paddingVertical: 12, alignItems: 'center',
    backgroundColor: C.cream,
  },
  cancelButtonText: {
    fontSize: 14, color: C.clay, fontWeight: '700',
  },
  submitButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center',
    gap: 8,
    backgroundColor: C.brass,
    borderRadius: radius.pill,
    paddingVertical: 12,
    shadowColor: C.brass,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3, shadowRadius: 6, elevation: 3,
  },
  submitButtonDisabled: { opacity: 0.5 },
  submitButtonText: {
    fontSize: 14, color: C.cream,
    fontWeight: '800', letterSpacing: 0.2,
  },
})