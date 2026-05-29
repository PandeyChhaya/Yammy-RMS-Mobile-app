import {
  Edit,
  Minus,
  Package,
  Plus,
  Save,
  Trash2,
  X,
} from 'lucide-react-native'
import { useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import inventoryService from '../services/inventory'
import {
  Ingredient,
  getStockIcon,
  getStockLevel,
  getStockPercentage
} from '../types/inventory'

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
  successDim: '#22C55E18',
  successBdr: '#22C55E44',
  warning:    '#F59E0B',
  warningDim: '#F59E0B18',
  warningBdr: '#F59E0B44',
  error:      '#EF4444',
  errorBg:    '#2A0A0A',
  errorDim:   '#EF444418',
  errorBdr:   '#EF444444',
}

const radius = { xs: 6, sm: 10, md: 14, lg: 18, pill: 100 }

const stockLevelStyle = (level: string) => {
  switch (level) {
    case 'out_of_stock': return { bg: C.errorDim,   border: C.errorBdr,   text: C.error   }
    case 'low_stock':    return { bg: C.orangeTint, border: C.orangeDim,  text: C.orange  }
    case 'normal_stock': return { bg: C.warningDim, border: C.warningBdr, text: C.warning }
    case 'high_stock':   return { bg: C.successDim, border: C.successBdr, text: C.success }
    default:             return { bg: C.graphite,   border: C.border,     text: C.muted   }
  }
}

const stockBarColor = (level: string) => {
  switch (level) {
    case 'out_of_stock': return C.error
    case 'low_stock':    return C.orange
    case 'normal_stock': return C.warning
    case 'high_stock':   return C.success
    default:             return C.muted
  }
}

interface IngredientListProps {
  ingredients: Ingredient[]
  loading: boolean
  error: string | null
  onRefresh: () => void
}

