export type CountryCode = 'IND' | 'NP'
export type TaxMode= 'fixed' | 'category_based' |'menu-item_based'

export interface TaxRate{
    id: string,
    name: string
    rate: number
    description?: string
    is_default?: boolean
}
export interface TaxCategory{
    id: string
    name: string
    description?: string
    tax_rate_id?: string
    color?: string
}
export interface CountryTaxConfig{
    country_code: CountryCode
    country_name: string
    tax_mode: TaxMode
    default_tax_rate: number //number = percentage, eg.: 13= 13%
    tax_rates: TaxRate[]
    tax_categories?: TaxCategory[]
    currency: string
    tax_name: string //'VAT' OR 'GST'
    tax_inclusive: boolean
} 
export interface TaxSettings{
    selected_country: CountryCode
    countries: Record<CountryCode, CountryTaxConfig>
    auto_calculate: boolean
    show_tax_details: boolean
    round_tax: boolean
}
export interface TaxCalculation{
    subtotal: number
    tax_amount: number
    total: number
    tax_breakdown: TaxBreakdown[]
}
export interface TaxBreakdown{
    tax_rate_id: string
    tax_rate_name: string
    rate: number
    taxable_amount: number
    tax_amount: number
}

export const DEFAULT_COUNTRY_CONFIGS:  Record<CountryCode, CountryTaxConfig>={
    IND: {
        country_code: 'IND',
        country_name: 'India',
        tax_mode: 'category_based',
        default_tax_rate: 18.00,
        currency: 'INR',
        tax_name:'GST',
        tax_inclusive: false,
         tax_rates: [
            { id: 'in-standard', name: 'GST Standard', rate: 18.0, is_default: true },
            { id: 'in-reduced', name: 'GST Reduced', rate: 12.0 },
            { id: 'in-super-reduced', name: 'GST Super Reduced', rate: 5.0 },
            { id: 'in-zero', name: 'GST Zero', rate: 0.0 }
        ],
        tax_categories: [
            { id: 'restaurant', name: 'Restaurant Services', tax_rate_id: 'in-standard', color: '#3B82F6' },
            { id: 'alcohol', name: 'Alcohol', tax_rate_id: 'in-standard', color: '#EF4444' },
            { id: 'food', name: 'Food Items', tax_rate_id: 'in-reduced', color: '#10B981' },
            { id: 'takeaway', name: 'Takeaway', tax_rate_id: 'in-reduced', color: '#F59E0B' },
            { id: 'beverages', name: 'Beverages', tax_rate_id: 'in-reduced', color: '#06B6D4' }
        ]

    },

    NP: {
        country_code: 'NP',
        country_name: 'Nepal',
        tax_mode: 'category_based',
        default_tax_rate: 13.00,
        currency: 'NPR',
        tax_name:'VAT',
        tax_inclusive: false,
         tax_rates: [
            { id: 'np-standard', name: 'VAT Standard', rate: 13.0, is_default: true },
            { id: 'np-reduced', name: 'VAT Reduced', rate: 7.0 },
            { id: 'np-super-reduced', name: 'VAT Super Reduced', rate: 2.0 },
            { id: 'np-zero', name: 'VAT Zero', rate: 0.0 }
        ],
        tax_categories: [
            { id: 'restaurant', name: 'Restaurant Services', tax_rate_id: 'np-standard', color: '#3B82F6' },
            { id: 'alcohol', name: 'Alcohol', tax_rate_id: 'np-standard', color: '#EF4444' },
            { id: 'food', name: 'Food Items', tax_rate_id: 'np-reduced', color: '#10B981' },
            { id: 'takeaway', name: 'Takeaway', tax_rate_id: 'np-reduced', color: '#F59E0B' },
            { id: 'beverages', name: 'Beverages', tax_rate_id: 'np-reduced', color: '#06B6D4' }
        ]

    }
}