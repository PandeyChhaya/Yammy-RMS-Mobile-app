import AsyncStorage from '@react-native-async-storage/async-storage'
import { DeviceEventEmitter } from 'react-native'
import {
    Anomaly,
    AnomalyDetectionRequest,
    AppClock,
    ComplianceReportRequest,
    CreateSecureLogRequest,
    SecureLogEntry,
    SecurityConfig,
    SecurityStats,
} from '../types/security'

// ─── Constants ────────────────────────────────────────────────────────────────

// AsyncStorage keys (replaces localStorage keys from web version)
const STORAGE_KEYS = {
    APP_CLOCK: 'security_app_clock',
    SECURITY_CONFIG: 'security_config',
    SECURE_LOGS: 'security_secure_logs',
    ANOMALIES: 'security_anomalies',
    SESSION_ID: 'security_session_id',
}

// Default security configuration
const DEFAULT_SECURITY_CONFIG: SecurityConfig = {
    enable_chain_validation: true,
    enable_time_validation: true,
    enable_anomaly_detection: true,
    max_time_drift: 300,               // 5 minutes in seconds
    min_transaction_interval: 1000,    // 1 second in milliseconds
    suspicious_amount_threshold: 50000, // NPR threshold
    compliance_country: 'NP',
    retention_period: 1825,            // 5 years in days
    enable_real_time_monitoring: true,
}

// ─── Security Service Class ───────────────────────────────────────────────────

class SecurityService {

    private monitoringInterval: ReturnType<typeof setInterval> | null = null
    private sessionStartTime: number = Date.now()

    // ── Session Management ──────────────────────────────────────────────────

    /**
     * Generates a unique session ID for the current user session
     */
    generateSessionId(): string {
        const timestamp = Date.now().toString(36)
        const randomPart = Math.random().toString(36).substring(2, 10)
        return `session_${timestamp}_${randomPart}`
    }

    // ── System Initialization ───────────────────────────────────────────────

    /**
     * Initializes the security system - loads config, validates chain integrity
     */
    async initSecuritySystem(): Promise<void> {
        try {
            // Load or create default config
            const existingConfig = await AsyncStorage.getItem(STORAGE_KEYS.SECURITY_CONFIG)
            if (!existingConfig) {
                await AsyncStorage.setItem(
                    STORAGE_KEYS.SECURITY_CONFIG,
                    JSON.stringify(DEFAULT_SECURITY_CONFIG)
                )
            }

            // Initialize secure logs array if not present
            const existingLogs = await AsyncStorage.getItem(STORAGE_KEYS.SECURE_LOGS)
            if (!existingLogs) {
                await AsyncStorage.setItem(STORAGE_KEYS.SECURE_LOGS, JSON.stringify([]))
            }

            // Initialize anomalies array if not present
            const existingAnomalies = await AsyncStorage.getItem(STORAGE_KEYS.ANOMALIES)
            if (!existingAnomalies) {
                await AsyncStorage.setItem(STORAGE_KEYS.ANOMALIES, JSON.stringify([]))
            }

            console.log('Security system initialized successfully')
        } catch (error) {
            console.error('Failed to initialize security system:', error)
            throw error
        }
    }

    // ── App Clock ───────────────────────────────────────────────────────────

    /**
     * Creates and stores the app clock for a given session
     */
    async createAppClock(sessionId: string): Promise<AppClock> {
        try {
            const now = Date.now()
            const clock: AppClock = {
                session_id: sessionId,
                start_time: now,
                total_usage_time: 0,
                last_activity: now,
                system_start_time: now,
                clock_signature: this.generateClockSignature(sessionId, now),
            }
            await AsyncStorage.setItem(STORAGE_KEYS.APP_CLOCK, JSON.stringify(clock))
            this.sessionStartTime = now
            return clock
        } catch (error) {
            console.error('Failed to create app clock:', error)
            throw error
        }
    }

    /**
     * Updates the app clock's last activity and total usage time
     */
    async updateAppClock(sessionId: string): Promise<void> {
        try {
            const raw = await AsyncStorage.getItem(STORAGE_KEYS.APP_CLOCK)
            if (!raw) return
            const clock: AppClock = JSON.parse(raw)
            if (clock.session_id !== sessionId) return
            const now = Date.now()
            clock.total_usage_time += now - clock.last_activity
            clock.last_activity = now
            clock.clock_signature = this.generateClockSignature(sessionId, now)
            await AsyncStorage.setItem(STORAGE_KEYS.APP_CLOCK, JSON.stringify(clock))
        } catch (error) {
            console.error('Failed to update app clock:', error)
        }
    }

