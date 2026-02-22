// shared/services/logsService.ts

import { CreateLogEntryRequest, LogCategory, LogEntry, LogFilter, LogType } from '../types/logs'

// ── In-memory log store ───────────────────────────────────────
// Acts as a fake database for logs during the session.
// Resets on app restart — connect to a real backend later.

let mockLogs: LogEntry[] = []

const generateId = () => Date.now().toString() + Math.random().toString(36).slice(2)
const now = () => new Date().toISOString()

export const logsService = {

    // ── Core CRUD ────────────────────────────────────────────

    createLogEntry: async (request: CreateLogEntryRequest): Promise<LogEntry> => {
        const entry: LogEntry = {
            id: generateId(),
            log_type: request.log_type,
            category: request.category,
            title: request.title,
            description: request.description,
            amount: request.amount,
            table_id: request.table_id,
            table_name: request.table_name,
            product_id: request.product_id,
            product_name: request.product_name,
            metadata: request.metadata,
            created_at: now(),
        }
        mockLogs.unshift(entry) // newest first
        return entry
    },

    createSecureLogEntry: async (request: CreateLogEntryRequest): Promise<LogEntry> => {
        // Simplified — same as createLogEntry without Tauri security layer
        return logsService.createLogEntry(request)
    },

    getLogs: async (limit?: number): Promise<LogEntry[]> => {
        return limit ? mockLogs.slice(0, limit) : [...mockLogs]
    },

    getSecureLogs: async (limit?: number): Promise<LogEntry[]> => {
        return logsService.getLogs(limit)
    },

    getLogsWithFilter: async (filter: LogFilter, limit?: number): Promise<LogEntry[]> => {
        let filtered = [...mockLogs]

        if (filter.log_type) {
            filtered = filtered.filter(l => l.log_type === filter.log_type)
        }
        if (filter.category) {
            filtered = filtered.filter(l => l.category === filter.category)
        }
        if (filter.start_date) {
            filtered = filtered.filter(l => l.created_at >= filter.start_date!)
        }
        if (filter.end_date) {
            filtered = filtered.filter(l => l.created_at <= filter.end_date!)
        }

        return limit ? filtered.slice(0, limit) : filtered
    },

    getFinancialLogs: async (startDate?: string, endDate?: string): Promise<LogEntry[]> => {
        return logsService.getLogsWithFilter({
            log_type: LogType.Financial,
            start_date: startDate,
            end_date: endDate,
        })
    },

    getLogsByCategory: async (category: LogCategory, limit?: number): Promise<LogEntry[]> => {
        const filtered = mockLogs.filter(l => l.category === category)
        return limit ? filtered.slice(0, limit) : filtered
    },

    deleteOldLogs: async (daysToKeep: number): Promise<number> => {
        const cutoff = new Date()
        cutoff.setDate(cutoff.getDate() - daysToKeep)
        const cutoffStr = cutoff.toISOString()
        const before = mockLogs.length
        mockLogs = mockLogs.filter(l => l.created_at >= cutoffStr)
        return before - mockLogs.length
    },

    getLogsCount: async (): Promise<number> => {
        return mockLogs.length
    },

    // ── Maintenance ──────────────────────────────────────────

    cleanAndRepairLogs: async (): Promise<{ cleaned: number; repaired: number; errors: number }> => {
        console.log('Starting logs cleanup and repair...')
        let cleaned = 0
        let repaired = 0
        let errors = 0

        for (const log of mockLogs) {
            try {
                if (log.metadata) {
                    try {
                        JSON.parse(log.metadata)
                    } catch {
                        console.warn('Corrupted metadata for log:', log.id)
                        const repairedMetadata = {
                            original_metadata: log.metadata,
                            repaired_at: now(),
                            repair_reason: 'corrupted_json',
                        }
                        log.metadata = JSON.stringify(repairedMetadata)
                        repaired++
                    }
                }
                if (log.amount && log.amount < 0) {
                    console.warn('Negative amount in log:', log.id)
                    cleaned++
                }
            } catch (error) {
                console.error('Error during cleanup for log:', log.id, error)
                errors++
            }
        }

        console.log('Cleanup complete:', { cleaned, repaired, errors })
        return { cleaned, repaired, errors }
    },

    validateLogIntegrity: async (): Promise<{ valid: number; invalid: number; issues: string[] }> => {
        console.log('Starting log integrity validation...')
        let valid = 0
        let invalid = 0
        const issues: string[] = []

        for (const log of mockLogs) {
            let logValid = true

            if (log.metadata) {
                try {
                    JSON.parse(log.metadata)
                } catch {
                    issues.push(`Log ${log.id}: Invalid JSON metadata`)
                    logValid = false
                }
            }

            if (log.amount && (isNaN(log.amount) || log.amount < 0)) {
                issues.push(`Log ${log.id}: Invalid amount ${log.amount}`)
                logValid = false
            }

            if (log.created_at) {
                const date = new Date(log.created_at)
                if (isNaN(date.getTime())) {
                    issues.push(`Log ${log.id}: Invalid date ${log.created_at}`)
                    logValid = false
                }
            }

            logValid ? valid++ : invalid++
        }

        console.log('Validation complete:', { valid, invalid, issuesCount: issues.length })
        return { valid, invalid, issues }
    },

    // ── Event Helpers ─────────────────────────────────────────

    logSaleEvent: async (
        tableId: string | undefined,
        tableName: string | undefined,
        amount: number,
        itemsCount: number,
        paymentMethod: string | undefined,
        customerName: string | undefined,
        items: Array<{ product_name: string; quantity: number; unit_price: number }> | undefined
    ): Promise<void> => {
        await logsService.createLogEntry({
            log_type: LogType.Financial,
            category: LogCategory.Sale,
            title: `Sale - ${paymentMethod || 'Unknown'}`,
            description: `Sale of ${itemsCount} items for Rs. ${amount.toFixed(2)}`,
            amount,
            table_id: tableId,
            table_name: tableName,
            metadata: JSON.stringify({
                items_count: itemsCount,
                payment_method: paymentMethod,
                customer_name: customerName,
                items: items || [],
            }),
        })
    },

    logTableStatusChange: async (
        tableId: string,
        tableName: string,
        oldStatus: string,
        newStatus: string
    ): Promise<void> => {
        await logsService.createLogEntry({
            log_type: LogType.System,
            category: LogCategory.TableStatus,
            title: `Status change - ${tableName}`,
            description: `Status changed from ${oldStatus} to ${newStatus}`,
            table_id: tableId,
            table_name: tableName,
            metadata: JSON.stringify({
                old_status: oldStatus,
                new_status: newStatus,
                change_time: now(),
            }),
        })
    },

    logProductEvent: async (
        category: LogCategory,
        productId: string,
        productName: string,
        action: string
    ): Promise<void> => {
        await logsService.createLogEntry({
            log_type: LogType.System,
            category: LogCategory.Product,
            title: `${action} - ${productName}`,
            description: `Product ${action.toLowerCase()}: ${productName}`,
            product_id: productId,
            product_name: productName,
            metadata: JSON.stringify({
                action,
                timestamp: now(),
            }),
        })
    },

    logFinancialEvent: async (
        title: string,
        description: string,
        amount: number,
        metadata?: any
    ): Promise<void> => {
        await logsService.createLogEntry({
            log_type: LogType.Financial,
            category: LogCategory.Sale,
            title,
            description,
            amount,
            metadata: metadata ? JSON.stringify(metadata) : undefined,
        })
    },

    logSystemEvent: async (
        title: string,
        description: string,
        category: LogCategory = LogCategory.System
    ): Promise<void> => {
        await logsService.createLogEntry({
            log_type: LogType.System,
            category,
            title,
            description,
        })
    },

    logError: async (
        title: string,
        description: string,
        metadata?: any
    ): Promise<void> => {
        await logsService.createLogEntry({
            log_type: LogType.Error,
            category: LogCategory.Error,
            title,
            description,
            metadata: metadata ? JSON.stringify(metadata) : undefined,
        })
    },
}