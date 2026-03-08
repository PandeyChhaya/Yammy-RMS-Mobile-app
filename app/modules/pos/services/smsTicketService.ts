import AsyncStorage from '@react-native-async-storage/async-storage'
import { toBackendProvider, toFrontendProvider } from './providerMapping'



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

export interface SMSTemplate {
    id: string
    name: string
    content: string
    variables?: string[]
    is_active: boolean
    category: string
    created_at: string
    updated_at: string
}

export interface SMSContact {
    id: string
    name: string
    phone_number: string
    email?: string
    company?: string
    tags?: string[]
    is_active: boolean
    last_contact?: string
    created_at: string
    updated_at: string
}

export interface SMSConfig {
    id: number
    provider: 'none' | 'sms_gateway_android' | 'infobip' | 'sim800_900' | 'twilio' | 'messagebird' | 'sim800c' | 'sim900a' | 'custom'
    api_key?: string
    api_secret?: string
    sender_name?: string
    webhook_url?: string
    sim_port?: string
    sim_baud_rate?: number
    is_enabled: boolean
    created_at: string
    updated_at: string
}

export interface SMSGatewayAndroidConfig {
    id?: number
    device_ip: string
    port: number
    username: string
    password: string
    is_enabled: boolean
    created_at?: string
    updated_at?: string
}

export interface InfobipConfig {
    id?: number
    api_key: string
    base_url: string
    sender_name: string
    is_enabled: boolean
    created_at?: string
    updated_at?: string
}

export interface SIM800900Config {
    id?: number
    port: string
    baud_rate: number
    pin_code?: string
    is_enabled: boolean
    created_at?: string
    updated_at?: string
}

export interface ProviderSelection {
    default_provider: 'none' | 'sms_gateway_android' | 'infobip' | 'sim800_900'
    simulation_mode: boolean
}

export interface SMSConversation {
    id: string
    contact_id: string
    phone_number: string
    last_message?: string
    last_message_at?: string
    unread_count: number
    is_archived: boolean
    created_at: string
    updated_at: string
}

const STORAGE_KEYS = {
    SMS_MESSAGES: '@sms_messages',
    SMS_TEMPLATES: '@sms_templates',
    SMS_CONTACTS: '@sms_contacts',
    SMS_CONFIG: '@sms_config',
    SMS_CONVERSATIONS: '@sms_conversations',
    PROVIDER_SELECTION: '@provider_selection',
    GATEWAY_ANDROID_CONFIG: '@gateway_android_config',
    INFOBIP_CONFIG: '@infobip_config',
    SIM800900_CONFIG: '@sim800900_config',
}

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