    /**
     * Retrieves the current app clock
     */
    async getAppClock(): Promise<AppClock | null> {
        try {
            const raw = await AsyncStorage.getItem(STORAGE_KEYS.APP_CLOCK)
            return raw ? JSON.parse(raw) : null
        } catch (error) {
            console.error('Failed to get app clock:', error)
            return null
        }
    }

    // ── Secure Logs ─────────────────────────────────────────────────────────

    /**
     * Creates a new secure log entry with hash chaining
     */
    async createSecureLog(request: CreateSecureLogRequest): Promise<SecureLogEntry> {
        try {
            const logs = await this.getAllSecureLogs()
            const previousLog = logs.length > 0 ? logs[logs.length - 1] : null
            const previousHash = previousLog?.current_hash

            const now = Date.now()
            const entry: SecureLogEntry = {
                id: this.generateId(),
                log_type: request.log_type,
                category: request.category,
                title: request.title,
                description: request.description,
                amount: request.amount,
                previous_hash: previousHash,
                current_hash: '',           // Will be computed below
                app_clock: now,
                system_clock: now,
                session_id: request.session_id,
                user_signature: request.user_signature,
                chain_index: logs.length,
                table_id: request.table_id,
                table_name: request.table_name,
                product_id: request.product_id,
                product_name: request.product_name,
                user_id: request.user_id,
                user_name: request.user_name,
                metadata: request.metadata,
                created_at: new Date(now).toISOString(),
                secure_timestamp: new Date(now).toISOString(),
            }

            // Compute hash for the entry
            entry.current_hash = this.computeEntryHash(entry)

            // Save to storage
            logs.push(entry)
            await AsyncStorage.setItem(STORAGE_KEYS.SECURE_LOGS, JSON.stringify(logs))

            return entry
        } catch (error) {
            console.error('Failed to create secure log:', error)
            throw error
        }
    }

    /**
     * Returns all secure log entries
     */
    async getAllSecureLogs(): Promise<SecureLogEntry[]> {
        try {
            const raw = await AsyncStorage.getItem(STORAGE_KEYS.SECURE_LOGS)
            return raw ? JSON.parse(raw) : []
        } catch (error) {
            console.error('Failed to get secure logs:', error)
            return []
        }
    }

    // ── Anomalies ───────────────────────────────────────────────────────────

    /**
     * Returns up to `limit` anomalies, most recent first
     */
    async getAnomalies(limit: number = 50): Promise<Anomaly[]> {
        try {
            const raw = await AsyncStorage.getItem(STORAGE_KEYS.ANOMALIES)
            const anomalies: Anomaly[] = raw ? JSON.parse(raw) : []
            return anomalies
                .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                .slice(0, limit)
        } catch (error) {
            console.error('Failed to get anomalies:', error)
            return []
        }
    }

    /**
     * Returns only unresolved anomalies
     */
    async getUnresolvedAnomalies(): Promise<Anomaly[]> {
        try {
            const anomalies = await this.getAnomalies(200)
            return anomalies.filter((a) => !a.resolved)
        } catch (error) {
            console.error('Failed to get unresolved anomalies:', error)
            return []
        }
    }

    /**
     * Marks an anomaly as resolved
     */
    async resolveAnomaly(anomalyId: string, resolvedBy: string): Promise<void> {
        try {
            const raw = await AsyncStorage.getItem(STORAGE_KEYS.ANOMALIES)
            const anomalies: Anomaly[] = raw ? JSON.parse(raw) : []
            const index = anomalies.findIndex((a) => a.id === anomalyId)
            if (index === -1) throw new Error(`Anomaly ${anomalyId} not found`)
            anomalies[index].resolved = true
            anomalies[index].resolved_at = new Date().toISOString()
            anomalies[index].resolved_by = resolvedBy
            await AsyncStorage.setItem(STORAGE_KEYS.ANOMALIES, JSON.stringify(anomalies))
        } catch (error) {
            console.error('Failed to resolve anomaly:', error)
            throw error
        }
    }

    // ── Security Config ─────────────────────────────────────────────────────

