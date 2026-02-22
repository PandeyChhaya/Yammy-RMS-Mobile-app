// types/tax.ts

export type CountryCode = 'NP'

export type TaxMode = 'fixed' | 'category_based' | 'product_based'

export interface TaxRate {
    id: string
    name: string
    rate: number
    description?: string
    is_default?: boolean
}

export interface TaxCategory {
    id: string
    name: string
    description?: string
    tax_rate_id: string
    color?: string
}

export interface CountryTaxConfig {
    country_code: CountryCode
    country_name: string
    tax_mode: TaxMode
    default_tax_rate: number
    tax_rates: TaxRate[]
    tax_categories?: TaxCategory[]
    currency: string
    tax_name: string
    tax_inclusive: boolean
}

export interface TaxSettings {
    selected_country: CountryCode
    countries: Record<CountryCode, CountryTaxConfig>
    auto_calculate: boolean
    show_tax_details: boolean
    round_tax: boolean
}

export interface TaxCalculation {
    subtotal: number
    tax_amount: number
    total: number
    tax_breakdown: TaxBreakdown[]
}

export interface TaxBreakdown {
    tax_rate_id: string
    tax_rate_name: string
    rate: number
    taxable_amount: number
    tax_amount: number
}

export const DEFAULT_COUNTRY_CONFIGS: Record<CountryCode, CountryTaxConfig> = {
    NP: {
        country_code: 'NP',
        country_name: 'Nepal',
        tax_mode: 'category_based',
        default_tax_rate: 13.0,
        currency: 'NPR',
        tax_name: 'VAT',
        tax_inclusive: false,
        tax_rates: [
            { id: 'np-standard', name: 'VAT Standard', rate: 13.0, is_default: true },
            { id: 'np-zero', name: 'VAT Exempt', rate: 0.0 },
        ],
        tax_categories: [
            { id: 'restaurant', name: 'Restaurant Services', tax_rate_id: 'np-standard', color: '#C41E1E' },
            { id: 'alcohol', name: 'Alcohol & Beverages', tax_rate_id: 'np-standard', color: '#D4A843' },
            { id: 'food', name: 'Food Items', tax_rate_id: 'np-zero', color: '#2E7D32' },
            { id: 'takeaway', name: 'Takeaway', tax_rate_id: 'np-standard', color: '#1565C0' },
            { id: 'soft-drinks', name: 'Soft Drinks', tax_rate_id: 'np-standard', color: '#7B1FA2' },
        ],
    },
}