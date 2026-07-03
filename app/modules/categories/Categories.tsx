import AsyncStorage from '@react-native-async-storage/async-storage'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  AlertCircle,
  Camera,
  CheckCircle,
  Edit,
  ImageOff,
  Plus,
  Sparkles,
  Tags,
  Trash2,
  X,
} from 'lucide-react-native'
import { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import ImagePickerModal from './imagePickerModal'
import categoriesService, { Category } from './services/categoriesService'

const palette = {
  black: '#0A0A0A',
  charcoal: '#1A1A1A',
  graphite: '#2C2C2C',
  steel: '#3D3D3D',
  muted: '#6B6B6B',
  border: '#2E2E2E',
  card: '#1E1E1E',
  orange: '#FF6B2C',
  orangeTint: '#2A1A10',
  orangeDim: '#7A3010',
  white: '#FFFFFF',
  offWhite: '#F0F0F0',
  dim: '#A0A0A0',
  success: '#22C55E',
  successBg: '#0D2818',
  error: '#EF4444',
  errorBg: '#2A0A0A',
}

const corner = { xs: 6, sm: 10, md: 14, lg: 18, pill: 100 }
const UPLOAD_FOLDER = 'yammy/categories'
const QUICK_PICK_PRESETS = [
  { name: 'Starters', searchTerm: 'appetizer food' },
  { name: 'Mains', searchTerm: 'main course dinner' },
  { name: 'Desserts', searchTerm: 'dessert cake' },
  { name: 'Beverages', searchTerm: 'drinks beverages' },
  { name: 'Breakfast', searchTerm: 'breakfast food' },
  { name: 'Soups', searchTerm: 'soup bowl' },
  { name: 'Salads', searchTerm: 'fresh salad' },
  { name: 'Snacks', searchTerm: 'snacks food' },
  { name: 'Grills & BBQ', searchTerm: 'grilled bbq food' },
  { name: 'Seafood', searchTerm: 'seafood plate' },
  { name: 'Vegan', searchTerm: 'vegan food' },
  { name: 'Specials', searchTerm: 'chef special dish' },
]

interface CategoryFormData {
  category_name: string
  category_description: string
  is_active: boolean
  image_url: string
}

const EMPTY_FORM: CategoryFormData = {
  category_name: '',
  category_description: '',
  is_active: true,
  image_url: '',
}

export default function Categories() {
  const insets = useSafeAreaInsets()
  const [canManage, setCanManage] = useState(false)

  const [showFormModal, setShowFormModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [form, setForm] = useState<CategoryFormData>(EMPTY_FORM)
  const [formErrors, setFormErrors] = useState<Partial<CategoryFormData>>({})

  const [showQuickPick, setShowQuickPick] = useState(false)
  const [showImagePicker, setShowImagePicker] = useState(false)
  const [imagePickerSeedQuery, setImagePickerSeedQuery] = useState('')

  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [focusedInput, setFocusedInput] = useState<string | null>(null)

  useEffect(() => {
    AsyncStorage.getItem('@userRole').then((role) => {
      setCanManage(role === 'Admin' || role === 'Super Admin')
    })
  }, [])

  const queryClient = useQueryClient()

  const { data: categories, isLoading, error } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: () => categoriesService.getAllCategory(),
    retry: 3,
  })

  const isEditing = editingCategory !== null

  const createMutation = useMutation({
    mutationFn: (data: CategoryFormData) => categoriesService.postCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      closeFormModal()
      flash('success', 'Category created!')
    },
    onError: (err) => flash('error', 'Error creating: ' + err),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CategoryFormData }) =>
      categoriesService.putCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      closeFormModal()
      flash('success', 'Category updated!')
    },
    onError: (err) => flash('error', 'Error updating: ' + err),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => categoriesService.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      flash('success', 'Category deleted.')
    },
    onError: (err) => flash('error', 'Error deleting: ' + err),
  })

  function flash(type: 'success' | 'error', msg: string) {
    if (type === 'success') {
      setSuccessMsg(msg)
      setTimeout(() => setSuccessMsg(null), 3000)
    } else {
      setErrorMsg(msg)
      setTimeout(() => setErrorMsg(null), 5000)
    }
  }

  function validate(data: CategoryFormData): Partial<CategoryFormData> {
    const errs: Partial<CategoryFormData> = {}
    if (!data.category_name.trim()) errs.category_name = 'Name is required'
    return errs
  }

  function openNewCustom() {
    setEditingCategory(null)
    setForm(EMPTY_FORM)
    setFormErrors({})
    setImagePickerSeedQuery('')
    setShowFormModal(true)
  }

  function openFromPreset(preset: { name: string; searchTerm: string }) {
    setEditingCategory(null)
    setForm({ ...EMPTY_FORM, category_name: preset.name })
    setFormErrors({})
    setImagePickerSeedQuery(preset.searchTerm)
    setShowQuickPick(false)
    setShowFormModal(true)
  }

  function openEdit(category: Category) {
    setEditingCategory(category)
    setForm({
      category_name: category.category_name,
      category_description: category.category_description || '',
      is_active: category.is_active,
      image_url: category.image_url || '',
    })
    setFormErrors({})
    setImagePickerSeedQuery(category.category_name)
    setShowFormModal(true)
  }

  function closeFormModal() {
    setShowFormModal(false)
    setEditingCategory(null)
    setForm(EMPTY_FORM)
  }

  function handleSubmit() {
    const errs = validate(form)
    if (Object.keys(errs).length > 0) {
      setFormErrors(errs)
      return
    }

    if (isEditing && editingCategory) {
      updateMutation.mutate({ id: String(editingCategory.category_id), data: form })
    } else {
      createMutation.mutate(form)
    }
  }

  function handleDelete(id: number, name: string) {
    Alert.alert('Delete Category', `Remove "${name}" permanently?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate(id) },
    ])
  }

  function inputStyle(key: string) {
    return [styles.input, focusedInput === key && styles.inputFocused]
  }

  const isSaving = createMutation.isPending || updateMutation.isPending

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <View style={styles.loadingIcon}>
          <Tags size={24} color={palette.orange} />
        </View>
        <ActivityIndicator size="large" color={palette.orange} style={{ marginTop: 16 }} />
        <Text style={styles.loadingText}>Loading Categories…</Text>
      </View>
    )
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <AlertCircle size={44} color={palette.error} />
        <Text style={styles.errorTitle}>Failed to load</Text>
        <Text style={styles.errorSub}>{String(error)}</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.blob1} />
      <View style={styles.blob2} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Categories</Text>
            <Text style={styles.subtitle}>
              {canManage ? 'Manage your menu categories' : 'Browse all categories'}
            </Text>
          </View>
          {canManage ? (
            <TouchableOpacity style={styles.addButton} onPress={openNewCustom} activeOpacity={0.85}>
              <Plus size={15} color={palette.white} />
              <Text style={styles.addButtonText}>New</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {successMsg ? (
          <View style={styles.successBanner}>
            <CheckCircle size={14} color={palette.success} />
            <Text style={styles.successText}>{successMsg}</Text>
          </View>
        ) : null}
        {errorMsg ? (
          <View style={styles.errorBanner}>
            <AlertCircle size={14} color={palette.error} />
            <Text style={styles.errorBannerText}>{errorMsg}</Text>
          </View>
        ) : null}

        {categories?.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Tags size={28} color={palette.orange} />
            </View>
            <Text style={styles.emptyTitle}>No categories yet</Text>
            <Text style={styles.emptySub}>
              {canManage ? 'Create your first category to get started' : 'No categories have been added'}
            </Text>
            {canManage ? (
              <TouchableOpacity style={styles.addButton} onPress={openNewCustom} activeOpacity={0.85}>
                <Plus size={14} color={palette.white} />
                <Text style={styles.addButtonText}>Create Category</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : (
          <View style={styles.grid}>
            {categories?.map((category) => (
              <View key={category.category_id} style={styles.card}>
                <View style={styles.cardImageWrap}>
                  {category.image_url ? (
                    <Image source={{ uri: category.image_url }} style={styles.cardImage} />
                  ) : (
                    <View style={styles.cardImagePlaceholder}>
                      <ImageOff size={22} color={palette.steel} />
                    </View>
                  )}

                  {canManage ? (
                    <View style={styles.cardImageActions}>
                      <TouchableOpacity
                        style={styles.cardImageBtn}
                        onPress={() => openEdit(category)}
                        activeOpacity={0.8}
                      >
                        <Edit size={13} color={palette.white} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.cardImageBtn, styles.cardImageBtnDanger]}
                        onPress={() => handleDelete(category.category_id, category.category_name)}
                        activeOpacity={0.8}
                      >
                        <Trash2 size={13} color={palette.white} />
                      </TouchableOpacity>
                    </View>
                  ) : null}

                  <View
                    style={[
                      styles.statusDotBadge,
                      { backgroundColor: category.is_active ? palette.success : palette.muted },
                    ]}
                  />
                </View>

                <View style={styles.cardBody}>
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {category.category_name}
                  </Text>
                  {category.category_description ? (
                    <Text style={styles.cardDesc} numberOfLines={2}>
                      {category.category_description}
                    </Text>
                  ) : null}
                  <Text style={[styles.cardStatusText, { color: category.is_active ? palette.success : palette.muted }]}>
                    {category.is_active ? 'Active' : 'Inactive'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {canManage ? (
        <TouchableOpacity style={[styles.fab, { bottom: insets.bottom + 16 }]} onPress={() => setShowQuickPick(true)} activeOpacity={0.85}>
          <Sparkles size={20} color={palette.white} />
        </TouchableOpacity>
      ) : null}

      {/* quick-pick sheet: tap a common category to prefill name + image search */}
      <Modal visible={showQuickPick} animationType="slide" transparent onRequestClose={() => setShowQuickPick(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHandle} />
            <View style={styles.quickPickHeader}>
              <Text style={styles.modalTitle}>Quick Add</Text>
              <TouchableOpacity onPress={() => setShowQuickPick(false)}>
                <X size={20} color={palette.dim} />
              </TouchableOpacity>
            </View>
            <Text style={styles.quickPickSub}>Tap a common category to get started faster</Text>

            <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: 12 }}>
              <View style={styles.presetGrid}>
                {QUICK_PICK_PRESETS.map((preset) => (
                  <TouchableOpacity
                    key={preset.name}
                    style={styles.presetChip}
                    onPress={() => openFromPreset(preset)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.presetChipText}>{preset.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* create / edit form */}
      <Modal visible={showFormModal} animationType="slide" transparent onRequestClose={closeFormModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>{isEditing ? 'Edit Category' : 'New Category'}</Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.label}>Photo</Text>
              <TouchableOpacity
                style={styles.photoPicker}
                onPress={() => setShowImagePicker(true)}
                activeOpacity={0.85}
              >
                {form.image_url ? (
                  <Image source={{ uri: form.image_url }} style={styles.photoPickerImage} />
                ) : (
                  <View style={styles.photoPickerEmpty}>
                    <Camera size={22} color={palette.orange} />
                    <Text style={styles.photoPickerText}>Add a photo</Text>
                  </View>
                )}
              </TouchableOpacity>

              <Text style={styles.label}>Category Name *</Text>
              <TextInput
                style={[inputStyle('name'), formErrors.category_name && styles.inputError]}
                placeholder="e.g. Starters, Mains, Desserts"
                placeholderTextColor={palette.muted}
                value={form.category_name}
                onChangeText={(t) => setForm({ ...form, category_name: t })}
                onFocus={() => setFocusedInput('name')}
                onBlur={() => setFocusedInput(null)}
              />
              {formErrors.category_name ? <Text style={styles.fieldError}>{formErrors.category_name}</Text> : null}

              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[inputStyle('desc'), styles.textArea]}
                placeholder="Short description (optional)"
                placeholderTextColor={palette.muted}
                value={form.category_description}
                onChangeText={(t) => setForm({ ...form, category_description: t })}
                multiline
                numberOfLines={3}
                onFocus={() => setFocusedInput('desc')}
                onBlur={() => setFocusedInput(null)}
              />

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
                <TouchableOpacity style={styles.cancelButton} onPress={closeFormModal}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.submitButton, isSaving && styles.disabled]}
                  onPress={handleSubmit}
                  disabled={isSaving}
                  activeOpacity={0.85}
                >
                  <Text style={styles.submitButtonText}>
                    {isSaving ? (isEditing ? 'Saving…' : 'Creating…') : isEditing ? 'Save Changes' : 'Create Category'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <ImagePickerModal
        visible={showImagePicker}
        onClose={() => setShowImagePicker(false)}
        onImageSelected={(url) => setForm((prev) => ({ ...prev, image_url: url }))}
        uploadFolder={UPLOAD_FOLDER}
        initialQuery={imagePickerSeedQuery}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.black },
  content: { padding: 20, paddingTop: 56, paddingBottom: 100 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.black, gap: 12 },
  blob1: { position: 'absolute', top: -80, left: '20%', width: 260, height: 260, borderRadius: 130, backgroundColor: palette.orange, opacity: 0.08 },
  blob2: { position: 'absolute', top: -40, left: '45%', width: 180, height: 180, borderRadius: 90, backgroundColor: palette.orange, opacity: 0.12 },

  loadingIcon: { width: 56, height: 56, borderRadius: 14, backgroundColor: palette.orangeTint, borderWidth: 1.5, borderColor: palette.orangeDim, alignItems: 'center', justifyContent: 'center' },
  loadingText: { fontSize: 14, fontWeight: '700', color: palette.muted, marginTop: 8 },
  errorTitle: { fontSize: 16, fontWeight: '800', color: palette.error },
  errorSub: { fontSize: 12, color: palette.muted },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  title: { fontSize: 24, fontWeight: '900', color: palette.white, letterSpacing: 0.3 },
  subtitle: { fontSize: 12, color: palette.muted, marginTop: 2 },
  addButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: palette.orange, borderRadius: corner.pill, paddingHorizontal: 16, paddingVertical: 10, gap: 6 },
  addButtonText: { color: palette.white, fontWeight: '800', fontSize: 13 },

  successBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: palette.successBg, borderWidth: 1, borderColor: palette.success, borderRadius: corner.md, padding: 12, marginBottom: 14, gap: 8 },
  successText: { color: palette.success, fontSize: 13, fontWeight: '600' },
  errorBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: palette.errorBg, borderWidth: 1, borderColor: palette.error, borderRadius: corner.md, padding: 12, marginBottom: 14, gap: 8 },
  errorBannerText: { color: palette.error, fontSize: 13, fontWeight: '600' },

  emptyState: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyIcon: { width: 68, height: 68, borderRadius: corner.lg, backgroundColor: palette.orangeTint, borderWidth: 1.5, borderColor: palette.orangeDim, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 17, fontWeight: '800', color: palette.white },
  emptySub: { fontSize: 13, color: palette.muted, textAlign: 'center', paddingHorizontal: 32 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: { width: '47%', backgroundColor: palette.card, borderRadius: corner.md, borderWidth: 1, borderColor: palette.border, overflow: 'hidden' },

  cardImageWrap: { width: '100%', aspectRatio: 1.3, backgroundColor: palette.graphite },
  cardImage: { width: '100%', height: '100%' },
  cardImagePlaceholder: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  cardImageActions: { position: 'absolute', top: 8, right: 8, flexDirection: 'row', gap: 6 },
  cardImageBtn: { width: 28, height: 28, borderRadius: corner.sm, backgroundColor: 'rgba(10,10,10,0.55)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  cardImageBtnDanger: { backgroundColor: 'rgba(239,68,68,0.55)' },
  statusDotBadge: { position: 'absolute', bottom: 8, left: 8, width: 9, height: 9, borderRadius: 5, borderWidth: 1.5, borderColor: palette.card },

  cardBody: { padding: 12 },
  cardTitle: { fontSize: 14, fontWeight: '800', color: palette.white },
  cardDesc: { fontSize: 11, color: palette.muted, marginTop: 3, lineHeight: 15 },
  cardStatusText: { fontSize: 10, fontWeight: '700', marginTop: 6, letterSpacing: 0.4 },

  fab: { position: 'absolute', bottom: 24, right: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: palette.orange, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 6 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  modalContainer: { backgroundColor: palette.charcoal, borderTopLeftRadius: 28, borderTopRightRadius: 28, borderTopWidth: 1, borderColor: palette.border, padding: 24, maxHeight: '90%' },
  modalHandle: { width: 36, height: 4, borderRadius: corner.pill, backgroundColor: palette.graphite, alignSelf: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '900', color: palette.white, letterSpacing: 0.4, marginBottom: 4 },

  quickPickHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  quickPickSub: { fontSize: 12, color: palette.muted, marginTop: 2 },
  presetGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingBottom: 24 },
  presetChip: { paddingHorizontal: 16, paddingVertical: 11, borderRadius: corner.pill, backgroundColor: palette.card, borderWidth: 1.5, borderColor: palette.border },
  presetChipText: { fontSize: 13, fontWeight: '700', color: palette.white },

  label: { fontSize: 10, fontWeight: '800', color: palette.muted, marginBottom: 6, marginTop: 16, textTransform: 'uppercase', letterSpacing: 1.4 },
  input: { borderWidth: 1.5, borderColor: palette.border, borderRadius: corner.md, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: palette.white, backgroundColor: palette.black },
  inputFocused: { borderColor: palette.orange },
  inputError: { borderColor: palette.error },
  textArea: { height: 80, textAlignVertical: 'top' },
  fieldError: { fontSize: 11, color: palette.error, marginTop: 4, fontWeight: '600' },

  photoPicker: { width: '100%', aspectRatio: 2, borderRadius: corner.md, borderWidth: 1.5, borderColor: palette.border, backgroundColor: palette.black, overflow: 'hidden' },
  photoPickerImage: { width: '100%', height: '100%' },
  photoPickerEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  photoPickerText: { fontSize: 12, fontWeight: '700', color: palette.orange },

  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 20, padding: 14, backgroundColor: palette.card, borderRadius: corner.md, borderWidth: 1, borderColor: palette.border },
  toggleLabel: { fontSize: 14, fontWeight: '700', color: palette.white },
  toggleSub: { fontSize: 11, color: palette.muted, marginTop: 2 },
  toggle: { width: 44, height: 26, borderRadius: corner.pill, backgroundColor: palette.graphite, borderWidth: 1, borderColor: palette.border, justifyContent: 'center', paddingHorizontal: 3 },
  toggleOn: { backgroundColor: palette.orange, borderColor: palette.orange },
  toggleThumb: { width: 18, height: 18, borderRadius: corner.pill, backgroundColor: palette.muted, alignSelf: 'flex-start' },
  toggleThumbOn: { backgroundColor: palette.white, alignSelf: 'flex-end' },

  modalButtons: { flexDirection: 'row', gap: 12, marginTop: 24, marginBottom: 8 },
  cancelButton: { flex: 1, borderWidth: 1.5, borderColor: palette.border, borderRadius: corner.pill, paddingVertical: 13, alignItems: 'center', backgroundColor: palette.graphite },
  cancelButtonText: { fontSize: 14, color: palette.dim, fontWeight: '700' },
  submitButton: { flex: 2, backgroundColor: palette.orange, borderRadius: corner.pill, paddingVertical: 13, alignItems: 'center' },
  submitButtonText: { fontSize: 14, color: palette.white, fontWeight: '800', letterSpacing: 0.3 },
  disabled: { opacity: 0.5 },
})