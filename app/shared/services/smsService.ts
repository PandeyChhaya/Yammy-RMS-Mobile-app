import axios from 'axios';

const API_BASE_URL = 'YOUR_DJANGO_API_URL'; // e.g., 'https://api.yourrestaurant.com'

export interface SMSMessage {
    id: string;
    phone_number: string;
    message: string;
    status: 'pending' | 'sent' | 'delivered' | 'failed';
    sent_at?: string;
    delivered_at?: string;
    error_message?: string;
    template_id?: string;
    ticket_id?: string;
    order_id?: string;
    table_id?: string;
    customer_name?: string;
    provider: 'none' | 'twilio' | 'messagebird' | 'sim800c' | 'sim900a' | 'custom' | 'ncell' | 'ntc';
    cost: number;
    created_at: string;
    updated_at: string;
}

export const smsService = {
    // Send SMS
    async sendSMS(request: {
        phone_number: string;
        message: string;
        template_id?: string;
        ticket_id?: string;
        order_id?: string;
        table_id?: string;
        customer_name?: string;
    }): Promise<SMSMessage> {
        try {
            const response = await axios.post(`${API_BASE_URL}/api/sms/send/`, request);
            return response.data;
        } catch (error) {
            console.error('Error sending SMS:', error);
            throw error;
        }
    },

    // Send ticket notification
    async sendTicketNotification(ticketId: string, customerPhone: string, message: string): Promise<void> {
        try {
            await this.sendSMS({
                phone_number: customerPhone,
                message,
                ticket_id: ticketId
            });
        } catch (error) {
            console.error('Error sending ticket notification:', error);
            throw error;
        }
    },

    // Send order notification
    async sendOrderNotification(orderId: string, tableId: string, customerPhone: string, message: string): Promise<void> {
        try {
            await this.sendSMS({
                phone_number: customerPhone,
                message,
                order_id: orderId,
                table_id: tableId
            });
        } catch (error) {
            console.error('Error sending order notification:', error);
            throw error;
        }
    },

    // Generate ticket message
    generateTicketMessage(data: {
        orderId?: string;
        tableId?: string;
        tableName?: string;
        orderTotal?: number;
        orderItems?: Array<{
            name: string;
            quantity: number;
            price: number;
        }>;
        businessName?: string;
    }): string {
        const { orderId, tableId, tableName, orderTotal, orderItems = [], businessName = 'Your Restaurant' } = data;

        let message = `🍽️ ${businessName}\n\n`;

        if (orderId) {
            message += `Order #${orderId}\n`;
        }

        if (tableId) {
            message += `Table #${tableId}${tableName ? ` (${tableName})` : ''}\n`;
        }

        message += `\n📋 Order Details:\n`;

        orderItems.forEach(item => {
            message += `• ${item.name} x${item.quantity} - Rs. ${item.price.toFixed(2)}\n`;
        });

        if (orderTotal) {
            message += `\n💰 Total: Rs. ${orderTotal.toFixed(2)}\n`;
        }

        message += `\nThank you for your visit! 🙏`;

        return message;
    },

    // Get SMS history
    async getSMSHistory(limit?: number): Promise<SMSMessage[]> {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/sms/history/`, {
                params: { limit }
            });
            return response.data;
        } catch (error) {
            console.error('Error getting SMS history:', error);
            throw error;
        }
    },

    // Get SMS by ID
    async getSMSById(smsId: string): Promise<SMSMessage> {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/sms/${smsId}/`);
            return response.data;
        } catch (error) {
            console.error('Error getting SMS:', error);
            throw error;
        }
    },

    // Get SMS statistics
    async getSMSStats(): Promise<{
        total_sent: number;
        total_delivered: number;
        total_failed: number;
        total_pending: number;
        total_cost: number;
    }> {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/sms/stats/`);
            return response.data;
        } catch (error) {
            console.error('Error getting SMS stats:', error);
            throw error;
        }
    },

    // Configure SMS provider
    async configureSMSProvider(config: {
        provider: SMSMessage['provider'];
        api_key?: string;
        api_secret?: string;
        sender_id?: string;
        phone_number?: string;
    }): Promise<void> {
        try {
            await axios.post(`${API_BASE_URL}/api/sms/configure/`, config);
        } catch (error) {
            console.error('Error configuring SMS provider:', error);
            throw error;
        }
    },

    // Validate phone number (Nepal format)
    validateNepalPhoneNumber(phoneNumber: string): boolean {
        // Nepal phone numbers: 
        // Mobile: 98XXXXXXXX or 97XXXXXXXX (10 digits starting with 98 or 97)
        // With country code: +977-98XXXXXXXX or +977-97XXXXXXXX
        const nepalMobileRegex = /^(\+977)?[-\s]?(98|97)\d{8}$/;
        return nepalMobileRegex.test(phoneNumber.replace(/\s+/g, ''));
    },

    // Format phone number for Nepal
    formatNepalPhoneNumber(phoneNumber: string): string {
        // Remove all non-digit characters
        let cleaned = phoneNumber.replace(/\D/g, '');
        
        // Remove country code if present
        if (cleaned.startsWith('977')) {
            cleaned = cleaned.substring(3);
        }
        
        // Ensure it's 10 digits
        if (cleaned.length === 10) {
            return `+977-${cleaned}`;
        }
        
        return phoneNumber; // Return original if invalid
    },

    // Send bulk SMS
    async sendBulkSMS(requests: Array<{
        phone_number: string;
        message: string;
        customer_name?: string;
    }>): Promise<{ success: number; failed: number; results: SMSMessage[] }> {
        try {
            const response = await axios.post(`${API_BASE_URL}/api/sms/bulk-send/`, {
                messages: requests
            });
            return response.data;
        } catch (error) {
            console.error('Error sending bulk SMS:', error);
            throw error;
        }
    },

    // Generate order ready message (Nepal context)
    generateOrderReadyMessage(data: {
        orderId: string;
        tableName?: string;
        customerName?: string;
        businessName?: string;
    }): string {
        const { orderId, tableName, customerName, businessName = 'Your Restaurant' } = data;
        
        let message = `🍽️ ${businessName}\n\n`;
        
        if (customerName) {
            message += `Hello ${customerName}!\n\n`;
        }
        
        message += `✅ Your order #${orderId} is ready!\n`;
        
        if (tableName) {
            message += `📍 Table: ${tableName}\n`;
        }
        
        message += `\nPlease come and collect your order.\n`;
        message += `\nThank you! 🙏`;
        
        return message;
    },

    // Generate payment confirmation message (Nepal context)
    generatePaymentConfirmationMessage(data: {
        orderId: string;
        total: number;
        paymentMethod: string;
        businessName?: string;
        customerName?: string;
    }): string {
        const { orderId, total, paymentMethod, businessName = 'Your Restaurant', customerName } = data;
        
        let message = `🍽️ ${businessName}\n\n`;
        
        if (customerName) {
            message += `Dear ${customerName},\n\n`;
        }
        
        message += `✅ Payment Confirmed!\n\n`;
        message += `Order #${orderId}\n`;
        message += `Amount: Rs. ${total.toFixed(2)}\n`;
        message += `Payment: ${paymentMethod}\n\n`;
        message += `Thank you for dining with us! 🙏\n`;
        message += `Visit us again soon!`;
        
        return message;
    }
};