import { View, StyleSheet } from 'react-native'
import SimpleSMSChat from './SimpleSMSChat'

interface SMSChatSectionProps {
    compact?: boolean
    selectedTable?: {
        id: string
        name: string
        customerPhone?: string
        customerName?: string
    }
    currentOrder?: {
        id: string
        total: number
        items: Array<{
            name: string
            quantity: number
            price: number
        }>
    }
    onPaymentComplete?: () => void
    shouldGenerateTicket?: boolean
}

export default function SMSChatSection({
    compact = false,
    selectedTable,
    currentOrder,
    shouldGenerateTicket = false
}: SMSChatSectionProps) {
    return (
        <View style={styles.container}>
            <View style={compact ? styles.contentCompact : styles.content}>
                <SimpleSMSChat
                    tableId={selectedTable?.id}
                    tableName={selectedTable?.name}
                    customerPhone={selectedTable?.customerPhone}
                    customerName={selectedTable?.customerName}
                    orderId={currentOrder?.id}
                    orderTotal={currentOrder?.total}
                    orderItems={currentOrder?.items}
                    shouldGenerateTicket={shouldGenerateTicket}
                />
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    content: {
        flex: 1,
        padding: 16,
    },
    contentCompact: {
        flex: 1,
        padding: 8,
    },
})