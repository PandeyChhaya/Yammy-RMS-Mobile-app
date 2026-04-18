export const TAX = {
  Nepal: { name: 'VAT', rate: 13, symbol: 'NPR' },
  India: { name: 'GST', rate: 18, symbol: '₹' },
}

export const calculateTax = (amount: number, country: 'Nepal' | 'India' = 'Nepal') => {
  const tax = amount * (TAX[country].rate / 100)
  return {
    subtotal:  Math.round(amount * 100) / 100,
    tax:       Math.round(tax * 100) / 100,
    total:     Math.round((amount + tax) * 100) / 100,
    tax_name:  TAX[country].name,
    rate:      TAX[country].rate,
    symbol:    TAX[country].symbol,
  }
}