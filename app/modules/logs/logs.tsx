import { useQuery } from '@tanstack/react-query'
import { Calculator, FileText } from 'lucide-react-native'
import { useState } from 'react'
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native'
import { logsService } from '../../../shared/services/logsService'

export default function Logs() {
  const [activeTab, setActiveTab] = useState<'all' | 'tax'>('all')

  const { data: logs = [], isLoading, error } = useQuery({
    queryKey: ['logs'],
    queryFn: () => logsService.getLogs(100),
  })

  const filteredLogs = activeTab === 'tax'
    ? logs.filter((log: any) =>
      log.title?.includes('Tax') ||
      log.title?.includes('tax') ||
      log.description?.includes('tax')
    )
    : logs

  if (isLoading) {
    return (
      <View style={styles.centerView}>
        <ActivityIndicator size="large" color="#C41E1E" />
      </View>
    )
  }

  if (error) {
    return (
      <View style={styles.centerView}>
        <Text style={styles.errorText}>Error loading logs</Text>
        <Text style={styles.errorDetail}>{String(error)}</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <FileText size={24} color="#1A1A1A" />
          <View>
            <Text style={styles.headerTitle}>Logs</Text>
            <Text style={styles.headerSubtitle}>{filteredLogs.length} events</Text>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'all' && styles.tabActive]}
            onPress={() => setActiveTab('all')}
          >
            <FileText size={14} color={activeTab === 'all' ? '#1A1A1A' : '#666'} />
            <Text style={[styles.tabText, activeTab === 'all' && styles.tabTextActive]}>
              All
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'tax' && styles.tabActive]}
            onPress={() => setActiveTab('tax')}
          >
            <Calculator size={14} color={activeTab === 'tax' ? '#1A1A1A' : '#666'} />
            <Text style={[styles.tabText, activeTab === 'tax' && styles.tabTextActive]}>
              Tax
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Logs List */}
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {filteredLogs.length === 0 ? (
          <View style={styles.emptyView}>
            <FileText size={48} color="#CCC" />
            <Text style={styles.emptyTitle}>
              {activeTab === 'tax' ? 'No tax logs' : 'No logs found'}
            </Text>
            <Text style={styles.emptySub}>Events will appear here</Text>
          </View>
        ) : (
          filteredLogs.map((log: any) => {
            let metadata: any = {}
            try {
              metadata = log.metadata ? JSON.parse(log.metadata) : {}
            } catch { }

            return (
              <View key={log.id} style={styles.logCard}>
                <View style={styles.logHeader}>
                  <Text style={styles.logTitle}>{log.title}</Text>
                  {log.amount && (
                    <Text style={styles.logAmount}>
                      NPR {log.amount.toFixed(2)}
                    </Text>
                  )}
                </View>

                <Text style={styles.logDescription}>{log.description}</Text>

                {/* Badges */}
                <View style={styles.badges}>
                  {log.table_name && (
                    <View style={[styles.badge, styles.badgeBlue]}>
                      <Text style={styles.badgeText}>Table: {log.table_name}</Text>
                    </View>
                  )}
                  {metadata.payment_method && (
                    <View style={[styles.badge, styles.badgeGreen]}>
                      <Text style={styles.badgeText}>{metadata.payment_method}</Text>
                    </View>
                  )}
                  {metadata.customer_name && (
                    <View style={[styles.badge, styles.badgeOrange]}>
                      <Text style={styles.badgeText}>{metadata.customer_name}</Text>
                    </View>
                  )}
                  {metadata.tax_name && (
                    <View style={[styles.badge, styles.badgeRed]}>
                      <Text style={styles.badgeText}>
                        {metadata.tax_name} {metadata.tax_rate}%
                      </Text>
                    </View>
                  )}
                </View>

                <Text style={styles.logDate}>
                  {new Date(log.created_at).toLocaleString()}
                </Text>
              </View>
            )
          })
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FEF1A8' },
  centerView: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { fontSize: 16, fontWeight: '600', color: '#C41E1E', marginBottom: 8 },
  errorDetail: { fontSize: 13, color: '#666' },
  header: {
    backgroundColor: '#FFF',
    paddingTop: 52,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E8D88A',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1A1A1A' },
  headerSubtitle: { fontSize: 12, color: '#666' },
  tabs: { flexDirection: 'row', gap: 8 },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  tabActive: { backgroundColor: '#E8D88A' },
  tabText: { fontSize: 12, fontWeight: '600', color: '#666' },
  tabTextActive: { color: '#1A1A1A' },
  scrollView: { flex: 1 },
  scrollContent: { padding: 12 },
  emptyView: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 80, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#666' },
  emptySub: { fontSize: 13, color: '#999' },
  logCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E8D88A',
  },
  logHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  logTitle: { fontSize: 14, fontWeight: '600', color: '#1A1A1A', flex: 1 },
  logAmount: { fontSize: 14, fontWeight: '700', color: '#22C55E' },
  logDescription: { fontSize: 13, color: '#666', marginBottom: 8 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  badgeBlue: { backgroundColor: '#DBEAFE' },
  badgeGreen: { backgroundColor: '#D1FAE5' },
  badgeOrange: { backgroundColor: '#FED7AA' },
  badgeRed: { backgroundColor: '#FEE2E2' },
  badgeText: { fontSize: 10, fontWeight: '600', color: '#1A1A1A' },
  logDate: { fontSize: 11, color: '#999' },
})