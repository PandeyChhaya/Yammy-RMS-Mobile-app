import { useQuery } from '@tanstack/react-query'
import { endOfDay, endOfMonth, endOfWeek, format, startOfDay, startOfMonth, startOfWeek } from 'date-fns'
import * as FileSystem from 'expo-file-system'
import * as Sharing from 'expo-sharing'
import {
    BarChart3,
    Calculator,
    CreditCard,
    DollarSign,
    Download,
    FileText,
    ShoppingCart,
    TrendingUp
} from 'lucide-react-native'
import { useState } from 'react'
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native'
import { logsService } from '../../../shared/services/logsService'

type DateRange = 'today' | 'week' | 'month'
type PaymentMethod = 'all' | 'cash' | 'card' | 'transfer'

interface SalesSummary {
  totalSales: number
  totalTransactions: number
  averageTransaction: number
  totalItems: number
  totalTaxAmount: number
  cashSales: number
  cardSales: number
  transferSales: number
  cashTransactions: number
  cardTransactions: number
  transferTransactions: number
}

interface TopProduct {
  name: string
  quantity: number
  revenue: number
}

interface TopTable {
  name: string
  transactions: number
  revenue: number
}

// ─── Design Tokens ────────────────────────────────────────────────────────────
const Colors = {
  background: '#FEF1A8',
  card: '#FFFFFF',
  brand: '#C41E1E',
  textPrimary: '#1A1A1A',
  textSecondary: '#5C5436',
  border: '#E8D88A',
  success: '#22C55E',
  danger: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',
  purple: '#A855F7',
  orange: '#F97316',
}

