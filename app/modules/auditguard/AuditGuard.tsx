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

// ─── Design Tokens ────────────────────────────────────────────────────────────
const Colors = {
    background: '#FEF1A8',
    card: '#FFFFFF',
    brand: '#C41E1E',
    buttonYellow: '#D4A843',
    buttonText: '#1A1A1A',
    textPrimary: '#1A1A1A',
    textSecondary: '#5C5436',
    border: '#E8D88A',
    activeTab: '#C41E1E',
    inactiveTab: '#9E8E50',
    successGreen: '#2E7D32',
    errorRed: '#C41E1E',
    warningOrange: '#D97706',
    infoBlue: '#1565C0',
    severityLowBg: '#DBEAFE',
    severityLowText: '#1565C0',
    severityMedBg: '#FEF9C3',
    severityMedText: '#92400E',
    severityHighBg: '#FFEDD5',
    severityHighText: '#9A3412',
    severityCritBg: '#FEE2E2',
    severityCritText: '#991B1B',
    resolvedBg: '#F3F4F6',
    resolvedText: '#4B5563',
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function AuditGuard() {
    const [activeTab, setActiveTab] = useState<'overview' | 'anomalies' | 'compliance' | 'config'>('overview')
    const [sessionId] = useState(() => securityService.generateSessionId())
    const queryClient = useQueryClient()

    // ── Queries ──
    const { data: securityStats, isLoading: statsLoading } = useQuery<SecurityStats>({
        queryKey: ['security-stats'],
        queryFn: () => securityService.getSecurityStats(),
        refetchInterval: 30000,
    })

    const { data: anomalies = [], isLoading: anomaliesLoading } = useQuery<Anomaly[]>({
        queryKey: ['anomalies'],
        queryFn: () => securityService.getAnomalies(50),
        refetchInterval: 60000,
    })

    const { data: _unresolvedAnomalies = [] } = useQuery<Anomaly[]>({
        queryKey: ['unresolved-anomalies'],
        queryFn: () => securityService.getUnresolvedAnomalies(),
        refetchInterval: 30000,
    })

    const { data: securityConfig } = useQuery<SecurityConfig | null>({
        queryKey: ['security-config'],
        queryFn: () => securityService.getSecurityConfig(),
    })

    // ── Mutations ──
    const resolveAnomalyMutation = useMutation({
        mutationFn: ({ anomalyId, resolvedBy }: { anomalyId: string; resolvedBy: string }) =>
            securityService.resolveAnomaly(anomalyId, resolvedBy),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['anomalies'] })
            queryClient.invalidateQueries({ queryKey: ['unresolved-anomalies'] })
        },
    })

    const saveConfigMutation = useMutation({
        mutationFn: (config: SecurityConfig) => securityService.saveSecurityConfig(config),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['security-config'] })
        },
    })

    // ── Init security system ──
    useEffect(() => {
        const initSecurity = async () => {
            try {
                await securityService.initSecuritySystem()
                await securityService.createAppClock(sessionId)
            } catch (error) {
                console.error('Error initializing security:', error)
            }
        }
        initSecurity()
    }, [sessionId])

    // ── Real-time monitoring ──
    useEffect(() => {
        if (securityConfig) {
            securityService.startRealTimeMonitoring(sessionId, securityConfig)
        }
    }, [sessionId, securityConfig])

    // ── Security alerts via DeviceEventEmitter ──
    useEffect(() => {
        const subscription = DeviceEventEmitter.addListener('security-alert', (data) => {
            console.log('Security alert received:', data)
        })
        return () => subscription.remove()
    }, [])

    // ── Helpers ──
    const getSeverityStyle = (severity: AnomalySeverity) => {
        switch (severity) {
            case AnomalySeverity.Low:
                return { bg: Colors.severityLowBg, text: Colors.severityLowText }
            case AnomalySeverity.Medium:
                return { bg: Colors.severityMedBg, text: Colors.severityMedText }
            case AnomalySeverity.High:
                return { bg: Colors.severityHighBg, text: Colors.severityHighText }
            case AnomalySeverity.Critical:
                return { bg: Colors.severityCritBg, text: Colors.severityCritText }
            default:
                return { bg: Colors.resolvedBg, text: Colors.resolvedText }
        }
    }

    const getSeverityIcon = (severity: AnomalySeverity) => {
        const colorMap: Record<string, string> = {
            [AnomalySeverity.Low]: Colors.infoBlue,
            [AnomalySeverity.Medium]: Colors.warningOrange,
            [AnomalySeverity.High]: Colors.warningOrange,
            [AnomalySeverity.Critical]: Colors.errorRed,
        }
        const color = colorMap[severity] || Colors.inactiveTab
        switch (severity) {
            case AnomalySeverity.Low: return <Eye size={16} color={color} />
            case AnomalySeverity.Medium: return <AlertTriangle size={16} color={color} />
            case AnomalySeverity.High: return <XCircle size={16} color={color} />
            case AnomalySeverity.Critical: return <Shield size={16} color={color} />
            default: return <Activity size={16} color={color} />
        }
    }

    const handleResolveAnomaly = (anomalyId: string) => {
        resolveAnomalyMutation.mutate({ anomalyId, resolvedBy: 'admin' })
    }

    // ── Export ──
    const handleExportData = async (format: 'json' | 'csv') => {
        try {
            const data = await securityService.exportSecurityData(format)
            const fileName = `security-export-${new Date().toISOString().split('T')[0]}.${format}`
            const fileUri = FileSystem.cacheDirectory + fileName
            await FileSystem.writeAsStringAsync(fileUri, data, {
                encoding: FileSystem.EncodingType.UTF8,
            })
            const canShare = await Sharing.isAvailableAsync()
            if (canShare) {
                await Sharing.shareAsync(fileUri, {
                    mimeType: format === 'json' ? 'application/json' : 'text/csv',
                    dialogTitle: `Export ${format.toUpperCase()}`,
                })
            } else {
                Alert.alert('Export saved', `File saved to: ${fileUri}`)
            }
        } catch (error) {
            console.error('Error exporting data:', error)
            Alert.alert('Export Failed', 'Could not export security data.')
        }
    }

    // ── Loading state ──
    if (statsLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.brand} />
            </View>
        )
    }

    // ── Tab definitions ──
    const tabs = [
        { id: 'overview', name: 'Overview', icon: Activity },
        { id: 'anomalies', name: 'Anomalies', icon: AlertTriangle },
        { id: 'compliance', name: 'Compliance', icon: FileText },
        { id: 'config', name: 'Config', icon: Settings },
    ]

    return (
        <View style={styles.root}>

            {/* ── Header ── */}
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <View style={styles.headerTitle}>
                        <View style={styles.shieldBadge}>
                            <Shield size={20} color={Colors.card} />
                        </View>
                        <View>
                            <Text style={styles.headerTitleText}>AuditGuard</Text>
                            <Text style={styles.headerSubtitle}>Security & compliance</Text>
                        </View>
                    </View>

                    <View style={styles.exportRow}>
                        <TouchableOpacity
                            style={[styles.exportBtn, { backgroundColor: Colors.brand }]}
                            onPress={() => handleExportData('json')}
                        >
                            <Download size={14} color={Colors.card} />
                            <Text style={styles.exportBtnText}>JSON</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.exportBtn, { backgroundColor: Colors.successGreen }]}
                            onPress={() => handleExportData('csv')}
                        >
                            <Download size={14} color={Colors.card} />
                            <Text style={styles.exportBtnText}>CSV</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* ── Tabs ── */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll}>
                    <View style={styles.tabsRow}>
                        {tabs.map((tab) => {
                            const Icon = tab.icon
                            const isActive = activeTab === tab.id
                            return (
                                <TouchableOpacity
                                    key={tab.id}
                                    style={[styles.tab, isActive && styles.tabActive]}
                                    onPress={() => setActiveTab(tab.id as any)}
                                >
                                    <Icon
                                        size={15}
                                        color={isActive ? Colors.activeTab : Colors.inactiveTab}
                                    />
                                    <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                                        {tab.name}
                                    </Text>
                                </TouchableOpacity>
                            )
                        })}
                    </View>
                </ScrollView>
            </View>

            {/* ── Content ── */}
            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.contentInner}
                showsVerticalScrollIndicator={false}
            >

                {/* ══════════ OVERVIEW TAB ══════════ */}
                {activeTab === 'overview' && (
                    <View style={styles.tabContent}>

                        {/* Stat Cards */}
                        <View style={styles.statsGrid}>
                            <StatCard
                                label="Secure Logs"
                                value={securityStats?.total_secure_logs || 0}
                                icon={<FileText size={24} color={Colors.infoBlue} />}
                            />
                            <StatCard
                                label="Total Anomalies"
                                value={securityStats?.total_anomalies || 0}
                                icon={<AlertTriangle size={24} color={Colors.warningOrange} />}
                            />
                            <StatCard
                                label="Unresolved"
                                value={securityStats?.unresolved_anomalies || 0}
                                icon={<XCircle size={24} color={Colors.errorRed} />}
                                valueColor={Colors.errorRed}
                            />
                            <StatCard
                                label="Uptime"
                                value={`${Math.floor((securityStats?.system_uptime || 0) / (1000 * 60 * 60))}h`}
                                icon={<Clock size={24} color={Colors.successGreen} />}
                            />
                        </View>

                        {/* System Integrity */}
                        <View style={styles.card}>
                            <Text style={styles.cardTitle}>System Integrity</Text>

                            <View style={styles.integrityRow}>
                                <Text style={styles.integrityLabel}>Transaction Chain</Text>
                                <View style={styles.integrityStatus}>
                                    {securityStats?.chain_integrity
                                        ? <CheckCircle size={18} color={Colors.successGreen} />
                                        : <XCircle size={18} color={Colors.errorRed} />}
                                    <Text style={[
                                        styles.integrityText,
                                        { color: securityStats?.chain_integrity ? Colors.successGreen : Colors.errorRed }
                                    ]}>
                                        {securityStats?.chain_integrity ? 'Integral' : 'Compromised'}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.divider} />

                            <View style={styles.integrityRow}>
                                <Text style={styles.integrityLabel}>Temporal Consistency</Text>
                                <View style={styles.integrityStatus}>
                                    {securityStats?.time_consistency
                                        ? <CheckCircle size={18} color={Colors.successGreen} />
                                        : <XCircle size={18} color={Colors.errorRed} />}
                                    <Text style={[
                                        styles.integrityText,
                                        { color: securityStats?.time_consistency ? Colors.successGreen : Colors.errorRed }
                                    ]}>
                                        {securityStats?.time_consistency ? 'Consistent' : 'Anomalous'}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* Recent Activity */}
                        <View style={styles.card}>
                            <Text style={styles.cardTitle}>Recent Activity</Text>
                            {anomalies.slice(0, 5).map((anomaly) => (
                                <View key={anomaly.id} style={styles.recentItem}>
                                    {getSeverityIcon(anomaly.severity)}
                                    <View style={styles.recentItemText}>
                                        <Text style={styles.recentItemTitle} numberOfLines={1}>
                                            {anomaly.description}
                                        </Text>
                                        <Text style={styles.recentItemTime}>
                                            {new Date(anomaly.timestamp).toLocaleString('en-US')}
                                        </Text>
                                    </View>
                                </View>
                            ))}
                            {anomalies.length === 0 && (
                                <Text style={styles.emptyText}>No recent activity</Text>
                            )}
                        </View>
                    </View>
                )}

                {/* ══════════ ANOMALIES TAB ══════════ */}
                {activeTab === 'anomalies' && (
                    <View style={styles.tabContent}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Detected Anomalies</Text>
                            <TouchableOpacity
                                style={styles.refreshBtn}
                                onPress={() => queryClient.invalidateQueries({ queryKey: ['anomalies'] })}
                            >
                                <RefreshCw size={15} color={Colors.card} />
                                <Text style={styles.refreshBtnText}>Refresh</Text>
                            </TouchableOpacity>
                        </View>

                        {anomaliesLoading ? (
                            <View style={styles.centerLoader}>
                                <ActivityIndicator size="large" color={Colors.brand} />
                            </View>
                        ) : anomalies.length === 0 ? (
                            <View style={styles.emptyState}>
                                <CheckCircle size={48} color={Colors.successGreen} />
                                <Text style={styles.emptyStateTitle}>No Anomalies</Text>
                                <Text style={styles.emptyStateSubtitle}>System is operating normally</Text>
                            </View>
                        ) : (
                            anomalies.map((anomaly) => {
                                const sev = getSeverityStyle(anomaly.severity)
                                return (
                                    <View key={anomaly.id} style={styles.card}>

                                        {/* ✅ FIX 1: icon+badge grouped left, time pushed right */}
                                        <View style={styles.anomalyBadgeRow}>
                                            <View style={styles.anomalyBadgeLeft}>
                                                {getSeverityIcon(anomaly.severity)}
                                                <View style={[styles.severityBadge, { backgroundColor: sev.bg }]}>
                                                    <Text style={[styles.severityBadgeText, { color: sev.text }]}>
                                                        {anomaly.severity}
                                                    </Text>
                                                </View>
                                            </View>
                                            <Text style={styles.anomalyTime}>
                                                {new Date(anomaly.timestamp).toLocaleString('en-US')}
                                            </Text>
                                        </View>

                                        {/* Description */}
                                        <Text style={styles.anomalyDescription}>{anomaly.description}</Text>
                                        <Text style={styles.anomalyType}>
                                            <Text style={{ fontWeight: '600' }}>Type: </Text>
                                            {anomaly.anomaly_type}
                                        </Text>

                                        {/* Recommendations */}
                                        {anomaly.recommendations.length > 0 && (
                                            <View style={styles.recommendationsBox}>
                                                <Text style={styles.recommendationsTitle}>Recommendations:</Text>
                                                {anomaly.recommendations.map((rec, i) => (
                                                    <Text key={i} style={styles.recommendationItem}>
                                                        • {rec}
                                                    </Text>
                                                ))}
                                            </View>
                                        )}

                                        {/* Action */}
                                        <View style={styles.anomalyAction}>
                                            {!anomaly.resolved ? (
                                                <TouchableOpacity
                                                    style={[
                                                        styles.resolveBtn,
                                                        resolveAnomalyMutation.isPending && styles.disabledBtn,
                                                    ]}
                                                    onPress={() => handleResolveAnomaly(anomaly.id)}
                                                    disabled={resolveAnomalyMutation.isPending}
                                                >
                                                    <Text style={styles.resolveBtnText}>Resolve</Text>
                                                </TouchableOpacity>
                                            ) : (
                                                <View style={styles.resolvedTag}>
                                                    <CheckCircle size={13} color={Colors.successGreen} />
                                                    <Text style={styles.resolvedTagText}>Resolved</Text>
                                                </View>
                                            )}
                                        </View>
                                    </View>
                                )
                            })
                        )}
                    </View>
                )}

                {/* ══════════ COMPLIANCE TAB ══════════ */}
                {activeTab === 'compliance' && (
                    <View style={styles.tabContent}>
                        <Text style={styles.sectionTitle}>Regulatory Compliance</Text>
                        {Object.entries(COUNTRY_COMPLIANCE_CONFIGS).map(([code, config]) => (
                            <View key={code} style={styles.card}>
                                <View style={styles.complianceCardHeader}>
                                    <View style={styles.countryCodeBadge}>
                                        <Text style={styles.countryCodeText}>{code}</Text>
                                    </View>
                                    <View>
                                        <Text style={styles.countryName}>{config.country_name}</Text>
                                        <Text style={styles.taxName}>{config.tax_name}</Text>
                                    </View>
                                </View>
                                <View style={styles.divider} />
                                <View style={styles.complianceRow}>
                                    <Text style={styles.complianceKey}>Currency</Text>
                                    <Text style={styles.complianceValue}>{config.currency}</Text>
                                </View>
                                <View style={styles.complianceRow}>
                                    <Text style={styles.complianceKey}>Retention</Text>
                                    <Text style={styles.complianceValue}>{config.retention_period_days} days</Text>
                                </View>
                                <View style={styles.complianceRow}>
                                    <Text style={styles.complianceKey}>Reporting</Text>
                                    <Text style={styles.complianceValue}>{config.submission_frequency}</Text>
                                </View>
                                <View style={styles.complianceRow}>
                                    <Text style={styles.complianceKey}>Signature</Text>
                                    <Text style={[
                                        styles.complianceValue,
                                        { color: config.digital_signature_required ? Colors.successGreen : Colors.inactiveTab }
                                    ]}>
                                        {config.digital_signature_required ? 'Required' : 'Optional'}
                                    </Text>
                                </View>
                                <View style={styles.complianceRow}>
                                    <Text style={styles.complianceKey}>Audit Trail</Text>
                                    <Text style={[
                                        styles.complianceValue,
                                        { color: config.audit_trail_required ? Colors.successGreen : Colors.inactiveTab }
                                    ]}>
                                        {config.audit_trail_required ? 'Required' : 'Optional'}
                                    </Text>
                                </View>
                            </View>
                        ))}
                    </View>
                )}

                {/* ══════════ CONFIG TAB ══════════ */}
                {activeTab === 'config' && (
                    <View style={styles.tabContent}>
                        <Text style={styles.sectionTitle}>Security Configuration</Text>

                        {securityConfig && (
                            <View style={styles.card}>

                                {/* Toggle rows */}
                                {[
                                    {
                                        label: 'Chain Validation',
                                        sub: 'Enable chain integrity validation',
                                        key: 'enable_chain_validation' as keyof SecurityConfig,
                                    },
                                    {
                                        label: 'Temporal Validation',
                                        sub: 'Enable temporal consistency checks',
                                        key: 'enable_time_validation' as keyof SecurityConfig,
                                    },
                                    {
                                        label: 'Anomaly Detection',
                                        sub: 'Enable automatic anomaly detection',
                                        key: 'enable_anomaly_detection' as keyof SecurityConfig,
                                    },
                                    {
                                        label: 'Real-time Monitoring',
                                        sub: 'Enable continuous monitoring',
                                        key: 'enable_real_time_monitoring' as keyof SecurityConfig,
                                    },
                                ].map(({ label, sub, key }) => (
                                    <View key={key} style={styles.configToggleRow}>
                                        <View style={styles.configToggleText}>
                                            <Text style={styles.configLabel}>{label}</Text>
                                            <Text style={styles.configSub}>{sub}</Text>
                                        </View>
                                        <Switch
                                            value={securityConfig[key] as boolean}
                                            onValueChange={(val) =>
                                                saveConfigMutation.mutate({ ...securityConfig, [key]: val })
                                            }
                                            trackColor={{ false: Colors.border, true: Colors.brand }}
                                            thumbColor={Colors.card}
                                        />
                                    </View>
                                ))}

                                <View style={styles.divider} />

                                {/* ✅ FIX 2: color inside style object, wrapped in View with label */}
                                <View style={styles.configInputGroup}>
                                    <Text style={styles.configLabel}>Max Time Drift (seconds)</Text>
                                    <TextInput
                                        style={styles.configInput}
                                        value={String(securityConfig.max_time_drift)}
                                        onChangeText={(val) =>
                                            saveConfigMutation.mutate({
                                                ...securityConfig,
                                                max_time_drift: parseInt(val) || 0,
                                            })
                                        }
                                        keyboardType="numeric"
                                        placeholderTextColor={Colors.inactiveTab}
                                    />
                                </View>

                                <View style={styles.configInputGroup}>
                                    <Text style={styles.configLabel}>Suspicious Amount Threshold (NPR)</Text>
                                    <TextInput
                                        style={styles.configInput}
                                        value={String(securityConfig.suspicious_amount_threshold)}
                                        onChangeText={(val) =>
                                            saveConfigMutation.mutate({
                                                ...securityConfig,
                                                suspicious_amount_threshold: parseFloat(val) || 0,
                                            })
                                        }
                                        keyboardType="numeric"
                                        placeholderTextColor={Colors.inactiveTab}
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

// ─── StatCard Sub-component ───────────────────────────────────────────────────
function StatCard({
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
        <View style={styles.statCard}>
            <View style={styles.statCardTop}>
                <View style={styles.statCardIcon}>{icon}</View>
            </View>
            <Text style={[styles.statCardValue, valueColor ? { color: valueColor } : {}]}>
                {value}
            </Text>
            <Text style={styles.statCardLabel}>{label}</Text>
        </View>
    )
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: '#FEF1A8',
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FEF1A8',
    },

    // Header
    header: {
        backgroundColor: '#FFF1C1',
        paddingTop: 52,
        paddingHorizontal: 16,
        paddingBottom: 0,
        borderBottomWidth: 1,
        borderBottomColor: '#E8D88A',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 3,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 14,
    },
    headerTitle: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    shieldBadge: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#C41E1E',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitleText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1A1A1A',
        fontFamily: 'Inter',
    },
    headerSubtitle: {
        fontSize: 12,
        color: '#5C5436',
        fontFamily: 'Inter',
    },
    exportRow: {
        flexDirection: 'row',
        gap: 8,
    },
    exportBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 7,
        borderRadius: 20,
    },
    exportBtnText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '600',
        fontFamily: 'Inter',
    },

    // Tabs
    tabsScroll: {
        marginTop: 4,
    },
    tabsRow: {
        flexDirection: 'row',
        gap: 4,
        paddingBottom: 0,
    },
    tab: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    tabActive: {
        borderBottomColor: '#C41E1E',
    },
    tabText: {
        fontSize: 13,
        fontWeight: '500',
        color: '#9E8E50',
        fontFamily: 'Inter',
    },
    tabTextActive: {
        color: '#C41E1E',
        fontWeight: '600',
    },

    // Content
    content: {
        flex: 1,
    },
    contentInner: {
        padding: 16,
        paddingBottom: 32,
    },
    tabContent: {
        gap: 14,
    },

    // Cards
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.07,
        shadowRadius: 4,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#F0E88A',
    },
    cardTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1A1A1A',
        marginBottom: 12,
        fontFamily: 'Inter',
    },

    // Stat cards
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    statCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 14,
        width: '47%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.07,
        shadowRadius: 4,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#F0E88A',
    },
    statCardTop: {
        marginBottom: 8,
    },
    statCardIcon: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: '#FEF1A8',
        alignItems: 'center',
        justifyContent: 'center',
    },
    statCardValue: {
        fontSize: 26,
        fontWeight: '800',
        color: '#1A1A1A',
        fontFamily: 'Inter',
    },
    statCardLabel: {
        fontSize: 12,
        color: '#5C5436',
        marginTop: 2,
        fontFamily: 'Inter',
    },

    // Integrity
    integrityRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 6,
    },
    integrityLabel: {
        fontSize: 14,
        color: '#1A1A1A',
        fontFamily: 'Inter',
    },
    integrityStatus: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    integrityText: {
        fontSize: 13,
        fontWeight: '600',
        fontFamily: 'Inter',
    },
    divider: {
        height: 1,
        backgroundColor: '#F0E88A',
        marginVertical: 8,
    },

    // Recent activity
    recentItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
        paddingVertical: 7,
        borderBottomWidth: 1,
        borderBottomColor: '#FEF1A8',
    },
    recentItemText: {
        flex: 1,
    },
    recentItemTitle: {
        fontSize: 13,
        fontWeight: '500',
        color: '#1A1A1A',
        fontFamily: 'Inter',
    },
    recentItemTime: {
        fontSize: 11,
        color: '#9E8E50',
        marginTop: 1,
        fontFamily: 'Inter',
    },
    emptyText: {
        fontSize: 13,
        color: '#9E8E50',
        textAlign: 'center',
        paddingVertical: 12,
        fontFamily: 'Inter',
    },

    // Section header
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1A1A1A',
        fontFamily: 'Inter',
    },
    refreshBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: '#C41E1E',
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 20,
    },
    refreshBtnText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '600',
        fontFamily: 'Inter',
    },

    // Loaders / empty
    centerLoader: {
        paddingVertical: 48,
        alignItems: 'center',
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 48,
        gap: 8,
    },
    emptyStateTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#1A1A1A',
        fontFamily: 'Inter',
    },
    emptyStateSubtitle: {
        fontSize: 13,
        color: '#5C5436',
        fontFamily: 'Inter',
    },

    // ✅ FIX 1: anomalyBadgeRow uses justifyContent instead of marginLeft: 'auto'
    anomalyBadgeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    anomalyBadgeLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    severityBadge: {
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 20,
    },
    severityBadgeText: {
        fontSize: 11,
        fontWeight: '600',
        textTransform: 'capitalize',
        fontFamily: 'Inter',
    },
    anomalyTime: {
        fontSize: 11,
        color: '#9E8E50',
        fontFamily: 'Inter',
    },
    anomalyDescription: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1A1A1A',
        marginBottom: 4,
        fontFamily: 'Inter',
    },
    anomalyType: {
        fontSize: 13,
        color: '#5C5436',
        marginBottom: 10,
        fontFamily: 'Inter',
    },
    recommendationsBox: {
        backgroundColor: '#FFFDE7',
        borderRadius: 10,
        padding: 10,
        marginBottom: 10,
        borderLeftWidth: 3,
        borderLeftColor: '#D4A843',
    },
    recommendationsTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: '#1A1A1A',
        marginBottom: 4,
        fontFamily: 'Inter',
    },
    recommendationItem: {
        fontSize: 12,
        color: '#5C5436',
        lineHeight: 18,
        fontFamily: 'Inter',
    },
    anomalyAction: {
        alignItems: 'flex-end',
    },
    resolveBtn: {
        backgroundColor: '#2E7D32',
        paddingHorizontal: 16,
        paddingVertical: 7,
        borderRadius: 20,
    },
    resolveBtnText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '600',
        fontFamily: 'Inter',
    },
    disabledBtn: {
        opacity: 0.5,
    },
    resolvedTag: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#F0FFF4',
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#BBF7D0',
    },
    resolvedTagText: {
        fontSize: 12,
        color: '#2E7D32',
        fontWeight: '600',
        fontFamily: 'Inter',
    },

    // Compliance
    complianceCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 12,
    },
    countryCodeBadge: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#FEF1A8',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: '#D4A843',
    },
    countryCodeText: {
        fontSize: 13,
        fontWeight: '800',
        color: '#C41E1E',
        fontFamily: 'Inter',
    },
    countryName: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1A1A1A',
        fontFamily: 'Inter',
    },
    taxName: {
        fontSize: 12,
        color: '#5C5436',
        fontFamily: 'Inter',
    },
    complianceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 5,
    },
    complianceKey: {
        fontSize: 13,
        color: '#5C5436',
        fontFamily: 'Inter',
    },
    complianceValue: {
        fontSize: 13,
        fontWeight: '600',
        color: '#1A1A1A',
        fontFamily: 'Inter',
    },

    // Config
    configToggleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#FEF1A8',
    },
    configToggleText: {
        flex: 1,
        paddingRight: 12,
    },
    configLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1A1A1A',
        fontFamily: 'Inter',
    },
    configSub: {
        fontSize: 12,
        color: '#5C5436',
        marginTop: 1,
        fontFamily: 'Inter',
    },
    configInputGroup: {
        marginTop: 12,
        gap: 6,
    },
    // ✅ FIX 2: color is now inside the style object where it belongs
    configInput: {
        borderWidth: 1.5,
        borderColor: '#E8D88A',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 10,
        fontSize: 14,
        backgroundColor: '#FFFDE7',
        fontFamily: 'Inter',
        color: '#1A1A1A',
    },
})
