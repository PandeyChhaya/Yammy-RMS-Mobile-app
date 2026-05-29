import AsyncStorage from '@react-native-async-storage/async-storage'
import {
    AlertTriangle,
    Package,
    Plus,
    Search,
    Warehouse,
} from 'lucide-react-native'
import { useEffect, useMemo, useState } from 'react'
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native'
import AddIngredientModal from './components/AddIngredientsModal'
import IngredientList from './components/IngredientList'
import StockAlerts from './components/stockAlerts'
import { useIngredients } from './hooks/useIngredients'
import { useStockLevels } from './hooks/useStockLevels'

const C = {
    bg:          '#0F172A',
    surface:     '#1E293B',
    card:        '#1E293B',
    cardBorder:  '#334155',
    elevated:    '#334155',
    inputBg:     '#0F172A',
    accent:      '#6366F1',
    accentDim:   '#6366F122',
    accentBorder:'#6366F155',
    success:     '#22C55E',
    successDim:  '#22C55E18',
    successBdr:  '#22C55E44',
    danger:      '#EF4444',
    dangerDim:   '#EF444418',
    dangerBdr:   '#EF444444',
    textPrimary: '#F1F5F9',
    textSub:     '#94A3B8',
    textMuted:   '#475569',
    placeholder: '#334155',
}

const radius = { xs: 6, sm: 10, md: 14, lg: 18, pill: 100 }

type Tab = 'ingredients' | 'alerts'

