import AsyncStorage from '@react-native-async-storage/async-storage'
import {
    BusinessInfo,
    SystemConfig,
    TaxSettings,
    UserPreferences,
    DEFAULT_BUSINESS_INFO,
    DEFAULT_TAX_SETTINGS,
    DEFAULT_USER_PREFERENCES,
    DEFAULT_SYSTEM_CONFIG,
} from '../types/business'

// Storage keys
const STORAGE_KEYS = {
    BUSINESS_INFO: '@business/info',
    TAX_SETTINGS: '@business/tax_settings',
    USER_PREFERENCES: '@business/user_preferences',
    SYSTEM_CONFIG: '@business/system_config',
}

export class BusinessService {
    // Business Info
    static async getBusinessInfo(): Promise<BusinessInfo> {
        try {
            const stored = await AsyncStorage.getItem(STORAGE_KEYS.BUSINESS_INFO)
            if (stored) {
                return JSON.parse(stored)
            }
            // Return default if not found
            return DEFAULT_BUSINESS_INFO
        } catch (error) {
            console.error('Error getting business info:', error)
            throw error
        }
    }

    static async saveBusinessInfo(info: BusinessInfo): Promise<void> {
        try {
            await AsyncStorage.setItem(STORAGE_KEYS.BUSINESS_INFO, JSON.stringify(info))
        } catch (error) {
            console.error('Error saving business info:', error)
            throw error
        }
    }

    // Tax Settings
    static async getTaxSettings(): Promise<TaxSettings> {
        try {
            const stored = await AsyncStorage.getItem(STORAGE_KEYS.TAX_SETTINGS)
            if (stored) {
                return JSON.parse(stored)
            }
            // Return default if not found
            return DEFAULT_TAX_SETTINGS
        } catch (error) {
            console.error('Error getting tax settings:', error)
            throw error
        }
    }

    static async saveTaxSettings(settings: TaxSettings): Promise<void> {
        try {
            await AsyncStorage.setItem(STORAGE_KEYS.TAX_SETTINGS, JSON.stringify(settings))
        } catch (error) {
            console.error('Error saving tax settings:', error)
            throw error
        }
    }

    // User Preferences
    static async getUserPreferences(): Promise<UserPreferences> {
        try {
            const stored = await AsyncStorage.getItem(STORAGE_KEYS.USER_PREFERENCES)
            if (stored) {
                return JSON.parse(stored)
            }
            // Return default if not found
            return DEFAULT_USER_PREFERENCES
        } catch (error) {
            console.error('Error getting user preferences:', error)
            throw error
        }
    }

    static async saveUserPreferences(preferences: UserPreferences): Promise<void> {
        try {
            await AsyncStorage.setItem(STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(preferences))
        } catch (error) {
            console.error('Error saving user preferences:', error)
            throw error
        }
    }

    // System Config
    static async getSystemConfig(): Promise<SystemConfig> {
        try {
            const stored = await AsyncStorage.getItem(STORAGE_KEYS.SYSTEM_CONFIG)
            if (stored) {
                return JSON.parse(stored)
            }
            // Return default if not found
            return DEFAULT_SYSTEM_CONFIG
        } catch (error) {
            console.error('Error getting system config:', error)
            throw error
        }
    }

    static async saveSystemConfig(config: SystemConfig): Promise<void> {
        try {
            await AsyncStorage.setItem(STORAGE_KEYS.SYSTEM_CONFIG, JSON.stringify(config))
        } catch (error) {
            console.error('Error saving system config:', error)
            throw error
        }
    }

    // Utility methods
    static async getAllSettings() {
        try {
            const [businessInfo, taxSettings, userPreferences, systemConfig] = await Promise.all([
                this.getBusinessInfo(),
                this.getTaxSettings(),
                this.getUserPreferences(),
                this.getSystemConfig(),
            ])

            return {
                business_info: businessInfo,
                tax_settings: taxSettings,
                user_preferences: userPreferences,
                system_config: systemConfig,
            }
        } catch (error) {
            console.error('Error getting all settings:', error)
            throw error
        }
    }

    static async saveAllSettings(settings: {
        business_info: BusinessInfo
        tax_settings: TaxSettings
        user_preferences: UserPreferences
        system_config: SystemConfig
    }) {
        try {
            await Promise.all([
                this.saveBusinessInfo(settings.business_info),
                this.saveTaxSettings(settings.tax_settings),
                this.saveUserPreferences(settings.user_preferences),
                this.saveSystemConfig(settings.system_config),
            ])
        } catch (error) {
            console.error('Error saving all settings:', error)
            throw error
        }
    }

    // Clear all business data (useful for reset/logout)
    static async clearAllSettings(): Promise<void> {
        try {
            await AsyncStorage.multiRemove([
                STORAGE_KEYS.BUSINESS_INFO,
                STORAGE_KEYS.TAX_SETTINGS,
                STORAGE_KEYS.USER_PREFERENCES,
                STORAGE_KEYS.SYSTEM_CONFIG,
            ])
        } catch (error) {
            console.error('Error clearing all settings:', error)
            throw error
        }
    }

    // Initialize with defaults if not exists
    static async initializeDefaults(): Promise<void> {
        try {
            const keys = await AsyncStorage.getAllKeys()
            const storageKeys = Object.values(STORAGE_KEYS)

            // Check which keys are missing and initialize them
            const missingKeys = storageKeys.filter(key => !keys.includes(key))

            if (missingKeys.includes(STORAGE_KEYS.BUSINESS_INFO)) {
                await this.saveBusinessInfo(DEFAULT_BUSINESS_INFO)
            }
            if (missingKeys.includes(STORAGE_KEYS.TAX_SETTINGS)) {
                await this.saveTaxSettings(DEFAULT_TAX_SETTINGS)
            }
            if (missingKeys.includes(STORAGE_KEYS.USER_PREFERENCES)) {
                await this.saveUserPreferences(DEFAULT_USER_PREFERENCES)
            }
            if (missingKeys.includes(STORAGE_KEYS.SYSTEM_CONFIG)) {
                await this.saveSystemConfig(DEFAULT_SYSTEM_CONFIG)
            }
        } catch (error) {
            console.error('Error initializing defaults:', error)
            throw error
        }
    }
}