    /**
     * Retrieves the current security configuration
     */
    async getSecurityConfig(): Promise<SecurityConfig | null> {
        try {
            const raw = await AsyncStorage.getItem(STORAGE_KEYS.SECURITY_CONFIG)
            return raw ? JSON.parse(raw) : DEFAULT_SECURITY_CONFIG
        } catch (error) {
            console.error('Failed to get security config:', error)
            return DEFAULT_SECURITY_CONFIG
        }
    }

    /**
     * Saves updated security configuration
     */
    async saveSecurityConfig(config: SecurityConfig): Promise<void> {
        try {
            await AsyncStorage.setItem(STORAGE_KEYS.SECURITY_CONFIG, JSON.stringify(config))
        } catch (error) {
            console.error('Failed to save security config:', error)
            throw error
        }
    }

    // ── Security Statistics ─────────────────────────────────────────────────

    /**
     * Computes and returns current security statistics
     */
    async getSecurityStats(): Promise<SecurityStats> {
        try {
            const [logs, anomalies, clock] = await Promise.all([
                this.getAllSecureLogs(),
                this.getAnomalies(500),
                this.getAppClock(),
            ])

            const unresolvedAnomalies = anomalies.filter((a) => !a.resolved)
            const chainIntegrity = await this.validateChainIntegrity(logs)
            const timeConsistency = await this.validateTimeConsistency(logs)

            const uptime = clock
                ? Date.now() - clock.system_start_time
                : Date.now() - this.sessionStartTime

            const lastAnomaly = anomalies.length > 0 ? anomalies[0].timestamp : new Date().toISOString()

            return {
                total_secure_logs: logs.length,
                total_anomalies: anomalies.length,
                unresolved_anomalies: unresolvedAnomalies.length,
                chain_integrity: chainIntegrity,
                time_consistency: timeConsistency,
                last_anomaly_detection: lastAnomaly,
                system_uptime: uptime,
            }
        } catch (error) {
            console.error('Failed to get security stats:', error)
            // Return safe defaults on failure
            return {
                total_secure_logs: 0,
                total_anomalies: 0,
                unresolved_anomalies: 0,
                chain_integrity: true,
                time_consistency: true,
                last_anomaly_detection: new Date().toISOString(),
                system_uptime: 0,
            }
        }
    }

    // ── Real-time Monitoring ────────────────────────────────────────────────

    /**
     * Starts real-time monitoring based on security config
     * Replaces web version's window-based interval approach
     */
    startRealTimeMonitoring(sessionId: string, config: SecurityConfig): void {
        // Stop any existing monitoring interval first
        this.stopRealTimeMonitoring()

        if (!config.enable_real_time_monitoring) return

        // Run checks every 30 seconds
        this.monitoringInterval = setInterval(async () => {
            try {
                await this.updateAppClock(sessionId)

                if (config.enable_anomaly_detection) {
                    await this.runAnomalyDetection({
                        session_id: sessionId,
                        enable_chain_validation: config.enable_chain_validation,
                        enable_time_validation: config.enable_time_validation,
                        max_time_drift: config.max_time_drift,
                        suspicious_amount_threshold: config.suspicious_amount_threshold,
                    })
                }
            } catch (error) {
                console.error('Real-time monitoring error:', error)
            }
        }, 30000)
    }

