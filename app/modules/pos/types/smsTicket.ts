export interface SMSMessage {
    id: string
    phone_number: string
    message: string
    status: 'pending' | 'sent' | 'delivered' | 'failed'
    sent_at?: string
    delivered_at?: string
    error_message?: string
    template_id?: string
    ticket_id?: string
    order_id?: string
    table_id?: string
    customer_name?: string
    provider: 'none' | 'sms_gateway_android' | 'infobip' | 'sim800_900' | 'twilio' | 'messagebird' | 'sim800c' | 'sim900a' | 'custom'
    cost: number
    created_at: string
    updated_at: string
}
