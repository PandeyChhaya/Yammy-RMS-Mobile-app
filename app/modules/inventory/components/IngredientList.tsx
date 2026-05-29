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
  warning:     '#F59E0B',
  warningDim:  '#F59E0B18',
  warningBdr:  '#F59E0B44',
  danger:      '#EF4444',
  dangerDim:   '#EF444418',
  dangerBdr:   '#EF444444',
  orange:      '#F97316',
  orangeDim:   '#F9731618',
  orangeBdr:   '#F9731644',
  textPrimary: '#F1F5F9',
  textSub:     '#94A3B8',
  textMuted:   '#475569',
}

const radius = { xs: 6, sm: 10, md: 14, lg: 18, pill: 100 }

const stockLevelStyle = (level: string) => {
  switch (level) {
    case 'out_of_stock': return { bg: C.dangerDim,   border: C.dangerBdr,   text: C.danger }
    case 'low_stock':    return { bg: C.orangeDim,   border: C.orangeBdr,   text: C.orange }
    case 'normal_stock': return { bg: C.warningDim,  border: C.warningBdr,  text: C.warning }
    case 'high_stock':   return { bg: C.successDim,  border: C.successBdr,  text: C.success }
    default:             return { bg: C.elevated,    border: C.cardBorder,  text: C.textSub }
  }
}

