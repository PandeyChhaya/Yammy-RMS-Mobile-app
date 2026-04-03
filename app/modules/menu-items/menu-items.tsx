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
import { logsService } from '../../../shared/services/logsService'
import { LogCategory } from '../../../shared/types/logs'
import categoriesService from '../categories/services/categoriesService'

interface Product {
    id: string
    name: string
    description?: string
    price: number
    cost?: number
    category_id: string
    barcode?: string
    sku?: string
    stock_quantity?: number
    min_stock?: number
    image_url?: string
    is_active: boolean
    created_at: string
    updated_at: string
}

interface Category {
    id: string
    name: string
    description?: string
    color: string
    is_active: boolean
    created_at: string
    updated_at: string
}

interface ProductFormData {
    name: string
    description: string
    price: string
    cost: string
    category_id: string
    barcode: string
    sku: string
    stock_quantity: string
    min_stock: string
    image_url: string
    is_active: boolean
}

const DEFAULT_FORM: ProductFormData = {
    name: '',
    description: '',
    price: '',
    cost: '',
    category_id: '',
    barcode: '',
    sku: '',
    stock_quantity: '',
    min_stock: '',
    image_url: '',
    is_active: true,
}

export default function Products() {
    const [searchTerm, setSearchTerm] = useState('')
    const [showAddModal, setShowAddModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [editingProduct, setEditingProduct] = useState<Product | null>(null)
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

    const { data: products, isLoading, error } = useQuery<Product[]>({
        queryKey: ['products'],
        queryFn: () => productsService.getProducts(),
        retry: 3,
    })

    const { data: categories } = useQuery<Category[]>({
        queryKey: ['categories'],
        queryFn: () => categoriesService.getCategories(),
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

    const validateForm = (form: ProductFormData) => {
        const errs: Partial<Record<keyof ProductFormData, string>> = {}
        if (!form.name.trim()) errs.name = 'Name is required'
        if (!form.price || isNaN(parseFloat(form.price))) errs.price = 'Valid price is required'
        if (!form.category_id) errs.category_id = 'Category is required'
        return errs
    }

    const formToRequest = (form: ProductFormData) => ({
        name: form.name,
        description: form.description || undefined,
        price: parseFloat(form.price) || 0,
        cost: form.cost ? parseFloat(form.cost) : undefined,
        category_id: form.category_id,
        barcode: form.barcode || undefined,
        sku: form.sku || undefined,
        stock_quantity: form.stock_quantity ? parseInt(form.stock_quantity) : undefined,
        min_stock: form.min_stock ? parseInt(form.min_stock) : undefined,
        image_url: form.image_url || undefined,
        is_active: form.is_active,
    })

    // ── Mutations ────────────────────────────────────────────

    const createProductMutation = useMutation({
        mutationFn: async (form: ProductFormData) => {
            const result = await productsService.createProduct(formToRequest(form))
            await logsService.logProductEvent(LogCategory.Product, result.id, form.name, 'Creation')
            return result
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
            const result = await productsService.updateProduct(id, formToRequest(form))
            await logsService.logProductEvent(LogCategory.Product, id, form.name, 'Modification')
            return result
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
        mutationFn: async (id: string) => {
            const product = products?.find(p => p.id === id)
            const productName = product?.name || 'Unknown product'
            await productsService.deleteProduct(id)
            await logsService.logProductEvent(LogCategory.Product, id, productName, 'Deletion')
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] })
            showSuccess('Product deleted successfully!')
        },
        onError: (err) => showError('Error deleting product: ' + err),
    })

    // ── Handlers ─────────────────────────────────────────────

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

    const handleEdit = (product: Product) => {
        setEditingProduct(product)
        setEditForm({
            name: product.name,
            description: product.description || '',
            price: String(product.price),
            cost: product.cost !== undefined ? String(product.cost) : '',
            category_id: product.category_id,
            barcode: product.barcode || '',
            sku: product.sku || '',
            stock_quantity: product.stock_quantity !== undefined ? String(product.stock_quantity) : '',
            min_stock: product.min_stock !== undefined ? String(product.min_stock) : '',
            image_url: product.image_url || '',
            is_active: product.is_active,
        })
        setEditErrors({})
        setShowAdvancedEdit(false)
        setShowEditModal(true)
    }

    const handleEditSubmit = () => {
        const errs = validateForm(editForm)
        if (Object.keys(errs).length > 0) { setEditErrors(errs); return }
        if (editingProduct) {
            updateProductMutation.mutate({ id: editingProduct.id, form: editForm })
        }
    }

    const handleDelete = (id: string, name: string) => {
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
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    // ── Loading / Error ──────────────────────────────────────

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
                <Text style={styles.errorTitle}>Error loading products</Text>
                <Text style={styles.errorSub}>{String(error)}</Text>
            </View>
        )
    }

    // ── Form  ─────────────────────────

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

            {/* Name */}
            <Text style={styles.label}>Name *</Text>
            <TextInput
                style={[styles.input, errors.name && styles.inputError]}
                placeholder="Product name"
                placeholderTextColor="#9E8E50"
                value={form.name}
                onChangeText={text => setForm({ ...form, name: text })}
            />
            {errors.name && <Text style={styles.fieldError}>{errors.name}</Text>}

            {/* Category */}
            <Text style={styles.label}>Category *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillRow}>
                {categories?.map(cat => (
                    <TouchableOpacity
                        key={cat.id}
                        style={[styles.pill, form.category_id === cat.id && styles.pillActive]}
                        onPress={() => setForm({ ...form, category_id: cat.id })}
                    >
                        <View style={[styles.categoryDot, { backgroundColor: cat.color }]} />
                        <Text style={[styles.pillText, form.category_id === cat.id && styles.pillTextActive]}>
                            {cat.name}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
            {errors.category_id && <Text style={styles.fieldError}>{errors.category_id}</Text>}

            {/* Price + Cost */}
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
                        value={form.cost}
                        onChangeText={text => setForm({ ...form, cost: text })}
                    />
                </View>
            </View>

            {/* Advanced Toggle */}
            <TouchableOpacity
                style={styles.advancedToggle}
                onPress={() => setShowAdvanced(!showAdvanced)}
            >
                <Text style={styles.advancedToggleText}>
                    {showAdvanced ? 'Hide advanced options ▲' : 'Show more options ▼'}
                </Text>
            </TouchableOpacity>

            {/* Advanced Fields */}
            {showAdvanced && (
                <View style={styles.advancedSection}>

                    {/* Stock + Min Stock */}
                    <View style={styles.row}>
                        <View style={styles.halfField}>
                            <Text style={styles.label}>Stock</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="0"
                                placeholderTextColor="#9E8E50"
                                keyboardType="numeric"
                                value={form.stock_quantity}
                                onChangeText={text => setForm({ ...form, stock_quantity: text })}
                            />
                        </View>
                        <View style={styles.halfField}>
                            <Text style={styles.label}>Min Stock</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="0"
                                placeholderTextColor="#9E8E50"
                                keyboardType="numeric"
                                value={form.min_stock}
                                onChangeText={text => setForm({ ...form, min_stock: text })}
                            />
                        </View>
                    </View>

                    {/* Barcode + SKU */}
                    <View style={styles.row}>
                        <View style={styles.halfField}>
                            <Text style={styles.label}>Barcode</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Barcode"
                                placeholderTextColor="#9E8E50"
                                value={form.barcode}
                                onChangeText={text => setForm({ ...form, barcode: text })}
                            />
                        </View>
                        <View style={styles.halfField}>
                            <Text style={styles.label}>SKU</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="SKU"
                                placeholderTextColor="#9E8E50"
                                value={form.sku}
                                onChangeText={text => setForm({ ...form, sku: text })}
                            />
                        </View>
                    </View>

                    {/* Description */}
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

                    {/* Image URL */}
                    <Text style={styles.label}>Image URL</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="https://example.com/image.jpg"
                        placeholderTextColor="#9E8E50"
                        value={form.image_url}
                        onChangeText={text => setForm({ ...form, image_url: text })}
                        autoCapitalize="none"
                    />

                    {/* Active Switch */}
                    <View style={styles.switchRow}>
                        <Text style={styles.label}>Active product</Text>
                        <Switch
                            value={form.is_active}
                            onValueChange={val => setForm({ ...form, is_active: val })}
                            trackColor={{ false: '#E8D88A', true: '#C41E1E' }}
                            thumbColor="#FFFFFF"
                        />
                    </View>
                </View>
            )}

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
                        <Text style={styles.title}>Products</Text>
                        <Text style={styles.subtitle}>Manage your product catalog</Text>
                    </View>
                    <TouchableOpacity style={styles.addButton} onPress={handleAddNew}>
                        <Plus size={16} color="#FFFFFF" />
                        <Text style={styles.addButtonText}>New Product</Text>
                    </TouchableOpacity>
                </View>

                {/* Banners */}
                {showSuccessMessage && (
                    <View style={styles.successBanner}>
                        <CheckCircle size={16} color="#2E7D32" />
                        <Text style={styles.successText}>{showSuccessMessage}</Text>
                    </View>
                )}
                {showErrorMessage && (
                    <View style={styles.errorBanner}>
                        <AlertCircle size={16} color="#C41E1E" />
                        <Text style={styles.errorBannerText}>{showErrorMessage}</Text>
                    </View>
                )}

                {/* Search */}
                <View style={styles.searchWrapper}>
                    <Search size={16} color="#9E8E50" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search a product..."
                        placeholderTextColor="#9E8E50"
                        value={searchTerm}
                        onChangeText={setSearchTerm}
                    />
                </View>

                {/* Empty State */}
                {filteredProducts?.length === 0 && (
                    <View style={styles.emptyState}>
                        <Search size={48} color="#E8D88A" />
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

                {/* Product Cards */}
                {filteredProducts?.map(product => {
                    const category = categories?.find(c => c.id === product.category_id)
                    const isLowStock = product.min_stock !== undefined &&
                        product.stock_quantity !== undefined &&
                        product.stock_quantity <= product.min_stock

                    return (
                        <View key={product.id} style={styles.card}>
                            {/* Card Header */}
                            <View style={styles.cardHeader}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.cardTitle}>{product.name}</Text>
                                    {category && (
                                        <View style={styles.categoryRow}>
                                            <View style={[styles.categoryDot, { backgroundColor: category.color }]} />
                                            <Text style={styles.categoryName}>{category.name}</Text>
                                        </View>
                                    )}
                                    {product.description && (
                                        <Text style={styles.cardDescription} numberOfLines={2}>
                                            {product.description}
                                        </Text>
                                    )}
                                </View>
                                <View style={styles.cardActions}>
                                    <TouchableOpacity style={styles.iconButton} onPress={() => handleEdit(product)}>
                                        <Edit size={15} color="#9E8E50" />
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.iconButton} onPress={() => handleDelete(product.id, product.name)}>
                                        <Trash2 size={15} color="#C41E1E" />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Card Info */}
                            <View style={styles.cardInfo}>
                                <View style={styles.infoRow}>
                                    <Text style={styles.infoLabel}>Price:</Text>
                                    <Text style={styles.infoPrice}>Rs. {product.price.toFixed(2)}</Text>
                                </View>
                                {product.cost !== undefined && (
                                    <View style={styles.infoRow}>
                                        <Text style={styles.infoLabel}>Cost:</Text>
                                        <Text style={styles.infoValue}>Rs. {product.cost.toFixed(2)}</Text>
                                    </View>
                                )}
                                {product.stock_quantity !== undefined && (
                                    <View style={styles.infoRow}>
                                        <Text style={styles.infoLabel}>Stock:</Text>
                                        <Text style={[styles.infoValue, { color: isLowStock ? '#C41E1E' : '#2E7D32' }]}>
                                            {product.stock_quantity}
                                        </Text>
                                    </View>
                                )}
                                {product.barcode && (
                                    <View style={styles.infoRow}>
                                        <Text style={styles.infoLabel}>Barcode:</Text>
                                        <Text style={styles.infoMono}>{product.barcode}</Text>
                                    </View>
                                )}
                            </View>

                            {/* Card Footer */}
                            <View style={styles.cardFooter}>
                                <Text style={styles.footerDate}>
                                    Created {new Date(product.created_at).toLocaleDateString('en-US')}
                                </Text>
                                <View style={[
                                    styles.statusBadge,
                                    product.is_active ? styles.statusActive : styles.statusInactive,
                                ]}>
                                    <Text style={[
                                        styles.statusText,
                                        product.is_active ? styles.statusActiveText : styles.statusInactiveText,
                                    ]}>
                                        {product.is_active ? 'Active' : 'Inactive'}
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

            {/* Edit Modal */}
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

// ── Styles ────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FEF1A8',
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
        backgroundColor: '#FEF1A8',
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
        marginBottom: 4,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1A1A1A',
        fontFamily: 'Inter',
    },
    subtitle: {
        fontSize: 13,
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
        gap: 8,
    },
    successText: {
        color: '#2E7D32',
        fontSize: 13,
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
        gap: 8,
    },
    errorBannerText: {
        color: '#C41E1E',
        fontSize: 13,
        fontFamily: 'Inter',
    },

    // Search
    searchWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E8D88A',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        gap: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        color: '#1A1A1A',
        fontFamily: 'Inter',
    },

    // Empty
    emptyState: {
        alignItems: 'center',
        paddingVertical: 48,
        gap: 10,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1A1A1A',
        fontFamily: 'Inter',
    },
    emptySubtitle: {
        fontSize: 13,
        color: '#5C5436',
        fontFamily: 'Inter',
        textAlign: 'center',
    },

    // Card
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E8D88A',
        padding: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
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
        color: '#1A1A1A',
        fontFamily: 'Inter',
    },
    categoryRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 4,
    },
    categoryDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    categoryName: {
        fontSize: 12,
        color: '#5C5436',
        fontFamily: 'Inter',
    },
    cardDescription: {
        fontSize: 12,
        color: '#5C5436',
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
        backgroundColor: '#FEF1A8',
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
        color: '#5C5436',
        fontFamily: 'Inter',
    },
    infoPrice: {
        fontSize: 13,
        fontWeight: '700',
        color: '#C41E1E',
        fontFamily: 'Inter',
    },
    infoValue: {
        fontSize: 13,
        fontWeight: '600',
        color: '#1A1A1A',
        fontFamily: 'Inter',
    },
    infoMono: {
        fontSize: 12,
        color: '#5C5436',
        fontFamily: 'Inter',
    },
    cardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#F5EFC8',
    },
    footerDate: {
        fontSize: 11,
        color: '#9E8E50',
        fontFamily: 'Inter',
    },
    statusBadge: {
        borderRadius: 9999,
        paddingHorizontal: 10,
        paddingVertical: 3,
    },
    statusActive: { backgroundColor: '#E8F5E9' },
    statusInactive: { backgroundColor: '#F5F5F5' },
    statusText: { fontSize: 11, fontWeight: '600', fontFamily: 'Inter' },
    statusActiveText: { color: '#2E7D32' },
    statusInactiveText: { color: '#757575' },

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
        maxHeight: '92%',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1A1A1A',
        fontFamily: 'Inter',
        marginBottom: 16,
    },

    // Form
    label: {
        fontSize: 13,
        fontWeight: '600',
        color: '#1A1A1A',
        fontFamily: 'Inter',
        marginBottom: 6,
        marginTop: 12,
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
    inputError: { borderColor: '#C41E1E' },
    textArea: { height: 70, textAlignVertical: 'top' },
    fieldError: {
        fontSize: 11,
        color: '#C41E1E',
        fontFamily: 'Inter',
        marginTop: 3,
    },
    row: { flexDirection: 'row', gap: 12 },
    halfField: { flex: 1 },

    // Category Pills
    pillRow: { marginTop: 4, marginBottom: 4 },
    pill: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 25,
        borderWidth: 1,
        borderColor: '#E8D88A',
        paddingHorizontal: 12,
        paddingVertical: 7,
        marginRight: 8,
        backgroundColor: '#FEF1A8',
        gap: 5,
    },
    pillActive: { backgroundColor: '#C41E1E', borderColor: '#C41E1E' },
    pillText: { fontSize: 13, color: '#5C5436', fontFamily: 'Inter' },
    pillTextActive: { color: '#FFFFFF', fontWeight: '600' },

    // Advanced
    advancedToggle: {
        borderWidth: 1,
        borderColor: '#E8D88A',
        borderRadius: 12,
        paddingVertical: 10,
        alignItems: 'center',
        marginTop: 14,
        backgroundColor: '#FFFDF0',
    },
    advancedToggleText: {
        fontSize: 13,
        color: '#C41E1E',
        fontWeight: '600',
        fontFamily: 'Inter',
    },
    advancedSection: {
        borderTopWidth: 1,
        borderTopColor: '#E8D88A',
        marginTop: 12,
        paddingTop: 4,
    },
    switchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 12,
    },

    // Modal Buttons
    modalButtons: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 20,
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
    submitButtonDisabled: { opacity: 0.5 },
    submitButtonText: {
        fontSize: 15,
        color: '#FFFFFF',
        fontWeight: '600',
        fontFamily: 'Inter',
    },
})