import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import * as FileSystem from 'expo-file-system';



import * as Sharing from 'expo-sharing';

import { securityService } from '../../shared/services/securityService'; // Fixed import
import {
    Anomaly,
    AnomalySeverity,
    COUNTRY_COMPLIANCE_CONFIGS,
    SecurityConfig,
    SecurityStats,
} from '../../shared/types/security';

type TabType = 'overview' | 'anomalies' | 'compliance' | 'config'; // Added type

export default function AuditGuard() {
    const [activeTab, setActiveTab] = useState<TabType>('overview');
    const [sessionId] = useState(() => securityService.generateSessionId());
    const queryClient = useQueryClient();

    // Queries
    const { data: securityStats, isLoading: statsLoading } = useQuery<SecurityStats>({
        queryKey: ['security-stats'],
        queryFn: () => securityService.getSecurityStats(),
        refetchInterval: 30000,
    });

    const { data: anomalies = [], isLoading: anomaliesLoading } = useQuery<Anomaly[]>({
        queryKey: ['anomalies'],
        queryFn: () => securityService.getAnomalies(50),
        refetchInterval: 60000,
    });

    const { data: securityConfig } = useQuery<SecurityConfig | null>({
        queryKey: ['security-config'],
        queryFn: () => securityService.getSecurityConfig(),
    });

    // Mutations
    const resolveAnomalyMutation = useMutation({
        mutationFn: ({ anomalyId, resolvedBy }: { anomalyId: string; resolvedBy: string }) =>
            securityService.resolveAnomaly(anomalyId, resolvedBy),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['anomalies'] });
        },
    });

    const saveConfigMutation = useMutation({
        mutationFn: (config: SecurityConfig) => securityService.saveSecurityConfig(config),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['security-config'] });
            Alert.alert('Success', 'Configuration saved successfully');
        },
    });

    // Security system initialization
    useEffect(() => {
        const initSecurity = async () => {
            try {
                await securityService.initSecuritySystem();
                await securityService.createAppClock(sessionId);
            } catch (error) {
                console.error('Error initializing security:', error);
                Alert.alert('Error', 'Failed to initialize security system');
            }
        };
        initSecurity();
    }, [sessionId]);

    // Real-time monitoring
    useEffect(() => {
        if (securityConfig) {
            securityService.startRealTimeMonitoring(sessionId, securityConfig);
        }
    }, [sessionId, securityConfig]);

    const getSeverityColor = (severity: AnomalySeverity) => {
        switch (severity) {
            case AnomalySeverity.Low:
                return 'bg-blue-100';
            case AnomalySeverity.Medium:
                return 'bg-yellow-100';
            case AnomalySeverity.High:
                return 'bg-orange-100';
            case AnomalySeverity.Critical:
                return 'bg-red-100';
            default:
                return 'bg-gray-100';
        }
    };

    const getSeverityTextColor = (severity: AnomalySeverity) => {
        switch (severity) {
            case AnomalySeverity.Low:
                return 'text-blue-600';
            case AnomalySeverity.Medium:
                return 'text-yellow-600';
            case AnomalySeverity.High:
                return 'text-orange-600';
            case AnomalySeverity.Critical:
                return 'text-red-600';
            default:
                return 'text-gray-600';
        }
    };

    const getSeverityIcon = (severity: AnomalySeverity) => {
        const iconProps = { size: 16 };
        switch (severity) {
            case AnomalySeverity.Low:
                return <Eye {...iconProps} color="#2563EB" />;
            case AnomalySeverity.Medium:
                return <AlertTriangle {...iconProps} color="#D97706" />;
            case AnomalySeverity.High:
                return <XCircle {...iconProps} color="#EA580C" />;
            case AnomalySeverity.Critical:
                return <Shield {...iconProps} color="#DC2626" />;
            default:
                return <Activity {...iconProps} color="#6B7280" />;
        }
    };

    const handleResolveAnomaly = (anomalyId: string) => {
        Alert.alert(
            'Resolve Anomaly',
            'Are you sure you want to mark this anomaly as resolved?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Resolve',
                    onPress: () => {
                        resolveAnomalyMutation.mutate({
                            anomalyId,
                            resolvedBy: 'admin',
                        });
                    },
                },
            ]
        );
    };

    