export default function Reports() {
  const [dateRange, setDateRange] = useState<DateRange>('today')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('all')

  // ── Get date range ──
  const getDateRange = () => {
    const now = new Date()
    let start: Date
    let end: Date

    switch (dateRange) {
      case 'today':
        start = startOfDay(now)
        end = endOfDay(now)
        break
      case 'week':
        start = startOfWeek(now, { weekStartsOn: 1 })
        end = endOfWeek(now, { weekStartsOn: 1 })
        break
      case 'month':
        start = startOfMonth(now)
        end = endOfMonth(now)
        break
      default:
        start = startOfDay(now)
        end = endOfDay(now)
    }

    return {
      start: start.toISOString(),
      end: end.toISOString()
    }
  }

  // ── Query for financial logs ──
  const { data: financialLogs = [], isLoading } = useQuery({
    queryKey: ['financialLogs', dateRange],
    queryFn: () => logsService.getFinancialLogs(getDateRange().start, getDateRange().end),
  })

  // ── Filter logs by payment method ──
  const filteredLogs = financialLogs.filter(log => {
    if (paymentMethod === 'all') return true

    try {
      const metadata = JSON.parse(log.metadata || '{}')
      const logPaymentMethod = metadata.payment_method?.toLowerCase() || ''

      switch (paymentMethod) {
        case 'cash':
          return logPaymentMethod.includes('cash')
        case 'card':
          return logPaymentMethod.includes('card')
        case 'transfer':
          return logPaymentMethod.includes('transfer')
        default:
          return true
      }
    } catch {
      return true
    }
  })

  // ── Calculate sales summary ──
  const calculateSalesSummary = (): SalesSummary => {
    let totalSales = 0
    let totalTransactions = 0
    let totalItems = 0
    let totalTaxAmount = 0
    let cashSales = 0
    let cardSales = 0
    let transferSales = 0
    let cashTransactions = 0
    let cardTransactions = 0
    let transferTransactions = 0

    filteredLogs.forEach(log => {
      if (log.amount) {
        try {
          const metadata = JSON.parse(log.metadata || '{}')

          const isTaxLog = log.title?.includes('TVA') || log.title?.includes('tax') ||
            log.description?.includes('TVA') || log.description?.includes('tax')

          if (isTaxLog) {
            totalTaxAmount += log.amount
          } else {
            totalSales += log.amount
            totalTransactions += 1

            const itemsCount = metadata.items_count || 0
            totalItems += itemsCount

            const paymentMethod = metadata.payment_method?.toLowerCase() || ''

            if (paymentMethod.includes('cash')) {
              cashSales += log.amount
              cashTransactions += 1
            } else if (paymentMethod.includes('card')) {
              cardSales += log.amount
              cardTransactions += 1
            } else if (paymentMethod.includes('transfer')) {
              transferSales += log.amount
              transferTransactions += 1
            }
          }
        } catch {
          totalSales += log.amount
          totalTransactions += 1
          cashSales += log.amount
          cashTransactions += 1
        }
      }
    })

    return {
      totalSales,
      totalTransactions,
      averageTransaction: totalTransactions > 0 ? totalSales / totalTransactions : 0,
      totalItems,
      totalTaxAmount,
      cashSales,
      cardSales,
      transferSales,
      cashTransactions,
      cardTransactions,
      transferTransactions
    }
  }

  // ── Get top products ──
  const getTopProducts = (): TopProduct[] => {
    const productMap = new Map<string, { quantity: number; revenue: number }>()

    filteredLogs.forEach(log => {
      try {
        const metadata = JSON.parse(log.metadata || '{}')

        const isTaxLog = log.title?.includes('TVA') || log.title?.includes('tax') ||
          log.description?.includes('TVA') || log.description?.includes('tax')

        if (!isTaxLog) {
          const items = metadata.items || []

          items.forEach((item: any) => {
            const productName = item.product_name || 'Unknown Product'
            const quantity = item.quantity || 0
            const unitPrice = item.unit_price || 0
            const revenue = quantity * unitPrice

            const existing = productMap.get(productName) || { quantity: 0, revenue: 0 }
            productMap.set(productName, {
              quantity: existing.quantity + quantity,
              revenue: existing.revenue + revenue
            })
          })
        }
      } catch {
        // Skip
      }
    })

    return Array.from(productMap.entries())
      .map(([name, data]) => ({
        name,
        quantity: data.quantity,
        revenue: data.revenue
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)
  }

  // ── Get top tables ──
  const getTopTables = (): TopTable[] => {
    const tableMap = new Map<string, { transactions: number; revenue: number }>()

    filteredLogs.forEach(log => {
      if (log.table_name && log.amount) {
        const isTaxLog = log.title?.includes('TVA') || log.title?.includes('tax') ||
          log.description?.includes('TVA') || log.description?.includes('tax')

        if (!isTaxLog) {
          const existing = tableMap.get(log.table_name) || { transactions: 0, revenue: 0 }
          tableMap.set(log.table_name, {
            transactions: existing.transactions + 1,
            revenue: existing.revenue + log.amount
          })
        }
      }
    })

    return Array.from(tableMap.entries())
      .map(([name, data]) => ({
        name,
        transactions: data.transactions,
        revenue: data.revenue
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)
  }

  const salesSummary = calculateSalesSummary()
  const topProducts = getTopProducts()
  const topTables = getTopTables()
  const { start, end } = getDateRange()

  // ── Export report ──
  const exportReport = async () => {
    try {
      const reportData = {
        period: `${format(new Date(start), 'dd/MM/yyyy')} - ${format(new Date(end), 'dd/MM/yyyy')}`,
        summary: {
          ...salesSummary,
          totalTaxAmount: salesSummary.totalTaxAmount,
          netAmount: salesSummary.totalSales - salesSummary.totalTaxAmount
        },
        topProducts,
        topTables,
        generatedAt: new Date().toLocaleString('en-US')
      }

      const fileName = `report-${format(new Date(), 'yyyy-MM-dd-HHmm')}.json`
      const fileUri = `${FileSystem.documentDirectory}${fileName}`

      await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(reportData, null, 2), {
        encoding: 'utf8',
      })

      const canShare = await Sharing.isAvailableAsync()
      if (canShare) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/json',
          dialogTitle: 'Export Report',
        })
      } else {
        Alert.alert('Exported', `Report saved to: ${fileUri}`)
      }
    } catch (error) {
      console.error('Export error:', error)
      Alert.alert('Export Failed', 'Could not export report.')
    }
  }

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.brand} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    )
  }

  return (
    <View style={styles.root}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <BarChart3 size={24} color={Colors.brand} />
            <View>
              <Text style={styles.headerTitle}>Reports</Text>
              <Text style={styles.headerSubtitle}>
                {format(new Date(start), 'dd/MM/yyyy')} - {format(new Date(end), 'dd/MM/yyyy')}
              </Text>
            </View>
          </View>

          <TouchableOpacity style={styles.exportBtn} onPress={exportReport}>
            <Download size={16} color={Colors.card} />
            <Text style={styles.exportBtnText}>Export</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Filters ── */}
      <View style={styles.filters}>
        <View style={styles.filterGroup}>
          <Text style={styles.filterLabel}>Period</Text>
          <View style={styles.filterButtons}>
            {(['today', 'week', 'month'] as DateRange[]).map(range => (
              <TouchableOpacity
                key={range}
                style={[styles.filterBtn, dateRange === range && styles.filterBtnActive]}
                onPress={() => setDateRange(range)}
              >
                <Text style={[styles.filterBtnText, dateRange === range && styles.filterBtnTextActive]}>
                  {range === 'today' ? 'Today' : range === 'week' ? 'This Week' : 'This Month'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.filterGroup}>
          <Text style={styles.filterLabel}>Payment Method</Text>
          <View style={styles.filterButtons}>
            {(['all', 'cash', 'card', 'transfer'] as PaymentMethod[]).map(method => (
              <TouchableOpacity
                key={method}
                style={[styles.filterBtn, paymentMethod === method && styles.filterBtnActive]}
                onPress={() => setPaymentMethod(method)}
              >
                <Text style={[styles.filterBtnText, paymentMethod === method && styles.filterBtnTextActive]}>
                  {method.charAt(0).toUpperCase() + method.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* ── Content ── */}
      <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
        {/* Summary Cards */}
        <View style={styles.statsGrid}>
          <StatCard
            label="Total Sales"
            value={`NPR ${salesSummary.totalSales.toFixed(2)}`}
            icon={<DollarSign size={28} color={Colors.success} />}
            valueColor={Colors.success}
          />
          <StatCard
            label="Total Tax"
            value={`NPR ${salesSummary.totalTaxAmount.toFixed(2)}`}
            icon={<Calculator size={28} color={Colors.danger} />}
            valueColor={Colors.danger}
          />
          <StatCard
            label="Transactions"
            value={salesSummary.totalTransactions.toString()}
            icon={<ShoppingCart size={28} color={Colors.info} />}
          />
          <StatCard
            label="Avg Transaction"
            value={`NPR ${salesSummary.averageTransaction.toFixed(2)}`}
            icon={<TrendingUp size={28} color={Colors.purple} />}
          />
          <StatCard
            label="Items Sold"
            value={salesSummary.totalItems.toString()}
            icon={<FileText size={28} color={Colors.orange} />}
          />
        </View>

        {/* Payment Method Breakdown */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Payment Method Breakdown</Text>
          <View style={styles.paymentList}>
            <PaymentRow
              method="Cash"
              amount={salesSummary.cashSales}
              transactions={salesSummary.cashTransactions}
              color={Colors.success}
            />
            <PaymentRow
              method="Card"
              amount={salesSummary.cardSales}
              transactions={salesSummary.cardTransactions}
              color={Colors.info}
            />
            <PaymentRow
              method="Transfer"
              amount={salesSummary.transferSales}
              transactions={salesSummary.transferTransactions}
              color={Colors.purple}
            />
          </View>
        </View>

        {/* Top Tables */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Top 5 Tables</Text>
          <View style={styles.tableList}>
            {topTables.slice(0, 5).map((table, index) => (
              <View key={table.name} style={styles.tableRow}>
                <View style={styles.tableRowLeft}>
                  <Text style={styles.tableRank}>#{index + 1}</Text>
                  <Text style={styles.tableName}>{table.name}</Text>
                </View>
                <View style={styles.tableRowRight}>
                  <Text style={styles.tableRevenue}>NPR {table.revenue.toFixed(2)}</Text>
                  <Text style={styles.tableTransactions}>{table.transactions} trans.</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Top Products */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Top 10 Products</Text>
          <View style={styles.productList}>
            {topProducts.map((product, index) => (
              <View key={product.name} style={styles.productRow}>
                <View style={styles.productRowLeft}>
                  <Text style={styles.productRank}>#{index + 1}</Text>
                  <Text style={styles.productName}>{product.name}</Text>
                </View>
                <View style={styles.productRowRight}>
                  <Text style={styles.productQty}>{product.quantity} units</Text>
                  <Text style={styles.productRevenue}>NPR {product.revenue.toFixed(2)}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Data Diagnostic */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Data Diagnostic</Text>
          <View style={styles.diagnosticGrid}>
            <View style={styles.diagnosticItem}>
              <Text style={styles.diagnosticLabel}>Total Logs</Text>
              <Text style={[styles.diagnosticValue, { color: Colors.info }]}>
                {financialLogs.length}
              </Text>
            </View>
            <View style={styles.diagnosticItem}>
              <Text style={styles.diagnosticLabel}>Filtered Logs</Text>
              <Text style={[styles.diagnosticValue, { color: Colors.success }]}>
                {filteredLogs.length}
              </Text>
            </View>
            <View style={styles.diagnosticItem}>
              <Text style={styles.diagnosticLabel}>Excluded</Text>
              <Text style={[styles.diagnosticValue, { color: Colors.warning }]}>
                {financialLogs.length - filteredLogs.length}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

// ─── StatCard Component ───────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  icon,
  valueColor,
}: {
  label: string
  value: string
  icon: React.ReactNode
  valueColor?: string
}) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statCardTop}>
        <View style={styles.statCardIcon}>{icon}</View>
      </View>
      <Text style={styles.statCardLabel}>{label}</Text>
      <Text style={[styles.statCardValue, valueColor ? { color: valueColor } : {}]}>
        {value}
      </Text>
    </View>
  )
}

// ─── PaymentRow Component ─────────────────────────────────────────────────────
function PaymentRow({
  method,
  amount,
  transactions,
  color,
}: {
  method: string
  amount: number
  transactions: number
  color: string
}) {
  return (
    <View style={styles.paymentRow}>
      <View style={styles.paymentRowLeft}>
        <CreditCard size={16} color={color} />
        <Text style={styles.paymentMethod}>{method}</Text>
      </View>
      <View style={styles.paymentRowRight}>
        <Text style={styles.paymentAmount}>NPR {amount.toFixed(2)}</Text>
        <Text style={styles.paymentTransactions}>{transactions} trans.</Text>
      </View>
    </View>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontFamily: 'Inter',
  },

  // Header
  header: {
    backgroundColor: Colors.card,
    paddingTop: 52,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    fontFamily: 'Inter-Bold',
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontFamily: 'Inter',
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.brand,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  exportBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.card,
    fontFamily: 'Inter',
  },

  // Filters
  filters: {
    backgroundColor: Colors.card,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 16,
  },
  filterGroup: {
    gap: 8,
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
    fontFamily: 'Inter',
  },
  filterButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  filterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterBtnActive: {
    backgroundColor: Colors.brand,
    borderColor: Colors.brand,
  },
  filterBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    fontFamily: 'Inter',
  },
  filterBtnTextActive: {
    color: Colors.card,
  },

  // Content
  content: {
    flex: 1,
  },
  contentInner: {
    padding: 16,
    gap: 16,
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 14,
    width: '47%',
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statCardTop: {
    marginBottom: 8,
  },
  statCardIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statCardLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginBottom: 4,
    fontFamily: 'Inter',
  },
  statCardValue: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
    fontFamily: 'Inter-Bold',
  },

  // Card
  card: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 12,
    fontFamily: 'Inter-Bold',
  },

  // Payment List
  paymentList: {
    gap: 12,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  paymentRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  paymentMethod: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
    fontFamily: 'Inter',
  },
  paymentRowRight: {
    alignItems: 'flex-end',
  },
  paymentAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    fontFamily: 'Inter-Bold',
  },
  paymentTransactions: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontFamily: 'Inter',
  },

  // Table List
  tableList: {
    gap: 10,
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  tableRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tableRank: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    fontFamily: 'Inter',
  },
  tableName: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
    fontFamily: 'Inter',
  },
  tableRowRight: {
    alignItems: 'flex-end',
  },
  tableRevenue: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    fontFamily: 'Inter-Bold',
  },
  tableTransactions: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontFamily: 'Inter',
  },

  // Product List
  productList: {
    gap: 10,
  },
  productRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  productRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  productRank: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    fontFamily: 'Inter',
  },
  productName: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
    fontFamily: 'Inter',
    flex: 1,
  },
  productRowRight: {
    alignItems: 'flex-end',
  },
  productQty: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontFamily: 'Inter',
  },
  productRevenue: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.success,
    fontFamily: 'Inter-Bold',
  },

  // Diagnostic
  diagnosticGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  diagnosticItem: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  diagnosticLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 4,
    fontFamily: 'Inter',
  },
  diagnosticValue: {
    fontSize: 20,
    fontWeight: '800',
    fontFamily: 'Inter-Bold',
  },
})
