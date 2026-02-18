import { LogCategory, LogType } from './logs'

// Types for the security system
export interface SecureLogEntry {
    id: string
    log_type: LogType
    category: LogCategory
    title: string
    description: string
    amount?: number

    // Enhanced security
    previous_hash?: string
    current_hash: string
    app_clock: number
    system_clock: number
    session_id: string
    user_signature: string
    chain_index: number

    // Transactional data
    table_id?: string
    table_name?: string
    product_id?: string
    product_name?: string
    user_id?: string
    user_name?: string
    metadata?: string

    // Secure timestamp
    created_at: string
    secure_timestamp: string
}

export interface AppClock {
    session_id: string
    start_time: number
    total_usage_time: number
    last_activity: number
    system_start_time: number
    clock_signature: string
}

export enum AnomalyType {
    TimeDrift = 'time_drift',
    MissingTransaction = 'missing_transaction',
    ChainBreak = 'chain_break',
    SuspiciousAmount = 'suspicious_amount',
    RapidTransactions = 'rapid_transactions',
    UserAnomaly = 'user_anomaly',
    SystemTampering = 'system_tampering',
    ClockManipulation = 'clock_manipulation',
}

export enum AnomalySeverity {
    Low = 'low',
    Medium = 'medium',
    High = 'high',
    Critical = 'critical',
}

export interface Anomaly {
    id: string
    anomaly_type: AnomalyType
    severity: AnomalySeverity
    description: string
    timestamp: string
    evidence: string
    recommendations: string[]
    resolved: boolean
    resolved_at?: string
    resolved_by?: string
}

export interface ComplianceReport {
    id: string
    period_start: string
    period_end: string
    country_code: string
    total_transactions: number
    total_amount: number
    anomalies_count: number
    chain_integrity: boolean
    time_consistency: boolean
    generated_at: string
    report_signature: string
}

export interface SecurityConfig {
    enable_chain_validation: boolean
    enable_time_validation: boolean
    enable_anomaly_detection: boolean
    max_time_drift: number // in seconds
    min_transaction_interval: number // in milliseconds
    suspicious_amount_threshold: number
    compliance_country: string
    retention_period: number // in days
    enable_real_time_monitoring: boolean
}

// Types for requests
export interface CreateSecureLogRequest {
    log_type: LogType
    category: LogCategory
    title: string
    description: string
    amount?: number
    session_id: string
    user_signature: string
    table_id?: string
    table_name?: string
    product_id?: string
    product_name?: string
    user_id?: string
    user_name?: string
    metadata?: string
}

export interface AnomalyDetectionRequest {
    session_id: string
    enable_chain_validation: boolean
    enable_time_validation: boolean
    max_time_drift: number
    suspicious_amount_threshold: number
}

export interface ComplianceReportRequest {
    period_start: string
    period_end: string
    country_code: string
}

// Types for security statistics
export interface SecurityStats {
    total_secure_logs: number
    total_anomalies: number
    unresolved_anomalies: number
    chain_integrity: boolean
    time_consistency: boolean
    last_anomaly_detection: string
    system_uptime: number
}

// Types for alerts
export interface SecurityAlert {
    id: string
    type: 'anomaly' | 'chain_break' | 'time_drift' | 'system_tampering'
    severity: AnomalySeverity
    title: string
    message: string
    timestamp: string
    acknowledged: boolean
    acknowledged_by?: string
    acknowledged_at?: string
}

// Types for country compliance reports
export interface CountryComplianceConfig {
    country_code: string
    country_name: string
    tax_name: string
    currency: string
    retention_period_days: number
    required_fields: string[]
    report_format: 'json' | 'xml' | 'csv'
    submission_frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly'
    digital_signature_required: boolean
    audit_trail_required: boolean
}

// Default configuration for different countries
export const COUNTRY_COMPLIANCE_CONFIGS: Record<string, CountryComplianceConfig> = {
    NP: {
        country_code: 'NP',
        country_name: 'Nepal',
        tax_name: 'VAT',
        currency: 'NPR',
        retention_period_days: 1825, // 5 years
        required_fields: ['transaction_id', 'amount', 'vat_amount', 'timestamp', 'user_signature'],
        report_format: 'json',
        submission_frequency: 'monthly',
        digital_signature_required: true,
        audit_trail_required: true,
    },
    FR: {
        country_code: 'FR',
        country_name: 'France',
        tax_name: 'TVA',
        currency: 'EUR',
        retention_period_days: 2190, // 6 years
        required_fields: ['transaction_id', 'amount', 'tax_amount', 'timestamp', 'user_signature'],
        report_format: 'json',
        submission_frequency: 'monthly',
        digital_signature_required: true,
        audit_trail_required: true,
    },
    US: {
        country_code: 'US',
        country_name: 'United States',
        tax_name: 'Sales Tax',
        currency: 'USD',
        retention_period_days: 2555, // 7 years
        required_fields: ['transaction_id', 'amount', 'tax_amount', 'timestamp', 'digital_signature'],
        report_format: 'xml',
        submission_frequency: 'quarterly',
        digital_signature_required: true,
        audit_trail_required: true,
    },
    GB: {
        country_code: 'GB',
        country_name: 'United Kingdom',
        tax_name: 'VAT',
        currency: 'GBP',
        retention_period_days: 2190, // 6 years
        required_fields: ['transaction_id', 'amount', 'vat_amount', 'timestamp', 'user_signature'],
        report_format: 'json',
        submission_frequency: 'monthly',
        digital_signature_required: true,
        audit_trail_required: true,
    },
    CA: {
        country_code: 'CA',
        country_name: 'Canada',
        tax_name: 'GST/HST',
        currency: 'CAD',
        retention_period_days: 2190, // 6 years
        required_fields: ['transaction_id', 'amount', 'gst_amount', 'timestamp', 'digital_signature'],
        report_format: 'xml',
        submission_frequency: 'monthly',
        digital_signature_required: true,
        audit_trail_required: true,
    },
    
}