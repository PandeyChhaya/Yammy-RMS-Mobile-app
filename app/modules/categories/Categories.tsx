import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, CheckCircle, Edit, Plus, Tags, Trash2, Utensils } from 'lucide-react-native';
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
import categoriesService from './services/categoriesService';

// Modern RMS/POS Light Theme
const C = {
  background: '#F4F6F8', // Soft anti-glare gray
  surface:    '#FFFFFF', // Pure white for cards/modals
  primary:    '#2563EB', // Clear, actionable blue
  textMain:   '#1E293B', // High-contrast slate for readability
  textMuted:  '#64748B', // Softer slate for secondary info
  border:     '#E2E8F0', // Light structure lines
  success:    '#10B981', // Crisp emerald green
  successBg:  '#D1FAE5',
  danger:     '#EF4444', // Clear alert red
  dangerBg:   '#FEE2E2',
  iconBg:     '#F1F5F9', // Subtle background for icons
}

interface Category {
  category_id:          number
  category_name:        string
  category_description?: string
  is_active:            boolean
}

interface CategoryFormData {
  category_name:        string
  category_description: string
  is_active:            boolean
}

const DEFAULT_FORM: CategoryFormData = {
  category_name:        '',
  category_description: '',
  is_active:            true,
}

export default function Categories() {
  const [showAddModal,       setShowAddModal]       = useState(false)
  const [showEditModal,      setShowEditModal]      = useState(false)
  const [editingCategory,    setEditingCategory]    = useState<Category | null>(null)
  const [addForm,            setAddForm]            = useState<CategoryFormData>(DEFAULT_FORM)
  const [editForm,           setEditForm]           = useState<CategoryFormData>(DEFAULT_FORM)
  const [addErrors,          setAddErrors]          = useState<Partial<CategoryFormData>>({})
  const [editErrors,         setEditErrors]         = useState<Partial<CategoryFormData>>({})
  const [showSuccessMessage, setShowSuccessMessage] = useState<string | null>(null)
  const [showErrorMessage,   setShowErrorMessage]   = useState<string | null>(null)

  const queryClient = useQueryClient()

  const { data: categories, isLoading, error } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn:  () => categoriesService.getAllCategory(),
    retry: 3,
  })

  const createCategoryMutation = useMutation({
    mutationFn: (data: CategoryFormData) => categoriesService.postCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      setShowAddModal(false)
      setAddForm(DEFAULT_FORM)
      showSuccess('Category created successfully')
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
      showSuccess('Category updated successfully')
    },
    onError: (err) => showError('Error updating category: ' + err),
  })

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: number) => categoriesService.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      showSuccess('Category deleted successfully')
    },
    onError: (err) => showError('Error deleting category: ' + err),
  })

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
    if (!form.category_name.trim()) errs.category_name = 'Category name is required'
    return errs
  }

  const handleAddNew = () => {
    setAddForm(DEFAULT_FORM)
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
      category_name:        category.category_name,
      category_description: category.category_description || '',
      is_active:            category.is_active,
    })
    setEditErrors({})
    setShowEditModal(true)
  }

  const handleEditSubmit = () => {
    const errs = validateForm(editForm)
    if (Object.keys(errs).length > 0) { setEditErrors(errs); return }
    if (editingCategory) {
      updateCategoryMutation.mutate({ id: String(editingCategory.category_id), data: editForm })
    }
  }

  const handleDelete = (id: number, name: string) => {
    Alert.alert(
      'Delete Category',
      `Are you sure you want to permanently delete "${name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteCategoryMutation.mutate(id) },
      ]
    )
  }

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <View style={styles.loadingIcon}>
          <Utensils size={28} color={C.primary} />
        </View>
        <ActivityIndicator size="large" color={C.primary} style={{ marginTop: 16 }} />
        <Text style={styles.loadingTitle}>Loading Categories...</Text>
      </View>
    )
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <AlertCircle size={48} color={C.danger} />
        <Text style={styles.errorTitle}>System Error</Text>
        <Text style={styles.errorSub}>Unable to fetch categories. Please try again.</Text>
      </View>
    )
  }

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
      <Text style={styles.label}>Category Name <Text style={{color: C.danger}}>*</Text></Text>
      <TextInput
        style={[styles.input, errors.category_name && styles.inputError]}
        placeholder="e.g. Appetizers, Beverages"
        placeholderTextColor={C.textMuted}
        value={form.category_name}
        onChangeText={text => setForm({ ...form, category_name: text })}
      />
      {errors.category_name && <Text style={styles.fieldError}>{errors.category_name}</Text>}

      <Text style={styles.label}>Description</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Brief details about items in this category"
        placeholderTextColor={C.textMuted}
        value={form.category_description}
        onChangeText={text => setForm({ ...form, category_description: text })}
        multiline
        numberOfLines={3}
      />

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

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Menu Categories</Text>
            <Text style={styles.subtitle}>Organize your restaurant's offerings</Text>
          </View>
          <TouchableOpacity style={styles.addButton} onPress={handleAddNew}>
            <Plus size={18} color={C.surface} />
            <Text style={styles.addButtonText}>Add New</Text>
          </TouchableOpacity>
        </View>

        {/* Banners */}
        {showSuccessMessage && (
          <View style={styles.successBanner}>
            <CheckCircle size={18} color={C.success} />
            <Text style={styles.successText}>{showSuccessMessage}</Text>
          </View>
        )}
        {showErrorMessage && (
          <View style={styles.errorBanner}>
            <AlertCircle size={18} color={C.danger} />
            <Text style={styles.errorBannerText}>{showErrorMessage}</Text>
          </View>
        )}

        {/* Empty State */}
        {categories?.length === 0 && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Tags size={36} color={C.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>No Categories Found</Text>
            <Text style={styles.emptySubtitle}>You haven't set up your menu categories yet.</Text>
            <TouchableOpacity style={styles.addButton} onPress={handleAddNew}>
              <Plus size={16} color={C.surface} />
              <Text style={styles.addButtonText}>Create First Category</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* List */}
        {categories?.map((category: Category) => (
          <View key={category.category_id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{category.category_name}</Text>
              <View style={styles.cardActions}>
                <TouchableOpacity style={styles.iconButton} onPress={() => handleEdit(category)}>
                  <Edit size={16} color={C.textMain} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.iconButton, styles.iconButtonDelete]}
                  onPress={() => handleDelete(category.category_id, category.category_name)}
                >
                  <Trash2 size={16} color={C.danger} />
                </TouchableOpacity>
              </View>
            </View>

            {category.category_description && (
              <Text style={styles.cardDescription}>{category.category_description}</Text>
            )}

            <View style={styles.cardFooter}>
              <View style={[styles.statusBadge, category.is_active ? styles.statusActive : styles.statusInactive]}>
                <View style={[styles.statusDot, { backgroundColor: category.is_active ? C.success : C.textMuted }]} />
                <Text style={[styles.statusText, category.is_active ? styles.statusActiveText : styles.statusInactiveText]}>
                  {category.is_active ? 'Active' : 'Inactive'}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Add Modal */}
      <Modal visible={showAddModal} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Add New Category</Text>
            {renderForm(
              addForm, setAddForm, addErrors, handleAddSubmit, () => setShowAddModal(false),
              createCategoryMutation.isPending, 'Save Category', 'Saving...'
            )}
          </View>
        </View>
      </Modal>

      {/* Edit Modal */}
      <Modal visible={showEditModal} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Edit Category</Text>
            {renderForm(
              editForm, setEditForm, editErrors, handleEditSubmit,
              () => { setShowEditModal(false); setEditingCategory(null) },
              updateCategoryMutation.isPending, 'Save Changes', 'Saving...'
            )}
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.background,
  },
  content: {
    padding: 16,
    paddingTop: 56,
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.background,
  },
  loadingIcon: {
    width: 64, height: 64,
    borderRadius: 16,
    backgroundColor: C.surface,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  loadingTitle: {
    fontSize: 16, fontWeight: '600',
    color: C.textMain, marginTop: 12,
  },
  errorTitle: {
    fontSize: 18, fontWeight: '700',
    color: C.danger, marginTop: 12,
  },
  errorSub: {
    fontSize: 14, color: C.textMuted, marginTop: 4,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  title: {
    fontSize: 24, fontWeight: '800',
    color: C.textMain, letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14, color: C.textMuted,
    marginTop: 4,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.primary,
    borderRadius: 8,
    paddingHorizontal: 16, paddingVertical: 10,
    gap: 8,
  },
  addButtonText: {
    color: C.surface, fontWeight: '600',
    fontSize: 14,
  },

  successBanner: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.successBg,
    borderRadius: 8,
    padding: 12, marginBottom: 16, gap: 10,
  },
  successText: {
    color: C.success, fontSize: 14, fontWeight: '500',
  },
  errorBanner: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.dangerBg,
    borderRadius: 8,
    padding: 12, marginBottom: 16, gap: 10,
  },
  errorBannerText: {
    color: C.danger, fontSize: 14, fontWeight: '500',
  },

  emptyState: {
    alignItems: 'center',
    paddingVertical: 64, gap: 12,
    backgroundColor: C.surface,
    borderRadius: 12,
    borderWidth: 1, borderColor: C.border,
    borderStyle: 'dashed',
  },
  emptyIcon: {
    width: 80, height: 80,
    borderRadius: 40,
    backgroundColor: C.iconBg,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 18, fontWeight: '700',
    color: C.textMain,
  },
  emptySubtitle: {
    fontSize: 14, color: C.textMuted, marginBottom: 16, textAlign: 'center'
  },

  card: {
    backgroundColor: C.surface,
    borderRadius: 12,
    padding: 16, marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 8,
  },
  cardTitle: {
    fontSize: 17, fontWeight: '700',
    color: C.textMain, flex: 1,
  },
  cardActions: {
    flexDirection: 'row', gap: 8,
  },
  iconButton: {
    padding: 8, borderRadius: 6,
    backgroundColor: C.iconBg,
  },
  iconButtonDelete: {
    backgroundColor: C.dangerBg,
  },
  cardDescription: {
    fontSize: 14, color: C.textMuted, marginBottom: 12, lineHeight: 20,
  },
  cardFooter: {
    flexDirection: 'row', alignItems: 'center',
    marginTop: 4,
  },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center',
    gap: 6, borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  statusDot: {
    width: 6, height: 6, borderRadius: 3,
  },
  statusActive:   { backgroundColor: C.successBg },
  statusInactive: { backgroundColor: C.iconBg },
  statusText:     { fontSize: 12, fontWeight: '600' },
  statusActiveText:   { color: C.success },
  statusInactiveText: { color: C.textMuted },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)', // Dark slate overlay
    justifyContent: 'center',
    padding: 16,
  },
  modalContainer: {
    backgroundColor: C.surface,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 20, fontWeight: '800',
    color: C.textMain,
    marginBottom: 24,
  },
  modalScroll: { flexGrow: 0 },
  label: {
    fontSize: 13, fontWeight: '600',
    color: C.textMain, marginBottom: 8, marginTop: 16,
  },
  input: {
    borderWidth: 1, borderColor: C.border,
    borderRadius: 8,
    paddingHorizontal: 16, paddingVertical: 12,
    fontSize: 15, color: C.textMain,
    backgroundColor: C.surface,
  },
  inputError: { borderColor: C.danger },
  textArea:   { height: 100, textAlignVertical: 'top' },
  fieldError: {
    fontSize: 12, color: C.danger,
    marginTop: 6, fontWeight: '500',
  },

  modalButtons: {
    flexDirection: 'row', gap: 12,
    marginTop: 32,
  },
  cancelButton: {
    flex: 1,
    borderWidth: 1, borderColor: C.border,
    borderRadius: 8,
    paddingVertical: 14, alignItems: 'center',
    backgroundColor: C.surface,
  },
  cancelButtonText: {
    fontSize: 15, color: C.textMain, fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    backgroundColor: C.primary,
    borderRadius: 8,
    paddingVertical: 14, alignItems: 'center',
  },
  submitButtonDisabled: { opacity: 0.6 },
  submitButtonText: {
    fontSize: 15, color: C.surface,
    fontWeight: '600',
  },
})