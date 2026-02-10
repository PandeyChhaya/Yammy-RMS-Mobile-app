// Types for advanced tax management system

export type CountryCode = 'NP' | 'BE' | 'DE' | 'IT' | 'ES' | 'GB' | 'US' | 'CA' | 'CH' | 'CN' | 'IN' | 'DUTY_FREE'

export type TaxMode = 'fixed' | 'category_based' | 'product_based'

export interface TaxRate {
    id: string
    name: string
    rate: number // Percentage (e.g., 20.0 for 20%)
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
    tax_name: string // "VAT", "GST", "Sales Tax", etc.
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

// Default configuration for different countries
export const DEFAULT_COUNTRY_CONFIGS: Record<CountryCode, CountryTaxConfig> = {
    NP: {
        country_code: 'NP',
        country_name: 'Nepal',
        tax_mode: 'fixed',
        default_tax_rate: 13.0,
        currency: 'NPR',
        tax_name: 'VAT',
        tax_inclusive: false,
       tax_rates: [
        { id: 'np-standard', name: 'Standard VAT', rate: 13.0, is_default: true },
        { id: 'np-zero', name: 'Zero VAT', rate: 0.0 }
    ],
    tax_categories: [
        { id: 'restaurant', name: 'Restaurant Services', tax_rate_id: 'np-standard', color: '#3B82F6' },
        { id: 'alcohol', name: 'Alcohol', tax_rate_id: 'np-standard', color: '#EF4444' },
        { id: 'food', name: 'Food Items', tax_rate_id: 'np-standard', color: '#10B981' },
        { id: 'takeaway', name: 'Takeaway', tax_rate_id: 'np-standard', color: '#F59E0B' }
    ]
},
    BE: {
        country_code: 'BE',
        country_name: 'Belgium',
        tax_mode: 'category_based',
        default_tax_rate: 21.0,
        currency: 'EUR',
        tax_name: 'VAT',
        tax_inclusive: false,
        tax_rates: [
            { id: 'be-standard', name: 'Standard VAT', rate: 21.0, is_default: true },
            { id: 'be-reduced', name: 'Reduced VAT', rate: 12.0 },
            { id: 'be-super-reduced', name: 'Super Reduced VAT', rate: 6.0 },
            { id: 'be-zero', name: 'Zero VAT', rate: 0.0 }
        ],
        tax_categories: [
            { id: 'restaurant', name: 'Restaurant', tax_rate_id: 'be-standard', color: '#3B82F6' },
            { id: 'alcohol', name: 'Alcohol', tax_rate_id: 'be-standard', color: '#EF4444' },
            { id: 'soft-drinks', name: 'Soft Drinks', tax_rate_id: 'be-reduced', color: '#10B981' }
        ]
    },
    DE: {
        country_code: 'DE',
        country_name: 'Germany',
        tax_mode: 'category_based',
        default_tax_rate: 19.0,
        currency: 'EUR',
        tax_name: 'VAT',
        tax_inclusive: false,
        tax_rates: [
            { id: 'de-standard', name: 'Standard VAT', rate: 19.0, is_default: true },
            { id: 'de-reduced', name: 'Reduced VAT', rate: 7.0 },
            { id: 'de-zero', name: 'Zero VAT', rate: 0.0 }
        ],
        tax_categories: [
            { id: 'restaurant', name: 'Restaurant', tax_rate_id: 'de-standard', color: '#3B82F6' },
            { id: 'alcohol', name: 'Alcohol', tax_rate_id: 'de-standard', color: '#EF4444' },
            { id: 'food', name: 'Food', tax_rate_id: 'de-reduced', color: '#10B981' }
        ]
    },
    US: {
        country_code: 'US',
        country_name: 'United States',
        tax_mode: 'fixed',
        default_tax_rate: 8.5,
        currency: 'USD',
        tax_name: 'Sales Tax',
        tax_inclusive: false,
        tax_rates: [
            { id: 'us-standard', name: 'Sales Tax', rate: 8.5, is_default: true }
        ]
    },
    GB: {
        country_code: 'GB',
        country_name: 'United Kingdom',
        tax_mode: 'category_based',
        default_tax_rate: 20.0,
        currency: 'GBP',
        tax_name: 'VAT',
        tax_inclusive: false,
        tax_rates: [
            { id: 'gb-standard', name: 'Standard VAT', rate: 20.0, is_default: true },
            { id: 'gb-reduced', name: 'Reduced VAT', rate: 5.0 },
            { id: 'gb-zero', name: 'Zero VAT', rate: 0.0 }
        ],
        tax_categories: [
            { id: 'restaurant', name: 'Restaurant', tax_rate_id: 'gb-standard', color: '#3B82F6' },
            { id: 'alcohol', name: 'Alcohol', tax_rate_id: 'gb-standard', color: '#EF4444' },
            { id: 'takeaway', name: 'Takeaway', tax_rate_id: 'gb-standard', color: '#F59E0B' }
        ]
    },
    CA: {
        country_code: 'CA',
        country_name: 'Canada',
        tax_mode: 'category_based',
        default_tax_rate: 13.0,
        currency: 'CAD',
        tax_name: 'GST/HST',
        tax_inclusive: false,
        tax_rates: [
            { id: 'ca-gst', name: 'GST', rate: 5.0 },
            { id: 'ca-hst', name: 'HST', rate: 13.0, is_default: true },
            { id: 'ca-pst', name: 'PST', rate: 8.0 }
        ],
        tax_categories: [
            { id: 'restaurant', name: 'Restaurant', tax_rate_id: 'ca-hst', color: '#3B82F6' },
            { id: 'alcohol', name: 'Alcohol', tax_rate_id: 'ca-hst', color: '#EF4444' },
            { id: 'takeaway', name: 'Takeaway', tax_rate_id: 'ca-gst', color: '#F59E0B' }
        ]
    },
    CH: {
        country_code: 'CH',
        country_name: 'Switzerland',
        tax_mode: 'fixed',
        default_tax_rate: 7.7,
        currency: 'CHF',
        tax_name: 'VAT',
        tax_inclusive: false,
        tax_rates: [
            { id: 'ch-standard', name: 'Standard VAT', rate: 7.7, is_default: true },
            { id: 'ch-reduced', name: 'Reduced VAT', rate: 2.5 },
            { id: 'ch-special', name: 'Special VAT', rate: 3.7 }
        ]
    },
    IT: {
        country_code: 'IT',
        country_name: 'Italy',
        tax_mode: 'category_based',
        default_tax_rate: 22.0,
        currency: 'EUR',
        tax_name: 'VAT',
        tax_inclusive: false,
        tax_rates: [
            { id: 'it-standard', name: 'Standard VAT', rate: 22.0, is_default: true },
            { id: 'it-reduced', name: 'Reduced VAT', rate: 10.0 },
            { id: 'it-super-reduced', name: 'Super Reduced VAT', rate: 4.0 },
            { id: 'it-zero', name: 'Zero VAT', rate: 0.0 }
        ],
        tax_categories: [
            { id: 'restaurant', name: 'Restaurant', tax_rate_id: 'it-standard', color: '#3B82F6' },
            { id: 'alcohol', name: 'Alcohol', tax_rate_id: 'it-standard', color: '#EF4444' },
            { id: 'food', name: 'Food', tax_rate_id: 'it-reduced', color: '#10B981' }
        ]
    },
    ES: {
        country_code: 'ES',
        country_name: 'Spain',
        tax_mode: 'category_based',
        default_tax_rate: 21.0,
        currency: 'EUR',
        tax_name: 'VAT',
        tax_inclusive: false,
        tax_rates: [
            { id: 'es-standard', name: 'General VAT', rate: 21.0, is_default: true },
            { id: 'es-reduced', name: 'Reduced VAT', rate: 10.0 },
            { id: 'es-super-reduced', name: 'Super Reduced VAT', rate: 4.0 },
            { id: 'es-zero', name: 'Zero VAT', rate: 0.0 }
        ],
        tax_categories: [
            { id: 'restaurant', name: 'Restaurant', tax_rate_id: 'es-standard', color: '#3B82F6' },
            { id: 'alcohol', name: 'Alcohol', tax_rate_id: 'es-standard', color: '#EF4444' },
            { id: 'food', name: 'Food', tax_rate_id: 'es-reduced', color: '#10B981' }
        ]
    },
    CN: {
        country_code: 'CN',
        country_name: 'China',
        tax_mode: 'category_based',
        default_tax_rate: 13.0,
        currency: 'CNY',
        tax_name: 'VAT',
        tax_inclusive: false,
        tax_rates: [
            { id: 'cn-standard', name: 'Standard VAT', rate: 13.0, is_default: true },
            { id: 'cn-reduced', name: 'Reduced VAT', rate: 9.0 },
            { id: 'cn-super-reduced', name: 'Super Reduced VAT', rate: 6.0 },
            { id: 'cn-zero', name: 'Zero VAT', rate: 0.0 }
        ],
        tax_categories: [
            { id: 'restaurant', name: 'Restaurant Services', tax_rate_id: 'cn-standard', color: '#3B82F6' },
            { id: 'alcohol', name: 'Alcohol', tax_rate_id: 'cn-standard', color: '#EF4444' },
            { id: 'food', name: 'Food', tax_rate_id: 'cn-reduced', color: '#10B981' },
            { id: 'takeaway', name: 'Takeaway', tax_rate_id: 'cn-reduced', color: '#F59E0B' },
            { id: 'beverages', name: 'Beverages', tax_rate_id: 'cn-reduced', color: '#06B6D4' }
        ]
    },
    IN: {
        country_code: 'IN',
        country_name: 'India',
        tax_mode: 'category_based',
        default_tax_rate: 18.0,
        currency: 'INR',
        tax_name: 'GST',
        tax_inclusive: false,
        tax_rates: [
            { id: 'in-standard', name: 'Standard GST', rate: 18.0, is_default: true },
            { id: 'in-reduced', name: 'Reduced GST', rate: 12.0 },
            { id: 'in-super-reduced', name: 'Super Reduced GST', rate: 5.0 },
            { id: 'in-zero', name: 'Zero GST', rate: 0.0 }
        ],
        tax_categories: [
            { id: 'restaurant', name: 'Restaurant Services', tax_rate_id: 'in-standard', color: '#3B82F6' },
            { id: 'alcohol', name: 'Alcohol', tax_rate_id: 'in-standard', color: '#EF4444' },
            { id: 'food', name: 'Food Items', tax_rate_id: 'in-reduced', color: '#10B981' },
            { id: 'takeaway', name: 'Takeaway', tax_rate_id: 'in-reduced', color: '#F59E0B' },
            { id: 'beverages', name: 'Beverages', tax_rate_id: 'in-reduced', color: '#06B6D4' }
        ]
    },
    DUTY_FREE: {
        country_code: 'DUTY_FREE',
        country_name: 'Duty Free (Airport)',
        tax_mode: 'fixed',
        default_tax_rate: 0.0,
        currency: 'EUR',
        tax_name: 'No Tax',
        tax_inclusive: false,
        tax_rates: [
            { id: 'duty-free-zero', name: 'Duty Free', rate: 0.0, is_default: true }
        ],
        tax_categories: [
            { id: 'perfumes', name: 'Perfumes & Cosmetics', tax_rate_id: 'duty-free-zero', color: '#8B5CF6' },
            { id: 'alcohol', name: 'Alcohol & Spirits', tax_rate_id: 'duty-free-zero', color: '#EF4444' },
            { id: 'tobacco', name: 'Tobacco', tax_rate_id: 'duty-free-zero', color: '#6B7280' },
            { id: 'electronics', name: 'Electronics', tax_rate_id: 'duty-free-zero', color: '#3B82F6' },
            { id: 'fashion', name: 'Fashion & Accessories', tax_rate_id: 'duty-free-zero', color: '#EC4899' },
            { id: 'food', name: 'Food', tax_rate_id: 'duty-free-zero', color: '#10B981' }
        ]
    }
}