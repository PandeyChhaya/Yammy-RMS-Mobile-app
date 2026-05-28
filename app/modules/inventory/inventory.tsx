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
    espresso:    '#1C1008',
    clay:        '#7A4528',
    latte:       '#C8956A',
    cream:       '#FDF6EC',
    parchment:   '#F5E9D4',
    vellum:      '#EDD9BC',
    brass:       '#B5822A',
    brassLight:  '#F7EDD8',
    brassBorder: '#DEC07A',
    sage:        '#3B6E52',
    sageLight:   '#EBF4EE',
    sageBorder:  '#9FCFB4',
    terracotta:  '#A03020',
    tcLight:     '#FAECEA',
    tcBorder:    '#E8A898',
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
                    <ActivityIndicator size="large" color={C.brass} />
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
                    <Warehouse size={22} color={C.cream} />
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
                            <Icon size={15} color={active ? C.brass : C.clay} />
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
                        <Search size={15} color={C.clay} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search ingredients..."
                            placeholderTextColor={C.latte}
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
                        <Plus size={16} color={C.cream} />
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
        backgroundColor: '#F5E9D4',
    },
    centered: {
        flex: 1, alignItems: 'center', justifyContent: 'center',
    },

    errorText: {
        fontSize: 13,
        color: C.terracotta,
        textAlign: 'center',
        paddingHorizontal: 24,
    },
    retryBtn: {
        marginTop: 12,
        paddingHorizontal: 20,
        paddingVertical: 8,
        backgroundColor: C.brassLight,
        borderRadius: radius.sm,
        borderWidth: 1,
        borderColor: C.brassBorder,
    },
    retryBtnText: {
        fontSize: 13,
        fontWeight: '700',
        color: C.brass,
    },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: C.espresso,
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    headerIcon: {
        width: 40, height: 40,
        borderRadius: radius.sm,
        backgroundColor: C.brass,
        alignItems: 'center', justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 17, fontWeight: '800', color: C.cream,
    },
    headerSub: {
        fontSize: 11, color: C.latte, marginTop: 1,
    },

    tabBar: {
        flexDirection: 'row',
        backgroundColor: C.cream,
        borderBottomWidth: 1.5,
        borderBottomColor: C.vellum,
    },
    tab: {
        flex: 1, flexDirection: 'row',
        alignItems: 'center', justifyContent: 'center',
        gap: 6, paddingVertical: 12,
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    tabActive: {
        borderBottomColor: C.brass,
    },
    tabLabel: {
        fontSize: 13, fontWeight: '600', color: C.clay,
    },
    tabLabelActive: {
        color: C.brass,
    },
    badge: {
        backgroundColor: C.terracotta,
        borderRadius: radius.pill,
        minWidth: 18, height: 18,
        alignItems: 'center', justifyContent: 'center',
        paddingHorizontal: 5,
    },
    badgeText: {
        fontSize: 10, fontWeight: '800', color: C.cream,
    },

    searchRow: {
        backgroundColor: C.cream,
        paddingHorizontal: 12,
        paddingTop: 10,
        paddingBottom: 8,
        gap: 8,
        borderBottomWidth: 1,
        borderBottomColor: C.vellum,
    },
    searchBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: C.parchment,
        borderWidth: 1.5,
        borderColor: C.vellum,
        borderRadius: radius.sm,
        paddingHorizontal: 10,
        paddingVertical: 8,
    },
    searchInput: {
        flex: 1, fontSize: 13, color: C.espresso,
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
        backgroundColor: C.parchment,
        borderWidth: 1, borderColor: C.vellum,
    },
    categoryChipActive: {
        backgroundColor: C.brassLight,
        borderColor: C.brassBorder,
    },
    categoryChipText: {
        fontSize: 11, fontWeight: '600', color: C.clay,
    },
    categoryChipTextActive: {
        color: C.brass,
    },
    addBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: C.sage,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: radius.sm,
        alignSelf: 'flex-end',
    },
    addBtnText: {
        fontSize: 13, fontWeight: '700', color: C.cream,
    },

    content: {
        flex: 1,
    },
})