try {
        const data = await securityService.exportSecurityData(format);
        const fileName = `security-export-${new Date().toISOString().split('T')[0]}.${format}`;

        if (!FileSystem.cacheDirectory) {
            Alert.alert('Error', 'Cache directory not available');
            return;
        }

        const fileUri = `${FileSystem.cacheDirectory}${fileName}`;

        await FileSystem.writeAsStringAsync(fileUri, data, {
            encoding: FileSystem.EncodingType.UTF8,
        });

        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
            await Sharing.shareAsync(fileUri, {
                mimeType: format === 'json' ? 'application/json' : 'text/csv',
                dialogTitle: 'Export Security Data',
            });
        } else {
            Alert.alert('Success', 'Data exported successfully');
        }
    } catch (error) {
        console.error('Error exporting data:', error);
        Alert.alert('Export Failed', 'Could not export security data');
    }
};
    if (statsLoading) {
        return (
            <View className="flex-1 items-center justify-center bg-gray-50">
                <ActivityIndicator size="large" color="#2563EB" />
            </View>
        );
    }

    return (
        <View className="flex-1 bg-gray-50">
            {/* Header */}
            <View className="bg-white border-b border-gray-200 px-6 py-4">
                <View className="flex-row items-center justify-between mb-4">
                    <View className="flex-row items-center">
                        <Shield size={24} color="#2563EB" />
                        <View className="ml-3">
                            <Text className="text-xl font-semibold text-gray-900">AuditGuard</Text>
                            <Text className="text-sm text-gray-500">Security monitoring and compliance</Text>
                        </View>
                    </View>

                    <View className="flex-row gap-2">
                        <TouchableOpacity
                            onPress={() => handleExportData('json')}
                            className="flex-row items-center px-3 py-2 bg-blue-600 rounded-lg"
                        >
                            <Download size={16} color="#FFFFFF" />
                            <Text className="text-white ml-2">JSON</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => handleExportData('csv')}
                            className="flex-row items-center px-3 py-2 bg-green-600 rounded-lg"
                        >
                            <Download size={16} color="#FFFFFF" />
                            <Text className="text-white ml-2">CSV</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Tabs */}
                <View className="border-b border-gray-200">
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <View className="flex-row">
                            {[
                                { id: 'overview' as TabType, name: 'Overview', icon: Activity },
                                { id: 'anomalies' as TabType, name: 'Anomalies', icon: AlertTriangle },
                                { id: 'compliance' as TabType, name: 'Compliance', icon: FileText },
                                { id: 'config' as TabType, name: 'Configuration', icon: Settings },
                            ].map((tab) => {
                                const Icon = tab.icon;
                                const isActive = activeTab === tab.id;
                                return (
                                    <TouchableOpacity
                                        key={tab.id}
                                        onPress={() => setActiveTab(tab.id)}
                                        className={`flex-row items-center py-2 px-4 mr-6 border-b-2 ${
                                            isActive ? 'border-blue-500' : 'border-transparent'
                                        }`}
                                    >
                                        <Icon size={16} color={isActive ? '#2563EB' : '#6B7280'} />
                                        <Text
                                            className={`text-sm font-medium ml-2 ${
                                                isActive ? 'text-blue-600' : 'text-gray-500'
                                            }`}
                                        >
                                            {tab.name}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </ScrollView>
                </View>
            </View>

            {/* Content */}
            <ScrollView className="flex-1 p-6">
                {activeTab === 'overview' && (
                    <View className="gap-6">
                        {/* Security Statistics */}
                        <View className="gap-4">
                            <View className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                                <View className="flex-row items-center justify-between">
                                    <View>
                                        <Text className="text-sm font-medium text-gray-600">Secure Logs</Text>
                                        <Text className="text-2xl font-bold text-gray-900">
                                            {securityStats?.total_secure_logs || 0}
                                        </Text>
                                    </View>
                                    <FileText size={32} color="#2563EB" />
                                </View>
                            </View>

                            <View className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                                <View className="flex-row items-center justify-between">
                                    <View>
                                        <Text className="text-sm font-medium text-gray-600">Total Anomalies</Text>
                                        <Text className="text-2xl font-bold text-gray-900">
                                            {securityStats?.total_anomalies || 0}
                                        </Text>
                                    </View>
                                    <AlertTriangle size={32} color="#EA580C" />
                                </View>
                            </View>

                            <View className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                                <View className="flex-row items-center justify-between">
                                    <View>
                                        <Text className="text-sm font-medium text-gray-600">Unresolved Anomalies</Text>
                                        <Text className="text-2xl font-bold text-red-600">
                                            {securityStats?.unresolved_anomalies || 0}
                                        </Text>
                                    </View>
                                    <XCircle size={32} color="#DC2626" />
                                </View>
                            </View>

                            <View className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                                <View className="flex-row items-center justify-between">
                                    <View>
                                        <Text className="text-sm font-medium text-gray-600">System Uptime</Text>
                                        <Text className="text-2xl font-bold text-gray-900">
                                            {Math.floor((securityStats?.system_uptime || 0) / (1000 * 60 * 60))}h
                                        </Text>
                                    </View>
                                    <Clock size={32} color="#16A34A" />
                                </View>
                            </View>
                        </View>

                        {/* System Integrity */}
                        <View className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                            <Text className="text-lg font-semibold text-gray-900 mb-4">System Integrity</Text>
                            <View className="gap-4">
                                <View className="flex-row items-center justify-between">
                                    <Text className="text-sm font-medium text-gray-700">Transaction Chain</Text>
                                    <View className="flex-row items-center gap-2">
                                        {securityStats?.chain_integrity ? (
                                            <CheckCircle size={20} color="#16A34A" />
                                        ) : (
                                            <XCircle size={20} color="#DC2626" />
                                        )}
                                        <Text
                                            className={`text-sm font-medium ${
                                                securityStats?.chain_integrity ? 'text-green-600' : 'text-red-600'
                                            }`}
                                        >
                                            {securityStats?.chain_integrity ? 'Integral' : 'Compromised'}
                                        </Text>
                                    </View>
                                </View>

                                <View className="flex-row items-center justify-between">
                                    <Text className="text-sm font-medium text-gray-700">Temporal Consistency</Text>
                                    <View className="flex-row items-center gap-2">
                                        {securityStats?.time_consistency ? (
                                            <CheckCircle size={20} color="#16A34A" />
                                        ) : (
                                            <XCircle size={20} color="#DC2626" />
                                        )}
                                        <Text
                                            className={`text-sm font-medium ${
                                                securityStats?.time_consistency ? 'text-green-600' : 'text-red-600'
                                            }`}
                                        >
                                            {securityStats?.time_consistency ? 'Consistent' : 'Anomalous'}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        </View>

                        {/* Recent Activities */}
                        <View className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                            <Text className="text-lg font-semibold text-gray-900 mb-4">Recent Activities</Text>
                            <View className="gap-3">
                                {anomalies.slice(0, 5).map((anomaly) => (
                                    <View key={anomaly.id} className="flex-row items-center gap-3">
                                        {getSeverityIcon(anomaly.severity)}
                                        <View className="flex-1">
                                            <Text className="text-sm font-medium text-gray-900" numberOfLines={1}>
                                                {anomaly.description}
                                            </Text>
                                            <Text className="text-xs text-gray-500">
                                                {new Date(anomaly.timestamp).toLocaleString('en-US')}
                                            </Text>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        </View>
                    </View>
                )}

                {activeTab === 'anomalies' && (
                    <View className="gap-6">
                        <View className="flex-row items-center justify-between">
                            <Text className="text-lg font-semibold text-gray-900">Detected Anomalies</Text>
                            <TouchableOpacity
                                onPress={() => queryClient.invalidateQueries({ queryKey: ['anomalies'] })}
                                className="flex-row items-center px-3 py-2 bg-blue-600 rounded-lg"
                            >
                                <RefreshCw size={16} color="#FFFFFF" />
                                <Text className="text-white ml-2">Refresh</Text>
                            </TouchableOpacity>
                        </View>

                        {anomaliesLoading ? (
                            <View className="items-center justify-center py-12">
                                <ActivityIndicator size="large" color="#2563EB" />
                            </View>
                        ) : (
                            <View className="gap-4">
                                {anomalies.map((anomaly) => (
                                    <View key={anomaly.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                                        <View className="flex-row items-start justify-between">
                                            <View className="flex-1">
                                                <View className="flex-row items-center mb-2 gap-3">
                                                    {getSeverityIcon(anomaly.severity)}
                                                    <View className={`px-2 py-1 rounded-full ${getSeverityColor(anomaly.severity)}`}>
                                                        <Text className={`text-xs font-medium ${getSeverityTextColor(anomaly.severity)}`}>
                                                            {anomaly.severity}
                                                        </Text>
                                                    </View>
                                                    <Text className="text-sm text-gray-500">
                                                        {new Date(anomaly.timestamp).toLocaleString('en-US')}
                                                    </Text>
                                                </View>
                                                <Text className="text-lg font-semibold text-gray-900 mb-2">
                                                    {anomaly.description}
                                                </Text>
                                                <Text className="text-sm text-gray-600 mb-4">
                                                    <Text className="font-medium">Type:</Text> {anomaly.anomaly_type}
                                                </Text>
                                                {anomaly.recommendations.length > 0 && (
                                                    <View className="mb-4">
                                                        <Text className="text-sm font-medium text-gray-700 mb-2">
                                                            Recommendations:
                                                        </Text>
                                                        {anomaly.recommendations.map((rec, index) => (
                                                            <Text key={index} className="text-sm text-gray-600 ml-4">
                                                                • {rec}
                                                            </Text>
                                                        ))}
                                                    </View>
                                                )}
                                            </View>
                                            {!anomaly.resolved ? (
                                                <TouchableOpacity
                                                    onPress={() => handleResolveAnomaly(anomaly.id)}
                                                    disabled={resolveAnomalyMutation.isPending}
                                                    className={`px-3 py-1 bg-green-600 rounded-lg ${
                                                        resolveAnomalyMutation.isPending ? 'opacity-50' : ''
                                                    }`}
                                                >
                                                    <Text className="text-white">Resolve</Text>
                                                </TouchableOpacity>
                                            ) : (
                                                <View className="px-3 py-1 bg-gray-100 rounded-lg">
                                                    <Text className="text-gray-600 text-sm">Resolved</Text>
                                                </View>
                                            )}
                                        </View>
                                    </View>
                                ))}

                                {anomalies.length === 0 && (
                                    <View className="items-center py-12">
                                        <CheckCircle size={48} color="#16A34A" />
                                        <Text className="text-lg font-medium text-gray-900 mt-4 mb-2">
                                            No anomalies
                                        </Text>
                                        <Text className="text-gray-500">System is operating normally</Text>
                                    </View>
                                )}
                            </View>
                        )}
                    </View>
                )}

                {activeTab === 'compliance' && (
                    <View className="gap-6">
                        <Text className="text-lg font-semibold text-gray-900">Regulatory Compliance</Text>

                        <View className="gap-4">
                            {Object.entries(COUNTRY_COMPLIANCE_CONFIGS).map(([code, config]) => (
                                <View key={code} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                                    <View className="flex-row items-center mb-4 gap-3">
                                        <View className="w-8 h-8 bg-blue-100 rounded-lg items-center justify-center">
                                            <Text className="text-sm font-bold text-blue-600">{code}</Text>
                                        </View>
                                        <View>
                                            <Text className="font-semibold text-gray-900">{config.country_name}</Text>
                                            <Text className="text-sm text-gray-500">{config.tax_name}</Text>
                                        </View>
                                    </View>

                                    <View className="gap-2">
                                        <View className="flex-row justify-between">
                                            <Text className="text-sm text-gray-600">Retention:</Text>
                                            <Text className="text-sm font-medium">{config.retention_period_days} days</Text>
                                        </View>
                                        <View className="flex-row justify-between">
                                            <Text className="text-sm text-gray-600">Reporting:</Text>
                                            <Text className="text-sm font-medium">{config.submission_frequency}</Text>
                                        </View>
                                        <View className="flex-row justify-between">
                                            <Text className="text-sm text-gray-600">Signature:</Text>
                                            <Text className="text-sm font-medium">
                                                {config.digital_signature_required ? 'Required' : 'Optional'}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {activeTab === 'config' && (
                    <View className="gap-6">
                        <Text className="text-lg font-semibold text-gray-900">Security Configuration</Text>

                        {securityConfig && (
                            <View className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                                <View className="gap-6">
                                    <View className="flex-row items-center justify-between">
                                        <Text className="text-sm font-medium text-gray-700">Chain Validation</Text>
                                        <Switch
                                            value={securityConfig.enable_chain_validation}
                                            onValueChange={(value) =>
                                                saveConfigMutation.mutate({
                                                    ...securityConfig,
                                                    enable_chain_validation: value,
                                                })
                                            }
                                        />
                                    </View>

                                    <View className="flex-row items-center justify-between">
                                        <Text className="text-sm font-medium text-gray-700">Temporal Validation</Text>
                                        <Switch
                                            value={securityConfig.enable_time_validation}
                                            onValueChange={(value) =>
                                                saveConfigMutation.mutate({
                                                    ...securityConfig,
                                                    enable_time_validation: value,
                                                })
                                            }
                                        />
                                    </View>

                                    <View className="flex-row items-center justify-between">
                                        <Text className="text-sm font-medium text-gray-700">Anomaly Detection</Text>
                                        <Switch
                                            value={securityConfig.enable_anomaly_detection}
                                            onValueChange={(value) =>
                                                saveConfigMutation.mutate({
                                                    ...securityConfig,
                                                    enable_anomaly_detection: value,
                                                })
                                            }
                                        />
                                    </View>

                                    <View className="flex-row items-center justify-between">
                                        <Text className="text-sm font-medium text-gray-700">Real-time Monitoring</Text>
                                        <Switch
                                            value={securityConfig.enable_real_time_monitoring}
                                            onValueChange={(value) =>
                                                saveConfigMutation.mutate({
                                                    ...securityConfig,
                                                    enable_real_time_monitoring: value,
                                                })
                                            }
                                        />
                                    </View>

                                    <View>
                                        <Text className="text-sm font-medium text-gray-700 mb-2">
                                            Max Time Drift (seconds)
                                        </Text>
                                        <TextInput
                                            value={String(securityConfig.max_time_drift)}
                                            onChangeText={(text) =>
                                                saveConfigMutation.mutate({
                                                    ...securityConfig,
                                                    max_time_drift: parseInt(text) || 0,
                                                })
                                            }
                                            keyboardType="numeric"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                        />
                                    </View>

                                    <View>
                                        <Text className="text-sm font-medium text-gray-700 mb-2">
                                            Suspicious Amount Threshold (€)
                                        </Text>
                                        <TextInput
                                            value={String(securityConfig.suspicious_amount_threshold)}
                                            onChangeText={(text) =>
                                                saveConfigMutation.mutate({
                                                    ...securityConfig,
                                                    suspicious_amount_threshold: parseFloat(text) || 0,
                                                })
                                            }
                                            keyboardType="decimal-pad"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                        />
                                    </View>
                                </View>
                            </View>
                        )}
                    </View>
                )}
            </ScrollView>
        </View>
    );
}