import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertCircle, CheckCircle, Edit, Plus, Search, Trash2 } from 'lucide-react-native'
import { useState } from 'react'
import {
    ActivityIndicator,
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native'
import categoriesService from '../categories/services/categoriesService'
import menuItemsService, { MenuItem } from './services/menu-items-services'

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

const DEFAULT_FORM: ProductFormData = {
  name: '',
  description: '',
  price: '',
  cost_price: '',
  category_id: '',
  image_url: '',
  is_available: true,
}

export default function Products() {
  const [searchTerm, setSearchTerm]           = useState('')
  const [showAddModal, setShowAddModal]       = useState(false)
  const [showEditModal, setShowEditModal]     = useState(false)
  const [editingProduct, setEditingProduct]   = useState<MenuItem | null>(null)
  const [addForm, setAddForm]                 = useState<ProductFormData>(DEFAULT_FORM)
  const [editForm, setEditForm]               = useState<ProductFormData>(DEFAULT_FORM)
  const [addErrors, setAddErrors]             = useState<Partial<Record<keyof ProductFormData, string>>>({})
  const [editErrors, setEditErrors]           = useState<Partial<Record<keyof ProductFormData, string>>>({})
  const [showAdvancedAdd, setShowAdvancedAdd] = useState(false)
  const [showAdvancedEdit, setShowAdvancedEdit] = useState(false)
  const [successMsg, setSuccessMsg]           = useState<string | null>(null)
  const [errorMsg, setErrorMsg]               = useState<string | null>(null)

  const queryClient = useQueryClient()

  const { data: products, isLoading, error } = useQuery<MenuItem[]>({
    queryKey: ['products'],
    queryFn: () => menuItemsService.getMenuItem(),
    retry: 3,
  })

  const { data: categories } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: () => categoriesService.getAllCategory(),
  })

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg)
    setTimeout(() => setSuccessMsg(null), 3000)
  }

  const showError = (msg: string) => {
    setErrorMsg(msg)
    setTimeout(() => setErrorMsg(null), 5000)
  }

  const validateForm = (form: ProductFormData) => {
    const errs: Partial<Record<keyof ProductFormData, string>> = {}
    if (!form.name.trim())                            errs.name        = 'Name is required'
    if (!form.price || isNaN(parseFloat(form.price))) errs.price       = 'Valid price is required'
    if (!form.category_id)                            errs.category_id = 'Category is required'
    return errs
  }

  const formToRequest = (form: ProductFormData) => ({
    menu_items_name:        form.name,
    menu_items_description: form.description || '',
    slug:                   form.name.toLowerCase().replace(/\s+/g, '-'),
    price:                  parseFloat(form.price) || 0,
    menu_items_category_id: parseInt(form.category_id),
    image_url:              form.image_url || '',
    is_available:           form.is_available,
  })

  const createMutation = useMutation({
    mutationFn: (form: ProductFormData) => menuItemsService.postMenuItem(formToRequest(form)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      setShowAddModal(false)
      setAddForm(DEFAULT_FORM)
      showSuccess('Product created successfully!')
    },
    onError: (err: any) => showError('Error creating product: ' + (err?.message ?? err)),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, form }: { id: string; form: ProductFormData }) =>
      menuItemsService.putMenuItem(id, formToRequest(form)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      setShowEditModal(false)
      setEditingProduct(null)
      showSuccess('Product updated successfully!')
    },
    onError: (err: any) => showError('Error updating product: ' + (err?.message ?? err)),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => menuItemsService.deleteMenuItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      showSuccess('Product deleted successfully!')
    },
    onError: (err: any) => showError('Error deleting product: ' + (err?.message ?? err)),
  })

  const handleAddNew = () => {
    setAddForm(DEFAULT_FORM)
    setAddErrors({})
    setShowAdvancedAdd(false)
    setShowAddModal(true)
  }

  const handleAddSubmit = () => {
    const errs = validateForm(addForm)
    if (Object.keys(errs).length > 0) { setAddErrors(errs); return }
    createMutation.mutate(addForm)
  }

  const handleEdit = (product: MenuItem) => {
    setEditingProduct(product)
    setEditForm({
      name:        product.menu_items_name,
      description: product.menu_items_description || '',
      price:       String(product.price),
      cost_price:  '',
      category_id: String(product.menu_items_category_id),
      image_url:   product.image_url || '',
      is_available: true,
    })
    setEditErrors({})
    setShowAdvancedEdit(false)
    setShowEditModal(true)
  }

  const handleEditSubmit = () => {
    const errs = validateForm(editForm)
    if (Object.keys(errs).length > 0) { setEditErrors(errs); return }
    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.menu_items_id.toString(), form: editForm })
    }
  }

  const handleDelete = (id: number, name: string) => {
    Alert.alert(
      'Delete Product',
      `Are you sure you want to delete "${name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate(id) },
      ]
    )
  }

  const filteredProducts = products?.filter(p =>
    p.menu_items_name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={C.orange} />
        <Text style={styles.loadingText}>Loading products...</Text>
      </View>
    )
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <AlertCircle size={48} color={C.error} />
        <Text style={styles.errorTitle}>Error loading products</Text>
        <Text style={styles.errorSub}>{String(error)}</Text>
      </View>
    )
  }

  const renderForm = (
    form: ProductFormData,
    setForm: (f: ProductFormData) => void,
    errors: Partial<Record<keyof ProductFormData, string>>,
    showAdvanced: boolean,
    setShowAdvanced: (v: boolean) => void,
    onSubmit: () => void,
    onCancel: () => void,
    isPending: boolean,
    submitLabel: string,
    pendingLabel: string,
  ) => (
    <ScrollView showsVerticalScrollIndicator={false}>

      <Text style={styles.label}>NAME</Text>
      <View style={[styles.inputBox, errors.name ? styles.inputError : null]}>
        <TextInput
          style={styles.input}
          placeholder="Product name"
          placeholderTextColor={C.muted}
          value={form.name}
          onChangeText={text => setForm({ ...form, name: text })}
        />
      </View>
      {errors.name && <Text style={styles.fieldError}>{errors.name}</Text>}

      <Text style={styles.label}>CATEGORY</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillRow}>
        {categories?.map(cat => (
          <TouchableOpacity
            key={cat.category_id}
            style={[styles.pill, form.category_id === String(cat.category_id) && styles.pillActive]}
            onPress={() => setForm({ ...form, category_id: String(cat.category_id) })}
          >
            <Text style={[styles.pillText, form.category_id === String(cat.category_id) && styles.pillTextActive]}>
              {cat.category_name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      {errors.category_id && <Text style={styles.fieldError}>{errors.category_id}</Text>}

      <View style={styles.row}>
        <View style={styles.halfField}>
          <Text style={styles.label}>PRICE (NPR)</Text>
          <View style={[styles.inputBox, errors.price ? styles.inputError : null]}>
            <Text style={styles.prefix}>Rs</Text>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              placeholderTextColor={C.muted}
              keyboardType="numeric"
              value={form.price}
              onChangeText={text => setForm({ ...form, price: text })}
            />
          </View>
          {errors.price && <Text style={styles.fieldError}>{errors.price}</Text>}
        </View>
        <View style={styles.halfField}>
          <Text style={styles.label}>COST (NPR)</Text>
          <View style={styles.inputBox}>
            <Text style={styles.prefix}>Rs</Text>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              placeholderTextColor={C.muted}
              keyboardType="numeric"
              value={form.cost_price}
              onChangeText={text => setForm({ ...form, cost_price: text })}
            />
          </View>
        </View>
      </View>

      <TouchableOpacity style={styles.advancedToggle} onPress={() => setShowAdvanced(!showAdvanced)}>
        <Text style={styles.advancedToggleText}>
          {showAdvanced ? 'Hide advanced ▲' : 'More options ▼'}
        </Text>
      </TouchableOpacity>

      {showAdvanced && (
        <View style={styles.advancedSection}>
          <Text style={styles.label}>DESCRIPTION</Text>
          <View style={styles.inputBox}>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Product description"
              placeholderTextColor={C.muted}
              value={form.description}
              onChangeText={text => setForm({ ...form, description: text })}
              multiline
              numberOfLines={3}
            />
          </View>

          <Text style={styles.label}>IMAGE URL</Text>
          <View style={styles.inputBox}>
            <TextInput
              style={styles.input}
              placeholder="https://example.com/image.jpg"
              placeholderTextColor={C.muted}
              value={form.image_url}
              onChangeText={text => setForm({ ...form, image_url: text })}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.label}>AVAILABLE</Text>
            <Switch
              value={form.is_available}
              onValueChange={val => setForm({ ...form, is_available: val })}
              trackColor={{ false: C.steel, true: C.orange }}
              thumbColor={C.white}
            />
          </View>
        </View>
      )}

      <View style={styles.modalButtons}>
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.submitButton, isPending && { opacity: 0.5 }]}
          onPress={onSubmit}
          disabled={isPending}
        >
          <Text style={styles.submitButtonText}>{isPending ? pendingLabel : submitLabel}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Menu Items</Text>
            <Text style={styles.subtitle}>Manage your product catalog</Text>
          </View>
          <TouchableOpacity style={styles.addButton} onPress={handleAddNew}>
            <Plus size={16} color={C.white} />
            <Text style={styles.addButtonText}>New</Text>
          </TouchableOpacity>
        </View>

        {successMsg && (
          <View style={styles.successBanner}>
            <CheckCircle size={15} color={C.success} />
            <Text style={styles.successText}>{successMsg}</Text>
          </View>
        )}
        {errorMsg && (
          <View style={styles.errorBanner}>
            <AlertCircle size={15} color={C.error} />
            <Text style={styles.errorBannerText}>{errorMsg}</Text>
          </View>
        )}

        <View style={styles.searchWrapper}>
          <Search size={15} color={C.orange} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            placeholderTextColor={C.muted}
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
        </View>

        {filteredProducts?.length === 0 && (
          <View style={styles.emptyState}>
            <Search size={40} color={C.steel} />
            <Text style={styles.emptyTitle}>
              {searchTerm ? 'No products found' : 'No products yet'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {searchTerm ? 'Try a different search' : 'Create your first product'}
            </Text>
            {!searchTerm && (
              <TouchableOpacity style={styles.addButton} onPress={handleAddNew}>
                <Plus size={14} color={C.white} />
                <Text style={styles.addButtonText}>Create Product</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {filteredProducts?.map(product => {
          const category = categories?.find(c => c.category_id === product.menu_items_category_id)
          return (
            <View key={product.menu_items_id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{product.menu_items_name}</Text>
                  {category && (
                    <View style={styles.categoryBadge}>
                      <Text style={styles.categoryBadgeText}>{category.category_name}</Text>
                    </View>
                  )}
                </View>
                <View style={styles.cardActions}>
                  <TouchableOpacity style={styles.editBtn} onPress={() => handleEdit(product)}>
                    <Edit size={14} color={C.orange} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => handleDelete(product.menu_items_id, product.menu_items_name)}
                  >
                    <Trash2 size={14} color={C.error} />
                  </TouchableOpacity>
                </View>
              </View>

              {product.menu_items_description ? (
                <Text style={styles.cardDescription} numberOfLines={2}>
                  {product.menu_items_description}
                </Text>
              ) : null}

              <View style={styles.cardFooter}>
                <Text style={styles.priceText}>Rs. {Number(product.price).toFixed(2)}</Text>
                <View style={styles.availableBadge}>
                  <View style={styles.availableDot} />
                  <Text style={styles.availableText}>Available</Text>
                </View>
              </View>
            </View>
          )
        })}
      </ScrollView>

      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>New Product</Text>
            {renderForm(
              addForm, setAddForm, addErrors,
              showAdvancedAdd, setShowAdvancedAdd,
              handleAddSubmit,
              () => setShowAddModal(false),
              createMutation.isPending,
              'Create Product', 'Creating...',
            )}
          </View>
        </View>
      </Modal>

      <Modal visible={showEditModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Edit Product</Text>
            {renderForm(
              editForm, setEditForm, editErrors,
              showAdvancedEdit, setShowAdvancedEdit,
              handleEditSubmit,
              () => { setShowEditModal(false); setEditingProduct(null) },
              updateMutation.isPending,
              'Save Changes', 'Saving...',
            )}
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.black },

  content: {
    padding: 20,
    paddingTop: 56,
    paddingBottom: 40,
    gap: 12,
  },

  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: C.black,
  },
  loadingText: { fontSize: 14, color: C.muted },
  errorTitle:  { fontSize: 16, fontWeight: '700', color: C.error },
  errorSub:    { fontSize: 13, color: C.dim, textAlign: 'center' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  title:    { fontSize: 24, fontWeight: '900', color: C.white, letterSpacing: 0.5 },
  subtitle: { fontSize: 13, color: C.muted, marginTop: 2 },

  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.orange,
    borderRadius: 100,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 6,
  },
  addButtonText: { color: C.white, fontWeight: '700', fontSize: 14 },

  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.successBg,
    borderWidth: 1,
    borderColor: C.success,
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  successText: { color: C.success, fontSize: 13 },

  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.errorBg,
    borderWidth: 1,
    borderColor: C.error,
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  errorBannerText: { color: C.error, fontSize: 13 },

  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.graphite,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  searchInput: { flex: 1, fontSize: 14, color: C.white },

  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 10,
  },
  emptyTitle:    { fontSize: 18, fontWeight: '700', color: C.offWhite },
  emptySubtitle: { fontSize: 13, color: C.muted, textAlign: 'center' },

  card: {
    backgroundColor: C.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  cardTitle: { fontSize: 16, fontWeight: '800', color: C.white },
  categoryBadge: {
    marginTop: 4,
    alignSelf: 'flex-start',
    backgroundColor: C.orangeTint,
    borderRadius: 100,
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
  categoryBadgeText: { fontSize: 11, color: C.orange, fontWeight: '700' },
  cardDescription: { fontSize: 13, color: C.dim, marginBottom: 12, lineHeight: 18 },

  cardActions: { flexDirection: 'row', gap: 8, marginLeft: 8 },
  editBtn: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: C.orangeTint,
    borderWidth: 1,
    borderColor: C.orangeDim,
  },
  deleteBtn: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: C.errorBg,
    borderWidth: 1,
    borderColor: '#7A1010',
  },

  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  priceText: { fontSize: 16, fontWeight: '800', color: C.orange },

  availableBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: C.successBg,
    borderRadius: 100,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#1A4A2A',
  },
  availableDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.success },
  availableText: { fontSize: 11, fontWeight: '700', color: C.success },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: C.charcoal,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    maxHeight: '92%',
    borderTopWidth: 1,
    borderColor: C.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: C.white,
    marginBottom: 20,
    letterSpacing: 0.3,
  },

  label: {
    fontSize: 11,
    fontWeight: '700',
    color: C.muted,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 14,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.graphite,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 14,
    minHeight: 50,
  },
  inputError: { borderColor: C.error },
  prefix: { fontSize: 13, color: C.orange, marginRight: 8, fontWeight: '700' },
  input: { flex: 1, fontSize: 14, color: C.white, paddingVertical: 12 },
  textArea: { height: 80, textAlignVertical: 'top', paddingVertical: 12 },
  fieldError: { fontSize: 11, color: C.error, marginTop: 4 },

  row:       { flexDirection: 'row', gap: 12 },
  halfField: { flex: 1 },

  pillRow: { marginVertical: 6 },
  pill: {
    borderRadius: 100,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
    backgroundColor: C.graphite,
  },
  pillActive:     { backgroundColor: C.orange, borderColor: C.orange },
  pillText:       { fontSize: 13, color: C.dim },
  pillTextActive: { color: C.white, fontWeight: '700' },

  advancedToggle: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 16,
    backgroundColor: C.graphite,
  },
  advancedToggleText: { fontSize: 13, color: C.orange, fontWeight: '600' },
  advancedSection: {
    borderTopWidth: 1,
    borderTopColor: C.border,
    marginTop: 14,
    paddingTop: 4,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
  },

  modalButtons: { flexDirection: 'row', gap: 12, marginTop: 24, marginBottom: 8 },
  cancelButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: C.graphite,
  },
  cancelButtonText: { fontSize: 15, color: C.dim, fontWeight: '600' },
  submitButton: {
    flex: 1,
    backgroundColor: C.orange,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitButtonText: { fontSize: 15, color: C.white, fontWeight: '800' },
})