export const smsTicketService = {
    async sendSMS(request: {
        phone_number: string
        message: string
        template_id?: string
        ticket_id?: string
        order_id?: string
        table_id?: string
        customer_name?: string
    }): Promise<SMSMessage> {
        try {
            console.log('smsTicketService.sendSMS - Request:', request)
            
            const messages = await smsTicketService.getSMSMessages()
            const config = await smsTicketService.getSMSConfig()
            
            const newMessage: SMSMessage = {
                id: generateId(),
                phone_number: request.phone_number,
                message: request.message,
                template_id: request.template_id,
                ticket_id: request.ticket_id,
                order_id: request.order_id,
                table_id: request.table_id,
                customer_name: request.customer_name,
                status: 'sent',
                provider: config.provider,
                cost: 0,
                sent_at: new Date().toISOString(),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            }
            
            messages.push(newMessage)
            await AsyncStorage.setItem(STORAGE_KEYS.SMS_MESSAGES, JSON.stringify(messages))
            
            console.log('smsTicketService.sendSMS - Message sent:', newMessage)
            return newMessage
        } catch (error) {
            console.error('smsTicketService.sendSMS - Error:', error)
            throw error
        }
    },

    async getSMSMessages(limit?: number): Promise<SMSMessage[]> {
        try {
            const json = await AsyncStorage.getItem(STORAGE_KEYS.SMS_MESSAGES)
            const messages: SMSMessage[] = json ? JSON.parse(json) : []
            return limit ? messages.slice(0, limit) : messages
        } catch (error) {
            console.error('Error fetching SMS messages:', error)
            return []
        }
    },

    async getSMSMessageById(id: string): Promise<SMSMessage | null> {
        try {
            const messages = await smsTicketService.getSMSMessages()
            return messages.find(msg => msg.id === id) || null
        } catch (error) {
            console.error('Error fetching SMS message:', error)
            return null
        }
    },

    async getSMSTemplates(): Promise<SMSTemplate[]> {
        try {
            const json = await AsyncStorage.getItem(STORAGE_KEYS.SMS_TEMPLATES)
            return json ? JSON.parse(json) : []
        } catch (error) {
            console.error('Error fetching SMS templates:', error)
            return []
        }
    },

    async createSMSTemplate(template: {
        name: string
        content: string
        variables?: string[]
        category: string
    }): Promise<SMSTemplate> {
        try {
            const templates = await smsTicketService.getSMSTemplates()
            const newTemplate: SMSTemplate = {
                id: generateId(),
                ...template,
                is_active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            }
            templates.push(newTemplate)
            await AsyncStorage.setItem(STORAGE_KEYS.SMS_TEMPLATES, JSON.stringify(templates))
            return newTemplate
        } catch (error) {
            console.error('Error creating SMS template:', error)
            throw error
        }
    },

    async updateSMSTemplate(id: string, template: {
        name?: string
        content?: string
        variables?: string[]
        category?: string
        is_active?: boolean
    }): Promise<SMSTemplate> {
        try {
            const templates = await smsTicketService.getSMSTemplates()
            const index = templates.findIndex(t => t.id === id)
            if (index === -1) throw new Error('Template not found')
            
            templates[index] = {
                ...templates[index],
                ...template,
                updated_at: new Date().toISOString(),
            }
            await AsyncStorage.setItem(STORAGE_KEYS.SMS_TEMPLATES, JSON.stringify(templates))
            return templates[index]
        } catch (error) {
            console.error('Error updating SMS template:', error)
            throw error
        }
    },

    async deleteSMSTemplate(id: string): Promise<void> {
        try {
            const templates = await smsTicketService.getSMSTemplates()
            const filtered = templates.filter(t => t.id !== id)
            await AsyncStorage.setItem(STORAGE_KEYS.SMS_TEMPLATES, JSON.stringify(filtered))
        } catch (error) {
            console.error('Error deleting SMS template:', error)
            throw error
        }
    },

    async getSMSContacts(): Promise<SMSContact[]> {
        try {
            const json = await AsyncStorage.getItem(STORAGE_KEYS.SMS_CONTACTS)
            return json ? JSON.parse(json) : []
        } catch (error) {
            console.error('Error fetching SMS contacts:', error)
            return []
        }
    },

    async createSMSContact(contact: {
        name: string
        phone_number: string
        email?: string
        company?: string
        tags?: string[]
    }): Promise<SMSContact> {
        try {
            const contacts = await smsTicketService.getSMSContacts()
            const newContact: SMSContact = {
                id: generateId(),
                ...contact,
                is_active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            }
            contacts.push(newContact)
            await AsyncStorage.setItem(STORAGE_KEYS.SMS_CONTACTS, JSON.stringify(contacts))
            return newContact
        } catch (error) {
            console.error('Error creating SMS contact:', error)
            throw error
        }
    },

    async updateSMSContact(id: string, contact: {
        name?: string
        phone_number?: string
        email?: string
        company?: string
        tags?: string[]
        is_active?: boolean
    }): Promise<SMSContact> {
        try {
            const contacts = await smsTicketService.getSMSContacts()
            const index = contacts.findIndex(c => c.id === id)
            if (index === -1) throw new Error('Contact not found')
            
            contacts[index] = {
                ...contacts[index],
                ...contact,
                updated_at: new Date().toISOString(),
            }
            await AsyncStorage.setItem(STORAGE_KEYS.SMS_CONTACTS, JSON.stringify(contacts))
            return contacts[index]
        } catch (error) {
            console.error('Error updating SMS contact:', error)
            throw error
        }
    },

    async deleteSMSContact(id: string): Promise<void> {
        try {
            const contacts = await smsTicketService.getSMSContacts()
            const filtered = contacts.filter(c => c.id !== id)
            await AsyncStorage.setItem(STORAGE_KEYS.SMS_CONTACTS, JSON.stringify(filtered))
        } catch (error) {
            console.error('Error deleting SMS contact:', error)
            throw error
        }
    },

    async getSMSConfig(): Promise<SMSConfig> {
        try {
            const json = await AsyncStorage.getItem(STORAGE_KEYS.SMS_CONFIG)
            if (json) {
                return JSON.parse(json)
            }
            
            const defaultConfig: SMSConfig = {
                id: 1,
                provider: 'none',
                is_enabled: false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            }
            await AsyncStorage.setItem(STORAGE_KEYS.SMS_CONFIG, JSON.stringify(defaultConfig))
            return defaultConfig
        } catch (error) {
            console.error('Error fetching SMS config:', error)
            throw error
        }
    },

    async updateSMSConfig(config: {
        provider?: 'none' | 'sms_gateway_android' | 'infobip' | 'sim800_900' | 'twilio' | 'messagebird' | 'sim800c' | 'sim900a' | 'custom'
        api_key?: string
        api_secret?: string
        sender_name?: string
        webhook_url?: string
        sim_port?: string
        sim_baud_rate?: number
        is_enabled?: boolean
    }): Promise<SMSConfig> {
        try {
            const currentConfig = await smsTicketService.getSMSConfig()
            const updatedConfig: SMSConfig = {
                ...currentConfig,
                ...config,
                updated_at: new Date().toISOString(),
            }
            await AsyncStorage.setItem(STORAGE_KEYS.SMS_CONFIG, JSON.stringify(updatedConfig))
            return updatedConfig
        } catch (error) {
            console.error('Error updating SMS config:', error)
            throw error
        }
    },

    async getProviderSelection(): Promise<ProviderSelection> {
        try {
            const json = await AsyncStorage.getItem(STORAGE_KEYS.PROVIDER_SELECTION)
            if (json) {
                const selection = JSON.parse(json)
                return {
                    default_provider: toFrontendProvider(selection.default_provider as any) as any,
                    simulation_mode: selection.simulation_mode
                }
            }
            
            const defaultSelection: ProviderSelection = {
                default_provider: 'none',
                simulation_mode: true
            }
            return defaultSelection
        } catch (error) {
            console.error('Error fetching provider selection:', error)
            return {
                default_provider: 'none',
                simulation_mode: true
            }
        }
    },

    async updateProviderSelection(selection: ProviderSelection): Promise<ProviderSelection> {
        try {
            const storageData = {
                default_provider: toBackendProvider(selection.default_provider as any),
                simulation_mode: selection.simulation_mode
            }
            await AsyncStorage.setItem(STORAGE_KEYS.PROVIDER_SELECTION, JSON.stringify(storageData))
            return selection
        } catch (error) {
            console.error('Error updating provider selection:', error)
            throw error
        }
    },

    async getSMSGatewayAndroidConfig(): Promise<SMSGatewayAndroidConfig | null> {
        try {
            const json = await AsyncStorage.getItem(STORAGE_KEYS.GATEWAY_ANDROID_CONFIG)
            return json ? JSON.parse(json) : null
        } catch (error) {
            console.error('Error fetching SMS Gateway Android config:', error)
            return null
        }
    },

    async updateSMSGatewayAndroidConfig(config: Omit<SMSGatewayAndroidConfig, 'id' | 'created_at' | 'updated_at'>): Promise<SMSGatewayAndroidConfig> {
        try {
            const updatedConfig: SMSGatewayAndroidConfig = {
                id: 1,
                ...config,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            }
            await AsyncStorage.setItem(STORAGE_KEYS.GATEWAY_ANDROID_CONFIG, JSON.stringify(updatedConfig))
            return updatedConfig
        } catch (error) {
            console.error('Error updating SMS Gateway Android config:', error)
            throw error
        }
    },

    async testSMSGatewayAndroidConnection(config: Omit<SMSGatewayAndroidConfig, 'id' | 'created_at' | 'updated_at'> & { test_phone?: string; test_message?: string }): Promise<boolean> {
        try {
            console.log('Testing SMS Gateway Android connection:', config)

            if (!config.device_ip || !config.port || !config.username || !config.password) {
                throw new Error('Configuration SMS Gateway Android incomplète')
            }

            if (!config.test_phone || !config.test_message) {
                throw new Error('Numéro de test et message requis')
            }

            console.log('SMS Gateway Android test - simulated success')
            return true
        } catch (error) {
            console.error('Error testing SMS Gateway Android connection:', error)
            throw error
        }
    },

    async getInfobipConfig(): Promise<InfobipConfig | null> {
        try {
            const json = await AsyncStorage.getItem(STORAGE_KEYS.INFOBIP_CONFIG)
            return json ? JSON.parse(json) : null
        } catch (error) {
            console.error('Error fetching Infobip config:', error)
            return null
        }
    },

    async updateInfobipConfig(config: Omit<InfobipConfig, 'id' | 'created_at' | 'updated_at'>): Promise<InfobipConfig> {
        try {
            const updatedConfig: InfobipConfig = {
                id: 1,
                ...config,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            }
            await AsyncStorage.setItem(STORAGE_KEYS.INFOBIP_CONFIG, JSON.stringify(updatedConfig))
            return updatedConfig
        } catch (error) {
            console.error('Error updating Infobip config:', error)
            throw error
        }
    },

    async testInfobipConnection(config: Omit<InfobipConfig, 'id' | 'created_at' | 'updated_at'> & { test_phone?: string; test_message?: string }): Promise<boolean> {
        try {
            console.log('Testing Infobip connection:', config)

            if (!config.api_key || !config.base_url || !config.sender_name) {
                throw new Error('Configuration Infobip incomplète')
            }

            if (!config.test_phone || !config.test_message) {
                throw new Error('Numéro de test et message requis')
            }

            console.log('Infobip test - simulated success')
            return true
        } catch (error) {
            console.error('Error testing Infobip connection:', error)
            throw error
        }
    },

    async getSIM800900Config(): Promise<SIM800900Config | null> {
        try {
            const json = await AsyncStorage.getItem(STORAGE_KEYS.SIM800900_CONFIG)
            return json ? JSON.parse(json) : null
        } catch (error) {
            console.error('Error fetching SIM 800/900 config:', error)
            return null
        }
    },

    async updateSIM800900Config(config: Omit<SIM800900Config, 'id' | 'created_at' | 'updated_at'>): Promise<SIM800900Config> {
        try {
            const updatedConfig: SIM800900Config = {
                id: 1,
                ...config,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            }
            await AsyncStorage.setItem(STORAGE_KEYS.SIM800900_CONFIG, JSON.stringify(updatedConfig))
            return updatedConfig
        } catch (error) {
            console.error('Error updating SIM 800/900 config:', error)
            throw error
        }
    },

    async scanSerialPorts(): Promise<string[]> {
        try {
            console.log('Scanning serial ports...')
            return ['COM1', 'COM3', 'USB1', 'USB2']
        } catch (error) {
            console.error('Error scanning serial ports:', error)
            return []
        }
    },

    async getSMSConversations(): Promise<SMSConversation[]> {
        try {
            const json = await AsyncStorage.getItem(STORAGE_KEYS.SMS_CONVERSATIONS)
            return json ? JSON.parse(json) : []
        } catch (error) {
            console.error('Error fetching SMS conversations:', error)
            return []
        }
    },

    async getSMSConversationMessages(conversationId: string): Promise<SMSMessage[]> {
        try {
            const messages = await smsTicketService.getSMSMessages()
            const conversations = await smsTicketService.getSMSConversations()
            const conversation = conversations.find(c => c.id === conversationId)
            
            if (!conversation) return []
            
            return messages.filter(msg => msg.phone_number === conversation.phone_number)
        } catch (error) {
            console.error('Error fetching conversation messages:', error)
            return []
        }
    },

    async sendTicketNotification(ticketId: string, customerPhone: string, message: string): Promise<void> {
        try {
            await smsTicketService.sendSMS({
                phone_number: customerPhone,
                message,
                ticket_id: ticketId
            })
        } catch (error) {
            console.error('Error sending ticket notification:', error)
            throw error
        }
    },

    async sendOrderNotification(orderId: string, tableId: string, customerPhone: string, message: string): Promise<void> {
        try {
            await smsTicketService.sendSMS({
                phone_number: customerPhone,
                message,
                order_id: orderId,
                table_id: tableId
            })
        } catch (error) {
            console.error('Error sending order notification:', error)
            throw error
        }
    },

    async ensureContactExists(phoneNumber: string, customerName?: string): Promise<SMSContact | null> {
        try {
            const contacts = await smsTicketService.getSMSContacts()
            const existingContact = contacts.find(c => c.phone_number === phoneNumber)

            if (existingContact) {
                return existingContact
            }

            if (customerName) {
                return await smsTicketService.createSMSContact({
                    name: customerName,
                    phone_number: phoneNumber,
                    tags: ['auto-created']
                })
            }

            return null
        } catch (error) {
            console.error('Error ensuring contact exists:', error)
            return null
        }
    }
}