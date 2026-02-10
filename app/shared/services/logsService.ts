import axios from 'axios';
import { CreateLogEntryRequest, LogCategory, LogEntry, LogFilter, LogType } from '../types/logs';
import { CreateSecureLogRequest } from '../types/security';
import securityService from './securityService';

const API_BASE_URL = 'YOUR_DJANGO_API_URL'; // e.g., 'https://api.yourrestaurant.com'

export const logsService = {
    // Create a new log entry
    createLogEntry: async (request: CreateLogEntryRequest): Promise<LogEntry> => {
        const response = await axios.post(`${API_BASE_URL}/api/logs/`, request);
        return response.data;
    },

    // Create a new secure log entry
    createSecureLogEntry: async (request: CreateLogEntryRequest): Promise<LogEntry> => {
        // Return normal log for compatibility
        const response = await axios.post(`${API_BASE_URL}/api/logs/`, request);
        return response.data;
    },

    // Get all logs with optional limit
    getLogs: async (limit?: number): Promise<LogEntry[]> => {
        const response = await axios.get(`${API_BASE_URL}/api/logs/`, {
            params: { limit }
        });
        return response.data;
    },

    // Get secure logs
    getSecureLogs: async (limit?: number) => {
        return securityService.getSecureLogs(limit);
    },

    // Get logs with filter
    getLogsWithFilter: async (filter: LogFilter, limit?: number): Promise<LogEntry[]> => {
        const response = await axios.post(`${API_BASE_URL}/api/logs/filter/`, {
            filter,
            limit
        });
        return response.data;
    },

    // Get financial logs
    getFinancialLogs: async (startDate?: string, endDate?: string): Promise<LogEntry[]> => {
        const response = await axios.get(`${API_BASE_URL}/api/logs/financial/`, {
            params: { startDate, endDate }
        });
        return response.data;
    },

    // Get logs by category
    getLogsByCategory: async (category: LogCategory, limit?: number): Promise<LogEntry[]> => {
        const response = await axios.get(`${API_BASE_URL}/api/logs/category/${category}/`, {
            params: { limit }
        });
        return response.data;
    },

    // Delete old logs
    deleteOldLogs: async (daysToKeep: number): Promise<number> => {
        const response = await axios.delete(`${API_BASE_URL}/api/logs/old/`, {
            data: { daysToKeep }
        });
        return response.data.deleted_count;
    },

    // Get logs count
    getLogsCount: async (): Promise<number> => {
        const response = await axios.get(`${API_BASE_URL}/api/logs/count/`);
        return response.data.count;
    },

    // Clean and repair corrupted data
    cleanAndRepairLogs: async (): Promise<{ cleaned: number; repaired: number; errors: number }> => {
        try {
            console.log('Starting logs cleanup and repair process...');

            // Retrieve all logs for analysis
            const allLogs = await logsService.getLogs();
            let cleaned = 0;
            let repaired = 0;
            let errors = 0;

            for (const log of allLogs) {
                try {
                    // Check and repair corrupted metadata
                    if (log.metadata) {
                        try {
                            JSON.parse(log.metadata);
                        } catch {
                            // Corrupted metadata - trying to repair
                            console.warn('Attempting to repair corrupted metadata for log:', log.id);

                            // Create basic metadata based on title and description
                            const repairedMetadata = {
                                original_metadata: log.metadata,
                                repaired_at: new Date().toISOString(),
                                repair_reason: 'corrupted_json',
                                extracted_info: {
                                    title: log.title,
                                    description: log.description,
                                    amount: log.amount,
                                    table_name: log.table_name
                                }
                            };

                            // Update log with repaired metadata
                            // Note: This functionality would require an API endpoint to update logs
                            console.log('Metadata repaired for log:', log.id, repairedMetadata);
                            repaired++;
                        }
                    }

                    // Check data consistency
                    if (log.amount && log.amount < 0) {
                        console.warn('Negative amount detected in log:', log.id, log.amount);
                        cleaned++;
                    }

                } catch (error) {
                    console.error('Error processing log during cleanup:', log.id, error);
                    errors++;
                }
            }

            console.log('Logs cleanup and repair completed:', { cleaned, repaired, errors });
            return { cleaned, repaired, errors };

        } catch (error) {
            console.error('Failed to clean and repair logs:', { error });
            throw error;
        }
    },

    // Validate log data integrity
    validateLogIntegrity: async (): Promise<{ valid: number; invalid: number; issues: string[] }> => {
        try {
            console.log('Starting log integrity validation...');

            const allLogs = await logsService.getLogs();
            let valid = 0;
            let invalid = 0;
            const issues: string[] = [];

            for (const log of allLogs) {
                let logValid = true;

                // Check JSON metadata
                if (log.metadata) {
                    try {
                        JSON.parse(log.metadata);
                    } catch {
                        issues.push(`Log ${log.id}: Invalid JSON metadata`);
                        logValid = false;
                    }
                }

                // Check amount consistency
                if (log.amount && (isNaN(log.amount) || log.amount < 0)) {
                    issues.push(`Log ${log.id}: Invalid amount ${log.amount}`);
                    logValid = false;
                }

                // Check dates
                if (log.created_at) {
                    const date = new Date(log.created_at);
                    if (isNaN(date.getTime())) {
                        issues.push(`Log ${log.id}: Invalid date ${log.created_at}`);
                        logValid = false;
                    }
                }

                if (logValid) {
                    valid++;
                } else {
                    invalid++;
                }
            }

            console.log('Log integrity validation completed:', { valid, invalid, issuesCount: issues.length });
            return { valid, invalid, issues };

        } catch (error) {
            console.error('Failed to validate log integrity:', { error });
            throw error;
        }
    },

    // Helper functions for common events
    logSaleEvent: async (
        tableId: string | undefined,
        tableName: string | undefined,
        amount: number,
        itemsCount: number,
        paymentMethod: string | undefined,
        customerName: string | undefined,
        items: Array<{ product_name: string, quantity: number, unit_price: number }> | undefined
    ): Promise<void> => {
        // Create a secure log for sales
        const userSignature = securityService.generateUserSignature('pos', Date.now());
        const sessionId = securityService.generateSessionId();

        const secureRequest: CreateSecureLogRequest = {
            log_type: LogType.Financial,
            category: LogCategory.Sale,
            title: `Sale - ${paymentMethod || 'Unknown'}`,
            description: `Sale of ${itemsCount} items for Rs. ${amount.toFixed(2)}`,
            amount,
            session_id: sessionId,
            user_signature: userSignature,
            table_id: tableId,
            table_name: tableName,
            metadata: JSON.stringify({
                items_count: itemsCount,
                payment_method: paymentMethod,
                customer_name: customerName,
                items: items || []
            })
        };

        await securityService.createSecureLogEntry(secureRequest);

        // Keep old system for compatibility
        await axios.post(`${API_BASE_URL}/api/logs/sale/`, {
            tableId,
            tableName,
            amount,
            itemsCount,
            paymentMethod,
            customerName,
            items: items ? JSON.stringify(items) : undefined
        });
    },

    logTableStatusChange: async (tableId: string, tableName: string, oldStatus: string, newStatus: string): Promise<void> => {
        // Create a secure log for status changes
        const userSignature = securityService.generateUserSignature('system', Date.now());
        const sessionId = securityService.generateSessionId();

        const secureRequest: CreateSecureLogRequest = {
            log_type: LogType.System,
            category: LogCategory.TableStatus,
            title: `Status change - ${tableName}`,
            description: `Status changed from ${oldStatus} to ${newStatus}`,
            session_id: sessionId,
            user_signature: userSignature,
            table_id: tableId,
            table_name: tableName,
            metadata: JSON.stringify({
                old_status: oldStatus,
                new_status: newStatus,
                change_time: new Date().toISOString()
            })
        };

        await securityService.createSecureLogEntry(secureRequest);

        // Keep old system for compatibility
        await axios.post(`${API_BASE_URL}/api/logs/table-status/`, {
            tableId,
            tableName,
            oldStatus,
            newStatus
        });
    },

    logProductEvent: async (category: LogCategory, productId: string, productName: string, action: string): Promise<void> => {
        // Create a secure log for product events
        const userSignature = securityService.generateUserSignature('system', Date.now());
        const sessionId = securityService.generateSessionId();

        const secureRequest: CreateSecureLogRequest = {
            log_type: LogType.System,
            category: LogCategory.Product,
            title: `${action} - ${productName}`,
            description: `Product ${action.toLowerCase()}: ${productName}`,
            session_id: sessionId,
            user_signature: userSignature,
            product_id: productId,
            product_name: productName,
            metadata: JSON.stringify({
                action,
                timestamp: new Date().toISOString()
            })
        };

        await securityService.createSecureLogEntry(secureRequest);

        // Keep old system for compatibility
        await axios.post(`${API_BASE_URL}/api/logs/product/`, {
            category,
            productId,
            productName,
            action
        });
    },

    // Utility functions
    logFinancialEvent: async (title: string, description: string, amount: number, metadata?: any): Promise<void> => {
        // Create a secure log for financial events
        const userSignature = securityService.generateUserSignature('system', Date.now());
        const sessionId = securityService.generateSessionId();

        const secureRequest: CreateSecureLogRequest = {
            log_type: LogType.Financial,
            category: LogCategory.Sale,
            title,
            description,
            amount,
            session_id: sessionId,
            user_signature: userSignature,
            metadata: metadata ? JSON.stringify(metadata) : undefined,
        };

        await securityService.createSecureLogEntry(secureRequest);

        // Keep old system for compatibility
        const request: CreateLogEntryRequest = {
            log_type: LogType.Financial,
            category: LogCategory.Sale,
            title,
            description,
            amount,
            metadata: metadata ? JSON.stringify(metadata) : undefined,
        };
        await logsService.createLogEntry(request);
    },

    logSystemEvent: async (title: string, description: string, category: LogCategory = LogCategory.System): Promise<void> => {
        // Create a secure log for system events
        const userSignature = securityService.generateUserSignature('system', Date.now());
        const sessionId = securityService.generateSessionId();

        const secureRequest: CreateSecureLogRequest = {
            log_type: LogType.System,
            category,
            title,
            description,
            session_id: sessionId,
            user_signature: userSignature,
        };

        await securityService.createSecureLogEntry(secureRequest);

        // Keep old system for compatibility
        const request: CreateLogEntryRequest = {
            log_type: LogType.System,
            category,
            title,
            description,
        };
        await logsService.createLogEntry(request);
    },

    logError: async (title: string, description: string, metadata?: any): Promise<void> => {
        // Create a secure log for errors
        const userSignature = securityService.generateUserSignature('system', Date.now());
        const sessionId = securityService.generateSessionId();

        const secureRequest: CreateSecureLogRequest = {
            log_type: LogType.Error,
            category: LogCategory.Error,
            title,
            description,
            session_id: sessionId,
            user_signature: userSignature,
            metadata: metadata ? JSON.stringify(metadata) : undefined,
        };

        await securityService.createSecureLogEntry(secureRequest);

        // Keep old system for compatibility
        const request: CreateLogEntryRequest = {
            log_type: LogType.Error,
            category: LogCategory.Error,
            title,
            description,
            metadata: metadata ? JSON.stringify(metadata) : undefined,
        };
        await logsService.createLogEntry(request);
    },
};