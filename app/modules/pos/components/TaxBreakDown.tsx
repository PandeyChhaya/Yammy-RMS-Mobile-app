import { StyleSheet, Text, View } from 'react-native'
import { TaxBreakdown as TaxBreakdownType } from '../../../../shared/types/tax'

interface TaxBreakdownProps {
    breakdowns: TaxBreakdownType[]
    showDetails?: boolean
    className?: string
}

export default function TaxBreakdown({ breakdowns, showDetails = false }: TaxBreakdownProps) {
    if (breakdowns.length === 0) {
        return null
    }

    const totalTax = breakdowns.reduce((sum, breakdown) => sum + breakdown.tax_amount, 0)

    return (
        <View style={styles.container}>
            {showDetails && breakdowns.length > 1 ? (
                <View style={styles.detailedView}>
                    {breakdowns.map((breakdown) => (
                        <View key={breakdown.tax_rate_id} style={styles.breakdownRow}>
                            <Text style={styles.breakdownLabel}>
                                {breakdown.tax_rate_name} ({breakdown.rate}%)
                            </Text>
                            <Text style={styles.breakdownAmount}>
                                {breakdown.tax_amount.toFixed(2)} €
                            </Text>
                        </View>
                    ))}
                    <View style={styles.totalSection}>
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>Total VAT</Text>
                            <Text style={styles.totalAmount}>{totalTax.toFixed(2)} €</Text>
                        </View>
                    </View>
                </View>
            ) : (
                <View style={styles.simpleRow}>
                    <Text style={styles.simpleLabel}>
                        {breakdowns[0].tax_rate_name} ({breakdowns[0].rate}%)
                    </Text>
                    <Text style={styles.simpleAmount}>{totalTax.toFixed(2)} €</Text>
                </View>
            )}
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        marginVertical: 8,
    },
    detailedView: {
        gap: 4,
    },
    breakdownRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    breakdownLabel: {
        fontSize: 10,
        color: '#4B5563',
    },
    breakdownAmount: {
        fontSize: 10,
        color: '#4B5563',
    },
    totalSection: {
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        paddingTop: 4,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    totalLabel: {
        fontSize: 12,
        fontWeight: '500',
        color: '#111827',
    },
    totalAmount: {
        fontSize: 12,
        fontWeight: '500',
        color: '#111827',
    },
    simpleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    simpleLabel: {
        fontSize: 12,
        color: '#4B5563',
    },
    simpleAmount: {
        fontSize: 12,
        color: '#4B5563',
    },
})