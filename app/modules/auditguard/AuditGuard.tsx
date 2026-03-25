import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as FileSystem from 'expo-file-system'
import * as Sharing from 'expo-sharing'
import {
    Activity,
    AlertTriangle,
    CheckCircle,
    Clock,
    Download,
    Eye,
    FileText,
    RefreshCw,
    Settings,
    Shield,
    XCircle,
} from 'lucide-react-native'
import { useEffect, useState } from 'react'
import {
    ActivityIndicator,
    Alert,
    DeviceEventEmitter,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native'
import { securityService } from '../../../shared/services/securityService'
import {
    Anomaly,
    AnomalySeverity,
    COUNTRY_COMPLIANCE_CONFIGS,
    SecurityConfig,
    SecurityStats,
} from '../../../shared/types/security'


const COLORS = {
  brand: '#C41E1E',
  brandLight: '#FFF0F0',
  brandBorder: '#FECACA',
  background: '#FDFAF3',
  headerBg: '#FFFBEE',
  surface: '#FFFFFF',
  textPrimary: '#1A1A1A',
  textSecondary: '#6B5E3A',
  textMuted: '#A89870',
  gold: '#C4933E',
  goldLight: '#FEF3DC',
  goldBorder: '#F5D98A',
  success: '#2E7D32',
  successLight: '#F0FDF4',
  successBorder: '#BBF7D0',
  border: '#EDE0B8',
  cardBorder: '#F5EBD0',
  inputBg: '#FFFDF7',
  divider: '#F0E6C8',
  warning: '#D97706',
  warningLight: '#FEF3C7',
  info: '#1565C0',
  infoLight: '#DBEAFE',
}

export default function AuditGuard() {
    const [currentTab, setCurrentTab] = useState<'overview' | 'anomalies' | 'compliance' | 'config'>('overview')
    const [sessionToken] = useState(() => securityService.generateSessionId())
    const queryClient = useQueryClient()

    // fetch security stats
    const { data: statsData, isLoading: loadingStats } = useQuery<SecurityStats>({
        queryKey: ['security-stats'],
        queryFn: () => securityService.getSecurityStats(),
        refetchInterval: 30000,
    })

    // fetch anomaly list
    const { data: anomalyList = [], isLoading: loadingAnomalies } = useQuery<Anomaly[]>({
        queryKey: ['anomalies'],
        queryFn: () => securityService.getAnomalies(50),
        refetchInterval: 60000,
    })

    const { data: _unresolvedList = [] } = useQuery<Anomaly[]>({
        queryKey: ['unresolved-anomalies'],
        queryFn: () => securityService.getUnresolvedAnomalies(),
        refetchInterval: 30000,
    })

    const { data: configData } = useQuery<SecurityConfig | null>({
        queryKey: ['security-config'],
        queryFn: () => securityService.getSecurityConfig(),
    })

    // mutation to mark anomaly as resolved
    const markAsResolvedMutation = useMutation({
        mutationFn: ({ anomalyId, resolvedBy }: { anomalyId: string; resolvedBy: string }) =>
            securityService.resolveAnomaly(anomalyId, resolvedBy),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['anomalies'] })
            queryClient.invalidateQueries({ queryKey: ['unresolved-anomalies'] })
        },
    })

    // mutation to save security config
    const updateConfigMutation = useMutation({
        mutationFn: (config: SecurityConfig) => securityService.saveSecurityConfig(config),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['security-config'] })
        },
    })

    // init security on mount
    useEffect(() => {
        const setupSecurity = async () => {
            try {
                await securityService.initSecuritySystem()
                await securityService.createAppClock(sessionToken)
            } catch (err) {
                console.error('Security init failed:', err)
            }
        }
        setupSecurity()
    }, [sessionToken])

    // start monitoring if config exists
    useEffect(() => {
        if (configData) {
            securityService.startRealTimeMonitoring(sessionToken, configData)
        }
    }, [sessionToken, configData])

    // listen for security alerts
    useEffect(() => {
        const alertListener = DeviceEventEmitter.addListener('security-alert', (data) => {
            console.log('Security alert:', data)
        })
        return () => alertListener.remove()
    }, [])

    // get styling for severity levels
    const getSeverityColors = (severity: AnomalySeverity) => {
        switch (severity) {
            case AnomalySeverity.Low:
                return { bg: COLORS.infoLight, text: COLORS.info }
            case AnomalySeverity.Medium:
                return { bg: COLORS.warningLight, text: COLORS.warning }
            case AnomalySeverity.High:
                return { bg: '#FFEDD5', text: '#9A3412' }
            case AnomalySeverity.Critical:
                return { bg: COLORS.brandLight, text: COLORS.brand }
            default:
                return { bg: '#F3F4F6', text: '#4B5563' }
        }
    }

    const getSeverityIconComponent = (severity: AnomalySeverity) => {
        const colorLookup: Record<string, string> = {
            [AnomalySeverity.Low]: COLORS.info,
            [AnomalySeverity.Medium]: COLORS.warning,
            [AnomalySeverity.High]: COLORS.warning,
            [AnomalySeverity.Critical]: COLORS.brand,
        }
        const iconColor = colorLookup[severity] || COLORS.textMuted
        
        switch (severity) {
            case AnomalySeverity.Low: return <Eye size={16} color={iconColor} />
            case AnomalySeverity.Medium: return <AlertTriangle size={16} color={iconColor} />
            case AnomalySeverity.High: return <XCircle size={16} color={iconColor} />
            case AnomalySeverity.Critical: return <Shield size={16} color={iconColor} />
            default: return <Activity size={16} color={iconColor} />
        }
    }

    const handleFixAnomaly = (anomalyId: string) => {
        markAsResolvedMutation.mutate({ anomalyId, resolvedBy: 'admin' })
    }

    // export security data
    const handleDataExport = async (fileFormat: 'json' | 'csv') => {
        try {
            const docFolder = FileSystem.documentDirectory
            
            if (!docFolder) {
                Alert.alert('Error', 'Cannot access document directory')
                return
            }
            
            const exportedData = await securityService.exportSecurityData(fileFormat)
            const timestamp = new Date().toISOString().split('T')[0]
            const filename = `security-export-${timestamp}.${fileFormat}`
            const filePath = `${docFolder}${filename}`
            
            await FileSystem.writeAsStringAsync(filePath, exportedData, {
                encoding: 'utf8',
            })
            
            const sharingAvailable = await Sharing.isAvailableAsync()
            if (sharingAvailable) {
                await Sharing.shareAsync(filePath, {
                    mimeType: fileFormat === 'json' ? 'application/json' : 'text/csv',
                    dialogTitle: `Export ${fileFormat.toUpperCase()}`,
                })
            } else {
                Alert.alert('Saved', `File saved to: ${filePath}`)
            }
        } catch (err) {
            console.error('Export error:', err)
            Alert.alert('Export Failed', 'Could not export data')
        }
    }

    if (loadingStats) {
        return (
            <View style={styles.loadingScreen}>
                <View style={styles.loadingCard}>
                    <View style={styles.loadingIconWrap}>
                        <Shield size={28} color={COLORS.brand} />
                    </View>
                    <ActivityIndicator size="large" color={COLORS.brand} style={{ marginTop: 16 }} />
                    <Text style={styles.loadingTitle}>AuditGuard</Text>
                    <Text style={styles.loadingText}>Loading security dashboard...</Text>
                </View>
            </View>
        )
    }

    const tabsList = [
        { id: 'overview', name: 'Overview', icon: Activity },
        { id: 'anomalies', name: 'Anomalies', icon: AlertTriangle },
        { id: 'compliance', name: 'Compliance', icon: FileText },
        { id: 'config', name: 'Config', icon: Settings },
    ]

    return (
        <View style={styles.container}>
            {/* header section */}
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <View style={styles.brandSection}>
                        <View style={styles.logoBadge}>
                            <Shield size={20} color={COLORS.surface} />
                        </View>
                        <View>
                            <Text style={styles.brandName}>AuditGuard</Text>
                            <Text style={styles.brandSub}>Security & Compliance</Text>
                        </View>
                    </View>

                    <View style={styles.exportButtons}>
                        <TouchableOpacity
                            style={[styles.exportBtn, { backgroundColor: COLORS.brand }]}
                            onPress={() => handleDataExport('json')}
                            activeOpacity={0.85}
                        >
                            <Download size={13} color={COLORS.surface} />
                            <Text style={styles.exportBtnText}>JSON</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.exportBtn, { backgroundColor: COLORS.success }]}
                            onPress={() => handleDataExport('csv')}
                            activeOpacity={0.85}
                        >
                            <Download size={13} color={COLORS.surface} />
                            <Text style={styles.exportBtnText}>CSV</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* tabs navigation */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll}>
                    <View style={styles.tabsRow}>
                        {tabsList.map((tab) => {
                            const TabIcon = tab.icon
                            const isActive = currentTab === tab.id
                            return (
                                <TouchableOpacity
                                    key={tab.id}
                                    style={[styles.tab, isActive && styles.tabActive]}
                                    onPress={() => setCurrentTab(tab.id as any)}
                                    activeOpacity={0.75}
                                >
                                    <TabIcon size={15} color={isActive ? COLORS.brand : COLORS.textMuted} />
                                    <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                                        {tab.name}
                                    </Text>
                                </TouchableOpacity>
                            )
                        })}
                    </View>
                </ScrollView>
            </View>

            {/* main content */}
            <ScrollView
                style={styles.contentScroll}
                contentContainerStyle={styles.contentInner}
                showsVerticalScrollIndicator={false}
            >
                {/* overview tab */}
                {currentTab === 'overview' && (
                    <View style={styles.tabContent}>
                        {/* stats grid */}
                        <View style={styles.statsGrid}>
                            <MetricCard
                                label="Secure Logs"
                                value={statsData?.total_secure_logs || 0}
                                icon={<FileText size={22} color={COLORS.info} />}
                            />
                            <MetricCard
                                label="Total Anomalies"
                                value={statsData?.total_anomalies || 0}
                                icon={<AlertTriangle size={22} color={COLORS.warning} />}
                            />
                            <MetricCard
                                label="Unresolved"
                                value={statsData?.unresolved_anomalies || 0}
                                icon={<XCircle size={22} color={COLORS.brand} />}
                                valueColor={COLORS.brand}
                            />
                            <MetricCard
                                label="Uptime"
                                value={`${Math.floor((statsData?.system_uptime || 0) / (1000 * 60 * 60))}h`}
                                icon={<Clock size={22} color={COLORS.success} />}
                            />
                        </View>

                        {/* system integrity card */}
                        <View style={styles.card}>
                            <Text style={styles.cardTitle}>System Integrity</Text>

                            <View style={styles.integrityRow}>
                                <Text style={styles.integrityLabel}>Transaction Chain</Text>
                                <View style={styles.integrityStatus}>
                                    {statsData?.chain_integrity
                                        ? <CheckCircle size={18} color={COLORS.success} />
                                        : <XCircle size={18} color={COLORS.brand} />}
                                    <Text style={[
                                        styles.integrityText,
                                        { color: statsData?.chain_integrity ? COLORS.success : COLORS.brand }
                                    ]}>
                                        {statsData?.chain_integrity ? 'Integral' : 'Compromised'}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.divider} />

                            <View style={styles.integrityRow}>
                                <Text style={styles.integrityLabel}>Temporal Consistency</Text>
                                <View style={styles.integrityStatus}>
                                    {statsData?.time_consistency
                                        ? <CheckCircle size={18} color={COLORS.success} />
                                        : <XCircle size={18} color={COLORS.brand} />}
                                    <Text style={[
                                        styles.integrityText,
                                        { color: statsData?.time_consistency ? COLORS.success : COLORS.brand }
                                    ]}>
                                        {statsData?.time_consistency ? 'Consistent' : 'Anomalous'}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* recent activity */}
                        <View style={styles.card}>
                            <Text style={styles.cardTitle}>Recent Activity</Text>
                            {anomalyList.slice(0, 5).map((anomaly) => (
                                <View key={anomaly.id} style={styles.activityItem}>
                                    {getSeverityIconComponent(anomaly.severity)}
                                    <View style={styles.activityContent}>
                                        <Text style={styles.activityTitle} numberOfLines={1}>
                                            {anomaly.description}
                                        </Text>
                                        <Text style={styles.activityTime}>
                                            {new Date(anomaly.timestamp).toLocaleString('en-US')}
                                        </Text>
                                    </View>
                                </View>
                            ))}
                            {anomalyList.length === 0 && (
                                <Text style={styles.emptyText}>No recent activity</Text>
                            )}
                        </View>
                    </View>
                )}

                {/* anomalies tab */}
                {currentTab === 'anomalies' && (
                    <View style={styles.tabContent}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Detected Anomalies</Text>
                            <TouchableOpacity
                                style={styles.refreshButton}
                                onPress={() => queryClient.invalidateQueries({ queryKey: ['anomalies'] })}
                                activeOpacity={0.85}
                            >
                                <RefreshCw size={14} color={COLORS.surface} />
                                <Text style={styles.refreshButtonText}>Refresh</Text>
                            </TouchableOpacity>
                        </View>

                        {loadingAnomalies ? (
                            <View style={styles.centerLoader}>
                                <ActivityIndicator size="large" color={COLORS.brand} />
                            </View>
                        ) : anomalyList.length === 0 ? (
                            <View style={styles.emptyState}>
                                <View style={styles.emptyIconWrap}>
                                    <CheckCircle size={36} color={COLORS.success} />
                                </View>
                                <Text style={styles.emptyStateTitle}>No Anomalies</Text>
                                <Text style={styles.emptyStateText}>System operating normally</Text>
                            </View>
                        ) : (
                            anomalyList.map((anomaly) => {
                                const severityStyle = getSeverityColors(anomaly.severity)
                                return (
                                    <View key={anomaly.id} style={styles.card}>
                                        <View style={styles.anomalyHeader}>
                                            <View style={styles.anomalyBadges}>
                                                {getSeverityIconComponent(anomaly.severity)}
                                                <View style={[styles.severityBadge, { backgroundColor: severityStyle.bg }]}>
                                                    <Text style={[styles.severityText, { color: severityStyle.text }]}>
                                                        {anomaly.severity}
                                                    </Text>
                                                </View>
                                            </View>
                                            <Text style={styles.anomalyTimestamp}>
                                                {new Date(anomaly.timestamp).toLocaleString('en-US')}
                                            </Text>
                                        </View>

                                        <Text style={styles.anomalyDescription}>{anomaly.description}</Text>
                                        <Text style={styles.anomalyType}>
                                            <Text style={{ fontWeight: '600' }}>Type: </Text>
                                            {anomaly.anomaly_type}
                                        </Text>

                                        {anomaly.recommendations.length > 0 && (
                                            <View style={styles.recommendationsBox}>
                                                <Text style={styles.recommendationsTitle}>Recommendations:</Text>
                                                {anomaly.recommendations.map((recommendation, idx) => (
                                                    <Text key={idx} style={styles.recommendationItem}>
                                                        • {recommendation}
                                                    </Text>
                                                ))}
                                            </View>
                                        )}

                                        <View style={styles.anomalyActions}>
                                            {!anomaly.resolved ? (
                                                <TouchableOpacity
                                                    style={[
                                                        styles.resolveButton,
                                                        markAsResolvedMutation.isPending && styles.disabledButton,
                                                    ]}
                                                    onPress={() => handleFixAnomaly(anomaly.id)}
                                                    disabled={markAsResolvedMutation.isPending}
                                                    activeOpacity={0.85}
                                                >
                                                    <Text style={styles.resolveButtonText}>Resolve</Text>
                                                </TouchableOpacity>
                                            ) : (
                                                <View style={styles.resolvedBadge}>
                                                    <CheckCircle size={13} color={COLORS.success} />
                                                    <Text style={styles.resolvedText}>Resolved</Text>
                                                </View>
                                            )}
                                        </View>
                                    </View>
                                )
                            })
                        )}
                    </View>
                )}

                {/* compliance tab */}
                {currentTab === 'compliance' && (
                    <View style={styles.tabContent}>
                        <Text style={styles.sectionTitle}>Regulatory Compliance</Text>
                        {Object.entries(COUNTRY_COMPLIANCE_CONFIGS).map(([countryCode, config]) => (
                            <View key={countryCode} style={styles.card}>
                                <View style={styles.complianceHeader}>
                                    <View style={styles.countryBadge}>
                                        <Text style={styles.countryCode}>{countryCode}</Text>
                                    </View>
                                    <View>
                                        <Text style={styles.countryName}>{config.country_name}</Text>
                                        <Text style={styles.taxLabel}>{config.tax_name}</Text>
                                    </View>
                                </View>
                                <View style={styles.divider} />
                                <View style={styles.complianceRow}>
                                    <Text style={styles.complianceLabel}>Currency</Text>
                                    <Text style={styles.complianceValue}>{config.currency}</Text>
                                </View>
                                <View style={styles.complianceRow}>
                                    <Text style={styles.complianceLabel}>Retention</Text>
                                    <Text style={styles.complianceValue}>{config.retention_period_days} days</Text>
                                </View>
                                <View style={styles.complianceRow}>
                                    <Text style={styles.complianceLabel}>Reporting</Text>
                                    <Text style={styles.complianceValue}>{config.submission_frequency}</Text>
                                </View>
                                <View style={styles.complianceRow}>
                                    <Text style={styles.complianceLabel}>Digital Signature</Text>
                                    <Text style={[
                                        styles.complianceValue,
                                        { color: config.digital_signature_required ? COLORS.success : COLORS.textMuted }
                                    ]}>
                                        {config.digital_signature_required ? 'Required' : 'Optional'}
                                    </Text>
                                </View>
                                <View style={styles.complianceRow}>
                                    <Text style={styles.complianceLabel}>Audit Trail</Text>
                                    <Text style={[
                                        styles.complianceValue,
                                        { color: config.audit_trail_required ? COLORS.success : COLORS.textMuted }
                                    ]}>
                                        {config.audit_trail_required ? 'Required' : 'Optional'}
                                    </Text>
                                </View>
                            </View>
                        ))}
                    </View>
                )}

                {/* config tab */}
                {currentTab === 'config' && (
                    <View style={styles.tabContent}>
                        <Text style={styles.sectionTitle}>Security Configuration</Text>

                        {configData && (
                            <View style={styles.card}>
                                {[
                                    {
                                        label: 'Chain Validation',
                                        subtitle: 'Enable chain integrity validation',
                                        configKey: 'enable_chain_validation' as keyof SecurityConfig,
                                    },
                                    {
                                        label: 'Temporal Validation',
                                        subtitle: 'Enable temporal consistency checks',
                                        configKey: 'enable_time_validation' as keyof SecurityConfig,
                                    },
                                    {
                                        label: 'Anomaly Detection',
                                        subtitle: 'Enable automatic anomaly detection',
                                        configKey: 'enable_anomaly_detection' as keyof SecurityConfig,
                                    },
                                    {
                                        label: 'Real-time Monitoring',
                                        subtitle: 'Enable continuous monitoring',
                                        configKey: 'enable_real_time_monitoring' as keyof SecurityConfig,
                                    },
                                ].map(({ label, subtitle, configKey }) => (
                                    <View key={configKey} style={styles.configRow}>
                                        <View style={styles.configInfo}>
                                            <Text style={styles.configLabel}>{label}</Text>
                                            <Text style={styles.configSubtitle}>{subtitle}</Text>
                                        </View>
                                        <Switch
                                            value={configData[configKey] as boolean}
                                            onValueChange={(newValue) =>
                                                updateConfigMutation.mutate({ ...configData, [configKey]: newValue })
                                            }
                                            trackColor={{ false: COLORS.border, true: COLORS.brand }}
                                            thumbColor={COLORS.surface}
                                        />
                                    </View>
                                ))}

                                <View style={styles.divider} />

                                <View style={styles.inputGroup}>
                                    <Text style={styles.configLabel}>Max Time Drift (seconds)</Text>
                                    <TextInput
                                        style={styles.configInput}
                                        value={String(configData.max_time_drift)}
                                        onChangeText={(text) =>
                                            updateConfigMutation.mutate({
                                                ...configData,
                                                max_time_drift: parseInt(text) || 0,
                                            })
                                        }
                                        keyboardType="numeric"
                                        placeholderTextColor={COLORS.textMuted}
                                    />
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={styles.configLabel}>Suspicious Amount Threshold (NPR)</Text>
                                    <TextInput
                                        style={styles.configInput}
                                        value={String(configData.suspicious_amount_threshold)}
                                        onChangeText={(text) =>
                                            updateConfigMutation.mutate({
                                                ...configData,
                                                suspicious_amount_threshold: parseFloat(text) || 0,
                                            })
                                        }
                                        keyboardType="numeric"
                                        placeholderTextColor={COLORS.textMuted}
                                    />
                                </View>
                            </View>
                        )}
                    </View>
                )}
            </ScrollView>
        </View>
    )
}

