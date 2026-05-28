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

// ─── Design Tokens ────────────────────────────────────────────────────────────
const C = {
  bg:          '#0A0A0A',
  surface:     '#1A1A1A',
  card:        '#1E1E1E',
  cardBorder:  '#2E2E2E',
  elevated:    '#2C2C2C',
  inputBg:     '#141414',
  accent:      '#FF6B2C',
  accentDim:   '#FF6B2C22',
  accentBorder:'#FF6B2C55',
  success:     '#22C55E',
  successDim:  '#22C55E18',
  successBdr:  '#22C55E44',
  danger:      '#EF4444',
  dangerDim:   '#EF444418',
  dangerBdr:   '#EF444444',
  textPrimary: '#F5F5F5',
  textSub:     '#A0A0A0',
  textMuted:   '#5A5A5A',
  placeholder: '#3A3A3A',
}

const R = { xs: 8, sm: 12, md: 14, lg: 18, xl: 24, pill: 100 }

// ─── Types ────────────────────────────────────────────────────────────────────
type UserRole = 'super_admin' | 'admin' | 'cashier' | 'waiter' | 'kitchen' | 'customer'

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

// ─── Role Permissions ─────────────────────────────────────────────────────────
const canManage = (role: UserRole) =>
  role === 'super_admin' || role === 'admin'

// ─── Component ────────────────────────────────────────────────────────────────
interface CategoriesProps {
  userRole?: UserRole
}

