import AsyncStorage from '@react-native-async-storage/async-storage'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  AlertCircle,
  Camera,
  CheckCircle,
  Edit,
  ImageOff,
  Plus,
  Search,
  Trash2,
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
import { authService } from '../auth/services/auth.service'
import ImagePickerModal from '../categories/imagePickerModal'
import categoriesService from '../categories/services/categoriesService'
import menuItemsService, { MenuItem } from './services/menu-items-services'

const palette = {
  black: '#0A0A0A',
  charcoal: '#1A1A1A',
  graphite: '#2C2C2C',
  steel: '#3D3D3D',
  muted: '#6B6B6B',
  border: '#2E2E2E',
  card: '#1E1E1E',
  brand: '#FF6B2C',
  brandTint: '#2A1A10',
  brandDim: '#7A3010',
  text: '#FFFFFF',
  offWhite: '#F0F0F0',
  dim: '#A0A0A0',
  success: '#22C55E',
  successBg: '#0D2818',
  error: '#EF4444',
  errorBg: '#2A0A0A',
}

const corner = { xs: 6, sm: 10, md: 14, lg: 18, pill: 100 }
const UPLOAD_FOLDER = 'yammy/menu-items'
const PAYMENT_ROLES = ['Admin', 'Super Admin']

interface Category {
  category_id: number
  category_name: string
  category_description?: string
}

interface ProductFormData {
  name: string
  description: string
  price: string
  cost_price: string
  category_id: string
  image_url: string
  is_available: boolean
}

const EMPTY_FORM: ProductFormData = {
  name: '',
  description: '',
  price: '',
  cost_price: '',
  category_id: '',
  image_url: '',
  is_available: true,
}