export default function IngredientList({ ingredients, loading, error, onRefresh }: IngredientListProps) {
  const [editingStock,      setEditingStock]      = useState<string | null>(null)
  const [newStockValue,     setNewStockValue]     = useState(0)
  const [editingThresholds, setEditingThresholds] = useState<string | null>(null)
  const [newMinStock,       setNewMinStock]       = useState(0)
  const [newMaxStock,       setNewMaxStock]       = useState(0)

  const handleStockEdit = (ingredient: Ingredient) => {
    setEditingStock(ingredient.id)
    setNewStockValue(ingredient.current_stock)
  }

  const handleStockSave = async (ingredientId: string) => {
    try {
      await inventoryService.putIngredient(ingredientId, { current_stock: newStockValue })
      setEditingStock(null); setNewStockValue(0); onRefresh()
    } catch { Alert.alert('Error', 'Error updating stock') }
  }

  const handleStockCancel = () => { setEditingStock(null); setNewStockValue(0) }
  const adjustStock = (delta: number) => setNewStockValue(prev => Math.max(0, parseFloat((prev + delta).toFixed(1))))

  const handleThresholdsEdit = (ingredient: Ingredient) => {
    setEditingThresholds(ingredient.id)
    setNewMinStock(ingredient.min_stock)
    setNewMaxStock(ingredient.max_stock)
  }

  const handleThresholdsSave = async (ingredientId: string) => {
    if (newMinStock < 0 || newMaxStock < 0 || newMinStock >= newMaxStock) {
      Alert.alert('Invalid', 'Min must be less than max and both >= 0'); return
    }
    try {
      await inventoryService.putIngredient(ingredientId, { min_stock: newMinStock, max_stock: newMaxStock })
      setEditingThresholds(null); onRefresh()
    } catch { Alert.alert('Error', 'Error updating thresholds') }
  }

  const handleThresholdsCancel = () => { setEditingThresholds(null); setNewMinStock(0); setNewMaxStock(0) }

  const handleDelete = (id: string, name: string) => {
    Alert.alert('Delete Ingredient', `Are you sure you want to delete "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try { await inventoryService.deleteIngredient(id); onRefresh() }
          catch { Alert.alert('Error', 'Error deleting ingredient') }
        },
      },
    ])
  }

  if (loading) return (
    <View style={s.centered}>
      <ActivityIndicator size="large" color={C.orange} />
      <Text style={s.stateText}>Loading ingredients…</Text>
    </View>
  )

  if (error) return (
    <View style={s.centered}>
      <Package size={40} color={C.error} />
      <Text style={[s.stateText, { color: C.error }]}>Error loading ingredients</Text>
      <Text style={s.stateSub}>{error}</Text>
    </View>
  )

  if (ingredients.length === 0) return (
    <View style={s.centered}>
      <View style={s.emptyIcon}><Package size={32} color={C.orange} /></View>
      <Text style={s.emptyTitle}>No ingredients found</Text>
      <Text style={s.stateSub}>Add ingredients using the Add button</Text>
    </View>
  )

  return (
    <ScrollView contentContainerStyle={s.list} showsVerticalScrollIndicator={false}>
      {ingredients.map(ingredient => {
        const level      = getStockLevel(ingredient)
        const pct        = getStockPercentage(ingredient)
        const levelStyle = stockLevelStyle(level)
        const barColor   = stockBarColor(level)
        const icon       = getStockIcon(level)
        const maxSlider  = Math.max(ingredient.max_stock * 2, 100)

        return (
          <View key={ingredient.id} style={s.card}>

            <View style={s.cardHeader}>
              <View style={{ flex: 1 }}>
                <Text style={s.cardTitle} numberOfLines={1}>{ingredient.name}</Text>
                <Text style={s.cardCategory}>{ingredient.category}</Text>
              </View>
              <View style={s.cardActions}>
                <TouchableOpacity style={s.iconButton} onPress={() => handleStockEdit(ingredient)}>
                  <Edit size={14} color={C.orange} />
                </TouchableOpacity>
                <TouchableOpacity style={[s.iconButton, s.iconButtonDelete]} onPress={() => handleDelete(ingredient.id, ingredient.name)}>
                  <Trash2 size={14} color={C.error} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={s.infoRow}>
              <View style={s.infoHalf}>
                <Text style={s.infoLabel}>Current Stock</Text>
                {editingStock === ingredient.id ? (
                  <View style={s.stockEditor}>
                    <Text style={s.stockEditorValue}>{newStockValue.toFixed(1)} {ingredient.unit}</Text>
                    <View style={s.barTrack}>
                      <View style={[s.barFill, { width: `${Math.max(4, (newStockValue / maxSlider) * 100)}%` as any, backgroundColor: C.success }]} />
                    </View>
                    <View style={s.adjustRow}>
                      <TouchableOpacity style={[s.adjBtn, { backgroundColor: C.error }]} onPress={() => adjustStock(-1)}>
                        <Minus size={12} color={C.white} />
                      </TouchableOpacity>
                      <TouchableOpacity style={[s.adjBtn, { backgroundColor: C.orange }]} onPress={() => adjustStock(-0.1)}>
                        <Minus size={10} color={C.white} />
                      </TouchableOpacity>
                      <TextInput
                        style={s.stockInput}
                        keyboardType="numeric"
                        value={String(newStockValue)}
                        onChangeText={t => setNewStockValue(parseFloat(t) || 0)}
                      />
                      <TouchableOpacity style={[s.adjBtn, { backgroundColor: C.orange }]} onPress={() => adjustStock(0.1)}>
                        <Plus size={10} color={C.white} />
                      </TouchableOpacity>
                      <TouchableOpacity style={[s.adjBtn, { backgroundColor: C.success }]} onPress={() => adjustStock(1)}>
                        <Plus size={12} color={C.white} />
                      </TouchableOpacity>
                    </View>
                    <View style={s.stockActionsRow}>
                      <TouchableOpacity style={[s.stockActionBtn, { backgroundColor: C.success }]} onPress={() => handleStockSave(ingredient.id)}>
                        <Save size={11} color={C.white} />
                        <Text style={s.stockActionText}>Save</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[s.stockActionBtn, { backgroundColor: C.graphite }]} onPress={handleStockCancel}>
                        <X size={11} color={C.dim} />
                        <Text style={[s.stockActionText, { color: C.dim }]}>Cancel</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <Text style={s.infoValue}>{ingredient.current_stock} {ingredient.unit}</Text>
                )}
              </View>

              <View style={s.infoHalf}>
                <Text style={s.infoLabel}>Unit Price</Text>
                <Text style={s.infoValue}>NPR {ingredient.cost_per_unit.toFixed(2)}</Text>
              </View>
            </View>

            <View style={s.barometerSection}>
              <View style={s.barometerHeader}>
                <Text style={s.barometerLabel}>Stock Level</Text>
                <View style={[s.levelBadge, { backgroundColor: levelStyle.bg, borderColor: levelStyle.border }]}>
                  <Text style={[s.levelBadgeText, { color: levelStyle.text }]}>
                    {icon}  {level.replace('_', ' ').toUpperCase()}
                  </Text>
                </View>
              </View>

              <View style={s.barTrack}>
                <View style={[s.barFill, { width: `${Math.max(4, pct)}%` as any, backgroundColor: barColor }]} />
              </View>

              {editingThresholds === ingredient.id ? (
                <View style={s.thresholdEditor}>
                  <View style={s.thresholdRow}>
                    <View style={s.thresholdHalf}>
                      <Text style={s.thresholdLabel}>Min Stock</Text>
                      <TextInput style={s.thresholdInput} keyboardType="numeric" value={String(newMinStock)} onChangeText={t => setNewMinStock(parseFloat(t) || 0)} />
                    </View>
                    <View style={s.thresholdHalf}>
                      <Text style={s.thresholdLabel}>Max Stock</Text>
                      <TextInput style={s.thresholdInput} keyboardType="numeric" value={String(newMaxStock)} onChangeText={t => setNewMaxStock(parseFloat(t) || 0)} />
                    </View>
                  </View>
                  <View style={s.stockActionsRow}>
                    <TouchableOpacity style={[s.stockActionBtn, { backgroundColor: C.success }]} onPress={() => handleThresholdsSave(ingredient.id)}>
                      <Text style={s.stockActionText}>Save</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[s.stockActionBtn, { backgroundColor: C.graphite }]} onPress={handleThresholdsCancel}>
                      <Text style={[s.stockActionText, { color: C.dim }]}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={s.thresholdDisplay}>
                  <Text style={s.thresholdDisplayText}>Min: {ingredient.min_stock} {ingredient.unit}</Text>
                  <Text style={s.thresholdDisplayText}>Max: {ingredient.max_stock} {ingredient.unit}</Text>
                  <TouchableOpacity onPress={() => handleThresholdsEdit(ingredient)}>
                    <Text style={s.thresholdEditLink}>Edit</Text>
                  </TouchableOpacity>
                </View>
              )}

              <View style={s.barMinMax}>
                <Text style={s.barMinMaxText}>0 {ingredient.unit}</Text>
                <Text style={s.barMinMaxText}>{ingredient.max_stock} {ingredient.unit}</Text>
              </View>
            </View>

            {ingredient.expiration_date && (
              <View style={s.expiryBanner}>
                <Text style={s.expiryText}>Expires: {new Date(ingredient.expiration_date).toLocaleDateString()}</Text>
              </View>
            )}
          </View>
        )
      })}
    </ScrollView>
  )
}

const s = StyleSheet.create({
  list:    { padding: 16, gap: 12, paddingBottom: 32 },
  centered:{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
  emptyIcon: { width: 72, height: 72, borderRadius: radius.lg, backgroundColor: C.orangeTint, borderWidth: 1.5, borderColor: C.orangeDim, alignItems: 'center', justifyContent: 'center' },
  emptyTitle:{ fontSize: 17, fontWeight: '800', color: C.white },
  stateText: { fontSize: 15, fontWeight: '700', color: C.dim },
  stateSub:  { fontSize: 12, color: C.muted, textAlign: 'center' },

  card: { backgroundColor: C.card, borderRadius: radius.md, borderWidth: 1.5, borderColor: C.border, padding: 14 },
  cardHeader:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  cardTitle:   { fontSize: 15, fontWeight: '800', color: C.white },
  cardCategory:{ fontSize: 11, color: C.muted, marginTop: 2, fontWeight: '500' },
  cardActions: { flexDirection: 'row', gap: 6 },
  iconButton:      { padding: 7, borderRadius: radius.xs, backgroundColor: C.orangeTint, borderWidth: 1, borderColor: C.orangeDim },
  iconButtonDelete:{ backgroundColor: C.errorBg, borderColor: '#7A1010' },

  infoRow:  { flexDirection: 'row', gap: 12, marginBottom: 14 },
  infoHalf: { flex: 1 },
  infoLabel:{ fontSize: 10, fontWeight: '800', color: C.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  infoValue:{ fontSize: 16, fontWeight: '800', color: C.white },

  stockEditor:     { gap: 8 },
  stockEditorValue:{ fontSize: 15, fontWeight: '800', color: C.success },
  adjustRow:       { flexDirection: 'row', alignItems: 'center', gap: 4 },
  adjBtn:          { width: 26, height: 26, borderRadius: radius.xs, alignItems: 'center', justifyContent: 'center' },
  stockInput:      { flex: 1, borderWidth: 1.5, borderColor: C.border, borderRadius: radius.xs, paddingHorizontal: 6, paddingVertical: 4, fontSize: 13, color: C.white, backgroundColor: C.black, textAlign: 'center' },
  stockActionsRow: { flexDirection: 'row', gap: 6 },
  stockActionBtn:  { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 6, borderRadius: radius.xs },
  stockActionText: { fontSize: 11, color: C.white, fontWeight: '700' },

  barometerSection:{ gap: 8 },
  barometerHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  barometerLabel:  { fontSize: 11, fontWeight: '700', color: C.muted },
  levelBadge:      { borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 3 },
  levelBadgeText:  { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  barTrack:        { height: 8, backgroundColor: C.graphite, borderRadius: radius.pill, overflow: 'hidden' },
  barFill:         { height: '100%', borderRadius: radius.pill },

  thresholdDisplay:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  thresholdDisplayText:{ fontSize: 10, color: C.muted, fontWeight: '600' },
  thresholdEditLink:   { fontSize: 10, color: C.orange, fontWeight: '800' },
  thresholdEditor:     { backgroundColor: C.black, borderRadius: radius.sm, borderWidth: 1, borderColor: C.border, padding: 10, gap: 8 },
  thresholdRow:        { flexDirection: 'row', gap: 10 },
  thresholdHalf:       { flex: 1 },
  thresholdLabel:      { fontSize: 9, fontWeight: '800', color: C.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  thresholdInput:      { borderWidth: 1.5, borderColor: C.border, borderRadius: radius.xs, paddingHorizontal: 8, paddingVertical: 6, fontSize: 13, color: C.white, backgroundColor: C.charcoal },
  barMinMax:           { flexDirection: 'row', justifyContent: 'space-between' },
  barMinMaxText:       { fontSize: 9, color: C.muted, fontWeight: '500' },

  expiryBanner:{ marginTop: 10, padding: 8, backgroundColor: C.warningDim, borderRadius: radius.xs, borderLeftWidth: 3, borderLeftColor: C.warning },
  expiryText:  { fontSize: 11, color: C.warning, fontWeight: '700' },
})