/**
 * Normalizes a phone number to international format
 * @param phone - The phone number to normalize
 * @param defaultCountryCode - Default country code (default: +977 for Nepal)
 * @returns 
 */
export function normalizePhoneNumber(
    phone: string,
    defaultCountryCode: string = '+977' 
): string {
    if (!phone || !phone.trim()) {
        return ''
    }

    // Remove all spaces, dashes, dots and parentheses
    let cleaned = phone.replace(/[\s\-\.\(\)]/g, '')

    
    
    // e.g. 0981234567 → +9779812345678
    if (cleaned.startsWith('0')) {
        cleaned = defaultCountryCode + cleaned.substring(1)
    }
    // If number starts with country code digits but missing +, add it
    // e.g. 9779812345678 → +9779812345678
    else if (
        cleaned.startsWith(defaultCountryCode.substring(1)) &&
        !cleaned.startsWith(defaultCountryCode)
    ) {
        cleaned = '+' + cleaned
    }
    // If number has no + at all, add the default country code
    // e.g. 9812345678 → +9779812345678
    else if (!cleaned.startsWith('+')) {
        cleaned = defaultCountryCode + cleaned
    }

    return cleaned
}

/**
 * Validates that a phone number is in the correct format
 * @param phone - The phone number to validate
 * @returns true if valid, false if not
 */
export function isValidPhoneNumber(phone: string): boolean {
    if (!phone || !phone.trim()) {
        return false
    }

    const normalized = normalizePhoneNumber(phone)

    // Check number starts with + and contains 10-15 digits
    const phoneRegex = /^\+[1-9]\d{9,14}$/
    return phoneRegex.test(normalized)
}

/**
 * Formats a phone number for display on screen
 * @param phone - The phone number to format
 * @returns Formatted phone number string
 */
export function formatPhoneForDisplay(phone: string): string {
    if (!phone || !phone.trim()) {
        return ''
    }

    const normalized = normalizePhoneNumber(phone)

    // Format Nepali mobile numbers
    // Nepal numbers: +977 followed by 9 or 10 digits
    if (normalized.startsWith('+977')) {
        const number = normalized.substring(4) // remove +977

        // Mobile numbers (starts with 98 or 97) — 10 digits
        // e.g. +977 98-1234-5678
        if (number.length === 10) {
            return `+977 ${number.substring(0, 2)}-${number.substring(2, 6)}-${number.substring(6, 10)}`
        }

        // Landline numbers — 9 digits
        // e.g. +977 1-4567890
        if (number.length === 9) {
            return `+977 ${number.substring(0, 1)}-${number.substring(1, 9)}`
        }
    }

    // Return as-is for other international numbers
    return normalized
}

/**
 * Validates specifically that a Nepali phone number is correct
 * Nepal mobile numbers start with 97 or 98
 * @param phone - The phone number to validate
 * @returns true if valid Nepali number
 */
export function isValidNepaliPhoneNumber(phone: string): boolean {
    if (!phone || !phone.trim()) {
        return false
    }

    const normalized = normalizePhoneNumber(phone)

    // Nepal mobile: +977 followed by 98xxxxxxxx or 97xxxxxxxx
    const nepaliMobileRegex = /^\+977(97|98)\d{8}$/

    // Nepal landline: +977 followed by area code + number
    const nepaliLandlineRegex = /^\+977[1-9]\d{7,8}$/

    return nepaliMobileRegex.test(normalized) || nepaliLandlineRegex.test(normalized)
}

/**
 * Accepted phone number format examples
 */
export const PHONE_FORMAT_EXAMPLES = {
    // Nepal formats
    np: [
        '9812345678',           // mobile without country code
        '+977 98-1234-5678',    // mobile with country code formatted
        '0981234567',           // mobile with leading 0
        '+9779812345678',       // mobile full international
        '01-4567890',           // Kathmandu landline
        '+977 1-4567890'        // Kathmandu landline international
    ],
    // Other international formats still supported
    international: [
        '+1 555 123 4567',      // USA
        '+44 20 7946 0958',     // UK
        '+91 98765 43210',      // India
        '+49 30 12345678'       // Germany
    ]
}

/**
 * Nepal telecom provider prefixes for reference
 * Useful for identifying which network a number belongs to
 */
export const NEPAL_PHONE_PREFIXES = {
    ncell: ['980', '981', '982', '983', '984'],     // Ncell
    ntc: ['974', '975', '976', '977', '978', '979', // NTC Mobile
          '985', '986'],
    smartcell: ['961', '962', '963'],                // Smart Cell
    ntc_landline: {
        kathmandu: '01',
        pokhara: '061',
        chitwan: '056',
        butwal: '071',
        biratnagar: '021',
        dharan: '025',
        birgunj: '051',
    }
}