export default function Categories({ userRole = 'admin' }: CategoriesProps) {
  const canEdit = canManage(userRole)

  const [showAddModal,       setShowAddModal]       = useState(false)
  const [showEditModal,      setShowEditModal]      = useState(false)
  const [editingCategory,    setEditingCategory]    = useState<Category | null>(null)
  const [addForm,            setAddForm]            = useState<CategoryFormData>(DEFAULT_FORM)
  const [editForm,           setEditForm]           = useState<CategoryFormData>(DEFAULT_FORM)
  const [addErrors,          setAddErrors]          = useState<Partial<CategoryFormData>>({})
  const [editErrors,         setEditErrors]         = useState<Partial<CategoryFormData>>({})
  const [successMsg,         setSuccessMsg]         = useState<string | null>(null)
  const [errorMsg,           setErrorMsg]           = useState<string | null>(null)

  const queryClient = useQueryClient()

  const { data: categories, isLoading, error } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn:  () => categoriesService.getAllCategory(),
    retry: 3,
  })

  const createMutation = useMutation({
    mutationFn: (data: CategoryFormData) => categoriesService.postCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      setShowAddModal(false)
      setAddForm(DEFAULT_FORM)
      flash('success', 'Category created successfully!')
    },
    onError: (err) => flash('error', 'Error creating category: ' + err),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CategoryFormData }) =>
      categoriesService.putCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      setShowEditModal(false)
      setEditingCategory(null)
      flash('success', 'Category updated!')
    },
    onError: (err) => flash('error', 'Error updating category: ' + err),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => categoriesService.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      flash('success', 'Category deleted.')
    },
    onError: (err) => flash('error', 'Error deleting: ' + err),
  })

  const flash = (type: 'success' | 'error', msg: string) => {
    if (type === 'success') {
      setSuccessMsg(msg)
      setTimeout(() => setSuccessMsg(null), 3000)
    } else {
      setErrorMsg(msg)
      setTimeout(() => setErrorMsg(null), 5000)
    }
  }

  const validate = (form: CategoryFormData): Partial<CategoryFormData> => {
    const errs: Partial<CategoryFormData> = {}
    if (!form.category_name.trim()) errs.category_name = 'Name is required'
    return errs
  }

  const handleAddNew = () => {
    setAddForm(DEFAULT_FORM)
    setAddErrors({})
    setShowAddModal(true)
  }

  const handleAddSubmit = () => {
    const errs = validate(addForm)
    if (Object.keys(errs).length > 0) { setAddErrors(errs); return }
    createMutation.mutate(addForm)
  }

  const handleEdit = (cat: Category) => {
    setEditingCategory(cat)
    setEditForm({
      category_name:        cat.category_name,
      category_description: cat.category_description || '',
      is_active:            cat.is_active,
    })
    setEditErrors({})
    setShowEditModal(true)
  }

  const handleEditSubmit = () => {
    const errs = validate(editForm)
    if (Object.keys(errs).length > 0) { setEditErrors(errs); return }
    if (editingCategory) {
      updateMutation.mutate({ id: String(editingCategory.category_id), data: editForm })
    }
  }

  const handleDelete = (id: number, name: string) => {
    Alert.alert(
      'Delete Category',
      `Remove "${name}" permanently?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate(id) },
      ]
    )
  }

  // ─── Loading ───────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <View style={styles.centered}>
        <View style={styles.loadingIcon}>
          <Utensils size={24} color={C.accent} />
        </View>
        <ActivityIndicator size="large" color={C.accent} style={{ marginTop: 16 }} />
        <Text style={styles.loadingText}>Loading Categories…</Text>
      </View>
    )
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <AlertCircle size={44} color={C.danger} />
        <Text style={styles.errorTitle}>Failed to load</Text>
        <Text style={styles.errorSub}>{String(error)}</Text>
      </View>
    )
  }

  // ─── Form renderer ─────────────────────────────────────────────────────────
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

      <Text style={styles.label}>Category Name *</Text>
      <TextInput
        style={[styles.input, errors.category_name ? styles.inputError : null]}
        placeholder="e.g. Starters, Mains, Desserts"
        placeholderTextColor={C.textMuted}
        value={form.category_name}
        onChangeText={t => setForm({ ...form, category_name: t })}
      />
      {errors.category_name && (
        <Text style={styles.fieldError}>{errors.category_name}</Text>
      )}

      <Text style={styles.label}>Description</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Short description (optional)"
        placeholderTextColor={C.textMuted}
        value={form.category_description}
        onChangeText={t => setForm({ ...form, category_description: t })}
        multiline
        numberOfLines={3}
      />

      {/* Active Toggle */}
      <View style={styles.toggleRow}>
        <View>
          <Text style={styles.toggleLabel}>Active</Text>
          <Text style={styles.toggleSub}>Visible to customers & staff</Text>
        </View>
        <TouchableOpacity
          style={[styles.toggle, form.is_active && styles.toggleOn]}
          onPress={() => setForm({ ...form, is_active: !form.is_active })}
        >
          <View style={[styles.toggleThumb, form.is_active && styles.toggleThumbOn]} />
        </TouchableOpacity>
      </View>

      <View style={styles.modalButtons}>
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.submitButton, isPending && { opacity: 0.5 }]}
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

  // ─── Main Render ───────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Categories</Text>
            <Text style={styles.subtitle}>
              {canEdit ? 'Manage your menu categories' : 'Browse all categories'}
            </Text>
          </View>
          {canEdit && (
            <TouchableOpacity style={styles.addButton} onPress={handleAddNew}>
              <Plus size={15} color="#fff" />
              <Text style={styles.addButtonText}>New</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Role pill */}
        <View style={styles.rolePill}>
          <View style={[styles.roleDot, { backgroundColor: canEdit ? C.accent : C.success }]} />
          <Text style={styles.roleText}>
            {userRole.replace('_', ' ').toUpperCase()} — {canEdit ? 'Full Access' : 'View Only'}
          </Text>
        </View>

        {/* Banners */}
        {successMsg && (
          <View style={styles.successBanner}>
            <CheckCircle size={14} color={C.success} />
            <Text style={styles.successText}>{successMsg}</Text>
          </View>
        )}
        {errorMsg && (
          <View style={styles.errorBanner}>
            <AlertCircle size={14} color={C.danger} />
            <Text style={styles.errorBannerText}>{errorMsg}</Text>
          </View>
        )}

        {/* Empty state */}
        {categories?.length === 0 && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Tags size={28} color={C.accent} />
            </View>
            <Text style={styles.emptyTitle}>No categories yet</Text>
            <Text style={styles.emptySub}>
              {canEdit ? 'Create your first category to get started' : 'No categories have been added'}
            </Text>
            {canEdit && (
              <TouchableOpacity style={styles.addButton} onPress={handleAddNew}>
                <Plus size={14} color="#fff" />
                <Text style={styles.addButtonText}>Create Category</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Category Cards */}
        {categories?.map((cat: Category) => (
          <View key={cat.category_id} style={styles.card}>
            {/* Orange left accent bar */}
            <View style={styles.cardAccentBar} />

            <View style={styles.cardInner}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{cat.category_name}</Text>
                  {cat.category_description ? (
                    <Text style={styles.cardDesc} numberOfLines={2}>
                      {cat.category_description}
                    </Text>
                  ) : null}
                </View>

                {canEdit && (
                  <View style={styles.cardActions}>
                    <TouchableOpacity
                      style={styles.iconBtn}
                      onPress={() => handleEdit(cat)}
                    >
                      <Edit size={14} color={C.accent} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.iconBtn, styles.iconBtnDanger]}
                      onPress={() => handleDelete(cat.category_id, cat.category_name)}
                    >
                      <Trash2 size={14} color={C.danger} />
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              <View style={styles.cardFooter}>
                <View style={[
                  styles.statusBadge,
                  cat.is_active ? styles.statusActive : styles.statusInactive,
                ]}>
                  <View style={[
                    styles.statusDot,
                    { backgroundColor: cat.is_active ? C.success : C.textMuted },
                  ]} />
                  <Text style={[
                    styles.statusText,
                    { color: cat.is_active ? C.success : C.textMuted },
                  ]}>
                    {cat.is_active ? 'Active' : 'Inactive'}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        ))}

      </ScrollView>

      {/* Add Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>New Category</Text>
            {renderForm(
              addForm, setAddForm, addErrors,
              handleAddSubmit,
              () => setShowAddModal(false),
              createMutation.isPending,
              'Create Category', 'Creating…',
            )}
          </View>
        </View>
      </Modal>

      {/* Edit Modal */}
      <Modal visible={showEditModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Edit Category</Text>
            {renderForm(
              editForm, setEditForm, editErrors,
              handleEditSubmit,
              () => { setShowEditModal(false); setEditingCategory(null) },
              updateMutation.isPending,
              'Save Changes', 'Saving…',
            )}
          </View>
        </View>
      </Modal>
    </View>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
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
    backgroundColor: C.bg,
    gap: 12,
  },
  loadingIcon: {
    width: 56, height: 56,
    borderRadius: R.md,
    backgroundColor: C.accentDim,
    borderWidth: 1.5, borderColor: C.accentBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  loadingText: {
    fontSize: 14, fontWeight: '700',
    color: C.textSub, marginTop: 8,
  },
  errorTitle: {
    fontSize: 16, fontWeight: '800',
    color: C.danger,
  },
  errorSub: {
    fontSize: 12, color: C.textMuted,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    fontSize: 26, fontWeight: '900',
    color: C.textPrimary, letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 12, color: C.textMuted,
    marginTop: 2, fontWeight: '500',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.accent,
    borderRadius: R.pill,
    paddingHorizontal: 16, paddingVertical: 10,
    gap: 6,
    shadowColor: C.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  addButtonText: {
    color: '#fff', fontWeight: '800',
    fontSize: 13, letterSpacing: 0.3,
  },

  // Role pill
  rolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: C.surface,
    borderWidth: 1, borderColor: C.cardBorder,
    borderRadius: R.pill,
    paddingHorizontal: 10, paddingVertical: 5,
    marginBottom: 20, gap: 6,
  },
  roleDot: {
    width: 6, height: 6, borderRadius: 3,
  },
  roleText: {
    fontSize: 10, fontWeight: '700',
    color: C.textSub, letterSpacing: 0.8,
  },

  // Banners
  successBanner: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.successDim,
    borderWidth: 1, borderColor: C.successBdr,
    borderRadius: R.md,
    padding: 12, marginBottom: 14, gap: 8,
  },
  successText: {
    color: C.success, fontSize: 13, fontWeight: '600',
  },
  errorBanner: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.dangerDim,
    borderWidth: 1, borderColor: C.dangerBdr,
    borderRadius: R.md,
    padding: 12, marginBottom: 14, gap: 8,
  },
  errorBannerText: {
    color: C.danger, fontSize: 13, fontWeight: '600',
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60, gap: 12,
  },
  emptyIcon: {
    width: 68, height: 68,
    borderRadius: R.lg,
    backgroundColor: C.accentDim,
    borderWidth: 1.5, borderColor: C.accentBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 17, fontWeight: '800',
    color: C.textPrimary,
  },
  emptySub: {
    fontSize: 13, color: C.textMuted,
    textAlign: 'center', paddingHorizontal: 32,
  },

  // Card
  card: {
    flexDirection: 'row',
    backgroundColor: C.card,
    borderRadius: R.md,
    borderWidth: 1, borderColor: C.cardBorder,
    marginBottom: 10,
    overflow: 'hidden',
  },
  cardAccentBar: {
    width: 3,
    backgroundColor: C.accent,
    borderTopLeftRadius: R.md,
    borderBottomLeftRadius: R.md,
  },
  cardInner: {
    flex: 1,
    padding: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 15, fontWeight: '800',
    color: C.textPrimary, letterSpacing: 0.2,
  },
  cardDesc: {
    fontSize: 12, color: C.textSub,
    marginTop: 3, lineHeight: 17,
  },
  cardActions: {
    flexDirection: 'row', gap: 6, marginLeft: 10,
  },
  iconBtn: {
    padding: 7, borderRadius: R.xs,
    backgroundColor: C.accentDim,
    borderWidth: 1, borderColor: C.accentBorder,
  },
  iconBtnDanger: {
    backgroundColor: C.dangerDim,
    borderColor: C.dangerBdr,
  },
  cardFooter: {
    flexDirection: 'row', alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center',
    gap: 5, borderRadius: R.pill,
    paddingHorizontal: 9, paddingVertical: 4,
  },
  statusActive:   { backgroundColor: C.successDim },
  statusInactive: { backgroundColor: C.elevated },
  statusDot: {
    width: 5, height: 5, borderRadius: 3,
  },
  statusText: {
    fontSize: 10, fontWeight: '700', letterSpacing: 0.5,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: C.surface,
    borderTopLeftRadius: R.xl,
    borderTopRightRadius: R.xl,
    borderWidth: 1, borderColor: C.cardBorder,
    padding: 24, maxHeight: '90%',
  },
  modalHandle: {
    width: 36, height: 4,
    borderRadius: R.pill,
    backgroundColor: C.elevated,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18, fontWeight: '900',
    color: C.textPrimary, letterSpacing: 0.4,
    marginBottom: 4,
  },
  modalScroll: { flexGrow: 0 },

  // Form
  label: {
    fontSize: 10, fontWeight: '800',
    color: C.textMuted, marginBottom: 6, marginTop: 16,
    textTransform: 'uppercase', letterSpacing: 1.4,
  },
  input: {
    borderWidth: 1.5, borderColor: C.cardBorder,
    borderRadius: R.md,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, color: C.textPrimary,
    backgroundColor: C.inputBg,
  },
  inputError: { borderColor: C.danger },
  textArea: { height: 80, textAlignVertical: 'top' },
  fieldError: {
    fontSize: 11, color: C.danger,
    marginTop: 4, fontWeight: '600',
  },

  // Toggle
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
    padding: 14,
    backgroundColor: C.card,
    borderRadius: R.md,
    borderWidth: 1, borderColor: C.cardBorder,
  },
  toggleLabel: {
    fontSize: 14, fontWeight: '700',
    color: C.textPrimary,
  },
  toggleSub: {
    fontSize: 11, color: C.textMuted, marginTop: 2,
  },
  toggle: {
    width: 44, height: 26,
    borderRadius: R.pill,
    backgroundColor: C.elevated,
    borderWidth: 1, borderColor: C.cardBorder,
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  toggleOn: {
    backgroundColor: C.accent,
    borderColor: C.accent,
  },
  toggleThumb: {
    width: 18, height: 18,
    borderRadius: R.pill,
    backgroundColor: C.textMuted,
    alignSelf: 'flex-start',
  },
  toggleThumbOn: {
    backgroundColor: '#fff',
    alignSelf: 'flex-end',
  },

  // Modal buttons
  modalButtons: {
    flexDirection: 'row', gap: 12,
    marginTop: 24, marginBottom: 8,
  },
  cancelButton: {
    flex: 1,
    borderWidth: 1.5, borderColor: C.cardBorder,
    borderRadius: R.pill,
    paddingVertical: 13, alignItems: 'center',
    backgroundColor: C.elevated,
  },
  cancelButtonText: {
    fontSize: 14, color: C.textSub, fontWeight: '700',
  },
  submitButton: {
    flex: 2,
    backgroundColor: C.accent,
    borderRadius: R.pill,
    paddingVertical: 13, alignItems: 'center',
    shadowColor: C.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonText: {
    fontSize: 14, color: '#fff',
    fontWeight: '800', letterSpacing: 0.3,
  },
})
