import AsyncStorage from '@react-native-async-storage/async-storage'
import { useCallback, useEffect, useState } from 'react'
import { taxService } from '../services/taxService'
import {
    CountryCode,
    CountryTaxConfig,
    DEFAULT_COUNTRY_CONFIGS,
    TaxSettings
} from '../types/tax'

// Storage key for AsyncStorage
const STORAGE_KEY = '@taxSettings'

// Return type for the hook
export default interface UseTaxSettingsReturn {
    selectedCountry: CountryCode
    currentConfig: CountryTaxConfig
    taxSettings: TaxSettings
    setSelectedCountry: (country: CountryCode) => void
    updateTaxSettings: (settings: Partial<TaxSettings>) => void
    resetToDefaults: () => void
    getTaxRateForCategory: (categoryId?: string, categories?: any[]) => number
    calculateTax: (amount: number, categoryId?: string, categories?: any[]) => number
    formatAmount: (amount: number) => string
    getTaxName: () => string
}

// Default tax settings — locked to Nepal (NP)
const DEFAULT_TAX_SETTINGS: TaxSettings = {
    selected_country: 'NP',
    countries: DEFAULT_COUNTRY_CONFIGS,
    auto_calculate: true,
    show_tax_details: true,
    round_tax: true,
}

export function useTaxSettings(): UseTaxSettingsReturn {

    const [taxSettings, setTaxSettings] = useState<TaxSettings>(DEFAULT_TAX_SETTINGS)

    const [currentConfig, setCurrentConfig] = useState<CountryTaxConfig>(() => {
        // Set Nepal as default country config on first load
        taxService.setCountryConfig('NP')
        return taxService.getCurrentConfig()
    })

    // ─────────────────────────────────────────
    // Load saved settings from AsyncStorage on mount
    // ─────────────────────────────────────────
    useEffect(() => {
        const loadSettings = async () => {
            try {
                const saved = await AsyncStorage.getItem(STORAGE_KEY)
                if (saved) {
                    const parsed = JSON.parse(saved)
                    // Always force Nepal regardless of what was saved
                    parsed.selected_country = 'NP'
                    setTaxSettings(parsed)
                }
            } catch (error) {
                console.error('Error loading tax settings:', error)
                setTaxSettings(DEFAULT_TAX_SETTINGS)
            }
        }

        loadSettings()
    }, [])

    // ─────────────────────────────────────────
    // Sync taxService whenever selected country changes
    // ─────────────────────────────────────────
    useEffect(() => {
        taxService.setCountryConfig(taxSettings.selected_country)
        setCurrentConfig(taxService.getCurrentConfig())
    }, [taxSettings.selected_country])

    const selectedCountry = taxSettings.selected_country

    // ─────────────────────────────────────────
    // Set selected country — locked to Nepal
    // ─────────────────────────────────────────
    const setSelectedCountry = useCallback((country: CountryCode) => {
        // Note: country parameter kept for interface compatibility
        // but app is locked to Nepal (NP) only
        const newSettings: TaxSettings = {
            ...taxSettings,
            selected_country: 'NP' as CountryCode
        }
        setTaxSettings(newSettings)
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings))
            .catch(error => console.error('Error saving country setting:', error))
    }, [taxSettings])

    // ─────────────────────────────────────────
    // Update partial tax settings
    // ─────────────────────────────────────────
    const updateTaxSettings = useCallback((settings: Partial<TaxSettings>) => {
        const newSettings: TaxSettings = {
            ...taxSettings,
            ...settings,
            selected_country: 'NP' as CountryCode, // always lock to Nepal
        }
        setTaxSettings(newSettings)
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings))
            .catch(error => console.error('Error updating tax settings:', error))
    }, [taxSettings])

    // ─────────────────────────────────────────
    // Reset everything back to default settings
    // ─────────────────────────────────────────
    const resetToDefaults = useCallback(() => {
        setTaxSettings(DEFAULT_TAX_SETTINGS)
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_TAX_SETTINGS))
            .catch(error => console.error('Error resetting tax settings:', error))
    }, [])

    // ─────────────────────────────────────────
    // Get tax rate for a specific category
    // Returns default rate if no category match found
    // ─────────────────────────────────────────
    const getTaxRateForCategory = useCallback((
        categoryId?: string,
        categories?: any[]
    ): number => {
        const config = taxService.getCurrentConfig()

        // Fixed mode — same tax rate for everything
        if (config.tax_mode === 'fixed') {
            return config.default_tax_rate
        }

        // Category based mode — different rates per category
        if (config.tax_mode === 'category_based' && categoryId) {

            // Check database categories first
            if (categories) {
                const dbCategory = categories.find(cat => cat.id === categoryId)
                if (dbCategory?.tax_rate_id) {
                    const taxRate = config.tax_rates.find(
                        rate => rate.id === dbCategory.tax_rate_id
                    )
                    if (taxRate) return taxRate.rate
                }
            }

            // Fall back to config categories
            const category = config.tax_categories?.find(cat => cat.id === categoryId)
            if (category) {
                const taxRate = config.tax_rates.find(
                    rate => rate.id === category.tax_rate_id
                )
                if (taxRate) return taxRate.rate
            }
        }

        // Default rate if nothing matched
        return config.default_tax_rate
    }, [])

    // ─────────────────────────────────────────
    // Calculate tax amount for a given price
    // Rounds to 2 decimal places
    // ─────────────────────────────────────────
    const calculateTax = useCallback((
        amount: number,
        categoryId?: string,
        categories?: any[]
    ): number => {
        const rate = getTaxRateForCategory(categoryId, categories)
        return Math.round(amount * (rate / 100) * 100) / 100
    }, [getTaxRateForCategory])

    // ─────────────────────────────────────────
    // Format a currency amount (e.g. NPR 1,500.00)
    // ─────────────────────────────────────────
    const formatAmount = useCallback((amount: number): string => {
        return taxService.formatAmount(amount)
    }, [])

    // ─────────────────────────────────────────
    // Get the tax name for current country
    // e.g. "VAT" for Nepal
    // ─────────────────────────────────────────
    const getTaxName = useCallback((): string => {
        return taxService.getTaxName()
    }, [])

    return {
        selectedCountry,
        currentConfig,
        taxSettings,
        setSelectedCountry,
        updateTaxSettings,
        resetToDefaults,
        getTaxRateForCategory,
        calculateTax,
        formatAmount,
        getTaxName,
    }
}