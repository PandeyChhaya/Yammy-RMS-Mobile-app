import { Receipt, Table as TableIcon } from 'lucide-react-native'
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { TableData } from '../types/tables'
import TableCard from './TableCard'

interface TablesSectionProps {
    tables: TableData[]
    selectedTable: TableData | null
    onTableSelect: (table: TableData | null) => void
    compact?: boolean
}

export default function TablesSection({
    tables,
    selectedTable,
    onTableSelect,
}: TablesSectionProps) {
    const statusConfig = {
        free: {
            status: 'free' as const,
            label: 'Free',
            bgColor: '#D1FAE5',
            textColor: '#065F46',
            iconColor: '#059669',
            icon: TableIcon
        },
        occupied: {
            status: 'occupied' as const,
            label: 'Occupied',
            bgColor: '#FFEDD5',
            textColor: '#9A3412',
            iconColor: '#EA580C',
            icon: TableIcon
        },
        reserved: {
            status: 'reserved' as const,
            label: 'Reserved',
            bgColor: '#FEE2E2',
            textColor: '#991B1B',
            iconColor: '#DC2626',
            icon: TableIcon
        },
        cleaning: {
            status: 'cleaning' as const,
            label: 'Cleaning',
            bgColor: '#DBEAFE',
            textColor: '#1E40AF',
            iconColor: '#3B82F6',
            icon: TableIcon
        }
    }

    return (
        <View style={styles.container}>
            <View style={styles.directSaleContainer}>
                <TouchableOpacity
                    onPress={() => onTableSelect(null)}
                    style={[
                        styles.directSaleButton,
                        !selectedTable ? styles.directSaleButtonSelected : styles.directSaleButtonDefault
                    ]}
                >
                    <Receipt size={16} color={!selectedTable ? '#2563EB' : '#4B5563'} />
                    <Text style={[
                        styles.directSaleText,
                        !selectedTable ? styles.directSaleTextSelected : styles.directSaleTextDefault
                    ]}>
                        Direct sale
                    </Text>
                </TouchableOpacity>
            </View>

            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.tablesScrollContent}
            >
                {tables.map((table: TableData) => (
                    <View key={table.id} style={styles.tableCardWrapper}>
                        <TableCard
                            table={table}
                            isSelected={selectedTable?.id === table.id}
                            onSelect={onTableSelect}
                            statusConfig={statusConfig}
                        />
                    </View>
                ))}
            </ScrollView>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        padding: 12,
    },
    directSaleContainer: {
        marginBottom: 8,
    },
    directSaleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingHorizontal: 6,
        paddingVertical: 6,
        borderRadius: 8,
        borderWidth: 2,
    },
    directSaleButtonSelected: {
        borderColor: '#3B82F6',
        backgroundColor: '#EFF6FF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    directSaleButtonDefault: {
        borderColor: '#D1D5DB',
        backgroundColor: '#F9FAFB',
    },
    directSaleText: {
        fontSize: 12,
        fontWeight: '500',
        marginLeft: 6,
    },
    directSaleTextSelected: {
        color: '#2563EB',
    },
    directSaleTextDefault: {
        color: '#4B5563',
    },
    tablesScrollContent: {
        gap: 12,
        paddingRight: 12,
    },
    tableCardWrapper: {
        marginRight: 4,
    },
})