import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import { taxService } from '../services/taxService';
import {
    CountryCode,
    CountryTaxConfig,
    DEFAULT_COUNTRY_CONFIGS,
    TaxSettings
} from '../types/tax';

interface UseTaxSettingsReturn {
    // État actuel / Current state
    selectedCountry: CountryCode;
    currentConfig: CountryTaxConfig;
    taxSettings: TaxSettings;
    isLoading: boolean;

    // Actions
    setSelectedCountry: (country: CountryCode) => Promise<void>;
    updateTaxSettings: (settings: Partial<TaxSettings>) => Promise<void>;
    resetToDefaults: () => Promise<void>;

    // Utilitaires / Utilities
    getTaxRateForCategory: (categoryId?: string, categories?: any[]) => number;
    calculateTax: (amount: number, categoryId?: string, categories?: any[]) => number;
    formatAmount: (amount: number) => string;
    getTaxName: () => string;
}

const DEFAULT_TAX_SETTINGS: TaxSettings = {
    selected_country: 'FR',
    countries: DEFAULT_COUNTRY_CONFIGS,
    auto_calculate: true,
    show_tax_details: true,
    round_tax: true
};

const TAX_SETTINGS_KEY = '@tax_settings';

/**
 * Hook pour gérer les paramètres de TVA avec persistance mobile
 * Hook to manage tax settings with mobile persistence
 * 
 * Uses AsyncStorage for persistent storage in React Native
 * 
 * @example
 * ```tsx
 * const {
 *   selectedCountry,
 *   currentConfig,
 *   setSelectedCountry,
 *   calculateTax
 * } = useTaxSettings();
 * 
 * // Change country
 * await setSelectedCountry('US');
 * 
 * // Calculate tax for an item
 * const taxAmount = calculateTax(100, 'food-category');
 * ```
 */
export function useTaxSettings(): UseTaxSettingsReturn {
    const [isLoading, setIsLoading] = useState(true);
    
    // État persistant des paramètres de TVA - stockage mobile avec AsyncStorage
    // Persistent tax settings state - mobile storage with AsyncStorage
    const [taxSettings, setTaxSettings] = useState<TaxSettings>(DEFAULT_TAX_SETTINGS);

    // État local pour la réactivité - toujours synchronisé avec taxSettings
    // Local state for reactivity - always synchronized with taxSettings
    const selectedCountry = taxSettings.selected_country;

    // État réactif pour la configuration actuelle
    // Reactive state for current configuration
    const [currentConfig, setCurrentConfig] = useState<CountryTaxConfig>(() => {
        taxService.setCountryConfig(selectedCountry);
        return taxService.getCurrentConfig();
    });

    // Charger les paramètres depuis AsyncStorage au montage
    // Load settings from AsyncStorage on mount
    useEffect(() => {
        const loadSettings = async () => {
            try {
                const saved = await AsyncStorage.getItem(TAX_SETTINGS_KEY);
                if (saved) {
                    const parsed = JSON.parse(saved);
                    setTaxSettings(parsed);
                }
            } catch (error) {
                console.error('Error loading tax settings:', error);
                // Use defaults on error
            } finally {
                setIsLoading(false);
            }
        };

        loadSettings();
    }, []);

    // Synchroniser avec le service de TVA et mettre à jour la configuration
    // Synchronize with tax service and update configuration
    useEffect(() => {
        taxService.setCountryConfig(selectedCountry);
        setCurrentConfig(taxService.getCurrentConfig());
    }, [selectedCountry]);

    // Mettre à jour le pays sélectionné
    // Update selected country
    const setSelectedCountry = useCallback(async (country: CountryCode) => {
        try {
            const newSettings = {
                ...taxSettings,
                selected_country: country
            };
            setTaxSettings(newSettings);
            await AsyncStorage.setItem(TAX_SETTINGS_KEY, JSON.stringify(newSettings));
        } catch (error) {
            console.error('Error saving selected country:', error);
            throw error;
        }
    }, [taxSettings]);

    // Mettre à jour les paramètres de TVA
    // Update tax settings
    const updateTaxSettings = useCallback(async (settings: Partial<TaxSettings>) => {
        try {
            const newSettings = {
                ...taxSettings,
                ...settings
            };
            setTaxSettings(newSettings);
            await AsyncStorage.setItem(TAX_SETTINGS_KEY, JSON.stringify(newSettings));
        } catch (error) {
            console.error('Error updating tax settings:', error);
            throw error;
        }
    }, [taxSettings]);

    // Réinitialiser aux valeurs par défaut
    // Reset to default values
    const resetToDefaults = useCallback(async () => {
        try {
            setTaxSettings(DEFAULT_TAX_SETTINGS);
            await AsyncStorage.setItem(TAX_SETTINGS_KEY, JSON.stringify(DEFAULT_TAX_SETTINGS));
        } catch (error) {
            console.error('Error resetting tax settings:', error);
            throw error;
        }
    }, []);

    // Obtenir le taux de TVA pour une catégorie
    // Get tax rate for a category
    const getTaxRateForCategory = useCallback((categoryId?: string, categories?: any[]): number => {
        const config = taxService.getCurrentConfig();

        if (config.tax_mode === 'fixed') {
            return config.default_tax_rate;
        }

        if (config.tax_mode === 'category_based' && categoryId) {
            // D'abord chercher dans les catégories de la base de données
            // First search in database categories
            if (categories) {
                const dbCategory = categories.find(cat => cat.id === categoryId);
                if (dbCategory && dbCategory.tax_rate_id) {
                    const taxRate = config.tax_rates.find(rate => rate.id === dbCategory.tax_rate_id);
                    if (taxRate) {
                        return taxRate.rate;
                    }
                }
            }

            // Sinon chercher dans les catégories prédéfinies
            // Otherwise search in predefined categories
            const category = config.tax_categories?.find(cat => cat.id === categoryId);
            if (category) {
                const taxRate = config.tax_rates.find(rate => rate.id === category.tax_rate_id);
                if (taxRate) {
                    return taxRate.rate;
                }
            }
        }

        return config.default_tax_rate;
    }, []);

    // Calculer la TVA pour un montant
    // Calculate tax for an amount
    const calculateTax = useCallback((amount: number, categoryId?: string, categories?: any[]): number => {
        const rate = getTaxRateForCategory(categoryId, categories);
        return Math.round(amount * (rate / 100) * 100) / 100;
    }, [getTaxRateForCategory]);

    // Formater un montant avec la devise
    // Format an amount with currency
    const formatAmount = useCallback((amount: number): string => {
        return taxService.formatAmount(amount);
    }, []);

    // Obtenir le nom de la taxe
    // Get tax name
    const getTaxName = useCallback((): string => {
        return taxService.getTaxName();
    }, []);

    return {
        selectedCountry,
        currentConfig,
        taxSettings,
        isLoading,
        setSelectedCountry,
        updateTaxSettings,
        resetToDefaults,
        getTaxRateForCategory,
        calculateTax,
        formatAmount,
        getTaxName
    };
}