const stockBarColor = (level: string) => {
  switch (level) {
    case 'out_of_stock': return C.danger
    case 'low_stock':    return C.orange
    case 'normal_stock': return C.warning
    case 'high_stock':   return C.success
    default:             return C.textMuted
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
      setEditingStock(null)
      setNewStockValue(0)
      onRefresh()
    } catch {
      Alert.alert('Error', 'Error updating stock')
    }
  }

  const handleStockCancel = () => { setEditingStock(null); setNewStockValue(0) }

  const adjustStock = (delta: number) => {
    setNewStockValue(prev => Math.max(0, parseFloat((prev + delta).toFixed(1))))
  }

  const handleThresholdsEdit = (ingredient: Ingredient) => {
    setEditingThresholds(ingredient.id)
    setNewMinStock(ingredient.min_stock)
    setNewMaxStock(ingredient.max_stock)
  }

  const handleThresholdsSave = async (ingredientId: string) => {
    if (newMinStock < 0 || newMaxStock < 0 || newMinStock >= newMaxStock) {
      Alert.alert('Invalid', 'Min must be less than max and both >= 0')
      return
    }
    try {
      await inventoryService.putIngredient(ingredientId, { min_stock: newMinStock, max_stock: newMaxStock })
      setEditingThresholds(null)
      onRefresh()
    } catch {
      Alert.alert('Error', 'Error updating thresholds')
    }
  }

  const handleThresholdsCancel = () => { setEditingThresholds(null); setNewMinStock(0); setNewMaxStock(0) }

  const handleDelete = (id: string, name: string) => {
    Alert.alert('Delete Ingredient', `Are you sure you want to delete "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await inventoryService.deleteIngredient(id)
            onRefresh()
          } catch {
            Alert.alert('Error', 'Error deleting ingredient')
          }
        },
      },
    ])
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={C.accent} />
        <Text style={styles.stateText}>Loading ingredients…</Text>
      </View>
    )
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Package size={40} color={C.danger} />
        <Text style={[styles.stateText, { color: C.danger }]}>Error loading ingredients</Text>
        <Text style={styles.stateSub}>{error}</Text>
      </View>
    )
  }

  if (ingredients.length === 0) {
    return (
      <View style={styles.centered}>
        <View style={styles.emptyIcon}>
          <Package size={32} color={C.accent} />
        </View>
        <Text style={styles.emptyTitle}>No ingredients found</Text>
        <Text style={styles.stateSub}>Import some ingredients using the invoice scanner</Text>
      </View>
    )
  }

  return (
    <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
      {ingredients.map(ingredient => {
        const level      = getStockLevel(ingredient)
        const pct        = getStockPercentage(ingredient)
        const levelStyle = stockLevelStyle(level)
        const barColor   = stockBarColor(level)
        const icon       = getStockIcon(level)
        const maxSlider  = Math.max(ingredient.max_stock * 2, 100)

        return (
          <View key={ingredient.id} style={styles.card}>

            <View style={styles.cardHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle} numberOfLines={1}>{ingredient.name}</Text>
                <Text style={styles.cardCategory}>{ingredient.category}</Text>
              </View>
              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={() => handleStockEdit(ingredient)}
                >
                  <Edit size={14} color={C.accent} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.iconButton, styles.iconButtonDelete]}
                  onPress={() => handleDelete(ingredient.id, ingredient.name)}
                >
                  <Trash2 size={14} color={C.danger} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoHalf}>
                <Text style={styles.infoLabel}>Current Stock</Text>
                {editingStock === ingredient.id ? (
                  <View style={styles.stockEditor}>
                    <Text style={styles.stockEditorValue}>
                      {newStockValue.toFixed(1)} {ingredient.unit}
                    </Text>

                    <View style={styles.barTrack}>
                      <View style={[
                        styles.barFill,
                        {
                          width: `${Math.max(4, (newStockValue / maxSlider) * 100)}%` as any,
                          backgroundColor: C.success,
                        },
                      ]} />
                    </View>

                    <View style={styles.adjustRow}>
                      <TouchableOpacity style={[styles.adjBtn, { backgroundColor: C.danger }]} onPress={() => adjustStock(-1)}>
                        <Minus size={12} color={C.textPrimary} />
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.adjBtn, { backgroundColor: C.orange }]} onPress={() => adjustStock(-0.1)}>
                        <Minus size={10} color={C.textPrimary} />
                      </TouchableOpacity>
                      <TextInput
                        style={styles.stockInput}
                        keyboardType="numeric"
                        value={String(newStockValue)}
                        onChangeText={t => setNewStockValue(parseFloat(t) || 0)}
                      />
                      <TouchableOpacity style={[styles.adjBtn, { backgroundColor: C.orange }]} onPress={() => adjustStock(0.1)}>
                        <Plus size={10} color={C.textPrimary} />
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.adjBtn, { backgroundColor: C.success }]} onPress={() => adjustStock(1)}>
                        <Plus size={12} color={C.textPrimary} />
                      </TouchableOpacity>
                    </View>

                    <View style={styles.stockActionsRow}>
                      <TouchableOpacity
                        style={[styles.stockActionBtn, { backgroundColor: C.success }]}
                        onPress={() => handleStockSave(ingredient.id)}
                      >
                        <Save size={11} color={C.textPrimary} />
                        <Text style={styles.stockActionText}>Save</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.stockActionBtn, { backgroundColor: C.elevated }]}
                        onPress={handleStockCancel}
                      >
                        <X size={11} color={C.textSub} />
                        <Text style={[styles.stockActionText, { color: C.textSub }]}>Cancel</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <Text style={styles.infoValue}>
                    {ingredient.current_stock} {ingredient.unit}
                  </Text>
                )}
              </View>

              <View style={styles.infoHalf}>
                <Text style={styles.infoLabel}>Unit Price</Text>
                <Text style={styles.infoValue}>${ingredient.cost_per_unit.toFixed(2)}</Text>
              </View>
            </View>

            <View style={styles.barometerSection}>
              <View style={styles.barometerHeader}>
                <Text style={styles.barometerLabel}>Stock Level</Text>
                <View style={[styles.levelBadge, { backgroundColor: levelStyle.bg, borderColor: levelStyle.border }]}>
                  <Text style={[styles.levelBadgeText, { color: levelStyle.text }]}>
                    {icon}  {level.replace('_', ' ').toUpperCase()}
                  </Text>
                </View>
              </View>

              <View style={styles.barTrack}>
                <View style={[
                  styles.barFill,
                  { width: `${Math.max(4, pct)}%` as any, backgroundColor: barColor },
                ]} />
              </View>

              {editingThresholds === ingredient.id ? (
                <View style={styles.thresholdEditor}>
                  <View style={styles.thresholdRow}>
                    <View style={styles.thresholdHalf}>
                      <Text style={styles.thresholdLabel}>Min Stock</Text>
                      <TextInput
                        style={styles.thresholdInput}
                        keyboardType="numeric"
                        value={String(newMinStock)}
                        onChangeText={t => setNewMinStock(parseFloat(t) || 0)}
                      />
                    </View>
                    <View style={styles.thresholdHalf}>
                      <Text style={styles.thresholdLabel}>Max Stock</Text>
                      <TextInput
                        style={styles.thresholdInput}
                        keyboardType="numeric"
                        value={String(newMaxStock)}
                        onChangeText={t => setNewMaxStock(parseFloat(t) || 0)}
                      />
                    </View>
                  </View>
                  <View style={styles.stockActionsRow}>
                    <TouchableOpacity
                      style={[styles.stockActionBtn, { backgroundColor: C.success }]}
                      onPress={() => handleThresholdsSave(ingredient.id)}
                    >
                      <Text style={styles.stockActionText}>Save</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.stockActionBtn, { backgroundColor: C.elevated }]}
                      onPress={handleThresholdsCancel}
                    >
                      <Text style={[styles.stockActionText, { color: C.textSub }]}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={styles.thresholdDisplay}>
                  <Text style={styles.thresholdDisplayText}>Min: {ingredient.min_stock} {ingredient.unit}</Text>
                  <Text style={styles.thresholdDisplayText}>Max: {ingredient.max_stock} {ingredient.unit}</Text>
                  <TouchableOpacity onPress={() => handleThresholdsEdit(ingredient)}>
                    <Text style={styles.thresholdEditLink}>Edit</Text>
                  </TouchableOpacity>
                </View>
              )}

              <View style={styles.barMinMax}>
                <Text style={styles.barMinMaxText}>0 {ingredient.unit}</Text>
                <Text style={styles.barMinMaxText}>{ingredient.max_stock} {ingredient.unit}</Text>
              </View>
            </View>

            {ingredient.expiration_date && (
              <View style={styles.expiryBanner}>
                <Text style={styles.expiryText}>
                  Expires: {new Date(ingredient.expiration_date).toLocaleDateString()}
                </Text>
              </View>
            )}
          </View>
        )
      })}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  list: {
    padding: 16, gap: 12, paddingBottom: 32,
  },

  centered: {
    flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32,
  },
  emptyIcon: {
    width: 72, height: 72, borderRadius: radius.lg,
    backgroundColor: C.accentDim, borderWidth: 1.5, borderColor: C.accentBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 17, fontWeight: '800', color: C.textPrimary,
  },
  stateText: {
    fontSize: 15, fontWeight: '700', color: C.textSub,
  },
  stateSub: {
    fontSize: 12, color: C.textMuted, textAlign: 'center',
  },

  card: {
    backgroundColor: C.card,
    borderRadius: radius.md,
    borderWidth: 1.5, borderColor: C.cardBorder,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2, shadowRadius: 4, elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 12,
  },
  cardTitle: {
    fontSize: 15, fontWeight: '800', color: C.textPrimary,
  },
  cardCategory: {
    fontSize: 11, color: C.textSub, marginTop: 2, fontWeight: '500',
  },
  cardActions: {
    flexDirection: 'row', gap: 6,
  },
  iconButton: {
    padding: 7, borderRadius: radius.xs,
    backgroundColor: C.accentDim, borderWidth: 1, borderColor: C.accentBorder,
  },
  iconButtonDelete: {
    backgroundColor: C.dangerDim, borderColor: C.dangerBdr,
  },

  infoRow: {
    flexDirection: 'row', gap: 12, marginBottom: 14,
  },
  infoHalf: { flex: 1 },
  infoLabel: {
    fontSize: 10, fontWeight: '800', color: C.textMuted,
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4,
  },
  infoValue: {
    fontSize: 16, fontWeight: '800', color: C.textPrimary,
  },

  stockEditor: {
    gap: 8,
  },
  stockEditorValue: {
    fontSize: 15, fontWeight: '800', color: C.success,
  },
  adjustRow: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
  },
  adjBtn: {
    width: 26, height: 26, borderRadius: radius.xs,
    alignItems: 'center', justifyContent: 'center',
  },
  stockInput: {
    flex: 1, borderWidth: 1.5, borderColor: C.cardBorder,
    borderRadius: radius.xs, paddingHorizontal: 6,
    paddingVertical: 4, fontSize: 13,
    color: C.textPrimary, backgroundColor: C.inputBg,
    textAlign: 'center',
  },
  stockActionsRow: {
    flexDirection: 'row', gap: 6,
  },
  stockActionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 4,
    paddingVertical: 6, borderRadius: radius.xs,
  },
  stockActionText: {
    fontSize: 11, color: C.textPrimary, fontWeight: '700',
  },

  barometerSection: { gap: 8 },
  barometerHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  barometerLabel: {
    fontSize: 11, fontWeight: '700', color: C.textSub,
  },
  levelBadge: {
    borderWidth: 1, borderRadius: radius.pill,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  levelBadgeText: {
    fontSize: 9, fontWeight: '800', letterSpacing: 0.5,
  },
  barTrack: {
    height: 8, backgroundColor: C.elevated,
    borderRadius: radius.pill, overflow: 'hidden',
  },
  barFill: {
    height: '100%', borderRadius: radius.pill,
  },

  thresholdDisplay: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  thresholdDisplayText: {
    fontSize: 10, color: C.textSub, fontWeight: '600',
  },
  thresholdEditLink: {
    fontSize: 10, color: C.accent, fontWeight: '800',
  },
  thresholdEditor: {
    backgroundColor: C.inputBg, borderRadius: radius.sm,
    borderWidth: 1, borderColor: C.cardBorder,
    padding: 10, gap: 8,
  },
  thresholdRow: { flexDirection: 'row', gap: 10 },
  thresholdHalf: { flex: 1 },
  thresholdLabel: {
    fontSize: 9, fontWeight: '800', color: C.textMuted,
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4,
  },
  thresholdInput: {
    borderWidth: 1.5, borderColor: C.cardBorder,
    borderRadius: radius.xs, paddingHorizontal: 8, paddingVertical: 6,
    fontSize: 13, color: C.textPrimary, backgroundColor: C.surface,
  },
  barMinMax: {
    flexDirection: 'row', justifyContent: 'space-between',
  },
  barMinMaxText: {
    fontSize: 9, color: C.textMuted, fontWeight: '500',
  },

  expiryBanner: {
    marginTop: 10, padding: 8,
    backgroundColor: C.warningDim,
    borderRadius: radius.xs,
    borderLeftWidth: 3, borderLeftColor: C.warning,
  },
  expiryText: {
    fontSize: 11, color: C.warning, fontWeight: '700',
  },
})