export default function Inventory() {
    const [role, setRole] = useState('')
    useEffect(() => {
        AsyncStorage.getItem('@userRole').then(r => setRole(r ?? ''))
    }, [])

    const [activeTab,       setActiveTab]       = useState<Tab>('ingredients')
    const [searchTerm,      setSearchTerm]      = useState('')
    const [filterCategory,  setFilterCategory]  = useState('all')
    const [showAddModal,    setShowAddModal]     = useState(false)

    const {
        ingredients,
        loading: ingredientsLoading,
        error:   ingredientsError,
        refetch: refetchIngredients,
    } = useIngredients()

    const {
        alerts,
        refreshData: refetchAlerts,
        markAlertAsRead: markAsRead,
    } = useStockLevels()

    const categories = useMemo(
        () => ['all', ...Array.from(new Set(ingredients.map(i => i.category)))],
        [ingredients]
    )

    const filteredIngredients = useMemo(
        () => ingredients.filter(ingredient => {
            const matchesSearch =
                ingredient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                ingredient.category.toLowerCase().includes(searchTerm.toLowerCase())
            const matchesCategory =
                filterCategory === 'all' || ingredient.category === filterCategory
            return matchesSearch && matchesCategory
        }),
        [ingredients, searchTerm, filterCategory]
    )

    const unreadAlertCount = useMemo(
        () => alerts.filter(a => !a.is_read).length,
        [alerts]
    )

    const handleRefresh = () => {
        refetchIngredients()
        refetchAlerts()
    }

    const tabs = [
        { id: 'ingredients' as Tab, label: 'Ingredients', icon: Package },
        { id: 'alerts'      as Tab, label: 'Alerts',      icon: AlertTriangle },
    ]

    if (role !== 'Admin') return null

    const renderIngredientsContent = () => {
        if (ingredientsLoading) {
            return (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={C.accent} />
                </View>
            )
        }

        if (ingredientsError) {
            return (
                <View style={styles.centered}>
                    <Text style={styles.errorText}>{ingredientsError}</Text>
                    <TouchableOpacity style={styles.retryBtn} onPress={handleRefresh}>
                        <Text style={styles.retryBtnText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            )
        }

        return (
            <IngredientList
                ingredients={filteredIngredients}
                onRefresh={handleRefresh}
                loading={false}
                error={null}
            />
        )
    }

    return (
        <View style={styles.container}>

            <View style={styles.header}>
                <View style={styles.headerIcon}>
                    <Warehouse size={22} color={C.textPrimary} />
                </View>
                <View>
                    <Text style={styles.headerTitle}>Inventory</Text>
                    <Text style={styles.headerSub}>Stock management</Text>
                </View>
            </View>

            <View style={styles.tabBar}>
                {tabs.map(tab => {
                    const Icon   = tab.icon
                    const active = activeTab === tab.id
                    return (
                        <TouchableOpacity
                            key={tab.id}
                            style={[styles.tab, active && styles.tabActive]}
                            onPress={() => setActiveTab(tab.id)}
                        >
                            <Icon size={15} color={active ? C.accent : C.textMuted} />
                            <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
                                {tab.label}
                            </Text>
                            {tab.id === 'alerts' && unreadAlertCount > 0 && (
                                <View style={styles.badge}>
                                    <Text style={styles.badgeText}>{unreadAlertCount}</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    )
                })}
            </View>

            {activeTab === 'ingredients' && (
                <View style={styles.searchRow}>
                    <View style={styles.searchBox}>
                        <Search size={15} color={C.textMuted} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search ingredients..."
                            placeholderTextColor={C.textMuted}
                            value={searchTerm}
                            onChangeText={setSearchTerm}
                        />
                    </View>

                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.categoryScroll}
                        contentContainerStyle={styles.categoryContent}
                    >
                        {categories.map(cat => (
                            <TouchableOpacity
                                key={cat}
                                style={[
                                    styles.categoryChip,
                                    filterCategory === cat && styles.categoryChipActive,
                                ]}
                                onPress={() => setFilterCategory(cat)}
                            >
                                <Text style={[
                                    styles.categoryChipText,
                                    filterCategory === cat && styles.categoryChipTextActive,
                                ]}>
                                    {cat === 'all' ? 'All' : cat}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    <TouchableOpacity
                        style={styles.addBtn}
                        onPress={() => setShowAddModal(true)}
                    >
                        <Plus size={16} color={C.textPrimary} />
                        <Text style={styles.addBtnText}>Add</Text>
                    </TouchableOpacity>
                </View>
            )}

            <View style={styles.content}>
                {activeTab === 'ingredients' && renderIngredientsContent()}

                {activeTab === 'alerts' && (
                    <StockAlerts
                        alerts={alerts}
                        onMarkAsRead={markAsRead}
                    />
                )}
            </View>

            <AddIngredientModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                onSuccess={handleRefresh}
            />
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: C.bg,
    },
    centered: {
        flex: 1, alignItems: 'center', justifyContent: 'center',
    },

    errorText: {
        fontSize: 13,
        color: C.danger,
        textAlign: 'center',
        paddingHorizontal: 24,
    },
    retryBtn: {
        marginTop: 12,
        paddingHorizontal: 20,
        paddingVertical: 8,
        backgroundColor: C.accentDim,
        borderRadius: radius.sm,
        borderWidth: 1,
        borderColor: C.accentBorder,
    },
    retryBtnText: {
        fontSize: 13,
        fontWeight: '700',
        color: C.accent,
    },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: C.surface,
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: C.cardBorder,
    },
    headerIcon: {
        width: 40, height: 40,
        borderRadius: radius.sm,
        backgroundColor: C.accent,
        alignItems: 'center', justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 17, fontWeight: '800', color: C.textPrimary,
    },
    headerSub: {
        fontSize: 11, color: C.textSub, marginTop: 1,
    },

    tabBar: {
        flexDirection: 'row',
        backgroundColor: C.surface,
        borderBottomWidth: 1.5,
        borderBottomColor: C.cardBorder,
    },
    tab: {
        flex: 1, flexDirection: 'row',
        alignItems: 'center', justifyContent: 'center',
        gap: 6, paddingVertical: 12,
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    tabActive: {
        borderBottomColor: C.accent,
    },
    tabLabel: {
        fontSize: 13, fontWeight: '600', color: C.textMuted,
    },
    tabLabelActive: {
        color: C.accent,
    },
    badge: {
        backgroundColor: C.danger,
        borderRadius: radius.pill,
        minWidth: 18, height: 18,
        alignItems: 'center', justifyContent: 'center',
        paddingHorizontal: 5,
    },
    badgeText: {
        fontSize: 10, fontWeight: '800', color: C.textPrimary,
    },

    searchRow: {
        backgroundColor: C.surface,
        paddingHorizontal: 12,
        paddingTop: 10,
        paddingBottom: 8,
        gap: 8,
        borderBottomWidth: 1,
        borderBottomColor: C.cardBorder,
    },
    searchBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: C.inputBg,
        borderWidth: 1.5,
        borderColor: C.cardBorder,
        borderRadius: radius.sm,
        paddingHorizontal: 10,
        paddingVertical: 8,
    },
    searchInput: {
        flex: 1, fontSize: 13, color: C.textPrimary,
    },
    categoryScroll: {
        flexGrow: 0,
    },
    categoryContent: {
        gap: 6, paddingVertical: 2,
    },
    categoryChip: {
        paddingHorizontal: 12, paddingVertical: 5,
        borderRadius: radius.pill,
        backgroundColor: C.elevated,
        borderWidth: 1, borderColor: C.cardBorder,
    },
    categoryChipActive: {
        backgroundColor: C.accentDim,
        borderColor: C.accentBorder,
    },
    categoryChipText: {
        fontSize: 11, fontWeight: '600', color: C.textSub,
    },
    categoryChipTextActive: {
        color: C.accent,
    },
    addBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: C.accent,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: radius.sm,
        alignSelf: 'flex-end',
        shadowColor: C.accent,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 8,
        elevation: 4,
    },
    addBtnText: {
        fontSize: 13, fontWeight: '700', color: C.textPrimary,
    },

    content: {
        flex: 1,
    },
})