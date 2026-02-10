import {
    CountryCode,
    CountryTaxConfig,
    DEFAULT_COUNTRY_CONFIGS,
    TaxBreakdown,
    TaxCalculation,
    TaxMode
} from '../types/tax'

export class TaxService {
    private static instance: TaxService
    private currentConfig: CountryTaxConfig

    private constructor() {
    // By default, use the Nepal tax configuration
    this.currentConfig = DEFAULT_COUNTRY_CONFIGS.NP
}


    static getInstance(): TaxService {
        if (!TaxService.instance) {
            TaxService.instance = new TaxService()
        }
        return TaxService.instance
    }

    /**
     * Set the tax (VAT) configuration for a country
     */
    setCountryConfig(countryCode: CountryCode): void {
        this.currentConfig = DEFAULT_COUNTRY_CONFIGS[countryCode]
    }

    /**
     * Get the current tax configuration
     */
    getCurrentConfig(): CountryTaxConfig {
        return this.currentConfig
    }

    /**
     * Calculate tax (VAT) for a given amount
     */
    calculateTax(subtotal: number, categoryId?: string): TaxCalculation {
        const taxRate = this.getTaxRateForCategory(categoryId)
        const taxAmount = this.calculateTaxAmount(subtotal, taxRate)

        return {
            subtotal,
            tax_amount: taxAmount,
            total: subtotal + taxAmount,
            tax_breakdown: [{
                tax_rate_id: taxRate.id,
                tax_rate_name: taxRate.name,
                rate: taxRate.rate,
                taxable_amount: subtotal,
                tax_amount: taxAmount
            }]
        }
    }

    /**
     * Calculate tax (VAT) for a cart with multiple items
     */
    calculateCartTax(items: Array<{
        subtotal: number,
        category_id?: string,
        product_id?: string
    }>): TaxCalculation {
        const taxBreakdowns = new Map<string, TaxBreakdown>()
        let totalSubtotal = 0

        // Group items by tax rate
        items.forEach(item => {
            const taxRate = this.getTaxRateForCategory(item.category_id)
            const existingBreakdown = taxBreakdowns.get(taxRate.id)

            if (existingBreakdown) {
                existingBreakdown.taxable_amount += item.subtotal
                existingBreakdown.tax_amount += this.calculateTaxAmount(item.subtotal, taxRate)
            } else {
                taxBreakdowns.set(taxRate.id, {
                    tax_rate_id: taxRate.id,
                    tax_rate_name: taxRate.name,
                    rate: taxRate.rate,
                    taxable_amount: item.subtotal,
                    tax_amount: this.calculateTaxAmount(item.subtotal, taxRate)
                })
            }

            totalSubtotal += item.subtotal
        })

        const totalTaxAmount = Array.from(taxBreakdowns.values())
            .reduce((sum, breakdown) => sum + breakdown.tax_amount, 0)

        return {
            subtotal: totalSubtotal,
            tax_amount: totalTaxAmount,
            total: totalSubtotal + totalTaxAmount,
            tax_breakdown: Array.from(taxBreakdowns.values())
        }
    }

    /**
     * Get the tax rate for a category
     */
    private getTaxRateForCategory(categoryId?: string) {
        if (this.currentConfig.tax_mode === 'fixed') {
            // Fixed mode: use the default tax rate
            return this.currentConfig.tax_rates.find(rate => rate.is_default) ||
                this.currentConfig.tax_rates[0]
        }

        if (this.currentConfig.tax_mode === 'category_based' && categoryId) {
            // Category-based mode: find the category and its tax rate
            const category = this.currentConfig.tax_categories?.find(cat => cat.id === categoryId)
            if (category) {
                const taxRate = this.currentConfig.tax_rates.find(rate => rate.id === category.tax_rate_id)
                if (taxRate) {
                    return taxRate
                }
            }
        }

        // Fallback: default tax rate
        return this.currentConfig.tax_rates.find(rate => rate.is_default) ||
            this.currentConfig.tax_rates[0]
    }

    /**
     * Calculate tax amount for a given amount and rate
     */
    private calculateTaxAmount(amount: number, taxRate: { rate: number }): number {
        const taxAmount = amount * (taxRate.rate / 100)

        // Apply rounding based on configuration
        if (this.currentConfig.tax_inclusive) {
            // If prices already include tax, calculate tax from the gross price
            return taxAmount
        } else {
            // Net price, add tax
            return Math.round(taxAmount * 100) / 100 // Round to 2 decimal places
        }
    }

    /**
     * Get the currency symbol
     */
    getCurrencySymbol(): string {
        const currencyMap: Record<string, string> = {
            'EUR': '€',
            'USD': '$',
            'GBP': '£',
            'CAD': 'C$',
            'CHF': 'CHF',
            'CNY': '¥',
            'INR': '₹',
            'NP': 'rs'
        }
        return currencyMap[this.currentConfig.currency] || this.currentConfig.currency
    }

    /**
     * Format an amount with currency
     */
    formatAmount(amount: number): string {
        return `${amount.toFixed(2)} ${this.getCurrencySymbol()}`
    }

    /**
     * Get the tax name for the current country
     */
    getTaxName(): string {
        return this.currentConfig.tax_name
    }

    /**
     * Check if prices already include tax
     */
    isTaxInclusive(): boolean {
        return this.currentConfig.tax_inclusive
    }

    /**
     * Get all available tax rates
     */
    getAvailableTaxRates() {
        return this.currentConfig.tax_rates
    }

    /**
     * Get all tax categories
     */
    getTaxCategories() {
        return this.currentConfig.tax_categories || []
    }

    /**
     * Get the current tax mode
     */
    getTaxMode(): TaxMode {
        return this.currentConfig.tax_mode
    }
}

// Singleton instance
export const taxService = TaxService.getInstance()
