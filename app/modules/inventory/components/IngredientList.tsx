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
  orange:      '#C2410C',
  orangeLight: '#FFF7ED',
  yellow:      '#92400E',
  yellowLight: '#FFFBEB',
}

const radius = { xs: 6, sm: 10, md: 14, lg: 18, pill: 100 }

const stockLevelStyle = (level: string) => {
  switch (level) {
    case 'out_of_stock': return { bg: C.tcLight,     border: C.tcBorder,    text: C.terracotta }
    case 'low_stock':    return { bg: C.orangeLight, border: '#FDBA74',     text: C.orange }
    case 'normal_stock': return { bg: C.yellowLight, border: '#FCD34D',     text: C.yellow }
    case 'high_stock':   return { bg: C.sageLight,   border: C.sageBorder,  text: C.sage }
    default:             return { bg: C.vellum,      border: C.vellum,      text: C.clay }
  }
}

const stockBarColor = (level: string) => {
  switch (level) {
    case 'out_of_stock': return C.terracotta
    case 'low_stock':    return C.orange
    case 'normal_stock': return C.yellow
    case 'high_stock':   return C.sage
    default:             return C.clay
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
        <ActivityIndicator size="large" color={C.brass} />
        <Text style={styles.stateText}>Loading ingredients…</Text>
      </View>
    )
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Package size={40} color={C.terracotta} />
        <Text style={[styles.stateText, { color: C.terracotta }]}>Error loading ingredients</Text>
        <Text style={styles.stateSub}>{error}</Text>
      </View>
    )
  }

  if (ingredients.length === 0) {
    return (
      <View style={styles.centered}>
        <View style={styles.emptyIcon}>
          <Package size={32} color={C.brass} />
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
                  <Edit size={14} color={C.brass} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.iconButton, styles.iconButtonDelete]}
                  onPress={() => handleDelete(ingredient.id, ingredient.name)}
                >
                  <Trash2 size={14} color={C.terracotta} />
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
                          backgroundColor: C.sage,
                        },
                      ]} />
                    </View>

                    <View style={styles.adjustRow}>
                      <TouchableOpacity style={[styles.adjBtn, { backgroundColor: C.terracotta }]} onPress={() => adjustStock(-1)}>
                        <Minus size={12} color={C.cream} />
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.adjBtn, { backgroundColor: C.orange }]} onPress={() => adjustStock(-0.1)}>
                        <Minus size={10} color={C.cream} />
                      </TouchableOpacity>
                      <TextInput
                        style={styles.stockInput}
                        keyboardType="numeric"
                        value={String(newStockValue)}
                        onChangeText={t => setNewStockValue(parseFloat(t) || 0)}
                      />
                      <TouchableOpacity style={[styles.adjBtn, { backgroundColor: C.orange }]} onPress={() => adjustStock(0.1)}>
                        <Plus size={10} color={C.cream} />
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.adjBtn, { backgroundColor: C.sage }]} onPress={() => adjustStock(1)}>
                        <Plus size={12} color={C.cream} />
                      </TouchableOpacity>
                    </View>

                    <View style={styles.stockActionsRow}>
                      <TouchableOpacity
                        style={[styles.stockActionBtn, { backgroundColor: C.sage }]}
                        onPress={() => handleStockSave(ingredient.id)}
                      >
                        <Save size={11} color={C.cream} />
                        <Text style={styles.stockActionText}>Save</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.stockActionBtn, { backgroundColor: C.clay }]}
                        onPress={handleStockCancel}
                      >
                        <X size={11} color={C.cream} />
                        <Text style={styles.stockActionText}>Cancel</Text>
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
                      style={[styles.stockActionBtn, { backgroundColor: C.sage }]}
                      onPress={() => handleThresholdsSave(ingredient.id)}
                    >
                      <Text style={styles.stockActionText}>Save</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.stockActionBtn, { backgroundColor: C.clay }]}
                      onPress={handleThresholdsCancel}
                    >
                      <Text style={styles.stockActionText}>Cancel</Text>
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
    backgroundColor: C.brassLight, borderWidth: 1.5, borderColor: C.brassBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 17, fontWeight: '800', color: C.espresso,
  },
  stateText: {
    fontSize: 15, fontWeight: '700', color: C.clay,
  },
  stateSub: {
    fontSize: 12, color: C.clay, textAlign: 'center',
  },

  card: {
    backgroundColor: C.parchment,
    borderRadius: radius.md,
    borderWidth: 1.5, borderColor: C.vellum,
    padding: 14,
    shadowColor: C.espresso,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 12,
  },
  cardTitle: {
    fontSize: 15, fontWeight: '800', color: C.espresso,
  },
  cardCategory: {
    fontSize: 11, color: C.clay, marginTop: 2, fontWeight: '500',
  },
  cardActions: {
    flexDirection: 'row', gap: 6,
  },
  iconButton: {
    padding: 7, borderRadius: radius.xs,
    backgroundColor: C.brassLight, borderWidth: 1, borderColor: C.brassBorder,
  },
  iconButtonDelete: {
    backgroundColor: C.tcLight, borderColor: C.tcBorder,
  },

  infoRow: {
    flexDirection: 'row', gap: 12, marginBottom: 14,
  },
  infoHalf: { flex: 1 },
  infoLabel: {
    fontSize: 10, fontWeight: '800', color: C.clay,
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4,
  },
  infoValue: {
    fontSize: 16, fontWeight: '800', color: C.espresso,
  },

  stockEditor: {
    gap: 8,
  },
  stockEditorValue: {
    fontSize: 15, fontWeight: '800', color: C.sage,
  },
  adjustRow: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
  },
  adjBtn: {
    width: 26, height: 26, borderRadius: radius.xs,
    alignItems: 'center', justifyContent: 'center',
  },
  stockInput: {
    flex: 1, borderWidth: 1.5, borderColor: C.vellum,
    borderRadius: radius.xs, paddingHorizontal: 6,
    paddingVertical: 4, fontSize: 13,
    color: C.espresso, backgroundColor: C.cream,
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
    fontSize: 11, color: C.cream, fontWeight: '700',
  },

  barometerSection: { gap: 8 },
  barometerHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  barometerLabel: {
    fontSize: 11, fontWeight: '700', color: C.clay,
  },
  levelBadge: {
    borderWidth: 1, borderRadius: radius.pill,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  levelBadgeText: {
    fontSize: 9, fontWeight: '800', letterSpacing: 0.5,
  },
  barTrack: {
    height: 8, backgroundColor: C.vellum,
    borderRadius: radius.pill, overflow: 'hidden',
  },
  barFill: {
    height: '100%', borderRadius: radius.pill,
  },

  thresholdDisplay: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  thresholdDisplayText: {
    fontSize: 10, color: C.clay, fontWeight: '600',
  },
  thresholdEditLink: {
    fontSize: 10, color: C.brass, fontWeight: '800',
  },
  thresholdEditor: {
    backgroundColor: C.cream, borderRadius: radius.sm,
    borderWidth: 1, borderColor: C.vellum,
    padding: 10, gap: 8,
  },
  thresholdRow: { flexDirection: 'row', gap: 10 },
  thresholdHalf: { flex: 1 },
  thresholdLabel: {
    fontSize: 9, fontWeight: '800', color: C.clay,
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4,
  },
  thresholdInput: {
    borderWidth: 1.5, borderColor: C.vellum,
    borderRadius: radius.xs, paddingHorizontal: 8, paddingVertical: 6,
    fontSize: 13, color: C.espresso, backgroundColor: C.parchment,
  },
  barMinMax: {
    flexDirection: 'row', justifyContent: 'space-between',
  },
  barMinMaxText: {
    fontSize: 9, color: C.latte, fontWeight: '500',
  },

  expiryBanner: {
    marginTop: 10, padding: 8,
    backgroundColor: C.yellowLight,
    borderRadius: radius.xs,
    borderLeftWidth: 3, borderLeftColor: '#FBBF24',
  },
  expiryText: {
    fontSize: 11, color: C.yellow, fontWeight: '700',
  },
})