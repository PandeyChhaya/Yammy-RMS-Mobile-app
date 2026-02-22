// services/taxService.ts

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
        // Default to Nepal
        this.currentConfig = DEFAULT_COUNTRY_CONFIGS.NP
    }

    static getInstance(): TaxService {
        if (!TaxService.instance) {
            TaxService.instance = new TaxService()
        }
        return TaxService.instance
    }

    setCountryConfig(countryCode: CountryCode): void {
        this.currentConfig = DEFAULT_COUNTRY_CONFIGS[countryCode]
    }

    getCurrentConfig(): CountryTaxConfig {
        return this.currentConfig
    }

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
                tax_amount: taxAmount,
            }],
        }
    }

    calculateCartTax(items: Array<{
        subtotal: number
        category_id?: string
        product_id?: string
    }>): TaxCalculation {
        const taxBreakdowns = new Map<string, TaxBreakdown>()
        let totalSubtotal = 0

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
                    tax_amount: this.calculateTaxAmount(item.subtotal, taxRate),
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
            tax_breakdown: Array.from(taxBreakdowns.values()),
        }
    }

    private getTaxRateForCategory(categoryId?: string) {
        if (this.currentConfig.tax_mode === 'fixed') {
            return this.currentConfig.tax_rates.find(rate => rate.is_default) ||
                this.currentConfig.tax_rates[0]
        }

        if (this.currentConfig.tax_mode === 'category_based' && categoryId) {
            const category = this.currentConfig.tax_categories?.find(cat => cat.id === categoryId)
            if (category) {
                const taxRate = this.currentConfig.tax_rates.find(rate => rate.id === category.tax_rate_id)
                if (taxRate) return taxRate
            }
        }

        return this.currentConfig.tax_rates.find(rate => rate.is_default) ||
            this.currentConfig.tax_rates[0]
    }

    private calculateTaxAmount(amount: number, taxRate: { rate: number }): number {
        const taxAmount = amount * (taxRate.rate / 100)
        return Math.round(taxAmount * 100) / 100
    }

    getCurrencySymbol(): string {
        const currencyMap: Record<string, string> = {
            'NPR': 'Rs.',
        }
        return currencyMap[this.currentConfig.currency] || this.currentConfig.currency
    }

    formatAmount(amount: number): string {
        return `Rs. ${amount.toFixed(2)}`
    }

    getTaxName(): string {
        return this.currentConfig.tax_name
    }

    isTaxInclusive(): boolean {
        return this.currentConfig.tax_inclusive
    }

    getAvailableTaxRates() {
        return this.currentConfig.tax_rates
    }

    getTaxCategories() {
        return this.currentConfig.tax_categories || []
    }

    getTaxMode(): TaxMode {
        return this.currentConfig.tax_mode
    }
}

// Singleton instance
export const taxService = TaxService.getInstance()