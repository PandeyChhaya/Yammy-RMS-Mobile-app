import AsyncStorage from '@react-native-async-storage/async-storage'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertCircle, CheckCircle, Edit, Plus, Tags, Trash2, Utensils } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import {
  ActivityIndicator, Alert, Modal, ScrollView, StyleSheet,
  Text, TextInput, TouchableOpacity, View,
} from 'react-native'
import categoriesService from './services/categoriesService'

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
const radius = { xs:6, sm:10, md:14, lg:18, pill:100 }

interface Category {
  category_id:           number
  category_name:         string
  category_description?: string
  is_active:             boolean
}

interface CategoryFormData {
  category_name:        string
  category_description: string
  is_active:            boolean
}

const DEFAULT_FORM: CategoryFormData = {
  category_name: '', category_description: '', is_active: true,
}

export default function Categories() {
  const [canManage,       setCanManage]       = useState(false)
  const [showAddModal,    setShowAddModal]    = useState(false)
  const [showEditModal,   setShowEditModal]   = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [addForm,         setAddForm]         = useState<CategoryFormData>(DEFAULT_FORM)
  const [editForm,        setEditForm]        = useState<CategoryFormData>(DEFAULT_FORM)
  const [addErrors,       setAddErrors]       = useState<Partial<CategoryFormData>>({})
  const [editErrors,      setEditErrors]      = useState<Partial<CategoryFormData>>({})
  const [successMsg,      setSuccessMsg]      = useState<string | null>(null)
  const [errorMsg,        setErrorMsg]        = useState<string | null>(null)
  const [focusedInput,    setFocusedInput]    = useState<string | null>(null)

  useEffect(() => {
    AsyncStorage.getItem('@userRole').then(role => {
      setCanManage(role === 'Admin' || role === 'Super Admin')
    })
  }, [])

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
      setShowAddModal(false); setAddForm(DEFAULT_FORM)
      flash('success', 'Category created!')
    },
    onError: (err) => flash('error', 'Error creating: ' + err),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CategoryFormData }) =>
      categoriesService.putCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      setShowEditModal(false); setEditingCategory(null)
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

  const flash = (type: 'success' | 'error', msg: string) => {
    if (type === 'success') { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(null), 3000) }
    else { setErrorMsg(msg); setTimeout(() => setErrorMsg(null), 5000) }
  }

  const validate = (form: CategoryFormData): Partial<CategoryFormData> => {
    const errs: Partial<CategoryFormData> = {}
    if (!form.category_name.trim()) errs.category_name = 'Name is required'
    return errs
  }

  const handleAddNew = () => { setAddForm(DEFAULT_FORM); setAddErrors({}); setShowAddModal(true) }

  const handleAddSubmit = () => {
    const errs = validate(addForm)
    if (Object.keys(errs).length > 0) { setAddErrors(errs); return }
    createMutation.mutate(addForm)
  }

  const handleEdit = (cat: Category) => {
    setEditingCategory(cat)
    setEditForm({ category_name: cat.category_name, category_description: cat.category_description || '', is_active: cat.is_active })
    setEditErrors({}); setShowEditModal(true)
  }

  const handleEditSubmit = () => {
    const errs = validate(editForm)
    if (Object.keys(errs).length > 0) { setEditErrors(errs); return }
    if (editingCategory) updateMutation.mutate({ id: String(editingCategory.category_id), data: editForm })
  }

  const handleDelete = (id: number, name: string) => {
    Alert.alert('Delete Category', `Remove "${name}" permanently?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate(id) },
    ])
  }

  const inputStyle = (key: string) => [s.input, focusedInput === key && s.inputFocused]

  if (isLoading) return (
    <View style={s.centered}>
      <View style={s.loadingIcon}><Utensils size={24} color={C.orange} /></View>
      <ActivityIndicator size="large" color={C.orange} style={{ marginTop: 16 }} />
      <Text style={s.loadingText}>Loading Categories…</Text>
    </View>
  )

  if (error) return (
    <View style={s.centered}>
      <AlertCircle size={44} color={C.error} />
      <Text style={s.errorTitle}>Failed to load</Text>
      <Text style={s.errorSub}>{String(error)}</Text>
    </View>
  )

  const renderForm = (
    form: CategoryFormData,
    setForm: (f: CategoryFormData) => void,
    errors: Partial<CategoryFormData>,
    onSubmit: () => void,
    onCancel: () => void,
    isPending: boolean,
    submitLabel: string,
    pendingLabel: string,
    prefix: string,
  ) => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <Text style={s.label}>Category Name *</Text>
      <TextInput
        style={[inputStyle(`${prefix}_name`), errors.category_name && s.inputError]}
        placeholder="e.g. Starters, Mains, Desserts"
        placeholderTextColor={C.muted}
        value={form.category_name}
        onChangeText={t => setForm({ ...form, category_name: t })}
        onFocus={() => setFocusedInput(`${prefix}_name`)}
        onBlur={() => setFocusedInput(null)}
      />
      {errors.category_name && <Text style={s.fieldError}>{errors.category_name}</Text>}

      <Text style={s.label}>Description</Text>
      <TextInput
        style={[inputStyle(`${prefix}_desc`), s.textArea]}
        placeholder="Short description (optional)"
        placeholderTextColor={C.muted}
        value={form.category_description}
        onChangeText={t => setForm({ ...form, category_description: t })}
        multiline numberOfLines={3}
        onFocus={() => setFocusedInput(`${prefix}_desc`)}
        onBlur={() => setFocusedInput(null)}
      />

      <View style={s.toggleRow}>
        <View>
          <Text style={s.toggleLabel}>Active</Text>
          <Text style={s.toggleSub}>Visible to customers & staff</Text>
        </View>
        <TouchableOpacity
          style={[s.toggle, form.is_active && s.toggleOn]}
          onPress={() => setForm({ ...form, is_active: !form.is_active })}
        >
          <View style={[s.toggleThumb, form.is_active && s.toggleThumbOn]} />
        </TouchableOpacity>
      </View>

      <View style={s.modalButtons}>
        <TouchableOpacity style={s.cancelButton} onPress={onCancel}>
          <Text style={s.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.submitButton, isPending && { opacity: 0.5 }]}
          onPress={onSubmit} disabled={isPending} activeOpacity={0.85}
        >
          <Text style={s.submitButtonText}>{isPending ? pendingLabel : submitLabel}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )

  return (
    <View style={s.container}>
      <View style={s.blob1} /><View style={s.blob2} />

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

        <View style={s.header}>
          <View>
            <Text style={s.title}>Categories</Text>
            <Text style={s.subtitle}>{canManage ? 'Manage your menu categories' : 'Browse all categories'}</Text>
          </View>
          {canManage && (
            <TouchableOpacity style={s.addButton} onPress={handleAddNew} activeOpacity={0.85}>
              <Plus size={15} color={C.white} />
              <Text style={s.addButtonText}>New</Text>
            </TouchableOpacity>
          )}
        </View>

        {successMsg && (
          <View style={s.successBanner}>
            <CheckCircle size={14} color={C.success} />
            <Text style={s.successText}>{successMsg}</Text>
          </View>
        )}
        {errorMsg && (
          <View style={s.errorBanner}>
            <AlertCircle size={14} color={C.error} />
            <Text style={s.errorBannerText}>{errorMsg}</Text>
          </View>
        )}

        {categories?.length === 0 && (
          <View style={s.emptyState}>
            <View style={s.emptyIcon}><Tags size={28} color={C.orange} /></View>
            <Text style={s.emptyTitle}>No categories yet</Text>
            <Text style={s.emptySub}>
              {canManage ? 'Create your first category to get started' : 'No categories have been added'}
            </Text>
            {canManage && (
              <TouchableOpacity style={s.addButton} onPress={handleAddNew} activeOpacity={0.85}>
                <Plus size={14} color={C.white} />
                <Text style={s.addButtonText}>Create Category</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {categories?.map((cat: Category) => (
          <View key={cat.category_id} style={s.card}>
            <View style={s.cardAccentBar} />
            <View style={s.cardInner}>
              <View style={s.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={s.cardTitle}>{cat.category_name}</Text>
                  {cat.category_description ? (
                    <Text style={s.cardDesc} numberOfLines={2}>{cat.category_description}</Text>
                  ) : null}
                </View>
                {canManage && (
                  <View style={s.cardActions}>
                    <TouchableOpacity style={s.iconBtn} onPress={() => handleEdit(cat)} activeOpacity={0.8}>
                      <Edit size={14} color={C.orange} />
                    </TouchableOpacity>
                    <TouchableOpacity style={[s.iconBtn, s.iconBtnDanger]} onPress={() => handleDelete(cat.category_id, cat.category_name)} activeOpacity={0.8}>
                      <Trash2 size={14} color={C.error} />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
              <View style={s.cardFooter}>
                <View style={[s.statusBadge, cat.is_active ? s.statusActive : s.statusInactive]}>
                  <View style={[s.statusDot, { backgroundColor: cat.is_active ? C.success : C.muted }]} />
                  <Text style={[s.statusText, { color: cat.is_active ? C.success : C.muted }]}>
                    {cat.is_active ? 'Active' : 'Inactive'}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        ))}

      </ScrollView>

      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={s.modalContainer}>
            <View style={s.modalHandle} />
            <Text style={s.modalTitle}>New Category</Text>
            {renderForm(addForm, setAddForm, addErrors, handleAddSubmit, () => setShowAddModal(false), createMutation.isPending, 'Create Category', 'Creating…', 'add')}
          </View>
        </View>
      </Modal>

      <Modal visible={showEditModal} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={s.modalContainer}>
            <View style={s.modalHandle} />
            <Text style={s.modalTitle}>Edit Category</Text>
            {renderForm(editForm, setEditForm, editErrors, handleEditSubmit, () => { setShowEditModal(false); setEditingCategory(null) }, updateMutation.isPending, 'Save Changes', 'Saving…', 'edit')}
          </View>
        </View>
      </Modal>
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex:1, backgroundColor:C.black },
  content:   { padding:20, paddingTop:56, paddingBottom:40 },
  centered:  { flex:1, alignItems:'center', justifyContent:'center', backgroundColor:C.black, gap:12 },
  blob1: { position:'absolute', top:-80, left:'20%', width:260, height:260, borderRadius:130, backgroundColor:C.orange, opacity:0.08 },
  blob2: { position:'absolute', top:-40, left:'45%', width:180, height:180, borderRadius:90,  backgroundColor:C.orange, opacity:0.12 },

  loadingIcon: { width:56, height:56, borderRadius:14, backgroundColor:C.orangeTint, borderWidth:1.5, borderColor:C.orangeDim, alignItems:'center', justifyContent:'center' },
  loadingText: { fontSize:14, fontWeight:'700', color:C.muted, marginTop:8 },
  errorTitle:  { fontSize:16, fontWeight:'800', color:C.error },
  errorSub:    { fontSize:12, color:C.muted },

  header:        { flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom:20 },
  title:         { fontSize:24, fontWeight:'900', color:C.white, letterSpacing:0.3 },
  subtitle:      { fontSize:12, color:C.muted, marginTop:2 },
  addButton:     { flexDirection:'row', alignItems:'center', backgroundColor:C.orange, borderRadius:radius.pill, paddingHorizontal:16, paddingVertical:10, gap:6 },
  addButtonText: { color:C.white, fontWeight:'800', fontSize:13 },

  successBanner:   { flexDirection:'row', alignItems:'center', backgroundColor:C.successBg, borderWidth:1, borderColor:C.success, borderRadius:radius.md, padding:12, marginBottom:14, gap:8 },
  successText:     { color:C.success, fontSize:13, fontWeight:'600' },
  errorBanner:     { flexDirection:'row', alignItems:'center', backgroundColor:C.errorBg, borderWidth:1, borderColor:C.error, borderRadius:radius.md, padding:12, marginBottom:14, gap:8 },
  errorBannerText: { color:C.error, fontSize:13, fontWeight:'600' },

  emptyState: { alignItems:'center', paddingVertical:60, gap:12 },
  emptyIcon:  { width:68, height:68, borderRadius:radius.lg, backgroundColor:C.orangeTint, borderWidth:1.5, borderColor:C.orangeDim, alignItems:'center', justifyContent:'center' },
  emptyTitle: { fontSize:17, fontWeight:'800', color:C.white },
  emptySub:   { fontSize:13, color:C.muted, textAlign:'center', paddingHorizontal:32 },

  card:         { flexDirection:'row', backgroundColor:C.card, borderRadius:radius.md, borderWidth:1, borderColor:C.border, marginBottom:10, overflow:'hidden' },
  cardAccentBar:{ width:3, backgroundColor:C.orange },
  cardInner:    { flex:1, padding:14 },
  cardHeader:   { flexDirection:'row', alignItems:'flex-start', justifyContent:'space-between', marginBottom:10 },
  cardTitle:    { fontSize:15, fontWeight:'800', color:C.white },
  cardDesc:     { fontSize:12, color:C.muted, marginTop:3, lineHeight:17 },
  cardActions:  { flexDirection:'row', gap:6, marginLeft:10 },
  iconBtn:      { padding:7, borderRadius:radius.xs, backgroundColor:C.orangeTint, borderWidth:1, borderColor:C.orangeDim },
  iconBtnDanger:{ backgroundColor:C.errorBg, borderColor:'#7A1010' },
  cardFooter:   { flexDirection:'row', alignItems:'center' },
  statusBadge:  { flexDirection:'row', alignItems:'center', gap:5, borderRadius:radius.pill, paddingHorizontal:9, paddingVertical:4 },
  statusActive: { backgroundColor:C.successBg },
  statusInactive:{ backgroundColor:C.graphite },
  statusDot:    { width:5, height:5, borderRadius:3 },
  statusText:   { fontSize:10, fontWeight:'700', letterSpacing:0.5 },

  modalOverlay:   { flex:1, backgroundColor:'rgba(0,0,0,0.75)', justifyContent:'flex-end' },
  modalContainer: { backgroundColor:C.charcoal, borderTopLeftRadius:28, borderTopRightRadius:28, borderTopWidth:1, borderColor:C.border, padding:24, maxHeight:'90%' },
  modalHandle:    { width:36, height:4, borderRadius:radius.pill, backgroundColor:C.graphite, alignSelf:'center', marginBottom:20 },
  modalTitle:     { fontSize:18, fontWeight:'900', color:C.white, letterSpacing:0.4, marginBottom:4 },

  label:        { fontSize:10, fontWeight:'800', color:C.muted, marginBottom:6, marginTop:16, textTransform:'uppercase', letterSpacing:1.4 },
  input:        { borderWidth:1.5, borderColor:C.border, borderRadius:radius.md, paddingHorizontal:14, paddingVertical:12, fontSize:14, color:C.white, backgroundColor:C.black },
  inputFocused: { borderColor:C.orange },
  inputError:   { borderColor:C.error },
  textArea:     { height:80, textAlignVertical:'top' },
  fieldError:   { fontSize:11, color:C.error, marginTop:4, fontWeight:'600' },

  toggleRow:      { flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginTop:20, padding:14, backgroundColor:C.card, borderRadius:radius.md, borderWidth:1, borderColor:C.border },
  toggleLabel:    { fontSize:14, fontWeight:'700', color:C.white },
  toggleSub:      { fontSize:11, color:C.muted, marginTop:2 },
  toggle:         { width:44, height:26, borderRadius:radius.pill, backgroundColor:C.graphite, borderWidth:1, borderColor:C.border, justifyContent:'center', paddingHorizontal:3 },
  toggleOn:       { backgroundColor:C.orange, borderColor:C.orange },
  toggleThumb:    { width:18, height:18, borderRadius:radius.pill, backgroundColor:C.muted, alignSelf:'flex-start' },
  toggleThumbOn:  { backgroundColor:C.white, alignSelf:'flex-end' },

  modalButtons:     { flexDirection:'row', gap:12, marginTop:24, marginBottom:8 },
  cancelButton:     { flex:1, borderWidth:1.5, borderColor:C.border, borderRadius:radius.pill, paddingVertical:13, alignItems:'center', backgroundColor:C.graphite },
  cancelButtonText: { fontSize:14, color:C.dim, fontWeight:'700' },
  submitButton:     { flex:2, backgroundColor:C.orange, borderRadius:radius.pill, paddingVertical:13, alignItems:'center' },
  submitButtonText: { fontSize:14, color:C.white, fontWeight:'800', letterSpacing:0.3 },
})
