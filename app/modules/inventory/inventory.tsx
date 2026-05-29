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
    SafeAreaView,
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
  dim:        '#A0A0A0',
  success:    '#22C55E',
  successBg:  '#0D2818',
  error:      '#EF4444',
  errorBg:    '#2A0A0A',
}
const radius = { xs: 6, sm: 10, md: 14, lg: 18, pill: 100 }

type Tab = 'ingredients' | 'alerts'

export default function Inventory() {
    const [role, setRole] = useState('')
    useEffect(() => {
        AsyncStorage.getItem('@userRole').then(r => setRole(r ?? ''))
    }, [])

    const [activeTab,      setActiveTab]      = useState<Tab>('ingredients')
    const [searchTerm,     setSearchTerm]     = useState('')
    const [filterCategory, setFilterCategory] = useState('all')
    const [showAddModal,   setShowAddModal]   = useState(false)

    const { ingredients, loading: ingredientsLoading, error: ingredientsError, refetch: refetchIngredients } = useIngredients()
    const { alerts, refreshData: refetchAlerts, markAlertAsRead: markAsRead } = useStockLevels()

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

    const unreadAlertCount = useMemo(() => alerts.filter(a => !a.is_read).length, [alerts])

    const handleRefresh = () => { refetchIngredients(); refetchAlerts() }

    const tabs = [
        { id: 'ingredients' as Tab, label: 'Ingredients', icon: Package },
        { id: 'alerts'      as Tab, label: 'Alerts',      icon: AlertTriangle },
    ]

    if (role !== 'Admin') return null

    const renderIngredientsContent = () => {
        if (ingredientsLoading) return (
            <View style={s.centered}>
                <ActivityIndicator size="large" color={C.orange} />
            </View>
        )
        if (ingredientsError) return (
            <View style={s.centered}>
                <Text style={s.errorText}>{ingredientsError}</Text>
                <TouchableOpacity style={s.retryBtn} onPress={handleRefresh}>
                    <Text style={s.retryBtnText}>Retry</Text>
                </TouchableOpacity>
            </View>
        )
        return <IngredientList ingredients={filteredIngredients} onRefresh={handleRefresh} loading={false} error={null} />
    }

    return (
        <SafeAreaView style={s.safeArea}>
            <View style={s.container}>
                <View style={s.blob1} />
                <View style={s.blob2} />

                {/* Header */}
                <View style={s.header}>
                    <View style={s.headerIcon}>
                        <Warehouse size={20} color={C.white} />
                    </View>
                    <View>
                        <Text style={s.headerTitle}>Inventory</Text>
                        <Text style={s.headerSub}>Stock management</Text>
                    </View>
                </View>

                {/* Tab Bar */}
                <View style={s.tabBar}>
                    {tabs.map(tab => {
                        const Icon   = tab.icon
                        const active = activeTab === tab.id
                        return (
                            <TouchableOpacity
                                key={tab.id}
                                style={[s.tab, active && s.tabActive]}
                                onPress={() => setActiveTab(tab.id)}
                            >
                                <Icon size={15} color={active ? C.orange : C.muted} />
                                <Text style={[s.tabLabel, active && s.tabLabelActive]}>{tab.label}</Text>
                                {tab.id === 'alerts' && unreadAlertCount > 0 && (
                                    <View style={s.badge}>
                                        <Text style={s.badgeText}>{unreadAlertCount}</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        )
                    })}
                </View>

                {/* Search + Filter */}
                {activeTab === 'ingredients' && (
                    <View style={s.searchRow}>
                        <View style={s.searchBox}>
                            <Search size={15} color={C.muted} />
                            <TextInput
                                style={s.searchInput}
                                placeholder="Search ingredients..."
                                placeholderTextColor={C.muted}
                                value={searchTerm}
                                onChangeText={setSearchTerm}
                            />
                        </View>

                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.categoryContent}>
                            {categories.map(cat => (
                                <TouchableOpacity
                                    key={cat}
                                    style={[s.categoryChip, filterCategory === cat && s.categoryChipActive]}
                                    onPress={() => setFilterCategory(cat)}
                                >
                                    <Text style={[s.categoryChipText, filterCategory === cat && s.categoryChipTextActive]}>
                                        {cat === 'all' ? 'All' : cat}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        <TouchableOpacity style={s.addBtn} onPress={() => setShowAddModal(true)} activeOpacity={0.85}>
                            <Plus size={16} color={C.white} />
                            <Text style={s.addBtnText}>Add</Text>
                        </TouchableOpacity>
                    </View>
                )}

                <View style={s.content}>
                    {activeTab === 'ingredients' && renderIngredientsContent()}
                    {activeTab === 'alerts' && <StockAlerts alerts={alerts} onMarkAsRead={markAsRead} />}
                </View>

                <AddIngredientModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} onSuccess={handleRefresh} />
            </View>
        </SafeAreaView>
    )
}

const s = StyleSheet.create({
    safeArea:  { flex: 1, backgroundColor: C.black },
    container: { flex: 1, backgroundColor: C.black },
    centered:  { flex: 1, alignItems: 'center', justifyContent: 'center' },

    blob1: { position: 'absolute', top: -80, left: '20%', width: 260, height: 260, borderRadius: 130, backgroundColor: C.orange, opacity: 0.08 },
    blob2: { position: 'absolute', top: -40, left: '45%', width: 180, height: 180, borderRadius: 90,  backgroundColor: C.orange, opacity: 0.12 },

    errorText:    { fontSize: 13, color: C.error, textAlign: 'center', paddingHorizontal: 24 },
    retryBtn:     { marginTop: 12, paddingHorizontal: 20, paddingVertical: 8, backgroundColor: C.orangeTint, borderRadius: radius.sm, borderWidth: 1, borderColor: C.orangeDim },
    retryBtnText: { fontSize: 13, fontWeight: '700', color: C.orange },

    header:      { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.charcoal, paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border },
    headerIcon:  { width: 36, height: 36, borderRadius: radius.sm, backgroundColor: C.orange, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 16, fontWeight: '800', color: C.white },
    headerSub:   { fontSize: 11, color: C.muted, marginTop: 1 },

    tabBar:         { flexDirection: 'row', backgroundColor: C.charcoal, borderBottomWidth: 1.5, borderBottomColor: C.border },
    tab:            { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderBottomWidth: 2, borderBottomColor: 'transparent' },
    tabActive:      { borderBottomColor: C.orange },
    tabLabel:       { fontSize: 13, fontWeight: '600', color: C.muted },
    tabLabelActive: { color: C.orange },
    badge:          { backgroundColor: C.error, borderRadius: radius.pill, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
    badgeText:      { fontSize: 10, fontWeight: '800', color: C.white },

    searchRow:             { backgroundColor: C.charcoal, paddingHorizontal: 12, paddingTop: 8, paddingBottom: 6, gap: 6, borderBottomWidth: 1, borderBottomColor: C.border },
    searchBox:             { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.black, borderWidth: 1.5, borderColor: C.border, borderRadius: radius.sm, paddingHorizontal: 10, paddingVertical: 7 },
    searchInput:           { flex: 1, fontSize: 13, color: C.white },
    categoryContent:       { gap: 6, paddingVertical: 2 },
    categoryChip:          { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill, backgroundColor: C.graphite, borderWidth: 1, borderColor: C.border },
    categoryChipActive:    { backgroundColor: C.orangeTint, borderColor: C.orangeDim },
    categoryChipText:      { fontSize: 11, fontWeight: '600', color: C.dim },
    categoryChipTextActive:{ color: C.orange },
    addBtn:                { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.orange, paddingHorizontal: 14, paddingVertical: 7, borderRadius: radius.sm, alignSelf: 'flex-end' },
    addBtnText:            { fontSize: 13, fontWeight: '700', color: C.white },

    content: { flex: 1 },
})
