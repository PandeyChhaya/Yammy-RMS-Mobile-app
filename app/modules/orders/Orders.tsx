import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CheckCircle, ChefHat, Clock, Package, Trash2 } from 'lucide-react-native'
import { useState } from 'react'
import {
    ActivityIndicator,
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native'
import { Order, OrderStatus } from '../../../shared/types/orders'
import { ordersService } from './services/orderService'

const Colors = {
    bg: '#FEF1A8',
    card: '#FFFFFF',
    brand: '#C41E1E',
    text: '#1A1A1A',
    textSub: '#5C5436',
    border: '#E8D88A',
    pending: '#EAB308',
    kitchen: '#3B82F6',
    ready: '#22C55E',
    completed: '#6B7280',
}

export default function Orders() {
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
    const queryClient = useQueryClient()

    const { data: orders = [], isLoading } = useQuery<Order[]>({
        queryKey: ['all-orders'],
        queryFn: () => ordersService.getAllOrders(),
        refetchInterval: 5000,
    })

    const updateStatusMutation = useMutation({
        mutationFn: ({ orderId, status }: { orderId: string; status: OrderStatus }) =>
            ordersService.updateOrderStatus(orderId, status),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['all-orders'] }),
    })

    const deleteOrderMutation = useMutation({
        mutationFn: (orderId: string) => ordersService.deleteOrder(orderId),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['all-orders'] }),
    })

    const getElapsedTime = (createdAt: string) => {
        const mins = Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000)
        return mins < 60 ? `${mins}m` : `${Math.floor(mins / 60)}h ${mins % 60}m`
    }

    const getStatusColor = (status: OrderStatus) => {
        switch (status) {
            case 'pending': return Colors.pending
            case 'in_kitchen': return Colors.kitchen
            case 'ready': return Colors.ready
            case 'completed': return Colors.completed
        }
    }

    const getStatusLabel = (status: OrderStatus) => {
        switch (status) {
            case 'pending': return 'Pending'
            case 'in_kitchen': return 'Cooking'
            case 'ready': return 'Ready'
            case 'completed': return 'Done'
        }
    }

    const getNextStatus = (status: OrderStatus): OrderStatus | null => {
        switch (status) {
            case 'pending': return 'in_kitchen'
            case 'in_kitchen': return 'ready'
            case 'ready': return 'completed'
            default: return null
        }
    }

    const activeOrders = orders.filter(o => o.status !== 'completed')
    const completedOrders = orders.filter(o => o.status === 'completed')

    if (isLoading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={Colors.brand} />
            </View>
        )
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerRow}>
                    <ChefHat size={24} color="#FFF" />
                    <Text style={styles.headerTitle}>Kitchen Orders</Text>
                </View>
                <View style={styles.stats}>
                    <View style={styles.stat}>
                        <Text style={styles.statLabel}>Active</Text>
                        <Text style={styles.statValue}>{activeOrders.length}</Text>
                    </View>
                    <View style={styles.stat}>
                        <Text style={styles.statLabel}>Done</Text>
                        <Text style={styles.statValue}>{completedOrders.length}</Text>
                    </View>
                </View>
            </View>

            {/* Active Orders */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Active Orders</Text>
                <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                    {activeOrders.length === 0 ? (
                        <View style={styles.empty}>
                            <Package size={48} color="#CCC" />
                            <Text style={styles.emptyText}>No active orders</Text>
                        </View>
                    ) : (
                        activeOrders.map(order => {
                            const elapsed = getElapsedTime(order.created_at)
                            const isUrgent = parseInt(elapsed) > 20

                            return (
                                <TouchableOpacity
                                    key={order.id}
                                    style={[
                                        styles.orderCard,
                                        isUrgent && styles.orderCardUrgent,
                                        { borderLeftColor: getStatusColor(order.status) }
                                    ]}
                                    onPress={() => setSelectedOrder(order)}
                                >
                                    <View style={styles.orderHeader}>
                                        <View style={styles.orderHeaderLeft}>
                                            <Text style={styles.orderNumber}>#{order.order_number}</Text>
                                            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
                                                <Text style={styles.statusText}>{getStatusLabel(order.status)}</Text>
                                            </View>
                                        </View>
                                        <View style={styles.orderHeaderRight}>
                                            <Clock size={14} color={isUrgent ? Colors.brand : '#999'} />
                                            <Text style={[styles.timeText, isUrgent && styles.timeUrgent]}>{elapsed}</Text>
                                        </View>
                                    </View>

                                    <Text style={styles.tableName}>{order.table_name}</Text>

                                    <View style={styles.itemsPreview}>
                                        {order.items.slice(0, 2).map((item, i) => (
                                            <Text key={i} style={styles.itemText}>
                                                • {item.quantity}x {item.product_name}
                                            </Text>
                                        ))}
                                        {order.items.length > 2 && (
                                            <Text style={styles.itemMore}>+{order.items.length - 2} more items</Text>
                                        )}
                                    </View>

                                    <View style={styles.orderFooter}>
                                        <Text style={styles.orderTotal}>NPR {order.total_amount.toFixed(2)}</Text>
                                        <View style={styles.actions}>
                                            {getNextStatus(order.status) && (
                                                <TouchableOpacity
                                                    style={[styles.actionBtn, { backgroundColor: getStatusColor(getNextStatus(order.status)!) }]}
                                                    onPress={() => updateStatusMutation.mutate({
                                                        orderId: order.id,
                                                        status: getNextStatus(order.status)!
                                                    })}
                                                >
                                                    <CheckCircle size={12} color="#FFF" />
                                                    <Text style={styles.actionText}>
                                                        {order.status === 'pending' ? 'Start' : order.status === 'in_kitchen' ? 'Ready' : 'Done'}
                                                    </Text>
                                                </TouchableOpacity>
                                            )}
                                            <TouchableOpacity
                                                style={[styles.actionBtn, { backgroundColor: '#EF4444' }]}
                                                onPress={() => {
                                                    Alert.alert('Delete Order', 'Delete this order?', [
                                                        { text: 'Cancel', style: 'cancel' },
                                                        { text: 'Delete', style: 'destructive', onPress: () => deleteOrderMutation.mutate(order.id) }
                                                    ])
                                                }}
                                            >
                                                <Trash2 size={12} color="#FFF" />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            )
                        })
                    )}
                </ScrollView>
            </View>

            {/* Completed Orders (Collapsible) */}
            {completedOrders.length > 0 && (
                <View style={styles.completedSection}>
                    <Text style={styles.completedTitle}>Completed ({completedOrders.length})</Text>
                </View>
            )}

            {/* Order Details Modal */}
            <Modal visible={!!selectedOrder} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Order #{selectedOrder?.order_number}</Text>
                            <TouchableOpacity onPress={() => setSelectedOrder(null)}>
                                <Text style={styles.modalClose}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        {selectedOrder && (
                            <ScrollView style={styles.modalScroll}>
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Table</Text>
                                    <Text style={styles.detailValue}>{selectedOrder.table_name}</Text>
                                </View>
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Status</Text>
                                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedOrder.status) }]}>
                                        <Text style={styles.statusText}>{getStatusLabel(selectedOrder.status)}</Text>
                                    </View>
                                </View>
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Time</Text>
                                    <Text style={styles.detailValue}>{getElapsedTime(selectedOrder.created_at)}</Text>
                                </View>

                                <Text style={styles.itemsTitle}>Items</Text>
                                {selectedOrder.items.map((item, i) => (
                                    <View key={i} style={styles.itemDetail}>
                                        <Text style={styles.itemDetailName}>{item.quantity}x {item.product_name}</Text>
                                        <Text style={styles.itemDetailPrice}>NPR {item.total_price.toFixed(2)}</Text>
                                    </View>
                                ))}

                                <View style={styles.totalRow}>
                                    <Text style={styles.totalLabel}>Total</Text>
                                    <Text style={styles.totalValue}>NPR {selectedOrder.total_amount.toFixed(2)}</Text>
                                </View>
                            </ScrollView>
                        )}
                    </View>
                </View>
            </Modal>
        </View>
    )
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bg },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    header: { backgroundColor: Colors.brand, paddingTop: 52, paddingHorizontal: 16, paddingBottom: 16 },
    headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
    headerTitle: { fontSize: 20, fontWeight: '700', color: '#FFF' },
    stats: { flexDirection: 'row', gap: 16 },
    stat: { alignItems: 'center' },
    statLabel: { fontSize: 11, color: '#FFF', opacity: 0.8 },
    statValue: { fontSize: 18, fontWeight: '700', color: '#FFF' },
    section: { flex: 1 },
    sectionTitle: { fontSize: 14, fontWeight: '600', color: Colors.text, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: Colors.border },
    scrollView: { flex: 1 },
    scrollContent: { padding: 12 },
    empty: { alignItems: 'center', paddingVertical: 60, gap: 8 },
    emptyText: { fontSize: 14, color: '#999' },
    orderCard: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
        borderLeftWidth: 4,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    orderCardUrgent: { backgroundColor: '#FEE2E2', borderColor: '#FCA5A5' },
    orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    orderHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    orderNumber: { fontSize: 16, fontWeight: '700', color: Colors.text },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
    statusText: { fontSize: 10, fontWeight: '600', color: '#FFF' },
    orderHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    timeText: { fontSize: 12, color: '#999', fontWeight: '600' },
    timeUrgent: { color: Colors.brand },
    tableName: { fontSize: 13, color: Colors.textSub, marginBottom: 8, fontWeight: '500' },
    itemsPreview: { marginBottom: 12, gap: 4 },
    itemText: { fontSize: 12, color: '#666' },
    itemMore: { fontSize: 11, color: '#999', fontStyle: 'italic' },
    orderFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F0F0F0' },
    orderTotal: { fontSize: 16, fontWeight: '700', color: Colors.brand },
    actions: { flexDirection: 'row', gap: 6 },
    actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
    actionText: { fontSize: 11, fontWeight: '600', color: '#FFF' },
    completedSection: { backgroundColor: '#F5F5F5', padding: 12, borderTopWidth: 1, borderTopColor: Colors.border },
    completedTitle: { fontSize: 13, fontWeight: '600', color: '#666' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContainer: { backgroundColor: '#FFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '80%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.border },
    modalTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
    modalClose: { fontSize: 24, color: '#999' },
    modalScroll: { padding: 16 },
    detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
    detailLabel: { fontSize: 13, color: '#666' },
    detailValue: { fontSize: 13, fontWeight: '600', color: Colors.text },
    itemsTitle: { fontSize: 14, fontWeight: '700', color: Colors.text, marginTop: 16, marginBottom: 8 },
    itemDetail: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
    itemDetailName: { fontSize: 13, color: Colors.text, flex: 1 },
    itemDetailPrice: { fontSize: 13, fontWeight: '600', color: '#666' },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 16, marginTop: 12, borderTopWidth: 2, borderTopColor: Colors.brand },
    totalLabel: { fontSize: 16, fontWeight: '700', color: Colors.text },
    totalValue: { fontSize: 18, fontWeight: '700', color: Colors.brand },
})