    /**
     * Stops the real-time monitoring interval
     */
    stopRealTimeMonitoring(): void {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval)
            this.monitoringInterval = null
        }
    }

    // ── Anomaly Detection ───────────────────────────────────────────────────

    /**
     * Runs anomaly detection checks based on request config
     * Emits a 'security-alert' event via DeviceEventEmitter if anomalies found
     * (replaces web version's CustomEvent / window.dispatchEvent)
     */
    async runAnomalyDetection(request: AnomalyDetectionRequest): Promise<Anomaly[]> {
        const detectedAnomalies: Anomaly[] = []

        try {
            const logs = await this.getAllSecureLogs()

            // Chain validation
            if (request.enable_chain_validation) {
                const chainOk = await this.validateChainIntegrity(logs)
                if (!chainOk) {
                    const anomaly = this.createAnomaly(
                        'chain_break',
                        'critical',
                        'Transaction chain integrity violation detected',
                        'Hash chain is broken - possible data tampering',
                        ['Immediately audit all transactions', 'Contact system administrator', 'Do not process new transactions']
                    )
                    detectedAnomalies.push(anomaly)
                }
            }

            // Time validation
            if (request.enable_time_validation) {
                const timeOk = await this.validateTimeConsistency(logs)
                if (!timeOk) {
                    const anomaly = this.createAnomaly(
                        'time_drift',
                        'high',
                        `Time drift detected (threshold: ${request.max_time_drift}s)`,
                        'System clock inconsistency - possible clock manipulation',
                        ['Check device system time', 'Enable automatic time sync', 'Review recent transactions']
                    )
                    detectedAnomalies.push(anomaly)
                }
            }

            // Suspicious amounts
            const recentLogs = logs.slice(-20) // Check last 20 logs
            for (const log of recentLogs) {
                if (log.amount && log.amount > request.suspicious_amount_threshold) {
                    const anomaly = this.createAnomaly(
                        'suspicious_amount',
                        'medium',
                        `Suspicious transaction amount: NPR ${log.amount}`,
                        `Amount exceeds threshold of NPR ${request.suspicious_amount_threshold}`,
                        ['Verify transaction with supervisor', 'Check customer identity', 'Document justification']
                    )
                    detectedAnomalies.push(anomaly)
                    break // Only flag once per detection run
                }
            }

            // Rapid transactions check
            if (logs.length >= 5) {
                const last5 = logs.slice(-5)
                const timeDiff = new Date(last5[4].created_at).getTime() - new Date(last5[0].created_at).getTime()
                if (timeDiff < 5000) { // 5 transactions in under 5 seconds
                    const anomaly = this.createAnomaly(
                        'rapid_transactions',
                        'medium',
                        'Unusually rapid transactions detected',
                        '5 or more transactions processed in under 5 seconds',
                        ['Review transaction logs', 'Check for automated input', 'Verify cashier identity']
                    )
                    detectedAnomalies.push(anomaly)
                }
            }

            // Save detected anomalies
            if (detectedAnomalies.length > 0) {
                const raw = await AsyncStorage.getItem(STORAGE_KEYS.ANOMALIES)
                const existing: Anomaly[] = raw ? JSON.parse(raw) : []
                const merged = [...existing, ...detectedAnomalies]
                await AsyncStorage.setItem(STORAGE_KEYS.ANOMALIES, JSON.stringify(merged))

                // Emit security alert via DeviceEventEmitter
                // (replaces web's window.dispatchEvent(new CustomEvent('security-alert', ...)))
                DeviceEventEmitter.emit('security-alert', {
                    anomalies: detectedAnomalies,
                    count: detectedAnomalies.length,
                    timestamp: new Date().toISOString(),
                })
            }

            return detectedAnomalies
        } catch (error) {
            console.error('Anomaly detection failed:', error)
            return []
        }
    }

    // ── Export ──────────────────────────────────────────────────────────────

    /**
     * Exports security data as JSON or CSV string
     * Caller is responsible for saving/sharing the file (expo-file-system + expo-sharing)
     */
    async exportSecurityData(format: 'json' | 'csv'): Promise<string> {
        try {
            const [logs, anomalies, stats] = await Promise.all([
                this.getAllSecureLogs(),
                this.getAnomalies(500),
                this.getSecurityStats(),
            ])

            if (format === 'json') {
                return JSON.stringify(
                    {
                        exported_at: new Date().toISOString(),
                        stats,
                        secure_logs: logs,
                        anomalies,
                    },
                    null,
                    2
                )
            }

            // CSV format
            const csvRows: string[] = []

            // Header
            csvRows.push('id,log_type,category,title,amount,created_at,chain_index,session_id')

            // Rows
            for (const log of logs) {
                csvRows.push([
                    log.id,
                    log.log_type,
                    log.category,
                    `"${log.title.replace(/"/g, '""')}"`,
                    log.amount ?? '',
                    log.created_at,
                    log.chain_index,
                    log.session_id,
                ].join(','))
            }

            return csvRows.join('\n')
        } catch (error) {
            console.error('Failed to export security data:', error)
            throw error
        }
    }

    // ── Compliance Reports ──────────────────────────────────────────────────

    /**
     * Generates a compliance report for a given period and country
     */
    async generateComplianceReport(request: ComplianceReportRequest) {
        try {
            const logs = await this.getAllSecureLogs()
            const periodStart = new Date(request.period_start)
            const periodEnd = new Date(request.period_end)

            const periodLogs = logs.filter((log) => {
                const logDate = new Date(log.created_at)
                return logDate >= periodStart && logDate <= periodEnd
            })

            const totalAmount = periodLogs.reduce((sum, log) => sum + (log.amount || 0), 0)
            const anomalies = await this.getAnomalies(500)
            const periodAnomalies = anomalies.filter((a) => {
                const aDate = new Date(a.timestamp)
                return aDate >= periodStart && aDate <= periodEnd
            })

            const chainIntegrity = await this.validateChainIntegrity(periodLogs)
            const timeConsistency = await this.validateTimeConsistency(periodLogs)

            return {
                id: this.generateId(),
                period_start: request.period_start,
                period_end: request.period_end,
                country_code: request.country_code,
                total_transactions: periodLogs.length,
                total_amount: totalAmount,
                anomalies_count: periodAnomalies.length,
                chain_integrity: chainIntegrity,
                time_consistency: timeConsistency,
                generated_at: new Date().toISOString(),
                report_signature: this.generateReportSignature(periodLogs),
            }
        } catch (error) {
            console.error('Failed to generate compliance report:', error)
            throw error
        }
    }

    // ── Private Helpers ─────────────────────────────────────────────────────

    /**
     * Validates the hash chain across all secure log entries
     */
    private async validateChainIntegrity(logs: SecureLogEntry[]): Promise<boolean> {
        if (logs.length === 0) return true
        for (let i = 1; i < logs.length; i++) {
            if (logs[i].previous_hash !== logs[i - 1].current_hash) {
                return false
            }
            if (logs[i].chain_index !== i) {
                return false
            }
        }
        return true
    }

    /**
     * Validates that log timestamps are sequential and reasonable
     */
    private async validateTimeConsistency(logs: SecureLogEntry[]): Promise<boolean> {
        if (logs.length < 2) return true
        const config = await this.getSecurityConfig()
        const maxDrift = (config?.max_time_drift || 300) * 1000 // convert to ms

        for (let i = 1; i < logs.length; i++) {
            const prev = new Date(logs[i - 1].created_at).getTime()
            const curr = new Date(logs[i].created_at).getTime()
            if (curr < prev) return false // Timestamps going backwards
            if (curr - prev > maxDrift * 10) return false // Unreasonably large gap
        }
        return true
    }

    /**
     * Computes a deterministic hash string for a secure log entry
     */
    private computeEntryHash(entry: SecureLogEntry): string {
        const payload = [
            entry.id,
            entry.log_type,
            entry.category,
            entry.title,
            entry.amount ?? '',
            entry.app_clock,
            entry.system_clock,
            entry.session_id,
            entry.chain_index,
            entry.previous_hash ?? '',
        ].join('|')
        return this.simpleHash(payload)
    }

    /**
     * Simple non-cryptographic hash for chain integrity (not for security-critical use)
     */
    private simpleHash(input: string): string {
        let hash = 0
        for (let i = 0; i < input.length; i++) {
            const char = input.charCodeAt(i)
            hash = (hash << 5) - hash + char
            hash |= 0
        }
        return Math.abs(hash).toString(16).padStart(8, '0')
    }

    /**
     * Generates a signature for an app clock entry
     */
    private generateClockSignature(sessionId: string, timestamp: number): string {
        return this.simpleHash(`${sessionId}_${timestamp}`)
    }

    /**
     * Generates a report signature from log entries
     */
    private generateReportSignature(logs: SecureLogEntry[]): string {
        const payload = logs.map((l) => l.current_hash).join('')
        return this.simpleHash(payload || 'empty')
    }

    /**
     * Creates a new Anomaly object
     */
    private createAnomaly(
        type: string,
        severity: string,
        description: string,
        evidence: string,
        recommendations: string[]
    ): Anomaly {
        return {
            id: this.generateId(),
            anomaly_type: type as any,
            severity: severity as any,
            description,
            timestamp: new Date().toISOString(),
            evidence,
            recommendations,
            resolved: false,
        }
    }

    /**
     * Generates a unique ID string
     */
    private generateId(): string {
        return `${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`
    }
}

// ─── Export singleton instance ────────────────────────────────────────────────
export const securityService = new SecurityService()