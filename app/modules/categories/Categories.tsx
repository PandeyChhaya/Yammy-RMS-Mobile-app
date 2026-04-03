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
  brassGlow:   '#B5822A40',
  sage:        '#3B6E52',
  sageLight:   '#EBF4EE',
  sageBorder:  '#9FCFB4',
  terracotta:  '#A03020',
  tcLight:     '#FAECEA',
  tcBorder:    '#E8A898',
  onDark:      '#FDF6EC',
}

const radius = { xs: 6, sm: 10, md: 14, lg: 18, pill: 100 }

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

  // ── Queries ──────────────────────────────────────────────

  const { data: categories, isLoading, error } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn:  () => categoriesService.getCategory(),
    retry: 3,
  })

  // ── Mutations ────────────────────────────────────────────

  const createCategoryMutation = useMutation({
    mutationFn: (data: CategoryFormData) => categoriesService.postCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      setShowAddModal(false)
      setAddForm(DEFAULT_FORM)
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
    mutationFn: (id: number) => categoriesService.deleteCategory(id),
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
    if (!form.category_name.trim()) errs.category_name = 'Name is required'
    return errs
  }

  // ── Handlers ─────────────────────────────────────────────

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
        <View style={styles.loadingIcon}>
          <Utensils size={26} color={C.brass} />
        </View>
        <ActivityIndicator size="large" color={C.brass} style={{ marginTop: 20 }} />
        <Text style={styles.loadingTitle}>Loading Categories…</Text>
      </View>
    )
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <AlertCircle size={48} color={C.terracotta} />
        <Text style={styles.errorTitle}>Error loading categories</Text>
        <Text style={styles.errorSub}>{String(error)}</Text>
      </View>
    )
  }

  // ── Form Component ───────────────────────────────────────

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
        style={[styles.input, errors.category_name ? styles.inputError : null]}
        placeholder="Category name"
        placeholderTextColor={C.latte}
        value={form.category_name}
        onChangeText={text => setForm({ ...form, category_name: text })}
      />
      {errors.category_name && <Text style={styles.fieldError}>{errors.category_name}</Text>}

      {/* Description */}
      <Text style={styles.label}>Description</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Optional description"
        placeholderTextColor={C.latte}
        value={form.category_description}
        onChangeText={text => setForm({ ...form, category_description: text })}
        multiline
        numberOfLines={3}
      />

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
            <Plus size={16} color={C.cream} />
            <Text style={styles.addButtonText}>New Category</Text>
          </TouchableOpacity>
        </View>

        {/* Success Banner */}
        {showSuccessMessage && (
          <View style={styles.successBanner}>
            <CheckCircle size={16} color={C.sage} />
            <Text style={styles.successText}>{showSuccessMessage}</Text>
          </View>
        )}

        {/* Error Banner */}
        {showErrorMessage && (
          <View style={styles.errorBanner}>
            <AlertCircle size={16} color={C.terracotta} />
            <Text style={styles.errorBannerText}>{showErrorMessage}</Text>
          </View>
        )}

        {/* Empty State */}
        {categories?.length === 0 && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Tags size={32} color={C.brass} />
            </View>
            <Text style={styles.emptyTitle}>No categories yet</Text>
            <Text style={styles.emptySubtitle}>Start by creating your first category</Text>
            <TouchableOpacity style={styles.addButton} onPress={handleAddNew}>
              <Plus size={14} color={C.cream} />
              <Text style={styles.addButtonText}>Create a category</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Categories List */}
        {categories?.map((category: Category) => (
          <View key={category.category_id} style={styles.card}>

            <View style={styles.cardHeader}>
              <View style={styles.cardTitleRow}>
                <Text style={styles.cardTitle}>{category.category_name}</Text>
              </View>
              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={() => handleEdit(category)}
                >
                  <Edit size={15} color={C.brass} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.iconButton, styles.iconButtonDelete]}
                  onPress={() => handleDelete(category.category_id, category.category_name)}
                >
                  <Trash2 size={15} color={C.terracotta} />
                </TouchableOpacity>
              </View>
            </View>

            {category.category_description && (
              <Text style={styles.cardDescription}>{category.category_description}</Text>
            )}

            <View style={styles.cardFooter}>
              <View style={[
                styles.statusBadge,
                category.is_active ? styles.statusActive : styles.statusInactive,
              ]}>
                <View style={[
                  styles.statusDot,
                  { backgroundColor: category.is_active ? C.sage : C.clay },
                ]} />
                <Text style={[
                  styles.statusText,
                  category.is_active ? styles.statusActiveText : styles.statusInactiveText,
                ]}>
                  {category.is_active ? 'Active' : 'Inactive'}
                </Text>
              </View>
            </View>
          </View>
        ))}

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
    backgroundColor: C.cream,
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
    backgroundColor: C.cream,
    gap: 12,
  },
  loadingIcon: {
    width: 58, height: 58,
    borderRadius: radius.md,
    backgroundColor: C.brassLight,
    borderWidth: 1.5, borderColor: C.brassBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  loadingTitle: {
    fontSize: 15, fontWeight: '700',
    color: C.espresso, marginTop: 8,
  },
  errorTitle: {
    fontSize: 16, fontWeight: '700',
    color: C.terracotta,
  },
  errorSub: {
    fontSize: 13,
    color: C.clay,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  title: {
    fontSize: 22, fontWeight: '900',
    color: C.espresso, letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 13, color: C.clay,
    marginTop: 3, fontWeight: '500',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.brass,
    borderRadius: radius.pill,
    paddingHorizontal: 14, paddingVertical: 9,
    gap: 6,
    shadowColor: C.brass,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  addButtonText: {
    color: C.cream, fontWeight: '700',
    fontSize: 13, letterSpacing: 0.2,
  },

  // Banners
  successBanner: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.sageLight,
    borderWidth: 1, borderColor: C.sageBorder,
    borderRadius: radius.md,
    padding: 12, marginBottom: 16, gap: 8,
  },
  successText: {
    color: C.sage, fontSize: 13, fontWeight: '600',
  },
  errorBanner: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.tcLight,
    borderWidth: 1, borderColor: C.tcBorder,
    borderRadius: radius.md,
    padding: 12, marginBottom: 16, gap: 8,
  },
  errorBannerText: {
    color: C.terracotta, fontSize: 13, fontWeight: '600',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 56, gap: 12,
  },
  emptyIcon: {
    width: 72, height: 72,
    borderRadius: radius.lg,
    backgroundColor: C.brassLight,
    borderWidth: 1.5, borderColor: C.brassBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 17, fontWeight: '800',
    color: C.espresso,
  },
  emptySubtitle: {
    fontSize: 13, color: C.clay,
  },

  // Card
  card: {
    backgroundColor: C.parchment,
    borderRadius: radius.md,
    borderWidth: 1.5, borderColor: C.vellum,
    padding: 14, marginBottom: 12,
    shadowColor: C.espresso,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 8,
  },
  cardTitleRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: 8, flex: 1,
  },
  cardTitle: {
    fontSize: 15, fontWeight: '700',
    color: C.espresso,
  },
  cardActions: {
    flexDirection: 'row', gap: 6,
  },
  iconButton: {
    padding: 7, borderRadius: radius.xs,
    backgroundColor: C.brassLight,
    borderWidth: 1, borderColor: C.brassBorder,
  },
  iconButtonDelete: {
    backgroundColor: C.tcLight,
    borderColor: C.tcBorder,
  },
  cardDescription: {
    fontSize: 12, color: C.clay, marginBottom: 10,
  },
  cardFooter: {
    flexDirection: 'row', alignItems: 'center',
    marginTop: 8,
  },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center',
    gap: 5, borderRadius: radius.pill,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  statusDot: {
    width: 5, height: 5, borderRadius: 3,
  },
  statusActive:   { backgroundColor: C.sageLight },
  statusInactive: { backgroundColor: C.vellum },
  statusText:     { fontSize: 10, fontWeight: '700' },
  statusActiveText:   { color: C.sage },
  statusInactiveText: { color: C.clay },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(28,16,8,0.6)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: C.parchment,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    borderWidth: 1.5, borderColor: C.vellum,
    padding: 24, maxHeight: '90%',
  },
  modalTitle: {
    fontSize: 16, fontWeight: '900',
    color: C.espresso, letterSpacing: 0.3,
    marginBottom: 20,
  },
  modalScroll: { flexGrow: 0 },
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
  inputError: { borderColor: C.tcBorder },
  textArea:   { height: 80, textAlignVertical: 'top' },
  fieldError: {
    fontSize: 11, color: C.terracotta,
    marginTop: 4, fontWeight: '600',
  },

  // Modal Buttons
  modalButtons: {
    flexDirection: 'row', gap: 12,
    marginTop: 24, marginBottom: 8,
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
    backgroundColor: C.brass,
    borderRadius: radius.pill,
    paddingVertical: 12, alignItems: 'center',
    shadowColor: C.brass,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  submitButtonDisabled: { opacity: 0.5 },
  submitButtonText: {
    fontSize: 14, color: C.cream,
    fontWeight: '800', letterSpacing: 0.2,
  },
})