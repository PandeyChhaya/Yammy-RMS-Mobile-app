import axios from 'axios';
import { Buffer } from 'buffer'; // For base64 encoding
import { EventEmitter } from 'events'; // For event handling
import {
    Anomaly,
    AnomalyDetectionRequest,
    AppClock,
    ComplianceReport,
    ComplianceReportRequest,
    CreateSecureLogRequest,
    SecureLogEntry,
    SecurityAlert,
    SecurityConfig,
    SecurityStats
} from '../types/security';

// Configure your API base URL
const API_BASE_URL = 'http://your-api-url.com/api'; // Replace with your actual API

// Create axios instance with default config
const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Event emitter for security alerts (replaces window.dispatchEvent)
export const securityEventEmitter = new EventEmitter();

export const securityService = {
    // Security system initialization
    initSecuritySystem: async (): Promise<void> => {
        try {
            await apiClient.post('/security/init');
        } catch (error) {
            console.error('Failed to initialize security system:', error);
            throw error;
        }
    },

    // Secure log management
    createSecureLogEntry: async (request: CreateSecureLogRequest): Promise<SecureLogEntry> => {
        try {
            const response = await apiClient.post('/security/logs', request);
            return response.data;
        } catch (error) {
            console.error('Failed to create secure log entry:', error);
            throw error;
        }
    },

    getSecureLogs: async (limit?: number): Promise<SecureLogEntry[]> => {
        try {
            const response = await apiClient.get('/security/logs', {
                params: { limit },
            });
            return response.data;
        } catch (error) {
            console.error('Failed to get secure logs:', error);
            throw error;
        }
    },

    // App clock management
    createAppClock: async (sessionId: string): Promise<AppClock> => {
        try {
            const response = await apiClient.post('/security/clock', { sessionId });
            return response.data;
        } catch (error) {
            console.error('Failed to create app clock:', error);
            throw error;
        }
    },

    getAppClock: async (sessionId: string): Promise<AppClock | null> => {
        try {
            const response = await apiClient.get(`/security/clock/${sessionId}`);
            return response.data;
        } catch (error) {
            console.error('Failed to get app clock:', error);
            return null;
        }
    },

    updateAppClock: async (sessionId: string, duration: number): Promise<void> => {
        try {
            await apiClient.put(`/security/clock/${sessionId}`, { duration });
        } catch (error) {
            console.error('Failed to update app clock:', error);
            throw error;
        }
    },

    // Anomaly detection
    detectAnomalies: async (request: AnomalyDetectionRequest): Promise<Anomaly[]> => {
        try {
            const response = await apiClient.post('/security/anomalies/detect', request);
            return response.data;
        } catch (error) {
            console.error('Failed to detect anomalies:', error);
            throw error;
        }
    },

    getAnomalies: async (limit?: number): Promise<Anomaly[]> => {
        try {
            const response = await apiClient.get('/security/anomalies', {
                params: { limit },
            });
            return response.data;
        } catch (error) {
            console.error('Failed to get anomalies:', error);
            throw error;
        }
    },

    getUnresolvedAnomalies: async (): Promise<Anomaly[]> => {
        try {
            const response = await apiClient.get('/security/anomalies/unresolved');
            return response.data;
        } catch (error) {
            console.error('Failed to get unresolved anomalies:', error);
            throw error;
        }
    },

    resolveAnomaly: async (anomalyId: string, resolvedBy: string): Promise<void> => {
        try {
            await apiClient.put(`/security/anomalies/${anomalyId}/resolve`, {
                resolvedBy,
            });
        } catch (error) {
            console.error('Failed to resolve anomaly:', error);
            throw error;
        }
    },

    // Compliance reports
    generateComplianceReport: async (request: ComplianceReportRequest): Promise<ComplianceReport> => {
        try {
            const response = await apiClient.post('/security/compliance/report', request);
            return response.data;
        } catch (error) {
            console.error('Failed to generate compliance report:', error);
            throw error;
        }
    },

    // Security configuration
    getSecurityConfig: async (): Promise<SecurityConfig | null> => {
        try {
            const response = await apiClient.get('/security/config');
            return response.data;
        } catch (error) {
            console.error('Failed to get security config:', error);
            return null;
        }
    },

    saveSecurityConfig: async (config: SecurityConfig): Promise<void> => {
        try {
            await apiClient.put('/security/config', config);
        } catch (error) {
            console.error('Failed to save security config:', error);
            throw error;
        }
    },

    // Utility functions
    generateUserSignature: (userId: string, timestamp: number): string => {
        // Generate simple signature for user
        const data = `${userId}-${timestamp}-${Math.random()}`;
        // Use Buffer instead of btoa() for React Native
        return Buffer.from(data).toString('base64').replace(/[^a-zA-Z0-9]/g, '');
    },

    generateSessionId: (): string => {
        return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    },

    // Real-time monitoring
    startRealTimeMonitoring: async (sessionId: string, config: SecurityConfig): Promise<void> => {
        if (!config.enable_real_time_monitoring) return;

        // Start periodic monitoring
        setInterval(async () => {
            try {
                const request: AnomalyDetectionRequest = {
                    session_id: sessionId,
                    enable_chain_validation: config.enable_chain_validation,
                    enable_time_validation: config.enable_time_validation,
                    max_time_drift: config.max_time_drift,
                    suspicious_amount_threshold: config.suspicious_amount_threshold,
                };

                const anomalies = await securityService.detectAnomalies(request);

                // Emit alerts for new anomalies
                anomalies.forEach((anomaly) => {
                    if (!anomaly.resolved) {
                        securityService.emitSecurityAlert(anomaly);
                    }
                });
            } catch (error) {
                console.error('Error during real-time monitoring:', error);
            }
        }, 30000); // Check every 30 seconds
    },

    // Alert system (React Native compatible)
    emitSecurityAlert: (anomaly: Anomaly): void => {
        const alert: SecurityAlert = {
            id: anomaly.id,
            type: mapAnomalyTypeToAlertType(anomaly.anomaly_type),
            severity: anomaly.severity,
            title: `Anomaly detected: ${anomaly.anomaly_type}`,
            message: anomaly.description,
            timestamp: anomaly.timestamp,
            acknowledged: false,
        };

        // Use EventEmitter instead of window.dispatchEvent
        securityEventEmitter.emit('security-alert', alert);
    },

    // Security statistics
    getSecurityStats: async (): Promise<SecurityStats> => {
        try {
            const [secureLogs, anomalies, unresolvedAnomalies] = await Promise.all([
                securityService.getSecureLogs(),
                securityService.getAnomalies(),
                securityService.getUnresolvedAnomalies(),
            ]);

            // Verify chain integrity
            const chainIntegrity = verifyChainIntegrity(secureLogs);

            // Verify time consistency
            const timeConsistency = verifyTimeConsistency(secureLogs);

            return {
                total_secure_logs: secureLogs.length,
                total_anomalies: anomalies.length,
                unresolved_anomalies: unresolvedAnomalies.length,
                chain_integrity: chainIntegrity,
                time_consistency: timeConsistency,
                last_anomaly_detection: anomalies.length > 0 ? anomalies[0].timestamp : '',
                system_uptime:
                    Date.now() -
                    (secureLogs.length > 0 ? new Date(secureLogs[0].created_at).getTime() : Date.now()),
            };
        } catch (error) {
            console.error('Failed to get security stats:', error);
            throw error;
        }
    },

    // Chain integrity validation
    verifyChainIntegrity: (logs: SecureLogEntry[]): boolean => {
        for (let i = 1; i < logs.length; i++) {
            const current = logs[i];
            const previous = logs[i - 1];

            if (current.previous_hash !== previous.current_hash) {
                return false;
            }
        }
        return true;
    },

    // Time consistency validation
    verifyTimeConsistency: (logs: SecureLogEntry[]): boolean => {
        if (logs.length === 0) return true;

        let lastTimestamp = new Date(logs[0].created_at).getTime();
        for (let i = 1; i < logs.length; i++) {
            const currentTimestamp = new Date(logs[i].created_at).getTime();
            if (currentTimestamp < lastTimestamp) {
                return false;
            }
            lastTimestamp = currentTimestamp;
        }
        return true;
    },

    // Export security data
    exportSecurityData: async (format: 'json' | 'csv'): Promise<string> => {
        try {
            const [secureLogs, anomalies, config] = await Promise.all([
                securityService.getSecureLogs(),
                securityService.getAnomalies(),
                securityService.getSecurityConfig(),
            ]);

            const data = {
                export_date: new Date().toISOString(),
                secure_logs: secureLogs,
                anomalies: anomalies,
                security_config: config,
                chain_integrity: securityService.verifyChainIntegrity(secureLogs),
                time_consistency: securityService.verifyTimeConsistency(secureLogs),
            };

            if (format === 'json') {
                return JSON.stringify(data, null, 2);
            } else {
                // Simplified CSV format
                const csvHeaders = ['ID', 'Type', 'Category', 'Title', 'Amount', 'Timestamp', 'Hash'];
                const csvRows = secureLogs.map((log) => [
                    log.id,
                    log.log_type,
                    log.category,
                    log.title,
                    log.amount || 0,
                    log.created_at,
                    log.current_hash,
                ]);

                return [csvHeaders.join(','), ...csvRows.map((row) => row.join(','))].join('\n');
            }
        } catch (error) {
            console.error('Failed to export security data:', error);
            throw error;
        }
    },
};

// Utility functions
function mapAnomalyTypeToAlertType(anomalyType: string): SecurityAlert['type'] {
    switch (anomalyType) {
        case 'chain_break':
            return 'chain_break';
        case 'time_drift':
            return 'time_drift';
        case 'system_tampering':
        case 'clock_manipulation':
            return 'system_tampering';
        default:
            return 'anomaly';
    }
}

function verifyChainIntegrity(logs: SecureLogEntry[]): boolean {
    return securityService.verifyChainIntegrity(logs);
}

function verifyTimeConsistency(logs: SecureLogEntry[]): boolean {
    return securityService.verifyTimeConsistency(logs);
}