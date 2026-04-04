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
    const [searchTerm, setSearchTerm] = useState('')
    const [showAddModal, setShowAddModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [editingProduct, setEditingProduct] = useState< MenuItem| null>(null)
    const [addForm, setAddForm] = useState<ProductFormData>(DEFAULT_FORM)
    const [editForm, setEditForm] = useState<ProductFormData>(DEFAULT_FORM)
    const [addErrors, setAddErrors] = useState<Partial<Record<keyof ProductFormData, string>>>({})
    const [editErrors, setEditErrors] = useState<Partial<Record<keyof ProductFormData, string>>>({})
    const [showAdvancedAdd, setShowAdvancedAdd] = useState(false)
    const [showAdvancedEdit, setShowAdvancedEdit] = useState(false)
    const [showSuccessMessage, setShowSuccessMessage] = useState<string | null>(null)
    const [showErrorMessage, setShowErrorMessage] = useState<string | null>(null)

    const queryClient = useQueryClient()

    // ── Queries ──────────────────────────────────────────────

    const { data: products, isLoading, error } = useQuery<MenuItem[]>({
        queryKey: ['products'],
        queryFn: () => menuItemsService.getMenuItem(),
        retry: 3,
    })

    const { data: categories } = useQuery<Category[]>({
        queryKey: ['categories'],
        queryFn: () => categoriesService.getCategory(),
    })


    const showSuccess = (msg: string) => {
        setShowSuccessMessage(msg)
        setTimeout(() => setShowSuccessMessage(null), 3000)
    }

    const showError = (msg: string) => {
        setShowErrorMessage(msg)
        setTimeout(() => setShowErrorMessage(null), 5000)
    }

    const validateForm = (form: ProductFormData) => {
        const errs: Partial<Record<keyof ProductFormData, string>> = {}
        if (!form.name.trim()) errs.name = 'Name is required'
        if (!form.price || isNaN(parseFloat(form.price))) errs.price = 'Valid price is required'
        if (!form.category_id) errs.category_id = 'Category is required'
        return errs
    }

    const formToRequest = (form: ProductFormData) => ({
         menu_items_name: form.name,
  menu_items_description: form.description || '',
  slug: form.name.toLowerCase().replace(/\s+/g, '-'),
  price: parseFloat(form.price) || 0,
  menu_items_category_id: parseInt(form.category_id),
  image_url: form.image_url || '',
    })


    const createProductMutation = useMutation({
        mutationFn: async (form: ProductFormData) => {
            return await menuItemsService.postMenuItem(formToRequest(form))
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] })
            setShowAddModal(false)
            setAddForm(DEFAULT_FORM)
            showSuccess('Product created successfully!')
        },
        onError: (err) => showError('Error creating product: ' + err),
    })

    const updateProductMutation = useMutation({
        mutationFn: async ({ id, form }: { id: string; form: ProductFormData }) => {
            return await menuItemsService.putMenuItem(id, formToRequest(form))
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] })
            setShowEditModal(false)
            setEditingProduct(null)
            showSuccess('Product updated successfully!')
        },
        onError: (err) => showError('Error updating product: ' + err),
    })

    const deleteProductMutation = useMutation({
        mutationFn: async (id: number) => {
            await menuItemsService.deleteMenuItem(id)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] })
            showSuccess('Product deleted successfully!')
        },
        onError: (err) => showError('Error deleting product: ' + err),
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
        createProductMutation.mutate(addForm)
    }

    const handleEdit = (product: MenuItem) => {
        setEditingProduct(product)
        setEditForm({
             name: product.menu_items_name,
            description: product.menu_items_description || '',
            price: String(product.price),
            cost_price: '',
            category_id: String(product.menu_items_category_id),
            image_url: product.image_url || '',
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
            updateProductMutation.mutate({ id: editingProduct.menu_items_id.toString(), form: editForm })
        }
    }

    const handleDelete = (id: number, name: string) => {
        Alert.alert(
            'Delete Product',
            `Are you sure you want to delete "${name}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => deleteProductMutation.mutate(id) },
            ]
        )
    }

    const filteredProducts = products?.filter(p =>
        p.menu_items_name.toLowerCase().includes(searchTerm.toLowerCase())
    )


    if (isLoading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#B5822A" />
            </View>
        )
    }

    if (error) {
        return (
            <View style={styles.centered}>
                <AlertCircle size={48} color="#A03020" />
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

            <Text style={styles.label}>Name *</Text>
            <TextInput
                style={[styles.input, errors.name && styles.inputError]}
                placeholder="Product name"
                placeholderTextColor="#9E8E50"
                value={form.name}
                onChangeText={text => setForm({ ...form, name: text })}
            />
            {errors.name && <Text style={styles.fieldError}>{errors.name}</Text>}

            <Text style={styles.label}>Category *</Text>
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
                    <Text style={styles.label}>Price (NPR) *</Text>
                    <TextInput
                        style={[styles.input, errors.price && styles.inputError]}
                        placeholder="0.00"
                        placeholderTextColor="#9E8E50"
                        keyboardType="numeric"
                        value={form.price}
                        onChangeText={text => setForm({ ...form, price: text })}
                    />
                    {errors.price && <Text style={styles.fieldError}>{errors.price}</Text>}
                </View>
                <View style={styles.halfField}>
                    <Text style={styles.label}>Cost (NPR)</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="0.00"
                        placeholderTextColor="#9E8E50"
                        keyboardType="numeric"
                        value={form.cost_price}
                        onChangeText={text => setForm({ ...form, cost_price: text })}
                    />
                </View>
            </View>

            <TouchableOpacity
                style={styles.advancedToggle}
                onPress={() => setShowAdvanced(!showAdvanced)}
            >
                <Text style={styles.advancedToggleText}>
                    {showAdvanced ? 'Hide advanced options ▲' : 'Show more options ▼'}
                </Text>
            </TouchableOpacity>

            {showAdvanced && (
                <View style={styles.advancedSection}>

                    <Text style={styles.label}>Description</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder="Product description"
                        placeholderTextColor="#9E8E50"
                        value={form.description}
                        onChangeText={text => setForm({ ...form, description: text })}
                        multiline
                        numberOfLines={2}
                    />

    
                    <Text style={styles.label}>Image URL</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="https://example.com/image.jpg"
                        placeholderTextColor="#9E8E50"
                        value={form.image_url}
                        onChangeText={text => setForm({ ...form, image_url: text })}
                        autoCapitalize="none"
                    />

                    
                    <View style={styles.switchRow}>
                        <Text style={styles.label}>Available</Text>
                        <Switch
                            value={form.is_available}
                            onValueChange={val => setForm({ ...form, is_available: val })}
                            trackColor={{ false: '#DEC07A', true: '#B5822A' }}
                            thumbColor="#FFFFFF"
                        />
                    </View>
                </View>
            )}

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

                <View style={styles.header}>
                    <View>
                        <Text style={styles.title}>Menu Items</Text>
                        <Text style={styles.subtitle}>Manage your product catalog</Text>
                    </View>
                    <TouchableOpacity style={styles.addButton} onPress={handleAddNew}>
                        <Plus size={16} color="#FDF6EC" />
                        <Text style={styles.addButtonText}>New Product</Text>
                    </TouchableOpacity>
                </View>

                {showSuccessMessage && (
                    <View style={styles.successBanner}>
                        <CheckCircle size={16} color="#3B6E52" />
                        <Text style={styles.successText}>{showSuccessMessage}</Text>
                    </View>
                )}
                {showErrorMessage && (
                    <View style={styles.errorBanner}>
                        <AlertCircle size={16} color="#A03020" />
                        <Text style={styles.errorBannerText}>{showErrorMessage}</Text>
                    </View>
                )}

                <View style={styles.searchWrapper}>
                    <Search size={16} color="#B5822A" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search a product..."
                        placeholderTextColor="#B5822A"
                        value={searchTerm}
                        onChangeText={setSearchTerm}
                    />
                </View>

                {filteredProducts?.length === 0 && (
                    <View style={styles.emptyState}>
                        <Search size={48} color="#DEC07A" />
                        <Text style={styles.emptyTitle}>
                            {searchTerm ? 'No products found' : 'No products'}
                        </Text>
                        <Text style={styles.emptySubtitle}>
                            {searchTerm
                                ? 'Try adjusting your search criteria'
                                : 'Start by creating your first product'
                            }
                        </Text>
                        {!searchTerm && (
                            <TouchableOpacity style={styles.addButton} onPress={handleAddNew}>
                                <Text style={styles.addButtonText}>Create a product</Text>
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
                                        <Text style={styles.categoryName}>{category.category_name}</Text>
                                    )}
                                    {product.menu_items_description && (
                                        <Text style={styles.cardDescription} numberOfLines={2}>
                                            {product.menu_items_description}
                                        </Text>
                                    )}
                                </View>
                                <View style={styles.cardActions}>
                                    <TouchableOpacity style={styles.iconButton} onPress={() => handleEdit(product)}>
                                        <Edit size={15} color="#B5822A" />
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.iconButton} onPress={() => handleDelete(product.menu_items_id, product.menu_items_name)}>
                                        <Trash2 size={15} color="#A03020" />
                                    </TouchableOpacity>
                                </View>
                            </View>

<View style={styles.cardInfo}>
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>Price:</Text>
    <Text style={styles.infoPrice}>Rs. {Number(product.price).toFixed(2)}</Text>
  </View>
</View>

<View style={styles.cardFooter}>
  <Text style={styles.footerDate}>
    {product.menu_items_description || 'No description'}
  </Text>
  <View style={styles.statusBadge}>
    <Text style={styles.statusActiveText}>Available</Text>
  </View>
</View>

<View style={styles.cardFooter}>
  <Text style={styles.footerDate}>
    {product.menu_items_description || 'No description'}
  </Text>
  <View style={[styles.statusBadge, styles.statusActive]}>
    <Text style={[styles.statusText, styles.statusActiveText]}>
      Available
    </Text>
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
                            createProductMutation.isPending,
                            'Create', 'Creating...',
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
                            updateProductMutation.isPending,
                            'Update', 'Updating...',
                        )}
                    </View>
                </View>
            </Modal>
        </View>
    )
}


const C = {
    espresso: '#1C1008',
    roast: '#3D2010',
    clay: '#7A4528',
    latte: '#C8956A',
    cream: '#FDF6EC',
    parchment: '#F5E9D4',
    vellum: '#EDD9BC',
    brass: '#B5822A',
    brassLight: '#F7EDD8',
    brassBorder: '#DEC07A',
    sage: '#3B6E52',
    sageLight: '#EBF4EE',
    sageBorder: '#9FCFB4',
    terracotta: '#A03020',
    tcLight: '#FAECEA',
    tcBorder: '#E8A898',
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: C.parchment,
    },
    content: {
        padding: 16,
        paddingTop: 52,
        paddingBottom: 32,
        gap: 12,
    },
    centered: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        backgroundColor: C.parchment,
    },
    errorTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: C.terracotta,
        fontFamily: 'Inter',
    },
    errorSub: {
        fontSize: 13,
        color: C.clay,
        fontFamily: 'Inter',
    },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: C.espresso,
        fontFamily: 'Inter',
    },
    subtitle: {
        fontSize: 13,
        color: C.clay,
        fontFamily: 'Inter',
        marginTop: 2,
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: C.brass,
        borderRadius: 100,
        paddingHorizontal: 16,
        paddingVertical: 10,
        gap: 6,
    },
    addButtonText: {
        color: C.cream,
        fontWeight: '600',
        fontSize: 14,
        fontFamily: 'Inter',
    },

    successBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: C.sageLight,
        borderWidth: 1,
        borderColor: C.sageBorder,
        borderRadius: 12,
        padding: 12,
        gap: 8,
    },
    successText: {
        color: C.sage,
        fontSize: 13,
        fontFamily: 'Inter',
    },
    errorBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: C.tcLight,
        borderWidth: 1,
        borderColor: C.tcBorder,
        borderRadius: 12,
        padding: 12,
        gap: 8,
    },
    errorBannerText: {
        color: C.terracotta,
        fontSize: 13,
        fontFamily: 'Inter',
    },

    searchWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: C.cream,
        borderWidth: 1,
        borderColor: C.brassBorder,
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        gap: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        color: C.espresso,
        fontFamily: 'Inter',
    },

    emptyState: {
        alignItems: 'center',
        paddingVertical: 48,
        gap: 10,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: C.espresso,
        fontFamily: 'Inter',
    },
    emptySubtitle: {
        fontSize: 13,
        color: C.clay,
        fontFamily: 'Inter',
        textAlign: 'center',
    },

    card: {
        backgroundColor: C.cream,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: C.brassBorder,
        padding: 14,
        shadowColor: C.espresso,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 2,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 10,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: C.espresso,
        fontFamily: 'Inter',
    },
    categoryName: {
        fontSize: 12,
        color: C.brass,
        fontFamily: 'Inter',
        fontWeight: '600',
        marginTop: 4,
    },
    cardDescription: {
        fontSize: 12,
        color: C.clay,
        fontFamily: 'Inter',
        marginTop: 4,
    },
    cardActions: {
        flexDirection: 'row',
        gap: 4,
        marginLeft: 8,
    },
    iconButton: {
        padding: 7,
        borderRadius: 8,
        backgroundColor: C.brassLight,
    },
    cardInfo: {
        gap: 6,
        marginBottom: 10,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    infoLabel: {
        fontSize: 13,
        color: C.clay,
        fontFamily: 'Inter',
    },
    infoPrice: {
        fontSize: 13,
        fontWeight: '700',
        color: C.brass,
        fontFamily: 'Inter',
    },
    infoValue: {
        fontSize: 13,
        fontWeight: '600',
        color: C.roast,
        fontFamily: 'Inter',
    },
    cardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: C.vellum,
    },
    footerDate: {
        fontSize: 11,
        color: C.latte,
        fontFamily: 'Inter',
    },
    statusBadge: {
        borderRadius: 9999,
        paddingHorizontal: 10,
        paddingVertical: 3,
    },
    statusActive: { backgroundColor: C.sageLight },
    statusInactive: { backgroundColor: C.tcLight },
    statusText: { fontSize: 11, fontWeight: '600', fontFamily: 'Inter' },
    statusActiveText: { color: C.sage },
    statusInactiveText: { color: C.terracotta },

    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(28,16,8,0.55)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        backgroundColor: C.cream,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        maxHeight: '92%',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: C.espresso,
        fontFamily: 'Inter',
        marginBottom: 16,
    },

    label: {
        fontSize: 13,
        fontWeight: '600',
        color: C.espresso,
        fontFamily: 'Inter',
        marginBottom: 6,
        marginTop: 12,
    },
    input: {
        borderWidth: 1,
        borderColor: C.brassBorder,
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 10,
        fontSize: 14,
        color: C.espresso,
        backgroundColor: C.brassLight,
        fontFamily: 'Inter',
    },
    inputError: { borderColor: C.terracotta },
    textArea: { height: 70, textAlignVertical: 'top' },
    fieldError: {
        fontSize: 11,
        color: C.terracotta,
        fontFamily: 'Inter',
        marginTop: 3,
    },
    row: { flexDirection: 'row', gap: 12 },
    halfField: { flex: 1 },


    pillRow: { marginTop: 4, marginBottom: 4 },
    pill: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 100,
        borderWidth: 1,
        borderColor: C.brassBorder,
        paddingHorizontal: 14,
        paddingVertical: 7,
        marginRight: 8,
        backgroundColor: C.brassLight,
    },
    pillActive: { backgroundColor: C.brass, borderColor: C.brass },
    pillText: { fontSize: 13, color: C.clay, fontFamily: 'Inter' },
    pillTextActive: { color: C.cream, fontWeight: '600' },

    advancedToggle: {
        borderWidth: 1,
        borderColor: C.brassBorder,
        borderRadius: 12,
        paddingVertical: 10,
        alignItems: 'center',
        marginTop: 14,
        backgroundColor: C.brassLight,
    },
    advancedToggleText: {
        fontSize: 13,
        color: C.brass,
        fontWeight: '600',
        fontFamily: 'Inter',
    },
    advancedSection: {
        borderTopWidth: 1,
        borderTopColor: C.brassBorder,
        marginTop: 12,
        paddingTop: 4,
    },
    switchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 12,
    },

    modalButtons: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 20,
        marginBottom: 8,
    },
    cancelButton: {
        flex: 1,
        borderWidth: 1,
        borderColor: C.brassBorder,
        borderRadius: 100,
        paddingVertical: 12,
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: 15,
        color: C.clay,
        fontWeight: '600',
        fontFamily: 'Inter',
    },
    submitButton: {
        flex: 1,
        backgroundColor: C.brass,
        borderRadius: 100,
        paddingVertical: 12,
        alignItems: 'center',
    },
    submitButtonDisabled: { opacity: 0.5 },
    submitButtonText: {
        fontSize: 15,
        color: C.cream,
        fontWeight: '600',
        fontFamily: 'Inter',
    },
})
