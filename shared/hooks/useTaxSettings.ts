import AsyncStorage from '@react-native-async-storage/async-storage'
import { useCallback, useEffect, useState } from 'react'
import { taxService } from '../services/taxService'
import {
    CountryCode,
    CountryTaxConfig,
    DEFAULT_COUNTRY_CONFIGS,
    TaxSettings
} from '../types/tax'

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
        taxService.setCountryConfig('NP')
        return taxService.getCurrentConfig()
    })

    // Load persisted settings from AsyncStorage on mount
    useEffect(() => {
        AsyncStorage.getItem('taxSettings').then(saved => {
            if (saved) {
                try {
                    const parsed = JSON.parse(saved)
                    // Force Nepal regardless of what was saved
                    parsed.selected_country = 'NP'
                    setTaxSettings(parsed)
                } catch {
                    setTaxSettings(DEFAULT_TAX_SETTINGS)
                }
            }
        })
    }, [])

    // Sync taxService whenever selected country changes
    useEffect(() => {
        taxService.setCountryConfig(taxSettings.selected_country)
        setCurrentConfig(taxService.getCurrentConfig())
    }, [taxSettings.selected_country])

    const selectedCountry = taxSettings.selected_country

    const setSelectedCountry = useCallback((country: CountryCode) => {
        // Always lock to Nepal
        const newSettings = { ...taxSettings, selected_country: 'NP' as CountryCode }
        setTaxSettings(newSettings)
        AsyncStorage.setItem('taxSettings', JSON.stringify(newSettings))
    }, [taxSettings])

    const updateTaxSettings = useCallback((settings: Partial<TaxSettings>) => {
        const newSettings = {
            ...taxSettings,
            ...settings,
            selected_country: 'NP' as CountryCode, // always Nepal
        }
        setTaxSettings(newSettings)
        AsyncStorage.setItem('taxSettings', JSON.stringify(newSettings))
    }, [taxSettings])

    const resetToDefaults = useCallback(() => {
        setTaxSettings(DEFAULT_TAX_SETTINGS)
        AsyncStorage.setItem('taxSettings', JSON.stringify(DEFAULT_TAX_SETTINGS))
    }, [])

    const getTaxRateForCategory = useCallback((categoryId?: string, categories?: any[]): number => {
        const config = taxService.getCurrentConfig()

        if (config.tax_mode === 'fixed') {
            return config.default_tax_rate
        }

        if (config.tax_mode === 'category_based' && categoryId) {
            if (categories) {
                const dbCategory = categories.find(cat => cat.id === categoryId)
                if (dbCategory?.tax_rate_id) {
                    const taxRate = config.tax_rates.find(rate => rate.id === dbCategory.tax_rate_id)
                    if (taxRate) return taxRate.rate
                }
            }

            const category = config.tax_categories?.find(cat => cat.id === categoryId)
            if (category) {
                const taxRate = config.tax_rates.find(rate => rate.id === category.tax_rate_id)
                if (taxRate) return taxRate.rate
            }
        }

        return config.default_tax_rate
    }, [])

    const calculateTax = useCallback((amount: number, categoryId?: string, categories?: any[]): number => {
        const rate = getTaxRateForCategory(categoryId, categories)
        return Math.round(amount * (rate / 100) * 100) / 100
    }, [getTaxRateForCategory])

    const formatAmount = useCallback((amount: number): string => {
        return taxService.formatAmount(amount)
    }, [])

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