// metric card component
function MetricCard({
    label,
    value,
    icon,
    valueColor,
}: {
    label: string
    value: number | string
    icon: React.ReactNode
    valueColor?: string
}) {
    return (
        <View style={styles.metricCard}>
            <View style={styles.metricIconWrap}>{icon}</View>
            <Text style={[styles.metricValue, valueColor ? { color: valueColor } : {}]}>
                {value}
            </Text>
            <Text style={styles.metricLabel}>{label}</Text>
        </View>
    )
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    
    // loading screen
    loadingScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background, padding: 24 },
    loadingCard: {
        backgroundColor: COLORS.surface,
        borderRadius: 20,
        padding: 32,
        alignItems: 'center',
        width: '80%',
        borderWidth: 1,
        borderColor: COLORS.border,
        shadowColor: COLORS.brand,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 6,
    },
    loadingIconWrap: {
        width: 56,
        height: 56,
        borderRadius: 16,
        backgroundColor: COLORS.brandLight,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: COLORS.brandBorder,
    },
    loadingTitle: { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary, marginTop: 12 },
    loadingText: { fontSize: 13, color: COLORS.textMuted, marginTop: 4 },

    // header
    header: {
        backgroundColor: COLORS.headerBg,
        paddingTop: 52,
        paddingHorizontal: 16,
        paddingBottom: 0,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 4,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    brandSection: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    logoBadge: {
        width: 42,
        height: 42,
        borderRadius: 13,
        backgroundColor: COLORS.brand,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: COLORS.brand,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 3,
    },
    brandName: { fontSize: 17, fontWeight: '800', color: COLORS.textPrimary, letterSpacing: 0.2 },
    brandSub: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '500' },
    exportButtons: { flexDirection: 'row', gap: 8 },
    exportBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 7,
        borderRadius: 20,
        shadowColor: COLORS.brand,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 2,
    },
    exportBtnText: { color: COLORS.surface, fontSize: 12, fontWeight: '700' },

    // tabs
    tabsScroll: { marginTop: 2 },
    tabsRow: { flexDirection: 'row', gap: 2, paddingBottom: 0 },
    tab: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 16,
        paddingVertical: 11,
        borderBottomWidth: 2.5,
        borderBottomColor: 'transparent',
    },
    tabActive: { borderBottomColor: COLORS.brand },
    tabText: { fontSize: 13, fontWeight: '500', color: COLORS.textMuted },
    tabTextActive: { color: COLORS.brand, fontWeight: '700' },

    // content
    contentScroll: { flex: 1 },
    contentInner: { padding: 16, paddingBottom: 40 },
    tabContent: { gap: 14 },

    // cards
    card: {
        backgroundColor: COLORS.surface,
        borderRadius: 14,
        padding: 16,
        borderWidth: 1,
        borderColor: COLORS.cardBorder,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
    },
    cardTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 12, letterSpacing: 0.2 },

    // metrics grid
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    metricCard: {
        backgroundColor: COLORS.surface,
        borderRadius: 14,
        padding: 14,
        width: '47%',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.cardBorder,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
    },
    metricIconWrap: {
        width: 46,
        height: 46,
        borderRadius: 12,
        backgroundColor: COLORS.goldLight,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
        borderWidth: 1.5,
        borderColor: COLORS.goldBorder,
    },
    metricValue: { fontSize: 24, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 2 },
    metricLabel: { fontSize: 12, color: COLORS.textMuted, fontWeight: '500' },

    // integrity section
    integrityRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },
    integrityLabel: { fontSize: 14, color: COLORS.textPrimary, fontWeight: '500' },
    integrityStatus: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    integrityText: { fontSize: 13, fontWeight: '700' },
    divider: { height: 1, backgroundColor: COLORS.divider, marginVertical: 10 },

    // recent activity
    activityItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.divider,
    },
    activityContent: { flex: 1 },
    activityTitle: { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 2 },
    activityTime: { fontSize: 11, color: COLORS.textMuted },
    emptyText: { fontSize: 13, color: COLORS.textMuted, textAlign: 'center', paddingVertical: 16 },

    // section header
    sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, letterSpacing: 0.3 },
    refreshButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: COLORS.brand,
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 20,
        shadowColor: COLORS.brand,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 2,
    },
    refreshButtonText: { color: COLORS.surface, fontSize: 12, fontWeight: '700' },

    // loader and empty states
    centerLoader: { paddingVertical: 48, alignItems: 'center' },
    emptyState: { alignItems: 'center', paddingVertical: 48, gap: 10 },
    emptyIconWrap: {
        width: 72,
        height: 72,
        borderRadius: 20,
        backgroundColor: COLORS.successLight,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: COLORS.successBorder,
    },
    emptyStateTitle: { fontSize: 17, fontWeight: '800', color: COLORS.textPrimary },
    emptyStateText: { fontSize: 13, color: COLORS.textMuted },

    // anomaly cards
    anomalyHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
    anomalyBadges: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    severityBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    severityText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
    anomalyTimestamp: { fontSize: 11, color: COLORS.textMuted },
    anomalyDescription: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 4 },
    anomalyType: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 10 },
    recommendationsBox: {
        backgroundColor: COLORS.warningLight,
        borderRadius: 10,
        padding: 12,
        marginBottom: 12,
        borderLeftWidth: 3,
        borderLeftColor: COLORS.gold,
    },
    recommendationsTitle: { fontSize: 12, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 6 },
    recommendationItem: { fontSize: 12, color: COLORS.textSecondary, lineHeight: 18, marginBottom: 2 },
    anomalyActions: { alignItems: 'flex-end' },
    resolveButton: {
        backgroundColor: COLORS.success,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        shadowColor: COLORS.success,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 2,
    },
    resolveButtonText: { color: COLORS.surface, fontSize: 13, fontWeight: '700' },
    disabledButton: { opacity: 0.5 },
    resolvedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: COLORS.successLight,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: COLORS.successBorder,
    },
    resolvedText: { fontSize: 12, color: COLORS.success, fontWeight: '700' },

    // compliance section
    complianceHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
    countryBadge: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: COLORS.goldLight,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: COLORS.goldBorder,
    },
    countryCode: { fontSize: 13, fontWeight: '800', color: COLORS.brand },
    countryName: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 2 },
    taxLabel: { fontSize: 12, color: COLORS.textSecondary },
    complianceRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
    complianceLabel: { fontSize: 13, color: COLORS.textSecondary },
    complianceValue: { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary },

    // config section
    configRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.divider,
    },
    configInfo: { flex: 1, paddingRight: 12 },
    configLabel: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 2 },
    configSubtitle: { fontSize: 12, color: COLORS.textSecondary },
    inputGroup: { marginTop: 12, gap: 8 },
    configInput: {
        borderWidth: 1.5,
        borderColor: COLORS.border,
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 10,
        fontSize: 14,
        backgroundColor: COLORS.inputBg,
        color: COLORS.textPrimary,
    },
})