export default function MenuItems() {
  const insets = useSafeAreaInsets()
  const [canManage, setCanManage] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  const [showFormModal, setShowFormModal] = useState(false)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [form, setForm] = useState<ProductFormData>(EMPTY_FORM)
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof ProductFormData, string>>>({})
  const [showAdvanced, setShowAdvanced] = useState(false)

  const [showImagePicker, setShowImagePicker] = useState(false)

  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    AsyncStorage.getItem('@userRole').then((role) => {
      setCanManage(role ? PAYMENT_ROLES.includes(role) : false)
    })
  }, [])

  const queryClient = useQueryClient()

   const { data: items, isLoading, error } = useQuery<MenuItem[]>({
    queryKey: ['products'],
    queryFn: async () => {
      const restaurant_id = await authService.getRestaurantId()
      return menuItemsService.getMenuItem(restaurant_id ?? undefined)
    },
    retry: 3,
  })

 const { data: categories } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const restaurant_id = await authService.getRestaurantId()
      return categoriesService.getAllCategory(restaurant_id ?? undefined)
    },
  })
  const isEditing = editingItem !== null

  const createMutation = useMutation({
    mutationFn: (data: ProductFormData) => menuItemsService.postMenuItem(toRequest(data)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      closeModal()
      flash('success', 'Menu item created!')
    },
    onError: (err: any) => flash('error', err?.message ?? 'Error creating item'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ProductFormData }) =>
      menuItemsService.putMenuItem(id, toRequest(data)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      closeModal()
      flash('success', 'Menu item updated!')
    },
    onError: (err: any) => flash('error', err?.message ?? 'Error updating item'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => menuItemsService.deleteMenuItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      flash('success', 'Menu item deleted.')
    },
    onError: (err: any) => flash('error', err?.message ?? 'Error deleting item'),
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

  function toRequest(data: ProductFormData) {
    return {
      menu_items_name: data.name,
      menu_items_description: data.description || '',
      slug: data.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
      price: parseFloat(data.price) || 0,
      cost_price: parseFloat(data.cost_price) || undefined,
      menu_items_category_id: parseInt(data.category_id),
      image_url: data.image_url || '',
      is_available: data.is_available,
    }
  }

  function validate(data: ProductFormData) {
    const errs: Partial<Record<keyof ProductFormData, string>> = {}
    if (!data.name.trim()) errs.name = 'Name is required'
    if (!data.price || isNaN(parseFloat(data.price))) errs.price = 'Valid price is required'
    if (!data.category_id) errs.category_id = 'Category is required'
    return errs
  }

  function openNew() {
    setEditingItem(null)
    setForm(EMPTY_FORM)
    setFormErrors({})
    setShowAdvanced(false)
    setShowFormModal(true)
  }

  function openEdit(item: MenuItem) {
    setEditingItem(item)
    setForm({
      name: item.menu_items_name,
      description: item.menu_items_description || '',
      price: String(item.price),
      cost_price: item.cost_price ? String(item.cost_price) : '',
      category_id: String(item.menu_items_category_id),
      image_url: item.image_url || '',
      is_available: item.is_available,
    })
    setFormErrors({})
    setShowAdvanced(false)
    setShowFormModal(true)
  }

  function closeModal() {
    setShowFormModal(false)
    setEditingItem(null)
    setForm(EMPTY_FORM)
  }

  function handleSubmit() {
    const errs = validate(form)
    if (Object.keys(errs).length > 0) {
      setFormErrors(errs)
      return
    }
    if (isEditing && editingItem) {
      updateMutation.mutate({ id: String(editingItem.menu_items_id), data: form })
    } else {
      createMutation.mutate(form)
    }
  }

  function confirmDelete(id: number, name: string) {
    Alert.alert('Delete Item', `Remove "${name}" permanently?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate(id) },
    ])
  }

  const filteredItems = items?.filter((item) => {
    const matchesSearch = item.menu_items_name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory =
      categoryFilter === 'all' || String(item.menu_items_category_id) === categoryFilter
    return matchesSearch && matchesCategory
  })

  const isSaving = createMutation.isPending || updateMutation.isPending

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={palette.brand} />
        <Text style={styles.loadingText}>Loading menu items...</Text>
      </View>
    )
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <AlertCircle size={48} color={palette.error} />
        <Text style={styles.errorTitle}>Error loading items</Text>
        <Text style={styles.errorSub}>{String(error)}</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Menu Items</Text>
            <Text style={styles.subtitle}>Manage your product catalog</Text>
          </View>
          {canManage ? (
            <TouchableOpacity style={styles.addButton} onPress={openNew} activeOpacity={0.85}>
              <Plus size={16} color={palette.text} />
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

        <View style={styles.searchRow}>
          <Search size={15} color={palette.brand} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search items..."
            placeholderTextColor={palette.muted}
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          <TouchableOpacity
            style={[styles.filterChip, categoryFilter === 'all' && styles.filterChipActive]}
            onPress={() => setCategoryFilter('all')}
          >
            <Text style={[styles.filterChipText, categoryFilter === 'all' && styles.filterChipTextActive]}>
              All
            </Text>
          </TouchableOpacity>
          {categories?.map((cat) => (
            <TouchableOpacity
              key={cat.category_id}
              style={[styles.filterChip, categoryFilter === String(cat.category_id) && styles.filterChipActive]}
              onPress={() => setCategoryFilter(String(cat.category_id))}
            >
              <Text style={[styles.filterChipText, categoryFilter === String(cat.category_id) && styles.filterChipTextActive]}>
                {cat.category_name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {filteredItems?.length === 0 ? (
          <View style={styles.emptyState}>
            <Search size={40} color={palette.steel} />
            <Text style={styles.emptyTitle}>
              {searchTerm ? 'No items found' : 'No items yet'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {searchTerm ? 'Try a different search term' : 'Add your first menu item'}
            </Text>
          </View>
        ) : (
          filteredItems?.map((item) => {
            const category = categories?.find((c) => c.category_id === item.menu_items_category_id)
            return (
              <View key={item.menu_items_id} style={styles.card}>
                <View style={styles.cardPhoto}>
                  {item.image_url ? (
                    <Image source={{ uri: item.image_url }} style={styles.cardImage} />
                  ) : (
                    <View style={styles.cardImagePlaceholder}>
                      <ImageOff size={20} color={palette.steel} />
                    </View>
                  )}
                  <View style={[
                    styles.availabilityDot,
                    { backgroundColor: item.is_available ? palette.success : palette.muted }
                  ]} />
                </View>

                <View style={styles.cardDetails}>
                  <View style={styles.cardTopRow}>
                    <Text style={styles.cardName} numberOfLines={1}>{item.menu_items_name}</Text>
                    {canManage ? (
                      <View style={styles.cardActions}>
                        <TouchableOpacity style={styles.editBtn} onPress={() => openEdit(item)}>
                          <Edit size={13} color={palette.brand} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.deleteBtn}
                          onPress={() => confirmDelete(item.menu_items_id, item.menu_items_name)}
                        >
                          <Trash2 size={13} color={palette.error} />
                        </TouchableOpacity>
                      </View>
                    ) : null}
                  </View>

                  {category ? (
                    <View style={styles.categoryBadge}>
                      <Text style={styles.categoryBadgeText}>{category.category_name}</Text>
                    </View>
                  ) : null}

                  {item.menu_items_description ? (
                    <Text style={styles.cardDesc} numberOfLines={2}>
                      {item.menu_items_description}
                    </Text>
                  ) : null}

                  <View style={styles.cardFooter}>
                    <Text style={styles.priceText}>NPR {Number(item.price).toFixed(2)}</Text>
                    <Text style={[styles.statusText, { color: item.is_available ? palette.success : palette.muted }]}>
                      {item.is_available ? 'Available' : 'Unavailable'}
                    </Text>
                  </View>
                </View>
              </View>
            )
          })
        )}
      </ScrollView>

      <Modal visible={showFormModal} animationType="slide" transparent onRequestClose={closeModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>{isEditing ? 'Edit Item' : 'New Item'}</Text>

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
                    <Camera size={22} color={palette.brand} />
                    <Text style={styles.photoPickerText}>Add a photo</Text>
                  </View>
                )}
              </TouchableOpacity>

              <Text style={styles.label}>Name *</Text>
              <TextInput
                style={[styles.input, formErrors.name ? styles.inputError : null]}
                placeholder="e.g. Grilled Chicken"
                placeholderTextColor={palette.muted}
                value={form.name}
                onChangeText={(t) => setForm({ ...form, name: t })}
              />
              {formErrors.name ? <Text style={styles.fieldError}>{formErrors.name}</Text> : null}

              <Text style={styles.label}>Category *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillScroll}>
                {categories?.map((cat) => {
                  const active = form.category_id === String(cat.category_id)
                  return (
                    <TouchableOpacity
                      key={cat.category_id}
                      style={[styles.pill, active && styles.pillActive]}
                      onPress={() => setForm({ ...form, category_id: String(cat.category_id) })}
                    >
                      <Text style={[styles.pillText, active && styles.pillTextActive]}>
                        {cat.category_name}
                      </Text>
                    </TouchableOpacity>
                  )
                })}
              </ScrollView>
              {formErrors.category_id ? <Text style={styles.fieldError}>{formErrors.category_id}</Text> : null}

              <View>
  <Text style={styles.label}>Price (NPR) *</Text>
  <View style={[styles.inputWithPrefix, formErrors.price ? styles.inputError : null]}>
    <Text style={styles.prefix}>Rs</Text>
    <TextInput
      style={styles.prefixInput}
      placeholder="0.00"
      placeholderTextColor={palette.muted}
      keyboardType="numeric"
      value={form.price}
      onChangeText={(t) => setForm({ ...form, price: t })}
    />
  </View>
  {formErrors.price ? <Text style={styles.fieldError}>{formErrors.price}</Text> : null}
</View>

              <TouchableOpacity
                style={styles.advancedToggle}
                onPress={() => setShowAdvanced(!showAdvanced)}
              >
                <Text style={styles.advancedToggleText}>
                  {showAdvanced ? 'Hide advanced ▲' : 'More options ▼'}
                </Text>
              </TouchableOpacity>

              {showAdvanced ? (
                <View style={styles.advancedSection}>
                  <Text style={styles.label}>Description</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Short description (optional)"
                    placeholderTextColor={palette.muted}
                    value={form.description}
                    onChangeText={(t) => setForm({ ...form, description: t })}
                    multiline
                    numberOfLines={3}
                  />

                  <View style={styles.toggleRow}>
                    <View>
                      <Text style={styles.toggleLabel}>Available</Text>
                      <Text style={styles.toggleSub}>Visible and orderable by customers</Text>
                    </View>
                    <TouchableOpacity
                      style={[styles.toggle, form.is_available && styles.toggleOn]}
                      onPress={() => setForm({ ...form, is_available: !form.is_available })}
                    >
                      <View style={[styles.toggleThumb, form.is_available && styles.toggleThumbOn]} />
                    </TouchableOpacity>
                  </View>
                </View>
              ) : null}

              <View style={styles.modalButtons}>
                <TouchableOpacity style={styles.cancelButton} onPress={closeModal}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.submitButton, isSaving && styles.disabled]}
                  onPress={handleSubmit}
                  disabled={isSaving}
                  activeOpacity={0.85}
                >
                  <Text style={styles.submitButtonText}>
                    {isSaving
                      ? isEditing ? 'Saving…' : 'Creating…'
                      : isEditing ? 'Save Changes' : 'Create Item'}
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
        initialQuery={form.name}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.black },
  content: { padding: 20, paddingTop: 56, paddingBottom: 40 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: palette.black },
  loadingText: { fontSize: 14, color: palette.muted },
  errorTitle: { fontSize: 16, fontWeight: '700', color: palette.error },
  errorSub: { fontSize: 13, color: palette.dim, textAlign: 'center' },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  title: { fontSize: 24, fontWeight: '900', color: palette.text, letterSpacing: 0.5 },
  subtitle: { fontSize: 13, color: palette.muted, marginTop: 2 },
  addButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: palette.brand, borderRadius: corner.pill, paddingHorizontal: 16, paddingVertical: 10, gap: 6 },
  addButtonText: { color: palette.text, fontWeight: '700', fontSize: 14 },

  successBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: palette.successBg, borderWidth: 1, borderColor: palette.success, borderRadius: corner.md, padding: 12, gap: 8, marginBottom: 10 },
  successText: { color: palette.success, fontSize: 13 },
  errorBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: palette.errorBg, borderWidth: 1, borderColor: palette.error, borderRadius: corner.md, padding: 12, gap: 8, marginBottom: 10 },
  errorBannerText: { color: palette.error, fontSize: 13 },

  searchRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: palette.graphite, borderWidth: 1, borderColor: palette.border, borderRadius: corner.md, paddingHorizontal: 14, paddingVertical: 2, gap: 10, marginBottom: 10 },
  searchInput: { flex: 1, fontSize: 14, color: palette.text },

  filterRow: { flexDirection: 'row', gap: 8, paddingVertical: 4, marginBottom: 10 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: corner.pill, borderWidth: 1.5, borderColor: palette.border, backgroundColor: palette.graphite },
  filterChipActive: { backgroundColor: palette.brandTint, borderColor: palette.brand },
  filterChipText: { fontSize: 12, fontWeight: '700', color: palette.muted },
  filterChipTextActive: { color: palette.brand },

  emptyState: { alignItems: 'center', paddingVertical: 60, gap: 10 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: palette.offWhite },
  emptySubtitle: { fontSize: 13, color: palette.muted, textAlign: 'center' },

  card: { flexDirection: 'row', backgroundColor: palette.card, borderRadius: corner.lg, borderWidth: 1, borderColor: palette.border, overflow: 'hidden', minHeight: 100, marginBottom: 10 },
  cardPhoto: { width: 100, height: 100, position: 'relative' },
  cardImage: { width: '100%', height: '100%' },
  cardImagePlaceholder: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', backgroundColor: palette.graphite },
  availabilityDot: { position: 'absolute', top: 8, left: 8, width: 9, height: 9, borderRadius: 5, borderWidth: 1.5, borderColor: palette.card },

  cardDetails: { flex: 1, padding: 10, overflow: 'hidden' },
  cardTopRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 },
  cardName: { fontSize: 14, fontWeight: '800', color: palette.text, flex: 1, marginRight: 4 },
  cardActions: { flexDirection: 'row', gap: 6 },
  editBtn: { padding: 6, borderRadius: corner.xs, backgroundColor: palette.brandTint, borderWidth: 1, borderColor: palette.brandDim },
  deleteBtn: { padding: 6, borderRadius: corner.xs, backgroundColor: palette.errorBg, borderWidth: 1, borderColor: '#7A1010' },

  categoryBadge: { alignSelf: 'flex-start', backgroundColor: palette.brandTint, borderRadius: corner.pill, paddingHorizontal: 8, paddingVertical: 2, marginBottom: 4 },
  categoryBadgeText: { fontSize: 10, color: palette.brand, fontWeight: '700' },
  cardDesc: { fontSize: 11, color: palette.dim, lineHeight: 15 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  priceText: { fontSize: 14, fontWeight: '800', color: palette.brand },
  statusText: { fontSize: 10, fontWeight: '700' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  modalContainer: { backgroundColor: palette.charcoal, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, maxHeight: '92%', borderTopWidth: 1, borderColor: palette.border },
  modalHandle: { width: 36, height: 4, borderRadius: corner.pill, backgroundColor: palette.graphite, alignSelf: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '900', color: palette.text, marginBottom: 4, letterSpacing: 0.3 },

  label: { fontSize: 10, fontWeight: '800', color: palette.muted, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 6, marginTop: 14 },
  input: { borderWidth: 1.5, borderColor: palette.border, borderRadius: corner.md, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: palette.text, backgroundColor: palette.black },
  inputError: { borderColor: palette.error },
textArea: { height: 100, textAlignVertical: 'top', paddingTop: 10 },
  fieldError: { fontSize: 11, color: palette.error, marginTop: 4 },

  priceRow: { flexDirection: 'row', gap: 12 },
  inputWithPrefix: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: palette.border, borderRadius: corner.md, paddingHorizontal: 12, backgroundColor: palette.black, height: 48 },
  prefix: { fontSize: 13, color: palette.brand, fontWeight: '700', marginRight: 6 },
  prefixInput: { flex: 1, fontSize: 14, color: palette.text },

  pillScroll: { marginVertical: 4 },
  pill: { borderRadius: corner.pill, borderWidth: 1.5, borderColor: palette.border, paddingHorizontal: 14, paddingVertical: 8, marginRight: 8, backgroundColor: palette.graphite },
  pillActive: { backgroundColor: palette.brand, borderColor: palette.brand },
  pillText: { fontSize: 13, color: palette.dim },
  pillTextActive: { color: palette.text, fontWeight: '700' },

  photoPicker: { width: '100%', aspectRatio: 2.5, borderRadius: corner.md, borderWidth: 1.5, borderColor: palette.border, backgroundColor: palette.black, overflow: 'hidden' },
  photoPickerImage: { width: '100%', height: '100%' },
  photoPickerEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  photoPickerText: { fontSize: 12, fontWeight: '700', color: palette.brand },

  advancedToggle: { borderWidth: 1, borderColor: palette.border, borderRadius: corner.md, paddingVertical: 10, alignItems: 'center', marginTop: 16, backgroundColor: palette.graphite },
  advancedToggleText: { fontSize: 13, color: palette.brand, fontWeight: '600' },
  advancedSection: { borderTopWidth: 1, borderTopColor: palette.border, marginTop: 14, paddingTop: 4 },

  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, padding: 14, backgroundColor: palette.card, borderRadius: corner.md, borderWidth: 1, borderColor: palette.border },
  toggleLabel: { fontSize: 14, fontWeight: '700', color: palette.text },
  toggleSub: { fontSize: 11, color: palette.muted, marginTop: 2 },
  toggle: { width: 44, height: 26, borderRadius: corner.pill, backgroundColor: palette.graphite, borderWidth: 1, borderColor: palette.border, justifyContent: 'center', paddingHorizontal: 3 },
  toggleOn: { backgroundColor: palette.brand, borderColor: palette.brand },
  toggleThumb: { width: 18, height: 18, borderRadius: corner.pill, backgroundColor: palette.muted, alignSelf: 'flex-start' },
  toggleThumbOn: { backgroundColor: palette.text, alignSelf: 'flex-end' },

  modalButtons: { flexDirection: 'row', gap: 12, marginTop: 24, marginBottom: 8 },
  cancelButton: { flex: 1, borderWidth: 1.5, borderColor: palette.border, borderRadius: corner.pill, paddingVertical: 13, alignItems: 'center', backgroundColor: palette.graphite },
  cancelButtonText: { fontSize: 14, color: palette.dim, fontWeight: '700' },
  submitButton: { flex: 2, backgroundColor: palette.brand, borderRadius: corner.pill, paddingVertical: 13, alignItems: 'center' },
  submitButtonText: { fontSize: 14, color: palette.text, fontWeight: '800', letterSpacing: 0.3 },
  disabled: { opacity: 0.5 },
})