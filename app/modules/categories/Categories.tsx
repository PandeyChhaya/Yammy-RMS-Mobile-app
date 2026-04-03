import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, CheckCircle, Edit, Plus, Tags, Trash2 } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTaxSettings } from '../../../shared/hooks/useTaxSettings';
import categoriesService from './services/categoriesService';

interface Category {
  id: string
  name: string
  description?: string
  color: string
  tax_rate_id?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

interface CategoryFormData {
  name: string
  description: string
  color: string
  tax_rate_id: string
}

const COLOR_PRESETS = [
  '#C41E1E', '#D4A843', '#2E7D32', '#1565C0',
  '#7B1FA2', '#E65100', '#00838F', '#37474F',
]

const DEFAULT_FORM: CategoryFormData = {
  name: '',
  description: '',
  color: '#C41E1E',
  tax_rate_id: '',
}

export default function Categories() {
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [addForm, setAddForm] = useState<CategoryFormData>(DEFAULT_FORM)
  const [editForm, setEditForm] = useState<CategoryFormData>(DEFAULT_FORM)
  const [addErrors, setAddErrors] = useState<Partial<CategoryFormData>>({})
  const [editErrors, setEditErrors] = useState<Partial<CategoryFormData>>({})
  const [showSuccessMessage, setShowSuccessMessage] = useState<string | null>(null)
  const [showErrorMessage, setShowErrorMessage] = useState<string | null>(null)

  const queryClient = useQueryClient()
  const { currentConfig } = useTaxSettings()

  const taxRateOptions = currentConfig.tax_rates.map(rate => ({
    value: rate.id,
    label: `${rate.name} (${rate.rate}%)`,
    isDefault: rate.is_default,
  }))

  const defaultTaxRate =
    currentConfig.tax_rates.find(r => r.is_default)?.id ||
    currentConfig.tax_rates[0]?.id ||
    ''

  // ── Queries ──────────────────────────────────────────────

  const { data: categories, isLoading, error } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: () => categoriesService.getCategory(),
    retry: 3,
  })

  // ── Mutations ────────────────────────────────────────────

  const createCategoryMutation = useMutation({
    mutationFn: (data: CategoryFormData) => categoriesService.postCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      setShowAddModal(false)
      setAddForm({ ...DEFAULT_FORM, tax_rate_id: defaultTaxRate })
      showSuccess('Category created successfully!')
    },
    onError: (err) => showError('Error creating category: ' + err),
  })

  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CategoryFormData }) =>
      categoriesService.putCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      setShowEditModal(false)
      setEditingCategory(null)
      showSuccess('Category updated successfully!')
    },
    onError: (err) => showError('Error updating category: ' + err),
  })

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: string) => categoriesService.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      showSuccess('Category deleted successfully!')
    },
    onError: (err) => showError('Error deleting category: ' + err),
  })

  // ── Helpers ──────────────────────────────────────────────

  const showSuccess = (msg: string) => {
    setShowSuccessMessage(msg)
    setTimeout(() => setShowSuccessMessage(null), 3000)
  }

  const showError = (msg: string) => {
    setShowErrorMessage(msg)
    setTimeout(() => setShowErrorMessage(null), 5000)
  }

  const validateForm = (form: CategoryFormData): Partial<CategoryFormData> => {
    const errs: Partial<CategoryFormData> = {}
    if (!form.name.trim()) errs.name = 'Name is required'
    if (!form.color.trim()) errs.color = 'Color is required'
    return errs
  }

  // ── Handlers ─────────────────────────────────────────────

  const handleAddNew = () => {
    setAddForm({ ...DEFAULT_FORM, tax_rate_id: defaultTaxRate })
    setAddErrors({})
    setShowAddModal(true)
  }

  const handleAddSubmit = () => {
    const errs = validateForm(addForm)
    if (Object.keys(errs).length > 0) { setAddErrors(errs); return }
    createCategoryMutation.mutate(addForm)
  }

  const handleEdit = (category: Category) => {
    setEditingCategory(category)
    setEditForm({
      name: category_name,
      description: category_description|| '',
      color: category.color,
      tax_rate_id: category.tax_rate_id || defaultTaxRate,
    })
    setEditErrors({})
    setShowEditModal(true)
  }

  const handleEditSubmit = () => {
    const errs = validateForm(editForm)
    if (Object.keys(errs).length > 0) { setEditErrors(errs); return }
    if (editingCategory) {
      updateCategoryMutation.mutate({ id: editingCategory_id, data: editForm })
    }
  }

  const handleDelete = (id: string, name: string) => {
    Alert.alert(
      'Delete Category',
      `Are you sure you want to delete "${name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteCategoryMutation.mutate(id) },
      ]
    )
  }

  // ── Loading / Error States ───────────────────────────────

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#C41E1E" />
      </View>
    )
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <AlertCircle size={48} color="#C41E1E" />
        <Text style={styles.errorTitle}>Error loading categories</Text>
        <Text style={styles.errorSub}>{String(error)}</Text>
      </View>
    )
  }

  // ── Form Component ───────────────

  const renderForm = (
    form: CategoryFormData,
    setForm: (f: CategoryFormData) => void,
    errors: Partial<CategoryFormData>,
    onSubmit: () => void,
    onCancel: () => void,
    isPending: boolean,
    submitLabel: string,
    pendingLabel: string,
  ) => (
    <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
      {/* Name */}
      <Text style={styles.label}>Name *</Text>
      <TextInput
        style={[styles.input, errors.name ? styles.inputError : null]}
        placeholder="Category name"
        placeholderTextColor="#9E8E50"
        value={form.name}
        onChangeText={text => setForm({ ...form, name: text })}
      />
      {errors.name && <Text style={styles.fieldError}>{errors.name}</Text>}

      {/* Description */}
      <Text style={styles.label}>Description</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Optional description"
        placeholderTextColor="#9E8E50"
        value={form.description}
        onChangeText={text => setForm({ ...form, description: text })}
        multiline
        numberOfLines={3}
      />

      {/* Color */}
      <Text style={styles.label}>Color *</Text>
      <View style={styles.colorRow}>
        {COLOR_PRESETS.map(c => (
          <TouchableOpacity
            key={c}
            style={[
              styles.colorSwatch,
              { backgroundColor: c },
              form.color === c && styles.colorSwatchSelected,
            ]}
            onPress={() => setForm({ ...form, color: c })}
          />
        ))}
      </View>
      <TextInput
        style={[styles.input, { marginTop: 8 }]}
        placeholder="#C41E1E"
        placeholderTextColor="#9E8E50"
        value={form.color}
        onChangeText={text => setForm({ ...form, color: text })}
        autoCapitalize="none"
      />
      {errors.color && <Text style={styles.fieldError}>{errors.color}</Text>}

      {/* Tax Rate */}
      <Text style={styles.label}>Tax Rate</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.taxRateScroll}>
        {taxRateOptions.map(option => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.taxPill,
              form.tax_rate_id === option.value && styles.taxPillActive,
            ]}
            onPress={() => setForm({ ...form, tax_rate_id: option.value })}
          >
            <Text
              style={[
                styles.taxPillText,
                form.tax_rate_id === option.value && styles.taxPillTextActive,
              ]}
            >
              {option.label}{option.isDefault ? ' (Default)' : ''}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Buttons */}
      <View style={styles.modalButtons}>
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.submitButton, isPending && styles.submitButtonDisabled]}
          onPress={onSubmit}
          disabled={isPending}
        >
          <Text style={styles.submitButtonText}>
            {isPending ? pendingLabel : submitLabel}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )

  // ── Main Render ──────────────────────────────────────────

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Categories</Text>
            <Text style={styles.subtitle}>Manage your product categories</Text>
          </View>
          <TouchableOpacity style={styles.addButton} onPress={handleAddNew}>
            <Plus size={16} color="#FFFFFF" />
            <Text style={styles.addButtonText}>New Category</Text>
          </TouchableOpacity>
        </View>

        {/* Success Message */}
        {showSuccessMessage && (
          <View style={styles.successBanner}>
            <CheckCircle size={18} color="#2E7D32" />
            <Text style={styles.successText}>{showSuccessMessage}</Text>
          </View>
        )}

        {/* Error Message */}
        {showErrorMessage && (
          <View style={styles.errorBanner}>
            <AlertCircle size={18} color="#C41E1E" />
            <Text style={styles.errorBannerText}>{showErrorMessage}</Text>
          </View>
        )}

        {/* Empty State */}
        {categories?.length === 0 && (
          <View style={styles.emptyState}>
            <Tags size={48} color="#E8D88A" />
            <Text style={styles.emptyTitle}>No categories</Text>
            <Text style={styles.emptySubtitle}>Start by creating your first category</Text>
            <TouchableOpacity style={styles.addButton} onPress={handleAddNew}>
              <Text style={styles.addButtonText}>Create a category</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Categories Grid */}
        {categories?.map(category => {
          const taxRate = currentConfig.tax_rates.find(r => r.id === category.tax_rate_id)
          return (
            <View key={category.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleRow}>
                  <View style={[styles.colorDot, { backgroundColor: category.color }]} />
                  <Text style={styles.cardTitle}>{category.name}</Text>
                </View>
                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={styles.iconButton}
                    onPress={() => handleEdit(category)}
                  >
                    <Edit size={16} color="#9E8E50" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.iconButton}
                    onPress={() => handleDelete(category.id, category.name)}
                  >
                    <Trash2 size={16} color="#C41E1E" />
                  </TouchableOpacity>
                </View>
              </View>

              {category.description && (
                <Text style={styles.cardDescription}>{category.description}</Text>
              )}

              <View style={styles.cardFooter}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardMeta}>
                    Tax:{' '}
                    <Text style={styles.cardMetaBold}>
                      {taxRate ? `${taxRate.name} (${taxRate.rate}%)` : 'Not defined'}
                    </Text>
                  </Text>
                  <Text style={styles.cardMeta}>
                    Created {new Date(category.created_at).toLocaleDateString('en-US')}
                  </Text>
                </View>
                <View style={[
                  styles.statusBadge,
                  category.is_active ? styles.statusActive : styles.statusInactive,
                ]}>
                  <Text style={[
                    styles.statusText,
                    category.is_active ? styles.statusActiveText : styles.statusInactiveText,
                  ]}>
                    {category.is_active ? 'Active' : 'Inactive'}
                  </Text>
                </View>
              </View>
            </View>
          )
        })}
      </ScrollView>

      {/* Add Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>New Category</Text>
            {renderForm(
              addForm, setAddForm, addErrors,
              handleAddSubmit,
              () => setShowAddModal(false),
              createCategoryMutation.isPending,
              'Create', 'Creating...',
            )}
          </View>
        </View>
      </Modal>

      {/* Edit Modal */}
      <Modal visible={showEditModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Edit Category</Text>
            {renderForm(
              editForm, setEditForm, editErrors,
              handleEditSubmit,
              () => { setShowEditModal(false); setEditingCategory(null) },
              updateCategoryMutation.isPending,
              'Update', 'Updating...',
            )}
          </View>
        </View>
      </Modal>
    </View>
  )
}

// ── Styles ───────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDFAF3',
  },
  content: {
    padding: 16,
    paddingTop: 52,
    paddingBottom: 32,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF1A8',
    gap: 12,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#C41E1E',
    fontFamily: 'Inter',
  },
  errorSub: {
    fontSize: 13,
    color: '#5C5436',
    fontFamily: 'Inter',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    fontFamily: 'Inter',
  },
  subtitle: {
    fontSize: 14,
    color: '#5C5436',
    fontFamily: 'Inter',
    marginTop: 2,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#C41E1E',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 6,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
    fontFamily: 'Inter',
  },

  // Banners
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    borderWidth: 1,
    borderColor: '#A5D6A7',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  successText: {
    color: '#2E7D32',
    fontSize: 14,
    fontFamily: 'Inter',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    borderWidth: 1,
    borderColor: '#FFCDD2',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  errorBannerText: {
    color: '#C41E1E',
    fontSize: 14,
    fontFamily: 'Inter',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Inter',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#5C5436',
    fontFamily: 'Inter',
  },

  // Card
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E8D88A',
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  colorDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Inter',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 4,
  },
  iconButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#FEF1A8',
  },
  cardDescription: {
    fontSize: 13,
    color: '#5C5436',
    fontFamily: 'Inter',
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  cardMeta: {
    fontSize: 12,
    color: '#5C5436',
    fontFamily: 'Inter',
  },
  cardMetaBold: {
    fontWeight: '600',
    color: '#1A1A1A',
  },
  statusBadge: {
    borderRadius: 9999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusActive: {
    backgroundColor: '#E8F5E9',
  },
  statusInactive: {
    backgroundColor: '#F5F5F5',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  statusActiveText: {
    color: '#2E7D32',
  },
  statusInactiveText: {
    color: '#757575',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '90%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    fontFamily: 'Inter',
    marginBottom: 20,
  },
  modalScroll: {
    flexGrow: 0,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Inter',
    marginBottom: 6,
    marginTop: 14,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E8D88A',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1A1A1A',
    backgroundColor: '#FFFDF0',
    fontFamily: 'Inter',
  },
  inputError: {
    borderColor: '#C41E1E',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  fieldError: {
    fontSize: 12,
    color: '#C41E1E',
    fontFamily: 'Inter',
    marginTop: 4,
  },

  // Color Swatches
  colorRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  colorSwatch: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorSwatchSelected: {
    borderColor: '#1A1A1A',
  },

  // Tax Rate Pills
  taxRateScroll: {
    marginTop: 4,
  },
  taxPill: {
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#E8D88A',
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
    backgroundColor: '#FEF1A8',
  },
  taxPillActive: {
    backgroundColor: '#C41E1E',
    borderColor: '#C41E1E',
  },
  taxPillText: {
    fontSize: 13,
    color: '#5C5436',
    fontFamily: 'Inter',
  },
  taxPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },

  // Modal Buttons
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    marginBottom: 8,
  },
  cancelButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E8D88A',
    borderRadius: 25,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    color: '#5C5436',
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#C41E1E',
    borderRadius: 25,
    paddingVertical: 12,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '600',
    fontFamily: 'Inter',
  },
})